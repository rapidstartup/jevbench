/**
 * JevBench leaderboard — Cribble-inspired tabbed views.
 * Jev Models vs Gaming harness results.
 */

import "@fontsource-variable/ibm-plex-sans/wght.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-600.css";

import "./nav.js";
import { initRunDrawer } from "./run-drawer.js";
import { SC2_RUNS } from "./sc2-runs.js";
import { USE_CASES, shortLabel } from "./use-cases.js";

const byId = Object.fromEntries(USE_CASES.map((u) => [u.id, u]));

/** Measured / smoked results (20 Sep 2026 PT). Honest — no invented win rates. */
/** Measured / smoked results (24 Sep 2026). Honest — no invented win rates. */
const ROWS = [
  {
    rank: 1,
    model: "TypeSafe Jev 1.13",
    family: "jev",
    usecase: "uc-20",
    notes: "15 verified Liberation Day wins for typesafe/jev-1.13: 10 on the TypeSafe wire, 5 via OpenRouter. HQ destroyed or critically damaged, Raynor alive. Stills are game-window-only captures (never the desktop).",
    scoreLabel: "15 wins · 19 runs",
    runs: "model:typesafe/jev-1.13",
    runsTitle: "TypeSafe Jev 1.13",
    source: "ours",
    speedLabel: "70–500 ms",
    costIn: "$0.042/MTok",
    costOut: "FREE",
    costSource: "TypeSafe blog",
  },
  {
    rank: 2,
    model: "jeff (GLiFormer)",
    family: "jev",
    usecase: "uc-20",
    notes: "Self-hosted GLiFormer, SystemOne-compatible server. Preflight green + correct decisions (0.64s small, 1.9s game-sized). Full live LD loop throughput-limited on the 4060 (~32s/batch) — game runs need the big GPU box.",
    scoreLabel: "decide green · game GPU-blocked",
    source: "ours",
    speedLabel: "0.64–1.9s decide (small→game)",
    costIn: "FREE",
    costOut: "FREE",
    costSource: "self-host, 400M params",
  },
  {
    rank: 3,
    model: "Laya",
    family: "jev",
    usecase: "uc-20",
    notes: "PyPI Router.system_one. Real game-shaped decide: 1.2s, valid choices + probabilities (attack_move 0.78). Fast enough for a real-time loop (195 in-game decisions, 1 error) before an SC2 UI stall. Full win pending a clean run.",
    scoreLabel: "1.2s decide · 195 decisions",
    source: "ours",
    speedLabel: "~1.2s (measured)",
    costIn: "FREE",
    costOut: "FREE",
    costSource: "open/local",
  },
  {
    rank: 4,
    model: "LocalJev (self-hosted)",
    family: "jev",
    usecase: "uc-20",
    notes: "OpenJev wire over LAN, backed by local Ollama qwen3.5:4b on the 24GB box. 1 VERIFIED Liberation Day win: HQ destroyed, Raynor alive (96 decisions). Self-hosted, no external decision API. 10 decision errors, 1 UI stall auto-dismissed with c+Esc.",
    scoreLabel: "1 win · 1 run",
    runs: "model:localjev-latest",
    runsTitle: "LocalJev (self-hosted)",
    source: "ours",
    speedLabel: "local / ~1-45s per decide",
    costIn: "FREE",
    costOut: "FREE",
    costSource: "self-host; local Ollama",
  },
  {
    rank: 5,
    model: "NanoJev",
    family: "jev",
    usecase: "uc-20",
    notes: "0.6B toy model. Smoke: evaluate 1.49s (valid choice+probs); maze 3/3 path-efficiency 1.0 (atomic acc 0.647); Snake 183 food, mean 22.9. Not a typed-decision server — game-loop N/A.",
    scoreLabel: "smoke: maze 3/3 · snake 22.9",
    source: "ours",
    speedLabel: "1.49s (measured)",
    costIn: "FREE",
    costOut: "FREE",
    costSource: "HF open weights / self-host GPU",
  },
  {
    rank: 6,
    model: "djev (hosted)",
    family: "jev",
    usecase: "uc-20",
    notes: "Hosted djev.dev. Retried 24 Sep: /v1/models live and djev-0.1 enabled; SDK payload accepted — but inference returns 503 capacity_paused (server-side). Blocked, not a client issue.",
    scoreLabel: "blocked (503 paused)",
    source: "ours",
    speedLabel: "—",
    costIn: "—",
    costOut: "—",
    costSource: "hosted",
  },
  {
    rank: 7,
    model: "OpenJev (browser)",
    family: "jev",
    usecase: "uc-20",
    notes: "openjev.com MiniCPM WebGPU · MSI Chrome OK · box blocked (no GPU)",
    scoreLabel: "smoke OK (MSI)",
    source: "ours",
    speedLabel: "depends on GPU",
    costIn: "FREE",
    costOut: "FREE",
    costSource: "WebGPU local",
  },
  {
    rank: 8,
    model: "Laya-MLX",
    family: "jev",
    usecase: "uc-20",
    notes: "Official: mizorewww/laya-mlx BENCHMARKS · M3 Max FP16 · EN 13.42 ms / ML 7.39 ms P50 · not run here (Mac-only)",
    scoreLabel: "13.4 ms EN p50",
    source: "official",
    speedLabel: "13.4 ms p50 (EN)",
    costIn: "FREE",
    costOut: "FREE",
    costSource: "BENCHMARKS.md (M3 Max FP16)",
  },
  {
    rank: 9,
    model: "Gemini Flash + Jev",
    family: "gemini",
    usecase: "uc-6",
    notes: "Live Liberation Day with Jev decisions + Gemini 3.8-flash guide: OpenRouter win (74 calls) and direct-key win (87 calls). 3.8 needs max_tokens=2048 + mandatory reasoning (fixed).",
    scoreLabel: "2 live wins",
    source: "ours",
    speedLabel: "guide every 8 ticks",
    costIn: "$0.30/MTok",
    costOut: "$2.50/MTok",
    costSource: "Google AI pricing; free tier also available",
  },
];

