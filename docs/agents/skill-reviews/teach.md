# teach

- Bucket: productivity. Invocation: user-invoked (`disable-model-invocation: true`,
  plus Claude-only `argument-hint`).
- Verdict: **adapt**: keep the pedagogy + multi-file shape; four executor fixes; light
  repointing. Domain-general (no game adaptation).

## What it is

A stateful, multi-session learning workspace: the agent tutors a human over time, using
the current directory as the workspace. State files: `MISSION.md` (the why), `RESOURCES.md`
(curated high-trust Knowledge + Wisdom-communities), `learning-records/` (ADR-equivalent
records of what's genuinely learned, driving what to teach next), `GLOSSARY.md`
(opinionated compressed definitions), `lessons/*.html` (self-contained beautiful lessons,
the primary unit), `assets/` (reusable components), `NOTES.md`. Multi-file: SKILL.md + 4
FORMAT files. The productivity counterpart to our engineering grill / domain-modeling /
ADR stack, applied to learning.

## What it does for the user

Gives the user a personal tutor that remembers across sessions: grounds teaching in their
real goal, teaches from trusted sources, builds durable retention through retrieval and
spacing, and tracks what they've actually learned so each session starts just beyond their
current mastery.

## Prior art (agent-filtered)

The pedagogy is unusually well-grounded and correctly attributed: **retrieval practice /
testing effect** (Roediger & Karpicke, the strongest leg), **spacing** (Ebbinghaus ->
Cepeda), **fluency vs storage strength + desirable difficulties** (the Bjorks), **illusion
of competence** (Koriat/Kornell & Bjork). Strong precedent for the shape: **Intelligent
Tutoring Systems** (learning-records = a lightweight student model), **Bloom's 2-sigma**,
**mastery learning** (Bloom/Keller), **SRS** (Anki/SM-2, teach has the spirit of spacing
without the scheduler).

Three overstatements to tighten (not drop): **ZPD is a framing, not a measurement**
(Vygotsky; "scaffolding" is Wood/Bruner/Ross); **interleaving is task-dependent** (helps
confusable concepts, can hurt early procedural skill); any **"7+-2"** is a pop-psych
fossil (Cowan ~4, or no number).

Risk concentrates in the **agent as executor**, and tutoring hallucination is worse than
coding hallucination (the learner is a novice who can't catch it; no compiler/test
backstop):

1. **Parametric-knowledge hallucination**: mitigated by "never trust parametric knowledge,
   cite everything", the skill's most important decision, **but the citation rule is
   necessary, not sufficient**: it produces citation theater unless the source was actually
   fetched in-session. Sharpest failure.
2. **False mastery / sycophancy**: telling the learner they've mastered something corrupts
   the learning-record state and the ZPD computation at once.
3. **State drift**: agent-authored records accumulate confident-but-wrong entries later
   sessions trust as ground truth.
4. **Quiz answer-leakage**: the length/position rule is gameable (correct option most
   plausible, distractors absurd, LLM position bias).
5. **Over-production**: verbose output fights working-memory limits and desirable difficulty.

## Decision

**Adapt.** Four executor fixes, each reusing a discipline we've already established:

1. **Retrieval-backed citations.** A lesson's citations must resolve to sources the agent
   actually fetched/read this session (grounded in `RESOURCES.md`), not emitted from
   memory, the same rule as `research`/`research-audit`. Closes the worst failure.
2. **Mastery gated on demonstrated retrieval.** A learning record marks something "learned"
   only on a passed (ideally spaced) retrieval check, not on lesson completion or the
   learner's say-so. Closes sycophancy, state-drift, and ZPD-miscalibration together; it is
   just the mastery-learning frame the skill already cites. Threaded into SKILL.md and
   LEARNING-RECORD-FORMAT (the "demonstrated floor" the ZPD is measured from).
3. **Tighten the three overstatements**: ZPD as framing not measurement; interleaving
   task-dependent (interleave discrimination, block a new motor skill); drop "7+-2".
4. **Strengthen the quiz rule**: distractors must be attractive real misconceptions (better
   pedagogy and removes the "only-plausible-option" tell), and position randomised with a
   real random choice (named the LLM position-bias trap).

Light repointing: HTML lessons/reference align with `docs/agents/report-format.md` (they
are genuinely full-bodied, so HTML is correct); learning-records noted as the teach-domain
ADRs (append-only, supersede-not-delete, like `docs/adr/`); `argument-hint` kept as a
deliberate Claude-only extension (ignored elsewhere, genuinely useful); AGENTS.md-primary;
user-invoked kept (a human-driven learning relationship; model-invocation makes no sense);
no tkt wiring (state is the workspace's own files).

Kept: all four FORMAT files, the Knowledge/Skills/Wisdom split, the mission-grounding, the
lesson-as-HTML unit, assets reuse, the community-delegation for wisdom.

## Game angle: domain-general, no adaptation

The pedagogy is content-agnostic by construction (hence the yoga / weightlifting /
programming examples). Teaching Godot is just another subject corpus: Godot docs become
the high-trust Knowledge source, the Godot community the Wisdom delegate. Baking
game-specifics into `teach` would be a scope error; it belongs as a subject, not a skill
variant. The only places domain shows (interleaving for procedural vs conceptual;
assessment modality for a pose vs a fact) are handled by the general ZPD/mastery machinery.

## Follow-up

- Ticket **19**: live-test teach against existing projects and related works (does it
  ground in real sources, gate mastery on retrieval, avoid over-production, keep the
  multi-session state honest).

## Cross-skill dependencies

Standalone (its own workspace). Shares the retrieval-backed-grounding discipline with
`research`/`research-audit`, the ADR append-only discipline with `domain-modeling`, and the
HTML-full-bodied convention with the report-format rule. Not a tkt flow.

## Web-app bias

None. The pedagogy is domain-general; the examples already span non-software domains.
