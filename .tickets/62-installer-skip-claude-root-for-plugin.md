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

TBD

## Acceptance criteria

- [ ] TBD
