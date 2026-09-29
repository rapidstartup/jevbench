/** Leaderboard page: standings by wins, speed or cost, champion card, run evidence. */

import { escapeHtml, observeMotion, stillImg } from "./ui.js";
import { initRunDrawer, openRunDrawer } from "./run-drawer.js";
import {
  GAMES,
  MIN_RUNS,
  QUEUE,
  RUNS,
  TOTALS,
  evidence,
  fmtDate,
  fmtDuration,
  fmtInt,
  fmtLatency,
  fmtMoney,
  fmtPct,
  hasMedia,
  modelMeta,
  standings,
} from "./bench.js";

const GAME_SLUG = { sc2: "starcraft-ii", mc: "minecraft" };
const VERSION_LABEL = { all: "All-time", v2: "Bench v2", v1: "Bench v1" };

/** Each view fills the same five data columns; `main` is the one that stays visible on a phone. */
const VIEWS = {
  wins: {
    ribbon: "Rank 01",
    heads: { a: "Record", main: "Win rate", b: null, c: "Cost", d: "Latency" },
    unranked: null,
  },
  speed: {
    ribbon: "Fastest winner",
    heads: { a: "Win rate", main: "Latency", b: "P90", c: "Win time", d: null },
    unranked: "Not ranked · no verified win yet",
  },
  cost: {
    ribbon: "Lowest cost per win",
    heads: { a: "Win rate", main: "Cost / win", b: "Per 1k", c: "Guide", d: "List price" },
    unranked: "Not ranked · no verified win yet",
  },
};

const params = new URLSearchParams(window.location.search);
const state = {
  view: VIEWS[params.get("view")] ? params.get("view") : "wins",
  game: GAMES[params.get("game")] ? params.get("game") : "sc2",
  version: VERSION_LABEL[params.get("bench")] ? params.get("bench") : "all",
};

const championEl = document.getElementById("champion");
const rowsEl = document.getElementById("board-rows");
const footEl = document.getElementById("board-foot");
const promptEl = document.getElementById("prompt-line");
const viewSwitch = document.getElementById("view-switch");
const gameSwitch = document.getElementById("game-switch");
const benchSwitch = document.getElementById("bench-switch");

function rank(n) {
  return n == null ? "··" : `[${String(n).padStart(2, "0")}]`;
}

function unitOf(game) {
  return GAMES[game].unit === "steps" ? "steps" : "decisions";
}

/** Measured latency where the runs recorded it, otherwise the vendor's figure, marked. */
function latency(row) {
  if (row.latencyP50 != null) return fmtLatency(row.latencyP50);
  if (row.vendorLatency) return `${row.vendorLatency}*`;
  if (row.latency) return `${row.latency}${row.latencyBasis === "vendor-reported" ? "*" : ""}`;
  return "—";
}

function costPerWin(row) {
  return row.costPerWin == null ? "—" : fmtMoney(row.costPerWin);
}

/** Headline cell: figures stay large, a missing value is set small. */
function figure(text) {
  return /\d/.test(text) ? `<b>${text}</b>` : `<b class="na">${text}</b>`;
}

function costPer1k(row) {
  if (row.selfHosted) return "Free";
  return row.modelCostPer1k == null ? "—" : fmtMoney(row.modelCostPer1k);
}

function subline(row) {
  // The route leads so two rows for one model stay distinguishable when the line is cut short.
  const parts = row.route && row.route !== "Self-hosted" ? [`via ${row.route}`, row.by] : [row.by];
  if (row.game === "mc" && row.helpers.length) parts.push(`${row.helperRole} ${row.helpers.join(", ")}`);
  return escapeHtml(parts.filter(Boolean).join(" · "));
}

function provisionalFlag(row) {
  return row.provisional ? `<small class="flag">Provisional</small>` : "";
}

function record(row) {
  return `${row.wins}–${row.runs - row.wins}`;
}

