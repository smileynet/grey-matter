---
topic: Cargo checksum authorization inside private source and output mounts
date: 2026-10-23
status: complete
confidence: medium
---

# Cargo private-mount execution probe

## Summary

The dependency-free Linux fixture preserves its source and Git identity while the
host changes the original checkout and old output. Cargo 1.99.1 then sends exactly
the independently sealed crate bytes to a refusing localhost registry. This proves
the tested mechanism; actual tkt dependencies and the production publication
lifecycle remain unverified.

## Sources

- [L1:verified] [Successful run 40062286350](https://github.com/smileynet/grey-matter/actions/runs/40062286350)
  at `45f11d07c4ca604e0445dacb8c057eb518a21f69` — both probe steps passed;
  downloaded JSON results and job logs were read, rather than relying on the job status.
- [L1:verified] [Recorded evidence](evidence/cargo-private-mount-20261023.json) — exact
  results, file hashes, source hashes, run/attempt/job/artifact identity and API digest.
  The API digest identifies the retained Actions ZIP; this report hashes the
  downloaded result files and does not claim an independent ZIP digest check.
- [L1:verified] [Root execution failure](https://github.com/smileynet/grey-matter/actions/runs/40062087705)
  at `11859adcc133b7d890aa75fffba2ea678c698d90` — retained traceback identifies
  toolchain traversal permission failure before the inner Cargo process starts.
- [Private-mount source audit](cargo-immutable-source-mount-audit.md) and
  [exact Cargo source audit](cargo-publish-source-contract-audit.md) — separately
  checked source arguments; these reports define the limits of the runtime claim.

## Findings

[L1:verified] Both successful modes ran as UID 1001 on Ubuntu 22.04, kernel
`6.8.0-1064-azure`, bubblewrap `0.6.1` (package `0.6.1-1ubuntu0.3`).
Cargo was `1.99.1 (5f94df478 2026-08-27)`. The launcher drops all capabilities,
isolates mount/PID/IPC/UTS namespaces and reconstructs source from sealed inputs.

| Mode | Sealed input files | Host mutation operations | Denied child source operations | Captured PUTs |
| --- | ---: | ---: | ---: | ---: |
| Filesystem control | 31 | 7 | 6 | 0 |
| Cargo/provider capture | 45 | 9 | 6 | 1 |

[L1:verified] The Cargo mode packages the original clean fixture outside the
boundary to establish an independent seal. Inside one boundary, it reconstructs
the source/Git tree, mounts the provider policy and Cargo configuration read-only,
packages into a private writable target and checks that package against the seal.
Only then does it signal the host to mutate the original paths. The host rewrites,
replaces, renames and adds files, changes Git HEAD and Rust source, and corrupts the
old crate output. The child retains the same complete source inventory and Git SHA.
The ordinary read-only bind follows host rewrites, demonstrating why that control
alone is insufficient. The private target remains unchanged and writable.

[L1:verified] Child rewrite, create, rename, unlink, chmod and Git-HEAD writes all
fail with `EROFS`. Every input memfd rejects write, shrink and grow after all four
seals are verified. Mountinfo records read-only source mounts over deleted private
backing files; the copied backing files do not inherit memfd seals.

[L1:verified] Supported `cargo publish --registry probe --locked --no-verify`
repackages within the same boundary. Its fixed credential provider authorizes the
new package checksum against the sealed policy. The one captured crate is 872
bytes, SHA-256
`4b9fb6701ee40ae695187c548ab83f4cdabdc86357d7b4170bc0f0fe0faea951`,
matching the outside seal, private preflight and post-publish package. The dummy
authorization matches. The server deliberately returns HTTP 400; Cargo exit 101
is expected and is checked alongside the PUT count and byte equality.

[L1:verified] The initial root invocation failed because the capability-free
namespace could not traverse the runner-owned toolchain path. Running as that
ordinary owner fixed the failure while retaining the same restrictions. No
capability was restored and no writable source mount was added.

## Related tools and reproduction

[Executable probe](examples/cargo-private-mount.py) and
[manual workflow](../../../.github/workflows/cargo-boundary-probe.yml) contain the
exact test. Run on Linux as the toolchain owner with unprivileged user namespaces:

```sh
python3 docs/agents/research/examples/cargo-private-mount.py
env PROBE_CARGO="$(rustup which cargo)" PROBE_RUSTC="$(rustup which rustc)" \
  PROBE_NODE="$(command -v node)" \
  python3 docs/agents/research/examples/cargo-private-mount.py --cargo
```

Use Cargo 1.99.1, Node and bubblewrap; no real credential is accepted as an input.
All fixture trees are disposable. The workflow retains structured result files.
The separate [credential refusal probe](cargo-credential-checksum-probe.md) covers
wrong identities/checksums and the deliberately demonstrated CLI-token bypass.

## Related topics and open questions

- Actual tkt packaging/dependencies, reviewed candidate/seal binding and bounded
  input/cache inventories still need the production adapter's integration tests.
- The durable intent barrier, delayed token availability, override rejection,
  cancellation and runner-loss cleanup remain separate lifecycle requirements.
- This is not a hostile-root, ptrace, process-replacement or mount-namespace-entry
  defense. Runtime/toolchain files remain trusted through a read-only host-root
  bind. Networking is shared; no OS egress filter is claimed.
- No production adapter, real registry publication, GitHub release, tag push or
  stable promotion ran. Ticket 68 remains in progress.
