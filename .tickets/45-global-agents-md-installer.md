---
id: "45"
title: "Global AGENTS.md: author the 6-line guardrail+shim file and install it per harness (manifest-tracked, no clobber)"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "Global AGENTS.md source exists in repo, <=3KB, matches proposal 04 draft"
  - "install-skills.mjs (or sibling) installs it to kiro/codex/claude/opencode user paths, manifest-tracked, refuses to clobber a foreign file, supports --dry-run/list/uninstall"
  - "check-repo.mjs covers it (size budget + installer ownership test)"
tags: ["type:enhancement", "stream:migration"]
---

# Global AGENTS.md: author the 6-line guardrail+shim file and install it per harness (manifest-tracked, no clobber)

## What to build

TBD

## Acceptance criteria

- [ ] TBD
