/** Use cases page: grouped patterns and the fit check. */

import { escapeHtml, observeMotion } from "./ui.js";
import { initJevSuit } from "./jev-suit.js";
import { GROUPS, USE_CASES } from "./use-cases.js";

const STATUS = {
  live: { label: "On the leaderboard", cls: "tag-live", href: "/leaderboard" },
  planned: { label: "Benchmark coming soon", cls: "tag-soon", href: "/#roadmap" },
};

function statusTag(status) {
  const s = STATUS[status];
  if (!s) return "";
  return `<a class="tag ${s.cls}" href="${s.href}">${s.label}</a>`;
}

function renderNav() {
  const count = document.getElementById("uc-count");
  if (count) count.textContent = String(USE_CASES.length);
  const nav = document.getElementById("uc-nav");
  if (!nav) return;
  nav.innerHTML = GROUPS.map((g) => {
    const n = USE_CASES.filter((u) => u.group === g.id).length;
    return `<a class="btn btn-sm" href="#${g.id}">${escapeHtml(g.title)} · ${n}</a>`;
  }).join("");
}

function renderGroups() {
  const root = document.getElementById("uc-groups");
  if (!root) return;
  root.innerHTML = GROUPS.map((g, gi) => {
    const items = USE_CASES.filter((u) => u.group === g.id);
    return `
    <section class="uc-group" id="${g.id}" aria-labelledby="${g.id}-title">
      <div class="block-head reveal">
        <div>
          <p class="label">${String(gi + 1).padStart(2, "0")} · ${items.length} patterns</p>
          <h2 id="${g.id}-title">${escapeHtml(g.title)}</h2>
        </div>
        <p>${escapeHtml(g.blurb)}</p>
      </div>
      <div class="uc-grid">
        ${items
          .map(
            (u, i) => `
        <article class="uc-card reveal" style="--i: ${i % 3}" id="${escapeHtml(u.id)}">
          ${u.status ? `<div class="uc-card-top">${statusTag(u.status)}</div>` : ""}
          <h3>${escapeHtml(u.title)}</h3>
          <p>${escapeHtml(u.writeup)}</p>
          <p class="uc-links">
            ${u.links
              .map(
                (l) =>
                  `<a href="${escapeHtml(l.href)}" target="_blank" rel="noopener">${escapeHtml(l.label)} ↗</a>`
              )
              .join("")}
          </p>
        </article>`
          )
          .join("")}
      </div>
    </section>`;
  }).join("");
}

renderNav();
renderGroups();
initJevSuit();
observeMotion();

// Cards are rendered after load, so re-apply a deep link such as /use-cases#uc-20.
if (window.location.hash) {
  const target = document.getElementById(window.location.hash.slice(1));
  if (target) {
    target.classList.add("in");
    target.scrollIntoView();
  }
}
