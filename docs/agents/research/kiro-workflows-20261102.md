# Kiro CLI V3 workflow spike (2026-11-02)

## Result

**Could not verify** whether a workflow recipe can execute the full claim → worker in
worktree → independent review → land loop, or how pause, resume, and retry behave at
runtime. The installed CLI exposes recipe and workflow control schemas, but the fixture
recipe is workspace-trust gated. Running it with `--trust-workspace` would load workspace
hooks, agents, MCP servers, and workflows. The dispatch prohibited trust broadening, so I
did not launch it. This is a bounded setup skip, not evidence that workflows lack these
capabilities.

The recipe structure can describe sequences, repeats, parallel branches, and watches.
However, recipe structure alone does not establish worktree isolation or an actual
independent reviewer. I drafted a four-step fixture recipe in
`.scratch/t161-orchestrate.workflow.json` using documented `wf-planner`, `wf-coder`, and
`semantic_reviewer` agents. Its ordered prompts express claim → worker → reviewer → land,
but the recipe schema does not declare a worktree or guarantee separate credentials,
branch isolation, or independence. This draft was not passed through Kiro's
`validate_workflow` because that would require loading the trust-gated workspace recipe.

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
  does not prove they are available to this account/engine or work against a live run.
- **Observed:** a fixture-local `chat.enableWorkflows=true` setting was written in
  `.kiro/settings/cli.json`; no global setting was written. It was removed after capture.
  The workspace setting in this research worktree was also accidentally written during
  setup and removed. Its original state was absent (the setting lookup returned “No value
  associated” before writing). The fixture itself was the 15-file, 50,837-byte trunk
  fixture with tree hash `7fd72339921451e85440698acda748c0bde512bb`.
- **Observed, limited:** headless V3 launch with `--trust-tools=` returned an assistant
  response saying `/workflow` was unavailable in that context. This was not an actual
  TUI slash-command invocation and cannot establish the feature is unavailable. See the
  JSON receipt for the command and sanitized result.

## Documented, not exercised

Kiro's [workflow authoring docs](https://kiro.dev/docs/workflows/authoring/) describe
recipes in `.kiro/workflows/` and the supported node types. The
[workflow management docs](https://kiro.dev/docs/workflows/manage/) describe boundary
pausing, persisted run state, resume, and retry of failed/aborted nodes while completed
siblings remain completed. These are vendor claims, not observations from this installed
CLI/account. Kiro's [V3 docs](https://kiro.dev/docs/cli/v3/) describe V3 as opt-in through
`--v3`; settings docs describe workflow enablement as an experimental feature.

## Could not verify / next safe experiment

Not verified: recipe validation by Kiro, agent availability, actual claim/worker/reviewer/
land execution, worktree creation, pause/resume state, node retry behavior, cloud/account
availability, and cleanup after a successful workflow run. A follow-up must first define a
fixture trust boundary that permits the intended workspace content, then run a harmless
recipe with no GitHub remote and `--trust-tools=`; keep the feature setting workspace-local.
Until then, the answer to the spike question is **not established**.
