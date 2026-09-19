# JevBench use-cases modal UI plan (Opus-5 review — salvaged)

**Date:** 20 Sep 2026 PT  
**Source:** Claude Opus 5 cloud agent bc-509dfb48… (errored before PR; analysis recovered from transcript)  
**Live:** https://jevbench.dev/#use-cases  
**Constraint:** Keep `POST /api/jev-suit` unchanged.

## What’s wrong (screenshot)

1. Interactive chat sits **mid-stream** at the top of Use cases and pushes the pack below the fold.
2. **Copy plain / Copy Markdown** are text ghost buttons; click mutates `textContent` to “Copied”, which breaks width and a second click can capture the wrong label.
3. Summary / prompt block contrast is weak; no clear dismiss/collapse; “Start over” is easy to miss.
4. Chat log max-height scrolls away context of earlier answers.

## Target UX

1. Use-cases section leads with pack + a compact **CTA card** (“Check if Jev suits your use case” / primary button).
2. CTA opens a **native `<dialog>` modal** (`showModal`) containing the existing Q&A → summary → copy flow.
3. Modal: focus trap + Escape + backdrop click close; restore focus to CTA; body scroll lock via `data-jev-suit-open` (separate from nav drawer).
4. Copy actions = **icon buttons** with `title` + `aria-label` hover/accessible names; brief checkmark state via `data-copied` / `aria-live`, **do not** replace icon label text permanently.
5. Polish: clearer hierarchy, mint accent on CTA, better summary contrast, modal chrome matching site cards.

## Iconography (inline SVG, match nav hamburger stroke style)

| Action | Icon | Hover / aria |
|---|---|---|
| Open CTA | sparkle or arrow-in-square | “Open suitability check” |
| Copy plain | clipboard | “Copy plain text for Cursor / OpenCode / Claude Code” |
| Copy Markdown | file-code / markdown hash | “Copy Markdown” |
| Close modal | x | “Close” |
| Copied (temp) | check | “Copied” |

## Files to touch

- `index.html` — CTA shell; move chat into `<dialog id="jev-suit-dialog">`; keep `data-*` hooks.
- `src/jev-suit.js` — open/close dialog; wire begin → modal; icon copy without mutating labels; Escape/backdrop.
- `src/style.css` — CTA card, dialog/backdrop, icon buttons, scroll lock, look/feel polish for use-cases.
- `src/main.js` — only if init order needs change.

## Acceptance

- [ ] No mid-stream chat on the page before CTA click
- [ ] Modal opens/closes correctly; pack remains visible behind scrim
- [ ] Icon copy buttons with hover titles; copy still works; no label-mutation bug
- [ ] API unchanged; dumb-user flow still reaches summary + prompts
- [ ] Deployed to jevbench.dev; mobile usable

## Implementation order

1. Restructure HTML: CTA + empty dialog with same data hooks as today.
2. Update `jev-suit.js` for dialog open on begin; keep step/API logic.
3. Replace text copy buttons with icon buttons + copied state.
4. CSS for dialog, CTA, icons, use-cases polish.
5. Build + `wrangler pages deploy`; smoke CTA → 4 answers → copy.
