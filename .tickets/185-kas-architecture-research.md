---
id: "185"
title: "Research: KAS architecture and its relationship to kiro-cli"
status: in_progress
blocked_by: []
tags: ["stream:tooling", "type:research"]
validation_criteria:
  - "Dated findings explain KAS architecture, CLI relationship, protocol, lifecycle, tools, permissions, auth and version boundaries with primary sources."
  - "An initialize-only observation is separated from advertised or source-traced capabilities, and independent audit finds no unsupported claim."
  - "Repository checks pass; owned temporary probe data is recycled and durable evidence retained."
---

# Research: KAS architecture and its relationship to kiro-cli

## What to build

Research Kiro Agent Server for the user's follow-up to the KAS versus kiro-cli
comparison. Extend the existing Kiro Crew research note using current official
documentation and installed primary code. Explain the engine/client boundary,
Crew's two launch routes, agent loop and ACP lifecycle, tool/MCP integration,
permission/authentication handling, and material differences between documented
architecture and locally verified behavior. No model inference, downloads,
credential changes or configuration migration are needed.

## Acceptance criteria

- [ ] Dated cited findings and a detailed user-facing explanation cover the requested architecture and its relationship to kiro-cli.
- [ ] Current local versions and a bounded protocol handshake are recorded without treating capability advertisements as tested behavior.
- [ ] Independent audit and required checks pass; owned probe files are promoted or recycled.
