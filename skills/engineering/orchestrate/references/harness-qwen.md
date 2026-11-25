# Qwen Code

Source: [Qwen Code plugin compat](../../../../docs/agents/research/qwen-code-plugin-compat-20261125.md)
and [harness & model optimization](../../../../docs/agents/research/harness-model-optimization-20261125.md),
observed 2026-11-25 on `@qwen-code/qwen-code` `v0.28.4` (CLI / Desktop / Web Shell).
Inspect live tool schemas and approval mode before dispatching workers.

- **Extension skill naming:** Extension skills register strictly as `<ext>:<skill>`
  (for example `grey-matter:tdd`, `tkt:tkt-work`) with **no bare alias**. When
  dispatching subagents or referencing skills in worker briefs, name the qualified
  `<ext>:<skill>` form listed in `<available_skills>`.
- **Subagents & worktree confinement:** Check whether `tools.executionSandbox` is
  active before admitting parallel worktree workers. In confined sandbox mode, the
  model `Skill` tool is unavailable and linked Git worktrees mount the common `.git`
  directory read-only — blocking `git commit` and `tkt` mutations inside worktrees.
  Fall back to sequential in-session execution (or an explicit unsandboxed checkout)
  when confined worktrees cannot commit.
- **Hooks & trust:** Project and extension hooks require folder trust even in `-p` /
  YOLO runs; verify `tkt` hooks are active before assuming deterministic write guards.
  Extension `rules/*.md` are conditional on `paths:` globs and load only when matching
  files are touched.
- **Models & output budgets:**
  - `Qwen4-Max` (1M context, multimodal): `max_tokens` caps thinking + visible output
    combined; keep worker briefs scoped so reasoning does not exhaust output limits.
  - `Qwen3.8-Max` / `Qwen3.8-2.4T-A95B`: thinking defaults to `xhigh` with preserved
    `reasoning_content`; lower effort for routine/read-only fan-out.
  - `Qwen3-Coder-Next` (256K, **non-thinking only**): emits no `<think>` block; keep
    explicit plan-then-verify checkpoints in the worker brief.
- **Notifications:** Qwen Code has no qualified grey-matter native notification
  adapter. Keep dispatch and recovery records in the main checkout's `.scratch/`
  directory and report through the current conversation.
