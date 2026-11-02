# Codex

Source: [ticket 127 results](../../../../docs/agents/research/harness-orchestration-primitives.md#spike-results-codex-2026-10-31),
observed 2026-10-31 on CLI 0.166. Use the current exposed schema over old examples.

- Dispatch `spawn_agent` with the worker contract. Current app collaboration
  tools share the parent's filesystem: explicitly assign one worktree per worker.
  Use the app's worktree tool when available; otherwise manual git worktree
  isolation, or top-level `codex exec -C <worktree>` for process isolation.
- Current tool names may include `followup_task`, `send_message`, `wait_agent`
  and `list_agents`; older versions use send_input. A message can reach a running
  agent, while followup_task wakes an idle one with its context.
- Use bounded event waits and reread the tracker after each wake. Follow the
  host's wait budget. Never keep a tool wait longer than the host allows merely
  because the old CLI accepted a one-hour timeout.
- Children inherit sandbox/approvals; an agent definition cannot expand them.
  workspace-write did not permit Git metadata writes in the spike.
  The CLI's then-available approve-for-me setting worked under user approval;
  inspect today's CLI help rather than copying that flag. Resolve permissions
  through the host's approval mechanism; do not select bypass as a workaround.
- For a consequential spec review, spawn a genuinely read-only reviewer with the
  ticket. `codex review --base <base>` caught a behavior regression and left a
  clean tree, but its base mode could not take a custom ticket prompt.
- The source defaults said six threads/depth one; eight spawns and a grandchild
  were accepted in the spike, without proving eight ran concurrently.
  Use the live session's advertised cap (including review slots) and no nested
  orchestration. Fresh model/effort overrides depend on the current fork schema;
  the spike confirmed the requested cheaper child model in its rollout.
- Verify every DONE SHA is new and belongs to the assigned worktree; one probe
  reported an old SHA. Both landing modes passed; tkt claims sometimes changed
  status before a sandbox Git failure, so inspect persisted status before retry.
- CLI chat visuals used ASCII and a valid dashboard. App rendering was not
  probed: use supported inline media/widgets, or a usable dashboard link with a
  clearly labeled textual visual. Do not claim an unobserved app render.
- There was no close-agent tool in 0.166. Close only if today's tool exists;
  otherwise report settled workers. Inspect/remove owned merged worktrees.

If shell calls fail with a missing code-mode-host error, verify the executable
installation: the spike used the vendored binary with its adjacent helper after
the Bun shim failed. This is an installation failure, not worker progress.
