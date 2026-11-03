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
completed on integrated `62b168b` with 141 classified script candidates and
`installed 50 skills.` Final bookkeeping and live dispatch integration are
reported separately.

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

## Complete script usage guidance (203)

The initial catalog candidate was blocked because it misdescribed the active
dashboard builder and fixture generator, omitted exact held-tool invocation
contracts, and included mutating/weakly checked inventory modes. The revised
candidate `f0c37cbce52772c346d6454a0c37ea8285aabc82` was independently accepted
after source-based corrections, including explicit PR-fixture repository
requirements and destructive `--force` semantics. Parent integrated it and
registered the accepted 204 helper/test with a direct owning-skill pointer at
`62b168b08b9fed67ffd2028d24e69f4284f8ef29`; the critic renewed acceptance of
that exact integrated tree.

The on-demand checker discovers common script extensions throughout the tracked
repository, indexed executable modes and two-byte shebang candidates, plus
nonignored untracked candidates. All 141 current paths are classified: 57
operators, 16 modules, 51 tests and 17 fixtures/templates. Operator rows link to
owning skill guidance and state command/input, mutation/authorization, output
and evidence limits. The checker validates structural coverage/links/fields;
source review still owns semantic accuracy. It never invokes inventoried tools,
and import has no inventory side effects. Future 205/207/208 tools must be
registered when integrated; this baseline count is not a promise about new files.

**Pass, parent-observed:** inventory 141/141; four negative/positive inventory
fixtures; syntax (50 skills/37 sidecars), invocation (50 skills/19 user-only),
docs consistency and diff checks. The worker's missing-`yaml` syntax attempt was
an infrastructure error, resolved for verification by the dependency-equipped
parent, not silently reported as passed. A fully captured parent pre-merge run
on `62b168b` relative to `bd83fcd` passed 4/4 selected checks: syntax fixtures,
dashboard contract, harness versions and tkt usage compatibility. Manual
pre-push passed 5/5; deployment completed `installed 50 skills.` with Agy
excluded, and push succeeded. No model, native probe or global setting change
was used for inventory discovery or qualification.

Private review output and addendum remain parent-owned for this cycle's final
audit; the compact [retention index](evidence/orchestration-delivery-203-20261103.json)
records their exact identities. The 203 worktree/dependencies are retained only
through integration/closure and reuse or managed archival, preserving unrelated
worktrees and historical native evidence.

## Publication preflight (205)

Exact candidate `79df42f0aac38bbd204695926f9fda6dbd075e15` received independent
acceptance. Parent also ran all ten rejection/acceptance fixtures on integrated
bytes. The helper composes the existing accepted review receipt with a separately
parent-owned identity, exact packet/check-attestation hashes, required check IDs,
current Git candidate and the complete materialized package inventory. Check
records are explicitly attestations; they do not prove commands ran. Parent
retains and reads actual command output separately.

The first supported path compares exact unprojected source copies. The second is
one fixed transform for this effort's dashboard links; unknown transformations,
mapping or arguments are rejected. The critic compared it with the current
exporter. It does not inspect archives, remote state or later uploads, and cannot
lock files against mutation after the check.

Two bounded production uses passed at historical parent candidate
`ee7b30d717c8d271e16f4bf038bffed88b164206`: dispatch preflight inspected the
actual completed 205 worker's registered checkout, assigned base, four changed
files and exact independent-review output; publication preflight compared the
actual known 202/206 Site payload with the committed, unprojected, reviewed
dashboard and the two actual parent gate logs. It reported
`checksAreAttestations: true`. This is a check of that snapshot, not a claim that
a new Site deployment occurred during these production checks. The
[private evidence index](evidence/orchestration-delivery-205-20261103.json)
binds the retained packets, expected identity, attestations and raw results.

Worker verification passed 10 publication fixtures, 56 dashboard/receipt tests,
ten syntax fixtures, strict global-dashboard validation and syntax/invocation/
docs/provider checks. Two additional browser test commands were **infrastructure
errors** because Playwright modules were absent in that isolated worktree; they
were not passed. Parent's separately retained twelve actual phone/laptop captures
cover the published 202/206 snapshot, not later renderer changes.

## Durable session/message foundation (208)

Independent exact-source review accepted final candidate
`5b32423ed58df723c9e9156afbfd6bd0e3aeaa30`; parent and critic each passed all
11 regression tests, including the Windows temporary-root ACL denial case.
The parent requested a missing harness-version field after initial review;
it is now mandatory in complete targets, with explicit `not-reported` allowed
without claiming qualification. Wrong versions and stale generations are rejected.
The code persists local queued messages, requires exact registered targets,
handles stable duplicates/conflicts, correlated replies/done, ordered receipt
transitions, unchanged replay and ambiguous-lock failures. No native notification
or automatic retry is implemented, and the full native matrix remains unqualified
by this child. **Parent #179 remains open.**

