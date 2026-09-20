const toggle = document.querySelector(".nav-toggle");
const drawer = document.getElementById("mobile-nav");
const scrim = document.querySelector(".nav-scrim");
const main = document.getElementById("main");
const footer = document.querySelector(".site-footer");
if (!toggle || !drawer || !scrim) {
  // Header markup missing — skip drawer behaviour.
} else {
  let lastFocus = null;
  let closeTimer = 0;
  drawer.inert = true;

  const inertTargets = [main, footer].filter(Boolean);

  function focusables() {
    return [toggle, ...drawer.querySelectorAll('a[href], button:not([disabled])')];
  }

  function setInert(on) {
    inertTargets.forEach((el) => {
      el.inert = on;
    });
  }

  function isOpen() {
    return drawer.hasAttribute("data-open");
  }

  function openNav() {
    lastFocus = document.activeElement;
    window.clearTimeout(closeTimer);
    scrim.hidden = false;
    drawer.inert = false;
    drawer.removeAttribute("aria-hidden");
    drawer.setAttribute("data-open", "");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    document.body.setAttribute("data-nav-open", "");
    setInert(true);
    const first = drawer.querySelector("a[href]");
    (first || drawer).focus();
  }

  function closeNav({ restore = true } = {}) {
    if (!isOpen()) return;
    drawer.removeAttribute("data-open");
    drawer.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    document.body.removeAttribute("data-nav-open");
    setInert(false);
    const finish = () => {
      scrim.hidden = true;
      drawer.inert = true;
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      finish();
    } else {
      closeTimer = window.setTimeout(finish, 200);
    }
    if (restore) {
      (lastFocus || toggle).focus();
    }
  }

  toggle.addEventListener("click", () => {
    if (isOpen()) closeNav();
    else openNav();
  });

  scrim.addEventListener("click", () => closeNav());

  drawer.querySelectorAll("a[href]").forEach((link) => {
    link.addEventListener("click", () => closeNav({ restore: false }));
  });

  document.querySelector(".logo")?.addEventListener("click", () => {
    closeNav({ restore: false });
  });

  document.addEventListener("keydown", (e) => {
    if (!isOpen()) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeNav();
      return;
    }
    if (e.key !== "Tab") return;
    const items = focusables().filter((el) => el && !el.closest("[hidden]"));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      closeNav({ restore: false });
    }
  });
}

const sectionIds = ["home", "leaderboard", "use-cases", "open-source", "about", "support", "sponsor"];
const navLinks = [
  ...document.querySelectorAll('.nav a[href^="#"], .mobile-nav a[href^="#"]'),
];

const sections = sectionIds
  .map((id) => document.getElementById(id))
  .filter(Boolean);

if (sections.length && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const href = `#${visible.target.id}`;
      navLinks.forEach((a) => {
        if (a.getAttribute("href") === href && href !== "#home") {
          a.setAttribute("aria-current", "page");
        } else {
          a.removeAttribute("aria-current");
        }
      });
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.6] }
  );
  sections.forEach((section) => observer.observe(section));
}
