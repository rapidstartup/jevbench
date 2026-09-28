/** Home page: headline standings, arenas, records and roadmap. */

import { escapeHtml, observeMotion, stillImg } from "./ui.js";
import "./support.js";
import {
  ROADMAP,
  fmtDate,
  fmtInt,
  fmtPct,
  gameSummary,
  latestWins,
  modelMeta,
  records,
  standings,
  GAMES,
} from "./bench.js";

const STATUS_TAG = { Live: "tag-live", "Coming soon": "tag-soon", Planned: "tag-muted" };

function rank(n) {
  return String(n).padStart(2, "0");
}

function renderHeroBoard() {
  const root = document.getElementById("hero-board");
  if (!root) return;
  const rows = standings("sc2").slice(0, 5);
  root.innerHTML = `
    <div class="mini-row mini-row-head">
      <span>P</span><span>Model</span><span>Record</span><span>Win rate</span>
    </div>
    ${rows
      .map(
        (r, i) => `
      <a class="mini-row row-in" style="--i: ${i}" data-rank="${r.rank}" href="/leaderboard?model=${encodeURIComponent(r.modelId)}"
         aria-label="${escapeHtml(`${r.name}, rank ${r.rank}, ${r.wins} wins from ${r.runs} runs`)}">
        <span class="mini-rank">${rank(r.rank)}</span>
        <span class="mini-name">${escapeHtml(r.name)}<small>${escapeHtml(r.by)}</small></span>
        <span class="mini-record">${r.wins}–${r.runs - r.wins}</span>
        <span class="mini-rate">${fmtPct(r.rate)}</span>
      </a>`
      )
      .join("")}
    <a class="mini-row mini-row-open row-in" style="--i: ${rows.length}" href="/about#open-source">
      <span class="mini-rank">··</span>
      <span class="mini-name">your model<small>run the open harness</small></span>
      <span class="mini-record">———</span>
      <span class="mini-rate">?</span>
    </a>`;
}

function renderTicker() {
  const root = document.getElementById("ticker");
  if (!root) return;
  const wins = latestWins(10);
  if (!wins.length) {
    root.hidden = true;
    return;
  }
  const group = wins
    .map(
      (r) => `
      <span class="ticker-item">
        <i>★</i> Verified win
        <b>${escapeHtml(modelMeta(r.modelId).name)}</b>
        ${escapeHtml(r.scenario)} · ${fmtInt(r.decisions)} decisions · ${fmtDate(r.date)}
      </span>`
    )
    .join("");
  root.innerHTML = `
    <div class="ticker-track">
      <div class="ticker-group">${group}</div>
      <div class="ticker-group" aria-hidden="true">${group}</div>
    </div>`;
}

function renderArenas() {
  const root = document.getElementById("arena-grid");
  if (!root) return;
  root.innerHTML = Object.keys(GAMES)
    .map((key, i) => {
      const g = gameSummary(key);
      const still = g.cover && (g.cover.media.stills || [])[0];
      return `
      <a class="arena reveal" style="--i: ${i}" href="/leaderboard?game=${key}">
        <div class="arena-cover">
          ${still ? stillImg(still.url, `${g.name} gameplay from a verified win`) : ""}
          <span class="tag tag-live"><span class="pulse" aria-hidden="true"></span>Live</span>
          <div class="arena-title">
            <h3>${escapeHtml(g.name)}</h3>
            <p class="label">${escapeHtml(g.scenario)} · ${escapeHtml(g.kind)}</p>
          </div>
        </div>
        <div class="arena-body">
          <p>${escapeHtml(g.objective)}</p>
          <dl class="arena-stats">
            <div><dt class="label">Wins</dt><dd>${fmtInt(g.wins)}</dd></div>
            <div><dt class="label">Runs</dt><dd>${fmtInt(g.runs)}</dd></div>
            <div><dt class="label">Top rate</dt><dd>${g.leader ? fmtPct(g.leader.rate) : "—"}</dd></div>
          </dl>
          <div class="arena-leader">
            <div>
              <span class="label label-gold">★ Leading</span>
              <strong>${g.leader ? escapeHtml(g.leader.name) : "Open"}</strong>
            </div>
            <span class="text-link">Standings →</span>
          </div>
        </div>
      </a>`;
    })
    .join("");
}

function renderRecords() {
  const root = document.getElementById("record-grid");
  if (!root) return;
  root.innerHTML = records()
    .map((r) => {
      const href = r.run ? `/leaderboard?run=${encodeURIComponent(r.run.id)}` : "/leaderboard";
      return `
      <a class="record" href="${href}">
        <span class="label">${escapeHtml(r.label)}</span>
        <p class="record-value">${escapeHtml(r.value)}<small>${escapeHtml(r.unit)}</small></p>
        <p class="record-holder">${escapeHtml(r.holder)}<span>${escapeHtml(r.context)}</span></p>
      </a>`;
    })
    .join("");
}

function renderRoadmap() {
  const root = document.getElementById("phases");
  if (!root) return;
  root.innerHTML = ROADMAP.map(
    (phase, i) => `
    <article class="phase reveal" style="--i: ${i}" data-status="${escapeHtml(phase.status)}">
      <header class="phase-head">
        <h3><span>${escapeHtml(phase.phase)}</span>${escapeHtml(phase.title)}</h3>
        <span class="tag ${STATUS_TAG[phase.status] || ""}">${escapeHtml(phase.status)}</span>
      </header>
      <ul>
        ${phase.items
          .map((item) => `<li><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.text)}</span></li>`)
          .join("")}
      </ul>
    </article>`
  ).join("");
}

renderHeroBoard();
renderTicker();
renderArenas();
renderRecords();
renderRoadmap();
observeMotion();
