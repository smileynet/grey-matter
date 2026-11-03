# Outcome-driven orchestration delivery evidence

The user approved proposal 19 on 2026-11-03. The current outcome and queue remain
in [the plan](../../plan.md#outcome-driven-orchestration-delivery-authorized-2026-11-03).
This file records accepted delivery slices, not another ticket board.

## Outcome contract and invocation (202)

Worker candidate `bdf2f18203a038bdac92dd830651eee63e575a7e` was built in a
registered isolated worktree from `fdb4e5f8b31ec84e968a7944f456d75228f7b34e`.
It changes only the orchestrate entry point, sidecar/outcome reference, routing
indexes and proposal 17's historical status. Independent critic
`critic206_reference` accepted that exact candidate against its base after a
read-only source/spec review. Parent integrated it at
`29928893e37e7529bbc7dd8ab926be4126a59a30`.

The skill now permits user and authorized-agent invocation, retains tkt authority,
and defines scope/proof, resources, revision and stop conditions. Batch completion
is distinct from outcome completion; blocked/deferred state, pause/cancellation,
usage exhaustion, reviewer capacity and monitor recovery are explicit. Native
goal persistence and live invocation were **not run**; this slice ships guidance,
not a newly qualified runtime or remote-delivery adapter.

## Operational reference corrections (206)

Parent candidate `a2022b22609a2e9e916bf9a2682d1bdbab2560f8` corrects bucket-root
discovery, distinguishes cancelled-ticket reopen from done-ticket closure, and
makes TDD conditional on applicable behavior work. Installed `tkt 0.4.0
(898ceb5)` help describes reopen as returning a cancelled ticket to open.
Its capability schema explicitly contains `new.inputSchema.properties.tags.flag`
as `--tags` and `vc.alias_of` as `validation`; older missing-flag prose was removed.
No ticket lifecycle experiment or native model call was performed.

The same independent critic accepted the three-file content, then renewed
whole-ticket acceptance on integrated `29928893` after proposal 17's historical
status landed and parent deployment completion was supplied. This does not
complete #166's broader harness-overview refresh or other existing ticket scopes.

## Verification and disposition

- **Pass:** worker `node scripts/check-skill-syntax.mjs`, invocation-policy,
  docs-consistency and provider-fallback checks; worker syntax fixtures 10/10.
  Its initial syntax attempt was an **infrastructure error** (missing `yaml`),
  resolved by `npm ci --ignore-scripts` after a free-space check. The final worker
  tree was clean. These are worker-reported results.
- **Pass, parent-observed on integrated bytes:**
  `node scripts/gate.mjs pre-merge --include skill-syntax-fixtures` selected and
  passed one check; `pre-push` selected and passed plugin-manifest, skill-syntax,
  invocation-policy, doc-links and home-path, five of five. Push hook repeated
  five passing checks and the shared remote accepted `29928893`.
- **Skip, no applicable checks:** the earlier reference-only default pre-merge
  selection was zero; this is not a test pass.
- **Pass, deployment:** `node scripts/deploy.mjs --no-agy` completed with
  `installed 50 skills.` Agy remained excluded. The critic did not independently
  rerun deployment; current installed invocation behavior remains unprobed.

Source guidance and this compact acceptance record are promoted to Git. Parent
owns the isolated 202 worktree and its dependency installation until integration
and ticket closure are recorded, then archives that owned worktree through the
managed worktree tool. Task bodies/plan-preparation helper remain parent-owned
temporary reconciliation inputs until this delivery cycle settles. The active
203 worktree and all unrelated historical worktrees, raw evidence and private
draft ancestry are preserved; their ownership is not released by these closes.

## Dispatch and evidence preflight (204, code integrated)

Initial candidate `9c5afcf9636ac5ea30a669ae0894cdac67591b0c` was blocked by
independent review: ancestry alone did not establish the assigned base, and
evidence paths lacked a final regular-file check. Revised exact candidate
`4fdac4a153e49c83f4722b4130bcb919053d3d68` was independently accepted after
both fixes. Parent integrated it as `b5f164246aff6a7c593a8339146f2122d4230dc5`.

The helper requires the expected base as a separate parent-owned input, compares
it to the packet, then verifies actual worktree/branch/HEAD, ancestry, clean
state, scoped changed paths and exact evidence hashes. It does not authenticate
an owner string, prove evidence relevance, semantic non-overlap or reviewer
independence. Regular-file rejection is present; a FIFO was not exercised on
Windows. It is a point-in-time check, not a lock against subsequent edits.

**Pass:** independent critic and parent each ran all eight preflight fixtures.
Parent integrated pre-merge syntax-fixtures passed 1/1; manual pre-push and push
hook each passed their five selected checks. The manual gate process and push
hook overlapped in this run; both terminal results were read before acceptance.
This is not a recommended dependent-command sequence.

The [private raw evidence index](evidence/orchestration-delivery-204-20261103.json)
records hashes and retention ownership. Earlier failed-review evidence is kept
with the final result for this cycle's audit. Catalog registration and deployment
remain part of final ticket closure; this paragraph does not claim that later
bookkeeping or live dispatch integration has already run.

## Published 202/206 dashboard snapshot

Independent visual review accepted the four dedicated and eight global phone/
laptop captures in `t202-206-final` and `t202-206-status-final`. Both receipt
currency checks passed immediately before commit. Dedicated scope explicitly
includes the existing #179 tooling dependency without retagging it: 44 tickets,
22 findings, 37 done, one cancelled, one deferred and five open/in-progress.
Global status has 57 entries, 205 tickets, four tabs and no current user asks.
Interaction tests passed at 1280/390 pixels; the global checker reported no
errors or warnings. The plan diagram intentionally scrolls horizontally on phones.

Dashboard-only pre-merge selected zero checks (**skip**, not a test pass);
pre-push and hook passed doc-links, home-path and gates-coverage. Packaged
checks verified current 202/206 completion, remaining/deferred states and all
44 source-ticket links at the repository root. Sites returned terminal
`succeeded` at `2026-11-03T19:24:58Z` for source
`947a0c35279a49863e84f1c3b33f832b4a07522c`, deployment
`appgdep_6aea3502bd548191b408a926b1aaa930`; owner-only access was confirmed
and preserved. No production-browser or native-goal proof is implied.
