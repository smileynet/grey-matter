---
name: release
description: "Prepare, verify, stage, publish or resume a coordinated versioned release with GitHub and plugin artifacts."
disable-model-invocation: true
---

# Release

Orchestrate release work for grey-matter or tkt. Read the
[release contract](../../../docs/agents/release-contract.md) before choosing a mode;
it owns version authorities, publishers, channels, recovery and completion gates.
Publication is a separate action from preparing or staging a candidate.

## Steps

1. **Resolve scope and mode.** Inspect the current repo, last tag, changelog, commits
   and all open tickets. Record included/blocking/deferred work; get explicit user
   deferral for excluded open tkt work. Default to dry-run. A staging request ends
   before tag pushes, registry/GitHub publication or stable promotion.
2. **Inspect the artifacts.** Use the `changelog` and `readme` criteria to propose
   accurate user-facing changes, install/update/migration guidance and prerequisites.
   Dry-run reports proposed edits without writing them; apply approved edits only
   during prepare/stage. Retain legal artifacts, compatibility and platform limits.
3. **Propose the version.** Use [versioning](references/versioning.md), state the
   reasoning and get approval before preparing versioned candidates. Record the
   approved version and scope; recovery reuses them rather than bumping again.
4. **Dry-run and prepare.** Inspect the product's release entry point and its current
   capabilities. The [release.sh](references/release.sh) wrapper exposes prepare, verify,
   verify-product and verify-native only; legacy publication is disabled. These
   tools default to inspection and retain pending gates. Until tickets 67–69
   finish integration, use their evidence as partial results. Prepare only with an
   approved version/scope, in a dedicated clean candidate branch/worktree. Record
   the exact commit and artifacts.
5. **Verify and stage.** Use the product entry point's `verify` mode with the prepared
   SHA and artifact directory for fresh product/native evidence. Keep its pending
   gates explicit. Run source/native syntax, resource/legal closure, version,
   checksum, recovery, platform and fresh-install/upgrade gates on that candidate.
   Obtain the final audit disposition, stage notes/README/changelog and repeat gates
   after edits. Report a staging index with SHAs, hashes, compatibility and blockers.
6. **Publish or resume only when requested.** Use the contract's assigned publisher.
   For grey-matter, follow the [publication command](../../../docs/agents/release-publication.md).
   tkt's CI/crate integration remains ticket 68; preserve its sole CI publisher. Inspect remote state before resuming. Preserve published tags/assets;
   promote stable only to the verified published commit. Report each channel's state
   and URL, including partial completion and exact recovery commands.

## Local refresh

After skill or guidance edits, run the repository's canonical deploy command once:
`node scripts/deploy.mjs` for grey-matter or `node tools/deploy.mjs` for tkt. A
portfolio run can refresh both once. Legacy wrappers are alternatives. Inspect the
strict deployment audit and restart chats to load refreshed plugin skills.
Local deployment and product publication are separate operations.

## Completion

The requested mode's gates pass on the recorded commit. A staged candidate has a
reviewable index and no publication side effects. A later published release has
verified remote identity/assets, per-channel results and resumable partial states.
