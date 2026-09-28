/**
 * JevBench data layer — the single source for every number the site shows.
 *
 * Counts, rankings and records are derived from the generated run files
 * (sc2-runs.js, minecraft-runs.js). Only display metadata is written by hand:
 * model names, pricing, the queue and the roadmap.
 *
 * No DOM access here: vite.config.js imports this at build time to stamp
 * headline numbers into the HTML.
 */

import { SC2_RUNS } from "./sc2-runs.js";
import { MC_RUNS } from "./minecraft-runs.js";

export const GAMES = {
  sc2: {
    key: "sc2",
    name: "StarCraft II",
    scenario: "Liberation Day",
    kind: "Real-time strategy",
    objective: "Destroy the Logistics Headquarters. Raynor must survive.",
    winRule:
      "A win counts when the enemy headquarters is destroyed or critically damaged with Raynor alive, or when a person confirms the victory screen.",
    unit: "decisions",
  },
  mc: {
    key: "mc",
    name: "Minecraft",
    scenario: "Ender Dragon",
    kind: "Open-world survival",
    objective: "Gear up, reach the End, defeat the Ender Dragon and take the exit portal.",
    winRule:
      "A win counts when the Ender Dragon is defeated and the player reaches the exit portal.",
    unit: "steps",
  },
};

/** Display metadata for models that have scored runs. Keyed by the model id in the run files. */
const MODELS = {
  "typesafe/jev-1.13": {
    name: "TypeSafe Jev 1.13",
    by: "TypeSafe",
    access: "Hosted API",
    latency: "70–500 ms",
    latencyBasis: "vendor-reported",
    price: "$0.042 / MTok",
  },
  "localjev-latest": {
    name: "LocalJev",
    by: "Self-hosted · qwen3.5:4b",
    access: "Self-hosted",
    latency: "1–45 s",
    latencyBasis: "measured",
    price: "Free",
  },
  "openjev-latest": {
    name: "OpenJev",
    by: "Open source",
    access: "Self-hosted",
    latency: null,
    latencyBasis: null,
    price: "Free",
  },
  "jev-latest": {
    name: "jeff",
    by: "GLiFormer · self-hosted",
    access: "Self-hosted",
    latency: "0.6–1.9 s",
    latencyBasis: "measured",
    price: "Free",
  },
};

const HELPER_LABELS = {
  "google/gemini-3.8-flash": "Gemini 3.8 Flash",
  "google/gemini-2.5-flash": "Gemini 2.5 Flash",
  "gemma4:e2b via ollama (local)": "Gemma 4 (local)",
  "openai/gpt-6-astra": "Astra (GPT-6)",
  none: "None",
};

const ROUTE_LABELS = {
  typesafe: "TypeSafe API",
  openrouter: "OpenRouter",
  openjev: "Self-hosted",
};

