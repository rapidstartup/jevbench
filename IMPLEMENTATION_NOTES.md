# JevBench visual update — implementation notes

Executed `JEVBENCH_VISUAL_UPDATE_PLAN.md` steps 1–13 against this Vite vanilla site. `npm run build` succeeds (`dist/`).

## Files changed

| File | What |
|---|---|
| `index.html` | Skip link, mobile drawer + hamburger, Sponsor remains visible in the header under 768px, EXAMPLE DATA strip (`role="note"`), hero status rail, leaderboard caption/`scope`, honest filter/support/sponsor/contact copy, three-column footer, OG/canonical/theme-color |
| `src/style.css` | Token layer (type, space, radii, `--header-h`), single-row header, drawer, card-stack leaderboard &lt;720px, filter grid, 44px targets, solid `--accent` `:focus-visible`, sticky opaque trust strip, footer, reduced-motion |
| `src/main.js` | Card `data-label`s, `Not scored` (no bare em dash), result count, copy button, no fake view-toggle behaviour |
| `src/nav.js` | Drawer open/close, Escape, scrim, focus trap, `inert`, scroll lock, `aria-current` observer |
| `src/support.js` | VibeDash loader on `requestIdleCallback` + 2s fallback, try/catch + `onerror` |
| `public/_headers` | Cache + nosniff / referrer / deny-framing |
| `public/og.png` | 1200×630 social card (JB mark, JevBench, “Agent benchmarks. Games first.”) |
| `public/apple-touch-icon.png` | 180×180 |
| `package.json` | `@fontsource-variable/ibm-plex-sans`, `@fontsource/ibm-plex-mono` |

## Verified at ~412px

- Header is one row: logo + Sponsor + hamburger (~56px).
- Drawer slides in; Sponsor CTA pinned at the bottom of the sheet.
- Leaderboard is cards: Use case, Category, **Score** (`Not scored`), Notes all visible. No clipped columns.
- EXAMPLE DATA label does not wrap; strip uses `role="note"` and stays under the sticky header.
- Latency/Cost are disabled + SOON; Score is `aria-pressed`.
- Copy: no user-facing “stub” / “slot” / scaffolding “placeholder” (disclaimer still says “demo placeholders” per the plan).

## Remains

- **Deploy** — `npx wrangler pages deploy dist --project-name=jevbench` (or push). Not run here.
- **Step 14 checks** — Lighthouse / axe / real Android Chrome session not run in this pass.
- **Out of scope (unchanged)** — real scores, PayPal/crypto addresses, contact backend, VibeDash contract, extra games.
- VibeDash floating launcher can still overlap content after idle load; the plan forbids restyling it. Footer has `--widget-safe-inset` on small screens; in-page **Get help** is the primary support control.

## Small deviations from the spec

- `--step--2` floor raised to 12px so nothing renders below 12px.
- EXAMPLE DATA strip is sticky + opaque so `#leaderboard` landings still show it.
- Mobile header keeps a visible Sponsor pill (plan said logo + hamburger only; the request said Sponsor stays visible).
