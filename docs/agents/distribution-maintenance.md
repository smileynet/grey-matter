# Distribution maintenance

Read when changing skills, manifests, deployment or release guidance. Commands and code paths below are relative to the repository root.

## Deployment and plugin updates

Finish the final check run and read its passing summary before deploying. After
a source fix, the replacement run must finish; an earlier pass covers earlier bytes.

Skills deploy with `node scripts/deploy.mjs` (proposal 08). It reads the pack from
`.claude-plugin/plugin.json` and has one harness table (which skill roots each harness reads,
and how to tell whether its plugin is installed). From that table it picks roots so each
harness on this machine sees each skill exactly once, counting an installed plugin as the copy.
It copies there, takes back copies it left elsewhere, and packages the Antigravity (`agy`)
plugin when `~/.gemini` exists, and the Kiro Crew app when `~/.kiro/crew` exists (see below). It is manifest-tracked and idempotent, refuses foreign dirs,
and takes `--dry-run`/`list`/`uninstall`/`--root`/`--project`. It also has `check` (the
manifests match disk and tags; native manifest/content warnings fail via `--strict`) and `audit` (unowned dirs, and skills a harness sees twice).
`install-skills.mjs` and `build-agy-plugin.mjs` forward to it.
The pre-push manifest check uses `check --static`: repository consistency only,
without invoking the installed Claude validator. Native validation belongs to explicit
deployment/compatibility checks; its host-dependent fixture is on-demand.
Use `node scripts/deploy.mjs check --profile directory` to also reject native catalog
blockers and warnings, including a missing icon. The profile applies to the plugin,
while its marketplace still receives strict manifest validation. When Claude is absent,
native checks are skipped with a message. Run `check` before installing; install itself
checks skill lint and ownership, without running Claude native validation.
Default/portfolio installs build and strictly validate every Antigravity package before
installed targets change. Linked root `AGENTS.md` is packaged as inert reference material
under `.resources-<pack>/`, with rewritten links; it does not become an active rule.
Retries compare installed bytes and skip current copy roots, Codex caches and Antigravity
plugins. Changed/missing outputs are repaired; source and ownership checks still apply.
Kiro Crew retains its own content/enabled-state check. Run the same command to resume.
Project guidance belongs in `.claude/CLAUDE.md` (importing `../AGENTS.md`); a root
`CLAUDE.md` produces a strict plugin-content warning. tkt vendors the same
file at `tools/deploy.mjs` (ticket 64), so **change the harness table here, never in a copy**. The earlier
design is in
[`docs/agents/proposals/03-distribution-packaging.md`](./proposals/03-distribution-packaging.md);
the user-level standing rules (`global/AGENTS.md`, no steering) install with
`node scripts/install-agents-md.mjs` (a managed block; text outside it is never touched);
per-harness deploy + test instructions are in
[`docs/agents/harnesses.md`](./harnesses.md). Claude Code installs grey-matter as a
plugin from this repo's own marketplace (`.claude-plugin/`). It depends on `tkt@tkt`, from
tkt's marketplace, so add both: `/plugin marketplace add smileynet/tkt`,
`/plugin marketplace add smileynet/grey-matter`, then `/plugin install grey-matter@grey-matter`
(tkt installs with it). The design is in
[`docs/agents/proposals/07-claude-code-plugin.md`](./proposals/07-claude-code-plugin.md).

### Kimi plugin

`node scripts/build-kimi-plugin.mjs` builds `dist/kimi-plugin/` without changing the default
deploy targets. It reuses explicit-root deployment to flatten skills and preserve linked
resources, then adds the `.kimi-plugin/` manifest, localization and explicit commands.
`node --test scripts/kimi-plugin.test.mjs` covers package completeness, idempotent rebuilds,
drift repair and command generation. The plugin-manifest check keeps the Kimi name, version
and license aligned with Claude.

Use Kimi's plugin-builder tools for native validation and personal registration:

```sh
python3 /path/to/plugin-builder/scripts/validate_plugin.py dist/kimi-plugin
bash /path/to/plugin-builder/scripts/register_personal.sh dist/kimi-plugin
```