/** Gaming results from scored result.json packets on the harness machines.
 *  Two bench versions:
 *    v1 = the original full-state harness (rich view fed to the model).
 *    v2 = current bench; a compact SystemOne projection, computed LIVE from the
 *         compact run packets so it evolves as more v2 runs land.
 *  Minecraft is a separate harness (unaffected by the v1/v2 split). */
const BENCH_V1_ROWS = [
  {
    version: "v1",
    game: "StarCraft II",
    model: "TypeSafe Jev 1.13",
    provider: "typesafe",
    wins: 9,
    runs: 12,
    notes: "Bench v1 (full state). Liberation Day. 9 verified wins, 3 incomplete.",
    runsFilter: "typesafe",
    drawerGame: "sc2",
  },
  {
    version: "v1",
    game: "StarCraft II",
    model: "TypeSafe Jev 1.13",
    provider: "openrouter",
    wins: 5,
    runs: 6,
    notes: "Bench v1 (full state). Liberation Day via OpenRouter. 5 verified wins, 1 incomplete.",
    runsFilter: "openrouter",
    drawerGame: "sc2",
  },
  {
    version: "v1",
    game: "StarCraft II",
    model: "OpenJev wire",
    provider: "openjev",
    wins: 0,
    runs: 9,
    notes: "Bench v1 (full state). Local SystemOne attempts. No verified win.",
    runsFilter: "openjev",
    drawerGame: "sc2",
  },
  {
    version: "v1",
    game: "StarCraft II",
    model: "Untagged early harness",
    provider: "untagged",
    wins: 0,
    runs: 51,
    notes: "Bench v1 (full state). 37 early maps plus 14 Liberation Day attempts with no backend tag. No verified win.",
    runsFilter: "untagged",
    drawerGame: "sc2",
  },
];

