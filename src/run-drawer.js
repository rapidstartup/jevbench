/** Slide-over listing the runs behind a leaderboard row, record or evidence card. */

import { GAMES, fmtDate, fmtInt, fmtMoney, modelMeta, queryRuns } from "./bench.js";
import { escapeHtml, stillImg } from "./ui.js";

const CHIPS = [
  { id: "all", label: "All runs" },
  { id: "wins", label: "Verified wins" },
  { id: "other", label: "Did not finish" },
];

let drawer;
let scrim;
let titleEl;
let countEl;
let chipsEl;
let listEl;
let lastFocus = null;
let query = {};
let outcome = "all";

function runLabel(run) {
  if (run.date) {
    const hh = String(run.date.getUTCHours()).padStart(2, "0");
    const mm = String(run.date.getUTCMinutes()).padStart(2, "0");
    return `${fmtDate(run.date)} · ${hh}:${mm} UTC`;
  }
  const n = String(run.id).match(/(\d+)$/);
  return n ? `Run ${n[1]}` : run.id;
}

function mediaBlock(run) {
  const media = run.media;
  if (!media || (!media.video && !(media.stills || []).length)) return "";
  const poster = (media.stills || [])[0];
  const alt = `${GAMES[run.game].name} gameplay, ${run.won ? "verified win" : "run"}`;
  return `
    <div class="run-media">
      ${
        media.video
          ? `<video controls preload="none" ${poster ? `poster="${escapeHtml(poster.url)}"` : ""} src="${escapeHtml(media.video)}"></video>`
          : ""
      }
      ${
        (media.stills || []).length
          ? `<div class="run-stills">${media.stills
              .map(
                (s) =>
                  `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener" aria-label="Open still full size">${stillImg(s.url, alt)}</a>`
              )
              .join("")}</div>`
          : ""
      }
    </div>`;
}

function renderCard(run, i) {
  const game = GAMES[run.game];
  const unit = game.unit === "steps" ? "Steps" : "Decisions";
  const facts = [
    [unit, fmtInt(run.decisions)],
    ["Cost", fmtMoney(run.cost)],
    [run.helperRole, run.helper],
    ["Route", run.route],
    ["Bench", run.version],
    ["Verified by", run.verifiedBy],
  ].filter(([, value]) => value && value !== "—");

  return `
    <article class="run-card" style="--i: ${i}" data-won="${run.won}">
      <header class="run-card-head">
        <span class="tag ${run.won ? "tag-win" : "tag-muted"}">${run.won ? "★ " : ""}${escapeHtml(run.outcome)}</span>
        <span class="label">${escapeHtml(runLabel(run))}</span>
      </header>
      <div class="run-card-title">
        <h3>${escapeHtml(run.modelId ? modelMeta(run.modelId).name : "Calibration run")}</h3>
        <p>${escapeHtml(game.name)} · ${escapeHtml(run.scenario)}</p>
      </div>
      <dl class="run-facts">
        ${facts
          .map(([label, value]) => `<div><dt class="label">${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`)
          .join("")}
      </dl>
      ${mediaBlock(run)}
      ${
        run.note
          ? `<details class="run-notes"><summary class="label">Run notes</summary><p>${escapeHtml(run.note)}</p></details>`
          : ""
      }
    </article>`;
}

function renderList() {
  const all = queryRuns(query);
  const runs = queryRuns({ ...query, outcome });
  const wins = all.filter((r) => r.won).length;
  countEl.textContent = `${all.length} ${all.length === 1 ? "run" : "runs"} · ${wins} verified ${wins === 1 ? "win" : "wins"}`;
  chipsEl.hidden = all.length < 2;
  chipsEl.querySelectorAll(".run-chip").forEach((chip) => {
    chip.setAttribute("aria-pressed", String(chip.dataset.filter === outcome));
  });
  listEl.innerHTML = runs.length
    ? runs.map(renderCard).join("")
    : `<p class="run-empty">No runs in this view.</p>`;
  listEl.scrollTop = 0;
}

function isOpen() {
  return drawer.hasAttribute("data-open");
}

function focusables() {
  return [...drawer.querySelectorAll("button, a[href], summary, video")].filter((el) => !el.closest("[hidden]"));
}

export function openRunDrawer({ title = "Runs", ...nextQuery } = {}) {
  query = nextQuery;
  outcome = "all";
  titleEl.textContent = title;
  renderList();
  if (!isOpen()) lastFocus = document.activeElement;
  scrim.hidden = false;
  drawer.inert = false;
  drawer.removeAttribute("aria-hidden");
  drawer.setAttribute("data-open", "");
  document.body.setAttribute("data-run-drawer-open", "");
  drawer.querySelector(".run-drawer-close").focus();
}

function closeRunDrawer() {
  if (!isOpen()) return;
  drawer.removeAttribute("data-open");
  drawer.setAttribute("aria-hidden", "true");
  document.body.removeAttribute("data-run-drawer-open");
  drawer.querySelectorAll("video").forEach((video) => video.pause());
  const finish = () => {
    scrim.hidden = true;
    drawer.inert = true;
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) finish();
  else window.setTimeout(finish, 320);
  if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
}

export function initRunDrawer() {
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
        <p class="label label-signal">Run evidence</p>
        <h2 id="run-drawer-title">Runs</h2>
        <p class="label run-drawer-count"></p>
      </div>
      <button type="button" class="btn btn-sm run-drawer-close">Close</button>
    </div>
    <div class="run-chips" role="group" aria-label="Filter runs">
      ${CHIPS.map((chip) => `<button type="button" class="run-chip" data-filter="${chip.id}">${chip.label}</button>`).join("")}
    </div>
    <div class="run-list"></div>
  `;
  titleEl = drawer.querySelector("#run-drawer-title");
  countEl = drawer.querySelector(".run-drawer-count");
  chipsEl = drawer.querySelector(".run-chips");
  listEl = drawer.querySelector(".run-list");
  document.body.append(scrim, drawer);

  scrim.addEventListener("click", closeRunDrawer);
  drawer.querySelector(".run-drawer-close").addEventListener("click", closeRunDrawer);
  chipsEl.addEventListener("click", (event) => {
    const chip = event.target.closest(".run-chip");
    if (!chip) return;
    outcome = chip.dataset.filter;
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
}
