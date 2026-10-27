# Proposal 14: a spike to verify critic model selection through each harness's CLI

**Status:** proposed 2026-10-27. **Scope:** a read-only probe, run once as a spike and then kept as
a check in `sync`. **Feeds:** the harness table in [proposal 13](./13-dashboard-critics.md#critic-model),
whose ceiling models are Claude Opus 5.5 and GPT-6.1 Sol. Evidence base:
[critic-model-selection](../research/critic-model-selection-20261027.md).

## Why a spike

Proposal 13 says: pin the model and effort explicitly on every critic spawn, and record what ran.
That rests on documentation. Documentation and behaviour have already diverged on this machine:

- Codex 0.147.0's model catalog has `gpt-5.6-sol` and no `gpt-6.1-sol`. Does `codex exec -m gpt-6.1-sol`
  work anyway, fail loudly, or run something else?
- Kiro CLI 2.16.0 lists Claude Opus 4.5 as its strongest Claude. The docs say an unavailable pinned
  model fails the first prompt, but not what the CLI does with `--model claude-opus-5-5`.
- Claude Code documents a precedence order and two environment overrides, and says an
  organisation allowlist can substitute a model. A critic that believes it ran on Opus 5.5 while
  it ran on something else gives false assurance.
- opencode lists the ceiling models only under its own `opencode/` provider, not under `anthropic/`
  or `openai/`, so the ID in the docs would not resolve here.

A critic's value is that it is the strongest reviewer available. If the pin can silently fail,
the rule is unenforceable. The spike answers one question per harness: **can a non-interactive CLI
invocation pin the critic's model and effort, prove which model ran, hold the pin through a subagent
spawn, fail loudly when the model is missing, and stay read-only?**

## Probes (run for every harness)

Each probe uses a one-line prompt unless noted, so the cost stays small. Evidence comes from
machine-readable output or the harness's own session record, never from the model describing itself,
which can be wrong. A self-report is recorded only as a cross-check.

| # | Probe | Pass means |
| --- | --- | --- |
| P1 | **Pin and prove.** Run the ceiling model non-interactively and read the model from structured output or the session log. | The record names the requested model, and the exit code is 0. |
| P2 | **Effort.** Run the same prompt at the lowest and highest effort. | The effort setting appears in the record, or reasoning-token usage differs in the expected direction. Otherwise "unverified". |
| P3 | **Subagent pin.** Start a parent on a deliberately weaker model, have it spawn a critic with an explicit model, then once without. | The explicit spawn runs on the pinned model; the spawn without one inherits the parent's weaker model. The second result is the evidence for rule 1 in proposal 13. |
| P4 | **Unavailable or blocked.** Request a model that does not exist on this machine (the next-generation ID, and each harness's missing ceiling model if any). | One of: a clear error and non-zero exit (good), a logged substitution (acceptable if recorded), or a silent substitution (fail). |
| P5 | **Overrides.** Set each documented override and see whether the pin still wins: `CLAUDE_CODE_SUBAGENT_MODEL`, `CLAUDE_CODE_EFFORT_LEVEL`, Codex `[agents] default_subagent_model`, opencode agent-file model. | The pin wins where the docs say it does, and the override is visible in the record where it does not. |
| P6 | **Read-only critic.** Ask the pinned critic to create a file in the repo, with the read-only flags for that harness. | The write is refused and `git status` is unchanged. |
| P7 | **Output contract.** On the worked example's weather entry, ask for the copy-critic findings in the proposal's format with a `Reviewed on:` line. | The output parses; the stated model matches P1's evidence; where a schema flag exists it is honoured. |

## The invocations to try

These are starting points drawn from each CLI's `--help` on this machine, not verified recipes.
Finding the working recipe is part of the spike.

| Harness | Pin and structured output | Read-only | Fresh context |
| --- | --- | --- | --- |
| Claude Code 2.1.252 | `claude -p --model opus --effort high --output-format json` (look for `modelUsage` and the init event's model); `--json-schema` for P7 | `--permission-mode plan`, `--tools Read,Grep,Glob` | `--no-session-persistence` |
| Codex 0.147.0 | `codex exec -m gpt-6.1-sol -c model_reasoning_effort=high --json` (look at the turn context in the session record) | `-s read-only` | `--ephemeral`; `--output-schema` for P7 |
| Kiro CLI 2.16.0 | `kiro-cli chat --no-interactive --model <id> --effort high` (find the model in the session store or `--list-sessions`) | `--trust-tools=fs_read` | a new session |
| opencode 1.18.21 | `opencode run -m opencode/claude-opus-5-5 --variant high --format json` (model is in the JSON events) | an agent file that denies edits | a new session |

Ceiling models to test: Claude Opus 5.5 (`opus`) in Claude Code, `opencode/claude-opus-5-5` in
opencode and the best available in Kiro; GPT-6.1 Sol (`gpt-6.1-sol`) in Codex and
`opencode/gpt-6.1-sol` in opencode.

## Method and safety

- **Isolation.** Run from a throwaway working directory under `.scratch/spike-critic-models/`. No
  harness configuration, agent file or `config.toml` is edited in place. For P3 and P5, copy a
  harness's config into a temporary home (`CODEX_HOME`, `XDG_CONFIG_HOME`), keep the copied
  credentials mode 0600, and delete the copy afterwards. Credentials are never printed or logged.
- **Cost bound.** About 30 invocations, nearly all one-line prompts, plus one real critic run per
  harness for P7. Only subscription-covered models are used. Fable and Astra are not exercised
  unless the owner asks, because they can bill usage credits.
- **Evidence.** Raw outputs go to `.scratch/spike-critic-models/<harness>/` (not committed). The
  committed result is a matrix with the exact command, version, date and the line of evidence for
  each cell, in [the research folder](../research/).
- **Time box.** One session, about 30 minutes per harness. If P1 cannot be proven for a harness
  after that, the harness is recorded as "model unverifiable" rather than dropped, and its critic
  results carry that caveat.

## What comes out

1. **A results matrix**: harness by probe, each cell pass, fail or unverified with its evidence.
2. **One working spawn recipe per harness**: the exact flags or agent-file keys for model, effort,
   read-only and structured output, ready to paste into the critic dispatch.
3. **A corrected harness table** for `harnesses.md` (proposal 13 rollout step 6): ceilings, fallbacks,
   known substitutions, and the minimum CLI versions (for example, the Codex version that has
   `gpt-6.1-sol`).
4. **`scripts/probe-critic-model.mjs`**: the passing probes (P1, P2 where measurable, P4, P6) as a
   read-only check. It follows the pattern of `probe-agent-shell.mjs`, and `sync` runs it per
   machine so a CLI upgrade that changes behaviour, or a catalog that loses the ceiling, is caught.
5. **Follow-up tickets** for each failure: upgrade Codex, wait for Opus 5.5 in Kiro, or demote a
   harness to "below ceiling, recorded".

## Decisions the spike makes possible

| Result | Consequence |
| --- | --- |
| A harness pins and proves the model (P1, P3, P4 pass) | Its critics run there at the ceiling, with the recipe from the spike. |
| It pins but cannot prove the model | Allowed, with `Reviewed on` marked unverified. |
| It substitutes silently (P4 fail) | The critic must not run there unless the substitution can be detected from the record; otherwise another harness reviews. |
| P3 shows subagents inherit despite an explicit spawn model | Critics run as top-level sessions (a separate CLI call), not as in-harness subagents, on that harness. |

## Out of scope

Comparing models for review quality (that is the seeded-defect test in proposal 13), changing any
user configuration, and testing Fable 5.1 or Astra.
