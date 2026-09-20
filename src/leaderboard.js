/**
 * JevBench leaderboard — Cribble-inspired tabbed views.
 * Jev Models vs Gaming harness results.
 */

import "@fontsource-variable/ibm-plex-sans/wght.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-600.css";

import "./nav.js";
import { USE_CASES, shortLabel } from "./use-cases.js";

const byId = Object.fromEntries(USE_CASES.map((u) => [u.id, u]));

/** Measured / smoked results (20 Sep 2026 PT). Honest — no invented win rates. */
const ROWS = [
  {
    rank: 1,
    model: "TypeSafe Jev 1.13",
    family: "jev",
    usecase: "uc-20",
    notes: "SC2 harness control · 825 Jev calls · ~$0.22 OpenRouter · MarineMicro unwinnable as Terran; pivoting to campaign",
    scoreLabel: "38 runs · 0 wins",
    source: "ours",
    speedLabel: "70–500 ms",
    costIn: "$0.042/MTok",
    costOut: "FREE",
    costSource: "TypeSafe blog",
  },
  {
    rank: 2,
    model: "LocalJev",
    family: "jev",
    usecase: "uc-20",
    notes: "Bun :8080 · OpenRouter gpt-4o-mini upstream",
    scoreLabel: "smoke OK",
    source: "ours",
    speedLabel: "local / depends",
    costIn: "FREE",
    costOut: "FREE",
    costSource: "self-host; upstream LLM billed separately if not local",
  },
  {
    rank: 3,
    model: "Laya",
    family: "jev",
    usecase: "uc-20",
    notes: "PyPI · box CPU · predict ~0.14s after load",
    scoreLabel: "smoke OK",
    source: "ours",
    speedLabel: "~0.14s (measured)",
    costIn: "FREE",
    costOut: "FREE",
    costSource: "open/local",
  },
  {
    rank: 4,
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
    rank: 5,
    model: "jeff",
    family: "jev",
    usecase: "uc-20",
    notes: "HTTP smoke on box",
    scoreLabel: "smoke OK",
    source: "ours",
    speedLabel: "—",
    costIn: "FREE",
    costOut: "FREE",
    costSource: "local HTTP",
  },
  {
    rank: 6,
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
    rank: 7,
    model: "Gemini Flash + Jev fixtures",
    family: "gemini",
    usecase: "uc-6",
    notes: "Dual-brain dry-run · Gemini 2.5 Flash + Jev Goler · 3/3 sensible · pending live traynor01 with guide",
    scoreLabel: "3/3 dry-run OK",
    source: "ours",
    speedLabel: "—",
    costIn: "$0.30/MTok",
    costOut: "$2.50/MTok",
    costSource: "Google AI pricing; free tier also available",
  },
  {
    rank: 8,
    model: "NanoJev",
    family: "jev",
    usecase: "uc-20",
    notes: "Cloned only · smoke not run yet",
    scoreLabel: "pending smoke",
    source: "ours",
    speedLabel: "—",
    costIn: "FREE",
    costOut: "FREE",
    costSource: "HF open weights / self-host GPU",
  },
];

/** Gaming results — SC2 only for now; honest 0 wins. */
const GAMING_ROWS = [
  {
    rank: 1,
    game: "StarCraft II",
    model: "TypeSafe Jev 1.13",
    provider: "typesafe",
    wins: 0,
    runs: 38,
    notes: "MarineMicro unwinnable as Terran · 825 Jev calls · ~$0.22 OpenRouter · pivoting to campaign",
  },
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
      <td data-label="Use case"><a class="uc-row-link" href="/#${escapeHtml(r.usecase)}">${escapeHtml(r.usecaseLabel)}</a></td>
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

function renderGaming() {
  const game = filterGamingGame.value;
  const provider = filterGamingProvider.value;

  const filtered = GAMING_ROWS.filter((r) => {
    if (game !== "all" && r.game !== game) return false;
    if (provider !== "all" && r.provider !== provider) return false;
    return true;
  });

  updateGamingCount(filtered.length);

  if (!filtered.length) {
    tbodyGaming.innerHTML = `<tr class="lb-empty"><td colspan="7" class="muted">No rows match these filters.</td></tr>`;
    return;
  }

  tbodyGaming.innerHTML = filtered
    .map(
      (r) => `
    <tr>
      <td class="rank">${String(r.rank).padStart(2, "0")}</td>
      <td data-label="Game">${escapeHtml(r.game)}</td>
      <td class="model" data-label="Agent / model"><span class="model-name">${escapeHtml(r.model)}</span></td>
      <td data-label="Provider">${escapeHtml(r.provider)}</td>
      <td class="score" data-label="Wins"><span class="score-label">${r.wins}</span></td>
      <td class="score" data-label="Runs"><span class="score-label">${r.runs}</span></td>
      <td class="muted notes" data-label="Notes">${escapeHtml(r.notes)}</td>
    </tr>`
    )
    .join("");
}

// Initialize
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

[filterGamingGame, filterGamingProvider].forEach((el) => {
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
