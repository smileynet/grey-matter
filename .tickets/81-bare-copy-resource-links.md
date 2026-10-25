---
id: "81"
title: "Preserve shared guidance links in bare copy-mode skill installs"
status: open
blocked_by: []
validation_criteria:
  - "An isolated copy-mode installation can open shared report-format and doc-conventions guidance from deployed skills"
  - "Regression fixtures cover relative links without requiring the source checkout at runtime"
tags: ["stream:tooling"]
---

# Preserve shared guidance links in bare copy-mode skill installs

## Intent source

Discovered while carrying out Sam's October 25, 2026 request to deploy the accepted voice and handoff guidance and verify all plugin installs (ticket 80).

## Observed problem

Default `node scripts/deploy.mjs` copies each skill directory into a flat bare root. Repository-relative links such as `../../../docs/agents/report-format.md` in deployed `delivery-dashboard/SKILL.md` and `prototype/UI.md` then point outside the copied pack and fail to resolve. The skill bytes can match source and the install audit can pass while shared guidance is unavailable.

Observed on both Kiro and OpenCode local roots. The supported `node scripts/deploy.mjs --link` workaround was applied and verified for ticket 80: source-linked directories preserve OS traversal to the shared docs. Claude's local-folder plugin, Codex's full cache and Antigravity's resource projection already expose the changed guidance.

## Context

Read `scripts/deploy.mjs` (`installRoot`, `markdownResources`, `agyResources`), `scripts/deploy.test.mjs`, and `docs/agents/distribution-maintenance.md`. The deployer is canonical here and vendored into tkt; follow the distribution maintenance sync contract for any engine change.

## What to build

A bare copy-mode install lets an agent follow shared Markdown resource links without relying on the original checkout. Preserve ownership protections, one install per harness, and the existing plugin/portable resource rules. Extend verification so an apparently current copy cannot hide broken shared guidance.

This is a separate distribution fix; the accepted prose changes are already deployed locally through supported source links.

## Acceptance criteria

- [ ] An isolated copy-mode installation can open shared report-format and doc-conventions guidance from deployed skills.
- [ ] Regression fixtures cover relative links without requiring the source checkout at runtime.
