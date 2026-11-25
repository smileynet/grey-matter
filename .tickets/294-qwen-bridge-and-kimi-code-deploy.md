---
id: "294"
title: "Add Qwen QWEN.md qualified-name bridge, promote Kimi Code CLI in deploy/install-agents-md, and trim long skill description"
status: in_progress
blocked_by: []
validation_criteria:
  - "deploy.mjs qwen build emits QWEN.md bridge with contextFileName in staged qwen-extension.json (unit-tested)"
  - "deploy.mjs HARNESSES() and install-agents-md.mjs manage kimi-code (~/.kimi-code/skills and ~/.kimi-code/AGENTS.md) with duplicate protection (unit-tested)"
  - "repository-artifact-hygiene SKILL.md description is <= 500 chars with trigger front-loaded"
tags: ["stream:tooling", "kind:enhancement"]
---

# Add Qwen QWEN.md qualified-name bridge, promote Kimi Code CLI in deploy/install-agents-md, and trim long skill description

## What to build

Close three distribution and catalog-hygiene gaps for Qwen Code, Kimi Code CLI, and DSH:

1. `scripts/deploy.mjs` (`1.12.0`): in `qwenDeploy()` for staged (non-native-root) extensions, generate a concise `QWEN.md` bridge and set `contextFileName: "QWEN.md"` in `qwen-extension.json` so Qwen Code resolves bare skill references to `<ext>:<skill>` (since Qwen registers no bare aliases for extension skills). Include `QWEN.md` in `projectionMatches` for idempotency.
2. Promote Kimi Code CLI (`kimi-code`) to a first-class harness in `scripts/deploy.mjs` (`HARNESSES()` + `doAudit()` using `$KIMI_CODE_HOME/skills` and `.kimi-code/skills`) and `scripts/install-agents-md.mjs` (`$KIMI_CODE_HOME/AGENTS.md`), with regression tests in `scripts/deploy.test.mjs` and `scripts/install-agents-md.test.mjs`, and document both in `docs/agents/harnesses.md` and `docs/agents/distribution-maintenance.md`.
3. Trim `skills/meta/repository-artifact-hygiene/SKILL.md`'s frontmatter `description` from 581 chars to <= 500 chars (surviving DSH's 500-char catalog truncation) with the primary trigger front-loaded inside the first 140 chars.

## Acceptance criteria

- [ ] `deploy.mjs qwen build` emits `QWEN.md` with `contextFileName: "QWEN.md"` in staged `qwen-extension.json` (`node --test scripts/deploy.test.mjs` passes).
- [ ] `deploy.mjs` and `install-agents-md.mjs` manage `kimi-code` (`~/.kimi-code/skills` and `~/.kimi-code/AGENTS.md`) with duplicate protection (`node --test scripts/deploy.test.mjs scripts/install-agents-md.test.mjs` passes).
- [ ] `skills/meta/repository-artifact-hygiene/SKILL.md` description is <= 500 chars with the trigger front-loaded.
