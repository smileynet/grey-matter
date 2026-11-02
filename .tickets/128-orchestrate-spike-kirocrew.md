---
id: "128"
title: "Spike: can Kiro Crew run the orchestrate loop? (probes P1-P13 on the fixture)"
status: done
blocked_by: ["124"]
tags: ["stream:orchestration", "type:research"]
---

# Spike: can Kiro Crew run the orchestrate loop? (probes P1-P13 on the fixture)

## What to build

A capability spike, run before the orchestrate skill is written (ticket 111). On the spike-0 fixture (ticket 124), in both trunk and PR modes, run the shared probes P1-P13 from [proposal 17](../docs/agents/proposals/17-orchestrator-skill.md#validation-spikes): dispatch, isolation, approvals, status line, question round-trip, await, read-only reviewer, per-child model, cap, landing, chat visual, cleanup and escalation.

Harness-specific questions: Map fixture tickets to `work_dispatch` items with `file` or `pr_checks` acceptance, and check whether the worker makes its own worktree from the brief. Check `monitor_start` wakes. The conductor has no `fs_write` and its shell isn't auto-approved, so find out who runs `tkt close` and edits the dashboard. Probe `chat_tag` and `session_ledger_record` as guarded steps (ticket 95). Decide which is the one board: the Board tab or the dashboard. Research in [kirocrew-orchestration](../docs/agents/research/kirocrew-orchestration.md).

The results become this harness's reference file in the skill. Workers use the cheapest capable model.

## Acceptance criteria

- [x] Probes P1-P13 from [proposal 17](../docs/agents/proposals/17-orchestrator-skill.md#probes-run-in-every-spike) each recorded as pass, fail or not-possible-here, with the transcript excerpt or command output that shows it, as a dated section in [the primitives note](../docs/agents/research/harness-orchestration-primitives.md).
- [x] Each failed probe names the fallback the loop uses on this harness (usually sequential in-session).
- [x] The harness-specific questions in proposal 17 are answered, or each is listed under "couldn't verify" with what was tried.
- [x] Sandbox repos removed after the run (the GitHub repo only with the user's go-ahead).
- [ ] `node scripts/check-repo.mjs` passes.

## Resolution (2026-11-01)

done: Kiro Crew spike recorded (trunk + PR) in harness-orchestration-primitives.md 'Spike results: Kiro Crew (2026-11-01)'. Kiro Crew self-updated 0.9.0 -> 0.11.1 mid-run; three blockers cleared with the user's approval (per-command approval -> YOLO; agent.sandbox_allow_unsandboxed_exec=true, since 0.11.1 has no Windows sandbox; agent.session_control=true plus config defaults --adopt). Both loops landed T1-T5, checked independently (trunk: git log --graph, tkt query 1-5 done, npm test 4/4; PR: 6 PRs MERGED each touching only Touches files, npm test 5/5, check() clean). P13 FAILED in both modes: the T5 worker deleted the README and the conductor merged it. Trunk conductor skipped accept_eval.py; same-worker question resume worked. Fixtures, the private repo smileynet/gm-orchestrate-fixture-pr-kirocrew and YOLO were removed or turned off afterwards. check-repo --static: only red is links to the harness-surfaces files still being written (uncommitted).
