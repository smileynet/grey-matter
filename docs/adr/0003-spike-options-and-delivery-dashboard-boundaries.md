# 0003 — spike-options and delivery-dashboard: two composable skills, with bounded scope

**Status:** accepted (2026-10-22). The dashboard's rolling-history clause is amended by
[0004](./0004-delivery-dashboard-keeps-a-searchable-history.md).

## Context

Two cross-cutting patterns were grilled into shape for inclusion in the skill set:

1. **spike-options** — prefer to spike *competing* options empirically before deciding which
   to pursue, then review the spike results with the user to form an integration plan.
2. **delivery-dashboard** — on completing work, surface it to the user as a durable, evolving
   HTML dashboard: live/mocked/wireframe visuals of what was built, plus a changelog-discipline
   explanation of the value in the user's job-to-be-done terms.

Both overlap heavily with skills that already exist (`prototype`, `improve-codebase-architecture`,
`grilling`, `changelog`, and the `report-format.md` convention). The design question was where the
new boundaries sit so the skills *compose* with the existing set rather than duplicating or
coupling to it.

## Decision

**Two independent, model-invokable skills that compose but do not depend on each other.**

- **spike-options** (`skills/engineering/`): orchestrates a **spike run** — spike **every
  meaningful option** (no fixed count) against one shared **deciding question**, each spike a
  throwaway `prototype` stopped the instant it answers that question. Trigger (combined gate):
  the choice is **load-bearing** (hard to reverse), the options are **empirically cheap** to
  spike, *and* the winner is **uncertainty-dominated** — reasoning alone won't settle it. Review
  the run with the user via `grilling`; land a **verdict** (winner/losers/why + spike branch
  names) as a context pointer on the originating ticket, plus **integration ticket(s)** for the
  winner. Offer an ADR only when domain-modeling's three-part gate is met. It **composes**
  `prototype`, `grilling`, `report-format.md`, `domain-modeling`, and `to-tickets`; it
  reimplements none of them.

- **delivery-dashboard** (`skills/productivity/`): maintains **one durable, evolving HTML
  dashboard per project**, organized into **tabs by concern/workstream**, each tab a current-state
  view plus a **short rolling history** of what's currently relevant. Tabs are **curated and
  retired** as features integrate (relevant-now, not an archive). Visual fidelity follows an
  explicit **three-rung ladder** (wireframe → mocked → live), **every visual labelled with its
  rung**. Written always in the **JTBD register**. It **composes** `report-format.md` (all HTML
  rules) and `changelog` (the value-language discipline); it restates neither.

## Why

- **Independent, not coupled.** The dashboard must work for any completed work (spiked or not);
  the spike discipline must work even when delivery gets no dashboard. Coupling them would make
  the dashboard assume a spike happened. They share vocabulary, not dependency — matching the
  repo's grain of small skills that call each other via the Skill tool.

- **spike-options is distinct from its neighbours.** `prototype` answers **one** design question
  with **one** throwaway; `improve-codebase-architecture` compares candidates **on paper**.
  spike-options is the missing third: **multiple** throwaways, **built and measured**, compared
  against one deciding question. It reuses `prototype` per-spike rather than re-inventing
  throwaway/capture discipline.

- **delivery-dashboard's history rolls; CHANGELOG archives.** The dashboard is the *living,
  relevant-now* surface — tabs retire as features integrate. Durable, append-only archival of
  user-facing value is `CHANGELOG.md`'s job (via `changelog`), so the two don't duplicate: the
  dashboard delegates the value-language rule to `changelog` and surfaces it visually and
  curated, keeping one source of truth for "how to phrase a change as user value."

- **The fidelity ladder's labels are load-bearing.** An unlabelled wireframe reads as a promise —
  the same dishonesty `report-format.md` guards against with "diagrams are grounded." Matching the
  rung to build state and labelling it makes climbing the ladder the visible progress signal.

- **Both model-invokable.** They carry descriptions so `compass`/`cheat-sheet` route to them and
  the harness may auto-route on match. (An earlier draft made them `disable-model-invocation`;
  overruled — the deliberate-invocation intent for spike-options survives as a usage signal in
  prose, not as an invocation lock.)

## Considered

- *One coupled spike→dashboard flow:* rejected — forces the dashboard to assume a spike happened
  and the spike to assume a dashboard delivery; neither is true in general.
- *Fold the dashboard into `implement`/`implement-spec` as a final step:* rejected — not every
  implement run warrants a dashboard, and `implement` is deliberately terse. A named skill those
  flows *can* call (via a light see-also) is better than a forced step.
- *Dashboard as per-work-item reports:* rejected — gives no single evolving "state for the user"
  view; the user would reassemble the picture from many files.
- *Append-only dashboard history:* rejected — that is `CHANGELOG.md`. The dashboard's history
  rolls and is curated to what's currently relevant.
- *A fixed option count for a spike run (2, or 2–3):* rejected — the set is defined by the
  decision (every meaningful option), not a cap.
