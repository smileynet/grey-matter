---
id: "83"
title: "Finish Windows verification for global cutover safety fixes"
status: done
blocked_by: []
validation_criteria:
  - "Migration traversal and linked-root regression tests pass"
  - "Full repository gate passes with isolated harness state"
tags: ["distribution"]
---

# Finish Windows verification for global cutover safety fixes

## What to build

Finish verification of the global cutover fixes currently in the working tree:

- `scripts/uninstall-crew-research.mjs` rejects Windows manifest traversal and
  preserves files reached through linked ancestors.
- `scripts/uninstall-crew-research.test.mjs` covers traversal and linked roots.
- `scripts/deploy.test.mjs` isolates dual-plugin fixtures from real harness CLIs.

The installed Claude and Codex plugins, global instructions, and Kiro skill copies
are already verified. Crew-research and recall's active global guidance were
removed after creating a backup under `~/.local/share/grey-matter`.

Verification on 2026-10-26:

- `node --test scripts/skill-syntax.test.mjs scripts/uninstall-crew-research.test.mjs`
  passed all 19 tests.
- Both `claude plugin validate .` and validation of the tkt checkout passed.
- Native plugin inventories show grey-matter and tkt enabled in both clients.
- The deployment audit found no duplicates and preserved an unrelated, externally managed Kiro
  skill.
- The full repository gate encountered Windows `EPERM` when creating a file
  symlink in `scripts/relocate-knowledge.test.mjs`, and temporary-directory
  cleanup failures in deployment fixtures.

Use an isolated fixture home when running the gate. The dual-plugin fixture must
place its Codex config under the same `.codex` directory as its skill root.
Resolve the Windows capability and cleanup failures, rerun the full gate, then
commit and push the source fixes. Do not treat targeted passes as a full gate pass.

## Acceptance criteria

- [x] Migration traversal and linked-root regression tests pass.
- [x] Full repository gate passes with isolated harness state.
- [x] Verified source changes are committed and pushed.

## Resolution (2026-10-29)

The cutover fixes were committed and pushed on 2026-10-26 (6a9771e, 275c677; both on origin/main). The Windows verification ran on SharkTank on 2026-10-29 as part of the grey-matter 0.2.0 candidate's product gate, which includes these files.

### Verification
1. ✓ Migration traversal and linked-root regression tests pass — "Windows product gate on candidate 05792a7 (SharkTank, 2026-10-29): group 7 'crew-research uninstall scope' ok, which runs uninstall-crew-research.test.mjs (traversal and linked roots)"
2. ✓ Full repository gate passes with isolated harness state — "Same run: all 16 repo-check groups ok, 'All repository-consistency invariants pass'; isolated harness state per release-native isolatedEnvironment; log grey-verify/product/1-product.log in docs/agents/research/evidence/windows-evidence-20261029.zip"
