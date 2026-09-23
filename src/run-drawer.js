import { SC2_RUNS } from "./sc2-runs.js";
import { MC_RUNS } from "./minecraft-runs.js";

const VIA_LABEL = {
  typesafe: "TypeSafe",
  openrouter: "OpenRouter",
  openjev: "OpenJev",
  untagged: "Untagged",
};

const SC2_CHIPS = [
  { id: "all", label: "All scored" },
  { id: "wins", label: "Verified wins" },
  { id: "typesafe", label: "TypeSafe" },
  { id: "openrouter", label: "OpenRouter" },
  { id: "openjev", label: "OpenJev" },
  { id: "untagged", label: "Untagged" },
];

const MC_CHIPS = [
  { id: "all", label: "All runs" },
  { id: "wins", label: "Verified wins" },
  { id: "fails", label: "Failures" },
];

const GAMES = {
  sc2: {
    key: "sc2",
    label: "StarCraft II",
    runs: SC2_RUNS,
    chips: SC2_CHIPS,
    noun: "packets",
  },
  mc: {
    key: "mc",
    label: "Minecraft",
    runs: MC_RUNS,
    chips: MC_CHIPS,
    noun: "runs",
  },
};

let drawer;
let scrim;
let titleEl;
let countEl;
let listEl;
let lastFocus = null;
let activeFilter = "all";
let activeGame = "sc2";
let activeTitle = "Scored harness runs";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stampLabel(id) {
  const match = String(id).match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!match) return id;
  return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${match[6]} UTC`;
}

function money(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  if (Number(value) === 0) return "$0";
  return `$${Number(value).toFixed(4)}`;
}

export function filterRuns(key) {
  const runs = GAMES[activeGame].runs;
  if (!key || key === "all") return runs;
  if (key === "wins") return runs.filter((run) => run.status === "victory");
  if (key === "fails") return runs.filter((run) => run.status !== "victory");
  if (key.startsWith("model:")) {
    const model = key.slice("model:".length);
    return runs.filter((run) => run.model === model);
  }
  return runs.filter((run) => run.via === key);
}

function chipLabel(id) {
  if (id.startsWith("model:")) return id.slice("model:".length);
  return (
    GAMES[activeGame].chips.find((chip) => chip.id === id)?.label || id
  );
}

function renderSc2Card(run) {
  const win = run.status === "victory";
  const facts = [
    ["Wire", `${VIA_LABEL[run.via] || run.via}${run.model ? ` · ${run.model}` : ""}`],
    ["Calls", run.calls == null ? "—" : String(run.calls)],
    ["Recorded cost", money(run.cost)],
    ["Check", run.source || "—"],
    ["Raynor alive", run.heroAlive == null ? "—" : run.heroAlive ? "Yes" : "No"],
    ["HQ", run.hq || (run.hqMin != null ? `min health ${run.hqMin}` : "—")],
    ["Score", run.peakScore == null ? "—" : String(run.peakScore)],
    ["Loop", run.loop == null ? "—" : String(run.loop)],
    ["Guide", run.guide || "—"],
  ];
  return `
    <article class="run-card">
      <header class="run-card-head">
        <span class="badge ${win ? "badge-ours" : "badge-nongame"}">${win ? "Victory" : "Incomplete"}</span>
        <time datetime="${escapeHtml(stampLabel(run.id))}">${escapeHtml(stampLabel(run.id))}</time>
      </header>
      <h3>${escapeHtml(run.map)}</h3>
      ${run.objective ? `<p class="run-objective">${escapeHtml(run.objective)}</p>` : ""}
      <dl class="run-facts">
        ${facts
          .map(
            ([label, value]) =>
              `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`
          )
          .join("")}
      </dl>
      ${run.reason ? `<p class="run-reason">${escapeHtml(run.reason)}</p>` : ""}
      ${mediaBlock(run)}
    </article>`;
}

function renderMcCard(run) {
  const win = run.status === "victory";
  const badge = win ? "Victory" : run.status === "incomplete" ? "Incomplete" : "Failed";
  const facts = [
    ["Game", run.game],
    ["Steps", run.steps == null ? "—" : String(run.steps)],
    ["Planner", run.planner || "—"],
    ["Controller", run.controller || "—"],
    ["Ender Dragon", run.dragonKilled ? "Killed" : "—"],
    ["Difficulty", run.difficulty || "—"],
  ];
  return `
    <article class="run-card">
      <header class="run-card-head">
        <span class="badge ${win ? "badge-ours" : "badge-nongame"}">${badge}</span>
        <span class="run-id">${escapeHtml(run.id)}</span>
      </header>
      <h3>Ender Dragon speedrun</h3>
      <dl class="run-facts">
        ${facts
          .map(
            ([label, value]) =>
              `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`
          )
          .join("")}
      </dl>
      ${run.note ? `<p class="run-reason">${escapeHtml(run.note)}</p>` : ""}
      ${mediaBlock(run)}
    </article>`;
}

function mediaBlock(run) {
  if (!run.media || (!run.media.video && !(run.media.stills || []).length)) return "";
  return `<div class="run-media">
    ${run.media.video ? `<video controls preload="none" src="${escapeHtml(run.media.video)}"></video>` : ""}
    ${(run.media.stills || []).map((s) => `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener"><img loading="lazy" src="${escapeHtml(s.url)}" alt="${escapeHtml(s.file)}"></a>`).join("")}
  </div>`;
}

function renderList() {
  const runs = filterRuns(activeFilter);
  countEl.textContent = `${runs.length} scored ${GAMES[activeGame].noun} · ${chipLabel(activeFilter)}`;
  drawer.querySelectorAll(".run-chip").forEach((chip) => {
    chip.setAttribute("aria-pressed", chip.dataset.filter === activeFilter ? "true" : "false");
  });
  if (!runs.length) {
    listEl.innerHTML = `<p class="muted">No scored packets in this view.</p>`;
    return;
  }
  const render = activeGame === "mc" ? renderMcCard : renderSc2Card;
  listEl.innerHTML = runs.map(render).join("");
}

function focusables() {
  return [...drawer.querySelectorAll("button, a[href]")].filter((el) => !el.closest("[hidden]"));
}

function isOpen() {
  return drawer.hasAttribute("data-open");
}

function renderChips() {
  const chipsEl = drawer.querySelector(".run-chips");
  chipsEl.innerHTML = GAMES[activeGame].chips
    .map(
      (chip) =>
        `<button type="button" class="run-chip" data-filter="${chip.id}" aria-pressed="${chip.id === activeFilter ? "true" : "false"}">${chip.label}</button>`
    )
    .join("");
  drawer.querySelectorAll(".run-game").forEach((btn) => {
    btn.setAttribute("aria-pressed", btn.dataset.game === activeGame ? "true" : "false");
  });
}

export function openRunDrawer({ filter = "all", title = "Scored harness runs", game } = {}) {
  if (game && GAMES[game]) activeGame = game;
  activeFilter = filter;
  activeTitle = title;
  titleEl.textContent = title;
  renderChips();
  renderList();
  lastFocus = document.activeElement;
  scrim.hidden = false;
  drawer.inert = false;
  drawer.removeAttribute("aria-hidden");
  drawer.setAttribute("data-open", "");
  document.body.setAttribute("data-run-drawer-open", "");
  drawer.querySelector(".run-drawer-close").focus();
}

function closeRunDrawer({ restore = true } = {}) {
  if (!isOpen()) return;
  drawer.removeAttribute("data-open");
  drawer.setAttribute("aria-hidden", "true");
  document.body.removeAttribute("data-run-drawer-open");
  const finish = () => {
    scrim.hidden = true;
    drawer.inert = true;
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) finish();
  else window.setTimeout(finish, 200);
  if (restore && lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
}

function ensureDrawer() {
  if (drawer) return;
  scrim = document.createElement("button");
  scrim.type = "button";
  scrim.className = "run-scrim";
  scrim.hidden = true;
  scrim.setAttribute("aria-label", "Close run details");

  drawer = document.createElement("aside");
  drawer.id = "run-drawer";
  drawer.className = "run-drawer";
  drawer.setAttribute("role", "dialog");
  drawer.setAttribute("aria-modal", "true");
  drawer.setAttribute("aria-labelledby", "run-drawer-title");
  drawer.setAttribute("aria-hidden", "true");
  drawer.inert = true;
  drawer.innerHTML = `
    <div class="run-drawer-head">
      <div>
        <p class="eyebrow">Run details</p>
        <h2 id="run-drawer-title">Scored harness runs</h2>
        <p class="run-drawer-count"></p>
      </div>
      <button type="button" class="run-drawer-close">Close</button>
    </div>
    <div class="run-games" role="group" aria-label="Game">
      ${Object.values(GAMES)
        .map(
          (g) =>
            `<button type="button" class="run-game" data-game="${g.key}">${g.label}</button>`
        )
        .join("")}
    </div>
    <div class="run-chips" role="group" aria-label="Filter runs"></div>
    <p class="run-media-note">
      Runs with game video and stills show them on the card. StarCraft packets also carry replay and logs on the harness machine.
    </p>
    <div class="run-list"></div>
  `;
  titleEl = drawer.querySelector("#run-drawer-title");
  countEl = drawer.querySelector(".run-drawer-count");
  listEl = drawer.querySelector(".run-list");
  document.body.append(scrim, drawer);

  scrim.addEventListener("click", () => closeRunDrawer());
  drawer.querySelector(".run-drawer-close").addEventListener("click", () => closeRunDrawer());
  drawer.querySelector(".run-games").addEventListener("click", (event) => {
    const btn = event.target.closest(".run-game");
    if (!btn) return;
    activeGame = btn.dataset.game;
    activeFilter = "all";
    activeTitle = "All scored harness runs";
    titleEl.textContent = activeTitle;
    renderChips();
    renderList();
  });
  drawer.querySelector(".run-chips").addEventListener("click", (event) => {
    const chip = event.target.closest(".run-chip");
    if (!chip) return;
    activeFilter = chip.dataset.filter;
    if (activeFilter === "all") activeTitle = "All scored harness runs";
    else if (activeFilter === "wins") activeTitle = "Verified wins";
    else if (activeFilter === "fails") activeTitle = "Failures";
    else activeTitle = chipLabel(activeFilter);
    titleEl.textContent = activeTitle;
    renderList();
  });
  document.addEventListener("keydown", (event) => {
    if (!isOpen()) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeRunDrawer();
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(".run-open");
    if (!trigger) return;
    event.preventDefault();
    openRunDrawer({
      filter: trigger.dataset.runs || "all",
      title: trigger.dataset.title || "Scored harness runs",
      game: trigger.dataset.game,
    });
  });
}

export function initRunDrawer() {
  ensureDrawer();
}
