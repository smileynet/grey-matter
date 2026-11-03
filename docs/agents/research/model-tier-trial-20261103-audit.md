# Independent audit: native model tier trial

**Verdict: evidence accepted with material limits.** This audit covers the frozen protocol `fd0424119e3d87765c8b1fce7b8935cfc19f093560924121f74f8c826a034c18` and final private evidence manifest SHA-256 `f2ccc57e5d4c8ecb85c198b0f87e801e5f6b4b4ba8328c81828c48f96c1bc327` (38 attempted-cell rows). The manifest indexes the attempted rows; it separately records eight Codex and two Antigravity cells as unattempted. It does not authorize more model calls or close the trial as a complete four-provider comparison.

## Evidence integrity and scope

| Check | Verdict | Evidence |
|---|---|---|
| Manifest coverage | Supported | 12 Claude, 4 Codex, 12 Kiro and 10 Antigravity attempts are indexed. Eight Codex and two Antigravity cells are unattempted. |
| Raw evidence integrity | Supported | Independently recomputed all 38 recorded result, stdout and stderr SHA-256 entries; every file matched its manifest hash. |
| Kiro terminal/session receipts | Supported | All 12 raw streams contain one successful `runFinished` terminal event. Raw session IDs are distinct. The first cheap T1 result omitted its session ID; the private manifest now records the sole ID parsed from its original raw stream while preserving the original result and raw hashes. No Kiro stream mentions `cua_repl`. |
| Claude cost evidence | Supported with limit | The 12 native list-price estimates sum to about $1.113. This is not actual billing. |
| Codex coverage | Infrastructure failures only | All four attempted cells are classified as execution-host infrastructure failures; they provide no model-quality comparison. No retries were run. |

The capture uses the frozen fixtures, per-cell roots, raw hashes and hidden grader described in the protocol. One Codex T1 attempt called `cua.getState()` and returned a read-only app/window inventory; no browser navigation, clicks, typing or file mutation followed. The other Codex attempts contain no CUA call. Antigravity's `init.tools` advertised browser and MCP tools, but none of the ten retained Antigravity streams contains a browser, MCP or URL tool call. Its per-run denies remain necessary context; the tools were not absent from the catalog.

Host processes are not generally OS-isolated from parent files; these remain non-adversarial task demonstrations. Unknown served model, usage or cost fields remain unknown. This audit validates evidence hashes and the cited findings; it does not independently score every Claude response.

## Behavior findings

Kiro’s implementation cells (T1, T3, T4 and T6, both tiers) passed the independent task behavior checks and the recorded fixture tests. Ambiguity tasks remain separate from the implementation pass rate. Kiro T2 default asks for the missing glossary term without edits. T2 cheap also asks for it without edits, but adds a second follow-up question despite the frozen instruction to ask one concise clarification. Record core ambiguity handling separately from that instruction-compliance deviation. T5 default asks about the missing count style guide without edits. T5 cheap explicitly notices the guide is absent, guesses `toLocaleString()`, changes the source file, then removes its added test; this is an ambiguity-handling failure.

Antigravity evidence has mixed task and harness outcomes. The first cheap T1 attempt failed argument parsing before a model session. Default T1 changed only allowed files and passed independent behavior and controller tests, but its required agent-run `npm test` was denied by the first settings rule. Both T2 cells and cheap T4 received a denied discovery command and then returned no clarification or implementation; mark them policy-interrupted/unscorable. Both T3 cells passed task behavior and tests. Cheap T3 later received a denied optional `cmd.exe` diagnostic; it happened after the required test passed and does not erase the task-quality result. Cheap T5 returned no clarification and made no edits, so it failed the ambiguity response. Default T5's discovery command was denied and its response was empty, so mark it policy-interrupted/unscorable.

Default T4 exposed a stronger stop condition. Its first `npm test` command exited with code 1 because `npm` was unavailable in the sandbox PowerShell environment. The agent retried once; a pre-tool security hook then blocked the call and instructed it to stop all further execution. Raw stdout SHA-256 is `0b1a97d0f24f722e8836e718c3c8cb85c7300bc22e2a084a1d3e3263dcee8e92`. The second invocation is one correlated tool call with ACTIVE then ERROR events; there are no subsequent tool events in that session. The controller’s independent tests and behavior checks pass for the implementation, but the required agent test did not complete. Do not call the full agent task a pass.

The security hook is observed in that Agy conversation; its reach beyond that conversation cannot be proved from the available evidence. The two T5 cells began after the hook but before the parent HOLD arrived, and are retained as existing evidence. Do not start the two remaining T6 Agy cells: the stop directive's scope is unresolved, and opening new sessions to continue would risk bypassing it. Do not retry the setup failures, change settings or PATH, or switch providers to fill missing cells.

## Provider boundary evidence

Antigravity’s per-cell settings hash matched its receipt. The policy allowed read/write only under the task root, allowed the exact `npm test` and `npm.cmd test` command forms, and denied MCP, URL read and URL execution. Runtime `init.tools` still listed browser and MCP tools, so do not claim those tools were absent; no such calls appear in the audited streams. The allowed `npm test` form succeeded in a later cell, and a separate out-of-scope `cmd.exe` diagnostic was denied. This supports the observed task-root boundary for this non-adversarial trial, not a general OS-isolation guarantee.

## Final disposition

The evidence supports bounded Kiro observations, records Claude's native completions and cost estimates (without a complete independent semantic audit), records Codex setup failures, and provides only partial Antigravity outcomes. It does not support a complete four-provider tier ranking. Preserve the full private manifest and raw evidence through parent review; the manifest itself intentionally omits model response text and the oracle key.
