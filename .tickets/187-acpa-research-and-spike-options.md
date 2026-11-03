---
id: "187"
title: "Research: Agent Client Protocol (ACP), orchestration fit and evidence-led spikes"
status: in_progress
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

- [ ] Authoritative Agent Client Protocol sources and versions are recorded, distinguishing the standard from MCP, client implementations and Kiro extensions.
- [ ] Dated audited findings compare capabilities and gaps with this workstream's observed driver results and recommend bounded spikes or no further work.
- [ ] Any recommended actionable spikes are separately ticketed with dependencies and acceptance criteria; required checks pass and owned artifacts have a recorded disposition.

## Out of scope

Assuming an unidentified project's capabilities, a production integration,
global adapter installation, or model/spike execution without a scoped design.