/** The five data cells of a row for the current view. */
function cells(row) {
  const runsLabel = `${record(row)} · ${row.runs} ${row.runs === 1 ? "run" : "runs"}`;
  if (state.view === "speed") {
    return {
      a: fmtPct(row.rate),
      main: `${figure(latency(row))}<small class="keep">p90 ${fmtLatency(row.latencyP90)}</small>${provisionalFlag(row)}`,
      b: fmtLatency(row.latencyP90),
      c: fmtDuration(row.timeToWin),
      d: fmtInt(row.avgDecisions),
    };
  }
  if (state.view === "cost") {
    return {
      a: fmtPct(row.rate),
      main: `${figure(costPerWin(row))}<small class="keep">${runsLabel}</small>${provisionalFlag(row)}`,
      b: costPer1k(row),
      c: row.guideCostPerWin == null ? "—" : row.guideCostPerWin === 0 ? "$0" : fmtMoney(row.guideCostPerWin),
      d: escapeHtml((row.price || "—").replace(" / ", "/")),
    };
  }
  return {
    a: record(row),
    main: `
      <b>${fmtPct(row.rate)}</b>
      <span class="rate-bar" title="95% range ${fmtPct(row.rateLow)} to ${fmtPct(row.rateHigh)}"><u></u><i></i></span>
      <small>${runsLabel}</small>${provisionalFlag(row)}`,
    b: fmtInt(row.avgDecisions),
    c: fmtMoney(row.costPerWin),
    d: escapeHtml(latency(row)),
  };
}

function headRow() {
  const heads = VIEWS[state.view].heads;
  const unit = unitOf(state.game);
  return `
    <div class="board-row board-row-head">
      <span>Rank</span>
      <span>Model</span>
      <span class="col-record num">${heads.a}</span>
      <span class="col-rate">${heads.main}</span>
      <span class="col-decisions num">${heads.b || unit}</span>
      <span class="col-cost num">${heads.c}</span>
      <span class="col-latency num">${heads.d || unit}</span>
      <span class="col-open"></span>
    </div>`;
}

function syncUrl() {
  const next = new URLSearchParams();
  if (state.view !== "wins") next.set("view", state.view);
  if (state.game !== "sc2") next.set("game", state.game);
  if (state.version !== "all") next.set("bench", state.version);
  const qs = next.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
}

function renderControls() {
  viewSwitch.querySelectorAll("button").forEach((btn) => {
    btn.setAttribute("aria-selected", String(btn.dataset.view === state.view));
  });
  gameSwitch.querySelectorAll("button").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.game === state.game));
  });
  benchSwitch.querySelectorAll("button").forEach((btn) => {
    const versioned = state.game === "sc2";
    btn.disabled = !versioned && btn.dataset.version !== "all";
    btn.setAttribute("aria-pressed", String(btn.dataset.version === state.version));
  });
  promptEl.innerHTML = `jevbench <b>rank</b> <span>--by=${state.view}</span> <span>--game=${GAME_SLUG[state.game]}</span> <span>--bench=${state.version}</span>`;
}

/** The champion card's headline figure for the current view. */
function headline(top) {
  const scenario = escapeHtml(GAMES[state.game].scenario);
  if (state.view === "speed") {
    const [value, unit] = fmtLatency(top.latencyP50).split(" ");
    return {
      numeral: `<p class="numeral">${value}<span class="numeral-unit">${unit}</span></p>`,
      label: `Median decision latency${top.route ? ` · via ${escapeHtml(top.route)}` : ""}`,
    };
  }
  if (state.view === "cost") {
    return {
      numeral: `<p class="numeral">${fmtMoney(top.costPerWin)}</p>`,
      label: `Average cost per win · ${scenario}`,
    };
  }
  const pct = Math.round(top.rate * 100);
  return {
    numeral: `<p class="numeral" data-count="${pct}">${pct}<span class="numeral-unit">%</span></p>`,
    label: `Win rate · ${scenario}`,
  };
}

