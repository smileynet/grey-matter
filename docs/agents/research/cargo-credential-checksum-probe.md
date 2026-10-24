# Cargo credential checksum gate: executed probe

Consumed by: [ADR-0003](../decisions/0003-cargo-checksum-authorization.md).

Checked 2026-10-23 on macOS arm64 with Cargo 1.99.1 and Node 24.14.1.
This implements and tests the credential-provider component of ticket 68. The
production transport, private filesystem boundary and sole CI publisher remain
unfinished. No real registry publication occurred.

## Component contract

`scripts/release-cargo-credentials.mjs` reads a seal policy and token from the
launcher's private environment. It accepts protocol-v1 read/publish requests only
for the policy's exact registry index. Publish authorization also requires the
exact crate name, stable version and archive checksum. Successful credential replies use
`cache: never` and `operation_independent: false`. Refusals use fatal `other`,
so Cargo must not fall through to another credential provider.

The policy must be immutable and independently bound to the reviewed seal. The
provider trusts Cargo's reported checksum; it does not freeze the archive inode.
The future wrapper must also prohibit `--token`, ambient token sources, provider
fallback and configuration overrides. A provider alone is insufficient.

Source contracts: [official provider protocol](https://doc.rust-lang.org/cargo/reference/credential-provider-protocol.html),
[authentication configuration](https://doc.rust-lang.org/cargo/reference/registry-authentication.html),
[independently audited exact Cargo source](cargo-publish-source-contract-audit.md).

## Real Cargo results

Evidence: [reproducible localhost probe](examples/cargo-credential-checksum.mjs) and
[captured results](evidence/cargo-credential-checksum-20261023.json).

| Case | Captured PUTs | Result |
| --- | ---: | --- |
| Matching seal | 1 | Uploaded crate hash equals the independently packaged seal. |
| Wrong checksum | 0 | Fatal provider refusal. |
| Wrong name | 0 | Fatal provider refusal. |
| Wrong version | 0 | Fatal provider refusal. |
| Wrong registry | 0 | Fatal provider refusal. |
| Changed source, deliberately allowed dirty | 0 | Fresh package checksum differs; provider refuses. |
| CLI-token bypass negative control | 1 | Different crate bytes reach the mock, proving the required wrapper restriction. |

[L1:verified] The two captured requests used only the dummy credential and the
localhost mock deliberately returned HTTP 400 without forwarding anything. Cargo
exited 101 in all seven cases: expected refusal explains the matching-upload case,
so exit code alone is not the pass/fail signal. The probe checks request counts,
archive hashes and named diagnostics. Captures retain the provider-source and native launcher source/binary hashes.
Provider-source drift during a probe fails the run.

[L1:verified] Six Node fixtures additionally cover the protocol handshake before
stdin closes, invalid policy/request types, credential/cache controls, malformed or
oversized JSON, error redaction and argument overrides. The provider is self-contained
and vendored into tkt through the owned release-tool inventory.

## Invocation surprise

[L1:verified] Configuring `[node, script]` as the provider caused Cargo to invoke
Node with `--cargo-plugin` before the script. Node rejected the option before the
handshake. Cargo puts configured extra arguments into request JSON; they are not
an executable-prefix mechanism. The probe compiles a small dependency-free Rust
launcher that starts the fixed Node executable/script and then forwards Cargo's
arguments. The launcher passes arguments directly without a shell. Production integration
must preserve this distinction. The protocol documents Cargo's `--cargo-plugin`
argument and request `args`; the failed and corrected invocation were observed.

## Coverage limits

This dependency-free fixture uses an allowlisted environment, isolated Cargo home,
loopback registry and a package publish allowlist containing only that registry.
It does not install an OS egress filter. It does not test a hostile host, source or
output-inode immutability, real tkt dependency resolution, token-override rejection
by a production wrapper, or publication/recovery integration. Those remain release
gates. See [private-source requirements](cargo-immutable-source-mount-audit.md).
