# Development and immutable-release reconciliation

Observed 2026-10-23. The transport now accepts a development integration SHA in the same atomic transaction as candidate branch/tag. Three new disposable fixtures pass: disjoint-history merge/replay, unsupported atomic server, and missing candidate ancestry/advanced main refusal. Merge construction, version/full-gate proof and publication CLI integration remain unfinished. No real release refs were pushed.

## Finding

[L1:verified] `scripts/release-publication.mjs` seals candidate SHA C and requires its dedicated branch to remain clean at C. The publication CLI currently supplies only the candidate branch and annotated tag to the transport. Stable later receives C. `scripts/deploy.mjs:431–440` compares the manifest with every local semantic version tag, without ancestry filtering. Consequently an annotated candidate tag in a shared Git common directory can make the old main checkout fail before publication. Ticket 68 explicitly records this gap. [L2:verified] The release contract permits prepare writes only on dedicated candidate refs and forbids production publication during staging.

## Recommended operation

[L5:inferred] Reconcile development as part of explicitly authorized publication, before the branch/tag transaction, and include the resulting main SHA M in that transaction. Preserve C, its branch, annotated tag object and staging receipts unchanged. Stable remains C, never M. This maintains ancestry for the next candidate and makes the remotely published main version current at the instant the release tag appears.

1. Fetch the single validated destination main ref with no automatic tag following into an operation-owned local tracking ref. Record fetched SHA D and use only that SHA for construction. Require main to exist; refuse a missing or unresolvable object. Do not move the user's local main or check out over their working files.
2. Build in an isolated operation-owned checkout/ref based on D. If D is an ancestor of C, M=C (fast-forward). If C is an ancestor of D, M=D only if all product version authorities/derived manifests remain consistent and their version is >= candidate version and every relevant existing release tag; otherwise stop for an explicit bookkeeping fix. If neither is an ancestor, merge C into D using `git merge --no-ff --no-commit C`. Stop on conflicts; do not silently choose ours/theirs. Commit a clean merge only after version consistency, main's full repository gate and scope review pass. M must contain both D and C.
3. Persist M, D, C and the tag object in recovery state before any push. Verify candidate C again. Add exactly `M:refs/heads/main` to the existing explicit atomic candidate-branch/tag push; retain no-force, no-follow-tags, one destination and no sequential fallback. Preflight must verify that current remote main can fast-forward to M. If it changed incompatibly, stop and re-plan from its latest SHA without changing C. A new merge M requires rerunning its checks.
4. Read back all three remote refs even after command failure/timeout. Accept main=M or a descendant of M only after fetching/validating its version and ancestry; exact tag object and candidate branch must still match. If a matching branch was omitted from Git's update set and races ahead, readback can detect this but cannot retroactively make the transaction atomic. Stop publication on any ambiguous/conflicting identity; never roll back an existing tag.
5. GitHub publication and stable promotion proceed only after development reconciliation is observed. Resume inspects actual refs rather than assuming saved phase means success. A later main descendant is permitted after validation; a missing C ancestry or regressed version stops. An interrupted stable promotion resumes stable only after rechecking publication identity; it never republishes or bumps a version.

A separate post-publication main merge is weaker: a published tag may already make main's gate fail, and a failure can leave that state indefinitely. A three-ref transaction makes main integration part of publication readiness. It still cannot promise no later writer will regress main; branch protection/repository checks are the durable control.

## Preparation caveat

Creating `refs/tags/vX.Y.Z` in a shared Git common directory affects all worktrees, even if no main ref changes. Preparation should retain the annotated object SHA through an operation-owned non-tag ref, and install the official tag only in an isolated candidate clone when needed. Alternatively delay official local tag creation until authorized publication. Do not weaken deploy's version rule or silently mutate main during prepare. This requires checking existing preparation/tag APIs before choosing the implementation; publication currently validates a tag object, not necessarily a local named tag ref.

## Required disposable fixtures

- Main ancestor of C: main and candidate become C; exact annotated tag; stable unchanged until verified publication.
- Main already contains C with equal/newer consistent version: no main write; replay harmless.
- Divergent main with disjoint edits: merge M has parents D and C; candidate/tag/stable remain C; subsequent release is descendant of old stable.
- Merge conflict, inconsistent manifests, version regression, dirty/foreign checkout: fail before remote mutation; no overwrite of user work.
- Missing main, shallow/missing ancestry, invalid object: fail closed and explain fetch requirement.
- Main races ahead before push: non-fast-forward atomic failure leaves all needed updates absent; fetch/rebuild M, gates rerun, C unchanged.
- Main already matches M then races: post-readback catches incompatible state even if Git omitted main from transaction; no GitHub publication.
- Unsupported atomic server: no sequential fallback; main/tag/candidate unchanged.
- Push succeeds but transport fails: readback proves completion; resume makes no duplicate merge/push/publication.
- Crash after M persisted, after refs, after GitHub, after stable: resume reconstructs observed progress for same C; no candidate rebase, amend, cherry-pick, tag move or repeat bump.
- Dry-run: no checkout/ref/state/remote write; reports reconciliation plan and required checks.
- Candidate official tag isolated from shared main: deploy gate on main remains usable during staging; after integration gate passes with official tag fetched.

## Sources and warnings

- [L1:verified] Local files read: release-contract.md, release-publication.mjs, release-git.mjs, deploy.mjs, .tickets/68-release-publication.md. These govern current project behavior; the recommendation above is not existing functionality.
- [L2:verified] [Git push reference](https://git-scm.com/docs/git-push), read 2026-10-23: atomic means all updated refs or none and unsupported servers fail; default branch updates require ancestry, tag replacement is rejected. Warning/Con: atomicity is per transport; matching refs can be omitted and a later writer can change a ref. Explicit refspecs avoid implicit push configuration.
- [L2:verified] [Git merge reference](https://git-scm.com/docs/git-merge), read 2026-10-23: `--ff-only` refuses divergence; true merge preserves both histories. Warning/Con: `--no-commit` cannot pause a fast-forward; use `--no-ff --no-commit` for inspectable divergent merge construction. Dirty starting work can make abort unable to reconstruct prior changes; isolated clean checkout is required.
- [L2:verified] [Git merge-base reference](https://git-scm.com/docs/git-merge-base), read 2026-10-23: `--is-ancestor` returns 0 for ancestry, 1 for false and other nonzero for errors. Do not conflate missing-object errors with ordinary divergence.

Transport support and the three fixtures above are implemented. Merge construction, version/full-gate proof and CLI integration remain pending. No real publication ran.