// Compute the v2 (compact) bench live from the compact run packets.
const PROVIDER_LABEL = { typesafe: "TypeSafe", openrouter: "OpenRouter", openjev: "OpenJev", untagged: "Untagged" };
function buildV2Rows() {
  const groups = new Map();
  for (const run of SC2_RUNS) {
    if (run.stateMode !== "compact") continue;
    const key = `${run.via}|${run.model || "unknown"}`;
    if (!groups.has(key)) {
      groups.set(key, { via: run.via, model: run.model, wins: 0, runs: 0, incomplete: 0, calls: [] });
    }
    const g = groups.get(key);
    g.runs += 1;
    if (run.status === "victory") { g.wins += 1; g.calls.push(run.calls); }
    else g.incomplete += 1;
  }
  const modelName = (via, model) => {
    if (via === "openjev") {
      if (model === "jev-latest") return "jeff (GLiFormer SystemOne)";
      if (model === "localjev-latest") return "LocalJev (qwen3.5:4b)";
      if (model === "openjev-latest") return "OpenJev wire";
      return model || "OpenJev wire";
    }
    if (model && model.includes("typesafe")) return "TypeSafe Jev 1.13";
    return model || via;
  };
  const rows = [];
  let rank = 1;
  for (const g of groups.values()) {
    const avg = g.wins && g.calls.length ? Math.round(g.calls.reduce((a, b) => a + b, 0) / g.calls.length) : null;
    rows.push({
      version: "v2",
      game: "StarCraft II",
      model: modelName(g.via, g.model),
      provider: g.via,
      wins: g.wins,
      runs: g.runs,
      notes: `Bench v2 (compact state). ${g.wins} win${g.wins === 1 ? "" : "s"}${g.incomplete ? `, ${g.incomplete} incomplete` : ""}${avg ? `, ~${avg} calls/win` : ""}. Computed live from compact run packets.`,
      runsFilter: g.via,
      drawerGame: "sc2",
    });
  }
  // Stable ordering: wins desc, then runs desc, then model.
  rows.sort((a, b) => b.wins - a.wins || b.runs - a.runs || a.model.localeCompare(b.model));
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

// The combined, ranked list the gaming table renders: v1 (historical) then v2 (live).
const MINECRAFT_ROWS = [
  {
    version: null,
    game: "Minecraft",
    model: "Astra (gpt-6) + Jev 1.13",
    provider: "typesafe",
    wins: 1,
    runs: 17,
    notes: "Java 1.16.5 Ender Dragon. 1 verified full clear (NEW_RUN20, 327 steps, bed-blast kill). 16 earlier attempts failed on pathing/stuck/death — all published. Separate harness (not v1/v2).",
    runsFilter: "all",
    drawerGame: "mc",
  },
];
const GAMING_ROWS = [
  ...BENCH_V1_ROWS.map((r, i) => ({ ...r, rank: i + 1 })),
  ...buildV2Rows(),
  ...MINECRAFT_ROWS.map((r, i) => ({ ...r, rank: i + 1 })),
];

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function categoryBadge(cat) {
  if (cat === "game") return '<span class="badge badge-game">GAME</span>';
  return '<span class="badge badge-nongame">NON-GAME</span>';
}

function sourceBadge(source) {
  if (source === "official") {
    return '<span class="badge badge-official">OFFICIAL</span>';
  }
  return '<span class="badge badge-ours">OURS</span>';
}

function enrichRow(r) {
  const uc = byId[r.usecase];
  return {
    ...r,
    usecaseLabel: uc ? `${shortLabel(uc)} (#${uc.num})` : r.usecase,
    category: uc ? uc.category : "nongame",
  };
}

// Tab state
let currentTab = "jev-models";

// DOM elements
const tabs = document.querySelectorAll(".lb-tab");
const panels = document.querySelectorAll(".lb-panel");
const indicator = document.querySelector(".lb-tab-indicator");

// Jev Models elements
const filterJevUsecase = document.getElementById("filter-jev-usecase");
const filterJevCategory = document.getElementById("filter-jev-category");
const resultCountJev = document.getElementById("result-count-jev");
const tbodyJev = document.getElementById("lb-body-jev");

// Gaming elements
const filterGamingGame = document.getElementById("filter-gaming-game");
const filterGamingProvider = document.getElementById("filter-gaming-provider");
const filterGamingVersion = document.getElementById("filter-gaming-version");
const resultCountGaming = document.getElementById("result-count-gaming");
const tbodyGaming = document.getElementById("lb-body-gaming");

function updateIndicator() {
  const activeTab = document.querySelector(`.lb-tab[aria-selected="true"]`);
  if (!activeTab || !indicator) return;
  
  const rect = activeTab.getBoundingClientRect();
  const parentRect = activeTab.parentElement.getBoundingClientRect();
  
  indicator.style.width = `${rect.width}px`;
  indicator.style.transform = `translateX(${rect.left - parentRect.left}px)`;
}

function switchTab(tabId) {
  currentTab = tabId;
  
  tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === tabId;
    tab.setAttribute("aria-selected", isActive);
  });
  
  panels.forEach((panel) => {
    const isActive = panel.dataset.panel === tabId;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });
  
  requestAnimationFrame(() => {
    updateIndicator();
  });
}

