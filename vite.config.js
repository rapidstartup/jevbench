import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';

const PAGES = ['index', 'leaderboard', 'use-cases', 'about'];

/**
 * Shared markup + build-time numbers.
 *   <!--@include header-->  inlines partials/header.html
 *   {{wins}}                stamps a value from TOKENS in src/bench.js
 * Nav links carrying data-page="<page>" get aria-current on that page.
 */
function sitePages() {
  const partial = (name) => readFileSync(resolve(import.meta.dirname, 'partials', `${name}.html`), 'utf8');

  return {
    name: 'jevbench-site-pages',
    transformIndexHtml: {
      order: 'pre',
      async handler(html, ctx) {
        const page = ctx.path.replace(/^\//, '').replace(/\.html$/, '') || 'index';
        const bench = await import(`${pathToFileURL(resolve(import.meta.dirname, 'src/bench.js')).href}?t=${Date.now()}`);
        return html
          .replace(/<!--@include ([\w-]+)-->/g, (_, name) => partial(name))
          .replaceAll(`data-page="${page}"`, `data-page="${page}" aria-current="page"`)
          .replace(/\{\{(\w+)\}\}/g, (match, key) => bench.TOKENS[key] ?? match);
      },
    },
    configureServer(server) {
      // Cloudflare Pages serves /leaderboard from leaderboard.html; mirror that in dev.
      server.middlewares.use((req, _res, next) => {
        const [path, query] = (req.url || '').split('?');
        const name = path.replace(/^\/|\/$/g, '');
        if (name !== 'index' && PAGES.includes(name)) {
          req.url = `/${name}.html${query ? `?${query}` : ''}`;
        }
        next();
      });
      server.watcher.add(resolve(import.meta.dirname, 'partials'));
      server.watcher.on('change', (file) => {
        if (file.replaceAll('\\', '/').includes('/partials/')) server.ws.send({ type: 'full-reload' });
      });
    },
  };
}

export default defineConfig({
  plugins: [sitePages()],
  server: {
    proxy: {
      // Run stills and video live in R2 behind the production media endpoint.
      '/api/media': { target: 'https://jevbench.dev', changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      input: Object.fromEntries(PAGES.map((name) => [name, resolve(import.meta.dirname, `${name}.html`)])),
    },
  },
});
