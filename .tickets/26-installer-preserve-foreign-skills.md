---
id: "26"
title: "Keep foreign skill directories safe across install and uninstall"
status: done
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

- [x] A refused foreign destination is absent from the written ownership manifest.
- [x] A repeated install and uninstall leave a refused foreign destination byte-for-byte intact.
- [x] An explicitly forced replacement is the only path that may replace a foreign destination.
- [x] An isolated regression check covers refuse, repeat-install, uninstall, and force behavior.

## Resolution (2026-10-20)

Fixed the foreign-skill data-loss bug in scripts/install-skills.mjs. Root cause: doInstall wrote the full desired skill set to the ownership manifest, including names installOne() refused (destination exists + not ours), so the next install/uninstall adopted and deleted the refused foreign dir. Fix: record only non-refused install actions in the manifest; a refused dir was never ours so it stays out and is left intact. --force remains the sole path to replace a foreign dir. Dry-run now preserves the existing manifest. Added scripts/install-skills.test.mjs (node:test) with isolated throwaway-root coverage. Committed eb147ac, pushed, redeployed to all 4 harness roots.

### Verification
1. ✓ An existing foreign skill refused on install remains unchanged after a second install and uninstall — "Test 'repeat install then uninstall leave a refused foreign dir byte-for-byte intact' passes: a seeded foreign SKILL.md sentinel survives two installs + an uninstall unchanged; the refused name is also absent from manifest.installed (AC1)."
2. ✓ Forced replacement changes only the explicitly forced skill — "Test 'forced replacement is the only path that replaces a foreign dir' passes: without --force the foreign dir is preserved; with --force only that forced skill is replaced and becomes owned, nothing else touched."
3. ✓ Installer regression checks pass — "scripts/install-skills.test.mjs runs 5/5 green via 'node --test' (was 2 failing before the fix), driving the installer as a subprocess against mkdtemp roots — never a real harness root; node --check passes on installer + test."
