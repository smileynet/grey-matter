---
id: "213"
title: "Gate fixtures fail on Windows without Developer Mode: symlinkSync EPERM"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "relocate-knowledge, agent-guidance, review-receipt and crew-uninstall checks pass on a Windows host with Developer Mode off (or each symlink case skips with a named reason)"
  - "Directory links use junctions on win32; file-symlink cases probe capability once via a shared helper instead of failing"
  - "node scripts/gate.mjs pre-merge --base <pre-change sha> shows those four checks ok on Windows"
tags: ["kind:bug", "stream:test-verification"]
---

# Gate fixtures fail on Windows without Developer Mode: symlinkSync EPERM

## What to build

Intent source: the 2026-11-03 sync on Windows (Developer Mode off, so `AllowDevelopmentWithoutDevLicense` is unset). `node scripts/gate.mjs pre-merge --base 5b8bbd9` failed four checks whose only cause is `symlinkSync` raising `EPERM` (unprivileged file symlinks need Developer Mode or admin):

- `knowledge-relocation`: `scripts/relocate-knowledge.test.mjs` "the CLI runs when invoked through a symlinked path".
- `agent-guidance`: `scripts/check-guidance.test.mjs`, 3 tests (steering symlink fixture `frontier-work.md`).
- `review-receipt`: `scripts/review-receipt.test.mjs` "escaping paths and source/parent symlinks are rejected" (directory link `evidence -> ui/captures`).
- `crew-uninstall`: `scripts/uninstall-crew-research.test.mjs`, all 3 committed tests (`fakeHome` file symlink). Each passes logic-wise once the link can be made.

Fix in the fixtures, not the products: create directory links as `junction` on win32 (no privilege needed), and for genuine file-symlink cases use one shared capability probe (try once in tmpdir) that skips with a named reason when it is unavailable. Look for an existing helper in `scripts/` before adding one. The uncommitted working-tree change to `scripts/uninstall-crew-research.test.mjs` already shows the junction pattern for crew-uninstall (see ticket 214).

## Acceptance criteria

- [ ] relocate-knowledge, agent-guidance, review-receipt and crew-uninstall checks pass on a Windows host with Developer Mode off (or each symlink case skips with a named reason)
- [ ] Directory links use junctions on win32; file-symlink cases probe capability once via a shared helper instead of failing
- [ ] `node scripts/gate.mjs pre-merge --base <pre-change sha>` shows those four checks ok on Windows
