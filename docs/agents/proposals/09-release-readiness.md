# Release readiness and coordinated GitHub/plugin releases

Status: planning baseline, 2026-10-23. Intent: the user requested tickets covering
outstanding findings, release skills/scripts/guidance, final project audit, and staged
release artifacts. Creating this plan does not authorize publishing a release.

The policies below are the working proposal. The release-contract ticket must confirm
policy decisions and actual version choices before implementing irreversible behavior.

## Working release contract

Use one release version per repository. The GitHub release and all plugin packages represent the same tagged commit. grey-matter and tkt release independently.

| Repository | Version source | Kept in step |
| --- | --- | --- |
| grey-matter | Existing pack manifest | Claude and Codex manifests, generated Antigravity package, tag, GitHub release |
| tkt | Cargo.toml | Cargo.lock package version, crate, binaries, three plugin manifests, tag, GitHub release |

Keep the deploy engine's internal version for vendor drift checks; it is not a third product release train. A skills-only tkt change still bumps tkt's release version.

Before 1.0, use patch for compatible fixes and small skill/guidance corrections; minor for substantial new capability, a new distribution target, or any breaking change. Reserve 1.0 for an explicit stability commitment. After 1.0 use normal SemVer. This makes the current pre-1.0 policy less ambiguous. Candidate next versions are grey-matter 0.2.0 and tkt 0.5.0, subject to reviewing the full unreleased changes.

Separate development from stable delivery. Developers use a local checkout and deploy.mjs. Plugin consumers register each repo's stable marketplace branch, advanced only to a verified release commit. Exact-version consumers pin the vX.Y.Z tag. main remains development. Explicit plugin versions do not snapshot main for new installs, and an immutable tag does not advance automatically.

Keep one GitHub publisher per repo: grey-matter's local release tooling, and tkt's existing tag-triggered dist workflow. The local tkt release command prepares versions and pushes the tag, then waits for CI; it never independently calls gh release create.

The proposed single release command defaults to dry-run. Its execute mode:

1. Fetch; require a clean, current tree; reconcile release scope and explicitly defer any excluded tickets; validate changelog and compatibility.
2. Bump every version surface together, run checks against the resulting release tree, create a release commit and annotated tag, then push only the branch and this tag atomically. Abort remote publication if atomic push is unsupported; retain local preparation for recovery.
3. Build from that exact tag. The assigned publisher creates the draft GitHub release with --verify-tag (local tooling for grey-matter; CI for tkt). Move tkt publication after the proposed verification gates. Upload plugin bundles, checksums, release metadata (commit, versions, skill counts, tested tkt compatibility), and tkt's normal binaries/installers. Include runtime references and scripts in plugin bundles; exclude development debris.
4. Test new installs and upgrades from a prior release using isolated client homes, targeting the candidate tag/SHA before stable promotion. Check versions, names, referenced files, removed skills, and zero duplicate loading for every supported harness. Confirm crates.io publication for tkt.
5. The assigned publisher publishes the draft, verifies remote assets, then fast-forwards stable to that release commit and verifies stable resolves to the expected SHA. Report per-channel status. Run the canonical local deploy command once when refreshing the maintainer's machine.

A Git marketplace plugin release needs a versioned source commit and marketplace promotion; a ZIP upload alone does not update installed plugins. OpenAI public-directory submission, if desired, is an additional distribution step rather than an assumed consequence of GitHub publication.

Trade-offs: tkt lockstep releases can rebuild an unchanged CLI; stable adds one branch per repo; grey-matter's local publisher depends on the maintainer's environment; tkt still has unavoidable sequencing across crates.io, GitHub, and plugin promotion. Record partial completion and resume only missing steps. Never move a published tag or replace published bytes; fix forward with a new version. Enable GitHub immutable releases and attach all assets while the release remains a draft. Remove the current grey-matter recovery suggestion to delete pushed release tags.

