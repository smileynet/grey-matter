---
id: "61"
title: "agy global deploy via plugin package (build-agy-plugin.mjs)"
status: done
blocked_by: []
tags: ["meta"]
---

# agy global deploy via plugin package (build-agy-plugin.mjs)

## What to build

TBD

## Acceptance criteria

- [x] TBD

## Resolution (2026-10-23)

done: added scripts/build-agy-plugin.mjs — packages the skills as an agy plugin (plugin.json + flattened skills/, same discovery+lint as the installer), validates with 'agy plugin validate --strict' (43 skills, 0 findings), installs via 'agy plugin install'. Verified live: 'agy plugin list' shows grey-matter enabled/43 skills; 'agy --print' from /tmp lists grey-matter skills globally. Key finding: on agy 1.1.14 discovery is plugin-driven, NOT a bare-dir scan (repo's project-root claim was agy 1.2.0; corrected harnesses.md). Committed 264d50c, pushed.
