---
id: "243"
title: "Allow the first bound Claude input during owned stream startup"
status: done
blocked_by: ["242"]
priority: high
validation_criteria:
  - "First actual bound input preserves exact identity and busy refusal across init"
  - "Both startup orders and mismatched unsafe or failed startup regressions pass"
  - "Independent review guidance integrated gates and deployment are evidenced"
tags: ["stream:orchestration", "kind:bug"]
parent: "179"
assignee: "codex"
---
# Support a first bound Claude input during startup

## Observed problem

The #236 parent init-only probe ran the pinned Claude 2.1.316 binary with the
reviewed tool/MCP-empty restricted stream invocation. During a bounded20-second
wait with no stdin input it emitted zero stdout/stderr, so ready never resolved.
The owned root and child were observed before stop and absent afterward; stop
exited0 and stdio closed. This is a qualification failure for the adapter's
ready-before-first-send sequence, not proof that init never appears or always
requires input. Raw parent evidence and independent postflight are retained for
#179; no dummy prompt or model input was sent in that probe.

## Outcome and scope

Permit the first ACTUAL durably accepted and attempt-started shared message to
enter the already-owned Claude process while startup is pending. It must carry
the exact independently chosen session UUID and fresh persisted protocol UUID.
Use only the documented stream-json user input shape. No dummy bootstrap, new
session, hidden retry, fallback or weaker tool/configuration flags is authorized.

The protocol retains that one in-flight identity before writing. When system/init
arrives it must still validate the exact session, model/version metadata and
empty tools/MCP constraints, then keep the pending turn busy. Match the actual
replay/result correlation; prevent a second input until the first terminal result.
Startup errors, wrong init, write failure and disconnect remain explicit failed
or ambiguous states. The caller may await ready to confirm metadata after its
first write; ready alone never proves receipt or completion.

Parent admission for the tiny native canary must record explicit first-input
authorization, current documented fixed flags and selected model, exact source
and executable hashes, private runtime and finite limits. It cannot require
pre-input init metadata that this observed sequence did not provide. Only the
parent runs native/model calls after independent exact-source/helper review.

Worker scope: claude-stream.mjs, claude-stream.test.mjs and its reference only.
Parent owns global guidance, reports, shared dependencies, native execution,
integration, gates, deploy, closure and both dashboards. Existing shared intent
binding #242 remains authoritative; no new notification ledger is introduced.

## Acceptance criteria

- [x] First actual bound input is accepted during startup once, retaining exact
      identity and busy/duplicate refusal through init and terminal result.
- [x] Meaningful regressions cover init-after-input fake peer, existing init-first
      sequence, mismatched/unsafe init, early disconnect and failed first write.
- [x] Guidance distinguishes static admission, post-input init, receipt and result;
      independent exact-source review, parent integrated gates and deployment pass.

Native qualification remains #236's responsibility; source tests do not close it.
Retain raw source/probe/review artifacts through #179 final audit and promote a
compact durable evidence index with the observed limits.

## Resolution (2026-11-04)

done: Corrected the observed readiness-before-first-input gap with a single actual bound startup input, preserving both startup orders and ambiguity semantics. Independent exact-source review and current parent gates passed, guidance deployed and source pushed. Native two-turn qualification remains236; its helper is separately reviewed before execution.

### Verification
1. ✓ First actual bound input preserves exact identity and busy refusal across init — "Integrated and pushed e9a771681eb1871773399c7dcbb4818b817638eb: first actual shared-bound message is snapshotted and active during startup; init preserves busy refusal and exact replay/result identity. Source is byte-identical to accepted f051384."
2. ✓ Both startup orders and mismatched unsafe or failed startup regressions pass — "Parent node --test skills/engineering/orchestrate/scripts/claude-stream.test.mjs PASS14/14 zero skips, including stdin-before-init local fake peer, init-first compatibility, unsafe or mismatched init, first-write failure and disconnect ambiguity. Native init-only timeout retained separately; no native first-input success claim."
3. ✓ Independent review guidance integrated gates and deployment are evidenced — "Independent final integration PASS e9a7716 review EB0E7F63835F1EFB2FF7D3788443E4D52AF35F47826E1BE74AB05283CFFFCF70; eight indexed raw files verified. Current pre-merge syntaxfixture PASS1, pre-push PASS5, tool inventory PASS144, deploy no-agy/no-kirocrew completed50, source pushed. Raw artifacts retained through179audit."
