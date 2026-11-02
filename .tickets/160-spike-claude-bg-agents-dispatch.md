---
id: "160"
title: "Spike: Claude Code --bg sessions and notify_when_idle as the dispatch layer"
status: done
blocked_by: ["124","125"]
tags: ["stream:orchestration", "type:research"]
validation_criteria:
  - "Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented."
  - "The question above answered yes or no, or listed under \"couldn't verify\" with what was tried."
  - "Sandbox folders removed after the run; settings changed for the spike restored or recorded."
---

# Spike: Claude Code --bg sessions and notify_when_idle as the dispatch layer

## What to build

Use Claude Code's `claude --bg` background sessions (each in its own worktree), `claude agents --json`, and cross-session `SendMessage` with `notify_when_idle` as the orchestrate skill's dispatch layer, instead of in-session sub-agents.

**Question:** Do automatic worktrees, the push-but-never-main rule and the roughly one-hour idle reaper fit the ticket → worktree → land flow on Windows, and is the idle notice a reliable worker-done signal?

Source: [harness experimental features](../docs/agents/research/harness-experimental-features-20261101.md#proposed-spikes) (2026-11-01). Run on the spike-0 fixture (`scripts/spike-orchestrate-fixture.mjs`, ticket 124) in a throwaway checkout; any GitHub repo only with the user's go-ahead.

## Acceptance criteria

- [x] Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented.
- [x] The question above answered yes or no, or listed under "couldn't verify" with what was tried.
- [x] Sandbox folders removed after the run; settings changed for the spike restored or recorded.

## Reconciliation (2026-11-02)

Use an owned fixture with session-scoped settings. If background sessions require folder trust, record the supported trust boundary and unresolved human-only setup; never broaden persistent trust silently. Correlate idle notifications with a final structured result and independently checked artifacts, since idle by itself is not acceptance.

## Resolution (2026-11-02)

done: qualified one native cross-session message/idle exchange with critic-reviewed evidence and cleanup; recorded trust, landing and timed-reaper limits

### Verification
1. ✓ Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented. — "Dated Claude background report, native receipt and independent critic audit0.92/high accepted; exact message success, worker marker reply and separate idle notice observed. Parent syntax-fixtures, doc-links and home-path gates passed. Worker fixture npm test1passed0failed/skipped/cancelled/todo."
2. ✓ The question above answered yes or no, or listed under "couldn't verify" with what was tried. — "One same-machine main-session messaging/idle exchange confirmed. Trusted fixture background dispatch and automatic worktree creation could not verify: Workspace not trusted. Push/landing and hour reaper not exercised. Idle is turn-end, not ticket acceptance."
3. ✓ Sandbox folders removed after the run; settings changed for the spike restored or recorded. — "Verified exact ownsession9031e15d-71b7-4f88-b165-acddb9573b77/name/cwd; stop/rm and listing[] independently checked. Fixture156047B/rawlog174595B/collector5907B OSrecycled withabsences. Settings snapshot afterrunonly, no prehash/no invarianceproof; persistenttrustnot broadened."