function renderChampion(rows) {
  const top = rows[0];
  const game = GAMES[state.game];
  if (!top || !top.wins || top.rank == null) {
    const reset =
      state.view !== "wins"
        ? `<button type="button" class="btn btn-bracket" data-view-reset>Rank by wins</button>`
        : `<button type="button" class="btn btn-bracket" data-reset>Show all-time</button>`;
    championEl.innerHTML = `
      <div class="champion-ribbon"><span class="tag tag-muted">Nothing to rank in this view yet</span></div>
      <div class="champion-name"><h2>Open</h2><p class="label">${escapeHtml(game.name)} · ${escapeHtml(VERSION_LABEL[state.version])}</p></div>
      <div class="champion-cta">${reset}</div>`;
    return;
  }

  const cover = RUNS.filter(
    (r) => r.game === state.game && r.modelId === top.modelId && r.won && hasMedia(r) && (!top.route || r.route === top.route)
  ).sort((a, b) => (b.date ? b.date.getTime() : 0) - (a.date ? a.date.getTime() : 0))[0];
  const still = cover && (cover.media.stills || [])[0];
  const figure = headline(top);

  championEl.innerHTML = `
    <div class="champion-ribbon"><span class="tag tag-win">★ ${VIEWS[state.view].ribbon} · ${escapeHtml(game.name)} ★</span></div>
    <div class="champion-cover">${still ? stillImg(still.url, `${top.name} winning ${game.scenario}`) : ""}</div>
    <div class="champion-name">
      <h2>${escapeHtml(top.name)}</h2>
      <p class="label">${subline(top)}${top.provisional ? ' · <em class="flag">Provisional</em>' : ""}</p>
    </div>
    <div class="champion-rate">
      ${figure.numeral}
      <p class="label">${figure.label}</p>
    </div>
    <dl class="champion-facts">
      <div><dt class="label">Record</dt><dd>${top.wins} W · ${top.runs - top.wins} L</dd></div>
      <div><dt class="label">Win rate</dt><dd>${fmtPct(top.rate)} <small>${fmtPct(top.rateLow)}–${fmtPct(top.rateHigh)}</small></dd></div>
      <div><dt class="label">Latency</dt><dd>${escapeHtml(latency(top))}</dd></div>
      <div><dt class="label">Cost / win</dt><dd>${costPerWin(top)}</dd></div>
      <div><dt class="label">Best streak</dt><dd>${top.streak > 1 ? `${top.streak} wins` : "—"}</dd></div>
      <div><dt class="label">Input price</dt><dd>${escapeHtml(top.price || "—")}</dd></div>
    </dl>
    <div class="champion-cta">
      <button type="button" class="btn btn-bracket" data-open-model="${escapeHtml(top.modelId)}" data-route="${escapeHtml(top.route || "")}">View ${top.runs === 1 ? "the run" : `all ${top.runs} runs`}</button>
    </div>`;
}