Run registration inside a Kimi session: the workflow uses the client-provided daemon binary,
scans rights, requires error-free validation and reads back the registered ID, version and
source path. Stop for owner confirmation if the rights scan reports a hit. Registration does
not install the plugin; the owner installs it from **Personal** by clicking **＋**. Rebuild and
register the same output directory for updates. The package intentionally has no hooks, MCP
servers or setup script.

Registration and read-back passed on 2026-11-08. Native validation reported zero errors and
two non-blocking catalog warnings for omitted per-skill display overrides. Owner installation,
`grey-matter:compass` discovery, linked-resource loading and both sides of the user/model
invocation policy also passed live checks. Update timing remains unverified.

### Kiro Crew app

Kiro Crew agents load a skill only through a `skill://` entry an enabled app registers; they
do not scan `~/.kiro/skills`. So `deploy.mjs` builds `dist/kirocrew-app/` (an `app.json` listing
every skill, plus the same self-contained resources as the agy plugin). It then compares the
build with the installed copy in `~/.kiro/crew/apps/<pack>`: unchanged and enabled does
nothing, unchanged and disabled only enables, changed uninstalls and reinstalls (app data is
kept). `node scripts/deploy.mjs kirocrew [build|install] [--out DIR]` runs only this step;
`--no-kirocrew` skips it.

Two gateway refusals need the owner, and neither fails the deploy; it prints the steps still
left, to run in your own terminal:

- **Not the local owner.** The gateway installs apps only for its verified local owner, so an
  agent sandbox is refused.
- **Execution policy.** Third-party apps stay disabled until trusted. Once, in the dashboard:
  Settings -> Security -> Third-party apps, add `grey-matter`. Leave "Trust every third-party
  app" off; this app ships only skill files. The app carries no backend, MCP server or hooks; the Claude push
hook has no Kiro Crew equivalent (`kirocrew app import` reports it as unmappable).

### Self-contained copy-mode installs

Bare copy-mode installs include each skill's files plus transitive Markdown-linked
resources and declared runtime/legal files. Shared files live in an installer-owned
`.resources-<pack>` directory inside the skill root; links are rewritten to the
installed layout, including links between skills. The source checkout is not needed
at runtime. Hidden resource directories do not add another copy of each skill to
the harness catalog.

The ownership manifest tracks the shared directory. Refresh removes obsolete owned
resources; uninstall removes that pack's resources and preserves foreign content.
Missing or escaping source resources fail before replacing an existing install.
A same-named foreign resource directory is refused, even with `--force`.
`audit --strict` checks installed resource links as well as duplicate discovery.

`--link` remains an optional source-dependent development mode. Running the default
copy-mode deploy replaces owned skill links with independent copies; no manual
removal or source-link workaround is required.

### Keeping the Claude plugin current

The plugin ships no hooks: the Claude push hook was removed on 2026-11-01 because it fired in
every consumer project ([proposal 18](proposals/18-three-stage-verification.md)). Packaging still
supports Claude-only files: list them in `metadata.deploy.claudeFiles`, never shared
`runtimeFiles`; release packaging keeps them out of the Codex archive.

When a change touches skills, the plugin manifests, or tkt's plugin:

- **New or changed skill:** no manifest edit. `plugin.json` lists bucket dirs, so the skill is
  picked up as is. **New bucket:** add `./skills/<bucket>` to `.claude-plugin/plugin.json`;
  `scripts/check-plugin-manifest.mjs` (the `plugin-manifest` pre-push check) fails until you do.
- **Existing cached installs need a release version bump.** `claude plugin update`
  can report "already at the latest version" while `main` has changed. New installs
  can receive the current source ref, so a push to `main` can reach new users before
  a release. The release skill bumps the manifest version; keep version edits inside
  that workflow. Stable/pinned delivery policy is defined by the [release contract](release-contract.md).
