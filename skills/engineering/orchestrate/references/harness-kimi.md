# Kimi

Default to **sequential in-session execution**. Do not use the Agent tool or launch any delegated worker unless the user explicitly requests delegation for the current work. A general authorization to implement a ticket does not authorize subagents.

When delegation is not authorized, admit one ticket at a time and use the ordinary in-session implementation path. If a consequential change requires an independent reviewer, report that the review needs explicit delegation authorization rather than substituting a self-review.

When the user explicitly requests delegation, inspect the currently exposed Agent capabilities and session restrictions before dispatch. Use only supported worker lifecycles and bounded waits. If isolated background workers or event waits are unavailable, continue sequentially; never create replacement processes or provider sessions to simulate them.

Kimi has no qualified grey-matter native notification adapter. Keep dispatch and recovery records in the project scratch directory and report through the current conversation. A saved message or scheduled task is not delivery unless the active Kimi surface confirms it.

Use the harness's actual rendering surface for dashboard updates. Do not create a persistent widget or dashboard, schedule future work, or publish content unless the user separately requests it.

## Current surface notes (2026-11-25, Kimi Code CLI 2.7.3 / Kimi K3.1 Pro)

- **Code CLI vs Work:** Kimi Code CLI (`kimi` `2.7.3`) reads `~/.kimi-code/skills`
  and `~/.agents/skills`, loads `~/.kimi-code/AGENTS.md`, supports live `/reload`,
  and exposes 7 fail-open hook events; Kimi Work loads the packaged `.kimi-plugin`
  (with `commands/*.md` shims for `disable-model-invocation: true` skills).
- **Model behavior (Kimi K3.1 Pro / K3):** Thinking is always enabled and defaults
  to `reasoning_effort: "max"` (`low|high|max`); lower effort to `low` for routine
  tasks when the surface allows it. Preserved thinking requires unaltered
  `reasoning_content` echo with `temperature = 1.0`, `top_p = 0.95`. Match
  coding-plan overload retries on HTTP/error codes rather than English text.
- **Windows / Electron note:** Inside Kimi Work (`ELECTRON_RUN_AS_NODE=1`), run
  Node gate/build scripts with a real Node 22+ binary rather than respawning
  `Kimi.exe`, and use `register_personal.py` instead of `register_personal.sh`
  under Git Bash.
