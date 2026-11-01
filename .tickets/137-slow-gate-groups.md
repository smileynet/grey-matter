---
id: "137"
title: "check-repo groups 1 and 11 exceed the 2 min pre-push budget (91 s and 116 s)"
status: open
blocked_by: []
tags: ["stream:tooling"]
---

# check-repo groups 1 and 11 exceed the 2 min pre-push budget (91 s and 116 s)

## Observed (2026-11-01, Windows 11, `node scripts/check-repo.mjs --full`)

Total 233 s. Group 1 (deploy.test.mjs) took 90.8 s and group 11 (17 release test files) 116.2 s;
every other group is under 10 s. `--affected` selects both whenever a plugin manifest,
`.agents/`, `.kiro/` or `skill-packs.json` changes, so such a push takes about 210 s, over the
2 min pre-push budget in [local gates](../docs/agents/local-gates.md).

## What to build

Profile both groups (`node --test --test-reporter=spec` per file) and, in order: narrow the
slow tests (shared fixtures, fewer temp-repo builds), split group 11 so `--affected` selects
only the release files whose sources changed, then move whatever stays slow to `--full` only.

## Acceptance criteria

- [ ] A push that changes `.claude-plugin/plugin.json` runs `check-repo.mjs --affected` in 120 s or less on this host, with the timing in the evidence.
- [ ] `--full` still runs every test it ran before.
- [ ] `node scripts/check-repo.mjs --full` passes, apart from ticket 138's known failure.