- **Refresh this machine's install** as part of "Deploy by default." Use a marketplace added
  from the local checkout (`claude plugin marketplace add <path-to-grey-matter>`, once). It
  must appear as the enabled plugin's `readFromFolder` in `claude plugin list --json`,
  with this checkout's version in `folderVersion`. Default deploy verifies that binding
  before pruning bare copies. Current Claude reads the folder directly; no reinstall or
  version bump is needed for local edits. Run `/reload-plugins` or start a new session.
  A legacy client without this evidence, foreign folder, or failed CLI stops deployment;
  update Claude/register the correct local marketplace before retrying. Audit uses the
  active folder rather than a historical `installPath` cache. See
  [observations and version limits](research/claude-local-refresh.md).
  For a GitHub install, run `claude plugin marketplace update grey-matter`, then
  `claude plugin update grey-matter@grey-matter`. Cached updates depend on the
  manifest version; new default-ref installs can receive unreleased files.
- **One install path per harness (guarded).** A skill must never load twice in one harness.
  `deploy.mjs` enforces this from its harness table: a root that a harness with an installed
  plugin reads gets no copy, and copies it left there earlier are removed. Foreign dirs are
  never touched. `--allow-dual` overrides; don't use it in a normal deploy. A new harness, or a
  root a harness turns out to read, goes in that table, not in a new guard
  (`scripts/deploy.test.mjs` covers it).
- **Check before pushing:** the `plugin-manifest` check (`node scripts/gate.mjs pre-push`) runs `claude plugin validate`
  when `claude` is on PATH. To see what loads, run
  `claude --plugin-dir ../tkt --plugin-dir . plugin details grey-matter`, which lists the
  skills without a model call.
- **tkt's plugin lives in the tkt repo**, and grey-matter depends on `tkt@tkt` with no version
  range (`allowCrossMarketplaceDependenciesOn: ["tkt"]` in `marketplace.json`). Don't relist
  tkt in grey-matter's marketplace. A bare `tkt` dependency resolves to `tkt@grey-matter`,
  which installs a second plugin named `tkt` alongside a local `tkt@tkt`. A tkt change reaches
  grey-matter users when tkt releases, with no edit here.

## Shared release tools

Release modules are canonical in `scripts/` and vendored into tkt's `tools/` with
`node scripts/sync-release-tools.mjs --target /path/to/tkt --write`. Without `--write`
it checks drift. It protects foreign/local edits and requires a private target package
with matching canonical development dependencies. Update tkt's package/lock deliberately
when dependencies change, run both product gates, then commit/push each changed repo.

The deployer is maintained separately from that release-module inventory. To inspect or
repair tkt's `tools/deploy.mjs`, use
`node scripts/sync-release-tools.mjs --target /path/to/tkt --deployer` and add `--write`
for repair. The repair accepts only the tkt checkout registered in `skill-packs.json`,
requires clean vendor paths and an up-to-date branch, and records the canonical source,
owner and hash in `tools/deployer-vendor.json`. Fetch and compare upstream first. If the
branch is ahead or diverged, ask the tkt owner before dropping or rebasing local commits.
This separate command does not change which release modules are vendored.
Deploy each changed pack once, or use one `--portfolio skill-packs.json` deployment.
The release wrappers expose local preparation/verification; publication/resume is unfinished.
Read [draft preparation](release-preparation.md) for modes, prerequisites and ownership.

## Consistency checks

Maintainer setup requires Node 22+ and the pinned parser/archive dependencies. Run `npm ci --ignore-scripts` once after cloning or lockfile changes. Plugin consumers and the standalone deploy engine do not need npm dependencies.

`scripts/gates.json` declares every check and its stage; `node scripts/gate.mjs <stage>` runs them:

```
node scripts/gate.mjs pre-merge     # the changed areas' checks, before a ticket's code is pushed
node scripts/gate.mjs pre-release   # every check in every stage; the release product gate runs it
```

The `gates-coverage` check fails when a `scripts/check-*.mjs` or `scripts/*.test.mjs` is run by no
check and not listed under `not_gated` with a reason. The output prints each check's time and outcome.

