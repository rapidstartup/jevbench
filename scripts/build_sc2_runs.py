"""Turn harness result packets into src/sc2-runs.js. Read-only on the runs tree."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(r"C:\Users\natha\code\jev-plays-starcraft-2\runs")
OUT = Path(__file__).resolve().parents[1] / "src" / "sc2-runs.js"


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def hq_text(value) -> str | None:
    if not isinstance(value, dict) or not value:
        return None
    return ", ".join(f"{name} {health:g}" for name, health in value.items())


# Run evidence served from R2 via /api/media (functions/api/media/[key].js).
# R2 key convention: sc2-<runid>-<filename>. Upload with:
#   npx wrangler r2 object put jevbench-media/sc2-<runid>-screen-capture.mp4 --file <dir>/screen-capture.mp4
MEDIA_BASE = "/api/media"
# Only eye-verified game-only stills are published (desktop captures stay local).
STILL_FILES = (
    "still-gameplay.png",
)


def r2_key(run_id: str, filename: str) -> str:
    stem, ext = filename.rsplit(".", 1)
    return f"sc2-{run_id}-{stem}.{ext}"


def guide_label(control: dict, verification: dict, run_dir: Path) -> str | None:
    if not control.get("guide_expected", True):
        return "none"
    backend = (control.get("guide_backend") or "").strip().lower()
    if not backend and (run_dir / "controller.jsonl").exists():
        # Runs recorded before guide_backend entered control.json: infer from log.
        try:
            with open(run_dir / "controller.jsonl", encoding="utf-8") as fh:
                for _ in range(400):
                    line = fh.readline()
                    if not line:
                        break
                    if '"backend": "ollama"' in line:
                        backend = "ollama"
                        break
        except OSError:
            pass
    if backend == "ollama":
        model = control.get("guide_ollama_model") or "gemma4:e2b"
        return f"{model} via ollama (local)"
    return control.get("guide_model") or verification.get("guide")


def percentile(values: list, fraction: float):
    """Nearest-rank percentile; None when there is nothing to rank."""
    if not values:
        return None
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, round(fraction * len(ordered) + 0.5) - 1))
    return ordered[index]


def decision_stats(run_dir: Path) -> dict:
    """Measured decision latency, run time and guide spend from the controller log.

    Early runs carry no log; every field stays None for them.
    """
    stats = {
        "latencyP50": None,
        "latencyP90": None,
        "durationSec": None,
        "guideCalls": None,
        "guideCost": None,
    }
    log = run_dir / "controller.jsonl"
    if not log.exists():
        return stats
    latencies = []
    guide_calls = 0
    guide_cost = 0.0
    started = finished = None
    try:
        with open(log, encoding="utf-8") as fh:
            for line in fh:
                try:
                    row = json.loads(line)
                except json.JSONDecodeError:
                    continue
                event = row.get("event")
                if event == "jev":
                    if isinstance(row.get("latency_ms"), (int, float)):
                        latencies.append(row["latency_ms"])
                elif event == "guide":
                    guide_calls += 1
                    guide_cost += row.get("cost") or 0
                elif event == "joined_game" and started is None:
                    started = row.get("time")
                elif event == "finished":
                    finished = row.get("time")
    except OSError:
        return stats
    stats["latencyP50"] = percentile(latencies, 0.5)
    stats["latencyP90"] = percentile(latencies, 0.9)
    if started is not None and finished is not None and finished > started:
        stats["durationSec"] = round(finished - started)
    stats["guideCalls"] = guide_calls
    stats["guideCost"] = round(guide_cost, 6)
    return stats


USAGE_RE = re.compile(r'"usage": \{"input_tokens": (\d+), "output_tokens": (\d+)')


def token_usage(run_dir: Path) -> dict:
    """Tokens the decision model consumed, summed over every decision in events.jsonl.

    Every route reports tokens, but only some return a bill. The site prices the
    rest from these counts at the provider's published rate.
    """
    totals = {"inputTokens": None, "outputTokens": None}
    log = run_dir / "events.jsonl"
    if not log.exists():
        return totals
    input_tokens = output_tokens = counted = 0
    try:
        with open(log, encoding="utf-8") as fh:
            for line in fh:
                if '"event": "jev"' not in line[:200]:
                    continue
                # Lines carry the full game state, so match the usage block before parsing.
                match = USAGE_RE.search(line)
                if match:
                    input_tokens += int(match.group(1))
                    output_tokens += int(match.group(2))
                    counted += 1
                    continue
                try:
                    usage = (json.loads(line).get("response") or {}).get("usage") or {}
                except json.JSONDecodeError:
                    continue
                if isinstance(usage.get("input_tokens"), int):
                    input_tokens += usage["input_tokens"]
                    output_tokens += usage.get("output_tokens") or 0
                    counted += 1
    except OSError:
        return totals
    if counted:
        totals["inputTokens"] = input_tokens
        totals["outputTokens"] = output_tokens
    return totals


def media_for(run_dir: Path, run_id: str) -> dict:
    """Local evidence manifest. URLs resolve once the files are in R2."""
    video = run_dir / "screen-capture.mp4"
    stills = [name for name in STILL_FILES if (run_dir / name).exists()]
    return {
        "hasVideo": video.exists(),
        "video": f"{MEDIA_BASE}/{r2_key(run_id, video.name)}" if video.exists() else None,
        "stills": [
            {"file": name, "url": f"{MEDIA_BASE}/{r2_key(run_id, name)}"}
            for name in stills
        ],
    }


def main() -> None:
    runs = []
    for result_path in ROOT.glob("*/result.json"):
        data = load(result_path)
        control_path = result_path.with_name("control.json")
        control = load(control_path) if control_path.exists() else {}
        verification = data.get("verification") or {}
        via = control.get("jev_via") or verification.get("jev_via") or "untagged"
        runs.append(
            {
                "id": result_path.parent.name,
                "map": data.get("map_name") or "Unknown map",
                "status": data.get("status") or "incomplete",
                "stateMode": control.get("state_mode") or "full",
                "via": via,
                "model": control.get("jev_model") or verification.get("jev_model"),
                "calls": data.get("calls"),
                "cost": data.get("cost"),
                "source": verification.get("source"),
                "heroAlive": verification.get("hero_alive"),
                "hq": hq_text(verification.get("hq_health")),
                "hqMin": verification.get("hq_min_health_observed"),
                "peakScore": verification.get("peak_score"),
                "loop": verification.get("last_loop") or verification.get("loop"),
                "objective": control.get("objective"),
                "guide": guide_label(control, verification, result_path.parent),
                "reason": data.get("reason"),
                **decision_stats(result_path.parent),
                **token_usage(result_path.parent),
                "media": media_for(result_path.parent, result_path.parent.name),
            }
        )
    runs.sort(key=lambda row: row["id"], reverse=True)
    payload = json.dumps(runs, indent=2)
    OUT.write_text(
        "/** Scored StarCraft II harness packets. Generated by scripts/build_sc2_runs.py. */\n"
        f"export const SC2_RUNS = {payload};\n\n"
        "export const BENCH = {\n"
        '  updatedLabel: "21 Sep 2026",\n'
        f"  scoredRuns: {len(runs)},\n"
        f"  verifiedWins: {sum(1 for row in runs if row['status'] == 'victory')},\n"
        "  games: 1,\n"
        '  gameNote: "StarCraft II",\n'
        "  modelsListed: 8,\n"
        "};\n",
        encoding="utf-8",
    )
    print(f"wrote {OUT} runs={len(runs)}")


if __name__ == "__main__":
    main()
