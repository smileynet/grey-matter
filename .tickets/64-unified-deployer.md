---
id: "64"
title: "One deployer across projects (proposal 08): deploy.mjs, plugin.json as the pack manifest, vendored into tkt"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "Proposal 08's three decisions are recorded (vendor vs depend, tkt on Node, portfolio list location)"
  - "grey-matter deploys through deploy.mjs, reading .claude-plugin/plugin.json; no harness sees a skill twice (OpenCode overlap covered by a test); build-agy-plugin.mjs retired"
  - "tkt deploys through a vendored tools/deploy.mjs; deploy-skills.sh is a wrapper; tests/deploy_skills.rs passes against it"
  - "deploy.mjs audit lists unowned dirs and cross-pack name collisions on this machine (the crew-research leftovers and testing-guide appear)"
  - "Audit fixtures inspect actual cached Codex plugin contents across multiple installed plugins and marketplaces and detect stale/missing skills"
  - "A committed portfolio manifest supports seeded cross-pack name-collision and vendored-deployer drift checks without requiring unregistered sibling checkouts"
  - "Shared-root evidence and legacy-directory dispositions are durable, versioned and distinguish unowned content from duplicate loading"
tags: ["stream:tooling", "epic:release-readiness"]
---

# One deployer across projects (proposal 08): deploy.mjs, plugin.json as the pack manifest, vendored into tkt

## What to build

Proposal 08 ([docs/agents/proposals/08-unified-deploy.md](../docs/agents/proposals/08-unified-deploy.md)).
Each project that ships skills has its own deploy code: grey-matter's `install-skills.mjs` and
`build-agy-plugin.mjs`, tkt's `deploy-skills.sh`, godot-helper's `propagate-skills`. The copies
drift. The dual-deploy guard was written twice, and the bash copy shipped with a silent-exit bug
that tests caught. The fix is one dependency-free `deploy.mjs` that reads each project's
`.claude-plugin/plugin.json` (deploy-only settings go under `metadata.deploy`) and owns a single
harness table. From that table it makes sure no harness sees a skill twice, counting plugins too.
Projects vendor it at `tools/deploy.mjs`, and grey-matter checks the copies for drift.

Start by recording the three decisions at the end of the proposal, then build phases 1-3.

## Decisions (2026-10-23, accepted by the user)

1. **Vendor, don't depend.** Each project keeps a copy at `tools/deploy.mjs` with a version
   header, and grey-matter checks those copies for drift. tkt never needs a grey-matter checkout.
2. **tkt takes on Node for maintainer deploys.** `deploy-skills.sh` becomes a wrapper and the
   bash-4 requirement goes away. tkt CLI and plugin users need neither.
3. **The portfolio list lives in grey-matter,** not `~/.config`.

Phase 1 waits for the in-flight Codex plugin work in this checkout (`.codex-plugin/`, a Codex
guard in `install-skills.mjs`) to be committed. deploy.mjs folds that guard in.

## Progress

**Phase 1 done (b745972, 2026-10-23).** `scripts/deploy.mjs` 1.0.0, 18 tests in `scripts/deploy.test.mjs`.
`install-skills.mjs`, `build-agy-plugin.mjs` and `check-plugin-manifest.mjs` forward to it.
Live deploy on this Mac:
- kiro <- `~/.kiro/skills`; opencode <- `~/.config/opencode/skills`; claude and codex <- plugins.
- `~/.codex/skills` is a symlink to `~/.kiro/skills`. The first live run treated the two as
  separate roots and released Kiro's fresh copies; this is also how Kiro was emptied earlier
  by the Codex guard. Fixed: roots are compared by real path, a missing skill costs more than
  a duplicate, and a test covers it.
- Superseded by the 2026-10-23 plugin refresh work: deployment separates a plugin
  harness's symlinked root, preserves unrelated skills, and removes only owned copies.

Known gaps, for phases 2-3:
- Cross-pack name collisions (`testing-guide`) need the portfolio list.
- The deployed Codex client has now returned 40 skills under `~/.agents/skills` through
  app-server `skills/list`. The harness table still marks it claimed; reproduce in an
  isolated fixture, record client version, and update guidance.
**Phase 2 done (2026-10-23).** tkt vendors deploy.mjs 1.1.0; deploy-skills.sh
forwards to it. Its forbidden-reference lint is pack metadata. `cargo test --test
deploy_skills --test plugin_manifests` passes all 9 tests. The engine refreshes each
enabled local Codex plugin once on a default deploy, before pruning copies; explicit
root installs and dry runs never refresh. `sync` and standing guidance call that same
entry point. The 21 deploy tests cover refresh failure, source mismatch, symlink
separation, and duplicate audit. Portfolio-wide drift checking remains phase 3.

## Acceptance criteria

- [x] Proposal 08's three decisions are recorded (vendor vs depend, tkt on Node, portfolio list location)
- [x] grey-matter deploys through deploy.mjs, reading .claude-plugin/plugin.json; no harness sees a skill twice (OpenCode overlap covered by a test); build-agy-plugin.mjs retired
- [x] tkt deploys through a vendored tools/deploy.mjs; deploy-skills.sh is a wrapper; tests/deploy_skills.rs passes against it
- [ ] deploy.mjs audit lists unowned dirs and cross-pack name collisions on this machine (the crew-research leftovers and testing-guide appear)


## Release-readiness continuation (2026-10-23)

Intent: the user requested tickets covering all outstanding findings before release.
Read [release readiness](../docs/agents/proposals/09-release-readiness.md) and the
[source research](../docs/agents/research/plugin-release-semantics.md). Ticket 70's
final audit depends on this work; plugin syntax/documentation conformance belongs to 65.

Remaining work is phase 3, not another deployment rewrite:
- Inventory every installed Codex plugin's actual cached manifest/skills, including
  multiple plugins and marketplaces. Current `audit` only adds the current pack's source
  skill names for an enabled plugin; do not present expected coverage as actual contents.
- Use the committed portfolio list to detect cross-pack name collisions and check each
  vendored deploy engine against the canonical source. Fixtures seed both kinds of drift.
- Reproduce the observed shared-root read and replace stale claimed-only guidance with
  versioned evidence. Test each installed harness's physical roots plus discovered catalog.
- Classify the 43 unowned shared legacy directories by provenance, skill versus
  reference-only content, and keep/migrate/retire disposition. Preserve useful standalone
  skills and reference pointers; do not fabricate installer ownership.
- Keep the resolved OpenCode cleanup resolved: 42 identical duplicate directories and
  five stale shadows were archived, all 44 grey-matter skills were deployed, and physical
  roots/live catalogs showed no duplicate managed skills. Add regression coverage rather
  than recreating those cleanup tasks.

Additional acceptance criteria:
- [ ] Audit fixtures inspect actual cached Codex plugin contents across multiple installed plugins and marketplaces and detect stale/missing skills.
- [ ] A committed portfolio manifest supports seeded cross-pack name-collision and vendored-deployer drift checks without requiring unregistered sibling checkouts.
- [ ] Shared-root evidence and legacy-directory dispositions are durable, versioned and distinguish unowned content from duplicate loading.
