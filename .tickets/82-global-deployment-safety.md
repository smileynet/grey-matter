---
id: "82"
title: "Preserve foreign Antigravity plugins and honor CODEX_HOME for global rules"
status: done
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

- [x] Antigravity fallback preserves foreign same-named directories and links.
- [x] Global rules install into the configured `CODEX_HOME`.
- [x] Applicable regression tests and `node scripts/check-repo.mjs` pass.

## Resolution (2026-10-29)

deploy.mjs agyDeploy: without the agy CLI, the fallback replaces ~/.gemini/config/plugins/<pack> only when it holds this pack's .installed-by-<pack>.json marker (written after each fallback copy); a foreign same-named folder or a link is refused with the deployer's usual '--force to override' message and left untouched. install-agents-md.mjs resolves the codex target from CODEX_HOME (default ~/.codex), matching deploy.mjs. Engine synced into tkt (9e5589f); grey commit 7792594. Upgrade note in both changelogs: a fallback copy from before this change has no marker, so update it once with --force. Tests: deploy.test.mjs foreign-folder/link test failed before the fix and passes now; own-copy and --force test passes; install-agents-md CODEX_HOME test failed before, 6/6 pass now. Artifacts: only test temp homes (removed by the tests); gate logs deleted.

### Verification
1. ✓ Antigravity fallback preserves foreign same-named directories — "Foreign folder and link fixtures are refused and kept; deployer's own marked copy is replaced (deploy.test.mjs, two new tests pass; the first failed before the fix). CODEX_HOME fixture installs to $CODEX_HOME/AGENTS.md (install-agents-md.test.mjs 6/6)"
2. ✓ Global rules install into the configured CODEX_HOME — "grey check-repo: all 16 groups ok with engines byte-identical (df08b97f); tkt mise run check rc=0 (release-tool tests, fmt, clippy, cargo test) and deploy-validation plus migrate-legacy tests 8/8"
