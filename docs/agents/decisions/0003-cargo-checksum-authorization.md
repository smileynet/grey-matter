# ADR-0003: Authorize Cargo's newly packaged checksum before upload

**Status:** accepted for implementation; adapter/CI integration verification pending
**Date:** 2026-10-23
**Deciders:** maintainer authorized release tooling; agent selected this implementation

Cargo publish repackages source and offers no existing-crate upload flag. Use its
supported credential-provider protocol to release a token only when the freshly
packaged name, version, checksum and registry match the independent reviewed seal.
Never cache operation-independent credentials or permit token/config overrides or
provider fallback. A post-upload checksum check cannot prevent sending wrong bytes;
a custom HTTP uploader would replace Cargo's supported transport with another
protocol implementation. [Exact-source audit](../research/cargo-publish-source-contract-audit.md)
and [real-Cargo refusal controls](../research/cargo-credential-checksum-probe.md)
support this choice. The private-file requirement is separate in
[ADR-0004](0004-private-cargo-filesystem.md). Reproduction during this guarded Cargo
transport does not replace or reseal reviewed artifacts; the original seal remains
the authority. This decision authorizes no publication.
