# Local draft preparation

Ticket 67 implementation: local draft mechanics, not release readiness. The release
contract still gates production use on complete preparation/native/platform checks.
This command currently produces `mode: draft`, `publishable: false` and explicit
pending product, native, scope and platform validation. Publication is not implemented
here; proposed real candidate versions remain subject to approval.

## Entry points and shared ownership

Use `node scripts/release.mjs` in grey-matter or `node tools/release.mjs` in tkt.
The shell wrappers expose `prepare`, `verify-product` and `verify-native`; they
forward explicit arguments and preserve the Node tools' default inspection mode.
tkt also exposes `mise run release -- MODE ...`. The old version/patch/minor/major
shell modes and automatic mise bump aliases are removed. No wrapper runs cargo-release,
creates a GitHub release or pushes a ref. Publication/resume remains ticket 68.

Canonical modules live in grey-matter. After changing them, check tkt with
`node scripts/sync-release-tools.mjs --target /path/to/tkt`; use `--write` to update
owned copies. It requires a private target package with development dependencies
matching the canonical package, refuses foreign/local edits and records per-file hashes in tkt's `tools/release-vendor.json`. Update tkt's
private package/lock deliberately if canonical dependencies change. The deploy engine
keeps its existing separate vendor ownership. Runtime manifests include the shared
modules, deploy engine and package/lock so extracted plugins retain those resources.
Run `npm ci --ignore-scripts` in a source checkout before maintenance commands.

## Inspect or create a draft

Maintainers need Node 22+, Git and `npm ci --ignore-scripts` in grey-matter. From its
checkout, inspect a clean target repository:

```sh
node scripts/release.mjs prepare --repo /path/to/repo --version X.Y.Z --out /path/to/new-output
```

The default is read-only. `--dry-run` is explicit and equivalent; it cannot combine
with `--execute`. Dry-run reads committed source and reports file hashes, notes,
branch and worktree paths without creating output, fetching or changing refs/index.
Fixtures compare complete source/Git, sandbox harness-home and bare-remote bytes.

Only after approving the version/scope, `--execute` creates a local draft. It fetches
origin/tags when configured, refuses a behind/diverged source and creates a separate
`codex/release-PRODUCT-VERSION-SOURCE` branch/worktree. `--worktree PATH` can use an
existing clean app-managed worktree at the source commit, including detached HEAD;
the tool creates its release branch there. Original source content/HEAD stays intact.
Output within the source repository must be ignored. Existing foreign output is refused.

`--date YYYY-MM-DD` fixes the changelog date; otherwise the initial UTC date is
recorded and retained on resume. The draft commit uses reproducible Git author/date
inputs. It uses commit-tree/update-ref to avoid invoking user hooks or publication
helpers; full validation is still pending, never implied by that commit.

## Version and changelog updates

One shared inspector checks the source authority and all plugin manifests. For tkt,
Cargo.toml owns the version and Cargo.lock's root package must match. Preparation
updates only that root lock entry; registry packages with the same name and dependency
versions stay unchanged. Literal Cargo replacements retain comments/formatting and
are parsed again to prove the intended versions. Competing marketplace version values
and non-increasing, malformed or already-tagged stable versions fail.

The tool promotes exactly one nonempty Unreleased section, updates a matching Unreleased comparison
link and adds the candidate link and writes section-only release notes. Hidden editorial comments and version
footer definitions are omitted from notes. No new tag is created, no crate/GitHub
release is published, no stable ref is promoted and no harness installation is changed.

## Resume and ownership

Repeat the identical command/output path to resume. prepare-state.json binds the
repository, original source SHA, version, date, branch, worktree, expected file hashes
and draft commit. State phases are advisory: the tool inspects live worktree content,
staged file contents, commit parent and changed files before proceeding. It accepts only the
original or planned version bytes during an interrupted edit. The completed draft
must contain exactly the planned edits, and its worktree must be clean.

Each pending version-file replacement has a persisted ownership receipt before its
exclusive temporary write. Resume removes only that recorded temporary file, even
if partially written; similarly named user files remain foreign and block progress.
Atomic state replacement preserves the previous state if a later write is interrupted.
If the process stops before the first ownership state is committed, no worktree edits
have begun; an unowned output directory is refused and requires inspection or a new
output path. Git failures during worktree creation likewise need inspection; the tool
never force-deletes a branch or worktree to make a retry pass.

