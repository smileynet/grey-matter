# Cargo source write boundary on Ubuntu 22.04

Date: 2026-10-23. Research only; no installation, runner dispatch, publication or boundary execution. Scope: [existing transport requirements](cargo-sealed-transport.md) (repository path: `docs/agents/research/cargo-sealed-transport.md`).

Execution follow-up: the later [private data-mount probe](cargo-private-mount-probe.md)
passes a Linux/Cargo fixture and demonstrates the ordinary-bind limitation. The
unexecuted labels below describe this earlier proposal, not the current fixture status.

## Finding

[L4:verified] Bubblewrap provides a supported read-only bind mount and separate writable mounts in a private mount namespace. [Version 0.6.1 manual](https://raw.githubusercontent.com/containers/bubblewrap/v0.6.1/bwrap.xml) documents these options. [L4:verified] Its maintainers explicitly say policy depends on the arguments and that it is not a complete sandbox; it disables privilege escalation through setuid execution. [Upstream README](https://github.com/containers/bubblewrap/blob/main/README.md).

[L4:verified] A read-only bind constrains access through that mount, not writes through another mount of the underlying filesystem. [Linux mount(2)](https://man7.org/linux/man-pages/man2/mount.2.html). [L4:verified] Mount namespaces isolate mount views, not file content. [Linux mount_namespaces(7)](https://man7.org/linux/man-pages/man7/mount_namespaces.7.html).

[L4:inferred] Therefore bubblewrap is the smallest useful mechanism for preventing Cargo and its descendants from changing source during both preflight and publish. It does **not** freeze a checkout against a concurrent host-side writer. A boundary claim must explicitly trust the host orchestration and exclude concurrent host writers. If acceptance requires protection against arbitrary host writes, this proposal alone fails; use a genuinely immutable source backing image or another stronger ownership boundary and test that separately.

## Minimal command shape

Prerequisites: dedicated standalone checkout with a real `.git` directory (no linked worktree, alternates, external gitdir or submodules); candidate checked out detached; all packaged inputs inside this tree; private writable target and Cargo-home directories outside it; dependencies/configuration prepared; pinned absolute Cargo/toolchain. Paths below are canonical absolute paths and writable roots must contain no source hardlinks or aliases. No Cargo credentials in checkout.

```bash
bwrap --unshare-user --unshare-pid --unshare-ipc --unshare-uts \
  --die-with-parent --new-session --cap-drop ALL \
  --ro-bind / / \
  --proc /proc --dev /dev --tmpfs /tmp \
  --bind "$publish_target" /publish-target \
  --bind "$publish_cargo_home" /publish-cargo-home \
  --setenv CARGO_HOME /publish-cargo-home \
  --setenv CARGO_TARGET_DIR /publish-target \
  --setenv CARGO_INCREMENTAL 0 \
  --chdir "$candidate_checkout" \
  /bin/bash --noprofile --norc /path/to/trusted-preflight-and-publish.sh
```

[L4:inferred] Reusing the host root read-only keeps absolute toolchain paths and checkout Git identity intact while the two explicit overrides permit Cargo caches/locks and package output. `/tmp` is private scratch. Both commands and their comparison must run within this **one** invocation; returning to the host between them needlessly reintroduces a boundary transition. Network is intentionally shared for registry transport. This is a source-write boundary, not an egress or credential sandbox. The script must use controlled configuration/environment and scrub unrelated credentials/proxies separately.

Trusted inner script requirements (design, not an executed implementation): assert exact `git rev-parse HEAD` equals candidate SHA; require clean tracked/untracked package inputs, preserve `.git` throughout, assert pinned `cargo -Vv`; run package/preflight with the final registry/configuration and external target; compare the package to the independently retained seal; only then enter the durable publication-attempt barrier and invoke the same pinned Cargo publish with `--locked --no-verify` and no `--allow-dirty`. Retain package `.cargo_vcs_info.json` and its SHA as evidence. Read-only `.git` may prevent optional index refresh writes; configure `GIT_OPTIONAL_LOCKS=0` if needed and test Cargo's libgit2 behavior on the actual fixture. Never “fix” this by mounting `.git` writable.

## Runner restrictions and failure conditions

[L4:verified] GitHub lists `ubuntu-22.04` as a VM runner and documents passwordless sudo; `ubuntu-slim` is an unprivileged container with mounting restrictions. [GitHub hosted runner reference](https://docs.github.com/en/actions/reference/runners/github-hosted-runners). Scope this experiment to explicit `runs-on: ubuntu-22.04`, no job container. This documentation is not evidence that a particular runner image currently permits unprivileged user namespaces or has bubblewrap installed.

Fail closed before credentials/upload if bubblewrap is unavailable, namespace setup is denied, required options fail, source writes succeed, source/Git identity differs, package differs from seal, required paths escape the checkout, or any unexpected writable mount/alias exists. Do not use `--unshare-user-try` or retry without the boundary. Record runner image/kernel, bubblewrap version/package, user namespace policy, mountinfo, toolchain full version, invocation/config hashes, hashes of source manifest and package, and Git SHA. Existing sourced shell hooks or inherited open writable source FDs must not enter the inner process; launch from a controlled shell with no such FDs.

[L4:inferred] The command deliberately grants no writable host root or home and no host `/proc`; however shared networking and host services remain outside this filesystem claim. Host root/sudo or same-user processes retaining checkout access can still invalidate the source backing tree. Treat untrusted prior workflow steps/background processes as a failed precondition, not as covered threats.

## Harmless runner probe plan

Use the existing disposable dependency-free fixture and localhost mock design, an empty Cargo home, dummy token, probe-only package allowlist, and no real registry credentials. For a physically egress-isolated test, create a dedicated network namespace with loopback enabled and run both mock and boundary inside it; do not assume bubblewrap shared networking enforces loopback-only. No real publication.

1. Baseline: record detached candidate SHA and clean state, package, seal, then run boundary preflight plus mock publish. Require one captured PUT and exact extracted archive hash equality; preserve Git metadata and source hash before/after.
2. Before the transport step, attempt source rewrite, create, rename, unlink, chmod, `.git/HEAD` rewrite, and writes through symlink/absolute source paths from inside the boundary. All source operations must fail; target/cache writes must succeed. A test intended to fail may continue only after verifying the expected failure. No PUT on a failed prerequisite.
3. Start a source-mutation helper **inside** the boundary during Cargo execution. Require denied writes, unchanged source, same capture hash. Repeat with build-script descendant if verification builds are in scope.
4. Negative control: a host helper writes the original backing checkout while the boundary is active. Expect that write to remain possible with bare ro-bind; capture this limitation explicitly. A requirement for denial here means the mechanism fails acceptance and must be strengthened before production.
5. Namespace-disabled/invalid mount/pinned-version mismatch/preflight hash mismatch cases: require zero PUTs. Mock refusal after a correct capture can produce expected nonzero Cargo status; distinguish that from transport failure.

Emit structured results with expected/actual failure, Cargo exit, PUT counts, capture hash, candidate SHA and source manifest hash. Run actual tkt-package baseline only after fixture results; dependency-free success does not establish production compatibility.

Coverage: primary-source semantics checked; command is a documented-option proposal, **not runner-tested**. No claim of sealed-file transport: Cargo still repackages. No custom uploader/proxy proposed.
