---
id: "179"
title: "Implement inter-harness session messaging and wakeups"
status: open
blocked_by: ["208"]
priority: high
validation_criteria:
  - "Versioned message and session contracts are implemented"
  - "Each named harness has an evidence-backed adapter or explicit unsupported result"
  - "Existing session delivery and completion receipts are proved"
  - "Duplicate and restart and failure behavior have regression coverage"
  - "Permissions and owned configuration survive installation and cleanup"
  - "Orchestrate and harness references use the shared interface"
  - "Portable documented fixture and required repository gates pass"
tags: ["stream:tooling", "kind:enhancement"]
---

# Implement inter-harness session messaging and wakeups

## Origin and outcome

Sam requested implementation work in grey-matter after philippines-trip proved a native Codex/Antigravity message round trip. An orchestrator should address an existing worker across harnesses, receive completion/questions and resume after interruption without copy-paste or dependence on one vendor's child-agent tools.

Extend the shipped orchestrate skill (#111); do not replace its ticket/review/landing loop. Reuse the capability evidence and fixtures from #155–#162 and GUI watch work #173. #162 compares external driver surfaces; this ticket delivers the shared communication implementation and integration. Further harness discovery may become bounded child work, without making unsupported APIs appear supported.

## Portable evidence

The source repository is private; all links are pinned to philippines-trip commit 769611d, accessible from another machine without its local scratch files:

- [Research and authorized spike results](https://github.com/smileynet/philippines-trip/blob/769611d/.memory/research/codex-antigravity-communication.md).
- [Source ticket 225 with evidence/limits](https://github.com/smileynet/philippines-trip/blob/769611d/.tickets/225-antigravity-sidecar-spike.md).
- [Branch-aware durable mailbox](https://github.com/smileynet/philippines-trip/blob/769611d/tools/coord_mailbox.py), [mailbox tests](https://github.com/smileynet/philippines-trip/blob/769611d/tools/test_coord_mailbox.py), [status tool](https://github.com/smileynet/philippines-trip/blob/769611d/tools/coord_status.py), [ref watcher](https://github.com/smileynet/philippines-trip/blob/769611d/tools/watch_remote.sh), and [orchestration contract](https://github.com/smileynet/philippines-trip/blob/769611d/.memory/specs/worktree-orchestration.md).

Observed on Mac: Codex CLI 0.164.0 exposes codex queue; Antigravity App 2.28.2 launches native sidecars with injected agentapi. One native send-message canary reached the existing busy art conversation; its acknowledgment returned to the existing Codex coordinator. Replaying the ID after restarting the temporary relay suppressed another send. Both relay processes stopped and original parsed settings were restored. This proves those bounded cases, not idle delivery, crash recovery or durable exactly-once delivery. The throwaway relay was not committed or promoted as a production bridge.

Primary interface docs: [Codex queue](https://learn.chatgpt.com/docs/cli/reference), [Antigravity sidecars](https://antigravity.google/docs/sidecars), [Antigravity completion hooks](https://antigravity.google/docs/hooks/). Revalidate current versions, supported account scope and warnings before implementation.

## Implementation scope

1. Define a small versioned message envelope and runtime session registry. Bind project/host, harness/interface/version, exact existing session ID, worktree/branch, role and lifecycle generation. Messages carry stable ID, correlation/reply ID, kind, sender/recipient, ticket, actual commit and durable handoff reference. Keep tkt as work ledger; registry is routing/recovery state, not another task board.
2. Separate durable transport from wakeup. Commit or atomically spool a message first, then use a harness adapter to notify the exact target. Distinguish queued/accepted, received, working and completed; a zero exit does not prove receipt. A shared MCP queue alone is not an idle wakeup implementation.
3. Discover and implement adapters for Codex desktop/CLI, Antigravity App/CLI/IDE, Claude Code, kiro-cli and Kiro Crew. Load harness references on demand. Native send, owned headless process input, polling and unavailable are different capabilities. Never silently substitute a new run, cloned history or last-active window for the selected existing conversation. Record real limitations per interface/platform/version.
4. Add scoped completion/question/result reporting and bounded event waits. Acknowledge once, suppress duplicate business processing, prevent ack loops, checkpoint cursors and recover pending work across coordinator/relay restart. Define ambiguous send outcomes, bounded retry/backoff, timeout and dead-letter behavior without asserting impossible exactly-once guarantees.
5. Prefer public native APIs/CLIs/hooks. No private RPC/token extraction, automatic approval expansion, YOLO workaround, provider switch, destructive cleanup or credential reset. Peer messages cannot manufacture human authorization. Respect existing model/provider policy and tool grants.
6. Installation/cleanup changes only owned entries, preserves concurrent user settings and records exact process/resource ownership. Do not restart a busy app or stop another task's processes. Keep credentials, private transcripts and raw auth environment out of logs/committed fixtures. Bind reset/cleanup to the owned runtime generation, not only a static process type/name.
7. Integrate the shared interface into orchestrate worker/reviewer briefs and harness references. The quiet heartbeat/mailbox fallback remains for unsupported or failed wakeups. Do not ship a parallel second orchestrator.

## Acceptance criteria

- [ ] Versioned envelope/session schemas and a narrow shared send/receive/status interface are implemented with explicit routing and acknowledgment states.
- [ ] Each named harness/interface has a current primary-source and observed capability record, with a tested adapter where supported or precise unsupported/partial result and fallback; no invented existing-session attachment.
- [ ] Disposable fixture proves exact existing-target delivery, question/reply and completion receipts, busy/idle behavior where supported, and refusal of wrong/missing host/session without creating a replacement.
- [ ] Regressions cover duplicate IDs, ack loops, crash before/after send, restart/replay, busy/stale targets, permissions denied, timeouts, changed runtime ownership and ambiguous receipt; partial/unsupported cases cannot produce a pass.
- [ ] Installation/stop/uninstall preserve unrelated settings, agents, data and approvals, with evidence-backed rollback and no leaked credentials/transcripts.
- [ ] Orchestrate and harness references use the implementation and documented fallback, preserving tkt authority, reviewer gates and existing authorization.
- [ ] Portable fixture/commands run on supported macOS/Windows environments or declare an observed platform gap; required repository gates and skill syntax checks pass. No live user conversation is used without explicit authorization.

## Delivery sequence

Contract and deterministic fixture first; then graduate the proved Codex/Antigravity path, extend/test Claude/kiro-cli/Kiro Crew through their current supported surfaces, and wire into orchestrate. Split implementation children if needed, retaining this end-to-end outcome. No permanent bridge was installed by filing this ticket.

## Filing verification

Ticket brief and evidence-boundary review: PASS; seven acceptance criteria and no findings on this ticket. The strict tracker check retains seven pre-existing unchecked-AC warnings on closed tickets. On macOS the pre-push home-path check also reports 225 locations across 18 unchanged historical files; every offending blob matches origin/main 9074ced. The new ticket passes the actual home-path scanner in isolation. Following docs/agents/local-gates.md, filing uses the named SKIP=home-path baseline exception plus the ticket-graph check; this is not a claim that the full baseline gate passes. No historical receipts are rewritten here.

## Outcome-driven orchestration coordination

Proposal 19 implementation approved 2026-11-03. Retain this ticket as shared message/session interface owner; coordinate #202 outcome contracts and #204 dispatch bindings. Durable spool/fixtures may proceed independently; no native Agy action, real user conversation or global configuration change is authorized by this note. Unsupported/unqualified adapters stay explicit; deterministic delivery does not prove native wakeup.
