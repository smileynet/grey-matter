---
id: "98"
title: "sync can deploy tkt skills from a dev checkout that are ahead of the installed tkt release CLI"
status: open
blocked_by: []
validation_criteria:
  - "A fixture where pack skills use a flag the installed CLI lacks is reported before deploy"
  - "sync documents whether to pin the tkt pack to the installed CLI's tag or upgrade the CLI"
tags: ["stream:tooling", "type:enhancement"]
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

## What to build

Before deploying the tkt pack, check the pack's inlined commands against the installed CLI
(not only on a CLI version change); when they disagree, either deploy the pack from the
CLI's release tag or say the CLI must be upgraded. Document the choice in sync.

## Acceptance criteria

- [ ] A fixture where pack skills use a flag the installed CLI lacks is reported before deploy
- [ ] sync documents whether to pin the tkt pack to the installed CLI's tag or upgrade the CLI
