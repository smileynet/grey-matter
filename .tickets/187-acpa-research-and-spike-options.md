---
id: "187"
title: "Research: Agent Client Protocol (ACP), orchestration fit and evidence-led spikes"
status: done
blocked_by: []
priority: low
validation_criteria:
  - "Authoritative Agent Client Protocol sources and versions are recorded, distinguishing the standard from MCP, client implementations and Kiro extensions."
  - "Dated audited findings compare its capabilities and gaps with this workstream's observed driver results and recommend bounded spikes or no further work."
  - "Any recommended actionable spikes are separately ticketed with dependencies and acceptance criteria; required checks pass and owned artifacts have a recorded disposition."
tags: ["stream:orchestration", "type:research"]
assignee: "codex"
---

# Research: Agent Client Protocol (ACP), orchestration fit and evidence-led spikes

## What to build

Research **Agent Client Protocol (ACP)**, its architecture and supported
integrations from primary sources, and decide whether it merits new
orchestration spikes. Intent source: this chat's 2026-11-02 request to append
research to the end of the orchestration queue, followed by the user's explicit
clarification that "ACPa" meant Agent Client Protocol.

Start from the Agent Client Protocol project's own specification, SDK and
repository. Record authoritative URLs and versions before evaluating
capabilities. Distinguish standard ACP behavior from a particular client's
implementation, adapter limitations, Kiro extensions and the separate MCP
tool-server boundary.

Compare the confirmed subject with the observed driver/session/approval results
from #162 and the KAS architecture research in #185, plus any later completed
workstream findings. Investigate dispatch, structured results, same-worker
follow-up, cancellation/recovery, approval handling, isolation boundaries,
Windows support and setup/usage cost where applicable. Separate documented
features, source-traced behavior and directly observed results.

Extend a suitable research note with dated citations and supporting excerpts,
then obtain an independent research audit. Recommend small, discriminating
spikes only for material unanswered questions. If useful, create separate
agent-ready tickets with the prerequisites, fixtures, outcome criteria and
cleanup scope; otherwise record why no spike is warranted.

Queue placement: last in the current orchestration plan, after #172. This is a
scheduling preference, not a technical blocked_by edge. Do not start it merely
because higher-priority model trials are waiting on their runner prerequisite.

## Acceptance criteria

- [x] Authoritative Agent Client Protocol sources and versions are recorded, distinguishing the standard from MCP, client implementations and Kiro extensions.
- [x] Dated audited findings compare capabilities and gaps with this workstream's observed driver results and recommend bounded spikes or no further work.
- [x] Any recommended actionable spikes are separately ticketed with dependencies and acceptance criteria; required checks pass and owned artifacts have a recorded disposition.

## Out of scope

Assuming an unidentified project's capabilities, a production integration,
global adapter installation, or model/spike execution without a scoped design.

## Resolution (2026-11-03)

done: researched current authoritative ACP lifecycle and its orchestration fit with independent primary-source audit. Recorded standard/MCP/Kiro boundaries and observed-versus-documented limits; no new actionable spike warranted now. Parent merged and pushed accepted findings/audit with passing document gates. Clean research checkout retained through workstream final audit/publication; no runtime artifacts or user settings changed.

### Verification
1. ✓ Authoritative Agent Client Protocol sources and versions are recorded, distinguishing the standard from MCP, client implementations and Kiro extensions. — "Audited dated findings docs/agents/research/acp-orchestration-fit-20261103.md distinguish SDKpackage2.4.0 from stable ACPv1/schema1.29.1 and experimentalv2, MCP2025-11-25 boundary, Kiro-specificextensions. PrimarynormativeACPsession/prompt/cancel/permission/update docs+schemas and SDKrelease sources re-fetched independently; sourceSHA56C9DAF88AD9F70CFBC6E11F751B14147A29903790D7D4C15B97D656334C811B."
2. ✓ Dated audited findings compare its capabilities and gaps with this workstream's observed driver results and recommend bounded spikes or no further work. — "Independent research audit0.91/high accepted revisedc7b2828 plus exactparentlinkfix2ef1cbb; no unsupported/snippetmismatch aftercurrent-source revisions. Compared155mixedbackendsetup,162/173driverobservations,185/186KAS/auth and189Kiro-specificEOFblocker; no blanket189dependency forotherACPimplementations. ACPnegotiation/transport does not supply scheduler/isolation/acceptance; runtimeportability and costs remainunmeasured."
3. ✓ Any recommended actionable spikes are separately ticketed with dependencies and acceptance criteria; required checks pass and owned artifacts have a recorded disposition. — "No currentlyactionableACPspike recommended: existingprobeanswers+trackedKiroEOFissue coverpresentdecision; futuregenericclientcomparison conditionalonconcreteuser-facingneed, so no speculativefollowupticketcreated. Parentmerged findings/audit, fixedactual189citation and renewedcriticacceptance, docsconsistency50skilllinks/no-newscratchPASS, premerge0applicablechecks(notatestpass), prepushdoc-links/home-path2/2+hook2/2PASS; f961bc6pushed. No installs/nativeprobes/settingschanges/generatedruntimeartifacts. Retain clean isolatedresearchcheckout48538095B through workstreamfinalaudit/publication; notes/auditpromoted."
