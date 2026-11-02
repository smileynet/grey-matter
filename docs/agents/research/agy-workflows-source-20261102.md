# Antigravity workflows and custom agents: source guide (2026-11-02)

Ticket [157](../../../.tickets/157-spike-agy-run-workflow.md) asks whether agy can run an orchestrate loop through `run_workflow` with per-ticket worktrees and typed results, and whether a custom agent's `model:` pins the child's model. This guide keeps source claims separate from the completed native probe; the case-by-case transcript, tool calls and independent Git/test evidence are in [the 20-case receipt](evidence/agy-workflows-20261102.json).

## Findings from docs and installed CLI

**Observed locally — the currently installed builtin skill documents exact tool invocation arguments and workflow primitives.** Read `%USERPROFILE%/.gemini/antigravity-cli/builtin/skills/run-workflow/SKILL.md` on 2026-11-02 (10,315 bytes; SHA-256 `4A524107CB6173D75A54C2A7DE3ADDEB413D7BDB868C8279682DED74672BEB1E`). This is native installed evidence, distinct from the official public SDK documentation. It specifies exactly one of `Script` (inline Python) or `ScriptPath` (absolute Python file), plus required `Description`; optional `Cwd`, `Args` (JSON object), and `WaitMsBeforeAsync` (maximum 10,000). `ScriptPath` to a saved workflow entry script validates `Args` against `workflow.json`'s schema. Workflow result has `Logs:` from `log()` and `Output:` from print/trailing expression.

The skill documents these callable signatures:

```python
agent(prompt=None, schema=None, role=None, type_name="self", workspace="inherit", model=None)
parallel(items, fn)
pipeline(items, fn)
```

`await agent(prompt, schema)` runs once and returns the parsed `finish` result. A schema is required; `finish` validates the result, and ending without `finish` fails the workflow. `parallel` awaits all calls concurrently, preserving item order and cancelling remaining work on failure; `pipeline` awaits each sequentially. `workspace` accepts `inherit`, `branch` (worded “new isolated clone”), and `share` (new workspace sharing the underlying repository); other values error. The installed skill's wording differs from the observed Git worktree behavior recorded below. `model` accepts `inherit`, `flash_lite`, `flash`, and `pro` (the skill says default is the current model).

**Important architecture detail documented by the installed skill:** workflow agents are main agents, not subagents; they are hidden from the conversation list and reachable through the workflow step. They do not see the script or one another. This differs from a simple custom `invoke_subagent` test and matters when interpreting the completed probe and model evidence.

**Documented — SDK exposes a Python `run_workflow` route; CLI tool availability is a separate question.** Google’s SDK changelog assigns `phase`, `log`, `agent`, `parallel`, `pipeline`, and `agent.beta.run_workflow()` to the Python SDK's beta `workflows` module, introduced in SDK v0.1.22 and expanded in v0.1.23. This documents a programmatic Python workflow route; it does not establish that the CLI model tool has the same shape or semantics.

**Observed locally — no `run_workflow` CLI subcommand; model-tool availability comes from the conversation's native tool inventory.** `agy --version` returned `1.4.12`; `agy --help` lists `agent`/`agents` as “List available agents,” and `agy agent --help` shows only help flags. Main help lists `--agent`, `--model`, and `--json-schema`. This proves only that help exposes no same-named CLI subcommand. Case 04 verifies custom profile selection. Case 06 reaches native workflow permission enforcement and is denied. Successful workflow execution is shown in cases 10/11/19/20.

**Documented — CLI also has asynchronous subagents.** The Custom Subagents docs say CLI primary agents delegate work to parallel subagents/background tasks. Their invoking interface is `invoke_subagent`; that docs page describes workspace options `inherit`, `branch` (isolated Git worktree), and `share`. Keep this separate from the installed workflow skill's own agents and workspace definition (`branch` = isolated clone).

**Documented — custom agent file schema.** Workspace agents are discovered from `.agents/agents/<name>.md` or `.agents/agents/<name>/agent.md`. YAML frontmatter fields include:

