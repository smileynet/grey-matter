# grey-matter

A customized, adapted set of agent skills derived from a review of
[mattpocock/skills](https://github.com/mattpocock/skills), reshaped for my own
workflow and for game-centric (not just web-application) development.

## What lives here

- **Skills** in `skills/<bucket>/<name>/`, across three buckets: `engineering`
  (build software), `productivity` (think and communicate), and `meta` (tend the
  skill set itself). Each bucket has a `README.md` listing its skills.
- **Agent-facing reference** in `docs/agents/` (per-skill review notes, conventions,
  proposals, lenses, research). User-facing docs live at `docs/` root.
- Tickets tracked with [`tkt`](https://github.com/smileynet/tkt) in `.tickets/`.

Start with [`skills/meta/compass/SKILL.md`](./skills/meta/compass/SKILL.md), the
router over the whole set, or read [`AGENTS.md`](./AGENTS.md) for the conventions.

## Install

Skills are discovered by an agent harness from a scan root (e.g. `~/.kiro/skills/`) or a
plugin. The deployer picks roots so each harness here sees each skill once, counting an
installed grey-matter plugin, and copies there with the bucket structure flattened:

```sh
# from the repo root (requires Node):
node scripts/deploy.mjs              # deploy to every harness on this machine (+ agy plugin)
node scripts/deploy.mjs --project    # copy into <cwd>/.agents/skills (project-level)
node scripts/deploy.mjs --dry-run    # preview, change nothing
node scripts/deploy.mjs list         # what's installed
node scripts/deploy.mjs uninstall    # remove what we installed
node scripts/deploy.mjs audit        # unowned dirs, skills a harness sees twice
```

User-level standing rules live in one short file, `global/AGENTS.md`, installed into each
harness's global instructions file with `node scripts/install-agents-md.mjs` (`--dry-run`,
`list`, `uninstall`; never overwrites a file it didn't install). See
[`docs/agents/harnesses.md`](./docs/agents/harnesses.md).

Wrappers `scripts/install-skills.sh` and `scripts/install-skills.ps1` call the same
deployer. It selects roots to avoid duplicates, copies by default (`--link` opts into
symlink/junction), and accepts explicit `--root <dir>` overrides. Its ownership
manifest protects skills installed by other sources. Use `--project` for a shared
project-level install; enabled plugins still count as the copy for their harness.

### Claude Code plugin

```sh
claude plugin marketplace add smileynet/tkt
claude plugin marketplace add smileynet/grey-matter
claude plugin install grey-matter@grey-matter
```

The dependency installs tkt's workflow skills. Install the
[`tkt` CLI](https://github.com/smileynet/tkt#install) separately. The Claude push hook
requires Claude 2.1.310+ and Node 22+; Codex and agy receive no Claude hooks.

### Codex plugin

Register the marketplace and install the workflow skills:

```sh
codex plugin marketplace add smileynet/grey-matter
codex plugin add grey-matter@grey-matter
```

Install `tkt@tkt` separately from `smileynet/tkt` for ticket workflow skills, and
install the tkt CLI separately.
User-level standing rules still use `scripts/install-agents-md.mjs`.

For local development, replace `smileynet/grey-matter` with the checkout's absolute path.
After edits, run `node scripts/deploy.mjs` once to refresh the cached plugin and harness roots,
then start a new chat. The skill installer skips Codex scan roots when this plugin
is enabled, removing only copies it previously installed. `--allow-dual` overrides
that guard.

The GitHub marketplace examples follow the development default branch. Stable
delivery uses the release-only `stable` ref after verified publication; a version
field does not pin a default-branch install. See the
[channel contract](docs/agents/release-contract.md#development-stable-and-pinned-delivery)
and [update procedures](docs/agents/distribution-maintenance.md). Restart chats
after a plugin refresh. Staging a candidate does not make it a published release.

### Harness support

The skills follow the [Agent Skills](https://agentskills.io) open standard (`SKILL.md`
directories) and are consumable **unchanged** (no conversion, no MCP wrapping) by every
harness probed live: **kiro-cli, codex, Claude Code, agy (Google Antigravity CLI), Crush
(Charm), and OpenCode** all discover an installed skill and activate it. User-level scan
roots differ per harness; project-level `.agents/skills/` is the shared root for agy,
Crush, OpenCode, and Claude. Full results and the per-harness root table:
`docs/agents/research/harness-behavior-probes.md`.

## Maintainer checks

Use Node 22+ and run `npm ci --ignore-scripts` after cloning, then
`node scripts/check-repo.mjs`. Checks run offline; pinned YAML/TOML parsers and archive tooling are
maintenance dependencies. Plugin users do not need npm dependencies. The standalone
deploy engine remains dependency-free.

Native validation, source-documentation audits, and update procedures are described in
[distribution maintenance](docs/agents/distribution-maintenance.md).

## Status

The set contains 46 skills, with Claude, Codex and Antigravity plugin packaging plus
deployment for the other supported harnesses. Release preparation, verification and
recovery are implemented; each release still needs its own candidate, install/upgrade
and final audit evidence. Remaining work is tracked in `.tickets/` (`tkt ready`).

## License

MIT with Apache-2.0 material in the PR skill. See [LICENSE](LICENSE),
[NOTICE](NOTICE), and [PR credits](skills/engineering/pr/CREDITS.md) for scope and attribution.
