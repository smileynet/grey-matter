# Prepared Cargo transport integration

Date: 2026-10-23. Status: tested component; production CI integration remains open.

## Findings and evidence

[L1:verified] [Run 40065935400](https://github.com/smileynet/grey-matter/actions/runs/40065935400)
at `4162afa3d9389717bf63bb0c0e8548532a43cf2b` passed all six Linux integration
cases. The downloaded structured results and logs were read. The
[recorded evidence](evidence/cargo-prepared-transport-20261023.json) retains exact
results, source hashes, run/job/artifact identities and the API artifact digest.
The ZIP digest was not independently verified.

The prepared adapter seals source, Git directories, configuration, helpers and
registry inputs before requesting a credential. It packages and checks the crate
inside the same private filesystem used for upload. A coordinated mock records
and reads back intent before allowing the credential callback. Cancellation and a
wrong seal produce no callback or upload. The localhost probe refuses non-dummy
credentials. Replay produces no second preparation, credential callback or upload.

[L1:verified] Actual tkt source `640acb4ad078b13f1719a8323d93b176897b48ce`
(version 0.4.0) produces a 119,647-byte crate with SHA-256
`a5169e904f8c7b35d30805898103d3ab9d0616406851141855ece350c590c098`.
Its independent seal, private preflight and captured upload agree after original
source, README, Git HEAD and old output mutations. README metadata also retains
its independently checked hash. This tests real dependencies and packaging, not
the final 0.5.0 candidate.

## Corrections established by the probes

Two earlier hosted attempts failed before credential release. Run 40064293020
exposed bubblewrap 0.6.1 argument-file handling: options belong in the FD, but the
command remains on argv. Run 40065031711 passed five cases before actual tkt
exposed missing empty Git directories in the reconstructed tree. Preserving
empty directories and modes fixed the failure; regression fixtures now cover it.

## Reproduction and limits

The [manual Linux workflow](../../../.github/workflows/cargo-boundary-probe.yml)
runs [the integration harness](../../../scripts/release-cargo-upload.integration.mjs)
with pinned Cargo/rustc 1.99.1, Node 22 and bubblewrap. All registry traffic targets
a localhost mock; GitHub/stable operations in coordinated cases are synthetic.
No production credential, release, tag, crate or stable promotion is exercised.

This component does not complete the review-bound sole CI publisher or local
dispatch/observer. Explicit close is tested; runner-loss cleanup needs separate
verification. Trusted runtime/OS assumptions remain; no hostile-root, ptrace or
network egress-filter protection is claimed. Final candidate/platform/install
verification and integrated independent review remain required by ticket 68 and
the [review sequence](../proposals/09-release-readiness.md#review-order-and-evidence-reuse).

## Sources

- [L1:verified] Hosted run and recorded evidence linked above.
- [L2:verified] [Cargo registries](https://doc.rust-lang.org/cargo/reference/registries.html)
  and [configuration](https://doc.rust-lang.org/cargo/reference/config.html), read
  during implementation; registry identity and credential/config boundaries.
- [L1:verified] [bubblewrap 0.6.1 source](https://github.com/containers/bubblewrap/blob/v0.6.1/bubblewrap.c),
  argument-file parsing and command handling read to diagnose the failed probe.
- [Exact Cargo contract](cargo-publish-source-contract.md),
  [private-mount probe](cargo-private-mount-probe.md),
  [checksum ADR](../decisions/0003-cargo-checksum-authorization.md) and
  [filesystem ADR](../decisions/0004-private-cargo-filesystem.md) retain the
  supporting source analysis and trust boundaries.
