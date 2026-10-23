# Proposal 07: grey-matter as a Claude Code plugin

**Ticket:** 22. **Status:** phase 1 built (2026-10-22); phases 2-3 open.

> **Update (phase 1 built):** checked live on Claude Code 2.1.223.
> - Listing the three bucket dirs in `skills` works. `claude plugin details` shows all 44
>   skills. `claude plugin validate` passes, apart from one expected `--strict` warning that
>   the repo-root `CLAUDE.md` isn't loaded as plugin context.
> - tkt is now its own Claude plugin (tkt ticket 209). grey-matter depends on `tkt@tkt` and
>   allowlists the `tkt` marketplace. The first design relisted tkt in grey-matter's marketplace
>   under a bare dependency. On a live install that resolved to `tkt@grey-matter`, a second
>   `tkt` beside the local `tkt@tkt`, and the GitHub fetch failed over SSH. So users add both
>   marketplaces.
> - The version bump lives in `release.sh` (step 1b), and `scripts/check-plugin-manifest.mjs`
>   is check-repo invariant 9.
> - The installer's `~/.claude/skills` default and the SessionStart hook (moved to tkt's
>   plugin, which owns the frontier) are follow-up tickets.

This picks up the deferred half (A) of [proposal 03](./03-distribution-packaging.md): a
Claude Code plugin for grey-matter, so `/plugin install` replaces copying skills into
`~/.claude/skills/`. The cross-client installer (B) and the agy plugin
(`scripts/build-agy-plugin.mjs`, ticket 61) stay as they are. This proposal adds Claude's
package next to them and changes nothing in them.

## What changed since proposal 03

- **No enumeration needed.** Proposal 03 assumed `plugin.json` must list every skill path
  and so needs a generate-and-check sync guard. A plugin's `skills` field takes
  *directories that contain skill folders*. If it lists the three bucket dirs, every new
  skill is picked up with no manifest edit, so the "stale entry = silently missing skill"
  risk goes away. *[verify with `claude plugin validate` before relying on it]*
- **The repo is its own marketplace.** A `.claude-plugin/marketplace.json` at the repo
  root with `source: "./"` makes `smileynet/grey-matter` installable straight from GitHub.
  Nothing has to be built or published.
- **agy already set the shape.** The agy builder has the discovery, the lint and the
  git-tag version. The Claude package reuses that logic instead of writing a third copy.

## Proposed shape

```
.claude-plugin/
  plugin.json        # name, version, description, skills: [3 bucket dirs], hooks
  marketplace.json   # owner: smileynet; plugins: [{ name: grey-matter, source: "./" }]
hooks/
  hooks.json         # SessionStart + PreToolUse (below), both guarded
  session-start.mjs
  pre-push-gate.mjs
agents/              # optional, phase 3
```

```json
{
  "name": "grey-matter",
  "version": "0.1.0",
  "description": "Agent skills for game-centric and app development: engineering, productivity, meta. Start with compass.",
  "author": { "name": "Sam Biggins" },
  "repository": "https://github.com/smileynet/grey-matter",
  "license": "MIT",
  "skills": ["./skills/engineering", "./skills/productivity", "./skills/meta"]
}
```

Install for users:

```
/plugin marketplace add smileynet/tkt
/plugin marketplace add smileynet/grey-matter
/plugin install grey-matter@grey-matter
```

For local development, `claude --plugin-dir .` loads the working tree directly.

## What the plugin carries, in phases

### Phase 1: skills only (closes ticket 22)

- `plugin.json` and `marketplace.json` as above.
- **A check-repo invariant**: the manifest parses, its `skills` dirs exist, and every skill
  folder on disk sits under one of them. It shares discovery with
  `check-docs-consistency.mjs`. This is ticket 22's set-equality lint. Listing bucket dirs
  makes it smaller, but it still catches a fourth bucket added without a manifest edit.
- **Versioning: hand-bump, with a check.** Claude Code caches plugins by version, so an
  unchanged version means installed users never see updates. The `release` skill already
  cuts tags. It also bumps `plugin.json` there, and check-repo fails when `plugin.json`'s
  version is behind the latest `vX.Y.Z` tag. Changesets/npm stays deferred, as proposal 03
  allowed.

### Phase 2: hooks (the reason to have a plugin and not only an install path)

Every hook is **guarded to grey-matter-shaped repos**, because a plugin installed for the
user runs in every project:

| Hook | Guard | Does | Replaces / closes |
| --- | --- | --- | --- |
| `SessionStart` | `.tickets/` exists and `tkt` is on PATH | adds `tkt ready --brief` and in-progress tickets to context; nudges once if `scripts/install-hooks.mjs list` shows the pre-commit hook missing | ticket 44 (orient nudge), with no change to orient's SKILL.md |
| `PreToolUse` on `Bash` matching `git push` | `scripts/check-repo.mjs` exists | runs it; on a nonzero exit, blocks the push and shows the failing invariant | the agent half of ticket 60's pre-push gate (a git hook still covers human pushes) |

Both hooks are Node scripts, not shell scripts, for the same Windows reasons as the installer.
Both stay advisory or blocking only as stated above. Neither changes files.

### Phase 3: optional agents

`code-review` already runs Standards and Spec reviews as parallel sub-agents. As plugin
`agents/` (`standards-reviewer`, `spec-reviewer`), each would have a fixed tool set
(read-only) and a stable prompt rather than being redefined on every run. Do this only if
reviews show drift. It is Claude-only, so the skill must still work without the agents.

## Things that need deciding

1. **Namespacing changes how skills are invoked.** Plugin skills are `grey-matter:<name>`.
   This fixes a known wart: the plugin's `code-review` would stop shadowing Claude's bundled
   `/code-review` (see `harnesses.md`). But users type `/grey-matter:code-review`, and any
   skill text that names another skill as `/orient` needs checking. Proposed: refer to
   skills by bare name in SKILL.md (as most already do) and let the model resolve it. Then
   probe one orchestrating skill (`wrap-session` calling `reconcile-tickets`) live under
   the plugin.
2. **Double listing.** If the installer has already copied skills into `~/.claude/skills/`,
   each skill shows up twice (bare and namespaced). Proposed: when the plugin is the Claude
   path, `install-skills.mjs` drops `~/.claude/skills` from its default roots and prints a
   one-line "installed via plugin" note. It never deletes a foreign dir. The existing
   `uninstall` cleans up our own manifest-tracked copies.
3. **Invocation sidecars.** `disable-model-invocation` lives in SKILL.md frontmatter, so it
   carries over unchanged. Check that `check-invocation-policy.mjs` needs no plugin-specific
   case.
4. **`global/AGENTS.md` stays separate.** A plugin can't write `~/.claude/CLAUDE.md`, and
   copying those rules into context from a SessionStart hook would duplicate them for anyone
   who already ran `install-agents-md.mjs`. Keep that installer.
5. **Public identity.** Marketplace and plugin are both named `grey-matter`, with owner
   `smileynet`. Confirm this before the first tag.

## Recommendation

Do phase 1 now. It is small: two JSON files, one check-repo invariant, a step in the
release skill, and an installer default change. It also gives Claude Code, the primary
harness, an install path that updates from GitHub. Do phase 2 as a follow-up ticket,
because the hooks are what a plugin can do that a skill copy can't. Leave phase 3 parked
until there is evidence it's needed.
