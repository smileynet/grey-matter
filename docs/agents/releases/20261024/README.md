# grey-matter 0.2.0 and tkt 0.5.0 — staged

Audit [70](../../../../.tickets/70-pre-release-audit.md) permits staging these exact candidates. This carrier preserves six sealed plugin archives, product/native reports and logs, release-note drafts, README/changelog snapshots, annotated-tag records and six real gate receipts per product. No release is published. The [index](index.json) binds both identities; the [inventory](inventory.json) hashes each carrier file.

| Product | Candidate commit | Release-note draft |
| --- | --- | --- |
| grey-matter 0.2.0 | `e071b7b03d02025dc1af6c3ff2c4f8369f777587` | [Notes](grey-matter/release-notes.md) |
| tkt 0.5.0 | `2b6ff173993c9fe413c40287fb1cb3f0a9879ca1` | [Notes](tkt/release-notes.md) |

The five plugin assets per product are three host archives, release-metadata.json and SHA256SUMS. tkt adds 16 dist/crate files and their stage seal from Actions run 40085017493, giving 22 joined release assets. Its reviewed [CI identity](tkt/ci-identity.json) binds repository, workflow, run/attempt, artifact, upload job, ZIP and seal digests. The ZIP remains in Actions and the retained local audit copy; an expired artifact requires new staging and review.

Read the [coordinated install/update/migration guide](installation.md) before using the archive README commands. Review the [audit and limitations](../../research/final-release-audit-20261024.md), including the Windows AGY inventory/shadow distinction and non-enforced Windows/Linux network isolation. No unresolved release defect or platform waiver remains. Public-directory submissions and universal model-activation certification are outside scope.

## Reproduce and verify

Check out this carrier's exact review commit in a separate clean checkout and run `npm ci --ignore-scripts`. Set `REVIEW_SHA` to the full review commit recorded in ticket 71's closeout evidence, then run:

```sh
node docs/agents/releases/20261024/verify.mjs "$REVIEW_SHA"
```

The command checks committed regular blobs and their local hashes, both pinned staging readers, child product/native evidence and the live tkt CI provenance before and after reading its original ZIP. It performs no publication. The carrier's unchanged files can be recovered directly from Git; no candidate worktree or machine-local scratch path is needed to read them. Verification needs read access through `gh` to the retained Actions artifact.

For candidate reconstruction, fetch each candidate branch and check out the exact commit shown above. Each product's preparation.json preserves source SHA, date, version, branch and planned version-file hashes. The original preparation used `node scripts/release.mjs prepare --repo SOURCE --version VERSION --date 2026-10-24 --out NEW_OWNED_OUTPUT --execute` (tkt uses `tools/release.mjs`). This can create a new local candidate; compare identities and metadata rather than treating newly generated evidence as the reviewed bytes. The archived snapshots and artifacts are authoritative for this staging.

The assembly-recipe.py file retains the original local assembly procedure and locators for forensic reproduction. It requires the recorded prepared outputs and audit tree. Its machine paths are historical inputs, not required installation locations; do not rerun it over reviewed evidence. The pinned verification command is the reproducible integrity check.

## Later publication and recovery

[Publication commands](publication.md) are prepared for a later, separately authorized operation. Tag records here are text blobs; no tag ref was created or pushed. A passing reader or plan is not authorization to publish. Do not alter version, notes, tag identity or state path when resuming a partial publication.
