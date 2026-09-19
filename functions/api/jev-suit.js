/**
 * POST /api/jev-suit — Would Jev suit your use case?
 * Server-owned question script + OpenRouter Decisions (Jev). No transcript storage.
 * Secrets: OPENROUTER_API_KEY (required), JEV_MODEL (optional).
 */

const MAX_BODY_BYTES = 8 * 1024;
const MAX_TEXT_LEN = 280;
const ALLOWED_ANSWER_KEYS = new Set([
  "domain",
  "domainNote",
  "aiUsage",
  "aiUsageNote",
  "decisionType",
  "latencyCost",
]);

const OFFTOPIC_RE =
  /(ignore (previous|all) instructions|jailbreak|system prompt|api[_ ]?key|secret|password|token|exfiltrat|bomb|weapon|csam|child.?porn)/i;

/** Fixed pattern enum matching JevBench pack + Greg addendum (short ids). */
const PATTERN_CRITERIA = {
  "uc-17": "Real-time game bot on structured state (Doom-shaped)",
  "uc-18": "High-cardinality Choice (Wikiracing-shaped)",
  "uc-19": "Ultrafast browser / UI agent",
  "uc-20": "Emulator / RTS / drone control loop",
  "uc-6": "Cascade: cheap Jev → code → specialist LLM",
  "uc-10": "Dynamic tool-definition unfurl",
  "uc-1": "Support ticket department routing",
  "uc-2": "Urgency / time-sensitivity gate",
  "uc-4": "Speculative fan-out triage",
  "uc-5": "Confidence-gated human-in-the-loop",
  "uc-11": "Trust & safety / policy checks",
  "uc-12": "Verify / score / judge LLM outputs",
  "uc-13": "Recommendations & relevance ranking",
  "uc-15": "RAG retrieve-then-judge",
  "uc-16": "Bulk document classification",
  "uc-g1": "Agent spend firewall",
  "uc-g2": "Self-healing tool calls",
  "uc-g3": "Irreversible action detector",
  "uc-g4": "Dynamic permission engine",
  "uc-g5": "Agent branch pruning",
  "uc-g6": "Production incident controller",
  "uc-g7": "Live negotiation policy",
  "uc-g8": "Autonomous refund desk",
  "uc-g9": "Realtime marketplace dispatch",
  "uc-g10": "Confidence-based human queues",
  other: "None of the pack patterns fit well — suggest a custom Choice/Score/Noul design",
};

const PATTERN_TITLES = {
  "uc-17": "Real-time DOOM-style game bot",
  "uc-18": "Wikiracing / high-cardinality Choice",
  "uc-19": "Ultrafast browser agent",
  "uc-20": "Emulator / RTS / drone control",
  "uc-6": "Cascade routing (Jev → code → LLM)",
  "uc-10": "Dynamic tool-definition unfurl",
  "uc-1": "Support ticket routing",
  "uc-2": "Urgency gate",
  "uc-4": "Speculative fan-out triage",
  "uc-5": "Confidence-gated HITL",
  "uc-11": "Trust & safety checks",
  "uc-12": "Judge / verify LLM outputs",
  "uc-13": "Relevance ranking",
  "uc-15": "RAG passage filter",
  "uc-16": "Bulk classification",
  "uc-g1": "Agent spend firewall",
  "uc-g2": "Self-healing tool calls",
  "uc-g3": "Irreversible action detector",
  "uc-g4": "Dynamic permission engine",
  "uc-g5": "Agent branch pruning",
  "uc-g6": "Production incident controller",
  "uc-g7": "Live negotiation policy",
  "uc-g8": "Autonomous refund desk",
  "uc-g9": "Realtime marketplace dispatch",
  "uc-g10": "Confidence-based human queues",
  other: "Custom typed judgment design",
};

