/** Leaderboard page: standings by game and bench version, champion card, run evidence. */

import { escapeHtml, observeMotion, stillImg } from "./ui.js";
import { initRunDrawer, openRunDrawer } from "./run-drawer.js";
import {
  GAMES,
  QUEUE,
  RUNS,
  TOTALS,
  evidence,
  fmtDate,
  fmtInt,
  fmtMoney,
  fmtPct,
  hasMedia,
  modelMeta,
  standings,
} from "./bench.js";

const GAME_SLUG = { sc2: "starcraft-ii", mc: "minecraft" };
const VERSION_LABEL = { all: "All-time", v2: "Bench v2", v1: "Bench v1" };

const params = new URLSearchParams(window.location.search);
const state = {
  game: GAMES[params.get("game")] ? params.get("game") : "sc2",
  version: VERSION_LABEL[params.get("bench")] ? params.get("bench") : "all",
};

const championEl = document.getElementById("champion");
const rowsEl = document.getElementById("board-rows");
const footEl = document.getElementById("board-foot");
const promptEl = document.getElementById("prompt-line");
const gameSwitch = document.getElementById("game-switch");
const benchSwitch = document.getElementById("bench-switch");

function rank(n) {
  return `[${String(n).padStart(2, "0")}]`;
}

function latency(row) {
  if (!row.latency) return "—";
  return `${row.latency}${row.latencyBasis === "vendor-reported" ? "*" : ""}`;
}

function subline(row) {
  const parts = [row.by];
  if (row.game === "mc" && row.helpers.length) parts.push(`${row.helperRole} ${row.helpers.join(", ")}`);
  return parts.filter(Boolean).join(" · ");
}

function drawerTitle(row) {
  return row.name;
}

function syncUrl() {
  const next = new URLSearchParams();
  if (state.game !== "sc2") next.set("game", state.game);
  if (state.version !== "all") next.set("bench", state.version);
  const qs = next.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
}

function renderControls() {
  gameSwitch.querySelectorAll("button").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.game === state.game));
  });
  benchSwitch.querySelectorAll("button").forEach((btn) => {
    const versioned = state.game === "sc2";
    btn.disabled = !versioned && btn.dataset.version !== "all";
    btn.setAttribute("aria-pressed", String(btn.dataset.version === state.version));
  });
  promptEl.innerHTML = `jevbench <b>rank</b> <span>--game=${GAME_SLUG[state.game]}</span> <span>--bench=${state.version}</span>`;
}

function renderChampion(rows) {
  const top = rows[0];
  const game = GAMES[state.game];
  if (!top || !top.wins) {
    championEl.innerHTML = `
      <div class="champion-ribbon"><span class="tag tag-muted">No verified wins in this view</span></div>
      <div class="champion-name"><h2>Open</h2><p class="label">${escapeHtml(game.name)} · ${escapeHtml(VERSION_LABEL[state.version])}</p></div>
      <div class="champion-cta"><button type="button" class="btn btn-bracket" data-reset>Show all-time</button></div>`;
    return;
  }

  const cover = RUNS.filter((r) => r.game === state.game && r.modelId === top.modelId && r.won && hasMedia(r)).sort(
    (a, b) => (b.date ? b.date.getTime() : 0) - (a.date ? a.date.getTime() : 0)
  )[0];
  const still = cover && (cover.media.stills || [])[0];
  const unit = game.unit === "steps" ? "steps" : "decisions";

  championEl.innerHTML = `
    <div class="champion-ribbon"><span class="tag tag-win">★ Rank 01 · ${escapeHtml(game.name)} ★</span></div>
    <div class="champion-cover">${still ? stillImg(still.url, `${top.name} winning ${game.scenario}`) : ""}</div>
    <div class="champion-name">
      <h2>${escapeHtml(top.name)}</h2>
      <p class="label">${escapeHtml(subline(top))}</p>
    </div>
    <div class="champion-rate">
      <p class="numeral" data-count="${Math.round(top.rate * 100)}">${Math.round(top.rate * 100)}<span class="numeral-unit">%</span></p>
      <p class="label">Win rate · ${escapeHtml(game.scenario)}</p>
    </div>
    <dl class="champion-facts">
      <div><dt class="label">Record</dt><dd>${top.wins} W · ${top.runs - top.wins} L</dd></div>
      <div><dt class="label">Best streak</dt><dd>${top.streak > 1 ? `${top.streak} wins` : "—"}</dd></div>
      <div><dt class="label">Avg ${unit}</dt><dd>${fmtInt(top.avgDecisions)}</dd></div>
      <div><dt class="label">Avg cost / win</dt><dd>${fmtMoney(top.avgCost)}</dd></div>
      <div><dt class="label">Latency</dt><dd>${escapeHtml(latency(top))}</dd></div>
      <div><dt class="label">Input price</dt><dd>${escapeHtml(top.price || "—")}</dd></div>
    </dl>
    <div class="champion-cta">
      <button type="button" class="btn btn-bracket" data-open-model="${escapeHtml(top.modelId)}">View all ${top.runs} runs</button>
    </div>`;
}

