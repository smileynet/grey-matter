# to-tickets

- Bucket: engineering. Invocation: user-invoked.
- Verdict: **adapt** (tkt repoint collapses the dual-template; one in-direction fix; one quiz addition).

## What it is

Breaks a plan/spec/conversation into **tracer-bullet vertical slices**, each a complete
path through the layers the behaviour touches, demoable on its own, sized to one fresh
context window, declaring its **blocking edges**. Handles wide refactors via
expand-contract. Quizzes the user on the breakdown, then creates the tickets. The step
between to-spec and implement.

## What it does for the user

Turns a spec into a dependency-ordered set of agent-sized tickets with a computable
ready frontier, the task graph the build works.

## Prior art (agent-filtered)

Research confirmed the decomposition intelligence is textbook-faithful and well-grounded:
tracer-bullet/vertical-slice (Hunt & Thomas; Humanizing Work's "keystone habit"), the
DAG + ready-frontier model (task-graph scheduling, Kanban pull; and tkt computes the
frontier natively), expand-contract (Fowler ParallelChange / BranchByAbstraction),
"make the change easy then make the easy change" (Kent Beck, correctly attributed),
and alignment with Spec Kit/Kiro (slightly ahead, explicit edges). Small-batch sizing is
strongly grounded; "one context window" is a sound agent translation of the batch unit.

Flagged items, examined for intent before touching:

- **"complete path through EVERY layer".** Overclaims: a pure library, CLI, data
  migration, or game system has no UI/API layer. But the *intent* is vertical-not-
  horizontal (cut end-to-end through whatever the behaviour spans), not "every ticket
  must touch a UI". Sharpened in-direction to **"every layer the behaviour touches"**
  plus an explicit note that some work is legitimately not full-stack. The top fix, and
  it matters more for games (systemic/no-UI work) and our own CLI tooling.
- **Spurious dependency edges** (LLMs over-connect the DAG, killing parallelism). The
  skill already mitigates this, step 4 quizzes "does each ticket only depend on tickets
  that genuinely gate it". Kept; added a one-line "declare only true blockers" nudge at
  the point of drafting.
- **Verification gate is asymmetric** (quiz catches over-production, misses omission).
  Real small gap: added a spec-coverage check to the quiz ("every part of the spec maps
  to a ticket, every ticket traces back"). Catches both invented and missing tickets.

## Decision

**Adapt.** Changes:

1. **tkt repoint (the structural bulk).** The upstream's dual templates (local-markdown
   file + real-tracker issue) and local-vs-native branching **collapse to one**: the
   tkt ticket. `tkt new`/`tkt batch` create them; `--blocked-by` sets edges; `tkt ready`
   is the frontier (native, no "Blocked by" prose); `--vc` holds acceptance criteria;
   `triage:ready-for-agent` tags slices. "Make each ticket a sub-issue of its source"
   becomes the **epic convention** (`type:epic`/`epic:<slug>` interim, native `--parent`
   later; see tkt-conventions). Dropped the branding/setup precondition.
2. **"every layer the behaviour touches"** + the not-all-work-is-full-stack note.
3. **Spec-coverage check** added to the quiz.
4. **"vertical slice" false-friend note** (web sense here, not the game polished-slice
   sense; GLOSSARY) + a game pointer (slices are mechanics/systems from `game-modeling`).

Kept verbatim: the tracer-bullet rules, expand-contract, prefactoring, the edge-challenge
quiz.

## Cross-skill dependencies

Downstream of `to-spec`/`grilling`; upstream of `implement`/`implement-spec`. Produces
the task graph `tkt ready` serves and `implement` works. Epic grouping follows
`docs/agents/tkt-conventions.md`. Game slices come from `game-modeling`. Reads GLOSSARY/ADRs.

## Web-app bias

The "(schema, API, UI, tests)" layer list leans web, now reframed as "the layers the
behaviour touches", with the game case pointed at `game-modeling`. The decomposition
model itself is domain-neutral.
