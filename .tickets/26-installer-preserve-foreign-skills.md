---
id: "26"
title: "Keep foreign skill directories safe across install and uninstall"
status: open
blocked_by: []
priority: urgent
validation_criteria:
  - "An existing foreign skill refused on install remains unchanged after a second install and uninstall"
  - "Forced replacement changes only the explicitly forced skill"
  - "Installer regression checks pass"
tags: ["type:chore", "kind:bug", "stream:tooling"]
---

# Keep foreign skill directories safe across install and uninstall

## What to build

The installer must preserve a skill directory it does not own across a refused install,
a later install, and uninstall. A user may safely install grey-matter beside other skills
without a manifest error turning those other skills into disposable content.

## Context

Found during the 2026-10-19 repository review. `scripts/install-skills.mjs` refuses a
foreign destination in `installOne`, but `doInstall` currently writes every desired name
to the manifest. The next operation treats the refused directory as owned. This violates
the safety guarantee in `README.md` and the recorded result in ticket 13.

Read first: `scripts/install-skills.mjs`, `README.md`,
`.tickets/13-decide-distribution-packaging.md`.

## Out of scope

Do not broaden the installer to manage arbitrary third-party skills or change the
explicit `--force` contract.

## Acceptance criteria

- [ ] A refused foreign destination is absent from the written ownership manifest.
- [ ] A repeated install and uninstall leave a refused foreign destination byte-for-byte intact.
- [ ] An explicitly forced replacement is the only path that may replace a foreign destination.
- [ ] An isolated regression check covers refuse, repeat-install, uninstall, and force behavior.
