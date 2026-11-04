---
id: "145"
title: "Detect another live session in the same checkout and suggest a worktree"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - "orient or handoff detects a concurrent session"
  - "Guidance names the worktree path"
tags: ["stream:tooling","epic:outcome-orchestration"]
assignee: "codex"
---

# Detect another live session in the same checkout and suggest a worktree

## Origin

Field report from philippines-trip, 2026-11-01. Two or three sessions (Claude, Codex) worked in the same checkout and branch at once: they regenerated the same dashboard, edited the same tickets and committed between each other's commits. The push gate was blocked three times by another session's uncommitted edits, and generated files had to be regenerated rather than merged.

## Acceptance criteria

- [x] orient (and handoff) detect another live session or recent foreign commits in the same checkout and say so.
- [x] Guidance recommends a per-session worktree for concurrent work and names how generated files (dashboards) are reconciled: regenerate, never hand-merge.
- [x] The detection is a cheap check, not a lock.

- [x] Fixtures distinguish shared-checkout evidence, remote-ahead evidence and unknown session liveness.
- [x] Guidance gives the appropriate response without presenting a worktree as a remote lock.

## Outcome-driven orchestration coordination

Proposal 19 approved. This ticket retains concurrent-checkout detection; #204 owns the new dispatch/review binding preflight. Reuse its identity inputs when available rather than creating another registry. Do not treat detection as a repository-wide lock.

## Accepted orchestration retro amendment (2026-11-04)

Sam approved applying and implementing these retro proposals after #179.
Distinguish evidence of a shared-checkout writer from another checkout pushing
the same remote branch. Recommend per-session isolation for shared local writes
and upstream reconciliation for remote advances. Worktrees do not prevent push races.

## Resolution (2026-11-04)

done: orient/handoff now acquire available host evidence and distinguish local overlap, caller-attested writing, cached remote advance and unknown liveness. Source and exact independent review promoted in docs/agents/research/retro-amendments-delivery-20261104.md and linked145-149-review. No live conflict canary or universal automatic discovery claimed. Parent-owned new logs/packets kept through batch wrap disposition; reused worktrees, their pre-existing ignored evidence, worker3.9MB validation dependencies and private171 remain protected. No lock, global settings or provider/model change.

### Verification
1. ✓ orient or handoff detects a concurrent session — "Read-only classifier plus orient/handoff use explicit Codex list_threads history/status/cwd route and delegated list_agents plus parent dispatch bindings. Supplied writer binding remains caller-attested; active declared cwd does not prove actual command cwd or writing. Six current focused fixtures PASS, including real Git dirty/remote cases and misleading filename refusal; no universal host detection claim."
2. ✓ Guidance names the worktree path — "Guidance names per-session worktree isolation for shared local edits and upstream reconciliation for remote advances; both can coexist, no remote lock/fetch/daemon. Current installed helper matches source and runs from target project root against separate tkt checkout. Exact reviewed worker98ac700 integratedd239371; premerge explicit syntaxPASS, actual push5PASS, docs/catalog153PASS, deployment50skillsPASS."
