# JevBench (jevbench.dev)

Public agent benchmark leaderboard — static site for Cloudflare Pages.

## Dev

```bash
npm install
npm run dev
```

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