const VERIFIED_BY = {
  objective_building_health: "Objective destroyed",
  human_plus_signal: "Game signal + human review",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* —— formatting —— */

export function fmtInt(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Math.round(Number(n)).toLocaleString("en-US");
}

export function fmtMoney(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  const v = Number(n);
  if (v === 0) return "—";
  return v < 0.1 ? `$${v.toFixed(3)}` : `$${v.toFixed(2)}`;
}

export function fmtPct(rate) {
  if (rate == null) return "—";
  return `${Math.round(rate * 100)}%`;
}

export function fmtDate(date) {
  if (!date) return "—";
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function parseStamp(id) {
  const m = String(id).match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
}

function helperLabel(raw) {
  if (!raw) return null;
  return HELPER_LABELS[raw] || raw;
}

export function modelMeta(id) {
  return MODELS[id] || { name: id || "Unattributed", by: "", access: "", latency: null, latencyBasis: null, price: null };
}

/* —— outcomes in plain language —— */

function sc2Outcome(run) {
  if (run.status === "victory") return "Verified win";
  const reason = (run.reason || "").toLowerCase();
  if (reason.startsWith("defeat")) return "Defeated";
  if (reason.includes("time limit")) return "Time limit reached";
  if (reason.includes("budget")) return "Decision budget reached";
  if (reason.includes("decision failures")) return "Stopped after decision errors";
  return "Did not finish";
}

function mcOutcome(run) {
  if (run.status === "victory") return "Verified win";
  const s = run.status || "";
  if (s.startsWith("player_died")) return "Fell in the End";
  if (/^(stuck|stopped_stuck|stair)/.test(s)) return "Stuck before the End";
  if (/^(agent_|failed_launch)/.test(s)) return "Run interrupted";
  return "Did not finish";
}

/* —— normalised runs —— */

function normaliseSc2(run) {
  const won = run.status === "victory";
  return {
    id: run.id,
    game: "sc2",
    scenario: run.map,
    date: parseStamp(run.id),
    won,
    outcome: sc2Outcome(run),
    modelId: run.model || null,
    helper: helperLabel(run.guide),
    helperRole: "Guide",
    route: ROUTE_LABELS[run.via] || null,
    decisions: run.calls,
    cost: run.cost || null,
    version: run.stateMode === "compact" ? "v2" : "v1",
    verifiedBy: won ? VERIFIED_BY[run.source] || "Game signal" : null,
    note: run.reason || null,
    media: run.media || null,
  };
}

function normaliseMc(run) {
  const won = run.status === "victory";
  return {
    id: run.id,
    game: "mc",
    scenario: GAMES.mc.scenario,
    date: null,
    won,
    outcome: mcOutcome(run),
    modelId: run.controller || null,
    helper: helperLabel(run.planner),
    helperRole: "Planner",
    route: null,
    decisions: run.steps,
    cost: null,
    version: null,
    verifiedBy: won ? "Dragon defeated, exit portal reached" : null,
    note: run.note || null,
    media: run.media || null,
  };
}

export const RUNS = [...SC2_RUNS.map(normaliseSc2), ...MC_RUNS.map(normaliseMc)];

/** Runs credited to a model. Early calibration runs carry no model id and stay off the board. */
const RANKED_RUNS = RUNS.filter((r) => r.modelId);

export function hasMedia(run) {
  return Boolean(run.media && (run.media.video || (run.media.stills || []).length));
}

/* —— run queries (used by the run drawer) —— */

export function queryRuns({ game, modelId, runId, unattributed = false, version = "all", outcome = "all" } = {}) {
  return RUNS.filter((r) => {
    if (runId) return r.id === runId;
    if (game && r.game !== game) return false;
    if (unattributed !== !r.modelId) return false;
    if (modelId && r.modelId !== modelId) return false;
    if (version !== "all" && r.version !== version) return false;
    if (outcome === "wins" && !r.won) return false;
    if (outcome === "other" && r.won) return false;
    return true;
  });
}

/* —— standings —— */

function average(list) {
  return list.length ? list.reduce((a, b) => a + b, 0) / list.length : null;
}

function longestStreak(runs) {
  const dated = runs.filter((r) => r.date).sort((a, b) => a.date - b.date);
  let best = 0;
  let current = 0;
  for (const r of dated) {
    current = r.won ? current + 1 : 0;
    if (current > best) best = current;
  }
  return best;
}

export function standings(game, { version = "all" } = {}) {
  const groups = new Map();
  for (const run of RANKED_RUNS) {
    if (run.game !== game) continue;
    if (version !== "all" && run.version !== version) continue;
    if (!groups.has(run.modelId)) groups.set(run.modelId, []);
    groups.get(run.modelId).push(run);
  }

  const rows = [...groups.entries()].map(([modelId, runs]) => {
    const wins = runs.filter((r) => r.won);
    const winDecisions = wins.map((r) => r.decisions).filter((n) => n != null);
    const winCosts = wins.map((r) => r.cost).filter((n) => n != null && n > 0);
    const helpers = [...new Set(runs.map((r) => r.helper).filter((h) => h && h !== "None"))];
    const dates = runs.map((r) => r.date).filter(Boolean);
    return {
      game,
      modelId,
      ...modelMeta(modelId),
      helpers,
      helperRole: runs[0].helperRole,
      wins: wins.length,
      runs: runs.length,
      rate: runs.length ? wins.length / runs.length : 0,
      avgDecisions: average(winDecisions),
      bestDecisions: winDecisions.length ? Math.min(...winDecisions) : null,
      avgCost: average(winCosts),
      streak: longestStreak(runs),
      lastRun: dates.length ? new Date(Math.max(...dates)) : null,
    };
  });

  rows.sort((a, b) => b.wins - a.wins || b.rate - a.rate || b.runs - a.runs || a.name.localeCompare(b.name));
  return rows.map((row, i) => ({ ...row, rank: i + 1 }));
}

/* —— headline numbers —— */

const datedRuns = RUNS.filter((r) => r.date);
const lastRunDate = datedRuns.length ? new Date(Math.max(...datedRuns.map((r) => r.date))) : null;

export const TOTALS = {
  wins: RUNS.filter((r) => r.won).length,
  runs: RUNS.length,
  calibrationRuns: RUNS.length - RANKED_RUNS.length,
  decisions: RUNS.reduce((sum, r) => sum + (r.decisions || 0), 0),
  games: Object.keys(GAMES).length,
  models: new Set(RANKED_RUNS.map((r) => r.modelId)).size,
  lastRun: lastRunDate,
  lastRunLabel: fmtDate(lastRunDate),
};

export function gameSummary(game) {
  const runs = RUNS.filter((r) => r.game === game);
  const board = standings(game);
  return {
    ...GAMES[game],
    runs: runs.length,
    wins: runs.filter((r) => r.won).length,
    leader: board[0] || null,
    cover: runs.find((r) => r.won && hasMedia(r)) || null,
  };
}

/* —— records: the best of the data so far —— */

export function records() {
  const out = [];
  const sc2Wins = RANKED_RUNS.filter((r) => r.game === "sc2" && r.won);
  const leader = standings("sc2")[0];

  if (leader && leader.streak > 1) {
    out.push({
      key: "streak",
      label: "Longest win streak",
      value: fmtInt(leader.streak),
      unit: "in a row",
      holder: leader.name,
      context: `${GAMES.sc2.name} · ${GAMES.sc2.scenario}`,
      run: null,
    });
  }

  const fastest = sc2Wins.filter((r) => r.decisions != null).sort((a, b) => a.decisions - b.decisions)[0];
  if (fastest) {
    out.push({
      key: "fastest",
      label: "Fewest decisions to win",
      value: fmtInt(fastest.decisions),
      unit: "decisions",
      holder: modelMeta(fastest.modelId).name,
      context: `${GAMES.sc2.name} · ${fmtDate(fastest.date)}`,
      run: fastest,
    });
  }

  const cheapest = sc2Wins.filter((r) => r.cost > 0).sort((a, b) => a.cost - b.cost)[0];
  if (cheapest) {
    out.push({
      key: "cheapest",
      label: "Lowest-cost win",
      value: fmtMoney(cheapest.cost),
      unit: "total spend",
      holder: modelMeta(cheapest.modelId).name,
      context: `${fmtInt(cheapest.decisions)} decisions · ${fmtDate(cheapest.date)}`,
      run: cheapest,
    });
  }

  const dragon = RUNS.find((r) => r.game === "mc" && r.won);
  if (dragon) {
    out.push({
      key: "dragon",
      label: "Ender Dragon defeated",
      value: fmtInt(dragon.decisions),
      unit: "steps",
      holder: modelMeta(dragon.modelId).name,
      context: dragon.helper ? `Minecraft · planner ${dragon.helper}` : "Minecraft",
      run: dragon,
    });
  }

  return out;
}

/** Latest verified wins that ship with footage or stills. */
export function evidence(limit = 6) {
  const withMedia = RUNS.filter((r) => r.won && hasMedia(r));
  withMedia.sort((a, b) => {
    const video = Number(Boolean(b.media.video)) - Number(Boolean(a.media.video));
    if (video) return video;
    return (b.date ? b.date.getTime() : 0) - (a.date ? a.date.getTime() : 0);
  });
  return withMedia.slice(0, limit);
}

/** Most recent verified wins, newest first (dated runs only). */
export function latestWins(limit = 8) {
  return RUNS.filter((r) => r.won && r.date)
    .sort((a, b) => b.date - a.date)
    .slice(0, limit);
}

/* —— hand-written display content —— */

/** Models that have passed a first check and are waiting for their first scored game. */
export const QUEUE = [
  { name: "Laya", by: "Open source · local", latency: "~1.2 s", latencyBasis: "measured" },
  { name: "NanoJev", by: "Open weights · 0.6B", latency: "~1.5 s", latencyBasis: "measured" },
  { name: "Laya-MLX", by: "Apple Silicon", latency: "13 ms", latencyBasis: "vendor-reported" },
  { name: "OpenJev Browser", by: "In-browser · WebGPU", latency: null, latencyBasis: null },
  { name: "djev", by: "Hosted API", latency: null, latencyBasis: null },
];

export const ROADMAP = [
  {
    phase: "01",
    title: "On the board",
    status: "Live",
    items: [
      { name: "StarCraft II · Liberation Day", text: "Full campaign mission, scored on a verified objective." },
      { name: "Minecraft · Ender Dragon", text: "From first chest to the exit portal, with full-run video." },
      { name: "Run evidence", text: "Every run published, wins and losses, with stills and footage where captured." },
      { name: "Open harness", text: "The StarCraft II harness is open source. Run it yourself." },
    ],
  },
  {
    phase: "02",
    title: "Up next",
    status: "Coming soon",
    items: [
      { name: "More models", text: "Laya, NanoJev, djev and OpenJev Browser are queued for their first scored games." },
      { name: "Speed and cost boards", text: "Measured latency and spend per win, ranked side by side." },
      { name: "Replays on every win", text: "Video and downloadable run files attached to each verified result." },
    ],
  },
  {
    phase: "03",
    title: "On the horizon",
    status: "Planned",
    items: [
      { name: "New arenas", text: "Fortnite Creative, DOOM and Wikiracing." },
      { name: "Product benchmarks", text: "Self-healing tool calls, branch pruning, incident response and live dispatch." },
      { name: "Submit a run", text: "Bring your own model and put it on the board." },
    ],
  },
];

/* —— tokens stamped into static HTML at build time —— */

const flagship = standings("sc2")[0];

export const TOKENS = {
  wins: fmtInt(TOTALS.wins),
  runs: fmtInt(TOTALS.runs),
  decisions: fmtInt(TOTALS.decisions),
  games: fmtInt(TOTALS.games),
  models: fmtInt(TOTALS.models),
  queued: fmtInt(QUEUE.length),
  updated: TOTALS.lastRunLabel,
  topModel: flagship ? flagship.name : "",
  topRate: flagship ? String(Math.round(flagship.rate * 100)) : "0",
  topWins: flagship ? fmtInt(flagship.wins) : "0",
  topRuns: flagship ? fmtInt(flagship.runs) : "0",
};
