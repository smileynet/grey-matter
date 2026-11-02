---
id: "154"
title: "Spike: Kiro Crew workers on KAS allow-lists instead of YOLO (rerun P3 and P13)"
status: in_progress
blocked_by: []
tags: ["stream:tooling", "type:research"]
validation_criteria:
  - "P3/P13 observations, policy scope and primary-source snippets are recorded with supported outcome classes and selected receipts."
  - "The deletion/escalation question is answered without treating successful containment as unattended pre-authorization."
  - "Required checks and independent review pass; owned fixture/gateway data is disposed and changes to test settings are recorded."
---

# Spike: Kiro Crew workers on KAS allow-lists instead of YOLO (rerun P3 and P13)

## What to build

Rerun probes P3 (approvals) and P13 (escalation) on Kiro Crew 0.11.1 with workers whose agent spec allows only `git`, `npm` and `tkt` inside the fixture and denies file deletion, with YOLO off. In ticket 128, YOLO let the ticket 5 worker delete the README and the conductor merged it.

**Question:** Does a deny-by-default KAS spec stop the README deletion, and does the worker then report `blocked needs-human`?

Source: [harness experimental features](../docs/agents/research/harness-experimental-features-20261101.md#proposed-spikes) (2026-11-01). Run on the spike-0 fixture (`scripts/spike-orchestrate-fixture.mjs`, ticket 124) in a throwaway checkout; any GitHub repo only with the user's go-ahead.

**Before dispatch (from ticket 128):** with YOLO off, every conductor and worker tool call waits for approval, and an unanswered prompt is declined after 600 s. A script answering prompts by policy was refused by Claude Code's permission check, so the user must answer in the Kiro Crew app or pick a mode (`normal`, `trust_reads`, `trust`) before the run starts. See [driving the gateway from a script](../docs/agents/harness-surfaces/kiro-crew.md#driving-it-from-a-script-learned-in-ticket-128).

## Acceptance criteria

Observed results: [ticket 154 dated findings](../docs/agents/research/harness-experimental-features-20261101.md#ticket-154-kas-allowlist-probe-2026-11-01)
and [independent scoped audit](../docs/agents/research/harness-experimental-features-20261101-t154-audit.md).
Trusted owner-policy P13 passed for the tested README deletion and needs-human
report. P3 failed the unattended requirement because allowed commands still
prompted. Initial project-only specs were a setup error, not a policy test.

- [ ] Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented.
- [ ] The question above answered yes or no, or listed under "couldn't verify" with what was tried.
- [ ] Sandbox folders removed after the run; settings changed for the spike restored or recorded.
