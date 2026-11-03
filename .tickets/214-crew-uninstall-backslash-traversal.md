---
id: "214"
title: "crew-research uninstaller can delete outside its skill root via backslash or linked paths on Windows"
status: done
blocked_by: []
priority: high
validation_criteria:
  - "A manifest entry containing \\, /, : or a leading dot is kept as unsafe and never joined into a delete path"
  - "No path is removed when the manifest, skill root, steering, tier file or codex AGENTS.md is reached through a symlink or junction"
  - "Regression tests cover backslash traversal and each linked root; node scripts/gate.mjs pre-merge shows crew-uninstall ok on Windows"
tags: ["kind:bug", "stream:migration"]
---

# crew-research uninstaller can delete outside its skill root via backslash or linked paths on Windows

## What to build

Intent source: the 2026-11-03 sync found an uncommitted working-tree change to `scripts/uninstall-crew-research.mjs` and its test. Its owner was not identified, and it is not committed. Reading the committed code shows the bug it fixes.

**Bug (committed `HEAD`):** `plan()` rejects only manifest names containing `/` or starting with `.`. On Windows a `.crew-skills` line such as `nested\..\..\..\escape` passes that check. `join(root, name)` then resolves outside the skill root, and if it exists and is not grey-matter-owned, `--apply` removes it. The script also follows symlinked or junctioned roots (`~/.kiro`, `~/.kiro/skills`, `~/.agents/skills`, `~/.kiro/steering`, `~/.codex`), so it can delete foreign content reached through a link. Only the leaf `isLink(p)` is checked.

**Candidate fix (the uncommitted diff):** a `linkedPath(path, home)` walk that keeps any manifest/root/tier/steering/codex path reached through a link, and an unsafe-name test `/[\\/:]/` or leading `.` evaluated *before* the join. Tests add backslash and forward-slash traversal plus one case per linked root. The working-tree test file passes 9/9 on Windows (2026-11-03). Review it, run the gate, and commit it under this ticket.

## Acceptance criteria

- [x] A manifest entry containing `\`, `/`, `:` or a leading dot is kept as unsafe and never joined into a delete path
- [x] No path is removed when the manifest, skill root, steering, tier file or codex AGENTS.md is reached through a symlink or junction
- [x] Regression tests cover backslash traversal and each linked root; `node scripts/gate.mjs pre-merge` shows crew-uninstall ok on Windows

## Resolution (2026-11-03)

done: uninstaller rejects backslash/colon traversal names before joining and skips any path reached through a symlink or junction; Windows fixtures use junctions

### Verification
1. ✓ A manifest entry containing \, /, : or a leading dot is kept as unsafe and never joined into a delete path — "b8936c1: plan() tests /[\\/:]/ or leading dot before join(root,name); 'manifest traversal entries cannot delete directories outside the skill root' passes (backslash and slash variants)"
2. ✓ No path is removed when the manifest, skill root, steering, tier file or codex AGENTS.md is reached through a symlink or junction — "b8936c1: linkedPath() walk keeps manifest/root/tier/steering/codex paths reached via link; 5 'migration preserves contents reached through a linked <root>' tests pass with junctions"
3. ✓ Regression tests cover backslash traversal and each linked root; node scripts/gate.mjs pre-merge shows crew-uninstall ok on Windows — "node --test scripts/uninstall-crew-research.test.mjs: 9 pass 0 fail on Windows; node scripts/gate.mjs pre-merge: [ok] crew-uninstall (ticket-graph red only on pre-existing 172, tracked by 219)"
