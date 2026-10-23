# Distribution maintenance

Read when changing skills, manifests, deployment or release guidance. Commands and code paths below are relative to the repository root.

## Deployment and plugin updates

Skills deploy with `node scripts/deploy.mjs` (proposal 08). It reads the pack from
`.claude-plugin/plugin.json` and has one harness table (which skill roots each harness reads,
and how to tell whether its plugin is installed). From that table it picks roots so each
harness on this machine sees each skill exactly once, counting an installed plugin as the copy.
It copies there, takes back copies it left elsewhere, and packages the Antigravity (`agy`)
plugin when `~/.gemini` exists. It is manifest-tracked and idempotent, refuses foreign dirs,
and takes `--dry-run`/`list`/`uninstall`/`--root`/`--project`. It also has `check` (the
manifests match disk and tags) and `audit` (unowned dirs, and skills a harness sees twice).
`install-skills.mjs` and `build-agy-plugin.mjs` forward to it. tkt vendors the same
file at `tools/deploy.mjs` (ticket 64), so **change the harness table here, never in a copy**. The earlier
design is in
[`docs/agents/proposals/03-distribution-packaging.md`](./proposals/03-distribution-packaging.md);
the user-level standing rules (`global/AGENTS.md`, no steering) install with
`node scripts/install-agents-md.mjs` (owner-marked, never clobbers a foreign file);
per-harness deploy + test instructions are in
[`docs/agents/harnesses.md`](./harnesses.md). Claude Code installs grey-matter as a
plugin from this repo's own marketplace (`.claude-plugin/`). It depends on `tkt@tkt`, from
tkt's marketplace, so add both: `/plugin marketplace add smileynet/tkt`,
`/plugin marketplace add smileynet/grey-matter`, then `/plugin install grey-matter@grey-matter`
(tkt installs with it). The design is in
[`docs/agents/proposals/07-claude-code-plugin.md`](./proposals/07-claude-code-plugin.md).

### Keeping the Claude plugin current

When a change touches skills, the plugin manifests, or tkt's plugin:

- **New or changed skill:** no manifest edit. `plugin.json` lists bucket dirs, so the skill is
  picked up as is. **New bucket:** add `./skills/<bucket>` to `.claude-plugin/plugin.json`;
  `scripts/check-plugin-manifest.mjs` (check-repo invariant 9) fails until you do.
- **Existing cached installs need a release version bump.** `claude plugin update`
  can report "already at the latest version" while `main` has changed. New installs
  can receive the current source ref, so a push to `main` can reach new users before
  a release. The release skill bumps the manifest version; keep version edits inside
  that workflow. Stable/pinned delivery policy is defined by the [release contract](release-contract.md).
- **Refresh this machine's install** as part of "Deploy by default." Use a marketplace added
  from the local checkout (`claude plugin marketplace add <path-to-grey-matter>`, once). It
  loads the files in place, so run `/reload-plugins` or start a new session to pick up edits.
  For a GitHub install, run `claude plugin marketplace update grey-matter`, then
  `claude plugin update grey-matter@grey-matter` (this only changes anything after a release).
- **One install path per harness (guarded).** A skill must never load twice in one harness.
  `deploy.mjs` enforces this from its harness table: a root that a harness with an installed
  plugin reads gets no copy, and copies it left there earlier are removed. Foreign dirs are
  never touched. `--allow-dual` overrides; don't use it in a normal deploy. A new harness, or a
  root a harness turns out to read, goes in that table, not in a new guard
  (`scripts/deploy.test.mjs` covers it).
- **Check before committing:** `node scripts/check-repo.mjs` runs `claude plugin validate`
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
Deploy each changed pack once, or use one `--portfolio skill-packs.json` deployment.
The release wrappers expose local preparation/verification; publication/resume is unfinished.
Read [draft preparation](release-preparation.md) for modes, prerequisites and ownership.

## Consistency checks

Maintainer setup requires Node 22+ and the pinned parser/archive dependencies. Run `npm ci --ignore-scripts` once after cloning or lockfile changes. Plugin consumers and the standalone deploy engine do not need npm dependencies.

One command verifies the mechanical distribution invariants:

```
node scripts/check-repo.mjs
```

It aggregates (each also runnable on its own): the deployer's ownership, plugin guards and
root selection (`scripts/deploy.test.mjs`), YAML syntax/core field types
(`scripts/check-skill-syntax.mjs`, seeded fixtures in `scripts/skill-syntax.test.mjs`), invocation sidecars + README tiers
(`scripts/check-invocation-policy.mjs`), doc indexes + relative links
(`scripts/check-docs-consistency.mjs`), ticket health (`tkt validate`), adopt-project's
knowledge-relocation fixtures (`scripts/relocate-knowledge.test.mjs`), the global AGENTS.md
size budget + ownership (`scripts/install-agents-md.test.mjs`), the crew-research uninstall scope
(`scripts/uninstall-crew-research.test.mjs`), the repo-survey tiers (`scripts/survey-repos.test.mjs`), and the
Claude plugin manifest (`scripts/check-plugin-manifest.mjs`: every skill bucket listed, version not
behind the latest tag, marketplace entry present). It is
**read-only on user state** (the installer check uses throwaway temp roots, never a real
harness skill root) and needs **no harness authentication or network** (tkt is local and
degrades to a skipped-with-warning if absent). Run it before a
release or a distribution change. Exit 0 = all invariants hold; nonzero names what failed.
Fixtures proving each invariant fails when seeded live in `scripts/check-repo.test.mjs`
(`node --test`).

An **opt-in pre-commit hook** can run this automatically: `node scripts/install-hooks.mjs`
installs a `pre-commit` hook that runs `check-repo.mjs` and blocks the commit on failure;
`list` / `uninstall` manage it, and it refuses to clobber a foreign hook. It is not forced
on clone — install it if you want the local gate. (This project uses local hooks only;
there is no CI pipeline.)


Release bundle construction and verification are documented in
[release artifacts](release-artifacts.md); their isolated fixtures are invariant 11.
