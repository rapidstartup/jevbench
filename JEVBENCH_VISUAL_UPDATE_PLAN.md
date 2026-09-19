# JevBench — Visual Design Review & Update Plan

**Scope of this document:** visual/UX review of the live site plus an executable update plan. No product rebuild, no data work.

**Subject:** https://jevbench.dev (mirror: https://jevbench.pages.dev)
**Stack observed:** Vite vanilla build — single `index.html`, one CSS bundle (`/assets/index-*.css`, ~8.4 KB), one JS bundle (`/assets/index-*.js`, ~3.4 KB). CSS is compiled by Lightning CSS (emits Media Queries Level 4 range syntax, e.g. `@media (width <= 720px)`). Fonts: IBM Plex Sans + IBM Plex Mono via Google Fonts CDN.
**Brand:** JevBench is the public benchmark brand on jevbench.dev. VibeDash (vibedash.app) is a separate PM/ops tool that only supplies the embedded support widget. VibeDash branding must never read as this site's identity.
**Evidence:** Android Chrome screenshot supplied by the product owner, plus headless Chrome renders captured at 1440 px and 412 px viewport widths against the live deployment. Both renders reproduce the reported problems, so every issue below is confirmed rather than inferred.

---

## 1. Visual review

### 1.1 What is working — keep these

| Element | Why it works |
|---|---|
| Colour system | `--bg #0a0b0f` / `--bg-elev #12141c` / `--accent #6ee7b7` is a coherent, disciplined dark palette. Only one accent hue plus one warn hue. Do not add a third. |
| Typography pairing | IBM Plex Sans for prose, IBM Plex Mono for ranks, scores, eyebrows, table headers, and code. Mono-for-data is the correct signal for a benchmark site. |
| Hero copy | "Agent benchmarks. Games first." with a two-colour split on the second line is a strong, specific, non-generic headline. The lede names the actual claims (reproducible runs, video evidence, open source). |
| Per-row `EXAMPLE` badges | Every leaderboard row carries its own badge. This survives deep links and screenshots of a single row — better than relying on a page-level banner alone. |
| Background grid | `--bg-grid` at 48 px with a radial mask fading out by 70% viewport height. Subtle, cheap, adds depth without noise. |
| Fork-hygiene card | "No API keys, tokens, or `.env` in git" as public-facing content is a genuine credibility signal for an open-source bench. |
| Container discipline | A single `.container` primitive (`width: min(100% - 2rem, 1080px)`) used consistently. Good foundation to build the spacing system on. |

### 1.2 Broken — mobile header (the headline problem)

At a 412 px viewport the container is 380 px wide. The logo lockup consumes ~120 px, the flex gap 16 px, leaving ~244 px for a nav that needs roughly 390 px. `.nav { flex-wrap: wrap }` therefore drops Support and Sponsor onto a second row.

Consequences, all visible in both the owner's screenshot and the 412 px render:

1. **Two-row nav in a sticky header.** The header grows from ~56 px to ~110 px and stays there for the whole scroll, permanently eating ~13% of an 844 px-tall viewport.
2. **Near-collision between rows.** `.nav { gap: 0.35rem 1rem }` gives a 5.6 px row gap. Two rows of 20 px-tall text separated by 5.6 px reads as a single jumbled block, not two lines.
3. **Broken optical alignment.** `.header-inner { align-items: center }` vertically centres a one-line logo against a two-line nav, so "JevBench" floats between nav rows with no shared baseline.
4. **The Sponsor pill loses its priority.** It is the only conversion target in the header, and wrapping demotes it to the tail of row two.
5. **Sub-minimum touch targets.** `.nav a` has no padding at all — the hit area is the text box, roughly 20 px tall. `.nav-cta` with `padding: 0.35rem 0.75rem` is ~30 px tall. Both are under the 24×24 CSS px WCAG 2.5.8 floor and far under the 44 px platform recommendation.

**The wrap threshold is ~540 px, not 412 px.** Any phone in portrait and some small tablets hit this. A breakpoint set at the observed failure width would be too low.

### 1.3 Broken — leaderboard is truncated on mobile with no affordance

This is the most damaging issue, because the leaderboard *is* the product.

`.lb-table th, .lb-table td { white-space: nowrap }` plus `.table-wrap { overflow-x: auto }` means that at 412 px the table renders at its full intrinsic width inside a clipped box. The 412 px render shows the "Use case" column sliced mid-word and **Category, Score, and Notes entirely invisible**. There is no fade, no shadow, no scrollbar, no "swipe" hint. A mobile visitor sees a rank, a model name, and a badge, and reasonably concludes the site has no scores.

Two further defects in the same component:

- **The scroll region is keyboard-inaccessible.** `.table-wrap` is a scroll container with no `tabindex`, so keyboard-only users cannot reach the hidden columns at any viewport (WCAG 2.1.1).
- **`—` reads as broken, not pending.** Every score cell renders an em dash. Combined with clipped columns, the impression is a failed render rather than an honest "not scored yet".

### 1.4 Broken — filters wrap into a ragged grid

At 412 px the three `.filter` blocks (`min-width: 10rem` on each select) pack two-up then one-up, leaving a half-empty third row, and the view-toggle group lands on a fourth row. Four ragged rows of chrome sit between the section heading and the data. Control heights are ~36 px — under the 44 px touch target recommendation.

