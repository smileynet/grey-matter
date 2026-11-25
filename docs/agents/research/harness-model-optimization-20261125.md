# Harness & Frontier Model Optimization Research (2026-11-25)

**Question:** Across all target harnesses and plugins for `grey-matter` and `tkt` — including Claude Code, Codex, Antigravity (`agy`), Kiro (`kiro-cli` / IDE) & Kiro Crew, Kimi Work / Code CLI, Crush, OpenCode (especially with Z.ai / GLM), ZCode, and the in-progress **DSH** (DeepSeek Harness) and **Qwen Code** plugins — what frontier model behaviors, harness idiosyncrasies, and plugin primitives should inform modifications to skills, scripts, hooks, manifests, or guidance?

**Gathered:** 2026-11-25, from primary official vendor documentation, upstream GitHub repositories, model cards, local CLI installs (`claude 2.1.332`, `codex-cli 0.172.0`, `kiro-cli 3.6.0`, `kirocrew 0.13.1`, `agy 1.5.16`, `opencode 1.19.6`, `tkt 0.4.0`), and existing repo records in [`../harnesses.md`](../harnesses.md) and [`../harness-surfaces/models-and-usage.md`](../harness-surfaces/models-and-usage.md).

**Evidence & confidence markers:**
- Source type: **L** = observed in local install/repo; **D** = primary official docs, model card, or upstream source code.
- Confidence: **High** (verified verbatim from primary source or local runtime), **Medium** (official doc surfaced via search grounding or partial verification), **Low** (secondary/incomplete signal — never treated as load-bearing).
- All adaptation proposals below are **options for owner approval**, not binding rules.

---

## Executive Summary: Cross-Cutting Themes

Six structural findings cut across all 10 harnesses and directly affect `grey-matter` and `tkt`:

1. **All major frontier model lineups shifted in Nov 2026** (**High**):
   - Anthropic: **Claude Fable 5.2** (superseded 5.1), Opus 5.5, Sonnet 5.5, Haiku 5.5.
   - OpenAI: **GPT-6.2 Sol** (500K ctx) and **GPT-6.2 Astra** (272K Codex bundled ctx), superseding GPT-6.1 Sol / GPT-6 Astra.
   - Google: **Gemini 4 Carbon**, **Neon**, **Argon**, **Hydrogen** (replaces 3.8 Flash), and **Orchestrator**.
   - Z.ai: **GLM-5.4** (Loop Transformer, multimodal, released 2026-11-23), GLM-5.3, GLM-5.3-Flash.
   - Moonshot: **Kimi K3.1 Pro** (2.8T MoE, Gated DSA + KDA, released 2026-11-04), Kimi K3, K2.5.
   - DeepSeek: **DeepSeek-V4.1-Flash-1017** (asymmetric 8B/16B active, 1M ctx, vision, $0.003/M cache hit) and **DeepSeek-V4-Pro-0813**.
   - Qwen: **Qwen4-Max** (1M ctx, multimodal, added to Qwen Code `v1.0.0-preview.2` on 2026-11-25), **Qwen3.8-Max** / `Qwen3.8-2.4T-A95B`, and **Qwen3-Coder-Next** (non-thinking).
2. **Legacy prompt phrasing now actively hurts late-2026 frontier models** (**High**):
   - Asking models to print internal chain-of-thought risks `reasoning_extraction` refusals on Claude 5.5 / Fable 5.2.
   - Generic `"think carefully"`, `"be concise"`, and blanket `"delegate"` / `"when in doubt use tool X"` lines degrade latency or cause Fable 5.2 caution pile-up and over-spawning, and collide with GPT-6.2's default conciseness and Gemini 4's native thinking.
   - Stopping criteria must defend *both* failure modes: **early stopping** (Claude Fable 5.2, Haiku 5.5) and **marathon thinking / over-exploration** (GLM-5.4, Gemini 4 Carbon/xhigh).
   - **Never mutate system prompts or earlier prefixes mid-session**: doing so breaks Claude Fable 5.2 (`thinking-block-conversation-mismatch` HTTP 400), drops GPT-6.2 reasoning items, and forfeits DeepSeek V4.1's 50× disk KV-cache discount and Gemini 4's 95% implicit cache discount.
