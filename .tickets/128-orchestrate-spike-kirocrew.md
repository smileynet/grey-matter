---
id: "128"
title: "Spike: can Kiro Crew run the orchestrate loop? (probes P1-P13 on the fixture)"
status: open
blocked_by: ["124"]
tags: ["stream:tooling", "type:research"]
---

# Spike: can Kiro Crew run the orchestrate loop? (probes P1-P13 on the fixture)

## What to build

A capability spike, run before the orchestrate skill is written (ticket 111). On the spike-0 fixture (ticket 124), in both trunk and PR modes, run the shared probes P1-P13 from [proposal 17](../docs/agents/proposals/17-orchestrator-skill.md#validation-spikes): dispatch, isolation, approvals, status line, question round-trip, await, read-only reviewer, per-child model, cap, landing, chat visual, cleanup and escalation.

Harness-specific questions: Map fixture tickets to `work_dispatch` items with `file` or `pr_checks` acceptance, and check whether the worker makes its own worktree from the brief. Check `monitor_start` wakes. The conductor has no `fs_write` and its shell isn't auto-approved, so find out who runs `tkt close` and edits the dashboard. Probe `chat_tag` and `session_ledger_record` as guarded steps (ticket 95). Decide which is the one board: the Board tab or the dashboard. Research in [kirocrew-orchestration](../docs/agents/research/kirocrew-orchestration.md).

The results become this harness's reference file in the skill. Workers use the cheapest capable model.

## Acceptance criteria

- [ ] Probes P1-P13 from [proposal 17](../docs/agents/proposals/17-orchestrator-skill.md#probes-run-in-every-spike) each recorded as pass, fail or not-possible-here, with the transcript excerpt or command output that shows it, as a dated section in [the primitives note](../docs/agents/research/harness-orchestration-primitives.md).
- [ ] Each failed probe names the fallback the loop uses on this harness (usually sequential in-session).
- [ ] The harness-specific questions in proposal 17 are answered, or each is listed under "couldn't verify" with what was tried.
- [ ] Sandbox repos removed after the run (the GitHub repo only with the user's go-ahead).
- [ ] `node scripts/check-repo.mjs` passes.
