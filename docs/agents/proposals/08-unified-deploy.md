# Proposal 08: one deploy mechanism across projects

**Status:** proposal for review. **Scope:** grey-matter, tkt, and every sibling repo that
ships skills.

Each project that ships skills now has its own deploy code, and the copies drift. This
proposal makes the project declare *what* it ships and puts one deployer, owned by
grey-matter, in charge of *where and how*: harness roots, plugin packaging, ownership, and
the dual-deploy guard.

## Why now: what one session turned up (2026-10-22/23)

- **The same guard, written twice.** The dual-deploy guard (proposal 07 follow-ups:
  grey-matter ticket 62, tkt ticket 210) went into `install-skills.mjs` and then again into
  tkt's `deploy-skills.sh`. The bash copy had a bug the Node copy didn't: under
  `set -euo pipefail`, a `grep` with no match ended the script silently, so a deploy on a
  machine without the plugin copied nothing. Tests caught it before it shipped.
- **agy packaging, written twice.** `build-agy-plugin.mjs` and `deploy_agy_plugin()` in
  `deploy-skills.sh` do the same job.
- **Two hard-coded harness root lists.** They match today, but nothing keeps them in sync.
- **Two ways to bump the release version.** `release.sh` step 1b in grey-matter,
  `pre-release-replacements` in tkt.
- **Leftover copies nobody owns.** `~/.agents/skills` holds 43 dirs that neither installer's
  manifest claims (crew-research leftovers such as `adr-authoring`, `read-handoff`,
  `verification-protocol`). Nothing reports them.
- **A harness can still see a skill twice.** OpenCode reads `~/.claude/skills`,
  `~/.agents/skills` and `~/.config/opencode/skills`, and both installers copy into the first
  two. The plugin guard only hides this while the Claude plugin is installed.

## Current mechanisms

| | grey-matter | tkt | godot-helper | crew-research (retired) |
| --- | --- | --- | --- | --- |
| Code | `install-skills.mjs`, `build-agy-plugin.mjs`, `install-agents-md.mjs`, `install-hooks.mjs` (Node) | `tools/deploy-skills.sh` (bash 4: `declare -A`) | `scripts/propagate-skills.{sh,ps1}` | none in use |
| What it does | copies skills to harness roots; packages agy + Claude plugins | the same, flat layout | copies 5 shared skills into a *child repo* | left 43 unowned dirs behind |
| Layout | `skills/<bucket>/<name>` | `skills/<name>` | `.kiro/skills/<name>` | n/a |
| Ownership manifest | `.installed-by-grey-matter.json` (JSON) | `.installed-by-tkt.json` (JSON written and read with `sed`) | none | none |
| Lints | name==dir, unique across buckets | the same, plus "tkt skills name no non-tkt skill" | none | n/a |
| Dual-deploy guard | yes (ticket 62) | yes (ticket 210) | n/a | n/a |
| Tests | `install-skills.test.mjs` | `tests/deploy_skills.rs` | none | n/a |
| Manifest checks | `check-plugin-manifest.mjs` | `tests/plugin_manifests.rs` | n/a | n/a |

Ten other sibling repos ship skills (`game-slicer` 16, `godot-helper` 14, `teach-me` 13,
`lacrosse-bosse-helper` 12, `overseer` 9, ...) with no deploy step at all. Their skills reach a
harness only by hand, or by riding along as project skills.

## Proposal

### 1. The project declares one manifest: `.claude-plugin/plugin.json`

It already carries `name`, `version` and `skills` (which dirs hold skills). Settings that
only the deployer needs go under `metadata.deploy`. Claude Code ignores `metadata`. For example:

```json
"metadata": { "deploy": {
  "forbidRefs": ["frontier-work", "read-handoff", "to-tickets"],
  "rules": "global/AGENTS.md"
} }
```

The agy `plugin.json` is generated from this file, not hand-kept, so tkt's root `plugin.json`
goes away and so does one of its two version bumps. A repo that ships skills but isn't a
Claude plugin gets the same file with only `name` and `skills`.

### 2. One deployer, `deploy.mjs`

