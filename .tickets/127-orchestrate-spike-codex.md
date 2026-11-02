---
id: "127"
title: "Spike: can Codex run the orchestrate loop? (probes P1-P13 on the fixture)"
status: done
blocked_by: ["124"]
tags: ["stream:orchestration", "type:research"]
---

# Spike: can Codex run the orchestrate loop? (probes P1-P13 on the fixture)

## What to build

A capability spike, run before the orchestrate skill is written (ticket 111). On the spike-0 fixture (ticket 124), in both trunk and PR modes, run the shared probes P1-P13 from [proposal 17](../docs/agents/proposals/17-orchestrator-skill.md#validation-spikes): dispatch, isolation, approvals, status line, question round-trip, await, read-only reviewer, per-child model, cap, landing, chat visual, cleanup and escalation.

Harness-specific questions: Compare `spawn_agent` inside `codex exec` with a top-level `codex exec -C <worktree>` per worker. Find the sandbox and approval setting that lets children write their worktree without the full bypass flag. Check `wait_agent` timeouts and the cap of 6 and depth of 1 (P9). Try `codex review --base` as the consequential-change reviewer. Check rendering in the app and the CLI.

The results become this harness's reference file in the skill. Workers use the cheapest capable model.

## Acceptance criteria

- [x] Probes P1-P13 from [proposal 17](../docs/agents/proposals/17-orchestrator-skill.md#probes-run-in-every-spike) each recorded as pass, fail or not-possible-here, with the transcript excerpt or command output that shows it, as a dated section in [the primitives note](../docs/agents/research/harness-orchestration-primitives.md).
- [x] Each failed probe names the fallback the loop uses on this harness (usually sequential in-session).
- [x] The harness-specific questions in proposal 17 are answered, or each is listed under "couldn't verify" with what was tried.
- [x] Sandbox repos removed after the run (the GitHub repo only with the user's go-ahead).
- [ ] `node scripts/check-repo.mjs` passes.

## Resolution (2026-11-01)

done: Codex spike recorded (trunk + PR) in harness-orchestration-primitives.md 'Spike results: Codex (2026-10-31)'. Both loops landed T1-T4 and escalated T5, checked independently (gh pr list 4 MERGED, tkt query, npm test 4/4, check() clean). Children commit under --approve-for-me without the bypass flag; followup_task resumes a questioning worker; 8 spawns and depth 2 accepted; codex review --base caught a planted bug. Sandboxes removed; smileynet/gm-orchestrate-fixture-pr-codex left for the user to delete. check-repo still red on 13 (ticket 132) and 15 (ticket 136), unrelated.
