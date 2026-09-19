const PROJECT_ID = "f2868665-6d44-43e5-b6f0-7036af020709";
const SCRIPT_SRC = "https://vibedash.app/embed-vanilla.js";
const WEBHOOK_URL = `https://vibedash.app/.netlify/functions/submit-ticket/${PROJECT_ID}`;

function loadWidget() {
  try {
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => {
      try {
        if (window.VibeDashFeedback) {
          window.VibeDashFeedback.init({
            projectId: PROJECT_ID,
            webhookUrl: WEBHOOK_URL,
          });
        }
      } catch (err) {
        console.warn("VibeDash widget failed to initialise.", err);
      }
    };
    s.onerror = () => {
      console.warn("VibeDash widget failed to load.");
    };
    document.head.appendChild(s);
  } catch (err) {
    console.warn("VibeDash widget skipped.", err);
  }
}

const schedule =
  typeof window.requestIdleCallback === "function"
    ? (cb) => window.requestIdleCallback(cb, { timeout: 2000 })
    : (cb) => window.setTimeout(cb, 2000);

schedule(loadWidget);
