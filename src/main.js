/**
 * JevBench v1 — leaderboard filters + use-case pack.
 * All rows are EXAMPLE DATA until live scoring ships.
 * Vendor/demo numbers are directional — not measured.
 */

import "@fontsource-variable/ibm-plex-sans/wght.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-600.css";

import "./nav.js";
import "./support.js";
import { USE_CASES, TRANCHE_META, shortLabel } from "./use-cases.js";
import { initJevSuit } from "./jev-suit.js";

const byId = Object.fromEntries(USE_CASES.map((u) => [u.id, u]));

/** Demo rows mapped to real pack ids. Prefer P0 games first. Not measured. */
const EXAMPLE_ROWS = [
  {
    rank: 1,
    model: "jev-doom-demo",
    family: "open",
    usecase: "uc-17",
    notes: "EXAMPLE — structured-state Doom shape (not measured)",
  },
  {
    rank: 2,
    model: "jev-wikirace-demo",
    family: "open",
    usecase: "uc-18",
    notes: "EXAMPLE — high-cardinality Choice (not measured)",
  },
  {
    rank: 3,
    model: "jev-browser-demo",
    family: "open",
    usecase: "uc-19",
    notes: "EXAMPLE — browser-use/jev-ultrafast shape (not measured)",
  },
  {
    rank: 4,
    model: "jev-sc2-demo",
    family: "claude",
    usecase: "uc-20",
    notes: "EXAMPLE — StarCraft / RTS cluster (not measured)",
  },
  {
    rank: 5,
    model: "jev-mario-demo",
    family: "gpt",
    usecase: "uc-20",
    notes: "EXAMPLE — emulator RAM→JSON control (not measured)",
  },
  {
    rank: 6,
    model: "jev-drone-demo",
    family: "gemini",
    usecase: "uc-20",
    notes: "EXAMPLE — drone advisory loop (not measured)",
  },
  {
    rank: 7,
    model: "cascade-front-door-demo",
    family: "grok",
    usecase: "uc-6",
    notes: "EXAMPLE — Jev → code → specialist LLM (not measured)",
  },
  {
    rank: 8,
    model: "tool-unfurl-demo",
    family: "claude",
    usecase: "uc-10",
    notes: "EXAMPLE — dynamic tool schema unfurl (not measured)",
  },
  {
    rank: 9,
    model: "self-heal-tools-demo",
    family: "open",
    usecase: "uc-g2",
    notes: "EXAMPLE — self-healing tool calls (Greg product; not measured)",
  },
  {
    rank: 10,
    model: "branch-prune-demo",
    family: "grok",
    usecase: "uc-g5",
    notes: "EXAMPLE — agent branch pruning (Greg product; not measured)",
  },
];

const tbody = document.getElementById("lb-body");
const filterUsecase = document.getElementById("filter-usecase");
const filterModel = document.getElementById("filter-model");
const filterCategory = document.getElementById("filter-category");
const resultCount = document.getElementById("result-count");
const tableWrap = document.querySelector(".table-wrap");
const useCasesRoot = document.getElementById("use-cases-root");

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

function priorityBadge(p) {
  const cls =
    p === "P0" ? "badge-p0" : p === "P1" ? "badge-p1" : "badge-p2";
  return `<span class="badge ${cls}">${escapeHtml(p)}</span>`;
}

function enrichRow(r) {
  const uc = byId[r.usecase];
  return {
    ...r,
    usecaseLabel: uc ? `${shortLabel(uc)} (#${uc.num})` : r.usecase,
    category: uc ? uc.category : "nongame",
  };
}

function populateUsecaseFilter() {
  if (!filterUsecase) return;
  const all = filterUsecase.querySelector('option[value="all"]');
  filterUsecase.innerHTML = "";
  const allOpt = document.createElement("option");
  allOpt.value = "all";
  allOpt.textContent = "All use cases";
  filterUsecase.appendChild(allOpt);
  if (all && all.selected) allOpt.selected = true;

  const groups = [
    { key: "games", label: "Games first (P0)" },
    { key: "platform", label: "Platform patterns (P1)" },
    { key: "product", label: "Product-shaped — Greg (P1)" },
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
    filterUsecase.appendChild(og);
  }
}

