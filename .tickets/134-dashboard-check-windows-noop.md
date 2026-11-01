---
id: "134"
title: "check-dashboard.mjs CLI is a silent no-op on Windows (entry-point guard never matches)"
status: done
blocked_by: []
tags: ["stream:tooling"]
---

# check-dashboard.mjs CLI is a silent no-op on Windows (entry-point guard never matches)

## What to build

`skills/productivity/delivery-dashboard/scripts/check-dashboard.mjs` decides whether it is the entry point with `resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)` (line ~170). On Windows the URL pathname is `/D:/...`, which resolves to `D:\D:\...`, so the guard is never true. `node check-dashboard.mjs <file>` prints nothing and exits 0, so the skill's own check step passes every dashboard on Windows. Found in the Claude Code orchestrate spike (ticket 125): the CLI exited 0 on a dashboard whose exported `check()` reports four errors.

Compare with `fileURLToPath(import.meta.url)`, and cover the CLI path in `scripts/delivery-dashboard.test.mjs`, which today only imports `check()`. Other scripts in the repo may share the pattern; grep for `import.meta.url).pathname`.

## Acceptance criteria

- [x] `node check-dashboard.mjs <bad dashboard>` prints the JSON and exits 1 on Windows.
- [x] A test runs the checker as a CLI (spawned) on a failing fixture and asserts exit 1.
- [x] Any other script with the same entry-point guard is fixed or listed.
- [x] `node scripts/check-repo.mjs` passes.

## Resolution (2026-11-01)

done: both CLI entry guards use fileURLToPath (commit da661b1); delivery-dashboard.test.mjs 33/33, new spawned-CLI test fails without the fix; the only other URL.pathname use (inspect-footprint.test.mjs) is handled under 151