Implementation order: version consistency gates; draft/resume behavior; release-source channel and install docs; bundle/in-place upgrade tests; stable promotion and per-channel verification. Keep tkt's generated dist workflow configured through its generator rather than hand-editing generated jobs.

## Durable research

- [GitHub release mechanics and recovery](../research/github-release-strategy.md).
- [Codex and Claude marketplace/update semantics](../research/plugin-release-semantics.md).
- [Existing unified deployment proposal](08-unified-deploy.md).

The two research notes retain source URLs, warnings, verified facts versus inference,
and open questions. Codex same-version cache behavior is not established by its public
packaging documentation; test the installed version rather than importing Claude rules.
Antigravity source documentation still needs to be located and read during conformance
work. Its installed CLI and validator supplement that documentation, not replace it.

## Plugin conformance coverage

Audit all six repository/format combinations: grey-matter and tkt, each for Codex,
Claude Code, and Antigravity. Include manifests, marketplace catalogs, skill frontmatter
and sidecars, invocation policy, namespace/dependency syntax, source paths and ref/SHA
selectors, packaged runtime files, supported hooks, privacy/security metadata where
applicable, version/update behavior, and installation instructions. Mark unsupported or
irrelevant features explicitly as not applicable. Do not add hooks or migrate manifest
formats solely because newer syntax exists; supported compatibility layouts are valid.

Every row must cite a primary-source section actually read, date, tool/version, local
file, validation command/output, finding severity, and disposition. Do not certify
conformance from a local validator alone. Seed a defect to prove each new mechanical
gate detects the intended violation. Resolve release blockers before staging; clearly
record any non-blocking uncertainty and its impact.