The toggle group has a second, worse problem: **Score / Latency / Cost are non-functional stubs that look functional.** Clicking "Latency" moves the active pill and changes nothing in the table. Markup is `role="group"` with plain `<button>`s and no `aria-pressed`, so selection state is not exposed to assistive tech at all, and sighted users get a control that silently lies.

### 1.5 Broken — the EXAMPLE DATA banner undermines the trust it should build

The intent is right and the banner should stay. The execution works against it.

- **It wraps badly on mobile.** `.example-banner` is `display: inline-flex` with a `<strong>` that is allowed to shrink, so the label breaks across two lines as "EXAMPLE / DATA" while the sentence sets beside it. A disclaimer that looks accidental is read as accidental.
- **It scrolls away.** It sits inside the hero. Anyone who lands on `#leaderboard` — from the hero CTA, a shared link, or a search result — never sees it.
- **Wrong ARIA.** `role="status"` declares an `aria-live` polite region intended for dynamic updates. This is static page content. Use `role="note"`.
- **The `<table>` has no `<caption>`**, so the disclaimer is absent from the one context that matters most.
- **12 px label, 10.4 px row badges.** `.example-banner strong` is `0.75rem` and `.badge` is `0.65rem`. The site's honesty mechanism is set in its smallest type.

**The deeper trust problem is not the banner — it is the scaffolding copy around it.** The live site currently ships these strings publicly:

- "Cross-view toggles are stubs for v1."
- "Downloads placeholder — nothing to fetch yet."
- "Help & chat widget slot."
- "Open mail client (stub)"
- "Form does not POST to a backend yet — uses mailto as a temporary stub."
- "placeholder for a formal gift flow"

Honest is good; unfinished-sounding is not the same thing as honest. Saying "example data, not real results" is a credibility *asset* — a bench that labels its placeholders is a bench you can trust with real numbers later. Saying "slot", "stub", and "placeholder" six times tells a visitor they are looking at someone's build directory. Every one of these strings has an honest replacement that does not sound like a TODO. Exact replacements are in §4, step 9.

### 1.6 Broken — hierarchy and rhythm

- **Uniform section padding.** Every `.section` is `padding: 4rem 0`. Hero→Leaderboard stacks `2rem` + `4rem` = 96 px of dead space at all viewports. Nothing in the vertical rhythm tells you which sections matter.
- **Flat heading scale.** `h1` is `clamp(2.2rem, 6vw, 3.4rem)`, `h2` is `clamp(1.5rem, 3vw, 2rem)`, `h3` is `1.1rem`, body is `1rem`. The h3-to-body step is 1.1× — h3 barely registers as a heading. In the About section, four `h3`s stacked in one prose column read as bold paragraphs.
- **Empty right half of the desktop hero.** At 1440 px the 1080 px container centres, the lede is capped at `42rem`, and the entire right side of the fold is empty. The most valuable screen real estate on the site carries nothing.
- **Unbalanced card grids.** "Open source" is three `auto-fit` columns where Downloads holds two sentences and Install & run holds a code block — a ~180 px height delta with no visual compensation. "Sponsor & contact" is worse: `.cards.two` stretches the short Sponsor card to match the tall Contact form, producing ~190 px of empty card interior.
- **Clipped code block.** `.code-block` is `overflow-x: auto`, and at desktop the `git clone https://github.com/rapidstartup/…` line is cut mid-URL with no indicator. The one command a visitor is meant to copy is unreadable.
- **Footer is an afterthought.** `.footer-inner` is a single flex column: wordmark, a flat row of four muted links, one legal line. No grouping, no hierarchy, no visual separation from `.section` above it.
- **Third-party widget collides with content.** The VibeDash launcher renders as a fixed blue tab on the right viewport edge, clipped by the edge in both the owner's screenshot (overlapping the hero lede) and the 1440 px render. It is injected by an inline `<script>` in the middle of `<body>` that appends to `document.head` on page load — cost paid on first paint, for a control almost nobody uses on first visit.

### 1.7 Accessibility findings

Ordered by severity. Items 1–3 are functional blockers.

1. **Focus is effectively invisible site-wide.** The only focus rule in the entire stylesheet is `outline: 2px solid var(--accent-glow)` on form controls. `--accent-glow` is `#6ee7b726` — 15% alpha. Composited over `#0a0b0f` it lands near `#191f1e`, indistinguishable from the border. Links, buttons, nav items, and toggles have no focus rule at all and fall back to the UA default, which is low-contrast on a near-black background. Fails WCAG 2.4.7 and 2.4.11.
2. **Scrollable table region is not keyboard reachable** (§1.3). Fails WCAG 2.1.1.
3. **Touch targets under the 24×24 minimum** — nav links are ~20 px tall with zero padding. Fails WCAG 2.5.8.
4. **Toggle state is not exposed.** Radio-like buttons inside `role="group"` with no `aria-pressed` or `aria-checked`.
5. **`role="status"` on static content** (§1.5).
6. **Anchors land under the sticky header.** `html { scroll-behavior: smooth }` with no `scroll-margin-top` on any section — every in-page jump hides its own heading behind the header. Worse on mobile, where the header is 110 px.
7. **`scroll-behavior: smooth` is unconditional** — not gated behind `prefers-reduced-motion`.
8. **No skip link**, and `<main>` has no `id`. Keyboard users traverse the full nav on every jump.
9. **Table semantics incomplete** — no `<caption>`, no `scope` attributes on `<th>`.
10. **Type below the legibility floor** — `.badge` at 10.4 px, `.lb-table th` at 11.5 px.

