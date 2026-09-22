/**
 * JevBench v1 — leaderboard filters + use-case list.
 * Rows are measured smokes / harness runs (ours) or official-cited cards.
 * No fabricated win rates.
 */

import "@fontsource-variable/ibm-plex-sans/wght.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-600.css";

import "./nav.js";
import "./support.js";
import { initRunDrawer } from "./run-drawer.js";
import { USE_CASES, TRANCHE_META, shortLabel } from "./use-cases.js";
import { initJevSuit } from "./jev-suit.js";

const byId = Object.fromEntries(USE_CASES.map((u) => [u.id, u]));

/** Measured / smoked results (20 Sep 2026 PT). Honest — no invented win rates. */
const ROWS = [
  {
    rank: 1,
    model: "TypeSafe Jev 1.13",
    family: "jev",
    usecase: "uc-20",
    notes: "6 verified Liberation Day wins: 5 on the TypeSafe wire, 1 via OpenRouter. HQ destroyed or critically damaged, Raynor alive.",
    scoreLabel: "6 wins · 8 runs",
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
    model: "LocalJev",
    family: "jev",
    usecase: "uc-20",
    notes: "OpenJev wire, model openjev-latest. 9 Liberation Day attempts, all incomplete. No verified win.",
    scoreLabel: "0 wins · 9 runs",
    runs: "openjev",
    runsTitle: "OpenJev wire",
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

const tbody = document.getElementById("lb-body-summary");
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

function sourceBadge(source) {
  if (source === "official") {
    return '<span class="badge badge-official">OFFICIAL</span>';
  }
  return '<span class="badge badge-ours">OURS</span>';
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

function renderHomepageSummary() {
  if (!tbody) return;
  
  const enriched = ROWS.slice(0, 5).map(enrichRow);

  tbody.innerHTML = enriched
    .map(
      (r) => `
    <tr data-usecase="${r.usecase}" data-model="${r.family}" data-category="${r.category}" data-source="${escapeHtml(r.source)}">
      <td class="rank">${String(r.rank).padStart(2, "0")}</td>
      <td class="model"><span class="model-name">${escapeHtml(r.model)}</span> ${sourceBadge(r.source)}</td>
      <td data-label="Use case">${r.runs ? `<button type="button" class="run-open" data-runs="${escapeHtml(r.runs)}" data-title="${escapeHtml(r.runsTitle || r.model)}">View runs</button><a class="uc-catalog" href="#${escapeHtml(r.usecase)}">Catalog</a>` : `<a class="uc-row-link" href="#${escapeHtml(r.usecase)}">${escapeHtml(r.usecaseLabel)}</a>`}</td>
      <td data-label="Category">${categoryBadge(r.category)}</td>
      <td class="score" data-label="Score"><span class="score-label">${escapeHtml(r.scoreLabel)}</span></td>
      <td class="cost" data-label="Cost in">${escapeHtml(r.costIn || "—")}</td>
    </tr>`
    )
    .join("");
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

renderHomepageSummary();
renderUseCasesSection();

document.querySelectorAll(".table-wrap").forEach((tableWrap) => {
  tableWrap.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    if (tableWrap.scrollWidth <= tableWrap.clientWidth) return;
    e.preventDefault();
    tableWrap.scrollLeft += e.key === "ArrowRight" ? 48 : -48;
  });
});

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

initJevSuit();
initRunDrawer();