function populateJevUsecaseFilter() {
  if (!filterJevUsecase) return;
  const all = filterJevUsecase.querySelector('option[value="all"]');
  filterJevUsecase.innerHTML = "";
  const allOpt = document.createElement("option");
  allOpt.value = "all";
  allOpt.textContent = "All use cases";
  filterJevUsecase.appendChild(allOpt);
  if (all && all.selected) allOpt.selected = true;

  const groups = [
    { key: "games", label: "Games first (P0)" },
    { key: "platform", label: "Platform patterns (P1)" },
    { key: "product", label: "Product patterns (P1)" },
    { key: "nongame", label: "Non-game later (P2)" },
  ];
  for (const g of groups) {
    const og = document.createElement("optgroup");
    og.label = g.label;
    USE_CASES.filter((u) => u.tranche === g.key).forEach((u) => {
      const opt = document.createElement("option");
      opt.value = u.id;
      opt.textContent = `#${u.num} ${shortLabel(u)}`;
      og.appendChild(opt);
    });
    filterJevUsecase.appendChild(og);
  }
}

function useCaseCell(row, prefix) {
  const catalog = `<a class="uc-catalog" href="${prefix}#${escapeHtml(row.usecase)}">Catalog</a>`;
  if (!row.runs) {
    return `<a class="uc-row-link" href="${prefix}#${escapeHtml(row.usecase)}">${escapeHtml(row.usecaseLabel)}</a>`;
  }
  return `<button type="button" class="run-open" data-runs="${escapeHtml(row.runs)}" data-title="${escapeHtml(row.runsTitle || row.model)}">View runs</button>${catalog}`;
}

function updateJevCount(shown) {
  if (!resultCountJev) return;
  const total = ROWS.length;
  resultCountJev.textContent = `Showing ${shown} of ${total} rows`;
}

function renderJevModels() {
  const uc = filterJevUsecase.value;
  const cat = filterJevCategory.value;

  const enriched = ROWS.map(enrichRow);
  const filtered = enriched.filter((r) => {
    if (uc !== "all" && r.usecase !== uc) return false;
    if (cat !== "all" && r.category !== cat) return false;
    return true;
  });

  updateJevCount(filtered.length);

  if (!filtered.length) {
    tbodyJev.innerHTML = `<tr class="lb-empty"><td colspan="9" class="muted">No rows match these filters.</td></tr>`;
    return;
  }

  tbodyJev.innerHTML = filtered
    .map(
      (r) => `
    <tr data-usecase="${r.usecase}" data-model="${r.family}" data-category="${r.category}" data-source="${escapeHtml(r.source)}">
      <td class="rank">${String(r.rank).padStart(2, "0")}</td>
      <td class="model"><span class="model-name">${escapeHtml(r.model)}</span> ${sourceBadge(r.source)}</td>
      <td data-label="Use case">${useCaseCell(r, "/")}</td>
      <td data-label="Category">${categoryBadge(r.category)}</td>
      <td class="score" data-label="Score"><span class="score-label">${escapeHtml(r.scoreLabel)}</span></td>
      <td class="speed" data-label="Speed">${escapeHtml(r.speedLabel || "—")}</td>
      <td class="cost" data-label="Cost in">${escapeHtml(r.costIn || "—")}</td>
      <td class="cost" data-label="Cost out">${escapeHtml(r.costOut || "—")}</td>
      <td class="muted notes" data-label="Notes">${escapeHtml(r.notes)}</td>
    </tr>`
    )
    .join("");
}