Changed version/date/path, unrelated index/worktree edits, moved candidate history,
changed notes and corrupted artifacts fail while preserving data. Repeated successful
preparation reuses one commit and compares the same artifacts; it never bumps again.
[Artifact verification](release-artifacts.md) runs after extraction and needs no checkout.
Run one preparation per output at a time; conflicting Git locks/ref updates stop the
losing invocation rather than force changes.

Later intentional staging edits produce a new reviewed commit. Rebuild artifacts from
that exact commit into a new output and repeat all gates; do not rerun version preparation
against already-bumped source or reinterpret an old draft state as the new identity.

## Product evidence for an exact commit

Inspect the product gate without writing or running it:

```sh
node scripts/release-product.mjs --repo /path/to/candidate --sha FULL_COMMIT_SHA --out /path/to/new-evidence
```

Add `--execute` to run grey-matter's `check-repo.mjs --require-tools` or tkt's
`mise run check` in a clean checkout at that exact SHA. Install the candidate's
maintainer dependencies first; this command does not install or publish anything.
Evidence needs a new directory outside the checkout. Logs, hashes, exit/signal,
command, timestamps and the actual OS/architecture/Node version are recorded there.
A failed command or changed candidate produces failed evidence. Output is never
reused as proof: rerunning needs a new evidence path and executes checks again.

`--require-tools` makes the normally optional missing-tkt check fail. Native checks
remain a separate gate. Product success always retains `publishable: false` and
pending native, scope, compatibility and remaining-platform checks. This command
runs trusted repository check scripts with the maintainer's normal tool environment;
it is not a sandbox. Its Git context variables are cleared to keep checks in the
candidate repository. The separate install/upgrade probes use disposable homes.

## Native evidence for sealed bundles

```sh
node scripts/release-native.mjs --artifacts /path/to/bundles --out /path/to/new-evidence
```

The default verifies bundle structure and reports the native plan without launching
harnesses or creating the evidence output. `--execute` uses a fresh home/config and
workspace for each host. `--codex`, `--claude` and `--agy` select explicit binaries;
Claude must be at least 2.1.289. The tool records actual CLI versions, sealed asset
hashes, source SHA, probe-script hashes, commands/results and host details.

Codex installs the local bundle, checks each sealed file in the cache against its hash and
compares exact skill names through app-server `skills/list`. Claude runs the current
seeded probe on the extracted snapshot: manifests, exact flat components, an invalid
description and a removed README. Blocking directory findings and incomplete scans
fail even when the native response says success. Inline discovery must find the
expected count. Independent YAML parsing remains part of sealed-bundle verification.
AGY validates/installs its package, checks installed files against sealed hashes and
compares exact names and invocation policy through `/skills`; model turns must be zero.
These loading checks do not execute skill workflows or test previous-release upgrades.

Native subprocesses receive an environment allowlist with disposable configuration,
not inherited credentials. On macOS a network sandbox permits loopback only; other
platforms explicitly record network enforcement as unavailable. No model turn is
requested. The AGY read-only catalog uses a dummy key and an unreachable loopback
endpoint. Disposable homes are removed after completion or a handled failure; a hard
termination can leave a temporary directory for inspection. Evidence is written to
a new output directory outside the sealed artifacts; existing output is refused.
Failed rows retain their native output and stop further checks. Success remains
`publishable: false` with product, scope, compatibility, upgrade and other-platform
gates pending. This command does not refresh real user plugin installations.

## Current coverage and remaining gates

Isolated fixtures exercise dry-run byte preservation, skill/Cargo version surfaces,
comment/lock/notes handling, eight interrupted phases, real CLI termination, app-managed
worktrees, symlink/junction alias protection, paths with spaces, Git environment scoping,
foreign edits and corrupted artifacts. These are macOS results until actual Windows/Linux
runs exist. Product and native commands now exist. Fresh approved-candidate results, reviewed
scope/compatibility, full orchestration and platform validation remain pending. Ticket 67 stays open; 68–71 still own publication recovery,
upgrade probes, final audit and staged release artifacts.
