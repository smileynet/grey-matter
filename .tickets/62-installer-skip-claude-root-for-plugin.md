---
id: "62"
title: "install-skills: stop defaulting to ~/.claude/skills once the Claude plugin is the install path"
status: done
blocked_by: []
priority: low
validation_criteria:
  - "install-skills.mjs default roots no longer include ~/.claude/skills when the grey-matter Claude plugin is installed (or via a documented flag), and it prints a one-line note instead"
  - "never deletes a foreign dir; existing manifest-tracked copies are removable with uninstall --root ~/.claude/skills"
tags: ["stream:tooling"]
---

# install-skills: stop defaulting to ~/.claude/skills once the Claude plugin is the install path

## What to build

Since ticket 22, Claude Code can install grey-matter as a plugin. `scripts/install-skills.mjs`
still copies every skill into `~/.claude/skills/` by default, so a user with both sees each
skill twice: once bare (`code-review`) and once namespaced (`grey-matter:code-review`). The bare
copy also keeps shadowing Claude's bundled `/code-review`. Proposal 07, decision 2.

Drop `~/.claude/skills` from the default roots when the plugin is the Claude path. Detect that
from `claude plugin list --json` if it's reliable, or else add an explicit flag. Print a one-line
note when the root is skipped. tkt's `tools/deploy-skills.sh` has the same overlap; it's tracked
in tkt.

## Acceptance criteria

- [x] install-skills.mjs default roots no longer include ~/.claude/skills when the grey-matter Claude plugin is installed (or via a documented flag), and it prints a one-line note instead
- [x] never deletes a foreign dir; existing manifest-tracked copies are removable with uninstall --root ~/.claude/skills

## Resolution (2026-10-23)

done: dual-deploy guard in install-skills.mjs; tkt's deploy-skills.sh got the same guard (tkt ef92009).

### Verification
1. ✓ install-skills.mjs default roots no longer include ~/.claude/skills when the grey-matter Claude plugin is installed (or via a documented flag), and it prints a one-line note instead — "install-skills.mjs reads installed_plugins.json (CLAUDE_CODE_PLUGIN_CACHE_DIR or ~/.claude/plugins); with grey-matter@* installed it skips every Claude-read root and prints 'skipped: Claude plugin grey-matter@grey-matter is installed; --allow-dual to copy anyway'. Live dry run on this machine skips ~/.claude/skills; kiro/codex/agents roots still install."
2. ✓ never deletes a foreign dir; existing manifest-tracked copies are removable with uninstall --root ~/.claude/skills — "Only manifest-tracked copies are removed from a skipped root (test: foreign dir survives); uninstall --root ~/.claude/skills still works (used live 2026-10-23 to remove 44 copies). install-skills.test.mjs 9/9."
