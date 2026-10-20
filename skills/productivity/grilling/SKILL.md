---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree one decision at a time. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. The frontier sets the **order** you ask in; it does not mean ask them all at once.

**Default: one question per turn.** Ask the single highest-leverage frontier question, give your recommended answer, and then _discuss it with the user until you reach an agreed answer_ — they may push back, ask you to expand, or change your recommendation, and that back-and-forth is the point. Only once that one decision is settled do you move to the next question. This keeps each decision a real conversation, not a form to fill in.

**Batch only on request.** Ask several frontier questions in one turn _only_ when the user explicitly directs it (e.g. "give me the whole round," "ask them all at once"). Then number each question and give your recommended answer for each.

Ask only what earns its place. A question whose answer wouldn't change what you build, don't ask it.

Format a single question like so:

```
❓ **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

When batching on request, number them (`Q1`, `Q2`, …), each with its own `➡️` recommendation, separated by `---`.

Word each question so "yes" accepts your recommended answer.

Each settled decision reshapes the tree: it pushes the frontier outward and unblocks questions that depended on it. Recompute the frontier and ask the next question. A question whose answer depends on one still open belongs _later_, not now.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. But a lookup that comes back _conflicting_, _ambiguous or stale_, or _preference-dependent_ is not a fact to settle yourself: it is a decision wearing a fact's clothing, so surface it to the user. The _decisions_ are the user's: put each to them and wait.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.
