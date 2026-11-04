---
id: "238"
title: "Bound owned subprocess streams for native session adapters"
status: in_progress
blocked_by: ["231"]
priority: high
validation_criteria:
  - "Owned process API binds verified identity explicit limits and exact stop handle"
  - "Real local child fixtures cover framing output bounds errors and deterministic stop"
  - "Agent guidance independent final-source review and integrated checks pass"
tags: ["stream:orchestration", "type:enhancement"]
parent: "179"
assignee: "codex"
---
# Bound process ownership and streams for native adapters

## Intent

Shared prerequisite for #236 and #237, not a coordinator or work ledger. Both adapters need an owned subprocess handle, bounded stream parsing and deterministic teardown. Reuse this rather than duplicating process control in each provider adapter.

## What to build

Add a small Node built-in-only internal module under orchestrate/scripts for verified executable path/hash, explicit argv/cwd and finite caller-provided resource/lifetime bounds; spawn with shell:false and hidden windows. Own the exact ChildProcess handle, record PID/generation/start/exit observations, handle spawn failure and write backpressure, bound output, and stop only that handle with bounded EOF/grace/force observation. Never adopt or kill another PID or infer graceful teardown from a task result. Provide reusable incremental UTF-8 newline-JSON decoding for Claude/Kiro, with malformed/truncated/oversized output classification. Keep provider protocol/session correlation and shared spool/intent semantics in their adapters. No automatic process restart, native/model calls, scheduler, configuration edits or arbitrary commands from JSON packets.

## Acceptance criteria

- [ ] Small shared internal API binds actual owned process and explicit limits, rejects unsafe identities/inputs and preserves unrelated processes/configuration.
- [ ] Real local Node child fixtures exercise chunking/UTF-8/backpressure, spawn error, malformed/oversized/partial output, normal EOF and bounded forced stop without claiming native-provider proof.
- [ ] Dedicated agent guidance, script classification, independent exact-source acceptance and parent integrated checks pass; fixtures and logs have scoped retention.
