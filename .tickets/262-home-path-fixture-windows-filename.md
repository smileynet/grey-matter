---
id: "262"
title: "home-path-fixtures writes a filename Windows forbids (quote and newline) and fails the gate"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "node --test scripts/check-home-path.test.mjs passes on Windows, with the quote/newline case skipped with a named reason or replaced by an NTFS-legal equivalent"
  - "The case still runs on POSIX hosts"
  - "node scripts/gate.mjs pre-merge shows home-path-fixtures ok on Windows"
tags: ["kind:bug", "stream:test-verification"]
---
Found in the 2026-11-06 sync. scripts/check-home-path.test.mjs:47 ('new paths are caught in ordinary, quoted and formerly exempt filenames') writes `quote" and\nnewline.txt`; NTFS forbids both characters, so writeFileSync throws ENOENT and the pre-merge gate's home-path-fixtures check fails on this Windows host. Separate from 213 (symlink EPERM). Keep coverage of quoted Git path output on platforms that allow these names.