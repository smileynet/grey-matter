# Release artifact construction

Ticket 67 implementation, artifact layer. This builds plugin bundles from an exact
committed revision; candidate version preparation and final release gates remain
separate work. It does not bump versions, change a worktree, fetch/push refs, install
plugins, invoke a model, or call GitHub/crates.io. Output is local and explicit.

## Commands

Maintainers need Node 22+, Git and `npm ci --ignore-scripts` in grey-matter. From its
checkout, run:

```sh
node scripts/release-artifacts.mjs build --repo /path/to/repo --ref COMMIT --out /path/to/output
node scripts/release-artifacts.mjs verify --out /path/to/output
```

`build` writes an artifact directory, not a release candidate branch. It reads the
resolved Git commit even if the working checkout has different uncommitted bytes.
The commit must contain a supported pack and its deploy engine. `verify` uses an
isolated extraction directory and needs no source checkout. Both return structured
JSON: pass/0, known validation failure/1, unexpected operational error/2.

The directory contains three host tar.gz files, release-metadata.json and SHA256SUMS.
Metadata records the candidate SHA, version, tag name, skill count, per-file hashes
and executable bits, asset hashes and compatibility/verification status. The native
and platform fields remain `not-run`/empty until the candidate verification layer
supplies real evidence; structural verification is not a compatibility claim.
Checksums establish byte consistency, not signatures or source authenticity.

Repeated builds from the same inputs compare existing output to the reproducible
result and leave it intact. Different source/compatibility/asset bytes fail rather
than overwrite. Stale/corrupt assets, missing or unexpected files, wrong versions,
changed indexes and unresolved extracted Markdown links fail verification.

## Package closure

Each host bundle has a generated README with its version, source SHA, skill count,
local install commands and prerequisite guidance. Codex and Claude bundles retain source skill paths and their compatibility manifests
and catalogs. Required legal files and transitive Markdown resources are included.
AGY builds through the committed source's canonical deploy engine, preserving its
resource projection and flat names. `metadata.deploy.runtimeFiles` declares helper
files needed by commands or dynamic lookups that Markdown links cannot express.
The deploy engine exports its pack/resource logic for this shared construction path;
its CLI remains dependency-free and tkt vendors identical bytes.

Local Markdown links are transitive package inputs, even in research and ADRs.
Use pinned upstream links for development-ticket citations so the reference stays
available without drawing `.tickets/` into runtime bundles. Build a source-version
smoke bundle after documentation changes and before committing candidate versions;
link-existence checks alone do not verify package exclusions.

Only the computed resource set and manifests/catalogs enter source-layout bundles;
AGY's generated tree is checked in full. Development directories, environment files,
common credential filenames and non-regular files are rejected. Archives reject
absolute/traversing/ambiguous paths, links, duplicates and oversized entries before
extraction into a private temporary directory. Extracted bytes, executable modes
(on POSIX), identities, YAML types and resource links are rechecked. Git version
surfaces must agree; Cargo.toml and the root Cargo.lock package are parsed explicitly.
Windows executable-mode coverage is not claimed from these POSIX checks.

## Dependencies and source evidence

Pinned maintainer dependencies are yaml 2.9.1, tar 7.5.22 and smol-toml 1.9.1.
They are not bundled into plugins or added to the standalone deploy engine.

Read 2026-10-23:

- [Git archive](https://git-scm.com/docs/git-archive): commit/tree inputs and archive
  behavior. Builds resolve a commit first; they never archive the mutable worktree.
- [node-tar creation/options](https://github.com/isaacs/node-tar#tarcreateoptions-filelist-callback):
  portable metadata, noMtime and sorted explicit file lists support reproducibility.
- [node-tar security guidance](https://github.com/isaacs/node-tar#security-information):
  extract only in private directories, reject links, bound expansion and retain strict
  warnings. Archive-library hardening does not make untrusted output directories safe.
- [smol-toml usage and caveats](https://github.com/squirrelchat/smol-toml#usage): parse
  tables instead of using a hand-written TOML scanner. Only string version fields are
  consumed; integer/date round-trip caveats do not affect this check.

A seeded stale-root-version fixture showed that cargo metadata --no-deps --locked
alone did not detect that mismatch. The explicit Cargo.lock check now rejects it.
Offline fixtures also prove immutable input, output reuse, missing/corrupt resources,
notice retention, file exclusions and resealed archive defect detection.

## Source-bundle smoke evidence

[Six isolated native artifact checks](research/evidence/artifact-conformance-20261023.json)
passed for bundles built from grey-matter `932e441` (0.1.0) and tkt `f2445dc`
(0.4.0), without bumping either version. Codex 0.147.0 installed/discovered 44/4
skills and byte-matched every extracted bundle file against its cache. Claude
2.1.309 validated manifests and exact components and discovered 44/4 skills.
AGY 1.4.6 validated/installed both extracted packages with exact flat names and
matching invocation flags. Disposable homes, workspaces and loopback-only macOS
network sandboxes were used; no real model turns or inherited credentials.

These are source-version smoke bundles, not approved new release candidates.
The evidence records each asset hash; local output under `.scratch/` is disposable.
Regenerate from the recorded source SHA with the command above. Full candidate
preparation, previous-release upgrades and Windows/Linux coverage remain required.
The first smoke pass exposed README_MISSING with blocking=true even though Claude
returned success=true. Both bundles now include a README; the source native probe
rejects blocking directory findings and proves detection by removing the README in
its private snapshot. The final six rows are clean of blocking directory findings;
nonblocking icon advice remains for ticket 71. Initial findings and new controls are
retained alongside the final evidence.

The sealed build metadata still declares native verification `not-run`; these
external smoke results do not retroactively change its recorded build status.