**Contrast is measurably fine and should not be "fixed" blindly.** `--muted #8b93a7` on `--bg #0a0b0f` computes to **6.39:1**, and on `--bg-elev #12141c` to **5.97:1**. Both pass WCAG AA (4.5:1) at any size. Neither reaches AAA (7:1). The one weak pairing is the disabled "Payment links coming" button at **~4.35:1** — formally exempt under WCAG 1.4.3 because it is a disabled control, but it reads as broken UI, so §4 step 9 replaces the pattern rather than recolouring it.

### 1.8 Head / metadata gaps

No Open Graph tags, no Twitter card, no `og:image`. The site links `@lifeonautosite` and is built to be shared on X, where it will currently unfurl as a bare title and URL. Also missing: `rel="canonical"` (both jevbench.dev and jevbench.pages.dev serve HTTP 200 for identical content), `theme-color`, and `apple-touch-icon`.

---

## 2. Design refresh

Concrete direction. Every value below is a number you can paste.

### 2.1 Type scale

Replace ad-hoc `clamp()` and `rem` literals with one fluid scale on a 1.25 ratio at mobile widening to 1.333 at desktop. Endpoints are 360 px → 1440 px.

```css
:root {
  --step--2: clamp(0.6875rem, 0.67rem + 0.08vw, 0.75rem);   /* 11 → 12  micro-labels, badges */
  --step--1: clamp(0.8125rem, 0.79rem + 0.11vw, 0.875rem);  /* 13 → 14  captions, filter labels */
  --step-0:  clamp(1rem, 0.96rem + 0.18vw, 1.0625rem);      /* 16 → 17  body */
  --step-1:  clamp(1.125rem, 1.06rem + 0.3vw, 1.3125rem);   /* 18 → 21  lede, h4 */
  --step-2:  clamp(1.375rem, 1.24rem + 0.65vw, 1.75rem);    /* 22 → 28  h3 */
  --step-3:  clamp(1.75rem, 1.5rem + 1.2vw, 2.5rem);        /* 28 → 40  h2 */
  --step-4:  clamp(2.25rem, 1.72rem + 2.35vw, 3.5rem);      /* 36 → 56  h1 */

  --lh-tight: 1.1;   /* h1, h2 */
  --lh-snug: 1.25;   /* h3, lede */
  --lh-base: 1.6;    /* body */

  --tracking-tight: -0.03em;  /* h1, h2, wordmark */
  --tracking-wide: 0.08em;    /* mono eyebrows, table headers, badges */
}
```

Rules:
- **Nothing renders below 12 px.** Badges and table headers move from `--step--2` minimum 11 px up to 12 px by using `--step--2` with its floor raised — set `.badge { font-size: 0.75rem }` explicitly (12 px flat).
- **h3 jumps to `--step-2`** (22–28 px). The current 1.1× step over body is the single biggest hierarchy failure.
- **Mono is reserved for data and labels only**: eyebrows, table headers, rank, score, badges, code. Never body prose.
- **Body line-height 1.6** (up from 1.55) and cap prose at `68ch`.

### 2.2 Spacing system

4 px base unit, one token set, no arbitrary values in component CSS.

```css
:root {
  --space-1: 0.25rem;  /*  4 */
  --space-2: 0.5rem;   /*  8 */
  --space-3: 0.75rem;  /* 12 */
  --space-4: 1rem;     /* 16 */
  --space-5: 1.5rem;   /* 24 */
  --space-6: 2rem;     /* 32 */
  --space-7: 3rem;     /* 48 */
  --space-8: 4rem;     /* 64 */
  --space-9: 6rem;     /* 96 */

  --section-y: clamp(2.5rem, 6vw, 5rem);  /* 40 → 80, replaces flat 4rem */
  --gutter: clamp(1rem, 4vw, 2rem);       /* 16 → 32, replaces flat 1rem */

  --max: 68rem;        /* 1088px — prose and general content */
  --max-wide: 78rem;   /* 1248px — leaderboard section only */

  --header-h: 3.5rem;  /* 56px, single row at every breakpoint after §3.1 */
  --radius-sm: 6px;
  --radius: 10px;
  --radius-lg: 14px;
  --radius-pill: 999px;
}

.container { width: min(100% - (var(--gutter) * 2), var(--max)); margin-inline: auto; }
.container-wide { width: min(100% - (var(--gutter) * 2), var(--max-wide)); margin-inline: auto; }
.section { padding-block: var(--section-y); }
```

Vertical rhythm inside a section: heading → subhead `--space-2`; section-head → content `--space-6`; between sibling cards `--space-5`.

### 2.3 Navigation pattern

- **≥768 px:** current horizontal bar, unchanged in structure. Add `padding: 0.5rem 0.75rem` and `border-radius: var(--radius-sm)` to each `.nav a` so the hit area is 40 px tall and hover has a shape (`background: #ffffff0a`). Fixed header height `var(--header-h)`, one row, guaranteed.
- **<768 px:** logo + 44×44 hamburger only. Nav moves into a right-side sheet.
- **Drawer spec:** full-height, `width: min(20rem, 80vw)`, `background: var(--bg-elev)`, `border-left: 1px solid var(--border)`, slides in over a `#0a0b0fcc` scrim. Links are `--step-1`, stacked, `min-height: 44px`, separated by hairline rules. The Sponsor CTA is a full-width pill pinned at the bottom of the sheet — it gains prominence on mobile instead of losing it.
- **Behaviour:** `aria-expanded` / `aria-controls` on the trigger; Escape closes; focus moves into the sheet on open and returns to the trigger on close; background content receives `inert`; `overflow: hidden` on `<body>` while open; any link click closes. Transition `transform 200ms ease`, disabled under `prefers-reduced-motion`.
- **Active section highlight:** an `IntersectionObserver` setting `aria-current="page"` on the matching nav link, styled `color: var(--text)` with a 2 px `--accent` underline. Low cost, high orientation value on a single-page site.
- **Fix the wrong link:** nav "Leaderboard" currently points to `#home` (the hero) while the hero CTA points to `#leaderboard`. Nav "Leaderboard" must point to `#leaderboard`; the logo keeps `#home`.

