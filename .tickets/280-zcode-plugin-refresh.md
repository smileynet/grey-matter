---
id: "280"
title: "Add refreshZcode step to deploy.mjs for the installed ZCode plugin"
status: open
blocked_by: ["274"]
validation_criteria:
  - "Content-only checkout change reaches the ZCode plugin cache after deploy, without a version bump"
  - "ZCode absent or CLI unreachable: deploy completes with a clean skip"
  - "Sandbox or permission refusal prints exact owner-run commands"
  - "deploy.test.mjs covers detection and skip paths; gate.mjs pre-merge passes"
tags: ["stream:tooling", "kind:enhancement"]
---
## What to build

A `refreshZcode` step in `scripts/deploy.mjs`, mirroring `refreshCodex`, using
the refresh recipe the spike confirmed (ticket 273 /
[research doc](../../docs/agents/research/zcode-plugin-compat-20261108.md)):

- Detection: `grey-matter@grey-matter` installed (ZCode plugin cache /
  `~/.zcode/cli/config.json` `enabledPlugins`) and the ZCode CLI reachable
  (`/Applications/ZCode.app/Contents/Resources/glm/zcode.cjs` under a `node`
  runtime; parameterize the app path, don't hard-code macOS only).
- Refresh: `plugins marketplace update grey-matter` then
  `plugins update grey-matter@grey-matter` — same-version content refresh,
  no version bump (spike-confirmed by marker round-trip).
- No-op cleanly when ZCode or the plugin is absent; never fail a deploy for a
  harness the machine doesn't have.
- Agent-sandbox/permission refusals print the exact owner-run commands
  (Kiro Crew pattern in `kirocrewDeploy`).
- Surface when superseded versioned cache dirs linger after a version change
  (they do, until pruned); optionally prune stale `<version>` siblings.
- Scope note: this ticket owns the refreshZcode work and supersedes the
  "optional refreshZcode" bullet in ticket 274; 274 is otherwise untouched.

## Acceptance criteria

- [ ] With the plugin installed: a content-only checkout change reaches `~/.zcode/cli/plugins/cache/grey-matter/…` after `deploy.mjs`, without a version bump
- [ ] With ZCode absent or the CLI unreachable: deploy completes with a clean skip, no error
- [ ] Sandbox or permission refusal prints exact owner-run commands
- [ ] `deploy.test.mjs` covers detection and skip paths; `node scripts/gate.mjs pre-merge` passes
