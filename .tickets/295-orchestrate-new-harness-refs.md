---
id: "295"
title: "Add orchestrate harness references for Qwen Code, DSH, and OpenCode 2.x, and refresh harness-kimi.md"
status: in_progress
blocked_by: []
validation_criteria:
  - "harness-qwen.md, harness-dsh.md, and harness-opencode.md exist under skills/engineering/orchestrate/references/ and are linked from orchestrate/SKILL.md"
  - "harness-kimi.md includes 2026-11-25 surface notes for Kimi Code CLI 2.7.3 and Kimi K3.1 Pro"
  - "node scripts/check-docs-consistency.mjs passes with zero broken links"
tags: ["stream:orchestration", "kind:enhancement"]
---

# Add orchestrate harness references for Qwen Code, DSH, and OpenCode 2.x, and refresh harness-kimi.md

## What to build

Extend `skills/engineering/orchestrate/` so operators running on our newly built/upgraded harnesses have dedicated harness references matching the existing six (`claude`, `codex`, `kimi`, `kiro`, `kirocrew`, `agy`):

1. Add `skills/engineering/orchestrate/references/harness-qwen.md` (covering `<ext>:<skill>` naming, `tools.executionSandbox` worktree `.git` & `Skill` caveats, folder trust for hooks, and Qwen4-Max / Qwen3.8 / non-thinking Qwen3-Coder-Next notes).
2. Add `skills/engineering/orchestrate/references/harness-dsh.md` (covering Cordis subagent/sandbox dispatch, DeepSeek-V4.1-Flash 50x KV-cache prefix hygiene, monotonic `ctx.tools.guard()`, and MCP media limits).
3. Add `skills/engineering/orchestrate/references/harness-opencode.md` (covering V2 `subagent` tool & `permissions` array, `--standalone` + `-m provider/model#variant`, `opencode session export`, and GLM-5.4 marathon-thinking guards).
4. Refresh `skills/engineering/orchestrate/references/harness-kimi.md` with `Current surface notes (2026-11-25, Kimi Code CLI 2.7.3 / Kimi K3.1 Pro)`.
5. Link all three new references from `skills/engineering/orchestrate/SKILL.md` step 2.

## Acceptance criteria

- [ ] `harness-qwen.md`, `harness-dsh.md`, and `harness-opencode.md` exist under `skills/engineering/orchestrate/references/` and are linked from `skills/engineering/orchestrate/SKILL.md`.
- [ ] `harness-kimi.md` includes `2026-11-25` surface notes for Kimi Code CLI `2.7.3` and Kimi K3.1 Pro.
- [ ] `node scripts/check-docs-consistency.mjs` passes with zero broken links.
