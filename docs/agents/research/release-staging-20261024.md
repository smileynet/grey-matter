# Release artifacts staged — 2026-10-24

**grey-matter 0.2.0 and tkt 0.5.0 are staged; nothing is published.** Audit 70 is complete. The dedicated review branch is `codex/stage-grey-matter-020-tkt-050`, pinned to review commit **`c24720f77f252544659a376a1493fd5c53985018`**. Both candidate branches and worktrees remain clean at their original frozen identities.

| Product | Exact candidate | Reader result |
| --- | --- | --- |
| grey-matter 0.2.0 | `e071b7b03d02025dc1af6c3ff2c4f8369f777587` | Five plugin assets, six passing gate receipts |
| tkt 0.5.0 | `2b6ff173993c9fe413c40287fb1cb3f0a9879ca1` | 22 joined assets, six passing gate receipts |

The [committed staging index](https://github.com/smileynet/grey-matter/blob/c24720f77f252544659a376a1493fd5c53985018/docs/agents/releases/20261024/index.json) binds notes, metadata, verification reports and all gate digests. Its [review guide](https://github.com/smileynet/grey-matter/blob/c24720f77f252544659a376a1493fd5c53985018/docs/agents/releases/20261024/README.md) links the exact README/changelog snapshots, coordinated dependency-first installation/migration guide, inventories, tag text records and deferred publication/recovery commands. The carrier stays on its dedicated review branch; source main does not absorb the release archives.

Evidence: the carrier's `verify.mjs c24720f77f252544659a376a1493fd5c53985018` → **pass**, 47 regular committed carrier files verified; both staging readers pass, and the tkt reader independently rechecks live Actions provenance, original ZIP and every CI asset. The joined tkt set is five plugin assets plus 16 dist/crate files and one stage seal. The inventory excludes itself to avoid a recursive hash; its digest is bound by the [closeout evidence](evidence/release-staging-20261024.json).

Evidence: `node scripts/check-repo.mjs --require-tools` in the review checkout → all 12 groups pass, including release recovery/refusal fixtures. `dispatch-publication.mjs plan` at the pinned review commit → **pass, writes:false**, workflow 394865280 and exact tkt candidate branch verified. Final prose/static command review → CLEAN. Authored files pass whitespace, links and scope checks; original sealed raw logs retain two pre-existing whitespace findings rather than being edited. No candidate source or version changed during staging, so current three-platform native/install/upgrade evidence is reused with its original identities and limits, rather than labeled as another native execution.

Read-only checks show no candidate release tag, stable ref or matching GitHub release/draft in either repository. The crates.io index still reports tkt 0.5.0 absent. Absence is not a reservation. Actions artifact expiration, changed bytes, new vendor behavior or a registry collision requires revalidation before later publication. No tag ref/object was created, no publication workflow dispatched, and no registry, GitHub release, stable channel, public directory, repository setting or secret was changed.

To review elsewhere, fetch `codex/stage-grey-matter-020-tkt-050`, check out the full review commit in a separate clean checkout, run `npm ci --ignore-scripts`, then execute the pinned verification command above. Candidate identity and preparation snapshots support reconstruction; Git recovers the exact staged bytes. Preserve the same review commit, candidate identities and durable state paths for any later authorized publication or recovery.