const QUESTIONS = [
  {
    id: "domain",
    prompt: "What product domain are you building in?",
    hint: "Pick the closest fit. You can add a short note.",
    options: [
      { value: "games", label: "Games / interactive sim" },
      { value: "saas", label: "SaaS / B2B product" },
      { value: "support", label: "Support / CX" },
      { value: "agent", label: "Agent / automation platform" },
      { value: "marketplace", label: "Marketplace / ops" },
      { value: "other", label: "Other" },
    ],
    allowNote: true,
    notePlaceholder: "Optional: one-line product context (max 280 chars)",
  },
  {
    id: "aiUsage",
    prompt: "How do you use AI / LLMs today?",
    hint: "Jev is a typed decision layer — not a chat generator.",
    options: [
      { value: "none", label: "Not using AI yet" },
      { value: "chat", label: "Chat / free-text LLM" },
      { value: "classify", label: "Classification / routing heuristics" },
      { value: "agents", label: "Multi-step agents / tools" },
      { value: "mixed", label: "Mix of LLM + rules" },
    ],
    allowNote: true,
    notePlaceholder: "Optional: stack note (max 280 chars)",
  },
  {
    id: "decisionType",
    prompt: "What kind of decision do you need most?",
    hint: "Maps to Choice / Score / Noul primitives.",
    options: [
      { value: "route", label: "Route / pick one option" },
      { value: "rank", label: "Rank / score candidates" },
      { value: "verify", label: "Verify / gate / policy check" },
      { value: "control", label: "Real-time control loop" },
    ],
    allowNote: false,
  },
  {
    id: "latencyCost",
    prompt: "How sensitive are you to latency and cost?",
    hint: "System One targets sub-second typed judgments.",
    options: [
      { value: "realtime", label: "Real-time (<500ms matters)" },
      { value: "interactive", label: "Interactive UX (1–3s OK)" },
      { value: "batch", label: "Batch / cheap volume" },
      { value: "unsure", label: "Not sure yet" },
    ],
    allowNote: false,
  },
];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: CORS_HEADERS,
  });
}

function sanitizeAnswers(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!ALLOWED_ANSWER_KEYS.has(k)) continue;
    if (typeof v !== "string") continue;
    const t = v.trim().slice(0, MAX_TEXT_LEN);
    if (!t) continue;
    if (OFFTOPIC_RE.test(t)) return { __refuse: true };
    out[k] = t;
  }
  return out;
}

function nextMissing(answers) {
  for (const q of QUESTIONS) {
    if (!answers[q.id]) return q;
  }
  return null;
}

function questionPayload(q, answers) {
  return {
    ok: true,
    done: false,
    question: {
      id: q.id,
      prompt: q.prompt,
      hint: q.hint,
      options: q.options,
      allowNote: !!q.allowNote,
      notePlaceholder: q.notePlaceholder || "",
      noteKey: q.allowNote ? `${q.id}Note` : null,
    },
    progress: {
      answered: QUESTIONS.filter((x) => answers[x.id]).length,
      total: QUESTIONS.length,
    },
  };
}

function suitabilityLabel(choice) {
  const map = {
    strong_fit: "Strong fit",
    partial_fit: "Partial fit",
    weak_fit: "Weak fit",
    not_a_fit: "Not a fit",
  };
  return map[choice] || choice;
}

function nextStepLabel(choice) {
  const map = {
    try_demo_pattern: "Try a matching pack pattern on JevBench / a small prototype",
    read_typesafe_docs: "Read TypeSafe System One docs and the typesafe-ai skill",
    design_custom: "Design a custom Choice/Score/Noul for your state",
    stick_with_llm: "Keep generative LLMs for prose; use Jev only if you add typed gates later",
  };
  return map[choice] || choice;
}