function renderRows(rows) {
  const game = GAMES[state.game];
  const unit = game.unit === "steps" ? "steps" : "decisions";
  const head = `
    <div class="board-row board-row-head">
      <span>Rank</span>
      <span>Model</span>
      <span class="col-record num">Record</span>
      <span class="col-rate">Win rate</span>
      <span class="col-decisions num">${unit}</span>
      <span class="col-cost num">Cost</span>
      <span class="col-latency num">Latency</span>
      <span class="col-open"></span>
    </div>`;

  if (!rows.length) {
    rowsEl.innerHTML = `${head}<p class="board-empty">No runs on ${escapeHtml(VERSION_LABEL[state.version])} for ${escapeHtml(game.name)} yet.</p>`;
    return;
  }

  const ranked = rows
    .map(
      (r, i) => `
    <button type="button" class="board-row row-in" style="--i: ${i}; --rate: ${Math.round(r.rate * 100)}%" data-rank="${r.rank}"
      data-open-model="${escapeHtml(r.modelId)}"
      aria-label="${escapeHtml(`Rank ${r.rank}, ${r.name}, ${r.wins} wins from ${r.runs} runs. Open runs.`)}">
      <span class="col-rank">${rank(r.rank)}</span>
      <span class="col-model"><strong>${escapeHtml(r.name)}</strong><small>${escapeHtml(subline(r))}</small></span>
      <span class="col-record num">${r.wins}–${r.runs - r.wins}</span>
      <span class="col-rate">
        <b>${fmtPct(r.rate)}</b>
        <span class="rate-bar"><i></i></span>
        <small>${r.wins}–${r.runs - r.wins} · ${r.runs} ${r.runs === 1 ? "run" : "runs"}</small>
      </span>
      <span class="col-decisions num">${fmtInt(r.avgDecisions)}</span>
      <span class="col-cost num">${fmtMoney(r.avgCost)}</span>
      <span class="col-latency num">${escapeHtml(latency(r))}</span>
      <span class="col-open" aria-hidden="true">→</span>
    </button>`
    )
    .join("");

  const showQueue = state.game === "sc2" && state.version === "all";
  const queued = showQueue
    ? `
    <div class="board-divider">
      <span class="label">Queued · first scored game coming soon</span>
      <span class="tag tag-soon">Coming soon</span>
    </div>
    ${QUEUE.map(
      (q, i) => `
    <div class="board-row board-row-queued row-in" style="--i: ${rows.length + i}">
      <span class="col-rank">··</span>
      <span class="col-model"><strong>${escapeHtml(q.name)}</strong><small>${escapeHtml(q.by)}</small></span>
      <span class="col-record num">—</span>
      <span class="col-rate">Queued</span>
      <span class="col-decisions num">—</span>
      <span class="col-cost num">—</span>
      <span class="col-latency num">${escapeHtml(latency(q))}</span>
      <span class="col-open"></span>
    </div>`
    ).join("")}`
    : "";

  rowsEl.innerHTML = head + ranked + queued;
}

