# Read a reviewed CI stage

`release-ci-artifacts.mjs` reads tkt's staged files from their exact GitHub artifact
ID and verifies the reviewed byte seals. It downloads and decodes the ZIP in
memory, returning asset buffers without extracting or rebuilding them. The original `tkt-stage.json` bytes are
retained as a release asset alongside the plugin and CI assets. It performs
only GET requests and does not grant publication approval.

The expected record must come from the later pinned review commit, not a mutable
working file or newly downloaded seal. The tkt staging entry requires `ci: {file,
sha256}` pointing to that committed record. `readStagedTktCandidate` reads it at the
pinned review SHA, checks product/repository/version/candidate identity, then calls
`readCiStage`. The record contains:

- `repository`, numeric `repositoryId`, `workflowId` and exact `candidateSha`;
- product `version`, numeric `runId`, `runAttempt` and `sealJobId`;
- numeric `artifactId` and `zipSize`, plus `zipSha256` and `sealSha256`.

Pass it to `readCiStage({expected, api: githubActionsReadApi()})`. The API adapter
uses authenticated `gh api` GETs, paginates artifact/job collections and downloads
the ZIP by ID. It captures log and ZIP bytes with `--allow-escape-sequences`;
those raw bytes are processed internally, never printed to the terminal.

The reader requires the latest run and specified attempt to match the reviewed
repository, workflow, commit and successful state. Every returned job must have
succeeded. The exact seal job's log must identify the complete artifact ID and
uploaded digest. Artifact metadata must match the ID/name/run/repository/digest,
remain unexpired, and have the reviewed ZIP size. The reader rechecks remote
state after download. A newer attempt invalidates this review; re-stage and review
rather than silently selecting its files.

The ZIP must match its external digest before decoding. The pinned `yauzl` 3.4.0
reader validates filename syntax and entry sizes; additional checks reject paths,
case collisions, duplicate names, nonregular entries, encryption and excess size.
Limits are 128 files, 128 MiB per entry and 512 MiB total/archive bytes. The stage
JSON must match its separately reviewed hash, candidate and run identity. Every
listed file must match its size/hash, with no missing or extra members and a
source crate for the selected version.

These checks trust GitHub and the reviewed workflow/runner. They bind observed
bytes and execution records, not an independent compiler attestation or human
approval. Failed/expired reads establish no provenance and never trigger a rebuild.

[Source-version smoke evidence](research/evidence/ci-stage-smoke-20261023.json)
records the successful five-platform run and a live read through this adapter.
It is not approved-version install/upgrade evidence. [Attempt research](research/ci-staging-and-registry-intent.md)
explains why names/run IDs alone are insufficient. The private maintainer dependency
and lockfiles pin the ZIP reader in both repos; see its [API and safety options](https://github.com/thejoshwolfe/yauzl).

The combined inventory rejects names that collide, including case differences.
Plugin `SHA256SUMS` and cargo-dist `sha256.sum` keep their original bytes and scopes;
the former covers plugin bundles/metadata, the latter cargo-dist outputs. The
reviewed CI ZIP/seal binds the full native inventory. No combined checksum file is
silently regenerated. The publication entry point still needs to connect this
reader to the sole CI publisher and prepared Cargo transport.
