/**
 * "Would Jev suit your use case?" — guarded multi-step chat on #use-cases.
 * Calls /api/jev-suit only; never sends API keys from the browser.
 */

const MAX_NOTE = 280;
const API = "/api/jev-suit";

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
  logEl.scrollTop = logEl.scrollHeight;
  return div;
}

function setBusy(root, busy) {
  root.dataset.busy = busy ? "1" : "0";
  root.querySelectorAll("button, textarea, input").forEach((el) => {
    if (el.dataset.keepEnabled === "1") return;
    el.disabled = !!busy;
  });
}

async function copyText(btn, text) {
  const original = btn.textContent;
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = "Copied";
  } catch {
    btn.textContent = "Copy failed";
  }
  window.setTimeout(() => {
    btn.textContent = original;
  }, 1600);
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
          <button type="button" class="btn btn-ghost jev-suit-copy" data-copy-kind="plain" title="Copy plain text for Cursor / OpenCode / Claude Code">Copy plain</button>
          <button type="button" class="btn btn-ghost jev-suit-copy" data-copy-kind="md" title="Copy Markdown">Copy Markdown</button>
        </div>
      </div>
      <pre class="code-block jev-suit-prompt-pre" data-prompt-preview></pre>
    </div>
    <p class="muted small">Jev returned typed judgments only; this summary and prompt were assembled in code. No API keys leave the server.</p>
    <button type="button" class="btn btn-ghost" data-jev-suit-restart>Start over</button>
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
      return;
    }
    appendBubble(log, "bot", `<p>${escapeHtml(data.question.prompt)}</p>`);
    renderQuestion(root, data.question, data.progress, answers);
  } catch (e) {
    errEl.hidden = false;
    errEl.textContent = e.message || "Something went wrong.";
    root.querySelector("[data-jev-suit-controls]").innerHTML =
      `<button type="button" class="btn btn-primary" data-jev-suit-retry>Retry</button>`;
    root.querySelector("[data-jev-suit-retry]").addEventListener("click", () => {
      submitAnswer(root, answers, question, value, noteVal);
    });
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
    root.querySelector("[data-jev-suit-retry-start]").addEventListener("click", () => {
      startFlow(root);
    });
  } finally {
    setBusy(root, false);
  }
}

export function initJevSuit() {
  const root = document.getElementById("jev-suit");
  if (!root) return;
  const startBtn = root.querySelector("[data-jev-suit-begin]");
  startBtn?.addEventListener("click", () => {
    startBtn.hidden = true;
    root.querySelector("[data-jev-suit-chat]").hidden = false;
    startFlow(root);
  });
}
