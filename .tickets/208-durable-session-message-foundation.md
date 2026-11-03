---
id: "208"
title: "Deliver durable session messaging contracts and recovery fixtures"
status: done
blocked_by: []
priority: high
validation_criteria:
  - "Versioned session/message contracts reject wrong or stale existing targets and preserve state without credentials or ticket-ledger duplication."
  - "Deterministic receipt, duplicate/conflict/restart and failure cases pass while unqualified native lanes remain explicit."
  - "Skill usage guidance, script inventory, independent review, current checks and artifact disposition are complete."
tags: ["stream:tooling", "kind:enhancement"]
parent: "179"
assignee: "codex"
---
# Deliver the durable session/message contract and recovery fixture

## Intent

Child implementation slice of existing #179, authorized by the user's approval of [proposal 19](../docs/agents/proposals/19-outcome-driven-orchestration.md). Keep #179 as the end-to-end owner; this child does not claim all native adapters or cross-host wakeups are qualified.

## What to build

Create a small file-backed, versioned session registry/message spool with an explicit operator CLI in the orchestrate skill. Keep tkt as the work ledger. Bind project/host, harness/interface/version, exact opaque existing native session ID, role, worktree/branch and lifecycle generation. Require exact selected target/generation; never choose last-active, start a replacement, copy conversation history or change trust/configuration. Keep credentials and model settings outside the contract.

Persist a bounded message with stable ID/correlation before notification. Distinguish queued, native-adapter accepted, receiver-observed received/handled and acknowledged; exit 0/accepted is not delivery or task acceptance. Implement meaningful duplicate suppression, changed-content ID conflict rejection, restart/replay and no acknowledgment loops. Avoid unguarded cross-process JSONL appends; use atomic records/owned locking and fail clearly on ambiguous or unavailable delivery. Do not claim exactly-once or silently retry ambiguous sends.

Implement a deterministic fake/manual polling adapter and evidence-backed capability inventory for Codex desktop/CLI, Claude Code, kiro-cli, Kiro Crew and Antigravity interfaces. Native lanes without current qualification must return an explicit unsupported/unqualified result, not a fake success. No Agy commands, live user conversations, model calls, installs or global changes. Fresh native qualification remains parent #179 work with existing security holds.

Add task-specific skill guidance for every new CLI: exact commands/inputs, root/session selection, mutation and authorization, output/receipt interpretation, retention and unsupported limits. Register new scripts/modules/tests in the #203 inventory; coordinate shared SKILL.md/catalog edits through the parent. Extend deterministic fixtures rather than rerunning completed native/model experiments. Use a named caller-provided private runtime root with safe init/preservation, not a new committed task ledger.

## Acceptance criteria

- [x] Versioned session/message contracts reject ambiguous, missing, stale-generation and wrong-target inputs before delivery; messages and control state persist safely across restart without credentials or ticket-state duplication.
- [x] Deterministic delivery/reply/completion receipts, duplicate/conflict/replay handling, permission/timeout/ambiguous outcomes and acknowledgment-loop prevention have meaningful regression evidence; unsupported native lanes stay explicit.
- [x] Owning skill guidance, complete script inventory, independent exact-source review, classified repository checks and artifact ownership/disposition are recorded. Parent #179 remains open for its remaining native qualification/integration requirements.

## Resolution (2026-11-03)

Delivered and deployed the durable local session/message foundation under parent179: explicitprivate root, versionedexacttargets, queued/manualreceipt lifecycle and safe failure/replay semantics with skill commands. This child does not notify native sessions or qualify unsupported harnesses;179 remainsopenfornative integration. Promoted source/compact evidence; retain rawcopies/worktree for179andfinalaudit, unrelated histories untouched.

### Verification
1. ✓ Versioned session/message contracts reject wrong or stale existing targets and preserve state without credentials or ticket-ledger duplication. — "PASS: independently accepted5b32423 and byte-equivalent currentmain; complete existing-target metadata includes requiredharnessVersion/generation, exactrouting, supersession, persistentversionedprivatecore and safeinitwithoutticketledgermirror orcredentials."
2. ✓ Deterministic receipt, duplicate/conflict/restart and failure cases pass while unqualified native lanes remain explicit. — "PASS: critic andparent11/11 regressions including Windows tempACL, separateCLIrestart, route/version/generation rejection, stableduplicate/conflict, correlatedreply/done, orderedreceipts/noackloop, unchangedreplay andambiguouslock. Nativeadapters explicitlyunsupportedhere; noexactlyonce/powerloss/stressclaim."
3. ✓ Skill usage guidance, script inventory, independent review, current checks and artifact disposition are complete. — "PASS: owningSKILL/ref andoperator/test inventory registration (146currentpaths), independentintegratedreview, currentpremerge2/2 prepush5/5, deploy --no-agy --no-kirocrew installed50skills andpush. Rawparent-verifiedcriticcopies indexed in evidence/orchestration-delivery-208-20261103.json; worktree/runtime inputs retainedonlyfor179/cycleaudit."
