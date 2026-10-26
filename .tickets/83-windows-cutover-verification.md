---
id: "83"
title: "Finish Windows verification for global cutover safety fixes"
status: open
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
- [ ] Full repository gate passes with isolated harness state.
- [ ] Verified source changes are committed and pushed.
