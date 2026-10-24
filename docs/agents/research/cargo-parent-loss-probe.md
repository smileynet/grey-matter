# Cargo parent-loss cleanup

Date: 2026-10-23. Status: Linux component verified; integrated review pending.

## Result

[L1:verified] [Run 40070114004](https://github.com/smileynet/grey-matter/actions/runs/40070114004)
at `309a739b626fc1c24d932e97a40c25f00d64fc87` passes both parent-loss cases.
The downloaded result JSON and logs were read. The
[durable evidence](evidence/cargo-parent-loss-20261023.json) records source/result
hashes, raw failed and successful observations, and artifact/job identity. The
artifact digest is API-reported; no independent ZIP digest check is claimed.

| Parent killed | Stopped descendants | Host staging removed before intent | Credential callbacks | Localhost PUTs |
| --- | ---: | --- | ---: | ---: |
| After preparation, before intent | 4 | Yes | 0 | 0 |
| During a held upload | 5 | Yes | 1 | 1 |

The upload capture matches the independently sealed fixture crate and uses only
the fixed dummy credential. Its response is deliberately held until the parent is
killed. This remains an **unconfirmed upload outcome**, not proof that publication
failed or permission to retry. Registry/GitHub recovery and durable intent are
covered separately by the coordinator fixtures.

The observer identifies descendant PIDs/start times, kills the disposable Node
parent with SIGKILL, and requires those processes to stop within a 15-second
observation deadline. It watches the host temporary directory so it can also
require removal before the adapter returns its prepared boundary. No production
registry, credential, GitHub release, tag push or stable promotion is exercised.

## Failure and correction sequence

- [L1:verified] Run 40068935783 stopped all four descendants before intent and
  requested no credential/upload, but left the host temporary tree behind.
- [L1:verified] A SIGTERM handler that unwinds Python contexts corrected that
  before-intent case in run 40069175062. During upload, all five descendants still
  stopped, but the host tree remained. The probe stopped on its cleanup assertion.
- [L1:verified] Run 40069712173 added process/directory diagnostics. The template
  directory had been removed while candidate/cache/helper directories remained.
  Cleanup had begun but was incomplete; the processes were already reaped, so the
  observations do not establish the precise terminating signal or exception.
- [L1:verified] The final implementation removes the host staging tree after the
  private preflight verifies sealed, materialized inputs and before returning
  prepared. Nothing after that boundary needs those host copies. Run 40070114004
  verifies this stronger requirement in both cases. SIGTERM context unwinding
  remains for earlier preparation; arbitrary hard termination during preparation
  is not covered by these two cases.

The same successful run passes all six existing prepared-transport cases, including
actual tkt 0.4.0 source and intent/credential/replay integration. It retains the
mutation controls and exact byte comparison. This is not final 0.5.0 candidate
proof, Windows support for the Linux-only adapter, or protection from hostile root,
ptrace or namespace entry. Trusted runtime and registry-observation limits remain.

## Reproduction and related evidence

[Lifecycle probe](../../../scripts/release-cargo-lifecycle.integration.mjs) and
[manual workflow](../../../.github/workflows/cargo-boundary-probe.yml) run as the
ordinary Ubuntu toolchain owner using Cargo/rustc 1.99.1, Node 22 and bubblewrap
0.6.1. The workflow uses contents:read and only its localhost mock accepts PUTs.
The probe removes its own disposable fixture trees on exit.

See the [prepared transport report](cargo-prepared-transport-probe.md),
[private filesystem decision](../decisions/0004-private-cargo-filesystem.md),
[exact Cargo source contract](cargo-publish-source-contract.md) and
[ticket 68](https://github.com/smileynet/grey-matter/blob/153dad4e0cbe663ab27cad339ff72fc3dcbea68e/.tickets/68-release-publication.md). The next gate is one
independent review of the integrated publication/recovery path, before candidate
rebuilding and installation/audit/staging work.
