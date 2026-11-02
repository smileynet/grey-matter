---
id: "159"
title: "Spike: Codex multi_agent_v2 with the agent message board and wake-on-message"
status: done
blocked_by: ["124","127"]
tags: ["stream:orchestration", "type:research"]
validation_criteria:
  - "Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented."
  - "The question above answered yes or no, or listed under \"couldn't verify\" with what was tried."
  - "Sandbox folders removed after the run; settings changed for the spike restored or recorded."
---

# Spike: Codex multi_agent_v2 with the agent message board and wake-on-message

## What to build

Enable Codex 0.166's `multi_agent_v2`, `agent_message_board` and `wake_on_agent_messages` for one run each (`--enable <name>`, no config write) and rerun the dispatch, question and await probes.

**Question:** Do they change the spawn and depth limits seen in ticket 127, and can the message board replace polling `wait_agent`?

Source: [harness experimental features](../docs/agents/research/harness-experimental-features-20261101.md#proposed-spikes) (2026-11-01). Run on the spike-0 fixture (`scripts/spike-orchestrate-fixture.mjs`, ticket 124) in a throwaway checkout; any GitHub repo only with the user's go-ahead.

## Acceptance criteria

- [x] Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented.
- [x] The question above answered yes or no, or listed under "couldn't verify" with what was tried.
- [x] Sandbox folders removed after the run; settings changed for the spike restored or recorded.

## Reconciliation (2026-11-02)

Treat feature names and the cited version as hypotheses: inspect the installed CLI feature catalog first and run only available switches, process-scoped. Distinguish message delivery, wake behavior, same-worker continuation, concurrency and nesting outcomes. Missing or retired features are unsupported setup, not a failed worker or permission to edit global configuration.

## Resolution (2026-11-02)

done: documented process-only feature availability and native runtime setup limits, with accepted independent audit and exact cleanup evidence

### Verification
1. ✓ Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented. — "Dated report codex-dispatch-20261102.md, sanitized native receipt and independent critic audit0.92/high accepted. JSONparse/diffcheck pass; parent pre-merge skill-syntax-fixtures pass, pre-push doc-links/home-path pass after normalizing audit paths."
2. ✓ The question above answered yes or no, or listed under "couldn't verify" with what was tried. — "Could not verify runtime spawn/depth, message-board delivery, wake or polling replacement. Matched baseline/v2 and saved-session attempts show missing code-mode host, empty receivers and no child; exit0 classified survivor. Process feature overrides confirmed;188 owns setup diagnosis."
3. ✓ Sandbox folders removed after the run; settings changed for the spike restored or recorded. — "Exact owned fixture98400B,rawlogs6206B,savedrollout172195B recycled to OS trash and absence verified. No persistent setting write performed; no pre/post config hash captured, explicitly limited. Managed evidence worktree retained until parent archives after integration."
