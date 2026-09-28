/** Shared page chrome: fonts, navigation, scroll reveals, count-up numerals. */

import "@fontsource-variable/ibm-plex-sans/wght.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";

import "./nav.js";

document.documentElement.classList.add("js");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Hide a still that fails to load so the striped placeholder shows instead. */
export function stillImg(url, alt) {
  return `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" onerror="this.remove()" />`;
}

function countUp(el) {
  const target = Number(String(el.dataset.count).replace(/,/g, ""));
  if (!Number.isFinite(target)) return;
  const node = el.firstChild && el.firstChild.nodeType === Node.TEXT_NODE ? el.firstChild : null;
  if (!node) return;
  const format = (n) => Math.round(n).toLocaleString("en-US");
  if (reduceMotion.matches) {
    node.textContent = format(target);
    return;
  }
  const duration = 1600;
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 4);
    node.textContent = format(target * eased);
    if (t < 1) requestAnimationFrame(tick);
  };
  node.textContent = "0";
  requestAnimationFrame(tick);
}

/** Reveal `.reveal` blocks and run `[data-count]` numerals as they scroll into view. */
export function observeMotion(root = document) {
  const targets = root.querySelectorAll(".reveal:not(.in), [data-count]:not([data-counted])");
  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("in"));
    return;
  }
  // A tab opened in the background gets no observer callbacks; never leave it blank.
  let observed = false;
  window.setTimeout(() => {
    if (!observed) targets.forEach((el) => el.classList.add("in"));
  }, 2500);

  const observer = new IntersectionObserver(
    (entries) => {
      observed = true;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        if (el.classList.contains("reveal")) el.classList.add("in");
        if (el.dataset.count != null && !el.dataset.counted) {
          el.dataset.counted = "1";
          countUp(el);
        }
        observer.unobserve(el);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
  );
  targets.forEach((el) => observer.observe(el));
}

export function initCopyButtons(root = document) {
  root.querySelectorAll("[data-copy]").forEach((btn) => {
    const original = btn.textContent;
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.getAttribute("data-copy") || "");
        btn.textContent = "Copied";
      } catch {
        btn.textContent = "Copy failed";
      }
      window.setTimeout(() => {
        btn.textContent = original;
      }, 1600);
    });
  });
}