It aggregates (each also runnable on its own): the deployer's ownership, plugin guards and
root selection (`scripts/deploy.test.mjs`), YAML syntax/core field types
(`scripts/check-skill-syntax.mjs`, seeded fixtures in `scripts/skill-syntax.test.mjs`), invocation sidecars + README tiers
(`scripts/check-invocation-policy.mjs`), doc indexes + relative links
(`scripts/check-docs-consistency.mjs`), ticket health (`tkt validate`), adopt-project's
knowledge-relocation fixtures (`scripts/relocate-knowledge.test.mjs`), the global AGENTS.md
size budget + managed blocks (`scripts/install-agents-md.test.mjs`) and the guidance check's
fixtures (`scripts/check-guidance.test.mjs`), the crew-research uninstall scope
(`scripts/uninstall-crew-research.test.mjs`), the repo-survey tiers (`scripts/survey-repos.test.mjs`), and the
Claude plugin manifest (`scripts/check-plugin-manifest.mjs`: every skill bucket listed, version not
behind the latest tag, marketplace entry present). It is
**read-only on user state** (the installer check uses throwaway temp roots, never a real
harness skill root) and needs **no harness authentication or network** (tkt is local and
degrades to a skipped-with-warning if absent). Run it before a
release or a distribution change. Exit 0 = all invariants hold; nonzero names what failed.
The artifact-hygiene invariant runs
`node --test scripts/repository-artifact-hygiene.test.mjs` against disposable
repositories. Its distributed inspector lives with
[repository-artifact-hygiene](../../skills/meta/repository-artifact-hygiene/SKILL.md);
the fixtures need Git but no provider login, network or LFS payload download.
Fixtures proving each static check fails when seeded live in `scripts/static-checks.test.mjs`; they
edit tracked files, so run them through `gate.mjs`, which uses a worktree snapshot.

`scripts/gates.json` declares the staged checks and `node scripts/gate.mjs <stage>` runs them
([proposal 18](proposals/18-three-stage-verification.md)). The pre-push stage runs from the tracked
`.githooks/pre-push` once a clone opts in with `git config core.hooksPath .githooks`; nothing
installs it. `gate.mjs` owns each check's timeout and kills the process tree, so a check that
hangs, or blocks in `spawnSync`, ends as `timeout`, never as a pass.


Release bundle construction and verification are documented in
[release artifacts](release-artifacts.md); their isolated fixtures are invariant 11.

## Manual platform validation

`.github/workflows/platform-validation.yml` runs only on `workflow_dispatch`. It
reproduces ticket 60's two Windows fixture suites and runs the full strict gate
on Windows and Ubuntu with Node 22 and a pinned tkt source dependency. Native plugin
CLIs, previous-release upgrades and product publication are outside this job.

Dispatch with `gh workflow run platform-validation.yml --ref main`; inspect the
returned run and each job's logs before claiming platform success. The workflow must
exist on the default branch before dispatch, and write access is required, per
[GitHub's manual-run guide](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).
Its explicit `shell: bash` uses Git for Windows and enables pipefail, per
[GitHub's shell reference](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idstepsshell).
Sources read 2026-10-23. Failed jobs are evidence to fix, not a passing platform gate.

The [2026-10-23 platform evidence](research/evidence/windows-prepush-20261023.json)
records a passing 12-invariant gate on Windows/Git Bash, Ubuntu and macOS. The
targeted Windows job also checks worktree recovery, archive links and deployment.
Native Windows plugin-client validation remains a separate release gate in ticket 69.

### Windows native probe boundaries

The [SharkTank report](research/windows-native-validation-20261024.md) records exact executable paths, pinned downloads and remaining scope. Use real Node/CLI executables when SSH cannot launch mise/WinGet/Bun shims. Set Kiro's documented `KIRO_HOME` in the actual ACP child environment; HOME/USERPROFILE alone did not isolate its catalog. Codex 0.147.0 separately discovers the Windows Known Folder user skill root, so full isolation requires a clean Windows account/VM or an explicitly approved narrower scope. Do not delete personal roots to make a probe pass.

For pinned AGY checks, disable its updater inside the executable launcher: the native helper's environment allowlist drops an ambient `AGY_CLI_DISABLE_AUTO_UPDATE`. Preserve the payload hash separately from the launcher hash and require terminal success, including cleanup; a passing report written before a cleanup lock is insufficient. Old Git Bash tkt installs may contain regular copies rather than links. The migration tool preserves those for review; compare the complete old source/file bytes before removing any explicitly owned fixture copy. The release companion guide must describe this manual path.
