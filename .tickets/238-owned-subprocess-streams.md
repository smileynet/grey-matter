---
id: "238"
title: "Bound owned subprocess streams for native session adapters"
status: done
blocked_by: ["231"]
priority: high
validation_criteria:
  - "Owned process API binds verified identity explicit limits and exact stop handle"
  - "Real local child fixtures cover framing output bounds errors and deterministic stop"
  - "Agent guidance independent final-source review and integrated checks pass"
tags: ["stream:orchestration","kind:enhancement","epic:outcome-orchestration"]
parent: "179"
assignee: "codex"
---
# Bound process ownership and streams for native adapters

## Intent

Shared prerequisite for #236 and #237, not a coordinator or work ledger. Both adapters need an owned subprocess handle, bounded stream parsing and deterministic teardown. Reuse this rather than duplicating process control in each provider adapter.

## What to build

Add a small Node built-in-only internal module under orchestrate/scripts for verified executable path/hash, explicit argv/cwd and finite caller-provided resource/lifetime bounds; spawn with shell:false and hidden windows. Own the exact ChildProcess handle, record PID/generation/start/exit observations, handle spawn failure and write backpressure, bound output, and stop only that handle with bounded EOF/grace/force observation. Never adopt or kill another PID or infer graceful teardown from a task result. Provide reusable incremental UTF-8 newline-JSON decoding for Claude/Kiro, with malformed/truncated/oversized output classification. Keep provider protocol/session correlation and shared spool/intent semantics in their adapters. No automatic process restart, native/model calls, scheduler, configuration edits or arbitrary commands from JSON packets.

## Acceptance criteria

- [x] Small shared internal API binds actual owned process and explicit limits, rejects unsafe identities/inputs and preserves unrelated processes/configuration.
- [x] Real local Node child fixtures exercise chunking/UTF-8/backpressure, spawn error, malformed/oversized/partial output, normal EOF and bounded forced stop without claiming native-provider proof.
- [x] Dedicated agent guidance, script classification, independent exact-source acceptance and parent integrated checks pass; fixtures and logs have scoped retention.

## Resolution (2026-11-04)

done: shared bounded process/streams foundation integrated9953ad0, reviewed,deployed,pushed. Mutable-input validation bypass reproduced and fixed before acceptance. Windows escalation skip and executable replacement race documented. No native-provider calls or global settings. Parent179 continues235236237; raw/source artifacts retained for final179audit.

### Verification
1. ✓ Owned process API binds verified identity explicit limits and exact stop handle — "PASS: exact a575e340 source independently accepted and integrated9953ad0; verified canonical executable hash, immutable validated startup snapshots, explicit finite bounds and opaque exact-child stop. Independent mutation counterexample now rejects4bytes against original1byte input cap."
2. ✓ Real local child fixtures cover framing output bounds errors and deterministic stop — "PASS with explicit platform gap: worker,critic,parent node --test owned-process.test.mjs each12PASS0FAIL1WindowsSIGTERM-ignoreSKIP; real Node children cover UTF8/framing/backpressure/outputbounds/spawn/errors/EOF/deadline/ownedstop and unrelated sibling preservation. No native-provider or POSIX escalation proof."
3. ✓ Agent guidance independent final-source review and integrated checks pass — "PASS: actual clean dispatchpreflight, exact9953ad016cb4263372ab0c9976aaa173a96b8a8f independent integration review E57D0A4E138B8435AE270D4C0DD49A4D404190A0FF18B8781A813F75239EA671. Inventory138,premerge1syntaxfixture,prepush5/5,deploy50 noagy/nocrew,pushed. Raw failure/final review/logs indexed session-messaging-238-20261103.json retained through179audit."
