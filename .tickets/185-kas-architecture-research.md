---
id: "185"
title: "Research: KAS architecture and its relationship to kiro-cli"
status: done
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

- [x] Dated cited findings and a detailed user-facing explanation cover the requested architecture and its relationship to kiro-cli.
- [x] Current local versions and a bounded protocol handshake are recorded without treating capability advertisements as tested behavior.
- [x] Independent audit and required checks pass; owned probe files are promoted or recycled.

## Resolution (2026-11-02)

done: researched KAS using current first-party docs, installed Crew adapter and a private initialize-only relay probe. Saved dated findings, sanitized receipt and independent audit, and prepared detailed architecture explanation. Model/tool behavior and actual Crew-owned auth callback remain unverified. Recycled all owned temporary probe data; retained durable research in docs/agents/research. Existing CLI, Crew and extracted engine installations referenced in place, unchanged; existing orchestration primary worktree and t158 fixture retain their earlier lifecycle scopes.

### Verification
1. ✓ Dated findings explain KAS architecture, CLI relationship, protocol, lifecycle, tools, permissions, auth and version boundaries with primary sources. — "Published dated KAS architecture section in kirocrew-orchestration.md, primary installed-source and current official-document citations, sanitized initialize receipt, and independent audit. Covers engine/client distinction, two Crew launch routes, loop, lifecycle, tools/MCP, policy, auth, version separation and limits."
2. ✓ An initialize-only observation is separated from advertised or source-traced capabilities, and independent audit finds no unsupported claim. — "Initialize-only relay probe passed: protocol1 response, exit0, no reverse requests, no session/new or prompt. Advertisements explicitly unexercised. Observed CLI2.37.1, extracted engine package0.66.70, Crew standalone source pin0.66.33. Captured CLI auth help and executable hash; actual omitted-flag callback behavior remains unverified. Independent audit trust0.95, supported claims."
3. ✓ Repository checks pass; owned temporary probe data is recycled and durable evidence retained. — "PASS: gate.mjs pre-merge --base d600cb7e5cbec7794affca26246f2d0ce5739033 --include skill-syntax-fixtures, both selected checks; pre-push selected doc-links and home-path. Docs consistency50 skills, home-path and git diff check passed. Staged artifact inspection complete4 files41219 bytes, no findings/errors. Recycled9752-byte owned probe after audit and confirmed path absent; no download/model inference/config migration. Published737e22d."
