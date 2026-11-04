---
id: "231"
title: "Qualify current existing-session messaging interfaces"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "All named interfaces have current primary citations and bounded observed evidence"
  - "Supported adapters and held or unqualified gaps are actionable and precisely distinguished"
  - "Independent exact-commit review and relevant repository checks pass"
tags: ["stream:orchestration", "type:research"]
parent: "179"
---
# Qualify the remaining messaging interfaces

## Intent and scope

The user resumed remaining #179 work on 2026-11-03. Build a current primary-source and local-observation capability matrix for Codex desktop/CLI, Claude Code, kiro-cli, Kiro Crew and Antigravity App/CLI/IDE. Preserve #208/#210 evidence boundaries. This is an implementation input, not a claim that a missing adapter means the product cannot support delivery.

## What to deliver

Write one cited agent-facing reference under docs/agents/research/ with exact installed versions, advertised native existing-session input/wakeup/completion surfaces, busy/idle behavior, supported shared-interface route and explicit unsupported/held/unqualified result. Cite actual official pages fetched and bounded local --version/--help output. Investigate supported Codex queue and owned headless input separately from resume/new-run. No live user conversation, native model calls, Agy executable, configuration/account changes, provider fallback or transcript/credential extraction. The parent owns later native canaries and integration.

## Acceptance criteria

- [ ] Every named interface has current official citations and precise observed-versus-documented qualification, with raw output retained privately and hashes indexed.
- [ ] Supported next adapters and evidence gaps are actionable without treating a new/resumed run as existing-session delivery; held lanes are explicit.
- [ ] Independent exact-commit review and relevant repository checks pass; parent integrates references and owning guidance.
