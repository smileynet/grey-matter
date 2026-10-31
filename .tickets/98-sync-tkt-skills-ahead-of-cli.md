---
id: "98"
title: "sync can deploy tkt skills from a dev checkout that are ahead of the installed tkt release CLI"
status: open
blocked_by: []
validation_criteria:
  - "A fixture where pack skills use a flag the installed CLI lacks is reported before deploy"
  - "sync documents whether to pin the tkt pack to the installed CLI's tag or upgrade the CLI"
tags: ["stream:tooling", "type:enhancement"]
priority: medium
---

# sync can deploy tkt skills from a dev checkout that are ahead of the installed tkt release CLI

## Observed (2026-10-28 sync, macOS host)

- Installed CLI: tkt 0.4.0 (crates.io release). tkt checkout: `main` at 7834976.
- `3105683 feat(tickets): enforce invocation-scoped agent eligibility` added to all four
  tkt skills: identify with global `--agent <slug>` or `TKT_AGENT` before `ready`/`claim`,
  and `--agents` / `--exclude-agents` on `new`, `batch`, `edit`.
- tkt 0.4.0 rejects both: `tkt --agent kiro ready` and `tkt new ... --agents codex` fail
  with `unexpected argument`.
- `verify-tkt-usage` only runs when the tkt version changes, so a pack refresh against an
  unchanged CLI is never checked. Sync was held manually: grey-matter deployed, tkt pack
  left at the copies that match 0.4.0.

Seen again 2026-10-31 (Windows host): the installed CLI reports tkt 0.4.0 (92d4833) and warns `unknown config key "audit.resolution_baseline_id"` for the tkt checkout's `.tickets/config.toml`, so the checkout is also ahead of the CLI in config keys. The same pre-deploy check should surface it.

## What to build

Before deploying the tkt pack, check the pack's inlined commands against the installed CLI
(not only on a CLI version change); when they disagree, either deploy the pack from the
CLI's release tag or say the CLI must be upgraded. Document the choice in sync.

## Acceptance criteria

- [ ] A fixture where pack skills use a flag the installed CLI lacks is reported before deploy
- [ ] sync documents whether to pin the tkt pack to the installed CLI's tag or upgrade the CLI
- [ ] `verify-tkt-usage` records the CLI identity it checked (version and build hash) and reruns when that identity, the pack commit or the command changes; a stored result is reused only when all of them match

## Scope change (2026-10-29, ticket 101)

Workflow-guidance recommendation 5 (high confidence against unbound reuse): a stored
verification result is only valid for the commit, command, working directory, environment
and executable it ran against. Today `verify-tkt-usage` reruns only when the tkt version
changes, which is how this ticket's drift went unnoticed. Pairs with tkt ticket 153
(stale-binary guard).
