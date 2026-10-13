# writing-for-agents

- Bucket: productivity. Invocation: model-invoked.
- Verdict: **keep** (as-is; and it is grey-matter's own authoring standard).

## What it is

The meta-skill: how to write any document an agent consumes (a SKILL.md, an
AGENTS.md/CLAUDE.md, a pointer-reached doc). Levers: context pointers, the two loads
(context load on the window vs cognitive load on the human), the information hierarchy
+ progressive disclosure, completion criteria, leading words, the negation failure,
and pruning. Its sibling `SKILL-MECHANICS.md` covers model- vs user-invocation and
router skills.

## What it does for the user

It is the intellectual backbone of the whole set and, for us, the authoring standard
we have already applied to every grey-matter skill (progressive disclosure, the depth
bar, co-location, no-op pruning). Documents built this way make the agent take the
same reliable process every run at minimum context cost.

## Prior art (credible-source grounded)

Research against Anthropic's context-engineering and Agent Skills posts, OpenAI/Google
prompt guidance, and the Chroma context-rot / lost-in-the-middle work found: **nothing
in the skill is contradicted; most levers are the published consensus; the synthesis
is slightly ahead of the public material.**

- **Solid (authoring law):** the two-loads *mechanism* (attention budget, context
  rot), progressive disclosure + the three-tier hierarchy (the Agent Skills standard),
  completion criteria / specificity ("define what done looks like"), single-source-of-
  truth / don't-restate-the-environment / cut-no-ops.
- **Advice solid, mechanism is heuristic (presented as fact):** negation's "elephant
  effect" for LLMs (the *advice*, prompt the positive, is vendor-backed; the mechanism
  is an analogy); "visible later steps make the agent rush" (plausible, unproven, and
  it runs against Anthropic's pro-visible-plan long-horizon guidance, the skill's "only
  across a context boundary" guard is the right limiter); "leading words steer better
  than a coined term" (token-efficiency trivially true, comparative steering inferred);
  "context load spent every turn" (really a gradient, not a flat tax); the two-loads /
  router / user-invoked-is-free taxonomy (the skill's own coherent vocabulary).

## Decision

**Keep as-is (option a).** The confident framing is deliberate and correct: the
*advice* in every lever is right and vendor-backed, and hedging an instruction an
agent reads would weaken it, violating the skill's own "prompt the positive, cut
no-ops" principle. We do not soften the leading-words / negation / two-loads prose.

The one finding that genuinely matters is **version drift**: Anthropic notes newer
models need less prescriptive engineering and can over-trigger on aggressive wording,
so these rules are model-relative and should be re-validated over time, not frozen.
Rather than caveat the skill body, we address drift *systematically* with a backlog
ticket for a model-eval harness (ticket 06) that tracks how model changes affect skill
handling and leverage.

Leading-word examples (`tight`, `red`, `tracer bullet`) are illustrative, not
references; they stay even if a source skill is renamed.

## Cross-skill dependencies

Consulted by `retro` (for style) and by anyone editing a skill. Its SKILL-MECHANICS.md
explains the invocation model other skills follow. It is the standard; it depends on
nothing.

## Web-app bias

None. Domain-neutral meta. No lens needed (it is the doc that tells us *how* to write
the game lens well).
