---
id: "21"
title: "Review the beta (in-progress) and frozen (misc) upstream skills for adaptation"
status: backlog
blocked_by: []
priority: low
validation_criteria:
  - "Each beta skill (chief-of-staff, claude-handoff, loop-me, setup-ts-deep-modules, writing-beats, writing-fragments, writing-shape) has a committed review note or an explicit defer/drop decision with reasoning"
  - "Each frozen/misc skill (git-guardrails-claude-code, migrate-to-shoehorn, scaffold-exercises, setup-pre-commit) has a keep/adapt/drop/defer decision; vendor-locked ones only adapted if they fit the stack"
  - "The review index and compass are updated for any skill brought into the set"
tags: ["type:review", "stream:skills-review"]
---

# Review the beta (in-progress) and frozen (misc) upstream skills for adaptation

## What to build

Complete the skill walkthrough's remaining scope: the **beta** (`in-progress/`) and
**frozen** (`misc/`) upstream buckets, which ticket 03 deferred (it covered the active
engineering + productivity sets). Source: `d:\code\skills`.

Per the `review-skill` method (fresh re-read, research, discuss, user decides verdict):

- **Beta (in-progress, 7):** chief-of-staff, claude-handoff, loop-me,
  setup-ts-deep-modules, writing-beats, writing-fragments, writing-shape. Several are a
  writing suite; some may be Claude-Code/vendor-specific (claude-handoff) and
  TS-specific (setup-ts-deep-modules), judge fit to our stack/harness-neutral posture.
- **Frozen (misc, 4):** git-guardrails-claude-code, migrate-to-shoehorn,
  scaffold-exercises, setup-pre-commit. Likely mostly defer/drop; setup-pre-commit may
  be worth adapting as a guardrail (pairs with retro's "no-guardrail is a finding").

Each gets a committed review note or an explicit defer/drop with reasoning. Anything
brought into the set updates the review index, its bucket README, and compass (per the
sync guard in `docs/agents/maintenance-skills.md`). Low priority: these are beta/frozen
upstream and not blocking the active set.

## Acceptance criteria

- [ ] Each beta skill (chief-of-staff, claude-handoff, loop-me, setup-ts-deep-modules, writing-beats, writing-fragments, writing-shape) has a committed review note or an explicit defer/drop decision with reasoning
- [ ] Each frozen/misc skill (git-guardrails-claude-code, migrate-to-shoehorn, scaffold-exercises, setup-pre-commit) has a keep/adapt/drop/defer decision; vendor-locked ones only adapted if they fit the stack
- [ ] The review index, bucket README, and compass are updated for any skill brought into the set