### 2.4 Leaderboard: table at desktop, cards at mobile

Below 720 px the six-column table cannot work. Do not try to shrink it — change the layout.

**≥720 px — table, improved:**
- `.table-wrap` gets `tabindex="0"`, `role="region"`, `aria-label="Leaderboard results"`, and a visible `:focus-visible` ring.
- Remove `white-space: nowrap` from the Notes column only; keep it on rank, score, and badges.
- `position: sticky; top: 0` on `thead th` within the scroll container, `background: var(--bg-elev)`.
- Zebra striping via `tbody tr:nth-child(even) { background: #ffffff04 }`. Keep the existing `#6ee7b70a` hover.
- Column widths: `#` 4rem, Score 7rem, Category 8rem, the rest auto.
- Right-align Score, left-align everything else.
- Add `<caption class="table-caption">` carrying the example-data disclaimer (see §2.7).

**<720 px — card stack:**
Each row becomes a card. Rank and score occupy a header strip; the remaining fields become label/value pairs driven by `data-label` attributes written by `main.js`.

```css
@media (max-width: 719px) {
  .lb-table, .lb-table tbody, .lb-table tr, .lb-table td { display: block; width: 100%; }
  .lb-table thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .lb-table tr {
    background: var(--bg-elev);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: var(--space-4);
    margin-bottom: var(--space-3);
  }
  .lb-table td {
    display: flex;
    justify-content: space-between;
    gap: var(--space-4);
    align-items: baseline;
    border: 0;
    padding: var(--space-2) 0;
    white-space: normal;
  }
  .lb-table td::before {
    content: attr(data-label);
    font-family: var(--font-mono);
    font-size: var(--step--2);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--muted);
    flex: 0 0 auto;
  }
  .lb-table td.rank::before { content: none; }
  .table-wrap { border: 0; background: none; overflow: visible; padding: 0; }
}
```

This makes Category, Score, and Notes visible on mobile for the first time.

### 2.5 Filters

- Grid, not wrap: `display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: var(--space-4)`. Below 480 px force `1fr` so each select is full width.
- Every `select` gets `min-height: 44px` and `width: 100%`.
- Toggle group becomes a proper segmented control: `display: flex` with `flex: 1` children, full container width below 720 px, `min-height: 44px`, `border-radius: var(--radius-sm)` with `overflow: hidden`.
- **Mark the stubs honestly instead of faking function.** Latency and Cost get `disabled` + `aria-disabled="true"` + a `SOON` micro-badge, styled `opacity: 0.5; cursor: not-allowed`. Score gets `aria-pressed="true"`. A disabled control that says "soon" is trustworthy; an enabled control that does nothing is not.
- Add a live result count below the filter row — "Showing 7 of 7 example rows" — so filtering has visible feedback.

### 2.6 Cards

One card primitive, three variants, consistent internals.

```css
.card {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.card > :last-child { margin-top: auto; }   /* pins CTAs to the bottom edge */
.cards { display: grid; gap: var(--space-5); align-items: start; }
```

- `align-items: start` on the grid stops the short Sponsor card from stretching to the Contact form's height.
- `.card > :last-child { margin-top: auto }` aligns CTAs across cards of differing content length without fixed heights.
- Card heading uses `--step-2`, body `--step-0` in `--muted`.
- Hover on interactive cards only: `border-color: var(--border-strong)`, no transform, no shadow.
- **Code block fix:** `white-space: pre-wrap; overflow-wrap: anywhere` so the clone URL wraps instead of clipping, plus a copy button in the top-right of the block.

### 2.7 Example-data treatment

Three layers, so the disclaimer survives any entry point:

1. **Header strip** — a full-bleed bar directly under the sticky header: `background: var(--warn-bg)`, `border-bottom: 1px solid #fbbf2459`, `border-left: 3px solid var(--warn)`, `padding: var(--space-2) 0`, text at `--step--1`, `role="note"`. Content: `EXAMPLE DATA — the leaderboard shows demo placeholders. No runs have been scored yet.` The `<strong>` label gets `white-space: nowrap; flex-shrink: 0` so it never breaks across lines.
2. **Table caption** — `<caption>` on the leaderboard table repeating the disclaimer in `--muted` at `--step--1`, left-aligned above the header row. Always present with the data, including in screenshots of the table alone.
3. **Row badges** — keep, raised to 12 px.

Supporting changes that convert honesty into credibility rather than incompleteness:

- **Replace `—` in the score column with `Not scored`** in `--muted` at `--step--1`. An em dash reads as a rendering failure; words read as a deliberate state.
- **Add a bench-status line** above the table: `Harness v0.1 · 0 scored runs · 1 game (StarCraft II) · updated —`. Freshness and scope signals are what make a leaderboard believable. Even zeroes beat silence.
- **Drop the word "stub" from all user-facing copy** (exact strings in §4 step 9).

