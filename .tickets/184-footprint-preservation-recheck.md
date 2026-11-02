---
id: "184"
title: "Revalidate preservation state before cleanup recommendations"
status: in_progress
blocked_by: []
priority: medium
validation_criteria:
  - "Scenario fixtures cover retained ownership and protected unknown state"
  - "Applicable repository gates pass with explicit coverage limits"
tags: ["stream:tooling"]
---

# Revalidate preservation state before cleanup recommendations

## Intent source

Sam requested portable follow-ups from the Philippines-trip storage review on 2026-11-02. Read-only inspection of inspect-footprint.mjs found --recheck compares citation keep lists but does not establish that the full preservation context still matches. Local project cleanup scripts also illustrated why Git-clean and merged are insufficient. This brief is self-contained and does not require private project access.

## What to build

Strengthen the existing read-only footprint inspector so a prior cleanup recommendation becomes stale when relevant preservation state changes. Recheck canonical scope/path identity, candidate file inventory, ownership/retention inputs supplied by the project, workspace identity and observable active dependencies. Report missing or partial probes explicitly; do not imply inactive from an unavailable probe. Keep logical length, allocated accounting and unknown physical reclaim distinct. Do not interpret missing citations as proof of disposability.

Define a small bounded optional ownership/retention input seam rather than hard-code one project's queue, agent names or device leases. Reuse existing skip/ask semantics. No deletion executor in this ticket.

## Read first

- skills/meta/repository-artifact-hygiene/scripts/inspect-footprint.mjs
- scripts/inspect-footprint.test.mjs
- skills/meta/repository-artifact-hygiene/references/inspection.md
- .tickets/110-agent-footprint-guardrails.md
- .tickets/182-footprint-outside-repo-regrowth.md

## Acceptance criteria

- [ ] Synthetic fixtures make recommendations stale after scope/path identity, candidate inventory, ownership, workspace or observable dependency changes.
- [ ] Unknown ownership and partial probes retain explicit uncertainty rather than authorize cleanup.
- [ ] Symlink escapes and overlapping roots cannot silently widen scope or double count totals.
- [ ] Measurement output distinguishes logical and allocated accounting from unproven reclaimable space.
- [ ] Existing citation recheck behavior remains covered and the inspector stays read-only.
- [ ] Applicable inspector tests and repository gates pass; no whole-drive or live deletion test is needed.

## Out of scope

Automatic cleanup, deletion approval APIs, a central agent registry, a daemon, #182's trend/regrowth work, and changing device or cloud data.
