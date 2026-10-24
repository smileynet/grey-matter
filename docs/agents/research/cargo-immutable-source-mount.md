# Immutable source snapshot through bubblewrap data mounts

Date: 2026-10-23. Research only. No tools installed, runner execution or registry calls. Read the existing Cargo transport and read-only-boundary research first.

## Answer

[L4:inferred] Yes for concurrent writers changing the **original checkout**: capture verified bytes into sealed memfds, then construct a separate complete source tree with `--ro-bind-data`. Cargo must read only that tree. Host changes to the old checkout then have no shared source inode to modify. This is a credible implementation candidate, not executed evidence or a general defense against a hostile host process with ptrace/root privileges.

[L1:verified, source inspection] In bubblewrap **v0.6.1**, `SETUP_MAKE_RO_BIND_FILE` creates a temporary file, copies the FD contents into it, closes the input FD, read-only bind-mounts that temporary file at the destination, and unlinks its temporary name. Thus `--ro-bind-data` **copies** a memfd; it does not retain the memfd inode or its seals. The resulting source protection is private backing plus read-only mounts, not inherited memfd seals. [Versioned source, lines 1297–1332](https://github.com/containers/bubblewrap/blob/v0.6.1/bubblewrap.c#L1297-L1332).

## Implementable contract

1. A trusted Linux launcher receives the reviewed candidate SHA, complete source inventory and file hashes. Materialize a standalone candidate including complete `.git` metadata. Reject external gitdirs, alternates, submodules, escaping symlinks and package/config inputs outside the inventory. Verify bytes against candidate identity; merely hashing a concurrently changing checkout produces no coherent Git snapshot.
2. For each regular file, create `memfd_create(MFD_ALLOW_SEALING)`, write the exact verified bytes, set the intended mode, then add `F_SEAL_WRITE | F_SEAL_GROW | F_SEAL_SHRINK | F_SEAL_SEAL`. Require `F_GET_SEALS` to confirm every bit. Hash **after sealing** and compare the reviewed inventory. No writable shared mapping may remain. Do not substitute `F_SEAL_FUTURE_WRITE`: existing mappings remain writable. [Linux sealing contract](https://man7.org/linux/man-pages/man2/F_GET_SEALS.2const.html).
3. Preserve each FD across the bubblewrap exec explicitly; close unrelated FDs. Set each read offset to zero and ensure no other holder can change a shared open-file-description offset during copying. `MFD_CLOEXEC` requires deliberate clearing or descriptor duplication for this handoff. Account for per-process FD limits and memory consumption; fail before credentials rather than silently batching into host files. [memfd lifecycle and exec semantics](https://man7.org/linux/man-pages/man2/memfd_create.2.html).
4. Construct `/candidate` as a **new private tmpfs**, never a bind of the original checkout. Create inventory directories, copy each regular file with `--perms MODE --ro-bind-data FD /candidate/PATH`, and recreate only validated in-tree symlinks using `--symlink`. Finally `--remount-ro /candidate` to prevent adding/removing/renaming directory entries; individual data mounts are already read-only. Never add writable mounts below it. `--args FD` can carry NUL-separated arguments when the tree exceeds ordinary argv limits. These options exist in the versioned manual. [Bubblewrap v0.6.1 manual](https://raw.githubusercontent.com/containers/bubblewrap/v0.6.1/bwrap.xml).
5. Inside the same boundary, verify the complete mounted inventory, modes, symlinks, candidate Git SHA/clean state and pinned toolchain before packaging. Use private external writable target/cache/tmp mounts. Keep `.git` read-only, disable optional Git locks, and test Cargo/libgit2 compatibility rather than weakening source protection. The package comparison, durable intent barrier and publish invocation must share this snapshot and lifecycle. Input file descriptors need not remain alive after bubblewrap has copied them; the mount owns the destination lifetime.
6. Preflight with the exact final Cargo configuration and invocation, compare the produced crate to the independently retained seal, then invoke supported Cargo publish with the same source/toolchain/options. Keep the contract that Cargo repackages; this mechanism does not turn Cargo into an existing-crate uploader. Actual tkt equality and a concurrent mutation capture test remain required before adopting the transport.

## Constraints and warnings

| Constraint | Consequence |
| --- | --- |
| Private data mounts copy rather than bind sealed inodes | Do not claim the destination is kernel-sealed. The versioned source explicitly shows a new temporary backing file. |
| Read-only files alone leave directory metadata mutable | Freeze the private parent tmpfs too; reject later writable descendants. |
| Source tree captured before sealing can race | Bind every final sealed byte to a reviewed Git/object inventory and verify the mounted result. Reject any discrepancy before intent/upload. |
| Memfds are anonymous volatile files, not a tree filesystem | One FD/file and explicit directory/symlink reconstruction; size/FD limits must fail closed. |
| Same-user host attacker can inspect processes or exploit shared mutable state | This is not a hostile-host sandbox. Exclude ptrace, process replacement, mount-namespace entry and root. Kernel seals protect their inode, not launcher code, FD offsets or the copied destination. |
| Host filesystem/toolchain/config can still change if read from ordinary binds | Pin and verify controlled configuration and trusted runtime; original checkout changes alone are the tested threat. Avoid exposing the original checkout as an alternate package/config path. |

The upstream README explicitly makes isolation depend on supplied policy, rather than treating bubblewrap alone as a complete sandbox. [Upstream sandboxing warning](https://github.com/containers/bubblewrap/blob/main/README.md#sandboxing).

## Required harmless Linux probe

Use an explicit Ubuntu VM runner and pinned available bubblewrap, no production credentials. Record kernel, namespaces, version and mountinfo. First prove memfd writes/truncation fail after all seals; prove Cargo descendants cannot rewrite files or create/delete/rename entries in `/candidate`, while target/cache writes succeed. While paused between successful package comparison and publish, a host helper must rewrite, replace, rename and add files in the **original checkout**, including `.git/HEAD`; require the mounted inventory and Git identity remain unchanged. Run the localhost mock capture with a dummy named registry and require exactly one PUT whose extracted crate hash equals the seal. Namespace failure, missing seals, incomplete tree or hash mismatch must yield zero PUTs. Include a deliberately ordinary-ro-bind negative control whose contents follow host mutation, so the fixture proves the distinction. Then repeat with actual tkt inputs/dependencies and the final command shape.

## Unresolved claims / coverage

- Source/manual semantics: fully checked against v0.6.1 and Linux manuals; no execution claim.
- v0.6.1 compatibility with the actual runner package/kernel, mount count/FD limits and Cargo Git behavior: unverified.
- Exact tkt packaging equality in this reconstructed tree and pre-upload invariance: unverified; mock execution is mandatory.
- Protection against arbitrary privileged or process-controlling host writers: not provided by this design.
- Runtime/toolchain/dependency immutability and the durable coordinator integration remain separate obligations.
