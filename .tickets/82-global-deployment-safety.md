---
id: "82"
title: "Preserve foreign Antigravity plugins and honor CODEX_HOME for global rules"
status: in_progress
blocked_by: []
validation_criteria:
  - "Antigravity fallback preserves foreign same-named directories"
  - "Global rules install into the configured CODEX_HOME"
tags: ["distribution"]
---

# Preserve foreign Antigravity plugins and honor CODEX_HOME for global rules

## What to build

The global installation review found two remaining deployment issues:

- `scripts/deploy.mjs`, in `agyDeploy`, recursively replaces the destination
  under `~/.gemini/config/plugins/<pack>` when the agy CLI is unavailable,
  without checking whether the existing directory belongs to this deployer.
  Require ownership before replacing an existing directory and preserve foreign
  directories and links.
- `scripts/install-agents-md.mjs` hardcodes `~/.codex/AGENTS.md`, while skill
  deployment honors `CODEX_HOME`. Resolve the global instruction target using
  the same configuration and preserve existing foreign-file protections.

Read both implementations and their fixture suites. Add isolated regression
tests for foreign Antigravity content and a custom Codex home. Synchronize any
changed shared deployment engine into tkt and run both applicable gates.

The current machine uses the default Codex home and has no Antigravity directory,
so these findings did not prevent its Claude, Codex, and Kiro installation.

## Acceptance criteria

- [ ] Antigravity fallback preserves foreign same-named directories and links.
- [ ] Global rules install into the configured `CODEX_HOME`.
- [ ] Applicable regression tests and `node scripts/check-repo.mjs` pass.