No crash-injection/power-loss or simultaneous-lock stress test was performed;
the restart-process fixture and fsync/rename implementation are narrower evidence.
The registry is an operational private control plane, not an authenticated
multi-user security boundary. Native delivery and exactly-once processing are
not established. [Raw evidence retention](evidence/orchestration-delivery-208-20261103.json)
includes parent-verified copies of the critic's original worktree-local output;
the critic initially named the requested parent location, then corrected the
actual worktree location. The parent verified byte hashes before copying.

## Concurrent upstream reconciliation and deployment

An unrelated upstream update advanced `main`, added the temporary Windows test
wrapper and updated canonical deployment. A clean rebase preserved those changes;
the accepted helper implementations remained byte-identical to their reviewed
candidates. Original pre-rebase tree `6118dbe` is retained under a parent-owned
local Git retention ref for the exact historical production evidence. Independent
critics renewed source-equivalence acceptance and the final catalog changes.
The new wrapper is documented and classified; current coverage is 146 scripts
(60 operators, 16 modules, 53 tests, 17 fixtures/templates). Installed catalogs
are explicitly scoped to grey-matter maintenance, not another project's tooling.

On final accepted tree `b5ce898a5313f653fc528b380070423cce1a6819`, parent
pre-merge passed 2/2 selected checks (syntax fixtures and dashboard contract),
pre-push passed 5/5, and the final push hook passed 5/5. A deploy attempt first
failed lint because the registered tkt checkout had an older vendored deployer.
The user approved preserving its unpublished claim during a rebase; a guard found
that the other owner had already rebased and added another documentation commit.
Parent left both unpublished commits untouched and pushed neither. The read-only
deployer synchronization check then passed with matching source blobs.

`node scripts/deploy.mjs --no-agy --no-kirocrew` completed with `installed 50
skills.` and push of `b5ce898` succeeded. These flags skip plugin/app deployment;
they are not execution controls. The separate Agy execution hold remains, and
unrelated Crew app adoption/trust is excluded from this delivery. No global
harness setting or model default was changed by these operations. Parent retains
the evidence, isolated worktrees and owned runtime inputs through this cycle's
integration/final audit, then records reuse or managed archival/disposition.

## Existing-agent notification slice (#210, child of #179)

Independent source acceptance covers exact worker candidate
`a4110cc2937868713b3903b5fde068fc04f86d0a`. Parent and critic each ran the focused
notification fixture: **PASS, 8/8**, zero skipped or failed. Review first blocked
ignored trailing CLI arguments and an undocumented supported lane. The revised
helper rejects extra arguments before creating an intent and supports only the
explicit Codex desktop preparation path. It persists a once-only intent before
returning a fixed tool action; it never calls the native tool itself. The actual
dispatch preflight passed against the clean assigned checkout, independently
recorded base, exact final candidate and retained critic output.

The parent then selected its existing idle worker from the live roster and invoked
the prepared `collaboration.followup_task` action once. That worker received and
handled the persisted request, queued a correlated completion and reported its
marker and hashes through the native parent channel. Parent acknowledged the
completion. Replay left two records unchanged; duplicate preparation was refused.
Independent evidence review accepted this **one idle existing-agent case** after
matching all five retained platform records to their original log lines. The
native call's empty output alone was not treated as receipt.

Native message arguments are encrypted in the platform log and were retained
opaque, without decryption or a plaintext-byte comparison. The observable native
target/control records, received report and correlated record hashes support this
bounded receipt. `harnessVersion: not-reported` and generation `1` remain local
registry metadata, not native version/lifecycle attestation. Busy delivery, crash
recovery, other harnesses and background persistence remain unqualified. The first
canary-inspection assertion expected the wrong rejection diagnostic: the already
acknowledged request was rejected before the prior-intent check. Correcting that
assertion required no native resend or new message.

[Retained evidence and limits](evidence/orchestration-delivery-210-20261103.json)
index the small owned runtime and exact raw review/platform excerpts. No whole
transcript, credential, global setting or unrelated conversation was copied or
changed. **#179 remains partial**; this bounded child does not satisfy its broader
cross-interface, busy-session, crash, timeout or native installation criteria.

## Outcome trace consistency audit (#207)