Primary references to re-read:
- [OpenAI packaging and marketplace paths](https://developers.openai.com/plugins/build/plugins).
- [OpenAI skill authoring](https://developers.openai.com/plugins/build/skills).
- [Claude marketplace reference](https://code.claude.com/docs/en/plugins/marketplace-reference).
- [Claude plugin loading](https://code.claude.com/docs/en/plugins/loading).
- [Claude plugin publication](https://code.claude.com/docs/en/plugins/publish).
- [Agent Skills specification](https://agentskills.io/specification).
- [Agent Plugins manifest schema](https://agent-plugins.org/schemas/1.0.0/plugin.schema.json).
- [GitHub release creation](https://cli.github.com/manual/gh_release_create).
- [GitHub immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases).
- [cargo-release integration with dist](https://axodotdev.github.io/cargo-dist/book/workspaces/cargo-release-guide.html).
- [cargo-dist release configuration](https://axodotdev.github.io/cargo-dist/book/reference/config.html).

Antigravity: run `agy plugin --help` and `agy plugin validate --help`; locate the current
vendor-published plugin specification or shipped schema, capture its verified source
URL/path and version, and document any unavailable authoritative guidance as a gap.

## Outstanding findings and scope boundaries

- Ticket 64 owns remaining portfolio inventory, cross-pack name collision detection,
  vendored-deployer drift checks, and the full installed Codex-plugin inventory. Current
  audit counts the current pack from source; it does not read every installed plugin.
- Codex loading the shared root is now observed: the live app-server `skills/list` returned
  40 skills under `~/.agents/skills` on 2026-10-23. Replace stale claimed-only guidance and
  add an isolated fixture; record the exact client version when reproducing.
- The 42 identical OpenCode duplicates and five stale grey-matter shadows were archived
  outside scan roots and replaced as appropriate. They are resolved, not new backlog.
  The live check showed 48 managed skills exactly once in five user-level harnesses;
  OpenCode had 89 unique skills. Machine-local backups are recovery aids, not ticket inputs.
- The 43 shared legacy directories remain intentionally unowned. Inventory provenance,
  distinguish skill definitions from reference-only directories, and give each an explicit
  keep/migrate/retire disposition; do not fabricate ownership or delete useful references.
- Ticket 60 owns known Windows check failures and push-gate work. Tickets 59 and 63, tkt
  ticket 210 (remaining SessionStart hook), and all other open work require an explicit
  release-scope decision, not silent exclusion or automatic blocking of unrelated changes.
- Do not reimplement completed Codex plugin creation, source refresh, root separation, or
  tkt's migration to the shared Node deploy engine.

## Ticket sequence

All new tickets use `stream:tooling` and `epic:release-readiness`, remain open, and have
machine-mappable validation criteria. Existing work is reused rather than duplicated.

| Ticket | Deliverable | Blocked by |
| --- | --- | --- |
| [64](../../../.tickets/64-unified-deployer.md) | Remaining portfolio/cache/provenance findings | None |
| [60](../../../.tickets/60-check-repo-green-windows-then-pre-push.md) | Existing Windows failures/push gate | None |
| [65](../../../.tickets/65-plugin-conformance.md) | Six plugin conformance rows against primary sources | None |
| [66](../../../.tickets/66-release-contract.md) | Reviewed release skills and guidance | 65 |
| [67](../../../.tickets/67-release-preparation.md) | Versioned candidate preparation and complete bundles | 66 |
| [68](../../../.tickets/68-release-publication.md) | One publisher per repo, draft/resume and stable promotion | 67 |
| [69](../../../.tickets/69-release-install-verification.md) | Isolated fresh-install/upgrade evidence | 67, 68 |
| [70](../../../.tickets/70-pre-release-audit.md) | Final cross-project go/no-go audit | 64, 60, 65-69 |
| [71](../../../.tickets/71-release-staging.md) | Reviewed release artifacts, with gates re-run after edits | 70 |

Release-scope decisions may intentionally defer unrelated open work, but no silent
deferral clears a blocker. Newly discovered release blockers become linked tickets and
block 70/71. Tickets 60/64 remain mandatory blockers unless an explicit approved scope change is
recorded and the graph is updated. Publication implementation and promotion tests use
fake services/isolated refs; they do not execute a real release.
Staging remains the terminal action in this request; publication is a
separate later release action.

## Execution ownership and verification

Track the coordinated plan in grey-matter. The implementation may touch tkt's own release
files; commit and push each repository independently, link both revisions in closure
evidence, and create a linked tkt implementation ticket if its workflow requires one.
The plan must remain understandable from a fresh grey-matter checkout: external sources
use upstream URLs, and repository-local inputs use committed relative references.

Checks: grey-matter `node scripts/check-repo.mjs`; tkt `mise run check` and
`node tools/deploy.mjs check`; release fixtures; native plugin validators; isolated
fresh-install and upgrade tests; physical roots plus live catalogs. Treat supported
Windows/macOS/Linux coverage explicitly; unavailable platforms are coverage gaps, not
passes. Re-run deployment duplicate probes after refresh and repeat deploy for idempotence.

Final audit records exact source revisions, severity, release disposition for every open
ticket/finding, documentation/link/prose health, secret/development-debris exclusions,
release-note completeness, plugin syntax coverage, toolchain pins, and recovery evidence.
Staging then updates README/CHANGELOG/install and migration docs, reconciles the audit
against the final candidate tree, and re-runs gates on that exact candidate. Stop before
pushing tags, publishing registries/GitHub releases, promoting stable, or submitting stores.
Use a dedicated candidate worktree/branch so ordinary local deploy never exposes proposed
versions to stable users. A later release action publishes the reviewed candidate.

## First-pass conformance findings (2026-10-23)

The [Codex](../research/codex-plugin-conformance.md), [Claude](../research/claude-plugin-conformance.md), and [Antigravity](../research/agy-plugin-conformance.md) source audits preserve native results and authoritative links. Ticket 72 repairs three dangling Antigravity wrap-session resource links. Ticket 73 verifies runtime invocation policy and current Claude component validation. Both block ticket 70; discovery and schema success alone do not certify runtime behavior. Ticket 65 still owns the consolidated six-row report and refreshed release-revision evidence.
