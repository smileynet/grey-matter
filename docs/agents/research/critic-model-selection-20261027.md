# Critic model selection across harnesses (verified 2026-10-27)

Question: which model should review-critic subagents run on in Claude Code, Codex, Kiro CLI and
opencode, and how does each harness let us pin it? Evidence is each vendor's official
documentation, fetched on the date above. Third-party summaries turned up by search disagreed with
the official pages in places (noted below); the official pages win. Model names and prices change,
so recheck before relying on them.

## Model lineups

| Vendor | Model (API ID) | What the official page says | List price per MTok (in / out) |
| --- | --- | --- | --- |
| Anthropic | Claude Fable 5.1 (`claude-fable-5-1`) | "For demanding reasoning and long-horizon agentic work"; use it "when your evals on Claude Opus 5.5 at higher effort still fall short". Slower. | $10 / $50 |
| Anthropic | Claude Opus 5.5 (`claude-opus-5-5`) | "Start with" it "for most workloads"; "for long-running agentic coding and knowledge work". | $4 / $20 |
| Anthropic | Sonnet 5.5, Haiku 5.5 | Speed and cost tiers; not critic candidates. | $2 / $10, $0.10 / $0.50 |
| OpenAI | GPT-6 Astra (`gpt-6-astra`) | "Our most capable model for the most demanding work"; Codex: "Astra suits the most demanding workflows". | $10 / $50 |
| OpenAI | GPT-6.1 Sol (`gpt-6.1-sol`) | "Near-Astra performance for complex work at a lower cost than Astra." | $2 / $10 |

Sources: [Claude models overview](https://platform.claude.com/docs/en/about-claude/models/overview),
[OpenAI models](https://developers.openai.com/api/docs/models),
[Codex models](https://learn.chatgpt.com/docs/models).

Anthropic's own guidance ranks Fable 5.1 above Opus 5.5 for demanding work. The working assumption
that Opus 5.5 is Claude's best model is true of the default recommendation, not of the lineup.
Claude Code's model page calls the Fable models "the most capable models in Claude Code" and
defines an alias `best`: Fable where it is available to you, otherwise Opus (that alias is not
accepted in a subagent's `model` field; see below). Fable is never an account default. It is
selected explicitly and, depending on plan, may bill usage credits; non-interactive runs bill it
without a consent prompt; it is unavailable under zero data retention. Source:
[Claude Code model configuration](https://code.claude.com/docs/en/model-config).

## Pinning a model per harness

| Harness | How to pin | Resolution order and pitfalls |
| --- | --- | --- |
| Claude Code | Per spawn: the `model` parameter (`sonnet`, `opus`, `haiku`, `fable`, a full ID such as `claude-opus-5-5`, or `inherit`). In a subagent file: `model:` frontmatter. Effort: `effort:` frontmatter or a per-invocation parameter (`low` to `max`). `best` is not accepted for subagents. | Model order: per-invocation parameter, then frontmatter, then `CLAUDE_CODE_SUBAGENT_MODEL`, then the main model. `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` makes the variable override everything (2.1.257+). Effort order: `CLAUDE_CODE_EFFORT_LEVEL`, then per-invocation, then `effort:`, then session. An organisation `availableModels` allowlist moves a blocked family alias to the newest allowed version of that family, and a blocked full ID to the inherited model, which can be a silent downgrade. A family alias resolves to the parent's exact model when the parent is in that family. Opus 5.5 defaults to `medium` effort; Fable 5.1 to `high`. Source: [subagents](https://code.claude.com/docs/en/sub-agents). |
| Codex | Custom agent TOML in `~/.codex/agents/` or `.codex/agents/` with `model` and `model_reasoning_effort`; or ask for a model in the spawn prompt; or `[agents] default_subagent_model` and `default_subagent_reasoning_effort` in `config.toml`. | Resolution: explicit spawn value, then the `[agents]` default, then the parent; a value set inside the agent file takes precedence. A model set without effort uses that model's default effort. Effort values: `low`, `medium`, `high` (suggested for reviewer and security agents), `xhigh`, `max`, `ultra` where the model supports them. Subagents are on by default. Source: [Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents). |
| Kiro CLI | A custom agent's `model` field: an ID that "must match one of the available models returned by Kiro's model service". | An unavailable pinned model makes "the first prompt … fail instead of falling back automatically". The page does not say whether subagents can take their own model, and does not list models; `kiro-cli chat --list-models` and `/model` do. Source: [Kiro agent configuration](https://kiro.dev/docs/custom-agents/configuration-reference/). |
| opencode | `model: provider/model-id` in an agent's frontmatter or `opencode.json` (for example `anthropic/claude-opus-5-5`). | A subagent with no `model` uses the model of the primary agent that invoked it. Source: [opencode agents](https://opencode.ai/docs/agents/). |

## Disagreements and gaps

- A search summary said Codex has no setting for a default subagent model. The official page
  documents `agents.default_subagent_model`. The official page is right.
- One third-party post says OpenAI's Astra launch was "on hold". Nothing in the official OpenAI
  or Codex pages says so; both list Astra as available. Treat as unverified.
- The Claude Code page says nothing about Fable's availability inside Kiro, opencode or a gateway;
  a Claude model may be absent from a given harness or plan, so selection must probe at run time.
- Kiro's documentation does not say how to set a subagent's model, and neither Kiro nor opencode
  documents effort for subagents. Defaults apply there.
- The `Agent` tool in this session offers `sonnet`, `opus`, `haiku` and `fable` as model values, which
  agrees with the Claude Code page.

## Owner decision and this machine's catalogs

Decision (2026-10-27): critics use Claude Opus 5.5 and GPT-6.1 Sol, which are both available on
subscription plans. Fable 5.1 and Astra stay opt-in.

What each CLI on this machine (randomserver) offers, read-only:

| Harness (version) | Source of the list | Ceiling model present? |
| --- | --- | --- |
| Claude Code 2.1.252 | The docs' alias `opus` (Opus 5.5 on the Anthropic API) | Expected, not yet exercised |
| Codex 0.147.0 | `~/.codex/models_cache.json`, fetched 2026-10-21 for client 0.147.0: `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`; configured `model = "gpt-5.6-sol"` at `medium` | No `gpt-6.1-sol`. Codex's own docs say Terra needs 0.159.0 or later, so the CLI is likely too old or the catalog stale |
| Kiro CLI 2.16.0 | `kiro-cli chat --list-models` | No. Strongest Claude is `claude-opus-4.5` |
| opencode 1.18.21 | `opencode models` | Yes, under the `opencode/` provider: `opencode/claude-opus-5-5`, `opencode/gpt-6.1-sol` (also Fable 5.1 and Astra). Auth is configured for `opencode`, `openrouter` and others, not direct `anthropic` or `openai` providers |

These are catalogs, not proof that a request succeeds. The spike checks that.
