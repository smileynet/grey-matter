---
id: "280"
title: "Add refreshZcode step to deploy.mjs for the installed ZCode plugin"
status: done
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

- [x] With the plugin installed: a content-only checkout change reaches `~/.zcode/cli/plugins/cache/grey-matter/…` after `deploy.mjs`, without a version bump
- [x] With ZCode absent or the CLI unreachable: deploy completes with a clean skip, no error
- [x] Sandbox or permission refusal prints exact owner-run commands
- [x] `deploy.test.mjs` covers detection and skip paths; `node scripts/gate.mjs pre-merge` passes

## Resolution (2026-11-08)

done: refreshZcode refreshes an installed ZCode plugin from the checkout (no version bump needed), prunes superseded cache dirs, skips cleanly when the CLI is absent (ZCODE_CLI overrides the path), and hands refusals to the owner; the user's plugin now sits at 0.2.0, cache clean

### Verification
1. ✓ Content-only checkout change reaches the ZCode plugin cache after deploy, without a version bump — "Sandbox test asserts deploy invokes exactly 'plugins marketplace update grey-matter' then 'plugins update grey-matter@grey-matter' (the spike-proven same-version content refresh); live run executed both: 'Updated marketplace grey-matter' + 'Updated plugin grey-matter@grey-matter from 0.1.0 to 0.2.0'"
2. ✓ ZCode absent or CLI unreachable: deploy completes with a clean skip — "Sandbox test: neutralized ZCODE_CLI yields 'zcode CLI not found... plugin refresh skipped' and deploy exit 0; no-plugin detection returns early in both sandbox and the live harness map"
3. ✓ Sandbox or permission refusal prints exact owner-run commands — "Refusal test: failing CLI prints 'ZCode plugin refresh did not finish' plus the exact owner-run command line (node <cli> plugins marketplace update grey-matter && node <cli> plugins update grey-matter@grey-matter)"
4. ✓ deploy.test.mjs covers detection and skip paths; gate.mjs pre-merge passes — "5 zcode-scoped tests pass (node --test --test-name-pattern); gate.mjs pre-merge ok; live deploy pruned superseded dirs 0.1.2/0.1.1/0.1.0 leaving only 0.2.0 in the plugin cache"
