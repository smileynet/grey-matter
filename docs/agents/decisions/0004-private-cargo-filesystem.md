# ADR-0004: Hold private source and output backing through Cargo publication

**Status:** accepted for implementation; actual tkt/lifecycle verification pending
**Date:** 2026-10-23
**Deciders:** maintainer authorized release tooling; agent selected this implementation

A normal read-only bind still follows host writes, and a checksum gate needs to
protect the same open output inode until Cargo reads its HTTP body. Reconstruct a
verified standalone candidate and Git metadata through sealed input FDs and private
read-only data mounts; keep Cargo home, target and scratch in private writable
filesystems throughout preflight, intent and publish. Run as the toolchain owner
with capabilities dropped, fixed configuration/invocation and no credential during
preparation. This makes publication Linux-specific and requires bounded snapshots
and explicit process cleanup. It trusts the runtime and excludes hostile root,
ptrace and namespace entry; copied backing files do not inherit memfd seals.
[Source audit](../research/cargo-immutable-source-mount-audit.md) and
[Linux capture/negative control](../research/cargo-private-mount-probe.md) establish
the mechanism. A writable or ordinary-bind fallback would lose that boundary, so
unsupported setup fails before the intent/credential step. This decision authorizes
no publication.
