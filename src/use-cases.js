/**
 * Where a decision model fits: 30 patterns in four groups.
 * Figures quoted in the write-ups come from the linked sources, not from JevBench runs.
 *
 * status: "live"    — scored on the JevBench leaderboard today
 *         "planned" — a JevBench benchmark is on the roadmap
 */

export const GROUPS = [
  {
    id: "games",
    title: "Games and control loops",
    blurb:
      "Fast decisions with a clear win or loss. The hardest test of speed, confidence and choosing between many options.",
  },
  {
    id: "agents",
    title: "Agent infrastructure",
    blurb:
      "A decision model in front of a larger AI system: routing requests, choosing tools and narrowing options before a bigger model gets involved.",
  },
  {
    id: "safety",
    title: "Safety and approval gates",
    blurb:
      "Checks that run before anything irreversible happens, and send only the uncertain cases to a person.",
  },
  {
    id: "operations",
    title: "Operations and customer decisions",
    blurb: "Everyday product decisions made on every message, ticket or order, at a cost that allows it.",
  },
];

export const USE_CASES = [
  /* —— games —— */
  {
    id: "uc-20",
    group: "games",
    status: "live",
    title: "Real-time strategy and game control",
    writeup:
      "Emulators, strategy games and drones share one pattern: code handles physics, safety and arithmetic, and the decision model owns the judgment call. Community demos cover Super Mario, StarCraft and drone tactics.",
    links: [
      { href: "https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e", label: "Practical guide" },
      { href: "https://github.com/fhshaik/typesafe-mario", label: "typesafe-mario" },
      { href: "https://github.com/phyous/tsai-sc", label: "tsai-sc" },
      { href: "https://github.com/RomanSlack/jev-drone", label: "jev-drone" },
      { href: "https://github.com/AbdelStark/awesome-typesafe", label: "awesome-typesafe" },
    ],
  },
  {
    id: "uc-17",
    group: "games",
    status: "planned",
    title: "Real-time DOOM agent",
    writeup:
      "A reactive DOOM agent that plays from structured game state instead of pixels, deciding in real time. Shown by TypeSafe at launch.",
    links: [
      { href: "https://typesafe.ai/blog/introducing-system-one-models-and-jev", label: "TypeSafe blog" },
    ],
  },
  {
    id: "uc-18",
    group: "games",
    status: "planned",
    title: "Wikiracing",
    writeup:
      "On each Wikipedia page, pick the link that gets closest to the target from hundreds of options. A test of choosing well from a very long list without inventing links.",
    links: [
      { href: "https://typesafe.ai/blog/introducing-system-one-models-and-jev", label: "TypeSafe blog" },
    ],
  },

  /* —— agent infrastructure —— */
  {
    id: "uc-19",
    group: "agents",
    title: "Ultrafast browser agent",
    writeup:
      "The page becomes a numbered list of elements and one call picks the action and its target. The author reports booking Zürich to London on Google Flights in about seven seconds for under half a cent.",
    links: [
      { href: "https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e", label: "Practical guide" },
      { href: "https://github.com/browser-use/jev-ultrafast", label: "jev-ultrafast" },
    ],
  },
  {
    id: "uc-6",
    group: "agents",
    title: "Cascade routing",
    writeup:
      "Classify each request by intent and difficulty. Simple paths stay in code, hard ones go to a specialist LLM, and edge cases go to a person. The decision model is the front door, not a replacement for the LLM.",
    links: [
      { href: "https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e", label: "Practical guide" },
    ],
  },
  {
    id: "uc-10",
    group: "agents",
    title: "Tool selection per turn",
    writeup:
      "Decide which tool definitions the main model sees on each turn. Less context to carry, and better tool calling from smaller models.",
    links: [
      { href: "https://x.com/1374854868175888384/status/2100003037150683593", label: "Field note" },
    ],
  },
  {
    id: "uc-7",
    group: "agents",
    title: "Model and tool routing",
    writeup:
      "Choose which tool or specialist model handles the next step, or whether to escalate. A natural fit wherever the set of answers is known in advance.",
    links: [{ href: "https://jevai.dev/", label: "jevai.dev" }],
  },
  {
    id: "uc-g2",
    group: "agents",
    status: "planned",
    title: "Self-healing tool calls",
    writeup:
      "After an API error, choose the recovery: retry, wait, change parameters, switch provider or escalate.",
    links: [
      { href: "https://x.com/gregisenberg/status/2101284640828915995", label: "Source" },
    ],
  },
  {
    id: "uc-g5",
    group: "agents",
    status: "planned",
    title: "Branch pruning",
    writeup:
      "Score around twenty possible next steps in parallel and drop the weak ones before spending on expensive reasoning.",
    links: [
      { href: "https://x.com/gregisenberg/status/2101284640828915995", label: "Source" },
    ],
  },
  {
    id: "uc-g4",
    group: "agents",
    title: "Per-task permissions",
    writeup:
      "Grant tools, data and spending limits for one task at a time instead of permanent broad access.",
    links: [
      { href: "https://x.com/gregisenberg/status/2101284640828915995", label: "Source" },
    ],
  },

  /* —— safety —— */
  {
    id: "uc-5",
    group: "safety",
    title: "Confidence-gated approval",
    writeup:
      "Jev reports calibrated confidence, so each action can have its own bar. Checking a balance clears easily. Approving a transfer needs more. Low confidence goes to a person.",
    links: [
      { href: "https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e", label: "Practical guide" },
      { href: "https://typesafe.ai/blog/introducing-system-one-models-and-jev", label: "TypeSafe blog" },
    ],
  },
  {
    id: "uc-g3",
    group: "safety",
    title: "Irreversible action check",
    writeup:
      "Score how reversible an action is before sending an email, deleting a file, moving money or changing permissions. Proceed only when it clears the bar.",
    links: [
      { href: "https://x.com/gregisenberg/status/2101284640828915995", label: "Source" },
    ],
  },
  {
    id: "uc-g10",
    group: "safety",
    title: "Human review queues",
    writeup:
      "Send a decision to a person only when it is uncertain, expensive or irreversible. Everything else proceeds automatically.",
    links: [
      { href: "https://x.com/gregisenberg/status/2101284640828915995", label: "Source" },
    ],
  },
  {
    id: "uc-g1",
    group: "safety",
    title: "Agent spend firewall",
    writeup:
      "Approve, review or deny an agent's purchase using price, vendor, user rules and purchase history, before any money moves.",
    links: [
      { href: "https://x.com/gregisenberg/status/2101284640828915995", label: "Source" },
    ],
  },
  {
    id: "uc-11",
    group: "safety",
    title: "Trust and safety checks",
    writeup:
      "Evaluate content against specific policy questions and route risky or low-confidence cases to review. Also used to screen LLM prompts and outputs.",
    links: [
      { href: "https://jevai.dev/", label: "jevai.dev" },
      { href: "https://typesafe.ai/blog/introducing-system-one-models-and-jev", label: "TypeSafe blog" },
    ],
  },
  {
    id: "uc-12",
    group: "safety",
    title: "Judging LLM output",
    writeup:
      "Score and verify an LLM's reasoning and answers as structured decisions inside a workflow.",
    links: [
      { href: "https://typesafe.ai/blog/introducing-system-one-models-and-jev", label: "TypeSafe blog" },
    ],
  },
  {
    id: "uc-8",
    group: "safety",
    title: "Contradiction checks",
    writeup:
      "On every turn, ask whether a reply contradicts what the user said earlier. One team reports a median of about 150 ms per check.",
    links: [
      { href: "https://x.com/1374854868175888384/status/2100003037150683593", label: "Field note" },
    ],
  },

  /* —— operations —— */
  {
    id: "uc-1",
    group: "operations",
    title: "Support ticket routing",
    writeup:
      "Sort each inbound message into billing, technical, sales or other, and let code route the ticket. Fast enough to run on every message.",
    links: [
      { href: "https://jevai.dev/", label: "jevai.dev" },
      { href: "https://openrouter.ai/~typesafe/jev-latest", label: "OpenRouter" },
    ],
  },
  {
    id: "uc-2",
    group: "operations",
    title: "Urgency detection",
    writeup:
      "Get a probability that a message is urgent and escalate above a threshold. A replacement for brittle keyword rules.",
    links: [
      { href: "https://openrouter.ai/~typesafe/jev-latest", label: "OpenRouter" },
      { href: "https://jevai.dev/", label: "jevai.dev" },
    ],
  },
  {
    id: "uc-3",
    group: "operations",
    title: "Customer frustration scoring",
    writeup:
      "Score frustration from calm to very angry to set priority and tone. Runs alongside ticket routing in a single call.",
    links: [
      { href: "https://openrouter.ai/~typesafe/jev-latest", label: "OpenRouter" },
      { href: "https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e", label: "Practical guide" },
    ],
  },
  {
    id: "uc-4",
    group: "operations",
    title: "Triage in one call",
    writeup:
      "Ask for category, severity, refund intent and frustration together. The questions run in parallel, so extra ones add tokens, not waiting time.",
    links: [
      { href: "https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e", label: "Practical guide" },
    ],
  },
  {
    id: "uc-9",
    group: "operations",
    title: "Proactive messaging",
    writeup:
      "After a few seconds of silence, decide whether to send a follow-up, without adding LLM latency to the chat.",
    links: [
      { href: "https://x.com/1374854868175888384/status/2100003037150683593", label: "Field note" },
    ],
  },
  {
    id: "uc-g6",
    group: "operations",
    status: "planned",
    title: "Incident response",
    writeup:
      "Read logs, deploys and service health, then choose: ignore, roll back, restart, page someone or investigate.",
    links: [
      { href: "https://x.com/gregisenberg/status/2101284640828915995", label: "Source" },
    ],
  },
  {
    id: "uc-g9",
    group: "operations",
    status: "planned",
    title: "Marketplace dispatch",
    writeup:
      "Match and rematch providers in real time by location, price, quality, availability and cancellation risk.",
    links: [
      { href: "https://x.com/gregisenberg/status/2101284640828915995", label: "Source" },
    ],
  },
  {
    id: "uc-g8",
    group: "operations",
    title: "Refund decisions",
    writeup:
      "Weigh order history, customer value, fraud signals, item cost and policy, then approve, reject or send to review.",
    links: [
      { href: "https://x.com/gregisenberg/status/2101284640828915995", label: "Source" },
    ],
  },
  {
    id: "uc-g7",
    group: "operations",
    title: "Live negotiation",
    writeup:
      "In sales, procurement or collections, choose the next move: discount, counter, hold firm, offer terms or escalate.",
    links: [
      { href: "https://x.com/gregisenberg/status/2101284640828915995", label: "Source" },
    ],
  },
  {
    id: "uc-13",
    group: "operations",
    title: "Relevance ranking",
    writeup:
      "Score how well each candidate matches the user's context and combine the scores with your own ranking rules.",
    links: [{ href: "https://jevai.dev/", label: "jevai.dev" }],
  },
  {
    id: "uc-14",
    group: "operations",
    title: "Candidate scoring",
    writeup:
      "Split one broad question into separate scores, such as Python depth, leadership and system design, then weight them in code. Reweight any time without changing the prompt.",
    links: [
      { href: "https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e", label: "Practical guide" },
    ],
  },
  {
    id: "uc-15",
    group: "operations",
    title: "Retrieval filtering",
    writeup:
      "Retrieve widely, then judge each passage for relevance before it reaches an expensive context window.",
    links: [
      { href: "https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e", label: "Practical guide" },
    ],
  },
  {
    id: "uc-16",
    group: "operations",
    title: "Bulk document classification",
    writeup:
      "One demo classified about a thousand research papers for eight cents, against four dollars to summarise them with a generative model.",
    links: [
      { href: "https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e", label: "Practical guide" },
    ],
  },
];
