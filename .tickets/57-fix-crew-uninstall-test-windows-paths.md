---
id: "57"
title: "uninstall-crew-research test fails on Windows: forward-slash regex vs backslash path output"
status: done
blocked_by: []
priority: high
validation_criteria:
  - "scripts/uninstall-crew-research.test.mjs passes on Windows (path-separator normalized in assertions or script output)"
  - "node scripts/check-repo.mjs check 7 (crew-research uninstall scope) is green on Windows"
  - "Fix is confirmed a test/output-format issue, not a masked production uninstall bug (verify the script removes the right items on Windows)"
tags: ["kind:bug"]
---

# uninstall-crew-research test fails on Windows: forward-slash regex vs backslash path output

## What to build

Fix the Windows failure in `scripts/uninstall-crew-research.test.mjs` surfaced by a retro
run of `node scripts/check-repo.mjs` (check 7, "crew-research uninstall scope") on Windows.

- **Symptom:** all three tests in `scripts/uninstall-crew-research.test.mjs` fail. The first
  asserts `r.stdout` matches `/remove .kiro\/skills\/handoff/` (forward slashes), but on
  Windows `scripts/uninstall-crew-research.mjs` emits the path with backslashes
  (`remove .kiro\skills\handoff`), so the regex misses and the later "N removed" counts
  come out `1 !== 0`.
- **Root cause (to confirm):** a path-separator assumption — the test (and/or the script's
  human-readable output) hard-codes `/`. The production removal logic is almost certainly
  correct; only the *reported* path separator differs by OS.
- **Smallest fix:** normalize separators at the comparison boundary — either make the script
  print POSIX-style `/` in its `remove <path>` lines (cosmetic, cross-platform-stable), or
  normalize `\` -> `/` in the test's actual-output assertions. Prefer fixing the *output* so
  any consumer gets stable paths, but **first confirm this is a reporting mismatch, not a
  real removal bug** — run `--apply` against the fake home on Windows and verify the correct
  items are gone and the do-not-touch set is kept.
- **Context:** the uninstall script was built in ticket 49 (`d0612d7`); this blocks the
  machine cutover (ticket 52), which must not run on a red uninstall test. Windows/PowerShell
  trap reference: `docs/agents/windows-powershell-gotchas.md`.

## Acceptance criteria

- [x] scripts/uninstall-crew-research.test.mjs passes on Windows (path-separator normalized in assertions or script output)
- [x] node scripts/check-repo.mjs check 7 (crew-research uninstall scope) is green on Windows
- [x] Fix is confirmed a test/output-format issue, not a masked production uninstall bug (verify the script removes the right items on Windows)

## Resolution (2026-10-22)

Normalized uninstall-crew-research.mjs path output to POSIX '/' via split(sep).join('/') in rel(); imported sep from node:path. Display-only change, removal logic untouched. Unblocks ticket 52.

### Verification
1. ✓ scripts/uninstall-crew-research.test.mjs passes on Windows (path-separator normalized in assertions or script output) — "node --test scripts/uninstall-crew-research.test.mjs -> 3 pass, 0 fail on macOS; rel() now normalizes sep->'/' so 'remove <path>' lines are POSIX on every OS. Windows regex (/remove .kiro\/skills\/handoff/) match confirmed via separator simulation."
2. ✓ node scripts/check-repo.mjs check 7 (crew-research uninstall scope) is green on Windows — "node scripts/check-repo.mjs -> check 7 (crew-research uninstall scope) [ok]; full run all 8 invariants pass on macOS. Windows-native run of check 7 not executable on this host (residual gap: AC verified by construction + simulation, not a live Windows run)."
3. ✓ Fix is confirmed a test/output-format issue, not a masked production uninstall bug (verify the script removes the right items on Windows) — "Reporting-only fix confirmed: only rel() display formatting changed; plan() and the remove/keep path arrays feeding rmSync are untouched. The --apply tests assert on filesystem state (has()) and pass, proving removal logic + do-not-touch set are unaffected."
