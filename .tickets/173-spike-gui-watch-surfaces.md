---
id: "173"
title: "Spike: GUI surfaces as the watch layer over a headless orchestrator"
status: done
blocked_by: ["124","162"]
tags: ["stream:orchestration", "type:research"]
validation_criteria:
  - "One row per GUI (state shown, approvals answerable, usage shown, question answerable), as a dated section in the experimental features note."
  - "A recommendation on which GUI to use as the watch layer per harness, folded into the orchestrate skill's references (ticket 111)."
  - "Sandbox folders removed after the run."
---

# Spike: GUI surfaces as the watch layer over a headless orchestrator

## What to build

With a headless orchestrator running the trunk loop, watch and steer it from each GUI: Claude desktop agent view, the Codex app thread list, Kiro IDE Agent Focus, the Antigravity Agent Manager and Kiro Crew's session grid ([by surface](../docs/agents/research/harness-experimental-features-20261101.md#by-surface-tui-and-gui)).

Prior art to borrow techniques from (not authority): [eval prior art](../docs/agents/research/eval-prior-art-20261101.md#techniques-by-spike).

**Question:** What does each GUI show of worker state, pending approvals and usage, and can a person answer a worker's question or approval from it?

## Acceptance criteria

- [x] One row per GUI (state shown, approvals answerable, usage shown, question answerable), as a dated section in the experimental features note.
- [x] A recommendation on which GUI to use as the watch layer per harness, folded into the orchestrate skill's references (ticket 111).
- [x] Sandbox folders removed after the run.

## Reconciliation (2026-11-02)

Input from #162: use its qualified live Kiro V3 ACP driver for the initial
request/cancel/reload control, keeping #189's EOF teardown limit explicit.
The [driver receipt](../docs/agents/research/evidence/headless-drivers-20261102.json)
names five owned native histories (Claude, agy, Codex, Kiro chat and Kiro ACP)
retained for GUI visibility inspection. Inspect only those identified histories;
their private fixture is recycled at #162 close. Once this GUI inspection
settles, archive/recycle the owned records through a supported targeted path,
or record why individual records must remain. Never remove a shared native
conversation database or user telemetry log. Codex tool execution needs #188
before a real tool-capable Codex lane is claimed; its text transport did pass.

Consume #162's named stable headless driver and fixture signals. Compare each GUI against the same worker identities, pending approval and question; distinguish visible state from an action actually answered through the GUI. Unavailable clients remain explicit unsupported coverage, not a reason to install or sign into new services silently.

## Resolution (2026-11-03)

done: compared five native watch candidates, separated documented capabilities from unobserved local steering, integrated/deployed qualified per-harness guidance and recorded unsupported coverage/retention

### Verification
1. ✓ One row per GUI (state shown, approvals answerable, usage shown, question answerable), as a dated section in the experimental features note. — "Five-rowdatedstate/approval/usage/questiontable insharedexperimentalnote, fullreport/receipt+independentcritic8of10 accepted85729and5b099audit. Localsurfacescapturedaslaunch/capture/policyunavailable, no fakeGUIsteering; Crewusageversioncaveat preserved."
2. ✓ A recommendation on which GUI to use as the watch layer per harness, folded into the orchestrate skill's references (ticket 111). — "Parentnewgui-watch.md and5harnessreferencepointers qualifiedperharnesscandidates; critic033700eacceptedactualAC1/2rootdiff. Parentselectedpre-merge syntax/dashboard-contract and6pre-pushcheckspassed. Afterpeerdistributioneditslanded, node scripts/deploy.mjs refreshed50skills andnativepluginvalidationpassed withgenericiconnotice."
3. ✓ Sandbox folders removed after the run. — "No privatefixture/scratch/capturehistorycreatedby173. Five162recordsretaineduntilsupportedtargetedGUIinspection/disposal; no sharedDBdeletion. CrewwindowleftopenwithPID/timeownershipuncertaintyexplicit, no unknownprocesskilled. Report/receipt/audit lifecycle recorded; scopeandprivacychecks passed."
