# Coordinated release contract

Effective for the release-readiness work, ticket 66, 2026-10-23. This is the
implementation contract for tickets 67–71. **The existing publication scripts do
not yet implement it.** Until preparation, publication/resume and candidate
verification gates pass, use them only for inspection; do not execute their legacy
publication path. Current scope ends with reviewed, staged candidates.

## Release identity and version authority

Each repository releases independently. One product version identifies one immutable
release commit across GitHub and every supported plugin format.

| Product | Authority | Derived surfaces |
| --- | --- | --- |
| grey-matter | `.claude-plugin/plugin.json` version | `.codex-plugin/plugin.json`, generated agy plugin.json, `vX.Y.Z` annotated tag, GitHub release and bundle metadata |
| tkt | Cargo.toml package.version | Cargo.lock root package version, crate/binaries, `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, root plugin.json, generated agy manifest, tag/release and asset metadata |

Marketplace entries use the pack manifest's version; they carry no competing version.
The shared deploy engine's internal version is a vendor-compatibility identifier,
not a product release. A tkt skills-only release still bumps tkt and builds its
normal release assets. Exact tested grey-matter/tkt pairs belong in release metadata;
Claude's `tkt@tkt` dependency remains unversioned until a separate policy change.
Codex and agy do not inherit that Claude dependency; their documented tkt CLI
prerequisite remains explicit.

Before 1.0, compatible fixes and small skill/guidance corrections bump patch;
new capability, new distribution targets, substantial batches and breaking changes
bump minor. Reserve 1.0 for an explicit stability commitment. After 1.0, compatible
fixes bump patch, additions minor and breaks major. Behavior-changing instructions
count as product changes even when no binary changes. The highest applicable bump
wins; purely development-only edits may wait for the next product release.

Proposed candidates are grey-matter 0.2.0 and tkt 0.5.0. Approval is pending; record
the user's answer and the included scope before preparing versioned candidates.
No preparation or recovery command silently chooses or increments a version.

The [local draft mechanics](release-preparation.md) and [artifact layer](release-artifacts.md)
now exist, with explicit pending validation. They are not a completed preparation or
publication implementation.

## Modes and mutation boundaries

The release skill orchestrates these modes. Tickets 67–69 provide the executable
interfaces and seeded fixtures; the table is not a claim that they already exist.

| Mode | Required result | Permitted mutation |
| --- | --- | --- |
| dry-run (default) | Report scope, versions, proposed identity, gates and planned channel actions | Read-only; no repo, user-install or remote writes |
| prepare | Reviewed candidate tree/commit, notes, closed bundles, checksums and machine-readable identity | Dedicated local candidate branch/worktree and explicit output directory; no tag push, registry, release, stable or install changes |
| verify | Fresh-install/upgrade, syntax, resources, namespace, policy and exactly-once evidence for the exact candidate | Disposable homes/workspaces and local test refs only |
| publish | Publish the already verified identity through its assigned publisher | Explicit later release authorization required; current staging request does not authorize this mode |
| resume | Inspect external state and complete only missing actions for that same identity | Same authorization and publisher boundary as publish; never bump again |

Preparation starts from a fetched, clean, current source tree. It records the scope
of every open ticket in both repos; tkt permits no silently excluded open work.
Unrelated deferrals require the user's explicit decision. Resolve source/platform
blockers and retain notices. After all version and documentation edits, rerun the
full applicable gates on the candidate commit. No success from an earlier source
revision substitutes for candidate evidence.

Prepared metadata records repository, version, candidate commit, tag name, asset
names and SHA-256 values, skill counts, supported tool/platform versions and tested
compatibility. Build inputs come from that commit. Extracted packages include all
runtime resources and required legal artifacts, and exclude credentials, .git,
.tickets, scratch, target, node_modules and unrelated developer output.

## One publisher per repository

**grey-matter:** its local release tooling is the sole GitHub publisher.
**tkt:** its generated cargo-dist workflow is the sole GitHub publisher; the local
command prepares and dispatches the release identity, then observes CI. It never
creates a second GitHub release. Change generated jobs through dist configuration
and regeneration, not by editing generated YAML. Cargo/crates.io, GitHub and stable
promotion are separately observed states; none is assumed atomic with another.

The authorized publication path pushes only the intended branch and annotated tag
atomically. Unsupported atomic pushes stop with recovery instructions. It verifies
the remote tag's commit before GitHub creation and uses `--verify-tag`. The assigned
publisher creates or resumes a matching draft, uploads the complete assets, checks
their hashes, then publishes. Published tags/assets are immutable; corrected bytes
require a new version. Never delete or move a published tag, push all local tags,
or replace a published asset. Verify immutable-release protection before publication.

Resume inspects remote tag/SHA, draft/published release, asset hashes, workflow and
crate publication. Matching completed steps are left intact; missing steps resume;
conflicting identities fail. An API timeout is an unknown outcome until read back.
A failed stable promotion resumes promotion only, not publication or versioning.

## Development, stable and pinned delivery

Development uses main or an explicit checkout. Local maintenance refreshes through
one canonical deploy call, including enabled Codex and agy plugins and owned bare
roots. Legacy wrappers are alternatives, never additional deploy steps. Deployment
is a local operation and never constitutes a product release.

Stable consumers register each marketplace from its `stable` branch. That branch
is release-only, created/promoted only after verified publication, and resolves to
the exact tested release commit. It fast-forwards between releases; a divergent
stable ref stops promotion. The stable channel does not exist merely because this
contract names it. Candidate verification uses local refs/disposable remotes until
real publication is authorized. Pinned consumers select `vX.Y.Z` or the full commit
and stay there until they deliberately change the pin. Version fields do not pin
main for a new install.

A Git marketplace release needs the versioned source and channel promotion; a ZIP
alone does not update a plugin. Reload/restart running chats after refresh. Existing
Claude cached installs need a version change, while local relative marketplace
installs read checkout files. Codex same-version cache rules and automatic cadence
remain undocumented here: report actual tested behavior/version, not Claude-derived
assumptions. Test fresh and previous-release upgrades for every supported harness.

Public plugin-directory submission is optional, separately authorized work with its
own metadata/privacy requirements. GitHub publication does not submit a directory
listing, install a plugin, or publish a crate automatically.

## Verification and staging boundary

Use the [source conformance report](research/plugin-conformance.md),
[notice inventory](research/plugin-notice-inventory.md), grey-matter check-repo,
tkt mise run check, version/packaging/recovery fixtures and native validators.
Ticket 60 must supply real Windows evidence; unavailable platforms remain gaps.
Ticket 69 tests install/upgrade and every supported harness, including project-only
roots. Ticket 70 reconciles all findings and decides go/no-go for staging. Ticket 71
updates README, changelog, install/migration guidance and release-note drafts, then
repeats the audit on the final candidate. Its index records both SHAs, assets/hashes,
compatibility, exclusions and exact later publish/resume commands.

Staged status proves reviewable release inputs. It is not permission to publish tags,
crates, GitHub releases, stable branches or public-directory submissions.

## Rationale and sources

The [release identity decision](decisions/0001-release-identity.md) records trade-offs.
[GitHub mechanics](research/github-release-strategy.md) and
[plugin update semantics](research/plugin-release-semantics.md) retain primary URLs,
warnings, observation dates and known gaps. Re-read the linked source sections when
implementing or changing a host contract; native behavior supplements specifications.
