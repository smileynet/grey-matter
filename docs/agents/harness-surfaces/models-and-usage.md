# Models, effort and usage: how to check, per provider

How an agent finds each provider's **current** recommended models, picks one and an effort level for a task, and reads how much of the subscription is left. Model lineups change monthly, so this file records **where to look** first; the lineup tables are a dated snapshot. Re-check before relying on one. For the moving-work rule when a limit runs out, see [provider switching](../provider-switching.md).

**Gathered:** 2026-11-01, by four research subagents reading the local installs and official docs. Marks follow the [README](./README.md#evidence-marks): **L** local, **D** documented, **I** inferred.

## Where to check the current models

| Provider (harness) | Headless check | In session | Docs |
|---|---|---|---|
| Anthropic (Claude Code) | `claude.exe -p … --output-format stream-json`: the `system/init` event names the model (D); statusline JSON has `model`, `effort.level`, `fast_mode` (D) | `/model` picker, `/effort status`; startup header (D) | [model-config](https://code.claude.com/docs/en/model-config), [models overview](https://platform.claude.com/docs/en/about-claude/models/overview) |
| OpenAI (Codex) | `codex debug models` (live catalog; `--bundled` for built-in) (L); `~/.codex/models_cache.json` with each model's `supported_reasoning_levels` and `default_reasoning_level` (L) | `/model` (only models the account can use) (D) | [learn.chatgpt.com/docs/models](https://learn.chatgpt.com/docs/models) |
| Amazon (kiro-cli, Kiro IDE, Kiro Crew) | `kiro-cli chat --list-models -f json`: id, context window, `rate_multiplier`, `default_model` (L); Kiro Crew cache `~/.kiro/crew/provider_models.json` (L) | `/model` (D) | [kiro.dev/docs/models](https://kiro.dev/docs/models/) |
| Google (agy, Antigravity) | `agy models` (slug and label, tab-separated; no JSON) (L) | `/model`, `/effort` (D) | [antigravity.google/docs/models](https://antigravity.google/docs/models) |

Plan gating is real: on this machine Kiro and agy each list fewer models than their docs, because of the account or plan. Trust the local listing for what this account can run.

## Snapshot lineup (2026-11-01)

**Anthropic** (D: models overview, model-config):

| Model | ID | Use for | Default effort (Claude Code) |
|---|---|---|---|
| Fable 5.1 | `claude-fable-5-1` | The hardest, longest work: root-cause investigations, architecture. Never the default | high (API) |
| Opus 5.5 | `claude-opus-5-5` | Complex reasoning; the Claude Code default on every plan | medium |
| Sonnet 5.5 | `claude-sonnet-5-5` | Everyday coding; teammates | medium (Claude Code) / high (API): the docs disagree |
| Haiku 5.5 | `claude-haiku-5-5` | Simple tasks and simple sub-agents | medium |

Aliases: `default`, `best`, `fable`, `opus`, `sonnet`, `haiku`, `opus[1m]`, `sonnet[1m]`, and `opusplan`, which plans on Opus and executes on Sonnet.

**OpenAI** (L: `models_cache.json`; D: models page):

| ID | Use for | Default effort | Levels |
|---|---|---|---|
| `gpt-6-astra` | The hardest end-to-end work; start at `low` | medium | low to ultra |
| `gpt-6.1-sol` | Long-running work, cheaper than Astra (this machine's default) | low | low to ultra |
| `gpt-6.1-terra` | Writing, vision, computer use | low | low to ultra |
| `gpt-6-luna` | High-volume summarization, extraction, focused coding; start at `high` | medium | low to max |

Hidden: `gpt-reserve` ("Fast and affordable") and `codex-auto-review`, which backs `--approve-for-me`. Every model has a Fast (`priority`) tier.

**Amazon / Kiro** (L: `--list-models` on this BuilderId account; D: guidance):

| Model | Credit multiplier | Use for (D) |
|---|---|---|
| `auto` (default) | 1.0 | General work |
| `claude-opus-4.5` | 2.2 | Complex multi-file work |
| `claude-sonnet-4.6` / `-4.5` | 1.3 | Scoped fixes and reviews |
| `claude-haiku-4.5` | 0.4 | High-volume, quick responses (ticket 128's workers) |
| `minimax-m2.5` / `m2.1` | 0.25 / 0.15 | "Near-Opus" quality cheaply |
| `glm-5` | 0.5 | Long-horizon work |
| `deepseek-3.2` | 0.25 | Experimental preview |
| `qwen3-coder-next` | 0.05 | Tight budgets |

The docs also list Opus/Sonnet/Haiku 5.5, GPT-5.6 Sol/Terra/Luna and Kimi K3, which aren't offered to this account.

**Google / Antigravity** (L: `agy models`; D: models page): `gemini-4-argon-{low,medium,high}` (needs Pro, Ultra or Enterprise), `gemini-3.8-flash-{low,medium,high}`, `claude-opus-5-5-*`, `claude-sonnet-5-5-*`. `gpt-oss-120b-medium` and Claude 4.6 are removed on 2026-11-02. Sub-agents take tiers rather than IDs: `inherit`, `flash_lite`, `flash`, `pro`.

## Which model for what

grey-matter's working defaults, until the model-tier spikes (tickets 167-172) replace them with measurements:

| Task class | Tier | Why |
|---|---|---|
| Orchestration, planning, hard diagnosis, architecture | Strongest default (Opus 5.5, `gpt-6.1-sol`/Astra, Kiro `auto`, Argon) | Judgement errors here cost the most |
| Implementation of a well-specified ticket | Keep the configured provider default; validate any cheaper profile with independent checks | The dated #167 trial below separates correct artifacts from unverified agent actions and harness failures; it does not justify changing defaults |
| Review and spec check | Keep the configured provider default, in a separate context | The #168 trial found defects but did not qualify a cheaper profile across all four strict-output cases |
| Read-only research and exploration fan-out | Fast tier | High volume, low risk; ticket 169 |
| Doc edits, triage, classification | Fast or mid tier | Ticket 170 |

Rules that hold now:
- **Escalation and destructive steps are never left to a cheap model alone.** In ticket 126 a Haiku worker tried to delete the README, and in ticket 128 one did.
- **Within one provider**, a cheaper model may be chosen per task class. Switching to another provider follows [provider switching](../provider-switching.md).

### Implementation evidence (2026-11-02)

The [implementation trial](../research/model-tier-implementation-20261102.md)
and its [independent audit](../research/model-tier-trial-20261103-audit.md)
cover one run per fixture/profile. Ambiguity probes were scored separately from
ordinary implementation tasks; these results do not establish general reliability.

| Provider | Verified observation | Recommendation for this task class |
|---|---|---|
| Anthropic | Haiku 5.5 and Opus 5.5 artifacts passed all implementation behavior checks. Native JSON omitted successful agent test transcripts; four cells contain test-permission denials and the other four lack positive execution proof. Independent controller tests passed separately. | Keep current defaults. Neither profile demonstrated the full agent workflow bar; cheaper list-cost estimates alone do not qualify a replacement. |
| Kiro | Both requested profiles passed ordinary implementation and held-out behavior checks. The cheap profile guessed a missing count style and violated clarification instructions; served identity and usage were absent. | Keep native default when ambiguity handling matters. This is a profile observation, not a recommendation about an unreported served model. |
| OpenAI | Four attempts failed because the controller used an incomplete executable installation; eight cells were unattempted. | Keep current defaults; no model-quality comparison is available from this batch. |
| Google | Ten attempts mixed correct artifacts with setup, tool-policy and sandbox test failures; two cells remained unattempted after a security hook stopped tools. | Keep current defaults; no fair tier recommendation. Further Agy execution remains on hold while the stop directive's scope is unresolved. |

Reported Claude costs are native list-price estimates, not billed amounts.
Missing identity, usage and cost remain unknown. No model or effort setting was
changed by this recommendation, and no missing cell was moved to another provider.

### Review evidence (2026-11-03)

The [review trial](../research/model-tier-review-20261103-results.md) and
[independent audit](../research/model-tier-review-20261103-audit.md) cover 23
attempts on four small fixtures. Fourteen responses met the frozen JSON format.
All 22 nonempty responses identified the planted defect with a changed-line
citation in secondary blind scoring, including responses that failed the format
bar. That scoring also found nine unsupported claims and five duplicate findings.
Finding a known defect in these small cases does not establish review reliability.

Keep current defaults for automated review. No cheaper profile completed all four
cases with valid required output. Claude's requested `haiku` alias served Sonnet
5.5 in this trial; Codex and Kiro did not report served model identities. Google
was held without a call. Native Claude list-price estimates cover planned cells,
but the earlier unintended preflight turn's unknown usage prevents verification
of the aggregate budget. Other missing cost and identity fields remain unknown.
Human review may use the extra prose as advisory input, with unsupported findings
checked independently; it does not satisfy the strict automation bar.

## Effort

| Provider | Levels | Per session | Per sub-agent | Persistent |
|---|---|---|---|---|
| Anthropic | `low`, `medium`, `high`, `xhigh`, `max`; unsupported levels round down. `ultracode` (`/effort ultracode`) needs workflows and `xhigh`. Prompt `ultrathink` raises one turn | `/effort`, `--effort`, `CLAUDE_CODE_EFFORT_LEVEL` (wins over everything) | Sub-agent frontmatter `effort:`, per-call `effort`; `CLAUDE_CODE_SUBAGENT_EFFORT` (in binary, undocumented) | `effortLevel` (no `max`), `modelSettings` |
| OpenAI | `low` ("Light"), `medium`, `high`, `xhigh`, `max`, `ultra` (ultra fans out to sub-agents) | `-c model_reasoning_effort=<lvl>`, `/model` | `[agents] default_subagent_reasoning_effort` | `model_reasoning_effort`, profiles (`-p`), `plan_mode_reasoning_effort` |
| Amazon / Kiro | `low` … `max`, offered per model | `/effort <lvl>`, `--effort` (not saved on V3), IDE Effort slider (local sessions only) | Kiro Crew `agents.*.worker_reasoning_effort`, `agent.role_efforts` | `chat.modelDefaults`; Kiro Crew `agent.reasoning_effort`. `chat.enableThinking` is a thinking *tool*, not a budget |
| Google | `low`, `medium`, `high` (docs); `--effort` also accepts `xhigh`, `max` (L, unverified effect); the model slug suffix is the level | `--effort`, `/effort`, `/model` | None found: sub-agents take a tier, not an effort | `model` in settings.json |

**Fast modes:**
- **Claude Code:** `/fast`, for Opus, up to 2.5x faster. On subscriptions it bills to usage credits, not the plan limits (D).
- **Codex:** `/fast` (`service_tier=priority`), 1.5x to 2x, with some models noted as "increased usage". The app also offers Ultrafast on Pro (L).
- **Kiro and agy:** none found.

## Usage

How much of the subscription is left. Run one of these before a long fan-out, and when a limit error appears.

| Provider | Limits (D) | Headless check | TUI | GUI |
|---|---|---|---|---|
| Anthropic | Pro/Max: a 5-hour session window plus a weekly limit, and a separate Fable weekly on Max; shared with claude.ai ([support 11145838](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)) | `-p --output-format stream-json` emits `rate_limit_event` with `rate_limit_info` {`status`, `resetsAt`, `rateLimitType` (`five_hour`, `seven_day`, `seven_day_opus`, …), `utilization`} (L: binary strings, not run). Statusline JSON `rate_limits.five_hour` / `seven_day` {`used_percentage`, `resets_at`} (D). Inside the desktop app, the session tool `get_usage` returned 5-hour 40%, weekly 67% (L) | `/usage` (`d`/`w` switch 24h and 7d), `/status` | Desktop usage ring by the model picker; VS Code Account & usage; claude.ai Settings > Usage |
| OpenAI | Local and cloud share a 5-hour allowance, plus weekly limits; "Pro plans currently have no five-hour limit" ([pricing](https://learn.chatgpt.com/docs/pricing)) | Newest rollout in `~/.codex/sessions/**/*.jsonl`: `token_count` events carry `rate_limits.primary` {`used_percent`, `window_minutes`, `resets_at`} and `plan_type` (L: 10080-minute weekly window, `pro`). `codex app-server` `account/rateLimits/read` (L: strings, not called). `exec --json` stdout carries tokens only (I) | `/status`, `/usage [daily\|weekly\|cumulative]`, status-line items `five-hour-limit` and `weekly-limit`, `/analytics` (with `analytics_plan_history`) | App Settings > Usage and the nav-rail arcs; chatgpt.com/codex/settings/usage |
| Amazon / Kiro | Monthly credits only, no weekly limit; reset at the start of the billing month, no rollover. Free 50, Pro 1,000, Pro+ 2,000, Pro Max 5,000, Power 10,000 ([pricing](https://kiro.dev/pricing/)) | `MSYS_NO_PATHCONV=1 kiro-cli chat --no-interactive --agent-engine v2 /usage`: plain text. On V3 `/usage` isn't a command and spends a turn, and Git Bash rewrites `/usage` into a path without that variable (L). Kiro Crew `GET /api/usage/kiro` → `billing` {`credits_used`, `credits_plan`, `percentage`, `resets`} (L: source). This account prints "Your plan is managed by admin", and the usage API returns 403 | `/usage`; per-turn and session credits (`chat.turnUsage.*`) | IDE profile > Manage Plan; Kiro Crew top-bar credits and the Overview Usage card |
| Google | Pro: 5-hour refresh up to a weekly limit; Ultra: highest 5-hour and weekly; others: weekly. No daily limit named ([plans](https://antigravity.google/docs/plans)) | `agy -p "/usage" --output-format json` (also `/quota`, `/credits`): documented to run without an agent turn or quota spend (L: changelog; not run). Likely fields `remaining_fraction`, `reset_time`, `quota_buckets` (I) | `/usage` (`/quota`) with reset times; `/credits`; the status line shows remaining quota | App Settings, per model |

**Gotchas:**
- From Git Bash, a slash command passed as an argument is rewritten into a Windows path (`/usage` → `C:/Program Files/Git/usage`) and reaches the model as a prompt. Set `MSYS_NO_PATHCONV=1`, or run from PowerShell.
- Plan names disagree across Anthropic tools on this machine: `get_usage` says "Pro", while `claude.exe auth status --json` says `subscriptionType: max`. Unresolved.

## Couldn't verify

- **Not run live, because each could start a session or spend quota:** Claude's `rate_limit_event`, Codex's `account/rateLimits/read`, agy's `/usage` JSON, and Kiro `/usage` over ACP.
- **Unclear defaults and keys:** Sonnet 5.5's default effort (Claude Code and the API disagree), and `CLAUDE_CODE_SUBAGENT_EFFORT`'s semantics.
- **Models offered to other accounts:** the Kiro and agy lineups beyond this account's plan gating.
