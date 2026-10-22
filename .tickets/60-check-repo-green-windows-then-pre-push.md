---
id: "60"
title: "check-repo is red on Windows (invariants 5, 7); fix, then gate pushes on it with a pre-push hook"
status: open
blocked_by: []
validation_criteria:
  - "node scripts/check-repo.mjs exits 0 on Windows (Git Bash) at main, and a committed .githooks/pre-push runs it and blocks a push when an invariant is seeded red"
---

# check-repo green on Windows, then a pre-push gate

## Intent source
Retro of a 2026-10-22 session in D:\code\writing that also worked in grey-matter. Commit `a0b964e`
was pushed while `scripts/check-repo.mjs` reported two FAILED invariants, because the command was
`node scripts/check-repo.mjs 2>&1 | tail -11 && git push` (the `&&` tested `tail`). Both failures were
already present at upstream `eca3161` (checked in a clean worktree), so nothing regressed, but the
aggregator is red on main on this Windows machine and grey-matter has no hook that would stop a push.

## The failures (Windows 11, Git Bash, Node 22)
- **Invariant 5, knowledge relocation (adopt-project):** fails at `eca3161` and at main.
- **Invariant 7, crew-research uninstall scope:** `scripts/uninstall-crew-research.test.mjs` fails
  "dry-run removes nothing" and "apply removes exactly the manifest-named and crew-owned items, and
  snapshots first" (`expected: 0`). tkt 57 ("fix crew uninstall test windows paths", done) made the
  script print POSIX paths, but the test still fails here, so that fix is incomplete on Windows.

## What to build
1. Diagnose and fix invariants 5 and 7 on Windows (likely path separators or symlink/junction
   handling; see tkt 57 and `022faa3`), with a regression test that runs on Windows.
2. Add `.githooks/pre-push` running `node scripts/check-repo.mjs` (bare, exit code gating), and
   document enabling it next to the existing hook installers (`scripts/install-hooks.*`; extend
   rather than duplicate).
3. The agent-side habit is already documented: `docs/agents/windows-powershell-gotchas.md`
   ("A pipe hides a gating command's failure", `3388845`).

## Acceptance criteria
- [ ] `node scripts/check-repo.mjs` exits 0 on Windows at main.
- [ ] `.githooks/pre-push` blocks a push when an invariant is seeded red, and allows it when green.
- [ ] Hook enablement is documented where the other hooks are.

## Context
- `scripts/check-repo.mjs` (the aggregator), `scripts/uninstall-crew-research.test.mjs`,
  `skills/meta/adopt-project/scripts/relocate-knowledge.mjs` and its test.
- tkt 57, commits `521e92b`, `022faa3`.
