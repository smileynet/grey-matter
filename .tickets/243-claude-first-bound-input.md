---
id: "243"
title: "Allow the first bound Claude input during owned stream startup"
status: open
blocked_by: ["242"]
priority: high
validation_criteria:
  - "First actual bound input preserves exact identity and busy refusal across init"
  - "Both startup orders and mismatched unsafe or failed startup regressions pass"
  - "Independent review guidance integrated gates and deployment are evidenced"
tags: ["stream:orchestration", "kind:bug"]
parent: "179"
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

- [ ] First actual bound input is accepted during startup once, retaining exact
      identity and busy/duplicate refusal through init and terminal result.
- [ ] Meaningful regressions cover init-after-input fake peer, existing init-first
      sequence, mismatched/unsafe init, early disconnect and failed first write.
- [ ] Guidance distinguishes static admission, post-input init, receipt and result;
      independent exact-source review, parent integrated gates and deployment pass.

Native qualification remains #236's responsibility; source tests do not close it.
Retain raw source/probe/review artifacts through #179 final audit and promote a
compact durable evidence index with the observed limits.
