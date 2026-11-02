---
id: "162"
title: "Spike: compare headless driver surfaces across harnesses"
status: done
blocked_by: ["111","124","125","126","127","128","129"]
tags: ["stream:orchestration", "type:research"]
validation_criteria:
  - "Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented."
  - "The question above answered yes or no, or listed under \"couldn't verify\" with what was tried."
  - "Sandbox folders removed after the run; settings changed for the spike restored or recorded."
priority: high
---

# Spike: compare headless driver surfaces across harnesses

## What to build

Compare the headless driver surfaces an outside orchestrator could use: `codex queue`/`exec --json --output-schema`, `kiro-cli chat --output-format stream-json`/`serve`/`acp`, agy paired stream-json input and output, and Claude Code `-p` with stream forwarding. Use [harness surfaces](../docs/agents/harness-surfaces/README.md) for the flags.

**Question:** Which surfaces let one external process dispatch a worker, read its structured result, send it a follow-up and see approvals, on Windows?

Source: [harness experimental features](../docs/agents/research/harness-experimental-features-20261101.md#proposed-spikes) (2026-11-01). Run on the spike-0 fixture (`scripts/spike-orchestrate-fixture.mjs`, ticket 124) in a throwaway checkout; any GitHub repo only with the user's go-ahead.

## Acceptance criteria

Current observations: [dated driver findings](../docs/agents/research/harness-experimental-features-20261101.md#ticket-162-headless-driver-probes-2026-11-02),
[sanitized receipt](../docs/agents/research/evidence/headless-drivers-20261102.json)
and [independent audit](../docs/agents/research/harness-experimental-features-20261101-t162-audit.md).
Question/follow-up transport passed on the captured surfaces. agy soft denial,
Codex missing tool host (#188) and Kiro ACP EOF teardown (#189) remain explicit
limits. Kiro ACP is qualified for #173's live request/cancel/reload experiment,
not a general unattended production driver.

Input from ticket 111: [authored-skill dry runs](../docs/agents/research/orchestrate-skill-dry-runs-20261101.md)
show Kiro native summaries omitting DONE, a parent pre-answering T2, and a saved
session recovered after an outer process interruption. A separate native-summary
question/answer/redispatch probe passed. Compare actual structured transport with
orchestrator prose when assessing these surfaces; do not count synthesized status
or an unverified process exit as completion. Private `t111-*` fixture/log evidence
is retained until this ticket completes, then promote selected receipts and trash
the remaining owned artifacts.

- [x] Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented.
- [x] The question above answered yes or no, or listed under "couldn't verify" with what was tried.
- [x] Sandbox folders removed after the run; settings changed for the spike restored or recorded.

## Reconciliation (2026-11-02)

Finish the retained ticket-111 transport/recovery investigation first. #185 adds an initialize-only V3 handshake and an unresolved auth-owner discrepancy; neither proves model/tool execution. Compare actual driver results, approval channels, follow-up identity and interrupted-process recovery using a common minimal task. The outcome supplies #173 with a named stable headless driver and reproducible signals. This ticket owns selected receipt promotion and recycling of retained t111 evidence; a stopped outer process alone is not settlement.

## Resolution (2026-11-02)

done: compared Windows headless driver transports with observed question/follow-up identity, native tool outcomes and qualified ACP approval/cancel/reload evidence. Published audited findings and corrected agy invocation/denial guidance. Captured independent infrastructure followups188/189; ACP research187 remains last and now has confirmed subject. Recycled current raw probe/fixture and all20 retained t111 artifacts after durable receipt promotion/audit. Retained only five identified native histories for173 GUI inspection and shared current dist/agy-plugin until next deploy. Existing harness installations/shared stores and another chat ticket121 edit were untouched. EOF teardown, Codex tool execution and broader GUI/approval paths remain explicitly unverified.

### Verification
1. ✓ Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented. — "Published368c298: dated driver matrix, working recipes, native selected receipt and independent audit8/10. Claude/agy paired streams and Codex/Kiro resume retained question/answer markers; Kiro ACP request/cancel/load verified with replay distinguished. Native tool events, not prose alone, support command outcomes."
2. ✓ The question above answered yes or no, or listed under "couldn't verify" with what was tried. — "Qualified live Kiro V3 ACP for173 with explicit CLI auth, prompt-response completion, permission visibility and cancellation. No approval answer scripted. agy empty SUCCESS/exit0 coexisted with denial and missing BLOCKED prose (assertion failure). Codex tool host missing (infrastructure,188); Kiro ACP EOF5s/exit1 (infrastructure,189), controller timeoutfalse. Queue/serve help-only; GUI and several resume/cancellation paths remain unverified."
3. ✓ Sandbox folders removed after the run; settings changed for the spike restored or recorded. — "PASS: fixture npm test1/1,0fail/skip; independent Git status clean. Fresh pre-merge --base e4ec605 --include skill-syntax-fixtures passed2 selected; pre-push passed5 selected; docs consistency50 skills, home-path and diff checks passed. Artifact inspection complete11 files141334 bytes no findings/errors. Recycled20 t111 items1764849 bytes,current probe1569869,fixture98400,helper after audit; targets absent. Deployment passed50 skills, relocated installed reference matched. Five native histories retained for173; current dist output retained until next deploy."