### 2.8 Desktop hero

Two columns at ≥960 px: `grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: var(--space-7); align-items: center`. Left column keeps eyebrow, h1, lede, and actions. Right column holds a bench-status card — harness version, scored runs, games covered, evidence store (Cloudflare R2), licence — set in mono as a compact definition list. It fills the empty half with substance and reinforces §2.7. Single column below 960 px, status card moves below the CTAs.

### 2.9 Footer

Three-column grid at ≥720 px, single column below, separated from the last section by `border-top: 1px solid var(--border)` and `padding-block: var(--space-7) var(--space-6)`.

- **Column 1 — brand:** `JB` mark, "JevBench" wordmark, one-line descriptor ("Open agent benchmarks. Games first."), and an `EXAMPLE DATA` chip.
- **Column 2 — Project:** Leaderboard, Open source, About, Downloads.
- **Column 3 — Community:** GitHub, X / @lifeonautosite, Support, Sponsor.
- Column headings in mono, `--step--2`, uppercase, `--tracking-wide`, `--muted`.
- Links at `--step--1`, `--muted`, `min-height: 40px` on mobile, hover `var(--accent)`.
- Bottom rule, then the legal line at `--step--2`: `© 2026 JevBench · jevbench.dev · Example leaderboard data only until live scoring ships.`
- Reserve `padding-bottom: 5rem` below 720 px so the floating support widget never sits on top of footer links.

---

## 3. Responsive fixes

Breakpoints, fixed: **480 / 720 / 960 / 1200**. Author mobile-first with `min-width` queries; the one exception is the leaderboard card stack in §2.4, which is cleaner as `max-width: 719px`. Note that the current bundle emits range syntax (`@media (width <= 720px)`) via Lightning CSS — supported in Chrome 104+, Safari 16.4+, Firefox 102+. Fine for the current audience; just be aware it is what you will see in `dist`, not what you wrote.

### 3.1 Header — eliminate the wrap entirely

Problem: nav needs ~390 px, has ~244 px at a 412 px viewport, wraps at approximately 540 px.

```css
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  min-height: var(--header-h);
}
.nav { display: none; }
.nav-toggle {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-right: -0.5rem;          /* optical alignment to the container edge */
  background: none;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--text);
}

@media (min-width: 768px) {
  .nav {
    display: flex;
    flex-wrap: nowrap;             /* never wrap — the drawer is the fallback */
    align-items: center;
    gap: var(--space-2);
  }
  .nav a { padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); }
  .nav-toggle { display: none; }
}
```

`flex-wrap: nowrap` is the load-bearing change: it makes wrap impossible by construction rather than by tuning font sizes until it happens to fit.

### 3.2 Drawer

```html
<button class="nav-toggle" type="button"
        aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav">
  <svg aria-hidden="true" …><!-- 3-line icon --></svg>
</button>

<div class="nav-scrim" data-nav-close hidden></div>
<nav id="mobile-nav" class="mobile-nav" aria-label="Main" hidden>
  <a href="#leaderboard">Leaderboard</a>
  <a href="#open-source">Open source</a>
  <a href="#about">About</a>
  <a href="#support">Support</a>
  <a href="#sponsor" class="btn btn-primary nav-drawer-cta">Sponsor</a>
</nav>
```

```css
.mobile-nav {
  position: fixed;
  inset: 0 0 0 auto;
  width: min(20rem, 80vw);
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: calc(var(--header-h) + var(--space-4)) var(--space-5) var(--space-6);
  background: var(--bg-elev);
  border-left: 1px solid var(--border);
  transform: translateX(100%);
  transition: transform 200ms ease;
}
.mobile-nav[data-open] { transform: translateX(0); }
.mobile-nav a {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding-inline: var(--space-2);
  font-size: var(--step-1);
  color: var(--text);
  border-bottom: 1px solid var(--border);
}
.nav-drawer-cta { margin-top: auto; justify-content: center; border-bottom: 0; }
.nav-scrim { position: fixed; inset: 0; z-index: 55; background: #0a0b0fcc; }
body[data-nav-open] { overflow: hidden; }

@media (prefers-reduced-motion: reduce) {
  .mobile-nav { transition: none; }
  html { scroll-behavior: auto; }
}
@media (min-width: 768px) {
  .mobile-nav, .nav-scrim { display: none; }
}
```

### 3.3 Touch targets

Global floor, applied once:

```css
.nav a, .footer-links a, .toggle, .btn, .filter select,
.contact-form input, .contact-form button, .nav-toggle {
  min-height: 44px;
}
.btn { padding: 0.7rem 1.25rem; }
.toggle { padding: 0.65rem 1rem; }
.filter select { padding: 0.7rem 2rem 0.7rem 0.85rem; }
```

Inline text links inside prose are exempt — the 44 px rule applies to standalone controls.

### 3.4 Focus visibility

Delete the `--accent-glow` outline (15% alpha, invisible) and add one global rule:

```css
:where(a, button, select, input, textarea, [tabindex]):focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
.filter select:focus { outline: none; }        /* superseded by :focus-visible */
.filter select:focus-visible { border-color: var(--accent-dim); }
```

`--accent #6ee7b7` on `--bg #0a0b0f` is a very high-contrast ring — comfortably clears the 3:1 non-text requirement.

### 3.5 Anchor offset under the sticky header

