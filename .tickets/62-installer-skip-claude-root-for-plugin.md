---
id: "62"
title: "install-skills: stop defaulting to ~/.claude/skills once the Claude plugin is the install path"
status: open
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

- [ ] install-skills.mjs default roots no longer include ~/.claude/skills when the grey-matter Claude plugin is installed (or via a documented flag), and it prints a one-line note instead
- [ ] never deletes a foreign dir; existing manifest-tracked copies are removable with uninstall --root ~/.claude/skills
