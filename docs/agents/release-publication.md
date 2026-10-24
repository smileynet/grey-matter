# Reviewed publication and recovery

`release-publication.mjs` connects grey-matter's pinned staging evidence, exact Git
refs, GitHub reconciliation and stable promotion. It plans by default. Actual mutation
requires `--execute` and separate publication authorization. Current ticket work has
used fake GitHub services and disposable remotes; it has published no real release.

## Inputs and planning

Use a clean dedicated candidate worktree at the candidate commit recorded in the
staging index. Its branch must
start with `codex/release-grey-matter-VERSION-`. Supply the annotated tag's object
SHA; the tool verifies its embedded tag name, type and candidate commit. Creating
or signing that tag remains an explicit authorized release step.

Read the [staging format](release-staging.md) before supplying a reviewed index.
All six selected-product gate receipts, local report/log hashes, notes and sealed
assets must match. The selected push remote must resolve to the reviewed GitHub
repository through HTTPS or Git SSH. Effective push URL overrides and rewrites are
checked; credentials in URLs, other hosts, local transports and multiple push URLs
are refused.

```sh
node scripts/release-publication.mjs publish \
  --repo /candidate/worktree \
  --review-repo /review/repository --review-sha FULL_REVIEW_COMMIT \
  --index docs/agents/releases/staging.json --product grey-matter \
  --artifacts /sealed/artifacts --evidence /verification/directory \
  --tag-object ANNOTATED_TAG_OBJECT_SHA --state /recovery/publication.json
```

This default plan reads local inputs without contacting GitHub or changing files,
refs, recovery state or releases. The preparation/verification shell wrappers retain
their existing modes; publication uses this explicit Node entry point.

## Authorized execution

After publication is authorized, repeat the same command with `--execute`. It checks
immutable-release policy, prepares and fully checks a development integration in an
owned clone, then pushes main/candidate/tag atomically. It creates or resumes the matching draft, uploads the complete five-asset
set, publishes, verifies immutable bytes and promotes stable. Unsupported atomic
pushes stop without sequential fallback. Stable promotion is a separate verified
step after publication.

Development integration lives beside recovery state in `STATE.development`. It
fetches main, keeps the exact candidate commit, and either fast-forwards or constructs
a clean merge with both parents. Conflicts and inconsistent/regressed versions stop
before any push. Dependency setup uses pinned public-registry packages with isolated
npm config/cache and disabled install scripts; the full product gate runs at the
integration SHA. The candidate checkout and local main remain unchanged. After a
successful publication, refresh the local development checkout from remote main
before further maintenance.

Recovery state stays outside the candidate checkout and binds the review revision,
candidate, remote name, branch, tag object, notes and asset hashes. Observed release
IDs are saved before later actions. A different/disappeared release ID stops recovery.
The tool rechecks source cleanliness, remote binding and staged evidence between
phases. It reports GitHub and stable results, the marketplace URL, and directory
submission as `not-requested`.

## Resume and limits

Use `resume` with the same arguments, state path and `--execute` after an interruption.
The owned clone preserves the integration object through failed checks. If remote
main advances, resume constructs and checks its updated integration before another
ref push. A modified/foreign clone is preserved and refused. Git must support
`merge-tree --write-tree`; unsupported clients stop before the push.
It inspects completed steps again instead of bumping, creating a second release or
replacing bytes. A failed stable promotion retries promotion after observing the
published release. Partial completion remains recorded even when later steps fail.

An exclusive lock protects each recovery state path. An existing lock stops execution;
inspect its receipt and confirm the owning process is no longer active before removing
an abandoned lock. Never remove another running publisher's lock or start the same
release under a second state path. The lock is local, not a distributed GitHub lease.

Local tkt publication is refused. Its intended sole publisher is CI. Build-only
staging and the [reviewed artifact reader](release-ci-artifacts.md) exist; the
review-bound CI publisher, dispatch and crate recovery remain ticket 68 work. This
command does not bypass that boundary. Neither a successful plan nor synthetic
passing receipts establish final release readiness or human approval.
