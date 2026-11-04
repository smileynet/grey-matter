# kiro-cli

For IDE watching or answering, read [GUI watch qualifications](gui-watch.md).
Agent Focus documentation does not establish attachment of a CLI/ACP worker.

For an admitted owned V2 ACP qualification, load the [protocol contract](kiro-acp.md).
Source tests cover negotiated routing and protocol refusal, not native agent-profile,
model, delivery or teardown qualification. Use an actual parent-owned session,
tool-free task profile and denied client capabilities; no foreign-client attachment.
Convert the stored attempt action through the [shared owned-client binding](native-notification.md#existing-owned-client-handoff)
using that exact live process and negotiated session before prompting.
The V3 shutdown procedure below remains separate and is not resolved by this module.

Source: [ticket 126 results](../../../../docs/agents/research/harness-orchestration-primitives.md#spike-results-kiro-cli-2026-10-31),
observed 2026-10-31 on 2.34. Compare with the installed engine's live tools.

- V2's native subagent batch ran concurrent stages, with a model per stage and a
  blocking event wait. It returns only each stage's summary; require the status
  line in that summary. One fatal stage (such as an unavailable model) cancelled
  siblings. Validate model availability before batching.
- Use one top-level `kiro-cli chat --no-interactive --agent <role> --model <model>`
  per isolated worktree when independent process lifetimes are needed. V2's shell
  had no background option: use sequential foreground process exits there.
  V3 offered run_in_background, but notification on exit was not observed.
  Without a verified event wait, choose sequential execution, not sleep polling.
- Native sub-agents share cwd; give each an explicit manual worktree and base SHA.
  The worker must use absolute paths or start in that checkout before edits.
- Approvals are the child's own config on V2; allowedTools is not inherited.
  V3 enforces the stricter parent/child policy. Pre-authorize each required path
  and command on both sides. Headless missing permissions fail fast.
  Use a deny policy for destructive operations: the spike's T5 Haiku worker
  tried three deletion spellings despite the brief, and only tool rules stopped it.
  Hold that fixture ticket before dispatch when those rules are unavailable.
  Preflight the exact command shapes, including `git -C` and working-directory
  prefixes: an allowlist for bare Git subcommands may reject those forms.
  A shell denial blocks claims and isolation as well as implementation. Workers
  report it without changing profiles or writing a substitute checkout.
- A questioning native sub-agent cannot resume its context. Redispatch with
  ANSWER in the brief and reuse its inspected worktree. A top-level saved session
  can be resumed if the live CLI supports it.
- Reviewer agents restricted to read/search tools stayed read-only in V2 and V3.
  V2 per-stage model requests reached the API; V3 takes its model from the agent
  definition, so top-level --model is the explicit process-level choice.
  No cap appeared with 16 stages; retain the portable cap.
- Both trunk and PR code landing passed. Do ticket/dashboard bookkeeping through
  the project's authorized landing route. The spike updated dashboards per batch;
  this skill requires one entry and chat visual per **ticket**.
- Terminal ASCII and visual.type steps dashboard entries passed. Remove manual
  worktrees/branches by content after landing; preserve human-blocked work.

P4 fallback: require a corrected summary status; independently verify any SHA
before acceptance. P5 fallback: fresh worker with ANSWER. P6 fallback: sequential
top-level foreground processes. P13 fallback: enforced deny rules or hold
destructive tickets for the human, rather than trusting the worker's prose.

## V3 ACP shutdown workaround

Apply this procedure to model-bearing V3 ACP workers. On CLI 2.37.1 / KAS
0.66.70, successful turns and cancelled permission waits were followed by exit 1
and `the v3 engine did not exit within 5 seconds after ACP stdin closed`, even
after successful `session/close`. Owned descendants were absent at final polling
in the recorded runs; reliable graceful shutdown remains unqualified. See the
[diagnosis and raw evidence](../../../../docs/agents/research/kiro-acp-shutdown-20261102.md).

1. Record the native terminal response for the turn. Accept task results only
   after independent artifact/quality checks and the required critic review.
   A successful task response alone does not establish process settlement.
2. Record teardown separately. Classify the exact error above as the known
   teardown infrastructure failure only when the captured output identifies it.
   Other exit-1 failures still require diagnosis. Do not automatically rerun a
   successful task because its process ended with this shutdown signature:
   doing so can duplicate edits and spend.
3. Record owned PID/parent-PID descendants from launch and independently observe
   their exit within the controller's recorded bounded cleanup deadline. Never
   label a live or unobserved descendant settled. If any remain, report cleanup
   unresolved, retain the launch identity and evidence, and use only the
   project's authorized owned-process cleanup route. Do not kill unrelated trees.
4. Preserve durable session/checkpoint state. `session/cancel` stops a turn;
   `session/close` is not proven to shut down the engine. `session/delete` destroys
   state and must not be used as a shutdown workaround.
5. Keep unattended Kiro ACP teardown unqualified and expose cleanup status beside
   task status. Other accepted work may continue. This is workflow handling of a
   known limitation, not a native shutdown fix. Deeper investigation is deferred
   to [the follow-up ticket](../../../../.tickets/201-kiro-acp-shutdown-followup.md)
   until higher-priority work is finished.
