---
id: "187"
title: "Research: identify ACPa, assess orchestration fit and propose evidence-led spikes"
status: open
blocked_by: []
priority: low
validation_criteria:
  - "The intended ACPa project/protocol is identified with primary sources, version/date and a clear distinction from similarly named ACP projects."
  - "Dated audited findings compare its capabilities and gaps with this workstream's observed driver results and recommend bounded spikes or no further work."
  - "Any recommended actionable spikes are separately ticketed with dependencies and acceptance criteria; required checks pass and owned artifacts have a recorded disposition."
tags: ["stream:orchestration", "type:research"]
---

# Research: identify ACPa, assess orchestration fit and propose evidence-led spikes

## What to build

Identify the project/protocol the user called **ACPa**, research its architecture
and supported integrations from primary sources, and decide whether it merits
new orchestration spikes. Intent source: this chat's 2026-11-02 request to append
the research to the end of the orchestration queue.

The name is not yet resolved: the user has been asked whether they mean Agent
Client Protocol (ACP), the acpx command-line client, or another specific project.
Preserve the requested name until clarified; do not silently substitute one of
the similarly named protocols. Record the authoritative URL/repository and
version before evaluating capabilities.

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

- [ ] The intended ACPa project/protocol is identified with primary sources, version/date and a clear distinction from similarly named ACP projects.
- [ ] Dated audited findings compare capabilities and gaps with this workstream's observed driver results and recommend bounded spikes or no further work.
- [ ] Any recommended actionable spikes are separately ticketed with dependencies and acceptance criteria; required checks pass and owned artifacts have a recorded disposition.

## Out of scope

Assuming an unidentified project's capabilities, a production integration,
global adapter installation, or model/spike execution without a scoped design.
