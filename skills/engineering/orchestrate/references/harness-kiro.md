# kiro-cli

For IDE watching or answering, read [GUI watch qualifications](gui-watch.md).
Agent Focus documentation does not establish attachment of a CLI/ACP worker.

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