| Field | Documented type/default | Relevance |
|---|---|---|
| `name`, `description` | strings, required | identity and planner delegation description |
| `tools` | string array, `[]` | tool allowlist |
| `mainAgent` | boolean, `true` | selectable as primary agent |
| `subagent` | boolean, `true` | callable through `invoke_subagent` |
| `model` | string, `inherit` | documented values `inherit`, `flash`, `pro` |
| `commandExecutionPolicy` | string, `sandbox` | documented values `off`, `auto`, `eager`, `sandbox` |
| `mcpServers` | object array, `[]` | configured MCP servers |
| `skills`, `plugins` | string arrays, `[]` | dependencies |

Example shape (abridged from the official example):

```markdown
---
name: code-auditor
description: Specialized subagent for security audits.
subagent: true
mainAgent: false
model: pro
commandExecutionPolicy: sandbox
---
Instructions for this agent.
```

**Documented vs unknown — custom agent model pin and workflow-agent model argument are separate controls.** Official CLI changelog v1.1.5 says custom-agent frontmatter `model` selects a tier when invoked as a subagent, defaulting to inherit; official custom-subagent docs list `inherit`, `flash`, `pro` (plugin docs add `flash_lite`). The installed workflow skill independently says `agent(..., model=...)` sets a workflow agent's model tier (`inherit`, `flash_lite`, `flash`, `pro`). The ticket asks whether a custom agent's `model:` pins the workflow-created child; docs do not explicitly state whether `agent(type_name=<custom>)` honors/overrides frontmatter model when the `model` argument is omitted. The receipt shows frontmatter and explicit workflow model requests alongside native labels, but does not settle the served-model question. Root's runtime probe reports `gen_metadata` label `gemini-3.8-flash-tiered` (internal model M322) for a child requested through frontmatter `flash`, another requested through frontmatter `pro`, and two requested through explicit workflow `model="pro"`; a frontmatter-`inherit` child instead reported `gemini-4.18-argon-medium` (M418), matching its Argon Medium parent. These are metadata route labels, not direct proof of the model that served generation: the stored fields are in an opaque native protobuf blob, and no first-party public documentation found defines their semantics. Therefore the categorical claim that `model="pro"` was served or ignored is not established. Report the request and the exact `gen_metadata` label separately; do not call the latter backend-served identity absent decoded response/model fields. Model label spoken by a worker is not adequate.

## Observed native probe (2026-11-02)

Evidence is in [the native receipt](evidence/agy-workflows-20261102.json), which records 20 headless runs against agy 1.4.12, request/permission settings and hashes, native tool calls/results, and independent verification. The receipt's `served_model` is explicitly `unverified` because opaque `gen_metadata` labels do not establish served identity.

- **Capability scope:** the default planner declined the advertised tool (case 01); this does not establish tool absence. An explicit custom controller reached the native tool's permission enforcement in case 06, and later narrowly granted executions passed. This verifies the captured configurable agent/tool path, not unconditional planner dispatch.
- **Typed outputs:** a schema-constrained agent returned a valid structured value (case 11); an invalid value plus extra property produced a native schema validation error (case 13). Case 19 completed the typed T1/T2 workflow and a second scripted-answer turn; case 20's sequential `pipeline` returned `[{'marker': 'FIRST'}, {'marker': 'SECOND'}]` successfully.
- **Fan-out/workspaces:** case 19 completed two disjoint fixture tickets in separate agent branch workspaces, and independent `git worktree list --porcelain` output registered both paths as actual Git worktrees sharing the fixture's `.git` common directory. Independent commit/diff checks showed T1 touched `src/a.js` and `test/a.test.js`, T2 touched `src/b.js` and `test/b.test.js`; fixture `npm test` passed all three tests. This demonstrates the mechanism and isolated work products; it does not establish wall-clock overlap unless timing evidence is separately reported.
- **Question/answer flow:** in case 19 the T2 worker first returned `QUESTION` for the missing glossary choice with no commit and tests not run. The script supplied the fixture's scripted answer in a second turn; that worker then returned `DONE` with a commit and passing tests. This verifies the tested scripted follow-up path; it is not a human-in-the-loop question channel.
- **Permission confounds:** cases 14/15 stopped on an ungranted `git rev-parse HEAD`. Case 17 granted that command but stopped when a worker searched the home directory outside its assigned files. That read boundary stayed closed. Case 19 narrowed the worker tools and instructions and completed. These failures do not prove parent `finish` cancellation or a workflow defect.
- **Model evidence:** cases 07–08 and 12–16, including explicit workflow `model="pro"`, recorded requested settings and opaque `gen_metadata` labels. The observed labels were M322 Flash Tiered for frontmatter flash/pro and explicit workflow pro, and M418 Argon Medium for frontmatter inherit, matching the parent in that run. Since first-party docs do not define these blob fields, the ticket's served-model question remains **unverified**; see receipt rather than treating labels as served-model proof.
- **Cleanup:** the independently audited fixture, four native worktree parent directories, non-model histories and private probe were recycled. Model-control histories remain only through #194. Windows recycling rejected the Python hardlink; it was moved within the C drive into one retained model-control history, and its empty temporary directory was recycled. The receipt records exact disposition and measurement limits. No global configuration changed.

