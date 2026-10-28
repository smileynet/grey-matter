---
name: release
description: "Prepare, verify, stage, publish or resume a coordinated versioned release with GitHub and plugin artifacts. Use when the user asks to cut, prepare, stage, publish or resume a grey-matter or tkt release, or to bump versions so installed plugins pick up changes."
---

# Release

Orchestrate release work for grey-matter or tkt. Read the
[release contract](../../../docs/agents/release-contract.md) before choosing a mode;
it owns version authorities, publishers, channels, recovery and completion gates.
Publication is a separate action from preparing or staging a candidate: publish and
resume run only when the user has asked for them in this conversation.

Run the release tools from a grey-matter (or tkt) source checkout:
`node scripts/release.mjs` in grey-matter, `node tools/release.mjs` in tkt. The
[release.sh](references/release.sh) wrapper finds those tools by walking up from its
own path, so a deployed copy of this skill stops with "Shared release tools missing".

## Steps

1. **Find release work already in flight.** List the carriers in
   `docs/agents/releases/` on main and on every `codex/stage-*` and `codex/release-*`
   remote branch, and the versions the contract records as approved. For each prepared
   or staged candidate, compare its commit with main (`git merge-base --is-ancestor`,
   `git rev-list --count CANDIDATE..origin/main`). A candidate that main has moved past
   lacks that work: put the choice between publishing it as staged and preparing the
   same unpublished version again from main to the user before anything else.
2. **Resolve scope and mode.** Inspect the current repo, last tag, changelog, commits
   and all open tickets. Record included/blocking/deferred work; get explicit user
   deferral for excluded open tkt work. Default to dry-run. A staging request ends
   before tag pushes, registry/GitHub publication or stable promotion.
3. **Inspect the artifacts.** Use the `changelog` and `readme` criteria to propose
   accurate user-facing changes, install/update/migration guidance and prerequisites.
   Dry-run reports proposed edits without writing them; apply approved edits only
   during prepare/stage. Retain legal artifacts, compatibility and platform limits.
   Before committing candidate versions, build a source-version smoke bundle using
   the [artifact guide](../../../docs/agents/release-artifacts.md). Local Markdown
   links are transitive package inputs, including links in historical references.
4. **Propose the version.** Use [versioning](references/versioning.md), state the
   reasoning and get approval before preparing versioned candidates. Record the
   approved version and scope; recovery reuses them rather than bumping again. An
   approved version that was never published can be prepared again from a newer source.
5. **Dry-run and prepare.** Follow [local draft preparation](../../../docs/agents/release-preparation.md).
   The tools default to inspection; prepare with `--execute` only with an approved
   version/scope. Preparation creates its own clean `codex/release-PRODUCT-VERSION-SOURCE`
   branch/worktree. Record the exact commit and artifacts.
6. **Verify and stage.** Use the product entry point's `verify` mode with the prepared
   SHA and artifact directory for fresh product/native evidence. Run source/native
   syntax, resource/legal closure, version, checksum, recovery, platform and
   fresh-install/upgrade gates on that candidate; native checks for another OS run on
   that machine. Obtain the final audit disposition, stage notes/README/changelog and
   repeat gates after edits. No script writes the six gate receipts or the staging
   index: write them to the [staging format](../../../docs/agents/release-staging.md),
   each receipt citing the evidence it rests on, and commit them with the carrier on a
   `codex/stage-*` review branch. `docs/agents/releases/20261024/` on
   `origin/codex/stage-grey-matter-020-tkt-050` is a worked example. The index lists
   grey-matter and tkt exactly once each. Report SHAs, hashes, compatibility and blockers.
7. **Publish or resume only when requested.** Use the contract's assigned publisher.
   For grey-matter, follow the [publication command](../../../docs/agents/release-publication.md).
   Before `--execute`, build the development integration it will push
   (`git merge-tree --write-tree origin/main CANDIDATE`) and read its `CHANGELOG.md`:
   entries main added after the candidate belong under `## [Unreleased]`, not the new
   version. A misfiled entry stops publication until it is fixed on main.
   tkt's [release guide](https://github.com/smileynet/tkt/blob/main/docs/releasing.md)
   describes its sole reviewed CI publisher and local dispatch/observer. Inspect
   remote state before resuming. Preserve published tags/assets;
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
