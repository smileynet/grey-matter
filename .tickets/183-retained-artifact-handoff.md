---
id: "183"
title: "Preserve artifact ownership across agent handoffs"
status: in_progress
blocked_by: []
priority: medium
validation_criteria:
  - "One existing skill owns the retention rule and other workflow surfaces use concise pointers."
  - "Worked scenarios cover merged but retained workspace, shared artifact, blocked worker, cross-harness handoff and unknown owner."
  - "Each scenario preserves ignored originals and useful evidence until classified recovery/disposition is recorded."
  - "Small reversible tasks require no mandatory registry or archive service."
  - "Conformance scenarios flag contradictory disposable/retained guidance while preserving project-specific policy."
  - "Applicable guidance checks and repository gates pass; global text stays within its existing budget."
tags: ["stream:test-verification"]
---

# Preserve artifact ownership across agent handoffs

## Intent source

Sam requested portable global follow-ups from the Philippines-trip storage review on 2026-11-02. The case found retained workspaces losing owner records after merge and ignored source/evidence outliving active assignments. This brief is self-contained; the private project is illustrative, not a required dependency.

## What to build

Extend the existing artifact lifecycle owned by repository-artifact-hygiene (#97/#110). When active work ends or changes harness, retained artifacts keep an accountable owner or explicit unknown state plus purpose and end condition. Separate active assignment from retention ownership. Closure/handoff distinguishes reproducible output, useful evidence, source originals and private recovery state. Git landing and clean status never establish ignored-data recovery.

Keep small tasks lightweight: a scoped note suffices; a project may use its own registry. Reuse existing implement/orchestrate/wrap/curate pointers rather than adding a cleanup skill or universal database. Extend conformance guidance to surface conflicting project retention rules without silently rewriting them. Honor existing user/project authorization; do not impose new approval on cleanup already authorized.

## Read first

- skills/meta/repository-artifact-hygiene/SKILL.md
- skills/meta/curate-docs/SKILL.md
- skills/engineering/implement/SKILL.md
- .tickets/97-scratch-retention.md and .tickets/181-scratch-prune-recipe-in-artifact-hygiene.md
- .tickets/104-stateful-change-contracts.md

## Acceptance criteria

- [ ] One existing skill owns the retention rule and other workflow surfaces use concise pointers.
- [ ] Worked scenarios cover merged but retained workspace, shared artifact, blocked worker, cross-harness handoff and unknown owner.
- [ ] Each scenario preserves ignored originals and useful evidence until classified recovery/disposition is recorded.
- [ ] Small reversible tasks require no mandatory registry or archive service.
- [ ] Conformance scenarios flag contradictory disposable/retained guidance while preserving project-specific policy.
- [ ] Applicable guidance checks and repository gates pass; global text stays within its existing budget.

## Out of scope

Project-specific paths, device names, file formats, universal new byte thresholds, cleanup daemons, automatic deletion, and implementing #184. #181 owns the pruning recipe; #182 owns growth/trend inspection.

## Execution pickup 2026-11-02

The user asked this session to proceed after #184. This related retention-verification
follow-up is now in stream:test-verification; validation fields mirror the existing six
acceptance criteria. The ownership policy remains in the existing artifact-hygiene owner,
with a scoped note or project registry sufficient. Work runs in parallel with #182 using
disjoint file scopes; no new dependency edge or shared cleanup executor is introduced.