function buildSummary(answers, judgments) {
  const suit = judgments.suitability?.choice || "partial_fit";
  const pattern = judgments.best_pattern?.choice || "other";
  const conf =
    typeof judgments.suitability?.confidence === "number"
      ? judgments.suitability.confidence
      : typeof judgments.best_pattern?.confidence === "number"
        ? judgments.best_pattern.confidence
        : null;
  const fitNoul =
    typeof judgments.jev_fit_noul?.noul === "number"
      ? judgments.jev_fit_noul.noul
      : null;
  const next = judgments.next_step?.choice || "read_typesafe_docs";

  const parts = [
    `${suitabilityLabel(suit)} for Jev (System One).`,
    `Best-fit pack pattern: ${PATTERN_TITLES[pattern] || pattern} (${pattern}).`,
  ];
  if (fitNoul != null) {
    parts.push(`Fit probability (Noul): ${(fitNoul * 100).toFixed(0)}%.`);
  }
  if (conf != null) {
    parts.push(`Choice confidence: ${(conf * 100).toFixed(0)}%.`);
  }
  parts.push(`Suggested next step: ${nextStepLabel(next)}.`);
  parts.push(
    `Context: domain=${answers.domain}; AI today=${answers.aiUsage}; decision=${answers.decisionType}; latency/cost=${answers.latencyCost}.`
  );
  return parts.join(" ");
}

function buildPrompts(answers, judgments) {
  const pattern = judgments.best_pattern?.choice || "other";
  const patternTitle = PATTERN_TITLES[pattern] || pattern;
  const suit = suitabilityLabel(judgments.suitability?.choice || "partial_fit");
  const next = judgments.next_step?.choice || "read_typesafe_docs";

  const md = [
    `# Implement a Jev (TypeSafe System One) pattern`,
    ``,
    `## Context from JevBench suitability check`,
    `- Suitability: **${suit}**`,
    `- Best-fit pack id: \`${pattern}\` — ${patternTitle}`,
    `- Product domain: ${answers.domain}${answers.domainNote ? ` (${answers.domainNote})` : ""}`,
    `- Current AI usage: ${answers.aiUsage}${answers.aiUsageNote ? ` (${answers.aiUsageNote})` : ""}`,
    `- Decision type needed: ${answers.decisionType}`,
    `- Latency/cost sensitivity: ${answers.latencyCost}`,
    `- Suggested next step: ${nextStepLabel(next)}`,
    ``,
    `## Instructions for the coding agent`,
    `1. Run \`use /typesafe-ai\` (or read the installed skill at \`.agents/skills/typesafe-ai/SKILL.md\`).`,
    `2. Read live TypeSafe docs via https://docs.typesafe.ai/llms.txt — prefer \`.md\` page URLs.`,
    `3. Jev returns **typed judgments** (Choice / Score / Noul), **not** free text. Assemble any user-facing copy in **code** from judgments + templates.`,
    `4. Implement the **${patternTitle}** pattern (\`${pattern}\`) for this app:`,
    `   - Keep rules, arithmetic, lookups, and side effects in code.`,
    `   - Put only the narrow semantic judgment in Jev questions over structured \`state\`.`,
    `   - Ask independent questions in one Decisions call when useful (speculative fan-out).`,
    `5. Call OpenRouter Decisions API \`POST https://openrouter.ai/api/alpha/decisions\` with model \`typesafe/jev-1.13\` (or \`~typesafe/jev-latest\`), using a **server-side** \`OPENROUTER_API_KEY\` — never expose keys in the browser.`,
    `6. Handle confidence: escalate uncertain / irreversible actions to a human or slower LLM.`,
    `7. Do not store raw user transcripts unless the product already requires it; prefer ephemeral state.`,
    ``,
    `## Success criteria`,
    `- Working server path that returns typed answers and drives app behavior in code.`,
    `- No free-text generation from Jev; prompts/summaries are template-filled.`,
    `- Secrets stay server-side.`,
  ].join("\n");

  const plain = [
    `Implement a Jev (TypeSafe System One) pattern.`,
    ``,
    `Context from JevBench suitability check:`,
    `- Suitability: ${suit}`,
    `- Best-fit pack id: ${pattern} — ${patternTitle}`,
    `- Product domain: ${answers.domain}${answers.domainNote ? ` (${answers.domainNote})` : ""}`,
    `- Current AI usage: ${answers.aiUsage}${answers.aiUsageNote ? ` (${answers.aiUsageNote})` : ""}`,
    `- Decision type needed: ${answers.decisionType}`,
    `- Latency/cost sensitivity: ${answers.latencyCost}`,
    `- Suggested next step: ${nextStepLabel(next)}`,
    ``,
    `Instructions for the coding agent:`,
    `1. use /typesafe-ai (or read .agents/skills/typesafe-ai/SKILL.md).`,
    `2. Read https://docs.typesafe.ai/llms.txt and relevant cookbook pages.`,
    `3. Jev returns typed Choice/Score/Noul judgments — NOT free text. Assemble copy in code from judgments + templates.`,
    `4. Implement the ${patternTitle} pattern (${pattern}) for this app. Keep rules/arithmetic/side effects in code; Jev owns the narrow judgment over structured state.`,
    `5. Call OpenRouter POST https://openrouter.ai/api/alpha/decisions with model typesafe/jev-1.13 (or ~typesafe/jev-latest). Use server-side OPENROUTER_API_KEY only.`,
    `6. Use confidence to escalate uncertain or irreversible actions.`,
    `7. Do not store transcripts unless the product already requires it.`,
    ``,
    `Success: working server path, typed answers drive behavior, no Jev free-text generation, secrets stay server-side.`,
  ].join("\n");

  return { promptMarkdown: md, promptPlain: plain };
}