```css
:target, section[id] { scroll-margin-top: calc(var(--header-h) + var(--space-4)); }
```

With the drawer in place the header is a fixed 56 px at every width, so a single value is correct everywhere. Without §3.1 this would need a separate mobile value for the 110 px two-row header — another reason to fix the header first.

### 3.6 Gutters and overflow

```css
:root { --gutter: clamp(1rem, 4vw, 2rem); }
html, body { overflow-x: clip; }
```

`overflow-x: clip` (not `hidden`, which would break `position: sticky` on the header) as a safety net against horizontal scroll from a stray wide child. Verify with `document.documentElement.scrollWidth === document.documentElement.clientWidth` at 320, 360, 390, 412, and 768 px.

### 3.7 Support widget collision

The VibeDash launcher is `position: fixed` on the right edge and currently overlaps hero and card content. Do not restyle a third-party element you do not control. Instead:

- Move the injector from the inline `<body>` script into `src/support.js` and load it on `requestIdleCallback` (with a `setTimeout(…, 2000)` fallback for Safari), so it costs nothing at first paint.
- Reserve space with `--widget-safe-inset: 4.5rem` and apply `padding-bottom` to the footer below 720 px.
- Keep the in-page "Get help" button as the primary support affordance so the site works even if vibedash.app is unreachable.

### 3.8 Mobile verification matrix

| Width | Must be true |
|---|---|
| 320 | No horizontal scroll. Hamburger visible. Hero h1 does not overflow. |
| 360 | Leaderboard renders as cards; Score and Notes both visible. |
| 390 | Example-data strip is one line or wraps cleanly with `EXAMPLE DATA` unbroken. |
| 412 | Header is exactly one row, ~56 px. Reproduces the owner's screenshot as fixed. |
| 768 | Horizontal nav appears, single row, no wrap. Table returns. |
| 1024 | Table columns all visible without scroll. |
| 1440 | Hero is two columns; right rail populated. |

---

## 4. Update plan

Assumes Vite vanilla: `index.html` at repo root, `src/main.js`, `src/style.css`, `public/` for static assets, `npm run dev` / `npm run build` → `dist/`.

Execute in order. Steps 1–5 are the critical path — they fix everything visible in the owner's screenshot. Steps 6–11 are the refresh. Steps 12–14 are polish and ship.

---

**Step 1 — Establish the token layer**
*Files:* `src/style.css`
Replace the `:root` block with the full token set from §2.1 and §2.2 (type steps, spacing scale, radii, `--header-h`, `--max` / `--max-wide`, line-heights, tracking). Keep every existing colour token unchanged. Update `.container` to use `--gutter`, add `.container-wide`, change `.section` to `padding-block: var(--section-y)`.
*Acceptance:* Site builds and renders with no layout regression at 1440 px. Section padding is visibly tighter on mobile (40 px) and looser on desktop (80 px). No hard-coded `rem` spacing values remain in `:root`.

---

**Step 2 — Header: kill the wrap, add the drawer**
*Files:* `index.html`, `src/style.css`, new `src/nav.js`
Add the hamburger button, scrim, and `#mobile-nav` markup from §3.2. Apply the CSS from §3.1 and §3.2. Write `src/nav.js` handling open/close, `aria-expanded`, Escape, focus move in and restore out, `inert` on `<main>`/`<header>` content, `body[data-nav-open]` scroll lock, and close-on-link-click. Import it from `src/main.js`. **Also fix the nav "Leaderboard" href from `#home` to `#leaderboard`.**
*Acceptance:* At 412 px the header is a single ~56 px row with logo and hamburger only. At 768 px the horizontal nav appears on one row and does not wrap at any width up to 2560 px. Drawer opens and closes via click, Escape, scrim, and link selection. Tab order stays inside the open drawer. Background does not scroll while open. Nav "Leaderboard" scrolls to the table, not the hero.

---

**Step 3 — Leaderboard responsive rebuild**
*Files:* `index.html`, `src/main.js`, `src/style.css`
Add `data-label` attributes to every generated `<td>` in the row template (`data-label="Use case"`, `"Category"`, `"Score"`, `"Notes"`). Add `scope="col"` to each `<th>`. Add `tabindex="0"`, `role="region"`, `aria-label="Leaderboard results"` to `.table-wrap`. Apply the `<720px` card-stack CSS and the `≥720px` table improvements from §2.4. Remove `white-space: nowrap` from the Notes cell. Replace the `—` score value with `Not scored`.
*Acceptance:* At 360 px every row shows rank, model, use case, category, score, and notes with no horizontal scroll. At 1024 px the table renders with all six columns, a sticky header row, and zebra striping. Tab reaches the scroll region at 768 px and arrow keys scroll it. No cell displays a bare em dash.

---

**Step 4 — Filters and toggles**
*Files:* `index.html`, `src/main.js`, `src/style.css`
Convert `.filters` to the grid from §2.5. Set `min-height: 44px` on selects and toggles. Add `disabled aria-disabled="true"` plus a `SOON` badge to the Latency and Cost toggles; add `aria-pressed="true"` to Score. Add a `<p id="result-count">` below the filters and update it in `main.js` on every render.
*Acceptance:* At 412 px each select is full-width and 44 px tall; the toggle group spans the container in one row. Latency and Cost cannot be activated by mouse or keyboard and are visibly marked SOON. Changing any filter updates the count text. Filtering to an empty set shows the existing "No example rows match these filters." message and a count of zero.

