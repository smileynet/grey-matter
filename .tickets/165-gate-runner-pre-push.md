---
id: "165"
title: "Proposal 18 step 1: gate.mjs runner, gates.json and the pre-push stage"
status: done
blocked_by: []
tags: ["stream:tooling"]
---

# Proposal 18 step 1: gate.mjs runner, gates.json and the pre-push stage

Step 1 of [proposal 18](../docs/agents/proposals/18-three-stage-verification.md). grey-matter
declares `Verification phase: stability`.

## What to build

- `scripts/gates.json`: the declared check list (`full_triggers`, checks with `id`, `stage`,
  `catches`, `scope`, `always`, `run`, `timeout_s`, `measured`).
- `scripts/gate.mjs <pre-push|pre-merge|pre-release>`: selects checks by stage and changed paths,
  runs each with a runner-owned timeout that kills the process tree, stdin closed, `CI=true`,
  `GIT_TERMINAL_PROMPT=0`; reports time and outcome class; `SKIP=<ids>` reported; `--include <id>`;
  `--base REF`; `--stdin` reads Git pre-push refs.
- `.githooks/pre-push`: calls `gate.mjs pre-push --stdin`; opt-in per clone with
  `git config core.hooksPath .githooks`.
- The four pre-push checks: plugin manifest, YAML syntax, invocation sidecars, doc links.

## Acceptance criteria

- [x] `node --test scripts/gate.test.mjs` passes: a docs-only push runs nothing; a two-ref push unions paths; a new-branch push uses the commits not on the remote; a deletion runs nothing; a failing check blocks; a hung check and a `spawnSync`-blocked check both end as `timeout`, not `pass`; `SKIP` is reported; a full trigger selects every check.
- [x] A real `git push` through the Git hook in this repo runs the pre-push stage within its 30 s budget, with the output as evidence.
- [x] `AGENTS.md` declares the phase and names `gate.mjs` as the check command.

## Resolution (2026-11-01)

done: gate.mjs runner (runner-owned timeouts, process-tree kill, worktree snapshot of the judged commit, SKIP, --include), gates.json with four pre-push checks and the runner's own pre-merge tests, opt-in .githooks/pre-push; commits 66141a8 (swept, ticket 140), 204465e, 2c9d7e7
