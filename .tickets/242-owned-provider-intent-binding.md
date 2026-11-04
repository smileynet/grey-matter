---
id: "242"
title: "Bind owned provider clients to shared notification intents"
status: done
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

- [x] Both routes use shared prepare/start/outcome state and exact live binding.
- [x] Regression coverage rejects mismatched identity, hash, stale owner, unknown
      fields, mutable input and stale registry; existing action/hash behavior stays compatible.
- [x] Agent guidance documents conversion, caller obligations and evidence limits;
      catalog coverage, focused tests and current repository gates pass.
- [x] Independent critic accepts the exact commit and retained raw evidence before
      parent integration, deployment and push. Native qualification stays in #235–237.

## Artifact lifecycle

Keep raw focused checks and review evidence in parent scratch through #179 audit;
promote compact hash-indexed evidence and durable guidance at integration.

## Resolution (2026-11-04)

done: Shared existing intent lifecycle now binds owned Claude and Kiro inputs to the exact held client. Independent final source and evidence review accepted, current gates passed, guidance deployed and source pushed. Native receipt and startup qualification remain in235–237; no native result is claimed by this closure.

### Verification
1. ✓ Both owned routes preserve the shared intent lifecycle and exact live binding — "Integrated 7b22fcfa3a96027bfbdaeaa09fc182569097ba06: exact owned route/session/process binding uses persisted attempt action; shared converter has no native invocation. See docs/agents/research/evidence/session-messaging-242-20261103.json."
2. ✓ Identity and replay regressions and existing desktop CLI compatibility pass — "Parent node --test native-notification.test.mjs codex-queue.test.mjs: PASS 34/34, zero skips; source bytes unchanged from independently accepted 7864332. Prior malformed-identity finding and corrected raw checks retained."
3. ✓ Agent guidance and tool coverage and repository gates pass — "Current node scripts/gate.mjs pre-merge --include skill-syntax-fixtures: PASS1; pre-push PASS5; tool guidance inventory PASS144; deploy --no-agy --no-kirocrew completed50 skills. Owning references and catalog updated; no native delivery claim."
4. ✓ Independent exact-commit review and parent integration evidence are retained — "Exact final parent critic PASS7b22fcf, review SHA326B2F012187DBE7417B00FF2DAAF2480BE433A0F78CFC06CE0B4C8B8810C584. Six retained raw evidence files verified; parent source pushed, scratch retained through179final audit."
