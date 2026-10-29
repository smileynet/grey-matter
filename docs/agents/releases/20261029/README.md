# grey-matter 0.2.0 and tkt 0.5.0 — staged (re-prepared 2026-10-29)

The [2026-10-29 audit](../../research/final-release-audit-20261029.md) permits staging
these exact candidates. They replace the [2026-10-24 staging](https://github.com/smileynet/grey-matter/tree/codex/stage-grey-matter-020-tkt-050/docs/agents/releases/20261024),
which was never published. This carrier holds:
- the six sealed plugin archives;
- product and native reports and logs;
- release-note drafts;
- README and changelog snapshots;
- annotated-tag records;
- six real gate receipts per product.

No release is published. The [index](index.json) binds both identities; the
[inventory](inventory.json) hashes each carrier file.

| Product | Candidate commit | Release-note draft |
| --- | --- | --- |
| grey-matter 0.2.0 | `05792a71c7e936b3ed26a623933bbfa224d7b93c` | [Notes](grey-matter/release-notes.md) |
| tkt 0.5.0 | `a827bb6f264ad2ef73157fd8c0a471cb78e634fe` | [Notes](tkt/release-notes.md) |

Each product has five plugin assets: three host archives, `release-metadata.json` and
`SHA256SUMS`. tkt adds 16 dist/crate files and their stage seal from Actions run
[40822712451](https://github.com/smileynet/tkt/actions/runs/40822712451), giving 22
joined release assets. Its [CI identity](tkt/ci-identity.json) binds:
- repository and workflow;
- run and attempt;
- artifact and seal job;
- the ZIP and seal digests.

The ZIP stays in Actions. If it expires, staging and review must be done again.

Read the [install guide](installation.md) before using the archive README commands.
The product and native reports here come from the Linux run. The
[cross-platform summary](../../research/evidence/release-validation-20261029.json) and
its three archives hold the Linux, Windows and macOS results.

## Reproduce and verify

Check out this carrier's exact review commit in a separate clean checkout and run
`npm ci --ignore-scripts`. Set `REVIEW_SHA` to the full review commit, then run:

```sh
node docs/agents/releases/20261029/verify.mjs "$REVIEW_SHA"
```

The command performs no publication. It checks:
- committed regular blobs and their local hashes;
- both pinned staging readers;
- child product and native evidence;
- the live tkt CI provenance, before and after reading its ZIP.

It needs read access through `gh` to the Actions artifact.

To rebuild a candidate, fetch its branch and check out the commit above. Each product's
`preparation.json` keeps the source SHA, date, version, branch and planned version-file
hashes. Preparing again creates a new local candidate; compare identities and metadata
rather than treating new output as the reviewed bytes.
[assembly-recipe.py](assembly-recipe.py) records how this carrier was assembled; its
machine paths are historical.

## Later publication

[Publication commands](publication.md) are prepared for a later, separately authorized
operation. The tag records here are text; no tag ref was created or pushed. A passing
verify or plan is not authorization to publish.
