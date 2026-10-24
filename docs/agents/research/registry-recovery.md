# tkt registry recovery

Ticket 68 now includes `release-registry.mjs`: a read-only crates.io index adapter
and a reconciler with an injected publication operation. Six fixtures cover exact
version/checksum lookup, refusal to publish after lookup failures, completed-step replay
and uncertain uploads.
No live registry publication adapter or tkt CI connection is implemented yet.

## Contracts and warnings

| Contract | Source read | Con / warning |
| --- | --- | --- |
| Observe each tkt version in `https://index.crates.io/3/t/tkt`; compare `cksum` with the sealed `.crate` SHA-256 and inspect `yanked` | [Cargo index format](https://doc.rust-lang.org/cargo/reference/registry-index.html#index-files), [index schema](https://doc.rust-lang.org/cargo/reference/registry-index.html#json-schema) | The index checksum covers the crate archive, not a Git commit or plugin bundle. JSON fields differ from publish API and cargo metadata fields. |
| Require unique version identities, including build-metadata collisions | [Version uniqueness](https://doc.rust-lang.org/cargo/reference/registry-index.html#version-uniqueness) | An occupied version cannot be repaired by publishing different bytes under the same version. Yanked or mismatched bytes stop this workflow. |
| Reinspect after upload even when the command times out | [cargo publish](https://doc.rust-lang.org/cargo/commands/cargo-publish.html#description) | Cargo can time out while waiting for the index after the upload has succeeded. A command error does not prove absence. |
| Keep an attempted-publication receipt until the version is observed or a retry is explicitly chosen | [Sparse cache invalidation](https://doc.rust-lang.org/cargo/reference/registry-index.html#cache-invalidation) and the upload/index sequence above | CDN delay can hide a completed upload. A subsequent missing observation must not silently clear the attempted state. |
| Build and inspect the actual package before sealing its hash | [cargo package](https://doc.rust-lang.org/cargo/commands/cargo-package.html#description) | Cargo rewrites the manifest, includes VCS metadata and flattens symlinks. A successful unpacked build does not prove exclusions or source provenance. |

The existing tkt package index must return HTTP 200 and valid, unique entries.
Transport/HTTP errors, an empty body, malformed JSON and unexpected identities fail;
they never become permission to publish. Reads disable client caching and redirects.
An exact stable version missing from the validated index returns `phase: missing`.

## Caller obligations

Seal the actual crate bytes and version before reconciliation. The helper checks the
local hash before reading registry state. A matching, unyanked published checksum
completes the step without another publication. Changed bytes or a yanked version
stop without replacement or automatic unyanking.

Persist the `publication-attempted` observation with its version and checksum before
allowing the injected publisher to run. On resume, retain `previouslyAttempted` even
if a later index read is missing. That state blocks another upload unless
`retryUnconfirmed` is explicitly requested after inspection. The helper itself does
not own the durable ledger; the tkt CI integration must bind it to reviewed staging.

The default adapter only reads. A real publisher must package from the exact clean
candidate, prove those are the staged bytes, use the intended registry and credentials,
then verify the observed checksum. No code here reads tokens or uploads to crates.io.

## Live observations and package findings

[L1:verified] Read-only index probes found tkt 0.4.0 published and unyanked with
checksum `9faef2c9c8449c4c4501a81aeb6529734a8162fb11ab694b7874fdabe4d57590`;
0.5.0 was absent. These observations do not reserve that version.

[L1:verified] `cargo package --locked` on initial 0.5.0 candidate `8c40385` created and
rebuilt the crate, but archive inspection found tracked `.scratch/HANDOFF.md` inside.
The resulting binary also reported an unrelated parent-repository Git hash. These
are release blockers: tkt tickets 212 (package exclusions) and 213 (build identity).
The [recorded evidence](evidence/registry-initial-package-findings-20261023.json)
retains the exact archive hash and candidate SHA; the archive was never uploaded.
Regenerate the initial release draft after remediation and subsequent source changes.
