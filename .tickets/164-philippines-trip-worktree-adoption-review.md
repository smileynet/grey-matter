---
id: "164"
title: "Review philippines-trip's worktree rules and audit script for adoption"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Each item has an adopt, adapt or skip recommendation"
  - "Adopted items are filed against #145 or #148"
tags: ["stream:tooling", "type:research"]
---

# Review philippines-trip's worktree rules and audit script for adoption

## Origin

philippines-trip, 2026-11-01. After the concurrent-session collisions behind #145 and the
Codex takeover behind #148, that project wrote its own rules and helper (its tickets #205
and #206). Sam asked for a review of what grey-matter should adopt. Not urgent; do it later.

Links are pinned to philippines-trip commit `73ca012` (a private repository; you need
access to `smileynet/philippines-trip`).

## What to review

| Item | Link | Likely target |
|---|---|---|
| Worktree audit and takeover script (stdlib Python, Git 2.40+): classifies worktrees and local, remote and detached branches as landed, unique, superseded, archived or protected; lists `git cherry` unique commits and plain blobs under LFS paths; dry-run plan by default; `--archive`, `--remove-worktrees`, `--delete-branches`, `--delete-remote` | [tools/worktree_audit.py](https://github.com/smileynet/philippines-trip/blob/73ca012/tools/worktree_audit.py) | #148 helper script |
| Its fixture-repo tests (9, one per classification and safety rule) | [tools/test_worktree_audit.py](https://github.com/smileynet/philippines-trip/blob/73ca012/tools/test_worktree_audit.py) | #148 |
| Concurrent-agent rules: one worktree per agent, orchestrator owns the main checkout, owners recorded for ticket and non-ticket work, file-area ownership with named shared files | [AGENTS.md, Concurrent Agents](https://github.com/smileynet/philippines-trip/blob/73ca012/AGENTS.md#concurrent-agents) | #145 guidance |
| "Taking work back" procedure that runs the audit | [agent-handoff.md, Taking work back](https://github.com/smileynet/philippines-trip/blob/73ca012/.memory/guides/agent-handoff.md#taking-work-back) | #148 procedure |
| Orchestration plan: worker streams, critic, waves, simulator hand-off | [worktree-orchestration.md](https://github.com/smileynet/philippines-trip/blob/73ca012/.memory/specs/worktree-orchestration.md) | reference only |
| Source tickets | [#205](https://github.com/smileynet/philippines-trip/blob/73ca012/.tickets/205-one-worktree-per-agent.md), [#206](https://github.com/smileynet/philippines-trip/blob/73ca012/.tickets/206-worktree-audit-tool.md) | context |

Project-specific parts to strip before adopting: file-area names, the
`dashboard-execution-order.json` owners map and the dashboard steps.

## Acceptance criteria

- [ ] Each item above has a recommendation (adopt, adapt or skip) with its reason.
- [ ] Recommended adoptions are written into #145 or #148 (or new tickets) rather than built here.
- [ ] Known limits are assessed: ticket numbers come from branch names (a branch without one is never "superseded"); archive tags stay local unless a remote branch is deleted; the base defaults to the remote's HEAD.
