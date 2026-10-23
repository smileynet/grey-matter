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

Skills are discovered by an agent harness from a scan root (e.g. `~/.agents/skills/`).
The installer copies each skill there, flattening the bucket structure:

```sh
# from the repo root (requires Node):
node scripts/install-skills.mjs            # copy into each installed harness's user root
node scripts/install-skills.mjs --project  # copy into <cwd>/.agents/skills (project-level)
node scripts/install-skills.mjs --dry-run  # preview, change nothing
node scripts/install-skills.mjs list       # what's installed
node scripts/install-skills.mjs uninstall  # remove what we installed
```

User-level standing rules live in one short file, `global/AGENTS.md`, installed into each
harness's global instructions file with `node scripts/install-agents-md.mjs` (`--dry-run`,
`list`, `uninstall`; never overwrites a file it didn't install). See
[`docs/agents/harnesses.md`](./docs/agents/harnesses.md).

Wrappers `scripts/install-skills.sh` and `scripts/install-skills.ps1` call the same
Node script. By default it installs into every known harness user root present on the
machine (`~/.kiro/skills`, `~/.codex/skills`, `~/.claude/skills`, `~/.agents/skills`),
since each harness scans its own root. `--project` installs into `<cwd>/.agents/skills`,
the shared project-level root read by agy, Crush, OpenCode, and Claude Code. It copies by
default (`--link` opts into symlink/junction), accepts explicit `--root <dir>` overrides,
tracks what it installed in a manifest, and never touches skills it didn't install. A
Claude Code plugin package is a later addition (see
`docs/agents/proposals/03-distribution-packaging.md`).

### Codex plugin

Install the workflow skills from the Codex marketplace:

```sh
codex plugin marketplace add smileynet/grey-matter
codex plugin add grey-matter@grey-matter
```

Install `tkt@tkt` separately from `smileynet/tkt` for ticket tracking.
User-level standing rules still use `scripts/install-agents-md.mjs`.

For local development, replace `smileynet/grey-matter` with the checkout's absolute path.
After edits, run `codex plugin add grey-matter@grey-matter` again to refresh the cached copy,
then start a new chat. The skill installer skips Codex scan roots when this plugin
is enabled, removing only copies it previously installed. `--allow-dual` overrides
that guard.

### Harness support

The skills follow the [Agent Skills](https://agentskills.io) open standard (`SKILL.md`
directories) and are consumable **unchanged** (no conversion, no MCP wrapping) by every
harness probed live: **kiro-cli, codex, Claude Code, agy (Google Antigravity CLI), Crush
(Charm), and OpenCode** all discover an installed skill and activate it. User-level scan
roots differ per harness; project-level `.agents/skills/` is the shared root for agy,
Crush, OpenCode, and Claude. Full results and the per-harness root table:
`docs/agents/research/harness-behavior-probes.md`.

## Status

The active engineering + productivity skill sets are reviewed and authored; beta/frozen
upstream skills and distribution hardening are tracked in `.tickets/` (run `tkt ready`).