function renderRows(rows) {
  const game = GAMES[state.game];
  if (!rows.length) {
    rowsEl.innerHTML = `${headRow()}<p class="board-empty">No runs on ${escapeHtml(VERSION_LABEL[state.version])} for ${escapeHtml(game.name)} yet.</p>`;
    return;
  }

  const row = (r, i) => {
    const c = cells(r);
    const unranked = r.rank == null;
    return `
    <button type="button" class="board-row row-in${unranked ? " board-row-unranked" : ""}"
      style="--i: ${i}; --rate: ${Math.round(r.rate * 100)}%; --low: ${Math.round(r.rateLow * 100)}%; --high: ${Math.round(r.rateHigh * 100)}%"
      data-rank="${r.rank ?? ""}" data-open-model="${escapeHtml(r.modelId)}" data-route="${escapeHtml(r.route || "")}"
      aria-label="${escapeHtml(`${unranked ? "Not ranked" : `Rank ${r.rank}`}, ${r.name}${r.route ? ` via ${r.route}` : ""}, ${r.wins} wins from ${r.runs} runs. Open runs.`)}">
      <span class="col-rank">${rank(r.rank)}</span>
      <span class="col-model"><strong>${escapeHtml(r.name)}</strong><small>${subline(r)}</small></span>
      <span class="col-record num">${c.a}</span>
      <span class="col-rate">${c.main}</span>
      <span class="col-decisions num">${c.b}</span>
      <span class="col-cost num">${c.c}</span>
      <span class="col-latency num">${c.d}</span>
      <span class="col-open" aria-hidden="true">→</span>
    </button>`;
  };

  const ranked = rows.filter((r) => r.rank != null);
  const unranked = rows.filter((r) => r.rank == null);
  const unrankedBlock = unranked.length
    ? `<div class="board-divider"><span class="label">${VIEWS[state.view].unranked}</span></div>
       ${unranked.map((r, i) => row(r, ranked.length + i)).join("")}`
    : "";

  const showQueue = state.view === "wins" && state.game === "sc2" && state.version === "all";
  const queued = showQueue
    ? `
    <div class="board-divider board-divider-soon">
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

  rowsEl.innerHTML = headRow() + ranked.map(row).join("") + unrankedBlock + queued;
}

function renderFoot(rows) {
  const unit = unitOf(state.game) === "steps" ? "Steps" : "Decisions";
  const usesVendorFigure =
    rows.some((r) => r.latencyP50 == null && r.vendorLatency) ||
    (state.view === "wins" && state.game === "sc2" && state.version === "all");
  const vendor = usesVendorFigure ? " * Vendor-reported, not yet measured here." : "";

  const notes = {
    wins: `${unit} and cost are averages per verified win; cost is model plus guide spend.
      Latency is the median on a model's fastest route.
      The band on each bar is the 95% range, and a result from fewer than ${MIN_RUNS} runs is provisional.${vendor}`,
    speed: `Latency is the median time a model took to return a decision, measured on every decision of every run.
      P90 is the point nine in ten decisions beat. Win time is the median length of a winning game.
      Routes are ranked separately because the same model answers at different speeds on each.${vendor}`,
    cost: `Cost per win is model plus guide spend, averaged over verified wins. Per 1k is model spend per 1,000 decisions.
      OpenRouter returns a bill with every decision. The direct TypeSafe API returns token counts, priced here at its
      published rate, which reproduces OpenRouter's bills to the cent.
      Self-hosted models pay no per-decision fee, so their figure is guide spend only and excludes hardware.`,
  };

  const calibration =
    state.view === "wins" && state.game === "sc2" && TOTALS.calibrationRuns
      ? `<p>${fmtInt(TOTALS.calibrationRuns)} early calibration runs were played before models were tagged. They count toward runs published, not toward any model.
          <button type="button" class="inline-link link-button" data-open-calibration>View calibration runs</button></p>`
      : "";
  footEl.innerHTML = `<p>${notes[state.view]}</p>${calibration}`;
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
  const rows = standings(state.game, { version: state.version, by: state.view });
  renderControls();
  renderChampion(rows);
  renderRows(rows);
  renderFoot(rows);
  syncUrl();
  observeMotion();
}

function openModel(modelId, { game = state.game, version = state.version, route = "" } = {}) {
  const name = modelMeta(modelId).name;
  openRunDrawer({
    title: route && route !== "Self-hosted" ? `${name} via ${route}` : name,
    game,
    modelId,
    route: route || undefined,
    version,
  });
}

viewSwitch.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-view]");
  if (!btn) return;
  state.view = btn.dataset.view;
  render();
});

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
    openModel(model.dataset.openModel, { route: model.dataset.route });
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
  if (event.target.closest("[data-view-reset]")) {
    state.view = "wins";
    render();
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
  openModel(linkedModel, { version: "all" });
}