---

**Step 5 — Example-data trust layer**
*Files:* `index.html`, `src/style.css`, `src/main.js`
Move `.example-banner` out of the hero to a full-bleed strip immediately below `</header>`, restyled per §2.7 with `role="note"` replacing `role="status"` and `white-space: nowrap; flex-shrink: 0` on the `<strong>`. Add `<caption>` to the leaderboard table with the same disclaimer. Raise `.badge` to `0.75rem` and `.lb-table th` to `0.75rem`. Add the bench-status line above the table.
*Acceptance:* The disclaimer is visible on load at every viewport and remains visible when landing directly on `#leaderboard`. "EXAMPLE DATA" never breaks across two lines at 320 px. No text on the page renders below 12 px. A screen reader announces the caption when entering the table.

---

**Step 6 — Global focus and motion**
*Files:* `src/style.css`
Remove the `--accent-glow` outline rules. Add the `:focus-visible` rule from §3.4, the `scroll-margin-top` rule from §3.5, and the `prefers-reduced-motion` block from §3.2. Add `overflow-x: clip` from §3.6.
*Acceptance:* Tabbing from the address bar through the whole page shows a clearly visible green ring on every interactive element. Every in-page anchor lands with its heading fully below the header. With OS "reduce motion" enabled, scrolling is instant and the drawer does not animate. `scrollWidth === clientWidth` at 320 px.

---

**Step 7 — Skip link and landmarks**
*Files:* `index.html`, `src/style.css`
Add `<a class="skip-link" href="#main">Skip to content</a>` as the first child of `<body>`, `id="main"` on `<main>`, and `aria-label` on the header and footer `<nav>`s. Skip link is visually hidden until `:focus`, then pinned top-left with an accent background.
*Acceptance:* First Tab press on a fresh load reveals the skip link; activating it moves focus into `<main>`. Axe DevTools reports zero landmark or region violations.

---

**Step 8 — Typography and hierarchy pass**
*Files:* `src/style.css`
Map every heading and text rule onto the §2.1 steps: `h1` → `--step-4`, `h2` → `--step-3`, `h3` → `--step-2`, `.lede` → `--step-1`, body → `--step-0`, captions and filter labels → `--step--1`, mono micro-labels → `--step--2`. Set `line-height` and `letter-spacing` from the tokens. Cap prose blocks at `68ch`.
*Acceptance:* No `font-size` literal outside `:root` except the 12 px badge floor. At 1440 px the h1→h2→h3→body steps are each visibly distinct. In the About section, `h3` headings are unmistakably headings rather than bold paragraphs.

---

**Step 9 — Copy pass: remove scaffolding language**
*Files:* `index.html`
Apply these exact replacements:

| Current | Replacement |
|---|---|
| "Filter by use case, model family, and game vs non-game. Cross-view toggles are stubs for v1." | "Filter by use case, model family, and game vs non-game. Latency and cost views arrive with live scoring." |
| "Downloads placeholder — nothing to fetch yet." | "No releases published yet. Packaged builds, sample replays, and scored run artifacts will land here." |
| "Help & chat widget slot." | "Questions about the harness, scoring, or submitting a run." |
| "Open mail client (stub)" | "Send message" |
| "Form does not POST to a backend yet — uses mailto as a temporary stub." | "Opens your email client. A hosted form is coming." |
| "placeholder for a formal gift flow" | "Get in touch to discuss compute sponsorship." |
| Disabled "Payment links coming" button | Non-button note: "Sponsorship links open soon." + an enabled ghost link "Reach out on X →" |
| Section heading "Support" subhead | keep heading; use the new subhead above |

Keep every example-data disclaimer exactly as specified in step 5 — those stay.
*Acceptance:* The words "stub", "slot", and "placeholder" appear nowhere in rendered page text. No disabled button remains on the page. Every section reads as a deliberate current state rather than an unfinished one.

---

**Step 10 — Cards, hero rail, and footer**
*Files:* `index.html`, `src/style.css`
Apply the `.card` primitive and `align-items: start` from §2.6. Fix `.code-block` with `white-space: pre-wrap; overflow-wrap: anywhere` and add a copy-to-clipboard button. Build the desktop hero two-column layout and bench-status card from §2.8. Rebuild the footer as the three-column grid from §2.9 with `--widget-safe-inset` bottom padding.
*Acceptance:* At 1440 px the Sponsor and Contact cards have no more than 24 px of trailing empty space. The `git clone` command is fully readable with no clipping at every width from 320 px up, and the copy button places it on the clipboard. The hero right rail is populated at ≥960 px and stacks below the CTAs under 960 px. The footer shows three labelled groups at ≥720 px and one column below.

---

**Step 11 — Support widget: lazy load and decouple**
*Files:* `index.html`, new `src/support.js`
Remove the inline `<script>` from `<body>`. Move the VibeDash injector into `src/support.js`, invoked via `requestIdleCallback` with a 2 s `setTimeout` fallback. Wrap in try/catch with an `onerror` handler so a vibedash.app outage cannot break the page. Keep the existing project ID and webhook URL as they are — they are already public in the shipped bundle and are not secrets. Add an in-page "Get help" button in the Support section as the primary affordance.
*Acceptance:* First paint contains no request to vibedash.app; the request fires after the page is idle. Blocking vibedash.app in DevTools leaves the page fully functional with no console errors. The floating launcher does not overlap footer links at 412 px.

---