3. **Preserved thinking (`reasoning_content` echo) is now the default contract across Asian frontier models** (**High**): Kimi K3/K3.1 Pro, GLM-5.3/5.4, DeepSeek V4.1, and Qwen3.8/4 all require unaltered `reasoning_content` across multi-turn tool loops; GLM-5.3/5.4 and Kimi K3/K3.1 Pro cannot disable thinking at all; Kimi K3/K3.1 Pro and Qwen3.8 require `temperature = 1.0` in thinking mode while DeepSeek silently ignores `temperature`.
4. **Skill-index and rules budgets are tight — `grey-matter`'s 50+ skills hit real ceilings** (**High**):
   - Codex caps the initial skill list at **2% of context** (on GPT-6.2 Astra's 272K bundled window, ~5,440 tokens including paths) and truncates descriptions or omits skills; Codex also hard-caps merged `AGENTS.md` files at **32 KiB** (`project_doc_max_bytes`).
   - Claude Code truncates combined `description` + `when_to_use` at **1,536 chars**.
   - Front-loading the core trigger in the first ~140 chars of every `SKILL.md` description is now high-leverage across all harnesses.
5. **Lifecycle hooks and conditional (`paths:`/`glob`) rules can enforce `tkt` invariants deterministically** (**High**):
   - Almost every harness now supports `SessionStart` / `PreToolUse` / `PreCompact` hooks (Claude Code, Codex, Antigravity, Kiro 3.6, Crush, Kimi Code, OpenCode, ZCode, DSH Cordis, Qwen Code), though schemas and distribution rules diverge sharply (e.g., Codex bars hook-bearing plugins from its public directory; ZCode requires top-level `{ hookEventName, additionalContext }` JSON; Antigravity requires named hook IDs + `injectSteps`; Qwen ignores `hooks:` inside extension `SKILL.md` files).
   - Path-scoped rules (`trigger: glob` in Antigravity plugin `rules/`, `paths:` in Qwen extension `rules/`, Claude `.claude/rules/`, Kiro steering `fileMatch`) allow a `.tickets/*.md` guardrail at **zero resident token cost**.
6. **`agent-plugins.org` v1.0.0 is emerging as a shared baseline, but NOT a full replacement for native manifests** (**High**): Codex, Antigravity, Kiro Powers, and Qwen Code all recognize root `plugin.json` (`https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`), but Qwen Code explicitly ignores hooks, commands, agents, and rules in `plugin.json` — making native manifests (`qwen-extension.json`, `.claude-plugin/`, `.codex-plugin/`, `.antigravity-plugin/`, `.kimi-plugin/`, DSH Cordis bundle) still necessary whenever a plugin ships more than flat skills + MCP.

---

## Cross-Harness Matrix

| Harness | Local / Upstream Version | Current Frontier Model(s) | Skill Discovery & Naming | `disable-model-invocation` | Plugin Hooks & Format | Global Rules Path | Key Idiosyncrasy for `grey-matter`/`tkt` |
|---|---|---|---|---|---|---|---|
| **Claude Code** | `2.1.332` (L) | Claude Fable 5.2, Opus 5.5, Sonnet 5.5, Haiku 5.5 | Bucket dirs in `.claude-plugin/plugin.json`; `/plugin:skill`; flat user roots | Enforced (`SKILL.md`) | 33 events + `if:` filters + Mods (`claude-hooks.json`) | `~/.claude/CLAUDE.md` | `PreSkillShellCommand`; `reasoning_extraction` refusal; Fable 5.2 caution pile-up; reserved names (`ship`, `steward`, `computer-use`) |
| **Codex** | `0.172.0` (L) | GPT-6.2 Sol (500K), GPT-6.2 Astra (272K bundled), 6.1 Terra, 6 Luna | Recursive in `.codex-plugin/`; `$plugin:skill`; `agents/openai.yaml` | Enforced (`agents/openai.yaml`) | 14 events (`hooks/hooks.json`, sets `CLAUDE_PLUGIN_ROOT`), **barred from public directory** | `~/.codex/AGENTS.md` | 2% skill-index budget; 32 KiB `AGENTS.md` cap; `apply_patch` (not `Edit`); built-in prompt says user instructions override skill gates |
| **Antigravity (`agy`)** | `1.5.16` CLI / `2.35.0` App (L/D) | Gemini 4 Carbon, Neon, Argon, Hydrogen, Orchestrator + Claude | Flat `skills/<name>` in `.antigravity-plugin/plugin.json` | Enforced at runtime (undoc) | 6 events, named-key `hooks.json`, camelCase stdin, `injectSteps` stdout | `~/.gemini/config/AGENTS.md` | Direct **`/grill-me`** collision; plugin `rules/` supports `trigger: glob` (snake_case only); `PreInvocation` bloat trap; `/generative_ui` App-only |
| **Kiro / Kiro Crew** | `kiro-cli 3.6.0` / `kirocrew 0.13.1` (L/D) | `auto` + Claude 5.5, GPT-5.6, Kimi K3, GLM-5, DeepSeek 3.2, MiniMax M2.5, Qwen3-Coder-Next | `~/.kiro/skills` (CLI); Powers -> Open Agent Plugins `plugin.json`; Crew -> `app.json` `skill://` only | Ignored (loads fine) | `.kiro/hooks/*.json` (`SubagentStop`, `PreCompact`, `PreToolUse` rewrite, `PermissionRequest`) | `~/.kiro/steering/AGENTS.md` | V3 default; strict parent+child `permissions.yaml` intersection; served model unverified; Crew renamed Mates -> **Bots** & Conductor Mode GA |
| **Kimi Work / Code CLI** | Verified 2026-11-08 (L) / Code CLI (D) | Kimi K3.1 Pro (1M, 2.8T MoE), Kimi K3, K2.5, K2 Thinking | `.kimi-plugin/kimi.plugin.json` (`skills/`, `commands/`); `plugin:skill` | Enforced (`SKILL.md` + generated `commands/*.md`) | Kimi Code CLI: 7 fail-open events; Work: skill-only here | `~/.kimi-code/AGENTS.md` (Code CLI) | Mandatory `reasoning_content` echo + `temp=1.0`; `skillOverrides` avoids validation warnings; Windows `register_personal.sh` bug; `ELECTRON_RUN_AS_NODE=1` ICU trap |
| **Crush** | `0.93.1` (base) -> `0.98.1+` (D) | Multi-provider (`large` + `small` dual-tier) | Flat `.agents/skills`, `.crush/skills`, `.claude/skills`, `.cursor/skills` | Not documented (`user-invocable: true` for palette) | 13 parallel hooks in `crushrc` (`exit 2` block, `exit 49` turn halt) | `~/.config/crush/CRUSH.md` & `~/.config/AGENTS.md` | Embedded `mvdan.cc/sh/v3` (no rc files; shebang required for `os/exec`); native LSP; BYO Go-template compaction prompt |
| **OpenCode + Z.ai GLM** | `1.19.6` (L, V1) -> `2.4.1` (D, V2) | GLM-5.4 (Loop Transformer, multimodal), GLM-5.3, GLM-5.3-Flash | `~/.config/opencode/skills`, `~/.agents/skills`, `~/.claude/skills` | Enforced in V2.4.1 (`skill-file.ts:49-51`); not enforced in V1 | **V1 vs V2 breaking split** (`@opencode-ai/plugin` vs `@opencode/plugin` `Plugin.define`) | `~/.config/opencode/AGENTS.md` | GLM-5.4 "marathon thinking" loops; forced thinking (`disabled` errors); default `max` effort; V1 plugins do not run in V2 |
| **ZCode** | `0.17.1+` (L/D) | GLM-5.4, GLM-5.3 (ADE `/goal` loops) | Reads `.claude-plugin/` bucket array; `grey-matter:<name>` **+ bare alias** | Ignored (always model-invocable) | Claude-compatible hook events, **single shell-string cmd** + strict `{ hookEventName, additionalContext }` JSON | `~/.zcode/AGENTS.md` | Windows CLI subset (no `install`/`update`/`marketplace`); `entry.dependencies` advisory; `when_to_use` snake_case; `/goal` native loop |
| **DSH** *(in-progress plugin)* | Dev preview (`2026-11-22`, D) | DeepSeek-V4.1-Flash-1017 (1M, vision), DeepSeek-V4-Pro-0813 | **Flat only** (`~/.dsh/skills`, `.dsh/skills`) OR Cordis `SkillProvider` on `ctx.skills` | Strict boolean (`disable-model-invocation`, `user-invocable`) | Cordis `tools/pre-execute`, `ctx.tools.guard()`, `tools/post-execute`, `agent/pre-step`, `defineTool` | `~/.dsh/AGENTS.md` (dedups `~/.agents/AGENTS.md`) | Nested `**/SKILL.md` ignored; strict kebab-case names; `whenToUse` camelCase; `cordis.patch.yml` replaces whole row config; 50× KV cache requires stable prefix |
| **Qwen Code** *(in-progress plugin)* | `v0.28.4` / `v1.0.0-preview.2` (D, 2026-11-25) | Qwen4-Max (1M, multimodal), Qwen3.8-Max / 2.4T-A95B, Qwen3-Coder-Next | Native `qwen-extension.json` (flat `skills/*`); **NO bare alias** (`ext:skill` only) | Enforced (`SKILL.md`, `user-invocable: false`) | Manifest-level hooks (`hookSpecificOutput` JSON); **extension `SKILL.md` `hooks:` ignored** | `~/.qwen/QWEN.md` (project `AGENTS.md` native) | Agent Plugins `plugin.json` ignores hooks/commands/agents/rules; extension `rules/` **must** use `paths:`; `executionSandbox` blocks `Skill` tool & worktree `.git` writes |

---

## Per-Harness Findings & Adaptation Proposals

### 1. Claude Code (`2.1.332`) & Anthropic Frontier Models

#### Frontier Models & Prompting Idiosyncrasies (**High**)
- **Lineup** (D: `https://platform.claude.com/docs/en/models/overview`, 2026-11-25):
  - **Claude Fable 5.2** (`claude-fable-5-2`, 1M/128K, $8/$40 MTok, adaptive thinking always on, API default effort `high`). *Snippet:* `"If you’re unsure which model to use, start with Claude Opus 5.5 for most workloads. Use Claude Fable 5.2 for demanding reasoning and long-horizon agentic work, or when your evals on Claude Opus 5.5 at higher effort still fall short."` (**Version mismatch:** [`../harness-surfaces/models-and-usage.md`](../harness-surfaces/models-and-usage.md) still lists Fable 5.1.)
  - **Claude Opus 5.5** (`claude-opus-5-5`, $4/$20, Claude Code default, default effort `medium`), **Sonnet 5.5** (`claude-sonnet-5-5`, $2/$10, `between_tools` thinking, cannot disable thinking), **Haiku 5.5** (`claude-haiku-5-5`, from $0.10/$0.50).
- **Critical prompting quirks** (D: `platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md` & per-model prompting guides, 2026-11-25):
  - **No self-context-awareness on 5.x:** `"Only Claude Sonnet 4.5 and Claude Haiku 4.5 have context awareness."`
  - **XML + query-last for multi-doc context:** `"Queries at the end can improve response quality by up to 30 percent in tests, especially with complex, multidocument inputs."`
  - **Remove legacy `"think carefully"` & over-prompting:** `"removing such a line made replies start sooner, with no clear decline in the quality of the reply"` (`prompting-claude-opus-5-5.md`); `"Instructions such as 'If in doubt, use [tool]' cause overtriggering."`
  - **Fable 5.2 early stopping, ownership sensitivity, caution piling up, & over-delegation** (`prompting-claude-fable-5-2.md`):
    - `"On long, multistep tasks, Claude Fable 5.2 sometimes ends a turn before the work is done... listing what's left to be done, offering to continue, or stopping at an ordinary obstacle such as a timeout."`
    - `"Cautious instructions can build up from past sessions through memory, notes, and instruction files. This can be counterproductive when Claude Fable 5.2 follows the instructions closely and asks for unnecessary approval."`
    - At `xhigh`/`max`, proactively spawns review subagents; mid-conversation edits to `system`/`tools`/earlier turns fail with HTTP 400 (`thinking-block-conversation-mismatch`).
  - **Haiku 5.5 & 5.x `reasoning_extraction` refusal** (`prompting-claude-haiku-5-5.md`): Asking 5.5/Fable to print internal chain-of-thought can trigger `stop_reason: "refusal"` (`stop_details.category: "reasoning_extraction"`). Haiku 5.5 also stops early / skips tests on long coding prompts without an explicit verification step.
  - **Opus 5.5 concrete anti-patterns:** Generic `"avoid a generic AI look"` fails; `"It responds well to instructions that name specific patterns to avoid"`.

#### Harness-Specific Features (**High**)
- **33 lifecycle hook events + `if:` condition filters + `PreSkillShellCommand`** (D: `code.claude.com/docs/en/hooks.md`, `changelog.md` for `2.1.332`, 2026-11-25): `if: "Edit(.tickets/*)"` avoids spawning hook processes on non-matching calls; `PreSkillShellCommand` `"can refuse a skill or command's inline shell commands as it loads"`.
- **Mods** (D: `code.claude.com/docs/en/plugins/mods/overview.md`): `"A mod is a plugin that changes how Claude Code looks and behaves. It's made of JavaScript or TypeScript event handlers... Draw an interface you can use: a pane beside the transcript or a band above the prompt... Run your own code on a command: a /command that runs your function at once, with no Claude turn."`
- **Skill frontmatter & listing cap** (D: `code.claude.com/docs/en/skills.md`): `description` + `when_to_use` are truncated at **1,536 chars** in the listing. Supports `disallowed-tools`, `background: false` (for `context: fork`), `paths`, `effort`. Reserved names: `ship`, `ship-local`, `steward`, `computer-use` (macOS, 2.1.332).
- **Plugin manifest & built-in ablation evals** (L/D: `claude plugin --help` on `2.1.332`, `plugins-reference.md`): `optionalDependencies`, `engines["claude-code"]`, `experimental.evals`, and **`claude plugin eval --ablation with-without`** + **`/doctor prompt-audit`**.
- **Dynamic Workflows** (`workflows.md`): JS scripts Claude writes & runs in background to keep fan-out state out of parent context.

#### Adaptation Proposals for `grey-matter` / `tkt`
- **Audit shared skills** (using `/doctor prompt-audit` + manual pass) to remove any `"show your reasoning"` wording (`reasoning_extraction` hazard), legacy `"think carefully"` filler, and blanket delegation directives that trigger Fable 5.2 caution pile-up / over-spawning.
- **`tkt` Claude hook (`tkt/.claude-plugin/claude-hooks.json`)**: Add a `PreToolUse` handler with `"matcher": "Edit|Write"` + `"if": "Edit(.tickets/*)"` (and Windows `"Bash|PowerShell"` awareness if shell-checked) that rejects hand-editing `status: done` in `.tickets/*.md`, alongside the existing `SessionStart` hook.
- **Manifest & evals**: Add `engines["claude-code"]` and evaluate `experimental.evals` (`claude plugin eval --ablation with-without`) to measure actual lift of `code-review`, `tdd`, and `tkt-work`.
- **Optional future track**: A lightweight read-only `tkt` **Mod** pane + zero-turn `/tkt-frontier` command in Claude Code CLI/Desktop/VS Code.

---

### 2. Codex (`0.172.0`) & OpenAI Frontier Models

#### Frontier Models & Prompting Idiosyncrasies (**High**)
- **Lineup** (L: `codex debug models --bundled` on `0.172.0`; D: `https://developers.openai.com/api/docs/guides/latest-model.md`, 2026-11-25):
  - **`gpt-6.2-sol`** (new default, **500K** bundled ctx, `low`..`ultra`), **`gpt-6.2-astra`** (**272K** bundled ctx vs up to 1.05M marketed on API — **discrepancy flagged**), **`gpt-6.1-terra`** (500K, vision/computer use), **`gpt-6-luna`** (272K, `low`..`max`). Every model uses `apply_patch: freeform` and `unified_exec`.
- **Prompting & built-in `instructions_template` interactions** (L: `codex 0.172.0` bundled template; D: `latest-model.md`, `learn.chatgpt.com/guides/prompting-gpt-6-2-astra.md`):
  - **Default conciseness:** `"The model's writing tends to be more concise and direct by default. When migrating, revisit instructions like 'be concise' in your system prompt."`
  - **Skill-gate override tension (verbatim from `codex 0.172.0` template):** `"The user's instructions take precedence over guidelines provided in a skill... Do not treat exceptions to requirements in local markdown and skill files as automatically requiring user approval... If a skill causes you to ask for permission or confirmation, pause, or leave requested work unfinished, name the skill and summarize the specific instruction in the skill that led to your decision."` -> Hard stop-gates in `SKILL.md` (release gates, destructive guardrails) must be written as explicit user-safety invariants with crisp criteria, not soft suggestions.
  - **Anti-contrastive output rule (verbatim from `codex 0.172.0` template):** `"NEVER use contrastive framing such as 'X, not Y'..."`
  - **`ultra` effort auto-delegation:** `"With Ultra, Codex decides on its own when to bring in subagents"`.
  - **Prefix-edit reasoning drops:** `"Starting with GPT-6.2, the Responses API drops reasoning items after mid-conversation edits to the conversation history (prefix edits), certain model changes (including downgrades)..."`

#### Harness-Specific Features (**High**)
- **Skill index 2% budget (CRITICAL for 54 combined skills)** (D: `learn.chatgpt.com/docs/build-skills.md`): `"By default, this list uses at most 2% of the model's context window, or 8,000 characters when the context window is unknown. If many skills are installed, Codex shortens skill descriptions first. For large skill sets, Codex may omit some skills from the initial list and show a warning."` (Configurable via `skills.max_context_tokens`, max `10000`.)
- **`AGENTS.md` 32 KiB hard cap** (D: `learn.chatgpt.com/docs/agent-configuration/agents-md.md`): Merges `~/.codex/AGENTS.{override.,}md` -> Git root -> `cwd`, stopping at `project_doc_max_bytes` (**32 KiB** default).
- **Hooks & public directory restriction** (D: `learn.chatgpt.com/docs/hooks.md`, `developers.openai.com/plugins/build/plugins.md`; L: `codex features list` on `0.172.0`):
  - 14 events; plugin hooks live in `hooks/hooks.json` and `"Codex also sets CLAUDE_PLUGIN_ROOT and CLAUDE_PLUGIN_DATA for compatibility with existing plugin hooks"`.
  - **Distribution caveat:** `"Lifecycle hooks are supported for plugins installed manually in Codex desktop. Plugins containing lifecycle hooks aren't eligible for the public plugin directory."`
  - **Runtime discrepancy:** `codex features list` on `0.172.0` reports `hooks: stable / true`, `plugin_hooks: removed / false`, `multi_agent: deprecated / true`, `multi_agent_v2: stable / false`.
- **Portable `plugin.json`:** Codex recommends root `plugin.json` (`agent-plugins.org/schemas/1.0.0/plugin.schema.json`) + `extensions.com.openai`, keeping `.codex-plugin/plugin.json` as fallback.

#### Adaptation Proposals for `grey-matter` / `tkt`
- **Front-load all 54 `SKILL.md` descriptions** so the critical trigger sits in the first ~140 chars (surviving Codex's 2% truncation), and audit why 17 of 54 combined `grey-matter`+`tkt` skills currently omit `agents/openai.yaml` UI sidecars.
- **Keep `.codex-plugin/plugin.json` `"hooks": []`** for public directory eligibility; continue relying on opt-in project `.codex/hooks.json` via `tkt init --write-nudge codex` (already implemented in `tkt`!) and optionally offer a `SessionStart` opt-in template.
- **Enforce an `AGENTS.md` byte budget** well under 32 KiB combined (global + project) and eliminate hardcoded `Edit`/`Bash` tool names from portable skills (Codex uses `apply_patch` / `unified_exec`).
- **Refresh [`../harness-surfaces/codex.md`](../harness-surfaces/codex.md) and [`../harness-surfaces/models-and-usage.md`](../harness-surfaces/models-and-usage.md)** for `0.172.0`, `gpt-6.2-sol`/`astra`, and `multi_agent_v2`.

---

### 3. Antigravity (`agy 1.5.16`/`1.5.17`, App `2.35.0`) & Google Frontier Models

#### Frontier Models & Prompting Idiosyncrasies (**High**; Carbon dev-guide style points **Medium**)
- **Lineup** (L: `agy models` on `1.5.16`; D: `aistudio.google.com/docs/latest-model.md`, `antigravity.google/docs/models.md`, 2026-11-25):
  - **Gemini 4 Carbon** (`gemini-4-carbon-{low,medium,high}`, deepest reasoning, 1M unified ctx), **Gemini 4 Neon** (`low`..`xhigh`, frontier + fast completion), **Gemini 4 Argon** (`low`..`high`, efficient frontier), **Gemini 4 Hydrogen** (`low`..`xhigh`, replaces 3.8 Flash; `"cuts fabricated claims by more than 5x compared to Gemini 3.8 Flash by flagging missing context instead of guessing, batches read and search tool calls in parallel"`), and **Orchestrator** (two-phase Planner + Hydrogen executor; in `agy 1.5.17`, matching Planner+Executor runs single-agent).
  - **Version discrepancy:** Local `agy models` still lists `gpt-oss-120b-medium` on 2026-11-25 despite Nov 1 docs stating removal on 2026-11-02; `agy --version` prints `1.5.16` while `agy changelog` includes `1.5.17`.
- **Prompting quirks** (D: `aistudio.google.com/docs/choosing-a-model.md`, `thinking.md`):
  - String `thinking_level` only (integer `budget_tokens` returns HTTP 400; `minimal` unsupported on Gemini 4; `xhigh` only on `neon`/`hydrogen`).
  - `max_output_tokens` caps **thinking + visible output combined**: `"Run your evaluations across all supported levels with max_output_tokens set to at least 65,536 so the limit doesn't cut answers short"`.
  - **95% implicit caching:** `"Implicit context caching: Runs by default on Gemini 4 prompts of at least 4,096 tokens and discounts cached input tokens by 95%. Place shared system instructions, tool definitions, and reference documents at the start of your prompt."`
  - Remove `"Think step-by-step"` prose and legacy `temperature`/`top_p` overrides; prefer positive framing and consistent XML *or* Markdown delimiters within a section (**Medium** — search summary of `gemini-4-carbon-developer-guide`).

#### Harness-Specific Features (**High**)
- **Multi-provider `.antigravity-plugin/plugin.json`** (D: `antigravity.google/docs/build-plugins.md`): Takes precedence over root `plugin.json`, specifically `"for multi-provider repositories that also ship .claude-plugin/plugin.json or .cursor-plugin/plugin.json"`. Bundles `skills/`, `mcp_config.json`, `agents/`, **`rules/`**, **`hooks.json`**, `logo`, and **`suggestedPrompts`**. (`agy plugin validate` currently emits a `note` on both `grey-matter` and `tkt` for missing `logo` and reports `"agentPluginsSpec": false`.)
- **Lifecycle Hooks (`hooks.json`, 6 events)** (D: `antigravity.google/docs/hooks.md`): `SessionStart`, `PreToolUse`, `PostToolUse`, `PreInvocation`, `PostInvocation`, `Stop`. Uses **named hook IDs** at top level (`{ "tkt-session-start": { "SessionStart": [...] } }`), **camelCase** stdin (`workspacePaths`, `conversationId`), and `{ "injectSteps": [{ "systemMessage": { "systemMessage": "..." } }] }` stdout. **Bloat warning:** `"Injected systemMessage and userMessage steps remain in the conversation history for later turns. If your hook runs on every PreInvocation, inject a message only when its content changes, instead of repeating the same text each turn."`
- **Rules Hierarchy & silent drops** (D: `antigravity.google/docs/rules.md`): Cumulative workspace -> Git root + `~/.gemini/config/rules/*.md`. Never scans subfolders below workspace root; flat scan inside `.agents/rules/`; requires **snake_case** `trigger: always_on | model_decision | glob | manual` (`alwaysOn` is **silently discarded**).
- **Direct `/grill-me` collision** (L: [`../harness-surfaces/antigravity.md`](../harness-surfaces/antigravity.md)): Antigravity ships a built-in `/grill-me` slash command colliding with `grey-matter/skills/productivity/grill-me`.
- **App v2.35.0 & CLI `1.5.16`/`1.5.17`:** `/generative_ui` (App-only HTML widgets), `/teamwork`, `swarm`, `run_workflow`, `NotificationTimeoutSeconds`, `update_steps`. Headless `-p` still soft-denies unapproved tools with exit 0.

#### Adaptation Proposals for `grey-matter` / `tkt`
- **Add `.antigravity-plugin/plugin.json` (or enrich `deploy.mjs` agy output)** with `logo` (eliminating `agy plugin validate` notes) and 3–5 `suggestedPrompts` starter chips.
- **Ship `tkt` Antigravity `SessionStart` hook (`hooks.json`) + `rules/tickets.md` (`trigger: glob`, `globs: ".tickets/*.md"`):** Zero-context-cost guardrail on ticket files plus frontier injection at session start (never on `PreInvocation`).
- **Document `/grey-matter:grill-me` disambiguation** in [`../harnesses.md`](../harnesses.md) and `compass`.
- **Optional progressive enhancement:** Reference `/generative_ui` in `delivery-dashboard` / visual skills as an App-only live preview while preserving committed `docs/status.html`.

---

### 4. Kiro (`kiro-cli 3.6.0` / VS Code `1.5.0`) & Kiro Crew (`0.13.1`)

#### Frontier Models & Behavioral Idiosyncrasies (**High**)
- **Multi-model catalog & `auto` router** (D: `https://kiro.dev/docs/models/`, Nov 2026; L: [`../harness-surfaces/models-and-usage.md`](../harness-surfaces/models-and-usage.md)): `auto` (`1.0x`) dynamically routes paid tiers to Opus-class+ and never selects Experimental models. Catalog spans Claude 5.5/5/4.x, GPT-5.6 Sol/Terra/Luna, Kimi K3 (`2.4x`), GLM-5 (`0.5x`), DeepSeek 3.2 (`0.25x`), MiniMax M2.5/M2.1 (`0.25x`/`0.15x`), and Qwen3-Coder-Next (`0.05x`). Plan gating is real; trust `kiro-cli chat --list-models -f json` or ACP's `session/set_config_option` advertisement (`"The running server's advertisement is authoritative."`).
- **Telemetry & cheap-tier traps** (L: [`../harnesses.md`](../harnesses.md), [`../harness-surfaces/models-and-usage.md`](../harness-surfaces/models-and-usage.md)): Kiro CLI does not emit verified served model identity (`"A Kiro run pinned to Haiku said it was Sonnet"`), `--effort` is not saved on V3, `chat.enableThinking` toggles a thinking *tool* rather than a token budget, and cheap profiles guessed specs or deleted `README.md` in local trials.

#### Harness-Specific Features (**High**)
- **Major V3 jump (`2.37.0` -> `3.6.0`, 2026-11-24)** (D: `https://kiro.dev/changelog/`, `https://kiro.dev/docs/hooks/`, `https://kiro.dev/docs/permissions/`):
  - **V3 (KAS-backed)** is now default; Classic/V1 retired.
  - **3.1–3.6 hook additions:** `PreCompact`/`PostCompact` (3.1, `exit 2` blocks compaction), `PreToolUse` **input rewriting** & `PermissionRequest` programmatic approval (3.4), **`SubagentStop`** (3.6 — intercepts a completed V3 subagent to send one final instruction before returning to parent), hook outputs >3,000 chars auto-saved to disk with path returned (3.6), guided `/compact <instructions>` (3.6).
  - **Strict parent+child `permissions.yaml` intersection** (`kiro.dev/docs/permissions/`): `deny > ask > allow > evaluate`; every subagent call is checked against **both** parent and child policies — a child can never exceed the parent's grant.
  - **Powers -> Open Agent Plugins `plugin.json`** (`kiro.dev/docs/powers/`, Nov 2026): Migrated from legacy `POWER.md` to `agent-plugins.org/schemas/1.0.0/plugin.schema.json` with `keywords` for dynamic activation.
  - **Steering doc-vs-runtime discrepancy:** V3 docs document `inclusion: always | fileMatch | manual | auto`, while local 2.33.1 probing ([`kiro-steering-empirical.md`](./kiro-steering-empirical.md)) showed custom agent `resources` globs loaded all files unconditionally (unverified on `3.6.0`).
- **Kiro Crew `0.13.1` (2026-11-21)** (D: `https://github.com/kirodotdev/KiroCrew/releases`, `kiro.dev/docs/crew/`): **Conductor Mode** (formerly Ultra Mode) is GA/default; **Mates renamed to Bots** (can select ACP harness `kas|kiro|claude|codex|opencode|goose|deepseek|pi` without a preview flag); KAS grant vault now accepts `kiro-cli` sign-in keys. Crew agents load skills **only** via enabled `app.json` `skill://` entries, never `~/.kiro/skills`.

#### Adaptation Proposals for `grey-matter` / `tkt`
- **Offer opt-in `.kiro/hooks/` templates** (kept out of distributed plugins per Proposal 18): `SubagentStop` to verify ticket evidence/clean `git status` before returning to parent; `PreCompact` to preserve active ticket ID and branch across compaction.
- **Evaluate Open Agent Plugins `plugin.json` for Kiro Powers** (`tkt` already has root `plugin.json`) once flat-vs-nested discovery in `kiro-cli powers install` is verified.
- **Update [`../harness-surfaces/kiro.md`](../harness-surfaces/kiro.md), [`../harness-surfaces/kiro-crew.md`](../harness-surfaces/kiro-crew.md), [`../harness-surfaces/versions.json`](../harness-surfaces/versions.json), and `orchestrate/references/harness-kiro.md`** for `kiro-cli 3.6.0` (strict V3 parent+child permission intersection) and `kirocrew 0.13.1` (Mates -> Bots, Conductor Mode GA).

---

### 5. Kimi Work / Kimi Code CLI & Moonshot AI Frontier Models

#### Frontier Models & Prompting Idiosyncrasies (**High**)
- **Lineup** (D: `kimi.ai`, `huggingface.co/moonshotai`, Jul–Nov 2026):
  - **Kimi K3.1 Pro (2026-11-04):** 2.8T total / 104B active MoE, 1M context, native multimodal (MoonViT-V2), Gated DSA + KDA attention, ~$2/$10 MTok.
  - **Kimi K3 (2026-07-16)**, **Kimi K2.5** (hybrid Thinking/Instant + Agent Swarm), **Kimi K2 Thinking** (200–300 sequential tool calls).
- **Mandatory prompting & API contract** (D: `kimi.ai`, `huggingface.co/moonshotai/Kimi-K2.5`):
  - **Preserved Thinking (`reasoning_content` echo):** Must pass unaltered `reasoning_content` alongside `tool_calls` across multi-turn tool loops; omitting it triggers HTTP 400 (`"thinking is enabled but reasoning_content is missing in assistant tool call message"`).
  - **Sampling:** Thinking mode requires **`temperature = 1.0`, `top_p = 0.95`** (lowering temperature induces repetition loops); non-thinking Instant mode uses `temperature = 0.6`.
  - **Default `reasoning_effort: "max"` on K3/K3.1 Pro** (reasoning permanently enabled; accepts `low|high|max`); lower to `low` for trivial tasks.
  - **Dynamic tool disclosure:** Moonshot recommends dynamic skill/tool loading over dumping large upfront tool lists — directly matching `grey-matter`'s progressive disclosure. Note coding-plan overload errors may be in Chinese (match HTTP/error codes, not English text).

#### Harness-Specific Features (**High**)
- **`.kimi-plugin/kimi.plugin.json`** (L: [`../distribution-maintenance.md`](../distribution-maintenance.md), [`../harnesses.md`](../harnesses.md), verified live 2026-11-08; D: `kimi.com/code/docs`):
  - Supports `skillInstructions` (already used by `grey-matter` to enforce sequential in-session execution and `tkt --version`), `interface.skillOverrides`, `skills/`, `commands/` (with `$ARGUMENTS`), `mcpServers`, hooks (Kimi Code CLI: 7 fail-open events: `SessionStart`, `SessionEnd`, `PreToolUse`, `PostToolUse`, `SubagentStart`, `SubagentStop`, `Stop`), and custom agents.
  - `disable-model-invocation: true` is **verified live** on Kimi Work (2026-11-08): model invocation of `grey-matter:cheat-sheet` refused; explicit user command succeeded.
  - Kimi Code CLI reads `$KIMI_CODE_HOME/AGENTS.md` (`~/.kimi-code/AGENTS.md`), `~/.agents/AGENTS.md`, and project `AGENTS.md`, with live **`/reload`**.
  - **Local Windows / Electron traps** (L: [`../windows-powershell-gotchas.md`](../windows-powershell-gotchas.md), [`../harnesses.md`](../harnesses.md)): (1) `register_personal.sh` aborts under Git Bash on `kimi-daimon.cmd` — use `register_personal.py`; (2) inside Kimi Work, `node` is `Kimi.exe` with `ELECTRON_RUN_AS_NODE=1` — copying/respawning `process.execPath` crashes with `Invalid file descriptor to ICU data received`.

#### Adaptation Proposals for `grey-matter` / `tkt`
- **Auto-generate `interface.skillOverrides` in `scripts/build-kimi-plugin.mjs`**: Eliminates the 2 non-blocking `validate_plugin.py` warnings on `grey-matter` (matching `tkt`'s clean 0-warning build).
- **Add `~/.kimi-code/AGENTS.md` to `scripts/install-agents-md.mjs`** (guarded by `~/.kimi-code` existence).
- **Guard `scripts/gate.mjs` / `tkt/tools/check-tools.mjs` against `ELECTRON_RUN_AS_NODE=1`**: Fail fast with a clear message telling the user to run with a real Node 22+ binary instead of crashing with a cryptic ICU fd error.

---

### 6. Crush (Charm, `v0.93.1` baseline -> `v0.98.1+` upstream)

#### Model Handling & Harness Features (**High**)
- **Dual-tier models & BYO Prompts** (D: `https://github.com/charmbracelet/crush`, releases v0.94–v0.98.1; L: [`../harness-surfaces/crush-opencode.md`](../harness-surfaces/crush-opencode.md)):
  - Splits every session into **`model large`** (coding/reasoning) and **`model small`** (`--small-model`, titles/summarization).
  - **BYO Prompts** allows Go-template overrides including compaction/summary (`option prompt summary path/to/summary.md.tpl`).
- **`crushrc` Bash-DSL & embedded `mvdan.cc/sh/v3`** (D: `charmbracelet/crush` `README.md`, `internal/shell/run.go`):
  - Supersedes `crush.json` (`./.crushrc` > `./crushrc` > `~/.config/crush/crushrc`).
  - Embedded `mvdan.cc/sh/v3` runs with no `.bashrc`/`.zshrc` (avoiding zsh traps). **Shebang dispatch split:** inline commands and shebang-less hook scripts run in-process under `mvdan.cc/sh/v3`; scripts with `#!` dispatch via `os/exec`.
- **13 parallel lifecycle hooks** (D: `charmbracelet/crush/tree/main/docs/hooks`): `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`, `PermissionResult`, `SessionStart`, `SessionEnd`, `TurnStart`, `TurnEnd`, `StopFailure`, `Interrupt`, `PreCompact`, `PostCompact`. Run in parallel, compose deterministically in config order. `exit 2` blocks tool call; **`exit 49` halts the entire turn** (and blocks `PreCompact`).
- **Native LSP & Claude Channels:** Auto-discovers language servers (`internal/lsp`) and supports experimental MCP push events ("Claude Channels").
- **Skills & Global Rules discrepancy:** Reads `.agents/skills`, `.crush/skills`, `.claude/skills`, `.cursor/skills` + `user-invocable: true` for the `ctrl+p` palette (no `disable-model-invocation` documented). **`option global-context-path` defaults to `~/.config/crush/CRUSH.md` and `~/.config/AGENTS.md`** — contradicting [`../harnesses.md`](../harnesses.md) line 361 ("no verified user-level rules path").

#### Adaptation Proposals for `grey-matter` / `tkt`
- **Verify `~/.config/crush/CRUSH.md` live, then add Crush to `scripts/install-agents-md.mjs`** and correct [`../harnesses.md`](../harnesses.md).
- **Enforce explicit `#!/usr/bin/env bash` / `#!/usr/bin/env node` shebangs** on all distributed helper/hook scripts so Crush never runs Node/bash-specific scripts inside `mvdan.cc/sh/v3`.
- **Optional `.crushrc` recipe** in `tkt` / `init-project` docs: `PreToolUse` hook blocking `.tickets/*.md` `status: done` edits (`exit 2`) and `option prompt summary` preserving active ticket IDs across compaction.

---

### 7. OpenCode (`1.19.6` local V1 -> `2.4.1` upstream V2) + Z.ai / GLM

#### Z.ai / GLM Frontier Models & Prompting Idiosyncrasies (**High**)
- **Lineup on `zai-coding-plan`** (L: `opencode models zai-coding-plan --verbose`, 2026-11-25; D: `https://docs.z.ai/guides/llm/glm-5.4`, `glm-5.3`, `https://docs.z.ai/guides/vlm/glm-5.3-flash`):
  - **`glm-5.4`** (released **2026-11-23**, 1M ctx, 128K/131K output, multimodal image/video/file/text): `"GLM-5.4 introduces a Loop Transformer architecture that reuses 28 layers of the GLM-5 base model across two iterations, enabling deeper reasoning without increasing parameter count"`. Weekly Coding Plan quota is **1.5×** that of GLM-5.3; off-peak/weekend calls consume **50%** points.
  - **`glm-5.3`** (1M, text-only), **`glm-5.3-highspeed`** (text-only), **`glm-5.3-flash`** (1M, multimodal image/video/PDF).
- **Forced thinking, Preserved Thinking, and "Marathon Thinking" Loops** (D: `docs.z.ai/guides/llm/glm-5.3`, `glm-5.4`, `guides/capabilities/thinking-mode`):
  - **Cannot disable reasoning:** `"GLM-5.3 always operates with reasoning enabled and supports three reasoning effort levels: low, high, and max. Disabling reasoning is no longer supported."` Default effort is **`max`** (OpenCode `--variant low|high|max`).
  - **Official over-thinking warning:** `"The model still has some limitations. Most notably, it tends to get caught in overly long 'marathon thinking' loops, though this prolonged reflection and self-correction does consistently improve accuracy beyond its parameter count."` (Matches local [`../harnesses.md`](../harnesses.md) observation where an OpenCode/GLM subagent told to reply `"OK"` made 26 read-only tool calls and exceeded 150 s!)
  - **Preserved Thinking default on GLM-5.4:** `"Starting from GLM-5.4, this capability is enabled by default (thinking.clear_thinking defaults to false) on all endpoints... you must return the complete, unmodified reasoning_content back to the API."` OpenCode catalog sets `"interleaved": { "field": "reasoning_content" }`.
  - Defaults: `temperature: 1.0`, `top_p: 0.95` (tune at most one).

#### OpenCode Harness & Major V1 -> V2 Breaking Split (**High**)
- **Version split:** Local install is **`1.19.6`** (V1, 2026-11-17; repo docs still say `1.18.21`), while upstream `anomalyco/opencode` shipped **OpenCode V2 (`v2.4.1`, 2026-11-23)** and `https://opencode.ai/docs/` defaults to V2.
- **V1 vs V2 Plugin API** (D: `anomalyco/opencode@v1.19.6/packages/plugin/src/index.ts`, `https://opencode.ai/docs/migrate-v1.md`, `https://opencode.ai/docs/build/plugins.md`):
  - `"V2 has three intentional breaking changes: Plugins use a new plugin API. The server API and clients have new contracts. Terminal client configuration moves from layered tui.json(c) files to one global cli.json file"` — **V1 `@opencode-ai/plugin` plugins do not run in V2!**
  - V2 moves to **`@opencode/plugin`** with `Plugin.define({ id, async setup(ctx) })`, multi-part exports (`.`, `./tui`, `./gui-experimental`, `./rpc`), config key `"plugins"` (plural), and `opencode plugin add|list|check|update|remove`.
  - **Good news for skills/agents/commands:** `"Existing supported server config fields, agent definitions, command definitions, skills, and other files in .opencode/ should continue to work without changes"`.
  - V1 `Hooks` include `tool.execute.before/after`, `permission.ask`, `experimental.chat.system.transform`, `experimental.session.compacting` (`{ context, prompt }`), `shell.env`.
  - **No hot-reload on config/skills (L: `opencode 1.19.6` built-in `customize-opencode` skill):** `"Config is loaded once when opencode starts and is not hot-reloaded."`

#### Adaptation Proposals for `grey-matter` / `tkt` (OpenCode + GLM)
- **Wait for OpenCode V2 before authoring a JS plugin**: Keep OpenCode integration on portable `SKILL.md` + `.opencode/agents/` + `.opencode/commands/` (V1+V2 compatible) until upgrading locally to 2.x, then build an `@opencode/plugin` (`Plugin.define`) adapter for `tkt` session-start/compaction/tool-guard hooks.
- **Tame GLM-5.4 "marathon thinking" in OpenCode & critic scripts**:
  - Default routine/read-only subagents (`explore`, research, triage) on `zai-coding-plan/glm-5.4` or `glm-5.3-flash` to **`--variant low`** (or `provider/model#low` in V2 agent files); reserve `max` for architecture/debugging/complex tickets.
  - Keep outer timeouts on headless OpenCode/GLM calls (`harnesses.md` critic rule) and add explicit stop-exploring bounds in skills ("stop reading once you have verified X; move directly to edit/verify").
  - Leverage GLM-5.4's native multimodal support for `delivery-dashboard` screenshot checks (`opencode run -f`).

---

### 8. ZCode (Z.ai Desktop `0.17.1+`)

#### Harness Features (**High**)
- Verified locally ([`zcode-plugin-compat-20261108.md`](./zcode-plugin-compat-20261108.md), [`../distribution-maintenance.md`](../distribution-maintenance.md), `tkt/.claude-plugin/hooks/session-start.mjs`) & D (`docs.z.ai`):
  - Reads `.claude-plugin/` directly (including bucket array `skills` -> all 50 skills load) and registers `grey-matter:<name>` **with a bare-name alias**.
  - `dependencies` are read from the **marketplace entry** (not `plugin.json`) and are advisory (no auto-install).
  - Recognizes `name`, `description`, `when_to_use` (snake_case), `license`, `metadata`; **`disable-model-invocation` is ignored** (all skills model-invocable).
  - **Strict hook contract (live-verified `tkt#286`):** `type: "command"` must be a single shell string (separate `args` array fails), and stdout MUST be top-level `{ "hookEventName": "SessionStart", "additionalContext": "..." }` JSON (plain text is discarded). `PreToolUse` supports allow/deny (`exit 2` or `permissionDecision: "deny"`) and input rewrite (`updatedInput`).
  - **Goals (`/goal`):** Native long-horizon verification loop (`/goal <objective>`, `/goal pause|resume|clear`) inside the 1M-context ADE.
  - **Windows CLI subset:** `zcode.cjs` on Windows exposes only `list|enable|disable|uninstall` (no `install`/`update`/`marketplace`/`validate`); onboarding uses the Desktop UI.

#### Adaptation Proposals for `grey-matter` / `tkt`
- **Keep the ZCode dual-stdout discriminator** (`ZCODE_SESSION_ID || ZCODE_PLUGIN_ROOT` -> `{ hookEventName, additionalContext }`) in every shared Claude/ZCode hook script (including any new `tkt` `PreToolUse` write-guard hook).
- **Document `/goal` pairing** with `tkt-work` / `implement` for ZCode users (ZCode's native `/goal` complements ticket acceptance criteria without fighting `orchestrate`).
- **Keep `when_to_use` out of shared `SKILL.md` unless needed** (strict Agent Skills validators reject it; sharp `description` covers ZCode cleanly).

---

### 9. DSH (DeepSeek Harness) & DeepSeek Frontier Models *(Plugin In Progress)*

#### DeepSeek Frontier Models & Prompting Idiosyncrasies (**High**)
- **Lineup** (D: `https://api-docs.deepseek.com/quick_start/pricing/`, `news261017`, `news261113`; HF `DeepSeek-V4.1-Flash-1017/README.md`, 2026-11-25):
  - **`deepseek-flash` -> `DeepSeek-V4.1-Flash-1017`** (2026-10-17, MIT open-weight, DSH `dsh-base` default): 552B MoE asymmetric Causal Encoder-Decoder (**8B active input / 16B active output**), **1M context**, **384K output**, **native Vision**, off-peak **$0.15/M input ($0.003/M cache hit — 50× discount!), $0.60/M output** (peak 2× Mon–Fri 01:00–04:00 & 06:00–10:00 UTC). Built-in server tools (`deepseek_web_search`, `deepseek_read_url`, OCR/ASR/TTS).
  - **`deepseek-v4-pro` -> `DeepSeek-V4-Pro-0813`** (1M/384K, text-only, $0.66/$1.98). **Doc discrepancy:** `news260910` states `"Starting at 04:00 UTC on Sept 14, 2026, all deepseek-v4-pro requests will route to V4.1-Flash at V4.1-Flash rates"`, while `pricing/` and OpenCode still list V4-Pro at $0.66/$1.98. Legacy `deepseek-chat` and `deepseek-reasoner` were retired after 2026-07-24.
- **Critical prompting & API quirks** (D: `api-docs.deepseek.com/guides/{thinking_mode,tool_calls,kv_cache,latest_reminder}/`, HF `encoding/README.md`):
  - **Major reversal from R1 — system prompts ARE first-class in V4/V4.1:** `"Mid-conversation system messages are supported via the <｜System｜> token"` (supported across Chat Completions, Anthropic `/messages`, and Responses API).
  - **Thinking & sampling:** Enabled by default (`high`; effort discretizes to `low=50`, `high=75`, `max=100`). `"Thinking mode does not support the temperature, presence_penalty, or frequency_penalty parameters... setting these parameters will not trigger an error but will also have no effect."`
  - **Interleaved thinking + tool calls:** `"If the request carries the tools parameter: the reasoning_content of all previous turns should be passed back to the API and will be concatenated into the context"`.
  - **Sliding Window KV-cache prefix rule:** `"Due to the Sliding Window Attention mechanism... Each cached prefix is an independent, complete unit. A subsequent request can only hit the cache if it fully matches a cache prefix unit"`. Preserving an immutable system prompt + tool prefix yields the 50× cache discount; dynamic dates belong in the `latest_reminder` role (`{"role": "latest_reminder", ...}`).

#### DSH (`deepseek-ai/deepseek-harness`) Architecture (**High**)
Verified from `github.com/deepseek-ai/deepseek-harness` (`master`, 2026-11-22, developer preview — `"THERE WILL BE COMPATIBILITY-BREAKING CHANGES"`) and local `~/.dsh/profiles/web/`:
- **Cordis Microkernel ("Everything is a Plugin"):** Plugins declare `{ inject?: [...], apply(ctx, config) }` or extend `Service` (`ctx.tools`, `ctx.skills`, `ctx.llm`, `ctx.agents`, `ctx.sessions`, `ctx.systemPrompt`, `ctx.sandbox`, `ctx.subagents`). Five event modes: `emit`, `waterfall` (around-middleware with veto), `parallel`, `serial`, `bail`.
- **Layered `cordis.patch.yml` composition:** Bundles in `package.json` `dsh.profile.bundles` -> profile `cordis.patch.yml` -> home patch -> `--patch`. **Trap:** `"A patch replaces the targeted row's whole config rather than merging into it."`
- **Bundle packaging & version gate:** npm package with `"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }`, `engines.dsh`, and DSH `peerDependencies`. `dsh-plugin-manager` rejects unmet `engines.dsh` before `pnpm` runs (`incompatible-version`).
- **`defineTool` & pipeline hooks:** Typed schema DSL supporting Native + PTC (`run_code`) executors, conditional `{ when }` activation, `tools/pre-execute` (`waterfall`), **`ctx.tools.guard(fn)`** (monotonic sync veto — cannot be overridden), `tools/post-execute` (`waterfall`), `tools/result` (`emit`). Built-in `@deepseek-ai/dsh-repeat-tool-reminder` injects nudges at `[3, 5, 8]` consecutive identical calls.
- **Skills (`dsh-skill` + `dsh-skill-filesystem`) — STRICT RULES:**
  1. **Flat only:** `<name>/SKILL.md` or `<name>.md` — `"nested **/SKILL.md files are deliberately not discovered."`
  2. **Strict kebab-case name:** `^[a-z0-9]+(?:-[a-z0-9]+)*$` (no colons, underscores, or uppercase).
  3. **Strict boolean frontmatter:** `disable-model-invocation` and `user-invocable` must be true booleans (`"a rejected spelling or a non-boolean value drops the whole skill with a warning"`). Uses **`whenToUse` (camelCase!)**.
  4. **Programmatic `SkillProvider` on `ctx.skills`:** A Cordis plugin can serve skills directly from bucketed repo directories with `resourceBase` set and live `control.invalidate()` — no file copying needed!
- **Rules (`dsh-agent-instructions`):** Loads `$DSH_HOME/AGENTS.md` -> `~/.agents/AGENTS.md` + project chain (SHA-1 deduplicated), injected as a durable `user`-role `<system-reminder>` message at first `agent/pre-step` (preserving KV cache!), default `65536` bytes/chain.
- **Subagents, Sandbox, & MCP Media Caveat:** In-process fresh/fork + out-of-process `acp`/`codex`/`claude-code`/`dsh-sdk` children; `bwrap`/Landlock/Seatbelt/Windows ACL sandboxes; DSH `0.1.0-rc.6` strips credential env vars from MCP children and discards MCP image/audio blocks.

#### Blueprint & Adaptation Proposals for the In-Progress DSH Plugin
1. **Use a Cordis `SkillProvider` on `ctx.skills` (recommended over raw `dsh-skill-filesystem`)**: Because DSH deliberately ignores nested `skills/<bucket>/<name>/SKILL.md`, a tiny Cordis `SkillProvider` maps `grey-matter`'s bucket layout directly into flat kebab-case `SkillCandidate`s with `resourceBase` pointing to each skill dir — zero copies, cross-OS, live-reloadable. (If deploying copy-mode too, add `dsh` with `~/.dsh/skills` to `deploy.mjs`'s `HARNESSES()` duplicate guard!)
2. **Enforce strict DSH frontmatter compatibility in `scripts/check-skill-syntax.mjs`**: `check-skill-syntax.mjs` already enforces kebab-case `name`s (`^[a-z0-9]+(?:-[a-z0-9]+)*$`) and strict YAML booleans on `disable-model-invocation` / `user-invocable`; also reject DSH-dropped legacy camelCase keys (`disableModelInvocation`, `modelInvocable`, `userInvocable`).
3. **Never patch built-in `dsh-base` rows in `cordis.patch.yml`**: Because patches replace whole row configs rather than deep-merging, insert new plugin rows with unique IDs (`grey-matter:*`, `tkt:*`).
4. **Exploit Cordis hooks & `defineTool` for `tkt` while protecting the 50× KV cache**:
   - Inject `tkt ready` / `in_progress` once per session on `agent/pre-step` as a durable `user`-role `<system-reminder>` message — **never mutate `ctx.systemPrompt` mid-session**.
   - Register a monotonic **`ctx.tools.guard()`** blocking direct edits that write `status: done` into `.tickets/*.md`.
   - Optionally expose read-only, parallel-safe `defineTool` wrappers (`tkt_ready`, `tkt_query`) with structured `output.schema` so they work in both Native and PTC (`run_code`) modes.
5. **Add `~/.dsh/AGENTS.md` to `scripts/install-agents-md.mjs`** and watch `engines.dsh` compatibility bounds during DSH developer preview.

---

### 10. Qwen Code (`v0.28.4` / `v1.0.0-preview.2`) & Qwen Frontier Models *(Plugin In Progress)*

#### Qwen Frontier Models & Prompting Idiosyncrasies (**High**; Qwen4-Max architecture/cap details **Medium–High**)
- **Lineup** (D: `QwenLM/qwen-code` `v1.0.0-preview.2` release 2026-11-25; HF `Qwen3.8-2.4T-A95B/README.md`, `Qwen3-Coder-Next/README.md`):
  - **`Qwen4-Max`** (mid-Nov 2026, added to Qwen Code subscription catalog in `v1.0.0-preview.2` on 2026-11-25: `"Add Qwen4-Max to the Qwen subscription catalog (1M context window, image and video input)."`): 2.4T/71B active MoE (GDN + QSA), 1M ctx, up to 262K max output in thinking mode (131K non-thinking). **Output-budget trap (Medium–High):** `max_tokens` covers reasoning + visible answer combined; do not combine `reasoning_effort` and `thinking_budget`.
  - **`Qwen3.8-Max` (API) & `Qwen3.8-2.4T-A95B` (open-weight, 2026-11-07) + `Qwen3.8-Flash-Next` (multimodal)**: 2.4T/95B active MoE, 262K native -> 1M ctx. Open-weight `2.4T-A95B` is text-only & thinking-mandatory (`"thinking cannot be disabled"`), while cloud `Qwen3.8-Max` adds vision + non-thinking + 1M default. Sampling: `temperature=1.0, top_p=0.95, top_k=20`, default `reasoning_effort: "xhigh"`, `preserve_thinking` on by default. Raising `presence_penalty` suppresses repetition but `"may occasionally result in language mixing"`.
  - **`Qwen3-Coder-Next`** (80B/3B active MoE, 256K ctx): **Non-thinking only** (`"supports only non-thinking mode and does not generate <think></think> blocks"`). Self-hosted requires `--tool-call-parser qwen3_coder`; because it emits no `<think>` block, complex multi-file workflows benefit from explicit plan/verify steps in skills.

#### Qwen Code Harness (`v1.0.0-preview.2`) & `Qwen-MM-Plugins` (**High**)
Verified from `github.com/QwenLM/qwen-code` (`main` + `v1.0.0-preview.2`, 2026-11-25) and `github.com/QwenLM/Qwen-MM-Plugins`:
- **Merged Qoder + Qwen Code 1.0 Preview & Daemon (`qwen serve` / `qwen daemon`):** Persistent HTTP + SSE AppServer (`127.0.0.1:4170`), Web Shell, ACP children, multi-workspace, runtime MCP/skill toggling without restart.
- **Four Extension Formats — CRITICAL CHOICE:**
  1. **Native Qwen Extension (`qwen-extension.json`):** Full surface — `skills/`, `commands/`, `agents/`, conditional `rules/`, `contextFileName` (`QWEN.md`), `mcpServers`, channels, **manifest-level `hooks`**, and `/extensions` hot-reload without restart.
  2. **Claude Code / Gemini CLI / Qoder auto-conversion:** `qwen extensions install <mkt>:<plugin>` auto-converts manifests, skills, agents, MCP, and tools.
  3. **Agent Plugins v1 (`plugin.json`):** Loaded natively **BUT IGNORES commands, agents, hooks, workflows, Qwen context/settings, and legacy SSE MCP** — supports only direct-child `skills/*/SKILL.md` + stdio/Streamable-HTTP MCP!
- **Skills Discovery, Qualified Names, & Extension Limitations (`docs/users/features/skills.md`):**
  - Roots: `.qwen/skills/`, `.agents/skills/`, `~/.qwen/skills/`, `~/.agents/skills/`, extensions, bundled.
  - **NO bare-name alias for extension skills (major difference from ZCode!):** `"Invoke it as /rust:pdf. The bare /pdf is not an alias — the extension's Skill is reachable only under its registered name. The model calls it as Skill { skill: 'rust:pdf' }."`
  - **Filename folding collision:** Non-`[A-Za-z0-9._-]` chars fold to `_` (`rust:pdf` collides with `rust_pdf`).
  - Supports `disable-model-invocation: true`, `user-invocable: false`, `paths:` (picomatch globs — hides skill until matching file is touched!), `priority`, `allowedTools`.
  - **CRITICAL:** `"hooks: is read for project, user, and bundled Skills. Extension-provided Skills do not support it; use the extension's own manifest-level hooks instead."`
- **Rules (`QWEN.md`, `AGENTS.md`, `rules/`) (`docs/users/features/{memory,rules}.md`):**
  - Reads `~/.qwen/QWEN.md`, `<project>/QWEN.md`, AND **`AGENTS.md` natively**.
  - **Conditional extension rules:** `"An extension can ship a rules/ directory, and its rules must be conditional: a rule with no paths: is skipped, with a startup warning naming it."`
- **Hooks (`docs/users/features/hooks.md`):** `PreToolUse`, `PostToolUse`, `SessionStart` (`startup|resume|clear|compact`), `Stop`, `SubagentStart`, `SubagentStop`, `FileChanged`, etc. Emits Claude-compatible `hookSpecificOutput: { hookEventName, permissionDecision, updatedInput, additionalContext }` JSON. Matchers are **unanchored regexes** (anchor with `^edit$`!). Project hooks require folder trust even in `-p` / YOLO.
- **Sandbox & Worktree Warning (`docs/users/features/sandbox.md`):** In `tools.executionSandbox` confined mode, `"Skill command execution and the model Skill tool remain unavailable until their preparation writes are confined"`, and linked Git worktrees mount common `.git` read-only (blocking `git`/`tkt` commits in worktrees!).
- **`Qwen-MM-Plugins` prior art:** Cross-harness Skill + pinned `uvx` stdio MCP bundles (`qwen-mm-plugins-<cap>-v<ver>`) for 4K/video/PDF/3D/CAD perception.

#### Blueprint & Adaptation Proposals for the In-Progress Qwen Code Plugin
1. **Ship native `qwen-extension.json` (NOT Agent Plugins v1 `plugin.json`)**: Only native `qwen-extension.json` supports manifest-level hooks, conditional `rules/`, commands, agents, `QWEN.md`, and `/extensions` hot-reload. Flatten `skills/<name>/SKILL.md` in the built extension bundle.
2. **Solve the no-bare-alias naming problem explicitly**: Because extension skills are reachable ONLY as `grey-matter:<skill>` / `tkt:<skill>` (unlike ZCode's bare aliases), include a 2-line `QWEN.md` extension context note telling the model to resolve bare skill names referenced inside `compass` / `grey-matter` skills to their registered `<ext>:<skill>` name from `<available_skills>` (and guard bare copy-mode `~/.qwen/skills/` vs extension install in `deploy.mjs`).
3. **Put all `tkt` hooks at the extension manifest level (`hooks/`), never in `SKILL.md` frontmatter**: Anchor every matcher (`^edit$`, `^write_file$`, `^run_shell_command$`) and emit `hookSpecificOutput: { hookEventName, additionalContext }` JSON.
4. **Use Qwen's `paths:` conditional `rules/` for `tkt` (`paths: [".tickets/**/*.md"]`)**: Enforces "never hand-edit `status: done`; use `tkt close`" with **zero resident prompt token cost** until a ticket file is touched.
5. **Add `~/.qwen/QWEN.md` to `scripts/install-agents-md.mjs`** (leaving project `AGENTS.md` untouched since Qwen reads it natively).
6. **Document `executionSandbox` worktree/Skill caveats** in `orchestrate` (when adding `harness-qwen.md`) and keep explicit plan/verify steps in `tkt-work` for non-thinking `Qwen3-Coder-Next`.

---

## Prioritized Action Summary (Proposed Next Tickets)

### Tier 1 — Shared Portable High-Leverage Wins (Benefit Every Harness)
1. **Prompt & Skill Hygiene Pass** (`writing-for-agents`, `grilling`, `diagnosing-bugs`, `research`, `tkt-work`, `orchestrate`):
   - Remove any `"show your reasoning"` requests (`reasoning_extraction` refusal on Claude 5.5 / Fable 5.2).
   - Prune legacy `"think carefully"`, `"be concise"`, and blanket delegation lines (Fable 5.2 caution pile-up & over-spawning; GPT-6.2 / Gemini 4 defaults).
   - Add balanced completion/stopping bounds (countering Fable 5.2 / Haiku 5.5 early stops AND GLM-5.4 marathon-thinking read loops).
   - Remove hardcoded vendor tool names (`Edit`, `Grep`, `Bash`) where conceptual verbs ("edit the file", "search the repo") work cleanly across Codex `apply_patch`, Qwen `write_file`, DSH `defineTool`, and Crush.
2. **Skill Description Front-Loading & Syntax Tightening** (`scripts/check-skill-syntax.mjs`, all 54 skills):
   - Keep the primary trigger inside the first **140 characters** of `description` (survives Codex's 2% skill-list truncation and Claude's 1,536-char cap).
   - Enforce DSH-safe kebab-case `name`s (`^[a-z0-9]+(?:-[a-z0-9]+)*$`) and strict YAML booleans on `disable-model-invocation` / `user-invocable`.
   - Enforce an explicit `AGENTS.md` size cap check well under Codex's 32 KiB `project_doc_max_bytes`.
   - Audit the 17 of 54 skills missing `agents/openai.yaml`.
3. **Refresh Harness & Model Baselines** (`docs/agents/harness-surfaces/versions.json`, `models-and-usage.md`, `claude-code.md`, `codex.md`, `antigravity.md`, `kiro.md`, `kiro-crew.md`, `crush-opencode.md`, `harnesses.md`):
   - Update CLI versions (`claude 2.1.332`, `codex 0.172.0`, `kiro-cli 3.6.0`, `kirocrew 0.13.1`, `agy 1.5.16`, `opencode 1.19.6`/V2, `crush 0.98.1+`) and Nov 2026 frontier models.
   - Add `kimi-code`, `crush` (after live probe), `dsh`, and `qwen` to `scripts/install-agents-md.mjs`.
   - Add `ELECTRON_RUN_AS_NODE=1` guard to Node gate scripts (Kimi Work ICU crash prevention) and verify `#!` shebangs on all distributed scripts (Crush `mvdan.cc/sh/v3` dispatch).

### Tier 2 — Existing Plugin Upgrades
4. **`tkt` Deterministic Guardrails & Frontier Injection Across Plugins**:
   - **Claude Code / ZCode:** Add `PreToolUse` `.tickets/*.md` `status: done` guard (with `if:` filter on Claude, single-command + ZCode JSON discriminator).
   - **Antigravity:** Commit `.antigravity-plugin/plugin.json` (with `logo` + `suggestedPrompts`), add named-key `hooks.json` `SessionStart`, and ship `rules/tickets.md` (`trigger: glob`, `globs: ".tickets/*.md"`).
   - **Kiro 3.6 / Crush / Codex:** Offer opt-in project hook templates (`SubagentStop`/`PreCompact` for Kiro; `exit 2`/`exit 49` + BYO summary for Crush; keep Codex plugin `"hooks": []` for public directory eligibility).
5. **Kimi Plugin Polish (`scripts/build-kimi-plugin.mjs`):** Auto-generate `interface.skillOverrides` for zero-warning `validate_plugin.py` passes.
6. **Antigravity Collision & Claude Evals:** Document `/grey-matter:grill-me` disambiguation on Antigravity; pilot `claude plugin eval --ablation with-without` on 2–3 core skills.
7. **OpenCode V2 & GLM-5.4 Tuning:** Hold off on JS plugin authoring until upgrading to OpenCode V2 (`@opencode/plugin`); configure `--variant low` for read-only/routine GLM-5.4 subagents.

### Tier 3 — Blueprint Requirements for the In-Progress DSH & Qwen Code Plugins
8. **DSH Plugin (`grey-matter` + `tkt`):** Cordis bundle (`"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }`), custom `SkillProvider` on `ctx.skills` (avoiding DSH's flat-only filesystem scan), unique inserted row IDs (never partial-patching `dsh-base`), `agent/pre-step` durable `<system-reminder>` injection (preserving 50× DeepSeek V4.1 KV cache), `ctx.tools.guard()` for `.tickets/*.md`, and read-only `defineTool` wrappers compatible with PTC `run_code`.
9. **Qwen Code Plugin (`grey-matter` + `tkt`):** Native `qwen-extension.json` (NOT Agent Plugins v1 `plugin.json`), flattened `skills/`, minimal `QWEN.md` qualified-name bridge (`ext:skill`, no bare alias), manifest-level `hooks/` with anchored regex matchers (`^edit$`) and `hookSpecificOutput` JSON (never `SKILL.md` `hooks:`), and `paths: [".tickets/**/*.md"]` conditional `rules/`.

---

## Version Mismatches & Doc-vs-Runtime Discrepancies

1. **Anthropic Fable:** [`../harness-surfaces/models-and-usage.md`](../harness-surfaces/models-and-usage.md) lists Fable 5.1; `platform.claude.com/docs/en/models/overview` (2026-11-25) lists **Claude Fable 5.2**.
2. **Codex models, context, & `plugin_hooks`:** Baseline lists `0.166.0` + GPT-6.1 Sol / GPT-6 Astra; local `0.172.0` ships **GPT-6.2 Sol** (500K) and **GPT-6.2 Astra** (**272K** bundled vs up to 1.05M API). `hooks.md` documents plugin `hooks/hooks.json`, while `codex features list` shows `plugin_hooks: removed / false` alongside `hooks: stable / true`.
3. **Antigravity models & version:** Baseline lists `1.4.12` + Argon / 3.8 Flash; local `1.5.16` lists **Gemini 4 Carbon, Neon, Argon, Hydrogen, Orchestrator**, still includes `gpt-oss-120b-medium` (previously marked removed 2026-11-02), and its changelog already contains `1.5.17`.
4. **Kiro & Kiro Crew:** Baselines list `kiro-cli 2.37.0` and `kirocrew 0.11.1` ("Mates"); local/upstream reached **`kiro-cli 3.6.0`** (V3 default, V1 retired) and **`kirocrew 0.13.1`** (Mates -> **Bots**, Conductor Mode GA, KAS grant-vault fix). Kiro V3 steering `inclusion:` docs disagree with local 2.33.1 custom-agent empirical observations.
5. **Crush:** Baseline lists `v0.93.1`; upstream reached `v0.98.1+`. [`../harnesses.md`](../harnesses.md) says Crush has no verified user-level rules path, while [`../harness-surfaces/crush-opencode.md`](../harness-surfaces/crush-opencode.md) documents `option global-context-path` (`~/.config/crush/CRUSH.md`, `~/.config/AGENTS.md`). Binary exposes `crush server` while README says `crush serve`.
6. **OpenCode:** Baseline lists `1.18.21`; local install is `1.19.6` (V1, `--share` removed from `run --help`), while upstream shipped **V2 (`v2.4.1`, 2026-11-23)** with a breaking plugin API (`@opencode/plugin`).
7. **DeepSeek `deepseek-v4-pro` routing:** `news260910` states `deepseek-v4-pro` routes to `V4.1-Flash` at Flash rates from 2026-09-14 until V4.1-Pro launches, while `quick_start/pricing` and OpenCode's model catalog still list `DeepSeek-V4-Pro-0813` at $0.66/$1.98.
8. **Qwen3.8 open-weight vs cloud & API kwargs:** Open-weight `Qwen3.8-2.4T-A95B` is text-only and thinking-mandatory (and vLLM/SGLang uses nested `chat_template_kwargs`), whereas cloud `Qwen3.8-Max` adds vision + non-thinking + top-level `extra_body` kwargs.

---

## Couldn't Verify

- **Gemini 4 Carbon Developer Guide raw text (`aistudio.google.com/learn/gemini-4-carbon-developer-guide`):** Returned an Angular SPA shell on direct fetch; style points (positive framing, single delimiter style per section) came via search grounding summaries (**Medium** confidence).
- **Codex `0.172.0` live plugin `hooks/hooks.json` execution (CLI vs Desktop) & exact 54-skill token count against the 2% cap:** Not executed live (read-only research scope); `plugin_hooks: removed/false` vs `hooks: stable/true` needs a live probe.
- **Claude `2.1.332` live `claude plugin eval` & `PreSkillShellCommand` execution, and Antigravity `1.5.16` live `/grill-me` collision resolution:** Not executed live; relied on official 2026-11-25 docs and local CLI help/surfaces.
- **Kiro `3.6.0` live runtime behavior for steering `inclusion:`, `disable-model-invocation`, and served-model-ID reporting in `stream-json`/ACP:** Docs checked through 3.6.0 changelog; no live `3.6.0` model run performed. Exact pinned `@kiro/agent` KAS version inside `kirocrew 0.13.1` was not surfaced in search snippets.
- **Kimi Work raw `kimi.plugin.schema.json` & live mid-session plugin update propagation:** `catalog.msh.team/misc/kimi.plugin.schema.json` was not directly indexed by search; mid-session update timing remains unprobed ([`../harnesses.md`](../harnesses.md)).
- **Crush exact latest patch tag on 2026-11-25, `CRUSH_CORE_UTILS` semantics, live `~/.config/crush/CRUSH.md` loading, and `disable-model-invocation` tolerance on `v0.98+`:** Grounding confirmed `v0.98.1` and active `v0.98`/`v0.99` work, but did not return an exact Nov 25 tag or public doc for `CRUSH_CORE_UTILS`.
- **OpenCode V2 individual server-plugin hook signatures (`/docs/build/plugins/server.md`):** Verified V1 (`1.19.6`) `Hooks` verbatim from source and V2's `Plugin.define` / breaking split from official docs, but did not fetch the full V2 server-hook catalog.
- **Z.ai official GLM-5.4 prompting guide URL & Windows ZCode CLI subcommands beyond `plugins`/`skills`/`doctor`:** No standalone `/prompting-guide` URL appeared in `docs.z.ai/sitemap.xml`; GLM-5.4 "marathon thinking" was verified verbatim on `docs.z.ai/guides/llm/glm-5.4`, while community read-loop reports are **Low–Medium** confidence.
- **DeepSeek `deepseek-v4-pro` live served model & empirical few-shot impact on V4.1:** Verified absence of a few-shot prohibition in current V4/V4.1 docs (and verified first-class system-prompt support); made no live API call to test routing or few-shot benchmarks.
- **Qwen4-Max raw Alibaba Cloud DashScope parameter page HTML:** Confirmed `Qwen4-Max` (1M ctx, image/video) in Qwen Code `v1.0.0-preview.2` release notes (2026-11-25); detailed 2.4T/71B GDN+QSA architecture and combined `max_tokens` thinking+answer cap came from search summaries of Alibaba Cloud docs (**Medium–High** confidence).
