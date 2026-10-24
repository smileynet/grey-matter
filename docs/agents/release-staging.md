# Pinned staging evidence

`readStagedCandidate` in `scripts/release-staging.mjs` reads a staging index and its
receipts from an explicit 40-character Git commit. Publication integration must use
this reviewed commit, rather than mutable working files or a caller-supplied
`status: pass`. The reader makes no writes and does not authorize publication.

## Index format

The index has `schema: 1`, `kind: "release-staging"`, `status: "staged"` and an
`entries` array identifying grey-matter and tkt exactly once. The caller selects one
product and supplies its local sealed artifacts and verification directory.

Each selected entry contains:

| Field | Contract |
| --- | --- |
| `product`, `version`, `candidateSha` | Exact product, stable version and full candidate commit; must match sealed metadata and verification reports. |
| `repository` | Explicit GitHub owner/repository; remote binding remains a publication-integration requirement. |
| `metadataSha256` | SHA-256 of the sealed `release-metadata.json`. |
| `verificationSha256` | SHA-256 of `verification.json`; the evidence reader checks child report/log hashes and every native artifact identity. |
| `notes` | `{file, sha256}` for nonempty release notes committed at the reviewed index revision. |
| `gates` | Exactly `scope`, `compatibility`, `upgrade`, `platform-approval`, `final-audit`, `staging`, each a committed `{file, sha256}` receipt. |

Every gate receipt has `schema: 1`, `kind: "release-gate"`, the candidate identity,
its `gate` name, `status: "pass"`, an empty `blockers` array, a nonempty `summary`
and a nonempty `evidence` array of source/command descriptions. Failed or missing
gates cannot be waived by editing the verification report's pending list.

Receipts and notes must be regular Git blobs. Absolute paths, parent traversal,
symlink blobs and mismatched hashes are rejected. Working-tree edits do not change
what a pinned commit supplies. Release Git commands ignore local replacement refs with `GIT_NO_REPLACE_OBJECTS`,
as specified by the [Git reference](https://git-scm.com/docs/git-replace).
Git stores the receipts; local artifact and log bytes
are checked independently against their sealed hashes.

## Result and limits

The reader returns the reconciler's candidate identity, reviewed notes and five
plugin-release assets: three host archives, metadata and `SHA256SUMS`. It derives
an empty pending-gate list only after checking all six receipts for the selected
product. It does not certify the other product's local artifacts, run missing checks,
or generate passing receipts.

An explicit commit provides an integrity boundary, not proof of human review. The
staging workflow and operator must establish that the commit is the reviewed one.
A caller choosing an unreviewed commit cannot turn that choice into authorization.
Real publication still requires separately authorized execution, correct remote
binding, immutable-release policy and the assigned publisher. tkt's cargo-dist assets
and crate recovery must be integrated before exposing its publication path.

Current coverage uses committed synthetic receipts and disposable repositories.
It proves identity/hash binding and refusal behavior, not final release readiness.
Tickets 70 and 71 must supply real audit/staging receipts after the remaining gates
pass. See the [release contract](release-contract.md) for the publication boundary.

## Reviewed tkt CI publisher binding

The tkt entry additionally carries `publication` before it can be executed by
`release-tkt-ci.mjs`. This is a binding, not an approval grant:

```json
{
  "workflowSha": "<exact candidate C>",
  "workflowId": 123,
  "branch": "refs/heads/codex/release-tkt-0.5.0-example",
  "tag": { "file": "staging/tkt-tag.txt", "objectSha": "<annotated tag object SHA-1>" }
}
```

The tag file is its complete `git cat-file tag` record committed at review R.
The reader checks its Git object hash and direct candidate/version headers. CI
imports that exact object rather than creating a new timestamped tag. The workflow
SHA is C; workflow ID is the repository's publication workflow, distinct from the
build-only staging workflow ID. The publisher checks both the dispatch context
and current Actions run identity, including the source repository ID, twice before
pushing refs. It accepts a detached, clean checkout of C.

The entry library now joins reviewed CI and plugin bytes, verifies immutable
policy, checks development M, pushes scoped atomic refs and calls the existing
intent/registry/GitHub/stable coordinator with the prepared Cargo adapter. Its
default mode verifies and plans without credential callbacks or remote writes.
Integration tests use synthetic review receipts, mocked services and isolated
repositories. Before staging a candidate, verify the production workflow and
dispatch/observer against runner-loss fixtures and an integrated independent
review. These checks establish recovery behavior; candidate publication requires
separate authorization and the real committed gate receipts.

## Review carrier for CI

For the tkt publisher, place the reviewed plugin assets in `tkt/artifacts/` and
verification reports/logs in `tkt/evidence/`, relative to the committed index's
parent directory. Preserve exact bytes and regular Git blobs on the dedicated
review branch R. The CI publisher checks out R separately from candidate C and
reads this carrier; it does not rebuild bundles or regenerate successful reports.
The separate dist/crate ZIP stays in its reviewed Actions artifact and is verified
through the existing provenance reader. Artifact expiration requires new staging
and review. Record the carrier inventory in final staging evidence.

The manual tkt `publish.yml` runs only on explicit dispatch and defaults to a
read-only plan. Its local dispatcher records the request before POST, binds the
returned run ID (or correlates an uncertain response by its unique title), and
never resends the saved request automatically. It reports workflow state without
claiming that a green run alone proves publication.

[L2:verified] [GitHub workflow dispatch API](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event),
read 2026-10-23 with API version 2026-03-10, documents branch/tag `ref`, workflow
inputs and a 200 response containing `workflow_run_id`, `run_url` and `html_url`.
The implementation still treats a failed/missing response as uncertain and saves
initial attempt permission before the request. No real publication dispatch has
been issued to test it; current dispatch tests use fake API responses.
