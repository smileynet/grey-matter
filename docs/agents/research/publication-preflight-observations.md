# Publication preflight observations

Read-only GitHub probes and disposable Git experiments, 2026-10-23. These inform
ticket 68's remaining adapters; they do not implement publication or approve a release.

## GitHub settings and discovery

[L1:verified] At 23:24 UTC, both repository setting GETs returned HTTP 200 with
`{"enabled":false,"enforced_by_owner":false}`. Immutable releases are disabled on
`smileynet/grey-matter` and `smileynet/tkt`. No setting was changed.

```text
GET /repos/smileynet/grey-matter/immutable-releases
GET /repos/smileynet/tkt/immutable-releases
Accept: application/vnd.github+json
X-GitHub-Api-Version: 2026-03-10
```

The responses selected API version `2026-03-10`. A compatibility GET against
grey-matter with `2022-11-28` also returned the same false/false body. Request IDs:
grey-matter `F868:22AAEB:137D14:20ACBA:6ADBEC98`, tkt
`F871:3A086C:139E2A:20E549:6ADBEC9B`, compatibility
`F8FC:21BC9A:14313E:21667C:6ADBECCB`.

| Contract | Evidence | Con / warning |
| --- | --- | --- |
| Read explicit `enabled` and `enforced_by_owner` booleans | [Repository settings reference](https://docs.github.com/en/rest/repos/repos?apiVersion=2026-03-10#check-if-immutable-releases-are-enabled-for-a-repository) and the GETs above | The reference describes disabled as 404, but both disabled repositories returned 200. Status 200 alone cannot authorize publication; arbitrary 404s cannot establish absence or disabled policy. |
| Inspect owner policy when applicable | [Organization settings reference](https://docs.github.com/en/rest/orgs/orgs?apiVersion=2026-03-10#get-immutable-releases-settings-for-an-organization) documents `all`, `none`, `selected` and paginated repository IDs | Both current owners are users. Organization inheritance was read, not exercised. Settings reads require Administration read access. |
| Find drafts through authenticated paginated lists, then retain numeric release ID | [Release API](https://docs.github.com/en/rest/releases/releases?apiVersion=2026-03-10) and actual list GETs | No drafts currently exist to exercise retrieval/publication. A by-tag 404 does not establish draft absence. |
| Use explicit methods and typed fields | [gh API manual](https://cli.github.com/manual/gh_api) | Fields can change the default method to POST. Installed gh rejects combining `--slurp` and `--jq`; aggregate paginated results in the caller. `draft=false` must be a JSON boolean when publication is later authorized. |

[L1:verified] Paginated discovery returned no grey-matter releases and five tkt
releases, all published and mutable: v0.4.0 (417696123), v0.3.0 (375221099),
v0.2.1 (372727554), v0.2.0 (372659688), v0.1.0 (368539109). These are existing
releases, not candidates or drafts created by this work.

The future adapter must stop when immutability is explicitly disabled or cannot be
determined. Enabling policy is a separate authorized action; current staging work
does not change it. [Immutable-release protection](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases)
must also be confirmed on the published result. No PATCH, upload or publication was
attempted by these probes.

## Git transaction behavior

[L1:verified] Git 2.56.0 experiments used new disposable bare repositories only.
The [full transcript](evidence/atomic-git-probe-20261023.log) records explicit commands,
exit codes and ref observations. Both owned probe directories were removed and
probe processes stopped; the transcript remains as evidence.

| Case | Result | Ref observations |
| --- | --- | --- |
| Supported atomic creation and fast-forward | Exit 0 | Both requested refs updated together. |
| `receive.advertiseAtomic=false` | Exit 128 | Existing branch unchanged; new tag absent. |
| Divergent branch | Exit 1 | Branch unchanged; tag creation rejected atomically. |
| Conflicting existing tag | Exit 1 | Existing tag retained; otherwise valid branch update rejected. |

[L2:verified] [Git push](https://git-scm.com/docs/git-push) requires fast-forward
updates for ordinary heads and rejects existing tag updates. `--atomic` rejects
unsupported servers; do not fall back to sequential pushes. The
[capability setting](https://git-scm.com/docs/git-config#Documentation/git-config.txt-receiveadvertiseAtomic)
provides a reproducible unsupported-server fixture. [Ancestry checks](https://git-scm.com/docs/git-merge-base#Documentation/git-merge-base.txt---is-ancestor)
distinguish divergence from errors; [update-ref](https://git-scm.com/docs/git-update-ref)
supports expected-old values locally, not a remote transaction across GitHub APIs.

The experiment's branch was named `stable` to test ref transactions. That is not the
production release order: the [release contract](../release-contract.md) first pushes
the candidate branch and tag atomically. Stable promotion is a separate later step
after verified publication. The probe tags were lightweight; annotated-tag validation
and pushing pinned object IDs still need implementation fixtures.

Remaining cases include ambiguous transport outcomes, exact-old concurrency,
configuration-driven extra refs/multiple push URLs and preservation of unrelated tags.
Freeze intended object IDs, use explicit full destination refs and reject divergence;
no force, deletion or wildcard refspec is authorized. Probe configuration was isolated
from personal settings after an initial tag command opened an editor. That isolation
is for fixtures; it does not authorize ignoring a user's real signing/authentication policy.

Coverage: setting/discovery GETs and four Git transaction scenario families were
observed. Live publication, organization inheritance, interrupted network outcomes
and the full publication/stable adapters remain unverified.
