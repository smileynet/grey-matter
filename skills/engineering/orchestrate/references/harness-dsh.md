# DeepSeek Harness (DSH)

Source: [DSH plugin compat](../../../../docs/agents/research/dsh-plugin-compat-20261125.md)
and [harness & model optimization](../../../../docs/agents/research/harness-model-optimization-20261125.md),
observed 2026-11-25 on `@deepseek-ai/dsh` `0.2.2-rc.5` (developer preview; Cordis
microkernel). Inspect live subagent and sandbox tools before dispatching workers.

- **Subagent dispatch:** DSH supports in-process fresh/fork subagents and
  out-of-process `acp` / `codex` / `claude-code` / `dsh-sdk` children under
  `bwrap`/Landlock/Seatbelt/Windows ACL sandboxes. Keep each worker on its own Git
  worktree and verify the worker's worktree root and base SHA before its first edit.
  Do not cross providers unless the project's `AGENTS.md` provider-fallback policy
  explicitly opts in.
- **KV-cache prefix hygiene (DeepSeek-V4.1-Flash):** V4.1's Sliding Window Attention
  gives a 50x disk KV-cache hit discount (`$0.003/M` vs `$0.15/M`) only when the
  system prompt and tool prefix stay byte-identical across turns. Never mutate system
  instructions mid-session; pass per-turn or per-ticket dynamic context in user
  messages (`latest_reminder` / `<system-reminder>`), and do not re-inject startup
  context on `source === "resume"`.
- **Models & prompting:** `deepseek-flash` (`DeepSeek-V4.1-Flash-1017`, 1M ctx,
  vision) is the `dsh-base` default; thinking is enabled by default (`high`),
  system prompts and mid-conversation system messages are first-class, and
  `temperature` is silently ignored in thinking mode. `ctx.tools.guard()` vetoes
  are monotonic and synchronous (cannot be overridden by later hooks).
- **MCP & skill limits:** DSH strips credential env vars from MCP children and
  discards MCP image/audio blocks (verify visual artifacts natively with V4.1 vision
  rather than MCP image tools). Skill catalog descriptions truncate at 500 chars.
- **Notifications:** DSH has no qualified grey-matter native notification adapter.
  Keep dispatch and recovery records in the main checkout's `.scratch/` directory
  and report through the current conversation.
