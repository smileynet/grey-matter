# Claude Code

For native GUI watching or answering, read [GUI watch qualifications](gui-watch.md).
Agent View is CLI/TUI; distinguish it from the Desktop session sidebar.

For an admitted owned, tool-free CLI qualification, load the
[stream protocol contract](claude-stream.md). It uses one ephemeral process and
exact UUID-correlated input/result events; source tests do not establish native
delivery or disk persistence. Use the [shared owned-client binding](native-notification.md#existing-owned-client-handoff)
only with that exact held process after persisted attempt-start. It cannot attach
to an existing user's chat. Keep the manual reporting fallback until qualified.

Source: [ticket 125 results](../../../../docs/agents/research/harness-orchestration-primitives.md#spike-results-claude-code-2026-10-31),
observed 2026-10-31 on 2.1.316. Inspect live tool schemas before using these names.

- Dispatch the Agent tool with explicit role/model, background execution and
  `isolation: worktree`. Run from the intended base branch; with a remote, native
  isolation defaults to origin's default branch. Use `worktree.baseRef: "head"`
  when the intended base is local HEAD. Verify the child's base SHA.
- Pre-authorize scoped writes and shell commands before dispatch. Headless
  background children fail unlisted commands immediately. Plain single commands
  are easier to authorize than pipes, variables and loops.
- Await completion notices. `SendMessage` resumes an idle worker, but native
  isolation removes an empty worktree when a questioning worker ends. Check it
  exists before resuming; otherwise redispatch with the recorded ANSWER.
- Define consequential reviewers with only Read/Grep/Glob tools. Tool removal
  held under default and auto parent modes; permissionMode alone is weaker
  because parent modes override it. bypassPermissions was not tested and is
  not a fallback. Our code-review skill shadows Claude's built-in command.
- Requested child models were confirmed in modelUsage. No cap appeared with
  22 short agents, which did not prove simultaneous execution; keep the portable
  cap and reserve reviewer capacity.
- Native branches have worktree-agent names. Verify/merge by SHA. Serial merges
  and both trunk/PR code landing passed. In PR-only projects, tkt auto-push and
  dashboard commits also need a protected-branch-compatible route before claim.
- Use delivery-dashboard's schema, not a copied field list: the old spike's
  entries failed its visual contract despite successful code landing.
  Terminal updates use ASCII; the desktop spike rendered a widget. Confirm
  rendering in the actual surface before calling the visual delivered.
- Remove retained clean/landed worktrees with one plain command each after
  content inspection; preserve dirty or human-blocked workers.

P3 fallback: scoped pre-authorization or interactive approval, never automatic
permission broadening. P5 fallback: fresh worker with ANSWER. P11 fallback:
valid dashboard visual plus terminal ASCII when a GUI renderer is unavailable.
Desktop side sessions are for user-visible work, not the default worker transport.
