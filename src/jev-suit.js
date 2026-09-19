/**
 * "Would Jev suit your use case?" — guarded multi-step chat in a modal.
 * Calls /api/jev-suit only; never sends API keys from the browser.
 */

const MAX_NOTE = 280;
const API = "/api/jev-suit";
const COPY_FLASH_MS = 1600;

const ICONS = {
  clipboard: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="6" y="5.5" width="9" height="11.5" rx="1.5" stroke="currentColor" stroke-width="1.75" />
      <path d="M8 5.25V4.4c0-.5.4-.9.9-.9h2.2c.5 0 .9.4.9.9v.85" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
      <path d="M8.25 9.5h4.5M8.25 12.25h3.25" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
    </svg>`,
  markdown: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5.5 3.75h6.1L15.25 7.4v8.85H5.5V3.75z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" />
      <path d="M11.6 3.75V7.4h3.65" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" />
      <path d="M8 11.1L6.6 13 8 14.9M12 11.1L13.4 13 12 14.9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
    </svg>`,
  check: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4.5 10.4l3.6 3.6 7.4-8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
    </svg>`,
};

const copyTimers = new WeakMap();

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function postSuit(body) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok || !data) {
    const msg =
      (data && data.error) ||
      `Request failed (${res.status}). Please try again.`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

function appendBubble(logEl, role, html) {
  const div = document.createElement("div");
  div.className = `jev-suit-bubble jev-suit-bubble--${role}`;
  div.innerHTML = html;
  logEl.appendChild(div);
  const scroller = logEl.closest("[data-jev-suit-chat]") || logEl;
  scroller.scrollTop = scroller.scrollHeight;
  return div;
}

function setBusy(root, busy) {
  root.dataset.busy = busy ? "1" : "0";
  root.querySelectorAll("button, textarea, input").forEach((el) => {
    if (el.dataset.keepEnabled === "1") return;
    el.disabled = !!busy;
  });
}

function copyStatusEl(fromEl) {
  return fromEl.closest("dialog")?.querySelector("[data-jev-suit-copy-status]");
}

function flashCopyState(btn, ok) {
  const label = btn.getAttribute("data-label") || btn.getAttribute("aria-label") || "";
  if (label) btn.setAttribute("data-label", label);
  btn.dataset.copied = ok ? "ok" : "err";
  btn.setAttribute("aria-label", ok ? "Copied" : "Copy failed");
  btn.setAttribute("title", ok ? "Copied" : "Copy failed");
  const live = copyStatusEl(btn);
  if (live) live.textContent = ok ? "Copied" : "Copy failed";

  const prev = copyTimers.get(btn);
  if (prev) window.clearTimeout(prev);
  const timer = window.setTimeout(() => {
    btn.removeAttribute("data-copied");
    if (label) {
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
    }
    if (live && (live.textContent === "Copied" || live.textContent === "Copy failed")) {
      live.textContent = "";
    }
    copyTimers.delete(btn);
  }, COPY_FLASH_MS);
  copyTimers.set(btn, timer);
}

async function copyText(btn, text) {
  try {
    await navigator.clipboard.writeText(text);
    flashCopyState(btn, true);
  } catch {
    flashCopyState(btn, false);
  }
}

function iconCopyButton({ kind, icon, title }) {
  return `<button
      type="button"
      class="jev-suit-icon-btn"
      data-copy-kind="${escapeHtml(kind)}"
      data-label="${escapeHtml(title)}"
      title="${escapeHtml(title)}"
      aria-label="${escapeHtml(title)}"
    >
      <span class="jev-suit-icon-btn-default">${icon}</span>
      <span class="jev-suit-icon-btn-done">${ICONS.check}</span>
    </button>`;
}

function renderResult(root, data) {
  const result = root.querySelector("[data-jev-suit-result]");
  const log = root.querySelector("[data-jev-suit-log]");
  result.hidden = false;
  result.innerHTML = `
    <h4>Suitability summary</h4>
    <p class="jev-suit-summary">${escapeHtml(data.summary)}</p>
    <div class="jev-suit-prompt-block">
      <div class="jev-suit-prompt-head">
        <span>Coding tool prompt</span>
        <div class="jev-suit-copy-row">
          ${iconCopyButton({
            kind: "plain",
            icon: ICONS.clipboard,
            title: "Copy plain text for Cursor / OpenCode / Claude Code",
          })}
          ${iconCopyButton({
            kind: "md",
            icon: ICONS.markdown,
            title: "Copy Markdown",
          })}
        </div>
      </div>
      <pre class="code-block jev-suit-prompt-pre" data-prompt-preview></pre>
    </div>
    <p class="muted small">Jev returned typed judgments only; this summary and prompt were assembled in code. No API keys leave the server.</p>
    <button type="button" class="btn btn-ghost jev-suit-restart" data-jev-suit-restart>Start over</button>
  `;

  const pre = result.querySelector("[data-prompt-preview]");
  pre.textContent = data.promptPlain;

  result.querySelector('[data-copy-kind="plain"]').addEventListener("click", (e) => {
    copyText(e.currentTarget, data.promptPlain);
  });
  result.querySelector('[data-copy-kind="md"]').addEventListener("click", (e) => {
    copyText(e.currentTarget, data.promptMarkdown);
  });
  result.querySelector("[data-jev-suit-restart]").addEventListener("click", () => {
    startFlow(root);
  });

  appendBubble(
    log,
    "bot",
    `<p>Done — summary and a coding-tool prompt are ready below. Copy plain or Markdown into Cursor, OpenCode, or Claude Code.</p>`
  );
}

function renderQuestion(root, question, progress, answers) {
  const controls = root.querySelector("[data-jev-suit-controls]");
  const progressEl = root.querySelector("[data-jev-suit-progress]");
  progressEl.textContent = `Question ${progress.answered + 1} of ${progress.total}`;

  const opts = question.options
    .map(
      (o) =>
        `<button type="button" class="jev-suit-opt" data-value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</button>`
    )
    .join("");

  const note = question.allowNote
    ? `<label class="jev-suit-note-label">
        <span class="muted small">${escapeHtml(question.notePlaceholder || "Optional note")}</span>
        <textarea maxlength="${MAX_NOTE}" rows="2" data-jev-suit-note placeholder="${escapeHtml(question.notePlaceholder || "")}"></textarea>
      </label>`
    : "";

  controls.innerHTML = `
    <p class="jev-suit-q-prompt">${escapeHtml(question.prompt)}</p>
    ${question.hint ? `<p class="muted small">${escapeHtml(question.hint)}</p>` : ""}
    <div class="jev-suit-opts" role="group" aria-label="Answers">${opts}</div>
    ${note}
  `;

  controls.querySelectorAll(".jev-suit-opt").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-value");
      const noteEl = controls.querySelector("[data-jev-suit-note]");
      const noteVal = noteEl ? noteEl.value.trim().slice(0, MAX_NOTE) : "";
      const nextAnswers = { ...answers, [question.id]: value };
      if (question.noteKey && noteVal) {
        nextAnswers[question.noteKey] = noteVal;
      }
      await submitAnswer(root, nextAnswers, question, value, noteVal);
    });
  });

  controls.querySelector(".jev-suit-opt")?.focus();
}

async function submitAnswer(root, answers, question, value, noteVal) {
  const log = root.querySelector("[data-jev-suit-log]");
  const label =
    question.options.find((o) => o.value === value)?.label || value;
  appendBubble(
    log,
    "user",
    `<p>${escapeHtml(label)}${noteVal ? ` — <em>${escapeHtml(noteVal)}</em>` : ""}</p>`
  );

  setBusy(root, true);
  const errEl = root.querySelector("[data-jev-suit-error]");
  errEl.hidden = true;
  root.querySelector("[data-jev-suit-controls]").innerHTML =
    `<p class="muted jev-suit-loading" aria-live="polite">Thinking…</p>`;

  try {
    const data = await postSuit({ step: "answer", answers });
    if (data.done) {
      root.querySelector("[data-jev-suit-controls]").innerHTML = "";
      root.querySelector("[data-jev-suit-progress]").textContent = "Complete";
      renderResult(root, data);
      root.querySelector("[data-copy-kind='plain']")?.focus();
      return;
    }
    appendBubble(log, "bot", `<p>${escapeHtml(data.question.prompt)}</p>`);
    renderQuestion(root, data.question, data.progress, answers);
  } catch (e) {
    errEl.hidden = false;
    errEl.textContent = e.message || "Something went wrong.";
    root.querySelector("[data-jev-suit-controls]").innerHTML =
      `<button type="button" class="btn btn-primary" data-jev-suit-retry>Retry</button>`;
    const retry = root.querySelector("[data-jev-suit-retry]");
    retry.addEventListener("click", () => {
      submitAnswer(root, answers, question, value, noteVal);
    });
    retry.focus();
  } finally {
    setBusy(root, false);
  }
}

async function startFlow(root) {
  const log = root.querySelector("[data-jev-suit-log]");
  const result = root.querySelector("[data-jev-suit-result]");
  const errEl = root.querySelector("[data-jev-suit-error]");
  const controls = root.querySelector("[data-jev-suit-controls]");
  log.innerHTML = "";
  result.hidden = true;
  result.innerHTML = "";
  errEl.hidden = true;
  errEl.textContent = "";
  controls.innerHTML = `<p class="muted jev-suit-loading" aria-live="polite">Loading…</p>`;
  setBusy(root, true);

  try {
    const data = await postSuit({ step: "start", answers: {} });
    appendBubble(
      log,
      "bot",
      `<p>I'll ask a few short questions, then Jev will return typed judgments. Code here turns those into a summary and a prompt you can paste into your coding tool.</p>`
    );
    appendBubble(log, "bot", `<p>${escapeHtml(data.question.prompt)}</p>`);
    renderQuestion(root, data.question, data.progress, {});
  } catch (e) {
    errEl.hidden = false;
    errEl.textContent = e.message || "Could not start.";
    controls.innerHTML = `<button type="button" class="btn btn-primary" data-jev-suit-retry-start>Try again</button>`;
    const retry = root.querySelector("[data-jev-suit-retry-start]");
    retry.addEventListener("click", () => {
      startFlow(root);
    });
    retry.focus();
  } finally {
    setBusy(root, false);
  }
}

function clickedBackdrop(dialog, event) {
  const rect = dialog.getBoundingClientRect();
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}

export function initJevSuit() {
  const dialog = document.getElementById("jev-suit-dialog");
  const startBtn = document.querySelector("[data-jev-suit-begin]");
  if (!dialog || !startBtn) return;

  let lastFocus = null;
  let started = false;

  function lockScroll(on) {
    if (on) document.body.setAttribute("data-jev-suit-open", "");
    else document.body.removeAttribute("data-jev-suit-open");
  }

  function openDialog() {
    lastFocus = document.activeElement;
    lockScroll(true);
    if (!dialog.open) dialog.showModal();
    if (!started) {
      started = true;
      startFlow(dialog);
    }
  }

  function closeDialog() {
    if (dialog.open) dialog.close();
  }

  startBtn.addEventListener("click", openDialog);
  dialog.querySelector("[data-jev-suit-close]")?.addEventListener("click", closeDialog);

  dialog.addEventListener("click", (event) => {
    if (clickedBackdrop(dialog, event)) closeDialog();
  });

  dialog.addEventListener("close", () => {
    lockScroll(false);
    const restore =
      lastFocus && typeof lastFocus.focus === "function" ? lastFocus : startBtn;
    restore.focus();
  });
}