async function callJev(env, answers) {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) {
    const err = new Error("OPENROUTER_API_KEY not configured");
    err.status = 503;
    throw err;
  }
  const model = env.JEV_MODEL || "typesafe/jev-1.13";

  const state = {
    product_domain: answers.domain,
    product_domain_note: answers.domainNote || null,
    current_ai_usage: answers.aiUsage,
    current_ai_note: answers.aiUsageNote || null,
    decision_type_needed: answers.decisionType,
    latency_cost_sensitivity: answers.latencyCost,
    about_jev:
      "Jev is TypeSafe System One: returns typed Choice/Score/Noul judgments with probabilities, not free-text generation. Best when code owns the workflow and needs fast semantic decisions.",
  };

  const questions = {
    suitability: {
      type: "choice",
      instructions:
        "Given this product context, how well does Jev (typed Choice/Score/Noul decisions, not chat) suit their use case?",
      criteria: {
        strong_fit:
          "Clear need for fast typed routing, ranking, verification, or control; generative LLM alone is a poor fit for the core judgment.",
        partial_fit:
          "Jev can help for a gate, router, or ranker beside an existing LLM, but is not the whole solution.",
        weak_fit:
          "Only marginally useful; most work is open-ended generation or unstructured chat.",
        not_a_fit:
          "Primary need is free-text generation, creative writing, or tasks with no bounded options.",
      },
    },
    best_pattern: {
      type: "choice",
      instructions:
        "Which JevBench pack pattern (including Greg Isenberg product-shaped ids) best matches what they should build first?",
      criteria: PATTERN_CRITERIA,
    },
    jev_fit_noul: {
      type: "noul",
      instructions:
        "Is Jev a good fit for the core decision they described (typed judgment over application state)?",
      criteria: {
        true: "Yes — a bounded Choice, Score, or Noul over structured state would help.",
        false: "No — they mainly need free-text generation or pure deterministic code.",
      },
    },
    next_step: {
      type: "choice",
      instructions: "What should they do next to try Jev productively?",
      criteria: {
        try_demo_pattern:
          "Prototype the closest pack pattern with a small Decisions call.",
        read_typesafe_docs:
          "Read TypeSafe docs / typesafe-ai skill before coding.",
        design_custom:
          "Sketch a custom question set over their app state.",
        stick_with_llm:
          "Stay on generative LLMs for now; revisit Jev when they have bounded decisions.",
      },
    },
  };

  const res = await fetch("https://openrouter.ai/api/alpha/decisions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://jevbench.dev",
      "X-OpenRouter-Title": "JevBench",
    },
    body: JSON.stringify({
      model,
      state,
      questions,
    }),
  });

  if (!res.ok) {
    const err = new Error(`OpenRouter Decisions failed (${res.status})`);
    err.status = res.status >= 500 ? 502 : 502;
    throw err;
  }

  const data = await res.json();
  return {
    answers: data.answers || {},
    model: data.model || model,
    usage: data.usage
      ? {
          input_tokens: data.usage.input_tokens,
          output_tokens: data.usage.output_tokens,
        }
      : null,
  };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const rawText = await request.text();
    if (rawText.length > MAX_BODY_BYTES) {
      return json(413, { ok: false, error: "Request too large." });
    }

    let body;
    try {
      body = rawText ? JSON.parse(rawText) : {};
    } catch {
      return json(400, { ok: false, error: "Invalid JSON." });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json(400, { ok: false, error: "Invalid body." });
    }

    const step = typeof body.step === "string" ? body.step : "start";
    if (!["start", "answer", "evaluate"].includes(step)) {
      return json(400, { ok: false, error: "Unknown step." });
    }

    const answers = sanitizeAnswers(body.answers || {});
    if (answers && answers.__refuse) {
      return json(400, {
        ok: false,
        error: "That input is off-topic or not allowed. Stick to your product use case.",
      });
    }
    if (answers === null) {
      return json(400, { ok: false, error: "Invalid answers." });
    }

    // Refuse secret-hunting / jailbreak in free-form notes already covered; also refuse empty evaluate.
    if (step === "start") {
      return json(200, questionPayload(QUESTIONS[0], {}));
    }

    const missing = nextMissing(answers);
    if (step === "answer") {
      if (missing) {
        return json(200, questionPayload(missing, answers));
      }
      // Fall through to evaluate when complete
    }

    if (missing) {
      return json(400, {
        ok: false,
        error: "Answer all questions before evaluating.",
        question: questionPayload(missing, answers).question,
        progress: questionPayload(missing, answers).progress,
      });
    }

    const jev = await callJev(env, answers);
    const judgments = jev.answers;
    const summary = buildSummary(answers, judgments);
    const { promptMarkdown, promptPlain } = buildPrompts(answers, judgments);

    const judgmentsMeta = {
      model: jev.model,
      suitability: judgments.suitability
        ? {
            choice: judgments.suitability.choice,
            confidence: judgments.suitability.confidence,
          }
        : null,
      best_pattern: judgments.best_pattern
        ? {
            choice: judgments.best_pattern.choice,
            confidence: judgments.best_pattern.confidence,
            title: PATTERN_TITLES[judgments.best_pattern.choice] || null,
          }
        : null,
      jev_fit_noul:
        typeof judgments.jev_fit_noul?.noul === "number"
          ? judgments.jev_fit_noul.noul
          : null,
      next_step: judgments.next_step
        ? { choice: judgments.next_step.choice }
        : null,
      usage: jev.usage,
    };

    return json(200, {
      ok: true,
      done: true,
      summary,
      promptMarkdown,
      promptPlain,
      judgmentsMeta,
    });
  } catch (e) {
    const status = e && e.status ? e.status : 500;
    return json(status >= 400 && status < 600 ? status : 500, {
      ok: false,
      error:
        status === 503
          ? "Suitability check is temporarily unavailable."
          : "Could not complete suitability check. Try again shortly.",
    });
  }
}

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") return onRequestOptions();
  if (context.request.method === "POST") return onRequestPost(context);
  return json(405, { ok: false, error: "Method not allowed." });
}
