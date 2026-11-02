---
id: "126"
title: "Spike: can kiro-cli run the orchestrate loop? (probes P1-P13 on the fixture)"
status: done
blocked_by: ["124"]
tags: ["stream:orchestration", "type:research"]
---

# Spike: can kiro-cli run the orchestrate loop? (probes P1-P13 on the fixture)

## What to build

A capability spike, run before the orchestrate skill is written (ticket 111). On the spike-0 fixture (ticket 124), in both trunk and PR modes, run the shared probes P1-P13 from [proposal 17](../docs/agents/proposals/17-orchestrator-skill.md#validation-spikes): dispatch, isolation, approvals, status line, question round-trip, await, read-only reviewer, per-child model, cap, landing, chat visual, cleanup and escalation.

Harness-specific questions: Compare the native `subagent` tool with background `kiro-cli chat --no-interactive --agent <a> --model <m>` processes, and check whether the orchestrator can await a process's exit without polling. Probe V3's stricter-of-both approval rule and `trustedAgents` (P3). Run a terminal-only P11. kiro-cli is the primary harness.

The results become this harness's reference file in the skill. Workers use the cheapest capable model.

## Acceptance criteria

- [x] Probes P1-P13 from [proposal 17](../docs/agents/proposals/17-orchestrator-skill.md#probes-run-in-every-spike) each recorded as pass, fail or not-possible-here, with the transcript excerpt or command output that shows it, as a dated section in [the primitives note](../docs/agents/research/harness-orchestration-primitives.md).
- [x] Each failed probe names the fallback the loop uses on this harness (usually sequential in-session).
- [x] The harness-specific questions in proposal 17 are answered, or each is listed under "couldn't verify" with what was tried.
- [x] Sandbox repos removed after the run (the GitHub repo only with the user's go-ahead).
- [ ] `node scripts/check-repo.mjs` passes.

## Resolution (2026-11-01)

done: kiro-cli spike recorded (trunk + PR); check-repo still red on 13 and 15, tracked by 132 and 136

Evidence: the "Spike results: kiro-cli (2026-10-31)" section of `docs/agents/research/harness-orchestration-primitives.md` (commits 3514ea4, 9b835b7). Trunk and PR loops both landed T1-T4 and escalated T5; checked independently with `gh pr list --state all` (4 MERGED), `tkt query`, `npm test` 4/4 and `check()`. Local sandboxes removed; `smileynet/gm-orchestrate-fixture-pr-kiro` is left for the user to delete (the gh token lacks `delete_repo`).
