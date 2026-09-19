/**
 * Jev use-case pack: top-20 (X Researcher) + Greg Isenberg 10 product-shaped (19 Sep 2026 PT).
 * Vendor/demo numbers are directional — not certified bench scores.
 * Tranche order: Games (P0) → Platform (P1) → Product-shaped (Greg) → Non-game (rest).
 */

export const USE_CASES = [
  {
    id: "uc-17",
    num: 17,
    title: "Real-time DOOM bot (structured game state)",
    tranche: "games",
    priority: "P0",
    category: "game",
    writeup:
      "Official TypeSafe fun demo: reactive Doom agent on structured game-state (not pixels) demonstrating real-time System One decisions; team joked about ~10 queries/sec cost. Highly relevant to game harnesses.",
    links: [
      { href: "https://typesafe.ai/blog/introducing-system-one-models-and-jev", label: "TypeSafe blog" },
    ],
  },
  {
    id: "uc-18",
    num: 18,
    title: "Wikiracing high-cardinality link choice",
    tranche: "games",
    priority: "P0",
    category: "game",
    writeup:
      "At each Wikipedia page choose among hundreds–thousands of links toward a target; shows high-cardinality Choice (up to 255; higher via two-stage score-then-choose) without hallucinated URLs.",
    links: [
      { href: "https://typesafe.ai/blog/introducing-system-one-models-and-jev", label: "TypeSafe blog" },
    ],
  },
  {
    id: "uc-19",
    num: 19,
    title: "Ultrafast browser agent (flight booking)",
    tranche: "games",
    priority: "P0",
    category: "nongame",
    writeup:
      "browser-use/jev-ultrafast: page → numbered element table; one Jev call picks operation + target; small LLM only for TYPE_TEXT. Author-reported Zürich→London on Google Flights in ~7.1s / ~$0.0039 (directional). Speculative fan-out over actions.",
    links: [
      { href: "https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e", label: "Practical guide" },
      { href: "https://github.com/browser-use/jev-ultrafast", label: "jev-ultrafast" },
    ],
  },
  {
    id: "uc-20",
    num: 20,
    title: "Emulator / RTS / drone game-adjacent control loops",
    tranche: "games",
    priority: "P0",
    category: "game",
    writeup:
      "Cluster of launch-week game/control demos: Super Mario (RAM→object JSON), StarCraft shareware mission, drone tactical judgment ~2.5Hz advisory-only, computer-use OCR→Jev action pick, market-maker ~300ms blocks. Pattern: keep physics/safety/arithmetic in code; Jev owns the narrow judgment.",
    links: [
      { href: "https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e", label: "Practical guide" },
      { href: "https://github.com/fhshaik/typesafe-mario", label: "typesafe-mario" },
      { href: "https://github.com/phyous/tsai-sc", label: "tsai-sc" },
      { href: "https://github.com/RomanSlack/jev-drone", label: "jev-drone" },
      { href: "https://github.com/awlevin/typesafe-computer-use", label: "computer-use" },
      { href: "https://github.com/jarrodwatts/jev-trader", label: "jev-trader" },
      { href: "https://github.com/AbdelStark/awesome-typesafe", label: "awesome-typesafe" },
    ],
  },
  {
    id: "uc-6",
    num: 6,
    title: "Cascade: cheap Jev → code → specialist LLM",
    tranche: "platform",
    priority: "P1",
    category: "nongame",
    writeup:
      "Jev classifies intent/complexity; simple paths stay pure code; hard paths call a specialist LLM; edge cases escalate to humans. Positions Jev as the front door, not an LLM replacement.",
    links: [
      { href: "https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e", label: "Practical guide" },
    ],
  },
  {
    id: "uc-10",
    num: 10,
    title: "Dynamic tool-definition unfurl",
    tranche: "platform",
    priority: "P1",
    category: "nongame",
    writeup:
      "Pre-LLM Jev decides which tool schemas to expose this turn, reducing tool/context burden on the main model and improving tool-calling behavior on weaker models.",
    links: [
      { href: "https://x.com/1374854868175888384/status/2100003037150683593", label: "Field note" },
    ],
  },
  {
    id: "uc-1",
    num: 1,
    title: "Support ticket department routing",
    tranche: "nongame",
    priority: "P2",
    category: "nongame",
    writeup:
      "Classify an inbound support message into a closed set (billing / technical / sales / other) and let code route the ticket. Classic Choice over known queues; low latency means it can run on every message.",
    links: [
      { href: "https://jevai.dev/", label: "jevai.dev" },
      { href: "https://openrouter.ai/~typesafe/jev-latest", label: "OpenRouter" },
    ],
  },
  {
    id: "uc-2",
    num: 2,
    title: "Urgency / time-sensitivity gate",
    tranche: "nongame",
    priority: "P2",
    category: "nongame",
    writeup:
      "Noul (“does this convey urgency?”) returns a 0–1 probability so code can escalate only when above a threshold (e.g. urgent + billing). Replaces brittle keyword heuristics.",
    links: [
      { href: "https://openrouter.ai/~typesafe/jev-latest", label: "OpenRouter" },
      { href: "https://jevai.dev/", label: "jevai.dev" },
    ],
  },
  {
    id: "uc-3",
    num: 3,
    title: "Customer frustration scoring",
    tranche: "nongame",
    priority: "P2",
    category: "nongame",
    writeup:
      "Score frustration on an ordered rubric (calm → civil frustration → very angry) for prioritization and tone of response. Use with department routing in one parallel call.",
    links: [
      { href: "https://openrouter.ai/~typesafe/jev-latest", label: "OpenRouter" },
      { href: "https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e", label: "Practical guide" },
    ],
  },
  {
    id: "uc-4",
    num: 4,
    title: "Speculative fan-out triage (many questions, one call)",
    tranche: "nongame",
    priority: "P2",
    category: "nongame",
    writeup:
      "Ask category, severity, has-repro, refund-wanted, frustration together; questions run in parallel so extras cost tokens not wall-clock. Code then branches on the answers that matter. Cookbook claims large batching speedups on multi-question briefs (directional).",
    links: [
      { href: "https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e", label: "Practical guide" },
    ],
  },
  {
    id: "uc-5",
    num: 5,
    title: "Confidence-gated human-in-the-loop",
    tranche: "nongame",
    priority: "P2",
    category: "nongame",
    writeup:
      "Because RLCD trains calibrated confidence, different actions get different bars (read-only balance check vs approve money transfer). Low confidence → human; high confidence → auto.",
    links: [
      { href: "https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e", label: "Practical guide" },
      { href: "https://typesafe.ai/blog/introducing-system-one-models-and-jev", label: "TypeSafe blog" },
    ],
  },
  {
    id: "uc-7",
    num: 7,
    title: "Agent tool / model selection",
    tranche: "nongame",
    priority: "P2",
    category: "nongame",
    writeup:
      "Decide which tool or specialist model should handle the next step, or whether to escalate. Fits agent orchestration where the answer space is known.",
    links: [{ href: "https://jevai.dev/", label: "jevai.dev" }],
  },
  {
    id: "uc-8",
    num: 8,
    title: "Pre- and post-LLM quality / contradiction checks",
    tranche: "nongame",
    priority: "P2",
    category: "nongame",
    writeup:
      "Field use: run Jev every turn (~p50 150ms claimed, directional) for questions like “did this output contradict prior user facts?” and “should we send a follow-up?” — cheaper/faster than deep classifiers every message.",
    links: [
      { href: "https://x.com/1374854868175888384/status/2100003037150683593", label: "Field note" },
    ],
  },
  {
    id: "uc-9",
    num: 9,
    title: "Proactive messaging / silence decisions",
    tranche: "nongame",
    priority: "P2",
    category: "nongame",
    writeup:
      "Same field note: “a few seconds of silence — should we proactively message?” as a fast decision chain without adding multi-second LLM latency to chat UX.",
    links: [
      { href: "https://x.com/1374854868175888384/status/2100003037150683593", label: "Field note" },
    ],
  },
  {
    id: "uc-11",
    num: 11,
    title: "Trust & safety / policy violation checks",
    tranche: "nongame",
    priority: "P2",
    category: "nongame",
    writeup:
      "Evaluate content against specific policy questions; route low-confidence or high-risk cases to review. Also framed as jailbreak/guardrail checking of LLM prompts and outputs.",
    links: [
      { href: "https://jevai.dev/", label: "jevai.dev" },
      { href: "https://typesafe.ai/blog/introducing-system-one-models-and-jev", label: "TypeSafe blog" },
    ],
  },
  {
    id: "uc-12",
    num: 12,
    title: "Verify / score / judge LLM outputs",
    tranche: "nongame",
    priority: "P2",
    category: "nongame",
    writeup:
      "System One pitch: score, judge, verify, guardrail LLM reasoning traces and outputs as structured decisions inside software workflows.",
    links: [
      { href: "https://typesafe.ai/blog/introducing-system-one-models-and-jev", label: "TypeSafe blog" },
    ],
  },
  {
    id: "uc-13",
    num: 13,
    title: "Recommendations & candidate relevance ranking",
    tranche: "nongame",
    priority: "P2",
    category: "nongame",
    writeup:
      "Score how well candidate items match user context; combine with your own ranking policies. Jev is the judgment layer, not retrieval.",
    links: [{ href: "https://jevai.dev/", label: "jevai.dev" }],
  },
  {
    id: "uc-14",
    num: 14,
    title: "Resume / candidate composite scoring",
    tranche: "nongame",
    priority: "P2",
    category: "nongame",
    writeup:
      "Break “how good is this candidate?” into independent Score dimensions (e.g. Python depth, leadership, system design), then weight in code — reweight without re-prompting.",
    links: [
      { href: "https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e", label: "Practical guide" },
    ],
  },
  {
    id: "uc-15",
    num: 15,
    title: "RAG retrieve-then-judge (passage filter)",
    tranche: "nongame",
    priority: "P2",
    category: "nongame",
    writeup:
      "Retrieve widely, then Noul/Score each passage for relevance/evidence before stuffing an expensive context window. Same shape as TypeSafe RAG/citation cookbooks.",
    links: [
      { href: "https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e", label: "Practical guide" },
    ],
  },
  {
    id: "uc-16",
    num: 16,
    title: "Bulk paper / document classification at extreme cheapness",
    tranche: "nongame",
    priority: "P2",
    category: "nongame",
    writeup:
      "Launch-week demo (1kpapers): ~1,018 papers summarized with a generative model then Choice-classified by Jev — summaries ~$3.99 vs classifications ~$0.08 (author-reported, directional). Pattern: different models for different workflow stages.",
    links: [
      { href: "https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e", label: "Practical guide" },
    ],
  },
  {
    id: "uc-g1",
    num: 21,
    title: "Agent spend firewall",
    tranche: "product",
    priority: "P2",
    category: "nongame",
    writeup:
      "Approve / review / deny agent purchases using price, vendor, user rules, and purchase history, with confidence. Product-shaped gate for spend before money moves.",
    links: [
      { href: "https://x.com/gregisenberg/status/2101284640828915995", label: "Greg Isenberg" },
    ],
  },
  {
    id: "uc-g2",
    num: 22,
    title: "Self-healing tool calls",
    tranche: "product",
    priority: "P1",
    category: "nongame",
    writeup:
      "After an API error: retry, wait, change parameters, switch providers, or escalate. Suggested P1 bench scenario for recovery Choice under failure.",
    links: [
      { href: "https://x.com/gregisenberg/status/2101284640828915995", label: "Greg Isenberg" },
    ],
  },
  {
    id: "uc-g3",
    num: 23,
    title: "Irreversible action detector",
    tranche: "product",
    priority: "P1",
    category: "nongame",
    writeup:
      "Score reversibility before email send, file delete, money movement, or permission changes. Safety gate: only proceed when reversibility (or human approval) clears the bar.",
    links: [
      { href: "https://x.com/gregisenberg/status/2101284640828915995", label: "Greg Isenberg" },
    ],
  },
  {
    id: "uc-g4",
    num: 24,
    title: "Dynamic permission engine",
    tranche: "product",
    priority: "P2",
    category: "nongame",
    writeup:
      "Per-task tool, data, and spend limits instead of permanent broad access. Jev chooses the scoped capability set for this turn.",
    links: [
      { href: "https://x.com/gregisenberg/status/2101284640828915995", label: "Greg Isenberg" },
    ],
  },
  {
    id: "uc-g5",
    num: 25,
    title: "Agent branch pruning",
    tranche: "product",
    priority: "P1",
    category: "nongame",
    writeup:
      "Score ~20 next steps in parallel; kill weak branches before expensive reasoning. Suggested P1 bench for high-cardinality Score-then-prune.",
    links: [
      { href: "https://x.com/gregisenberg/status/2101284640828915995", label: "Greg Isenberg" },
    ],
  },
  {
    id: "uc-g6",
    num: 26,
    title: "Production incident controller",
    tranche: "product",
    priority: "P1",
    category: "nongame",
    writeup:
      "From logs, deploys, customers, and health: ignore, rollback, restart, page, or investigate. PagerDuty-shaped; react before Slack. Suggested P1 bench.",
    links: [
      { href: "https://x.com/gregisenberg/status/2101284640828915995", label: "Greg Isenberg" },
    ],
  },
  {
    id: "uc-g7",
    num: 27,
    title: "Live negotiation policy",
    tranche: "product",
    priority: "P2",
    category: "nongame",
    writeup:
      "Sales / procurement / collections: discount, counter, hold firm, offer terms, or escalate (“Clulely”-like). Closed Choice over live deal state.",
    links: [
      { href: "https://x.com/gregisenberg/status/2101284640828915995", label: "Greg Isenberg" },
    ],
  },
  {
    id: "uc-g8",
    num: 28,
    title: "Autonomous refund desk",
    tranche: "product",
    priority: "P2",
    category: "nongame",
    writeup:
      "Order history, customer value, fraud, item cost, and policy → approve, reject, or review. Confidence-aware refund decisions.",
    links: [
      { href: "https://x.com/gregisenberg/status/2101284640828915995", label: "Greg Isenberg" },
    ],
  },
  {
    id: "uc-g9",
    num: 29,
    title: "Realtime marketplace dispatch",
    tranche: "product",
    priority: "P1",
    category: "nongame",
    writeup:
      "Pick / rematch providers by location, price, quality, availability, cancellation risk, and preferences. Suggested P1 bench for realtime dispatch Choice.",
    links: [
      { href: "https://x.com/gregisenberg/status/2101284640828915995", label: "Greg Isenberg" },
    ],
  },
  {
    id: "uc-g10",
    num: 30,
    title: "Confidence-based human queues",
    tranche: "product",
    priority: "P1",
    category: "nongame",
    writeup:
      "Route only uncertain, expensive, or irreversible decisions to a person. Safety gate companion to calibrated confidence and irreversible-action detection.",
    links: [
      { href: "https://x.com/gregisenberg/status/2101284640828915995", label: "Greg Isenberg" },
    ],
  },

];

