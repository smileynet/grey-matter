---
id: "218"
title: "sync verifies the pulled range, not an empty diff, and survives a Windows vendor check"
status: in_progress
blocked_by: []
priority: medium
validation_criteria:
  - "sync step 5 runs gate.mjs pre-merge with --base <pre-pull sha>, so a clean tree after a pull still selects the affected checks"
  - "sync detects tkt CLI drift by build hash (not only the version string) and states what pack/ticket features need the newer build"
  - "sync names the fallback when tkt's mise run check cannot run locally (no cargo/bash) and when a push cannot authenticate, instead of leaving it to the agent"
  - "sync reloads pulled guidance, preflights authorized registered sources and CLI compatibility before ticket operations, and preserves authorization and completed steps on retry"
tags: ["kind:enhancement", "stream:tooling"]
---

# sync verifies the pulled range, not an empty diff, and survives a Windows vendor check

## What to build

Intent source: running `sync` on 2026-11-03 (852 commits pulled). Gaps in `skills/meta/sync/SKILL.md`:

1. **Empty gate after a pull.** Step 5 runs `node scripts/gate.mjs pre-merge`. Right after a fast-forward the tree equals `origin/main`, so it selected "0 of 21 checks" and passed. That says nothing about the pulled code. `--base <pre-pull sha>` selected all 21 and found 8 failures. Use step 1's recorded HEAD as `--base`.
2. **tkt drift by version string only.** Step 4 compares `tkt --version` strings. The installed binary (`92d4833`, the 2026-10-19 v0.4.0 tag) and the dev build the repo now expects (`898ceb5`+, with `tkt cancel`) both print `0.4.0`. So drift went unnoticed until `tkt validate` hit `status: cancelled` (ticket 219). Compare the build hash, and name the ticket/pack features that need the newer build.
3. **Unrunnable steps on Windows.** The vendor step requires `mise run check` in tkt. Here that needs `cargo` (not installed) and bash path handling, and fails regardless of the vendor change. The `tkt` and grey-matter pushes also failed or hung on GitHub credential prompts. Say what to do: run with `GIT_TERMINAL_PROMPT=0`, compare against a base run, and record the gate as unavailable in the ticket.

Related: ticket 142 (installed plugin lags the repo). In this sync the *deployed* sync skill was stale and still named the retired `check-repo.mjs`.

Extended after the macOS sync in this chat: reload checkout guidance after pulling;
snapshot every authorized active pack; fast-forward clean behind-only checkouts;
resolve CLI/build compatibility before ticket parsing; preserve authorized upgrades
and session footprint exceptions across retries. Keep footprint policy with its owner.
Checker fixes: ticket 239. Deployment recovery: ticket 240. Probe budgets: ticket 241.
Source: skills/meta/sync/SKILL.md.

Verification note: the home-path gate reports 225 unchanged historical findings on
both origin/main and this work. Use its documented scoped SKIP only after checking
changed files introduce no paths. Do not rewrite historical evidence in this ticket.
All other applicable gates remain required.

## Acceptance criteria

- [ ] sync step 5 runs `gate.mjs pre-merge` with `--base <pre-pull sha>`, so a clean tree after a pull still selects the affected checks
- [ ] sync detects tkt CLI drift by build hash (not only the version string) and states what pack/ticket features need the newer build
- [ ] sync names the fallback when tkt's `mise run check` cannot run locally (no cargo/bash) and when a push cannot authenticate, instead of leaving it to the agent
- [ ] sync reloads pulled guidance, preflights authorized registered sources and CLI compatibility before ticket operations, and preserves authorization and completed steps on retry