function renderFoot() {
  const unit = GAMES[state.game].unit;
  const calibration =
    state.game === "sc2" && TOTALS.calibrationRuns
      ? `<p>${fmtInt(TOTALS.calibrationRuns)} early calibration runs were played before models were tagged. They count toward runs published, not toward any model.
          <button type="button" class="inline-link link-button" data-open-calibration>View calibration runs</button></p>`
      : "";
  footEl.innerHTML = `
    <p>${unit === "steps" ? "Steps" : "Decisions"} and cost are averages per verified win. Cost covers metered runs only. * Vendor-reported latency; all other latency figures were measured during runs.</p>
    ${calibration}`;
}

function renderEvidence() {
  const root = document.getElementById("evidence-grid");
  if (!root) return;
  const shots = evidence(8);
  if (!shots.length) {
    root.closest("section").hidden = true;
    return;
  }
  root.innerHTML = shots
    .map((run, i) => {
      const still = (run.media.stills || [])[0];
      const game = GAMES[run.game];
      const name = modelMeta(run.modelId).name;
      return `
      <button type="button" class="shot reveal" style="--i: ${i % 4}" data-open-run="${escapeHtml(run.id)}"
        aria-label="${escapeHtml(`Open run: ${name}, ${game.name}`)}">
        <span class="shot-frame">
          ${still ? stillImg(still.url, `${game.name} gameplay from a verified win`) : ""}
          <span class="tag tag-win">★ Verified win</span>
          ${run.media.video ? `<span class="shot-play">▶ Full video</span>` : ""}
        </span>
        <span class="shot-body">
          <strong>${escapeHtml(name)}</strong>
          <span>${escapeHtml(game.name)} · ${fmtInt(run.decisions)} ${game.unit}${run.date ? ` · ${fmtDate(run.date)}` : ""}</span>
        </span>
      </button>`;
    })
    .join("");
}

function render() {
  if (state.game !== "sc2") state.version = "all";
  const rows = standings(state.game, { version: state.version });
  renderControls();
  renderChampion(rows);
  renderRows(rows);
  renderFoot();
  syncUrl();
  observeMotion();
}

function openModel(modelId, game = state.game, version = state.version) {
  const row = standings(game, { version }).find((r) => r.modelId === modelId);
  openRunDrawer({
    title: row ? drawerTitle(row) : modelMeta(modelId).name,
    game,
    modelId,
    version,
  });
}

gameSwitch.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-game]");
  if (!btn) return;
  state.game = btn.dataset.game;
  render();
});

benchSwitch.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-version]");
  if (!btn || btn.disabled) return;
  state.version = btn.dataset.version;
  render();
});

document.addEventListener("click", (event) => {
  const model = event.target.closest("[data-open-model]");
  if (model) {
    openModel(model.dataset.openModel);
    return;
  }
  const run = event.target.closest("[data-open-run]");
  if (run) {
    const found = RUNS.find((r) => r.id === run.dataset.openRun);
    openRunDrawer({ title: found ? modelMeta(found.modelId).name : "Run", runId: run.dataset.openRun });
    return;
  }
  if (event.target.closest("[data-open-calibration]")) {
    openRunDrawer({ title: "Calibration runs", game: "sc2", unattributed: true });
    return;
  }
  if (event.target.closest("[data-reset]")) {
    state.version = "all";
    render();
  }
});

initRunDrawer();
renderEvidence();
render();

// Deep links from the home page: ?run=<id> or ?model=<id>.
const linkedRun = params.get("run") && RUNS.find((r) => r.id === params.get("run"));
const linkedModel = params.get("model");
if (linkedRun) {
  state.game = linkedRun.game;
  render();
  openRunDrawer({ title: modelMeta(linkedRun.modelId).name, runId: linkedRun.id });
} else if (linkedModel && RUNS.some((r) => r.modelId === linkedModel)) {
  openModel(linkedModel, state.game, "all");
}