Independent acceptance covers exact final worker candidate
`1c318f0baecae4e464d9a68f5371d4a3adc8b156`. The critic's pinned counterexamples
first showed that cancellation could leave stale approval valid and that a later
BLOCK verdict could leave an earlier integration accepted. The revised fixture
rejects both. Parent and independent critic each observed **PASS, 14/14** scenario
tests; the integrated parent run also passed all eight notification tests
(**22/22 total**, no skips or failures).

The audit binds current checkout, candidate, independently supplied trace hash and
actual evidence bytes. It requires the complete current scope in the frontier,
invalidates approval when scope or review changes, counts the coordinator and
reserved reviewers, and refuses failed verification or publication as delivered.
Its restart fixture uses the actual spool across a fresh process. It is a passive
consistency check, not a second coordinator or proof of native goal persistence.
All supplied event claims remain attestations; a byte hash does not make them true.

The parent ran the real dispatch preflight on the clean final worker checkout and
retained critic output. [Raw checks and counterexamples](evidence/orchestration-delivery-207-20261103.json)
are retained for the delivery audit. One critic run overlapped the requested worker
revision; that mutable run was discarded. Fixed historical evidence was then read
from immutable Git snapshots, and the renewed review used the frozen final commit.

At integration `cae90bb`, the source inventory covered **150 scripts**: 62 operators, 16 modules,
55 tests and 17 fixtures/templates. Both new operator commands have dedicated
usage contracts, owning-skill pointers and catalog entries. Poll/status/replay
documentation now distinguishes unchanged records from their transient lock writes.

A concurrent owner then completed #209, removing retired model-spike entry points
and their temporary test wrapper. Parent preserved that upstream work and rebased
only its unpublished integration. The catalog conflict was limited to the removed
wrapper row beside the four new entries; the wrapper stayed removed and the new
entries stayed classified. The current inventory check passes **136/136** paths:
55 operators, 14 modules, 50 tests and 17 fixtures/templates. The accepted new helper
implementations remain unchanged. Historical `cae90bb` and its point-in-time audit
evidence are retained separately; that earlier count is not the current inventory.

## Integrated verification and retention

On pushed integration `c47493192d03245fb5ad7525437881bcef876c0c`, parent reran
the focused suites (**PASS, 22/22**), pre-merge (**PASS, 2/2 selected**), pre-push
(**PASS, 5/5 selected**) and deployment (**installed 50 skills**, Agy and unrelated
Crew-app adoption excluded). Independent review renewed source equivalence and
guidance acceptance after the upstream reconciliation. #207 and #210 were then
closed with evidence; #179 remains partial.

The parent also used the new auditor on a retrospective, evidence-bound settlement
trace at retained historical `cae90bb`: **PASS, 15 events**. It correctly kept work
running, cleanup unresolved, monitor unknown and publication not attempted rather
than declaring the outcome complete. This was a real operator invocation over
retained check/native evidence, not a live native-goal trace. Historical plan and
ledger bytes are retained because ticket closure and subsequent publication move
those sources forward. [Settlement/current-check retention](evidence/orchestration-delivery-settlement-20261103.json)
records exact hashes and boundaries. Private raw evidence and the small owned native
runtime remain retained for the #179 qualification audit or explicit owner
disposition; no unrelated historical sessions or private draft ancestry were removed.

## Published snapshot and cleanup boundary

The reviewed effort and delivery dashboards were pushed in owner commit
`f990f625545d81b5ae9d7166754d4924efc9ba80`. Their twelve desktop/phone captures
received independent acceptance. The real publication preflight passed immediately
before publishing, binding that owner candidate, accepted effort receipt, current
check attestations and the fixed link-transformed payload. The native Site helper
then supplied source `407f5fdbcb454c620539b6d4f8cf7b4dcf5f7934` and its archive;
Sites returned terminal **succeeded** at 2026-11-03T21:09:29Z. Owner-private access
was preserved. This does not add production browser or cross-harness qualification.

[Publication and disposition evidence](evidence/orchestration-delivery-publication-20261103.json)
records the native result, current guard output and archive hash. The verified
73,942-byte archive went to the OS Recycle Bin after success. All ignored worker
scratch was copied and hash-verified before attempted managed archival. The app
refused removal of all three worktrees because of active-task/primary-checkout
protection; they remain kept with explicit release conditions, without a deletion
fallback. Their measured total logical footprint was 205,430,852 bytes. Historical
sessions, unrelated worktrees, the private unpublished draft and shared dashboard
tooling remain protected. No background monitor is represented as active.
