# Antigravity (agy)

For app watching or answering, read [GUI watch qualifications](gui-watch.md).
App subagent views and CLI approval/usage controls are separate surfaces.

Source: [ticket 129 results](../../../../docs/agents/research/harness-orchestration-primitives.md#spike-results-agy-2026-10-31),
observed 2026-10-31 on 1.4.12/Windows. Recheck current tools and account features.

- Define a worker with writable tools, then invoke_subagent with its role,
  prompt, model tier and Workspace branch. Native branch isolation created a
  worktree cut from HEAD with a generated subagent branch name. Verify base
  and merge by the returned SHA rather than assuming a tkt branch name.
- Completion messages are event-driven. Keep the parent alive while workers
  run; one early probe ended with a worker still active. Send_message to the
  conversation id woke a questioning worker in the same worktree.
  Headless -p skips the interactive question picker, so QUESTION must travel
  in the status line.
  An external driver can use paired stream-json with an explicit `--print=`;
  see [ticket 162](../../../../docs/agents/research/harness-experimental-features-20261101.md#ticket-162-headless-driver-probes-2026-11-02).
  Inspect native denied actions and tool states: exit 0 and an empty SUCCESS
  result coexisted with automatic command denial. They do not establish DONE.
- Headless shell calls failed closed. Narrow command allow rules did not work in
  the spike; only a session command(*) rule in a user-approved disposable fixture
  succeeded. Do not broaden production permissions to reproduce that result.
  Use interactive approvals, an independently verified narrow policy, or hold
  dispatch until permissions are available. Auto mode was unavailable to this
  account, even though later docs described Windows support.
- A reviewer defined with EnableWriteTools false had no edit/write/shell tools;
  this is the observed read-only mechanism. The Auto command reviewer was
  unavailable for comparison.
- Model flash was accepted but the served child model was not recorded.
  Report selection as requested, not verified. Only three in flight were tested;
  keep the portable cap instead of treating documented depth as concurrency.
- Trunk and PR landing passed. Protect ticket/dashboard bookkeeping under the
  same landing mode as code. Terminal updates used ASCII; dashboard entries
  passed the delivery-dashboard checker.
- Native worktrees outlived the headless run. Inspect/remove merged worktrees
  and generated branches manually; keep human-blocked work. T5 escalated
  without deletion in the spike, but the admission-time authorization check
  remains necessary across harnesses.

P3 fallback: interactive approval or verified narrow rules. P6 fallback: keep
the orchestrator awaiting events through all live workers. P8 limitation:
requested model only; never claim proof of the served model.

## Current surface notes (2026-11-25, agy 1.5.16 / App 2.35.0)

- **Slash-command collision:** Antigravity ships a built-in `/grill-me` command.
  Invoke grey-matter's skill explicitly as `/grey-matter:grill-me` when you mean
  the plugin skill.
- **Commands & surfaces:** `run_command` supports `NotificationTimeoutSeconds`
  wakeups (1.5.17+) instead of polling timers. `/generative_ui` interactive HTML
  widgets exist only in the Antigravity App (not CLI); keep committed
  `docs/status.html` as the portable dashboard artifact.
- **Plugin hooks & rules:** Antigravity `hooks.json` uses named top-level hook
  IDs, camelCase stdin, and `injectSteps` stdout; never inject static context on
  `PreInvocation` (each injected step persists in history). Plugin `rules/*.md`
  require snake_case `trigger:` values (`always_on`, `glob`, etc.) or are
  silently discarded.