function updateGamingCount(shown) {
  if (!resultCountGaming) return;
  const total = GAMING_ROWS.length;
  resultCountGaming.textContent = `Showing ${shown} of ${total} rows`;
}

function benchBadge(version) {
  if (version === "v2") return '<span class="badge badge-ours">v2</span>';
  if (version === "v1") return '<span class="badge badge-official">v1</span>';
  return '<span class="badge badge-nongame">n/a</span>';
}

function renderGaming() {
  const game = filterGamingGame.value;
  const provider = filterGamingProvider.value;
  const version = filterGamingVersion ? filterGamingVersion.value : "all";

  const filtered = GAMING_ROWS.filter((r) => {
    if (game !== "all" && r.game !== game) return false;
    if (provider !== "all" && r.provider !== provider) return false;
    if (version === "none" && r.version !== null) return false;
    if (version === "v1" && r.version !== "v1") return false;
    if (version === "v2" && r.version !== "v2") return false;
    return true;
  });

  updateGamingCount(filtered.length);

  if (!filtered.length) {
    tbodyGaming.innerHTML = `<tr class="lb-empty"><td colspan="8" class="muted">No rows match these filters.</td></tr>`;
    return;
  }

  tbodyGaming.innerHTML = filtered
    .map(
      (r) => `
    <tr>
      <td class="rank">${String(r.rank).padStart(2, "0")}</td>
      <td data-label="Bench">${benchBadge(r.version)}</td>
      <td data-label="Game">${escapeHtml(r.game)}</td>
      <td class="model" data-label="Agent / model"><span class="model-name">${escapeHtml(r.model)}</span></td>
      <td data-label="Provider">${escapeHtml(r.provider)}</td>
      <td class="score" data-label="Wins"><span class="score-label">${r.wins}</span></td>
      <td class="score" data-label="Runs"><span class="score-label">${r.runs}</span></td>
      <td class="muted notes" data-label="Notes">${escapeHtml(r.notes)} <button type="button" class="run-open" data-runs="${escapeHtml(r.runsFilter)}" data-title="${escapeHtml(r.model)}" data-game="${escapeHtml(r.drawerGame || "sc2")}">View runs</button></td>
    </tr>`
    )
    .join("");
}

// Initialize
initRunDrawer();
populateJevUsecaseFilter();
renderJevModels();
renderGaming();

// Tab click handlers
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    switchTab(tab.dataset.tab);
  });
});

// Filter handlers
[filterJevUsecase, filterJevCategory].forEach((el) => {
  el?.addEventListener("change", renderJevModels);
});

[filterGamingGame, filterGamingProvider, filterGamingVersion].forEach((el) => {
  el?.addEventListener("change", renderGaming);
});

// Initialize indicator position
window.addEventListener("load", () => {
  updateIndicator();
});

window.addEventListener("resize", () => {
  updateIndicator();
});

// Keyboard navigation for tables
document.querySelectorAll(".table-wrap").forEach((tableWrap) => {
  tableWrap.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    if (tableWrap.scrollWidth <= tableWrap.clientWidth) return;
    e.preventDefault();
    tableWrap.scrollLeft += e.key === "ArrowRight" ? 48 : -48;
  });
});
