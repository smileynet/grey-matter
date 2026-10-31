---
id: "125"
title: "Spike: can Claude Code (CLI and desktop) run the orchestrate loop? (probes P1-P13 on the fixture)"
status: done
blocked_by: ["124"]
tags: ["stream:tooling", "type:research"]
---

# Spike: can Claude Code (CLI and desktop) run the orchestrate loop? (probes P1-P13 on the fixture)

## What to build

A capability spike, run before the orchestrate skill is written (ticket 111). On the spike-0 fixture (ticket 124), in both trunk and PR modes, run the shared probes P1-P13 from [proposal 17](../docs/agents/proposals/17-orchestrator-skill.md#validation-spikes): dispatch, isolation, approvals, status line, question round-trip, await, read-only reviewer, per-child model, cap, landing, chat visual, cleanup and escalation.

Harness-specific questions: Compare the Agent tool with `isolation: worktree`, `claude --bg` and desktop `start_session`. Check that `worktree.baseRef: "head"` holds, that `SendMessage` resumes a finished worker (P5), whether auto mode overrides a reviewer pinned to read-only, and whether sub-agents load a skill the brief names. Check P11 on desktop (widget or artifact) and in the terminal CLI.

The results become this harness's reference file in the skill. Workers use the cheapest capable model.

## Acceptance criteria

- [x] Probes P1-P13 from [proposal 17](../docs/agents/proposals/17-orchestrator-skill.md#probes-run-in-every-spike) each recorded as pass, fail or not-possible-here, with the transcript excerpt or command output that shows it, as a dated section in [the primitives note](../docs/agents/research/harness-orchestration-primitives.md).
- [x] Each failed probe names the fallback the loop uses on this harness (usually sequential in-session).
- [x] The harness-specific questions in proposal 17 are answered, or each is listed under "couldn't verify" with what was tried.
- [x] Sandbox repos removed after the run (the GitHub repo only with the user's go-ahead).
- [ ] `node scripts/check-repo.mjs` passes.

## Resolution (2026-10-31)

done: P1-P13 recorded in docs/agents/research/harness-orchestration-primitives.md#spike-results-claude-code-2026-10-31 (commit 988a932). Pass: P1-P4, P6, P8, P10 trunk, P11, P12, P13; P5 partial (resume works but a QUESTION worker's no-change worktree is removed; fallback re-dispatch with ANSWER); P7 pass in default and auto, bypass not run (classifier refused); P9 no cap at 22. Not run: P10 PR mode (needs user approval for a GitHub repo), claude --bg (folder trust). Gate: node scripts/check-repo.mjs exit 1, only invariant 13 (inspect-footprint.test.mjs 3 failures), which fails identically on a clean HEAD worktree and is recorded on ticket 132; the unchecked AC is that gate. Sandboxes removed. Found: ticket 134.
