---
id: "214"
title: "crew-research uninstaller can delete outside its skill root via backslash or linked paths on Windows"
status: open
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

TBD

## Acceptance criteria

- [ ] TBD