function renderUseCasesSection() {
  if (!useCasesRoot) return;
  const order = ["games", "platform", "product", "nongame"];
  useCasesRoot.innerHTML = order
    .map((key) => {
      const meta = TRANCHE_META[key];
      const items = USE_CASES.filter((u) => u.tranche === key);
      return `
      <div class="uc-tranche" id="tranche-${escapeHtml(key)}">
        <div class="uc-tranche-head">
          <h3>${escapeHtml(meta.title)} ${priorityBadge(meta.badge)}</h3>
          <p class="muted">${escapeHtml(meta.blurb)}</p>
        </div>
        <div class="uc-grid">
          ${items
            .map(
              (u) => `
            <article class="card uc-card" id="${escapeHtml(u.id)}" data-usecase="${escapeHtml(u.id)}">
              <div class="uc-card-top">
                <span class="uc-num">#${u.num}</span>
                ${priorityBadge(u.priority)}
                ${categoryBadge(u.category)}
              </div>
              <h4>${escapeHtml(u.title)}</h4>
              <p>${escapeHtml(u.writeup)}</p>
              <p class="uc-links">
                ${u.links
                  .map(
                    (l) =>
                      `<a href="${escapeHtml(l.href)}" target="_blank" rel="noopener">${escapeHtml(l.label)} →</a>`
                  )
                  .join(" · ")}
              </p>
            </article>`
            )
            .join("")}
        </div>
      </div>`;
    })
    .join("");
}

function updateCount(shown) {
  if (!resultCount) return;
  const total = EXAMPLE_ROWS.length;
  resultCount.textContent = `Showing ${shown} of ${total} example rows`;
}

function renderRows() {
  const uc = filterUsecase.value;
  const model = filterModel.value;
  const cat = filterCategory.value;

  const enriched = EXAMPLE_ROWS.map(enrichRow);
  const filtered = enriched.filter((r) => {
    if (uc !== "all" && r.usecase !== uc) return false;
    if (model !== "all" && r.family !== model) return false;
    if (cat !== "all" && r.category !== cat) return false;
    return true;
  });

  updateCount(filtered.length);

  if (!filtered.length) {
    tbody.innerHTML = `<tr class="lb-empty"><td colspan="6" class="muted">No example rows match these filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map(
      (r) => `
    <tr data-usecase="${r.usecase}" data-model="${r.family}" data-category="${r.category}">
      <td class="rank">${String(r.rank).padStart(2, "0")}</td>
      <td class="model"><span class="model-name">${escapeHtml(r.model)}</span> <span class="badge badge-example">EXAMPLE</span></td>
      <td data-label="Use case"><a class="uc-row-link" href="#${escapeHtml(r.usecase)}">${escapeHtml(r.usecaseLabel)}</a></td>
      <td data-label="Category">${categoryBadge(r.category)}</td>
      <td class="score" data-label="Score"><span class="score-pending">Not scored</span></td>
      <td class="muted notes" data-label="Notes">${escapeHtml(r.notes)}</td>
    </tr>`
    )
    .join("");
}

populateUsecaseFilter();
renderUseCasesSection();

[filterUsecase, filterModel, filterCategory].forEach((el) => {
  el.addEventListener("change", renderRows);
});

if (tableWrap) {
  tableWrap.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    if (tableWrap.scrollWidth <= tableWrap.clientWidth) return;
    e.preventDefault();
    tableWrap.scrollLeft += e.key === "ArrowRight" ? 48 : -48;
  });
}

document.querySelectorAll("[data-copy]").forEach((btn) => {
  const original = btn.textContent;
  btn.addEventListener("click", async () => {
    const text = btn.getAttribute("data-copy") || "";
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = "Copied";
    } catch {
      btn.textContent = "Copy failed";
    }
    window.setTimeout(() => {
      btn.textContent = original;
    }, 1600);
  });
});

document.getElementById("contact-form")?.addEventListener("submit", (e) => {
  const form = e.target;
  const name = form.name.value?.trim() || "";
  const email = form.email.value?.trim() || "";
  const body = form.body.value?.trim() || "";
  const subject = encodeURIComponent(`JevBench contact from ${name || email}`);
  const mailBody = encodeURIComponent(`From: ${name}\nEmail: ${email}\n\n${body}`);
  window.location.href = `mailto:hello@jevbench.dev?subject=${subject}&body=${mailBody}`;
  e.preventDefault();
});

renderRows();
initJevSuit();
/* deploy 2026-09-19T15:28:00+08:00 greg-product tranche */
