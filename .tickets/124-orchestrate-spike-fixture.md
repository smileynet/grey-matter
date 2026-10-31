---
id: "124"
title: "Spike 0: disposable orchestration fixture repo (five shaped tickets, trunk and PR variants)"
status: done
blocked_by: []
tags: ["stream:tooling", "type:research"]
---

# Spike 0: disposable orchestration fixture repo (five shaped tickets, trunk and PR variants)

## What to build

A script, `scripts/spike-orchestrate-fixture.mjs`, that creates a disposable sandbox repo outside grey-matter. The repo gets `tkt init`, a few-second `npm test` suite, a `delivery-dashboard` template dashboard, and the five shaped tickets T1-T5 from [proposal 17](../docs/agents/proposals/17-orchestrator-skill.md#shared-fixture-spike-0):

- two disjoint tickets, one of them with a deliberate QUESTION
- one that overlaps
- one that is blocked
- one that needs escalation

The script has two variants: trunk (no remote) and branch/PR (a throwaway private GitHub repo, created only after the user approves). The harness spikes 125-129 all run on this fixture.

## Acceptance criteria

- [x] Running the script twice gives identical fixtures; `tkt ready` in the fixture lists T1, T2, T3 and T5, and T4 is blocked by T1.
- [x] `npm test` passes on the fresh fixture and fails after a deliberate mutation of `a.js`.
- [x] The PR variant refuses to create a GitHub repo without an explicit flag.
- [x] A cleanup command removes the sandbox, and removes the GitHub repo only behind its own flag.
- [x] `node scripts/check-repo.mjs` passes.

## Resolution (2026-10-31)

done: scripts/spike-orchestrate-fixture.mjs (create/clean, trunk and pr variants) with tests as check-repo invariant 17; proposal 17 fixture table updated to the built shape (a.js seeded, T1 extends it). No GitHub repo created; the pr variant awaits user approval.
