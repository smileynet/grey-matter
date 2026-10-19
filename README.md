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
node scripts/install-skills.mjs            # copy into each installed harness's skills root
node scripts/install-skills.mjs --dry-run  # preview, change nothing
node scripts/install-skills.mjs list       # what's installed
node scripts/install-skills.mjs uninstall  # remove what we installed
```

Wrappers `scripts/install-skills.sh` and `scripts/install-skills.ps1` call the same
Node script. By default it installs into every known harness root present on the machine
(`~/.kiro/skills`, `~/.codex/skills`, `~/.claude/skills`, `~/.agents/skills`), since each
harness scans its own root rather than one shared location. It copies by default (`--link`
opts into symlink/junction), accepts explicit `--root <dir>` overrides, tracks what it
installed in a manifest, and never touches skills it didn't install. A Claude Code plugin
package is a later addition (see `docs/agents/proposals/03-distribution-packaging.md`).

### Harness support

The skills follow the [Agent Skills](https://agentskills.io) open standard (`SKILL.md`
directories). **Verified live**: kiro-cli, codex, and Claude Code each discover an
installed skill, load its `references/` on demand, ignore unknown frontmatter, and honor
user-invoked invocation control (codex isolates the filter cleanly). Each scans its own
user root (`~/.kiro/skills`, `~/.codex/skills`, `~/.claude/skills`), which the installer
targets by default. OpenCode has no Agent Skills support at its current version. Full
results: `docs/agents/research/harness-behavior-probes.md`.

## Status

The active engineering + productivity skill sets are reviewed and authored; beta/frozen
upstream skills and distribution hardening are tracked in `.tickets/` (run `tkt ready`).
