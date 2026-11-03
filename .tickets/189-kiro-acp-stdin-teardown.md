---
id: "189"
title: "Diagnose: Kiro V3 ACP relay times out after stdin closes"
status: done
blocked_by: ["162"]
validation_criteria:
  - "The EOF teardown failure is reproduced or marked obsolete, separating successful prompt/cancel/load responses from process settlement."
  - "The user-approved workflow handling documents separate task/teardown acceptance, bounded owned-process observation, no duplicate retry and preserved sessions; unresolved native repair is deferred to #201."
  - "Owned processes, sessions and fixtures have recorded disposition; required checks pass and the driver guidance states the remaining limit."
tags: ["stream:orchestration", "kind:bug"]
---

# Diagnose: Kiro V3 ACP relay times out after stdin closes

## What to build

Diagnose Kiro CLI 2.37.1 V3 ACP teardown after a model-bearing session. In #162,
the native `session/prompt` replies completed, a permission-gated turn returned
`cancelled`, and a new process loaded the same session and recalled the marker.
Both processes nevertheless exited 1 with:

> error: the v3 engine did not exit within 5 seconds after ACP stdin closed

The controller's 60-second timeout did not fire; the captured engine processes
were absent afterward. Treat this as a native teardown infrastructure error,
separate from successful turn/load responses and from model assertion failure.

Intent source: [#162 driver findings](../docs/agents/research/harness-experimental-features-20261101.md#ticket-162-headless-driver-probes-2026-11-02).
Trace the installed relay's supported lifecycle and compare a clean turn,
cancelled permission wait, and explicit advertised shutdown/close methods where
available. Do not assume closing a session merely evicts it: an engine method
may destroy its durable record. Verify own descendant settlement, preserved
session state and exit classification independently. Document a supported
shutdown sequence, fixed upstream version or bounded workaround; do not patch
the installed engine or kill unrelated processes.

#173 may use a live ACP driver without relying on EOF settlement. It must retain
this caveat until the teardown path is qualified; this is not a blanket blocker
on observing a running session.

## Blocked qualification (2026-11-02)

Fresh current-build probes and [independent review](../docs/agents/research/kiro-acp-shutdown-20261102-audit.md)
confirm AC1, but AC2 remains unmet. Kiro CLI 2.37.1 / KAS 0.66.70 still emits the
native five-second EOF shutdown error and exits 1 after both a completed model
turn and a canceled permission wait, even when advertised `session/close`
succeeds first. Reload preserved the marker, and captured owned descendant trees
were absent at final polling. This is not a verified shutdown remedy.

The [report](../docs/agents/research/kiro-acp-shutdown-20261102.md) and
[receipt](../docs/agents/research/evidence/kiro-acp-shutdown-20261102.json) record
the completed diagnostic evidence, retained raw files and four owned session IDs.
Keep those artifacts through the next qualifying retest/resolution; parent owns
disposal. The original #162 session remains untouched. Do not repeat identical
model probes on each check-in. Resume fix qualification when the Kiro/KAS version
changes or a newly supported shutdown method is identified. The ticket remains
in progress with an explicit upstream/runtime blocker, not resolved. Independent
GUI/auth/runner/model work continues without treating this as a blanket blocker.

## User-approved closure scope (2026-11-03)

The user requested closure with the limitation and required workflow workaround
documented, and a low-priority follow-up after other work. This explicitly replaces
the earlier unmet native-remedy criterion with acceptance of bounded workflow
handling; it does not establish a native fix. The historical blocked qualification
above remains evidence of what was not solved.

The [current Kiro workflow procedure](../skills/engineering/orchestrate/references/harness-kiro.md#v3-acp-shutdown-workaround)
separates successful task acceptance from teardown infrastructure failure,
requires bounded independent observation of owned descendants, prohibits automatic
duplicate retries based on this signature, and preserves durable sessions.
Unattended graceful teardown remains unqualified. Other exit-1 failures are not
covered by this classification.

[#201](201-kiro-acp-shutdown-followup.md) is low-priority backlog work, intentionally
deferred until higher-priority work is finished. Parent integration retains the
four owned model-bearing sessions and indexed raw files, plus private wrong-tree
review provenance, for #201 until qualifying comparison and explicit disposition.
No sessions, evidence or unrelated artifacts are deleted by this closure. The
original #162 session remains outside cleanup scope. The
[2026-11-03 release check](../docs/agents/research/evidence/kiro-acp-shutdown-release-check-20261103.json)
found no qualifying public candidate; no new native/model probe ran.

## Acceptance criteria

- [x] The EOF teardown failure is reproduced or marked obsolete, separating successful prompt/cancel/load responses from process settlement.
- [x] The user-approved workflow handling documents separate task/teardown acceptance, bounded owned-process observation, no duplicate retry and preserved sessions; unresolved native repair is deferred to #201.
- [x] Owned processes, sessions and fixtures have recorded disposition; required checks pass and the driver guidance states the remaining limit.

## Resolution (2026-11-03)

Accepted known limitation at user request: documented and deployed bounded Kiro ACP workflow handling, independently reviewed; native graceful shutdown remains unqualified. Deeper research deferred to low-priority backlog #201 after higher-priority work. Promoted procedure and audit; retained indexed raw/session evidence for #201, no destructive cleanup or new model calls.

### Verification
1. ✓ The EOF teardown failure is reproduced or marked obsolete, separating successful prompt/cancel/load responses from process settlement. — "PASS: retained 2026-11-02 raw receipt and independent audit reproduce completed/cancelled responses followed by the exact native EOF shutdown error; final owned trees were absent for those runs. No new runtime test or native repair is claimed."
2. ✓ The user-approved workflow handling documents separate task/teardown acceptance, bounded owned-process observation, no duplicate retry and preserved sessions; unresolved native repair is deferred to #201. — "PASS: independent critic accepted exact commit 4bc0c2224f5def6ef6590b1113ec29034871c5b0; current Kiro procedure separates task/teardown acceptance, requires bounded descendant observation, rejects duplicate retries and preserves state. User explicitly accepted this closure scope; low-priority backlog #201 owns deferred repair."
3. ✓ Owned processes, sessions and fixtures have recorded disposition; required checks pass and the driver guidance states the remaining limit. — "PASS: node scripts/gate.mjs pre-merge selected ticket-graph 1/1; pre-push passed plugin-manifest, skill-syntax, invocation-policy, doc-links and home-path 5/5; deploy --no-agy installed 50 skills. Four model-bearing sessions/indexed raw files and private review provenance remain retained by parent for #201 until qualifying comparison and explicit disposition; original #162 session and unrelated artifacts untouched."