export const TRANCHE_META = {
  games: {
    id: "games",
    title: "Games first",
    badge: "P0",
    blurb:
      "Highest-signal tranche for JevBench: structured state → typed Choice/Score/Noul at sub-second rates. Prefer measuring calibrated confidence, latency under fan-out, and high-cardinality action spaces.",
  },
  platform: {
    id: "platform",
    title: "Platform patterns",
    badge: "P1",
    blurb:
      "Front-door routing and pre-LLM schema selection when the harness mixes Jev with a generative planner.",
  },
  product: {
    id: "product",
    title: "Product-shaped (Greg Isenberg)",
    badge: "P1",
    blurb:
      "LLMs generate possibilities. Jev chooses what happens next. Product-shaped scenarios from Greg Isenberg’s 10 Jev-native products — esp. self-healing tools, branch pruning, incident control, marketplace dispatch, plus irreversibility and confidence human-queue safety gates.",
  },
  nongame: {
    id: "nongame",
    title: "Non-game later",
    badge: "P2",
    blurb:
      "Support, RAG, safety, and bulk classify schemas are allowed — not the first evidence tranche.",
  },
};

/** Short labels for leaderboard filter + table cells. */
export function shortLabel(uc) {
  const shorts = {
    "uc-17": "DOOM bot",
    "uc-18": "Wikiracing",
    "uc-19": "Browser agent",
    "uc-20": "RTS / emulator / drone",
    "uc-6": "Cascade routing",
    "uc-10": "Tool unfurl",
    "uc-1": "Ticket routing",
    "uc-2": "Urgency gate",
    "uc-3": "Frustration score",
    "uc-4": "Fan-out triage",
    "uc-5": "Confidence HITL",
    "uc-7": "Tool / model pick",
    "uc-8": "Contradiction check",
    "uc-9": "Silence decision",
    "uc-11": "Trust & safety",
    "uc-12": "Judge LLM output",
    "uc-13": "Relevance ranking",
    "uc-14": "Resume scoring",
    "uc-15": "RAG passage filter",
    "uc-16": "Bulk classify",
    "uc-g1": "Spend firewall",
    "uc-g2": "Self-healing tools",
    "uc-g3": "Irreversible detector",
    "uc-g4": "Dynamic permissions",
    "uc-g5": "Branch pruning",
    "uc-g6": "Incident controller",
    "uc-g7": "Negotiation policy",
    "uc-g8": "Refund desk",
    "uc-g9": "Marketplace dispatch",
    "uc-g10": "Confidence queues",
  };
  return shorts[uc.id] || `#${uc.num}`;
}