It's a single dependency-free Node file, grown out of `install-skills.mjs`, which already has
the ownership rules, tests and Windows handling. It has one table of harnesses:

```js
{ harness: "opencode", kind: "copy", root: "~/.config/opencode/skills",
  reads: ["~/.config/opencode/skills", "~/.claude/skills", "~/.agents/skills"] }
{ harness: "claude",   kind: "plugin", reads: ["~/.claude/skills", "<proj>/.claude/skills", "<proj>/.agents/skills"] }
{ harness: "agy",      kind: "plugin", root: "~/.gemini/config/plugins" }
```

- **Each harness sees each skill once.** From `reads`, the deployer picks a set of roots so
  that no harness sees a skill twice. It counts plugins too. This replaces the Claude-only
  guard and fixes the OpenCode overlap.
- **One ownership model:** the manifest format, prune, refuse-foreign, `--force`, `list`,
  `uninstall` and `--dry-run`, as today.
- **Lints:** name==dir and unique names, plus the project's `forbidRefs`.
- **Packages:** builds and installs the agy plugin and validates the Claude plugin. This
  retires `build-agy-plugin.mjs` and `deploy_agy_plugin()`.
- **`check`:** the manifest version isn't behind the latest tag, every skill dir is listed,
  and the generated agy manifest is current. This replaces `check-plugin-manifest.mjs`;
  `tests/plugin_manifests.rs` can call it.
- **`audit`:** across every root, lists unowned dirs, skills that share a name across packs,
  and harnesses that see a skill twice. It names the 43 crew-research leftovers rather than
  deleting them.

### 3. Each project vendors the deployer; grey-matter keeps it current

tkt must keep working for someone who has tkt but not grey-matter, the same rule its
`forbidRefs` lint enforces. So tkt can't call into a grey-matter checkout. Instead, each
project keeps a copy at `tools/deploy.mjs` with a version header
(`// deploy.mjs 1.0.0 (grey-matter)`):

- `deploy-skills.sh` shrinks to `node tools/deploy.mjs "$@"`, which drops the bash-4
  requirement.
- `conformance-audit`, and `sync` in portfolio mode, report a vendored copy older than
  grey-matter's.
- The copy carries its own tests (tkt's `tests/deploy_skills.rs` keeps working against it).

### 4. Deploy across projects from one place

`sync` (or `deploy.mjs --portfolio <list>`) deploys every registered pack with the same
deployer. The list is a short file in grey-matter that names sibling repos. Name uniqueness is
then checked **across packs**, not only within one, so two packs shipping `testing-guide`
fail at deploy time instead of one silently refusing the other. That's the case
`godot-helper` and crew-research both have today.

## Out of scope

- **godot-helper's propagation** copies a skill's *source* into a child repo, which is
  vendoring, not deploying to a harness. It could adopt the same ownership manifest later,
  but it stays its own tool.
- **Publishing the deployer to npm.** Vendoring is enough while the user and maintainer are
  the same person. Revisit if a second maintainer appears.

## Phases

1. **grey-matter:** `install-skills.mjs` becomes `deploy.mjs`, reading `plugin.json`, with the
   harness table, the per-harness dedupe, agy packaging folded in, and `check` and `audit`.
   The current tests carry over, plus cases for the OpenCode overlap and unowned leftovers.
2. **tkt:** vendor `deploy.mjs`. Move the forbidden-reference lint into `metadata.deploy`,
   generate the agy manifest, and make `deploy-skills.sh` a wrapper. tkt's CI needs Node,
   which ubuntu-latest has.
3. **Portfolio:** the list of registered packs, cross-pack name checks, a vendored-drift check
   in `conformance-audit`, and `audit` across this machine's roots. Then decide what to do
   with the 43 crew-research leftovers, using the existing `uninstall-crew-research.mjs`.

## Decisions needed

1. **Vendor or depend:** vendored `tools/deploy.mjs` with a drift check (recommended), or tkt
   requires a grey-matter checkout for maintainer deploys.
2. **tkt takes on Node** for maintainer deploys, replacing bash 4. Users of the tkt CLI and its
   plugin need neither.
3. **Where the portfolio list lives:** in grey-matter (recommended) or in `~/.config`.
