---
id: "242"
title: "Bind owned provider clients to shared notification intents"
status: in_progress
blocked_by: ["238"]
priority: high
validation_criteria:
  - "Both owned routes preserve the shared intent lifecycle and exact live binding"
  - "Identity and replay regressions and existing desktop CLI compatibility pass"
  - "Agent guidance and tool coverage and repository gates pass"
  - "Independent exact-commit review and parent integration evidence are retained"
tags: ["stream:orchestration", "kind:enhancement"]
parent: "179"
assignee: "codex"
---
# Bind owned Claude and Kiro clients to shared message intents

## Outcome

Complete the shared interface prerequisite for #179 native qualification. Source
prerequisites are pushed: Codex notification v3 at 931e507 and owned provider
startup correction integrated at ea671807. Independent bridge design is retained
in the parent scratch handoff; the durable requirements are recorded here.

Extend native-notification v3 with claude-stream.send / claude-owned-stream and
kiro-acp.prompt / kiro-owned-acp routes. Preserve v1 unknown, v2 desktop bindings
and all existing v3 desktop/CLI actions and hashes. Reuse the canonical spool and
attempt lifecycle; add no coordinator, delivery ledger or automatic execution.

Persist exact route, target, messageId, contentHash, owner:{pid,generation},
sessionId and self-contained canonical text; Claude also persists a separately
chosen fresh protocolUuid. Strict one-snapshot data validation precedes hashing.
Both routes require action.sessionId === action.target.nativeId === live.sessionId
and exact owner PID/generation, where live comes from the actual held client.
Claude requires UUID session/protocol identity; Kiro retains the opaque negotiated
session ID and allocates its request ID only when prompt is actually invoked.

Export pure ownedStreamInput(action, actionHash, live), returning {route,input}.
Claude input is {messageId,messageHash,protocolUuid,sessionId,text}; Kiro input is
{messageId,messageHash,text}. Parent explicitly invokes the already-held client
after persisted attempt-start using only the returned stored action and hash.
No callback/command/grant/model selection, discovery, attachment, reconnect,
retry, new-ID repair or process adoption is added. Manual fallback remains default
until separate native qualification completes. This ticket requires no model call.

## Acceptance criteria

- [ ] Both routes use shared prepare/start/outcome state and exact live binding.
- [ ] Regression coverage rejects mismatched identity, hash, stale owner, unknown
      fields, mutable input and stale registry; existing action/hash behavior stays compatible.
- [ ] Agent guidance documents conversion, caller obligations and evidence limits;
      catalog coverage, focused tests and current repository gates pass.
- [ ] Independent critic accepts the exact commit and retained raw evidence before
      parent integration, deployment and push. Native qualification stays in #235–237.

## Artifact lifecycle

Keep raw focused checks and review evidence in parent scratch through #179 audit;
promote compact hash-indexed evidence and durable guidance at integration.