**Step 12 — Head, metadata, and social preview**
*Files:* `index.html`, `public/og.png`, `public/apple-touch-icon.png`
Add `og:title`, `og:description`, `og:type=website`, `og:url=https://jevbench.dev/`, `og:image=https://jevbench.dev/og.png`, `twitter:card=summary_large_image`, `twitter:site=@lifeonautosite`, `<link rel="canonical" href="https://jevbench.dev/">`, `<meta name="theme-color" content="#0a0b0f">`, and the apple-touch-icon link. Create a 1200×630 `og.png` using the site's own palette: `#0a0b0f` ground, the JB mark, "JevBench" in Plex Sans, "Agent benchmarks. Games first." beneath, and the grid motif at low opacity.
*Acceptance:* Pasting https://jevbench.dev into a post composer renders a large-image card with the correct title, description, and artwork. `view-source` shows exactly one canonical tag pointing at the apex domain.

---

**Step 13 — Self-host fonts**
*Files:* `package.json`, `index.html`, `src/main.js`
Replace the two `<link rel="preconnect">` tags and the Google Fonts stylesheet with `@fontsource-variable/ibm-plex-sans` and `@fontsource/ibm-plex-mono` imported from `src/main.js`. Vite fingerprints and self-hosts the woff2 files.
*Acceptance:* The network panel shows zero requests to `fonts.googleapis.com` or `fonts.gstatic.com`. No layout shift from font swap. Rendered type is visually identical to the current site.

---

**Step 14 — Verify, then deploy**
*Files:* none — verification gate
Walk the §3.8 matrix in Chrome DevTools device emulation. Run Lighthouse on mobile; require Accessibility ≥ 95 and Best Practices ≥ 95. Run axe DevTools; require zero critical or serious violations. Tab the entire page top to bottom with the drawer both open and closed.

Then ship:

```bash
npm run build                  # → dist/
npx wrangler pages deploy dist --project-name=jevbench
```

If the Cloudflare Pages project `jevbench` is connected to the Git repository, pushing to the production branch deploys automatically and the manual `wrangler` call is unnecessary — do one or the other, not both. Custom domain **jevbench.dev** is already bound to the project; no DNS change is required by this work.

Two deployment notes:

- **Do not add a `_redirects` rule to force jevbench.pages.dev → jevbench.dev.** `public/_redirects` applies to *every* Cloudflare Pages deployment including preview builds, so a blanket host redirect would break preview URLs. The `rel="canonical"` tag from step 12 is the correct fix for the duplicate-content concern. If a hard redirect is genuinely wanted later, configure it as a zone-level Redirect Rule, not a `_redirects` file.
- **Add `public/_headers`** for cache and security policy:

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
```

*Acceptance:* https://jevbench.dev serves the new build over HTTPS. The 412 px header is one row in a real Android Chrome session. Lighthouse mobile Accessibility ≥ 95. Hashed asset filenames differ from `index-yfeRDvmG.js` and `index-CjGGJ3cf.css`, confirming a fresh deploy rather than a cached one.

---

### Suggested commit sequence

One commit per step keeps review and rollback clean:

```
1  chore(css): add type scale, spacing, and layout tokens
2  fix(nav): single-row header with mobile drawer; correct leaderboard anchor
3  fix(leaderboard): card stack under 720px, accessible scroll region above
4  fix(filters): responsive grid, 44px targets, honest stub toggles
5  feat(trust): persistent example-data strip, table caption, bench status
6  a11y: visible focus ring, scroll-margin, reduced-motion support
7  a11y: skip link and landmark labels
8  style(type): apply fluid scale and restore heading hierarchy
9  copy: remove scaffolding language from public-facing text
10 style(layout): card primitive, hero rail, three-column footer
11 perf(support): lazy-load VibeDash widget, decouple from first paint
12 feat(meta): Open Graph, Twitter card, canonical, theme-color
13 perf(fonts): self-host IBM Plex via fontsource
14 chore(deploy): Cloudflare Pages headers
```

---

## 5. Out of scope

Explicitly **not** part of this pass. Do not start any of these while executing §4.

- **Real leaderboard data.** Scores stay as example placeholders. No scoring pipeline, no results ingestion, no R2 video wiring, no API. The visual work must look correct with placeholder rows and must not assume real numbers ever arrive in this pass.
- **PayPal, crypto, or any payment addresses.** No wallet addresses, no PayPal links, no Stripe, no checkout. Sponsorship stays as contact-only copy. Publishing a payment address is a product and trust decision that belongs to the owner, not to a design refresh.
- **Fortnite** — and any game beyond StarCraft II. The use-case filter keeps its current options. No new games, no new categories, no new icons or artwork.
- **Backend for the contact form.** Remains `mailto:`. No serverless function, no form provider, no database.
- **Rebuilding VibeDash or changing the VibeDash integration contract.** The widget keeps its existing project ID and webhook URL; only its *loading strategy* changes (step 11).
- **Framework migration.** Stay on Vite vanilla. No React, no Svelte, no Tailwind, no component library. Every fix above is plain HTML, CSS, and ES modules by design.
- **Auth, accounts, submissions, or a CMS.**
- **Light theme.** Dark-only. The token layer makes a future light theme possible; building one is not this pass.
- **Analytics or cookie consent.**
- **Secrets of any kind.** No API keys, tokens, or `.env` values enter the repo or this document. The VibeDash project ID and webhook URL referenced in step 11 are already public in the shipped client bundle and are not treated as secrets.