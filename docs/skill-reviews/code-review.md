# code-review

- Bucket: engineering. Invocation: model-invoked.
- Verdict: **adapt** (output -> tickets; split app/game rubrics; repoint to tkt).

## What it is

A two-axis review of the diff since a fixed point, run as parallel sub-agents and kept
separate (no cross-ranking): **Standards** (repo-documented standards + a smell
baseline) and **Spec** (faithful implementation of the originating issue/spec).

## What it does for the user

Catches "built it wrong" and "built the wrong thing" as separate failures so neither
masks the other. In the pipeline, tdd makes it work, this review surfaces what needs
cleaning or correcting.

## Prior art (brief)

Research against credible sources confirmed the core design: the judgement-call smell
framing is faithful to Fowler (smells are indicators, not rules), the two-axis split
maps onto Google's quality-vs-functionality review dimensions, three-dot/merge-base is
exactly PR-review semantics, "skip what tooling enforces" is standard, and the
grounding mitigations (quote the hunk, cite the standard, "possible X", short briefs)
align with documented LLM-reviewer failure modes (false positives, nitpicking). Two
facts drove the adaptations: LLM smell-detection has a high false-positive rate (so the
"possible, judgement-call" framing is calibrated), and the OO-abuser smells (Feature
Envy, Message Chains, Middle Man, Refused Bequest) misfire on ECS/data-oriented code.

## Decision

**Adapt**, structurally, kept lean (not re-editorialized):

1. **Output is tickets, not a chat report.** Each actionable finding is filed as a
   ticket with the axis, file + quoted hunk, the standard/spec line it breaches, and
   clear acceptance criteria. This tracks the fix as frontier work and resolves the
   "who does the refactor" gap: tdd makes it work, code-review files the findings, the
   tickets are the fixer handoff.
2. **Two rubrics, not one baseline.** `rubric-app.md` (the Fowler smells) and
   `rubric-game.md` (suppress the four OO-abuser smells on data-oriented code; apply
   the game web-ism rubric via `game-native-design`). The Standards axis loads whichever
   fits the project (engine markers pick the game rubric).
3. **Repoint to tkt.** The spec-source lookup reads a ticket body + its spec-slug and
   `docs/` specs; the branding/`setup` pointer is dropped. No GitHub/`.scratch`.

Kept as-is: the two-axis split, parallel sub-agents, no-cross-ranking, the diff
mechanics, the <400-word briefs. These are Matt's structure and they hold up; not
touched.

## Cross-skill dependencies

Fed by `tdd` (makes it work -> this flags). Files tickets via the issue-tracker doc.
Game rubric calls `game-native-design`. Spec source is a tkt ticket / `docs/` spec.

## Web-app bias

The Fowler baseline is OO-centric; four smells misfire on data-oriented game code.
Handled by splitting the rubric (app vs game) rather than caveating one list.
