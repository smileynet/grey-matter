---
id: "291"
title: "scripted first-time ZCode plugin install (marketplace add + install + enable) for fresh machines"
status: backlog
blocked_by: []
priority: low
validation_criteria:
  - "one command takes a fresh machine from nothing to an enabled grey-matter+tkt plugin install using the ZCode CLI"
  - "it replaces the .scratch state-replication approach from the 2026-11-08 Windows trial"
tags: ["type:enhancement", "stream:tooling"]
---
From proposal 23 (G5). deploy.mjs only refreshes an already-installed plugin; the install half is undocumented scripting. The Windows trial proved state-file replication works but the CLI is the authoritative tool.