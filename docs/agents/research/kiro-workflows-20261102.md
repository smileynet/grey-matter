# Kiro CLI V3 workflow spike (2026-11-02)

## Result

**Partly demonstrated:** a recipe launched in Kiro CLI V3 and advanced through claim,
worker, and review to the land step. The monitor demonstrated pause and resume, and the
retry control restarted the errored land step. The run did not complete. The recipe expresses
an ordered agent handoff, but does not itself create a worker worktree or enforce review
independence. No isolated worktree, commit, or land operation was observed.

The recipe structure can describe sequences, repeats, parallel branches, and watches.
However, recipe structure alone does not establish worktree isolation or an actual
independent reviewer. The four-step recipe in `.scratch/t161-orchestrate.workflow.json`
uses `wf-planner`, `wf-coder`, and `semantic_reviewer`; the runtime monitor showed agent
steps and output handoffs. The schema has no worktree node or isolation property, and the
worker step did not create a worktree. The workflow also did not complete a successful
land step. See the runtime event transcript in `.scratch/t161-runtime-evidence.txt`.

## What was observed

- **Observed:** `kiro-cli 2.37.1`; executable SHA-256 is recorded in
  `evidence/kiro-workflows-20261102.json`.
- **Observed:** `kiro-cli chat --help` exposes `--agent-engine v3`, `--v3`,
  `--trust-tools`, `--trust-workspace`, and documents the latter as one-launch trust
  bypass where workspace hooks, agents, MCP servers, and workflows load.
- **Observed:** the installed `tui.js` bundle contains its Zod recipe schema. A recipe
  has `name`, optional `description`/`inputs`, and `steps`. Nodes are:
  - `step`: required `id`, `agent`, `prompt`; optional `artifacts`, `captureOutput`,
    `completion`, `modelId`, `effortLevel`.
  - `sequence`: child `steps`.
  - `repeat`: child `steps`, positive `maxIterations` (maximum 1000), optional
    `stopCondition` or `stopWhen`, and `onMaxIterations` (`abort`, `continue`, `pause`).
  - `parallel`: `branches`, with `joinPolicy` (`all`, `allSettled`, `any`).
  - `watch`: `handler`, optional config and idle timeout.
  Stop conditions accept `containsText`, `fileCheck`, or `completionSignal`.
- **Observed:** the same installed bundle registers `_kiro/workflow/inspect`,
  `_kiro/workflow/pause`, `_kiro/workflow/resume`, `_kiro/workflow/retry`, and
  `_kiro/workflow/cancel`. This proves methods exist in the installed client bundle; it
- **Observed:** the fixture had no workspace hooks, agents, or MCP servers before this
  spike. The user profile had 30 agent files and 8 hook files. I used documented
  `KIRO_HOME` redirection to a temporary profile. The only setting value written there
  was `chat.enableWorkflows=true`; it also accumulated generated session state. Official
  `KIRO_HOME` documentation lists agents, prompts, skills, steering, settings, and
  sessions, but not hooks; Kiro's V3 docs say global `~/.kiro/hooks/` run in every
  workspace. I did not inspect those hook files, so whether any inherited hook ran is
  unknown. The fixture workspace setting file had no keys; global CLI settings SHA-256
  was unchanged after the run.
- **Observed:** V3 TUI launched with `--trust-workspace --trust-tools=` and accepted
  `/workflow run orchestrate-loop --task "bounded fixture demonstration"`. The monitor
  advanced from `running 0/4` to `3/4`. A claim step requesting `tkt ready` reached a
  permission prompt; the UI then reported a request for user input and paused. Sending a
  no-tools response resumed the run. Pressing `p` showed `pausing...`; pressing `r`
  resumed it to `running 1/4`, after which it reached `2/4` and `3/4`.
- **Observed:** the land step errored after a local inspection request, and the monitor
  exposed `r retry`. Pressing it returned the run to `running 3/4` and restarted that
  step. Subsequent UI output included reads of fixture ticket files. Approval navigation
  during the shell/read requests was ambiguous; I cannot establish which actions were
  explicitly approved or denied. The transcript shows only fixture-local reads and a
  later `npm test` request that the UI reported as rejected with exit code -1. No
  successful land, commit, or remote operation occurred.
- **Observed:** final fixture Git status contained only `?? .kiro/`, the spike's own
  recipes/settings. No tracked fixture files changed. The fixture had no remote.
- **Observed, limited:** an earlier headless V3 prompt reported `/workflow` unavailable
  in that context. This was not a TUI slash-command invocation and does not establish
  workflow unavailability.

## Documented, not fully exercised

Kiro's [workflow authoring docs](https://kiro.dev/docs/workflows/authoring/) describe
recipes in `.kiro/workflows/` and the supported node types. The
[workflow management docs](https://kiro.dev/docs/workflows/manage/) describe boundary
pausing, persisted run state, resume, and retry of failed/aborted nodes while completed
siblings remain completed. These are vendor claims, not observations from this installed
CLI/account. Kiro's [V3 docs](https://kiro.dev/docs/cli/v3/) describe V3 as opt-in through
`--v3`; settings docs describe workflow enablement as an experimental feature. This run
observed pause/resume and retry controls, but did not observe retry succeeding to a
completed workflow or pause on a recipe iteration limit.

## Could not verify / next safe experiment

Not verified: a successful `validate_workflow` result, full workflow completion, actual
worktree creation, independent review isolation, retry through successful completion,
pause/resume across CLI restarts, cloud/account availability, and cleanup after a
successful land. `--trust-tools=` did not prevent approval requests; approval UI state
was ambiguous during one local inspection sequence, so treat it as an empty trust
allowlist, not as a hard prohibition on tool use. Global hook loading also remains
unknown. A follow-up would need a stricter interaction harness before authorizing real
repository reads or writes.
