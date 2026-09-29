# JevBench (jevbench.dev)

Public agent benchmark leaderboard — static site for Cloudflare Pages.

## Pages

| Page | Purpose |
|---|---|
| `/` | The pitch: top of the board, arenas, records, method, roadmap |
| `/leaderboard` | Full standings by game and bench version, run evidence |
| `/use-cases` | Where a decision model fits, plus the fit check |
| `/about` | Method, open source, support, sponsor, contact |

Shared header and footer live in `partials/` and are inlined by `vite.config.js`.

## Data

Every number on the site is derived in `src/bench.js` from the generated run files
(`src/sc2-runs.js`, `src/minecraft-runs.js`). Regenerate those with the scripts in
`scripts/` and the standings, records and headline counts update on the next build.
Decision latency, run time and guide spend are read from each run's controller log.

Hand-written content in `src/bench.js`: model names and pricing (`MODELS`), models
awaiting a first scored game (`QUEUE`) and the roadmap (`ROADMAP`).

## Dev

```bash
npm install
npm run dev
```

Run stills and video are proxied from production in dev.

## Build

```bash
npm run build
```

Output: `dist/` (static).

## Deploy

```bash
export XDG_CACHE_HOME=/workspace/.cache
npx wrangler pages deploy dist --project-name=jevbench --commit-dirty=true
```

No secrets in this repo. Cloudflare credentials stay in the deploy environment only.
