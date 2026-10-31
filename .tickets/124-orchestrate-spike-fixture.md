---
id: "124"
title: "Spike 0: disposable orchestration fixture repo (five shaped tickets, trunk and PR variants)"
status: in_progress
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

- [ ] Running the script twice gives identical fixtures; `tkt ready` in the fixture lists T1, T2, T3 and T5, and T4 is blocked by T1.
- [ ] `npm test` passes on the fresh fixture and fails after a deliberate mutation of `a.js`.
- [ ] The PR variant refuses to create a GitHub repo without an explicit flag.
- [ ] A cleanup command removes the sandbox, and removes the GitHub repo only behind its own flag.
- [ ] `node scripts/check-repo.mjs` passes.