## Limits and discrepancies

- The official custom-subagent page currently mixes App and CLI material in one document. For this ticket, rely only on the CLI-specific section for CLI behavior; App `invoke_subagent` details are not automatically CLI contracts.
- The SDK changelog supports a separate Python SDK `run_workflow` API under v0.1.22+. The current installed agy CLI builtin skill also documents a native model tool named `run_workflow` and its arguments/primitives. Those are related feature families but not interchangeable API specifications. Native execution evidence is in the receipt.
- SDK changelog entries establish feature names and introduction versions, but do not provide a complete function signature or guarantee SDK version installed here. No SDK install/import was run for this CLI-centered ticket. Use the current installed skill for the CLI workflow interface and keep SDK and CLI APIs distinct.
- `--json-schema` on agy headless output constrains the final response; that is distinct from evidence of the SDK workflow's `schema` or a typed result mechanism in the CLI tool.
- The receipt preserves the denied HEAD reads in cases 14/15 and out-of-job home search in case 17; case 19 completed with bounded tools. These failures are retained as operational limits rather than reclassified as successful workflows.
- Current probe's `gen_metadata` blobs are native protobuf data. Local schema tables name the blob but do not define its fields; official Antigravity sources searched contain no `gen_metadata`/`model_enum` explanation. The blob includes model-label-looking strings, but without a first-party descriptor or documented contract these are reported route metadata only. Treat request configuration and route label as distinct, and served identity as unknown.

## Sources

- [Google Antigravity SDK changelog](https://antigravity.google/docs/changelog) — SDK v0.1.22/v0.1.23 workflow primitives, `run_workflow`, structured args, and per-subagent model config.
- [Custom subagents](https://antigravity.google/docs/subagents) — frontmatter schema, example, async invocation, workspace modes, and CLI section.
- [Antigravity CLI changelog v1.1.5](https://antigravity.google/docs/changelog?tab=cli) — says frontmatter model selects the tier for agents invoked as subagents, default `inherit`.
- First-party doc searches on `gen_metadata`, `model_enum`, and generation-routing metadata returned no source that defines the native blob's model-field semantics (2026-11-02).
- [Customization discovery](https://antigravity.google/docs/customization-discovery?tab=cli) — workspace/global paths and discovery depth.
- [Antigravity CLI headless mode](https://antigravity.google/docs/cli/headless/) — `--agent`, `--model`, output schema and runtime result fields.
- [Antigravity IDE workflows](https://antigravity.google/docs/ide/workflows/) — separate legacy slash-command workflow concept; page says current workflows stopped working October 19, 2026 pending transition guidance.
- Installed evidence: `agy --version`, `agy --help`, `agy agent --help` on this Windows checkout, 2026-11-02; output summarized above.
- Installed evidence: `%USERPROFILE%/.gemini/antigravity-cli/builtin/skills/run-workflow/SKILL.md`, read directly on 2026-11-02; SHA-256 and byte length recorded above. Local installed guidance, not public docs.
