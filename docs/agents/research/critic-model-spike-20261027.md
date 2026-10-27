# Critic model pinning spike: results (2026-10-27, randomserver)

Spike from [proposal 14](../proposals/14-critic-model-spike.md), ticket 91. All four harnesses are
measured. Raw outputs are in `.scratch/spike-critic-models/` (not committed). Prompts were one line,
except one critic run (P7) per harness. Claude Code's in-session subagent tool was tested first on
2.1.252 while the CLI was logged out; after the owner re-authenticated, the CLI was tested on 2.1.311.

Hosts: Claude Code 2.1.311 (CLI) and 2.1.252 (in-session run), Codex 0.164.0 (0.147.0 earlier),
Kiro CLI 2.16.0, opencode 1.18.21. opencode ran on the owner's z.ai Coding Plan subscription
(`zai-coding-plan/glm-5.3`) because its `opencode` provider key is expired and the owner chose z.ai
models there. Codex's catalog on 0.164.0 now lists `gpt-6.1-sol`; on 0.147.0 it did not.

## Matrix

| Probe | Claude Code CLI | Claude Code (in-session) | Codex | Kiro CLI | opencode (z.ai) |
| --- | --- | --- | --- | --- | --- |
| P1 pin and prove | **Pass.** `--model opus` gives `claude-opus-5-5` in `modelUsage` | **Pass.** `model: opus` gives `claude-opus-5-5` in the subagent transcript | **Pass.** `-m gpt-6.1-sol` gives `turn_context.model` = `gpt-6.1-sol` in the rollout (not written with `--ephemeral`) | Pin accepted, **model unverified**; no record | **Pass.** `opencode export` records provider, model, variant |
| P2 effort | **Pass.** `thinking_tokens` 0 at low, 10 at high on one prompt | **Pass.** Transcript shows `effort` `medium` by default, `high` when set | **Pass for the setting.** Rollout records `effort`; reasoning tokens 8 vs 9 (no real difference on a trivial prompt) | Unverified; `--effort` accepted, no record | **Pass for the setting.** Variant recorded; token counts did not separate |
| P3 subagent pin | **Pass.** `--agents` pinned Opus ran under a Haiku parent (`modelUsage` lists both); unpinned used Haiku only | **Pass** (Sonnet 5.5 parent) | **Pass.** Agent file pinned `gpt-6.1-sol` ran under a `gpt-6-luna` parent; unpinned inherited `gpt-6-luna` at `low` | **Fail.** `subagent` runs `kiro_default`; no model choice | **Pass.** Pinned `glm-5.3` under a `glm-5.3-flash` parent; unpinned inherited flash |
| P4 missing model | **Pass.** Exit 1, names the model | Not testable | **Pass.** Exit 1, `model_not_found`, names the model | **Pass.** Exit 1, lists the available models | **Pass, opaque.** Exit 1, "Unexpected server error" |
| P5 overrides | **Finding.** `CLAUDE_CODE_SUBAGENT_MODEL=haiku` lost to a pinned agent; with `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` the pinned Opus critic ran on Haiku | n/a | **Pass.** A pinned agent file beat `[agents] default_subagent_model`; the default applied to an unpinned agent (`gpt-6.1-terra`) | n/a | **Finding.** A `-m` flag outranks the model in an agent file |
| P6 read-only | **Pass.** `--tools Read,Grep,Glob` refused a write, no file | Not run | **Inconclusive.** Refused, but `-s read-only` cannot run any shell here (bubblewrap error), so a read-only critic cannot read files | **Pass.** Write refused (non-interactive), no file | **Pass.** Agent with write, edit, bash off refused, no file |
| P7 output contract | **Pass.** `--json-schema` returned conforming structure with real findings | Not run | **Pass** with the entry in the prompt and `--output-schema`. With file access it failed honestly (sandbox), but returned verdict `REWRITE NEEDED` | **Partial.** Parsed, but listed non-findings as rows | **Pass** with a stricter prompt |

## What was found

1. **The pin works and can be proven in every harness except Kiro.** The record is the transcript
   (Claude Code in-session), `modelUsage` (Claude Code CLI), the rollout `turn_context` (Codex) and
   `opencode export`. Kiro keeps nothing, so its result is "requested, unverified".
2. **Inheritance is real everywhere it was tested.** An unpinned subagent ran on its parent's model in
   Claude Code, Codex (model and effort) and opencode. The pinned spawn held in all three. This is
   the evidence for proposal 13's rule 1.
3. **A critic's self-report cannot be the model of record.** A Kiro run pinned to Haiku 4.5 said it was
   Claude 3.5 Sonnet, and Codex's critic reported itself as "GPT-6".
4. **An override can silently defeat a pin.** On Claude Code 2.1.311,
   `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` made a pinned Opus critic run on Haiku while the call still
   succeeded; only `modelUsage` showed it. Without FORCE the pin beat the environment variable, as
   the documentation says. In Codex the pinned agent file beat the `[agents]` default. In opencode a
   `-m` flag beat the agent file. The recorded model is the only reliable check, which the probe reads.
5. **Missing models fail loudly in all four**, with varying help: Kiro lists what exists, Claude Code
   and Codex name the model, opencode says only "Unexpected server error".
6. **Kiro subagents cannot take a model.** Kiro critics run as top-level
   `kiro-cli chat --no-interactive --model <id>` calls. Its best Claude is `claude-opus-4.5`, so it
   runs below ceiling.
7. **Codex's sandbox is unusable for file reads on this host.** `-s read-only` runs commands in
   bubblewrap, which fails here ("loopback: Failed RTM_NEWADDR: Operation not permitted", the
   unprivileged-namespace restriction). A critic that needs a file cannot read it, and the earlier
   write refusal may have been this failure, not the policy. Give a Codex critic its input in the
   prompt. A critic that cannot review should not return a rewrite verdict; this one did, with
   `findings: []`.
8. **Critics need a time limit.** A pinned opencode subagent told to reply "OK" made 26 read-only
   tool calls and ran past 150 s. Wrap every critic call in `timeout`.
9. **Prompt wording decides output discipline.** Kiro, asked for findings, listed five non-findings
   as rows; opencode, told "write no rows when there are no problems", returned none. Structured
   output flags (`--json-schema`, `--output-schema`) removed the problem.
10. **Spawn Codex critics with `fork_turns: "none"`.** An unpinned spawn that forked the whole
    conversation carried the parent's history; a fresh critic should not. Kiro also loads the user's
    global steering into a fresh session, so it is not context-isolated.
11. **The stronger models found a real defect the weaker ones missed.** All four critics reviewed the
    same worked-example entry. Opus 5.5 (MINOR ISSUES) and Sol 6.1 (MINOR ISSUES) both flagged the
    headline as overclaiming for a mocked feature; Opus also found that the ask gave no price. Kiro on
    Opus 4.5 and opencode on GLM 5.3 returned CLEAN. One sample, but it points the way proposal 13's
    best-model rule expects. The worked example was fixed.
12. **Credentials are a prerequisite.** Before the owner re-authenticated here, the Claude Code CLI was
    logged out, Codex's refresh token was spent and opencode's own provider key was expired; each
    showed as an authentication failure, not a model problem. The probe reports
    `not-authenticated` apart from a missing model.

## Recipes

See [harnesses](../harnesses.md#critic-model) for the maintained table. The probe is
`node scripts/probe-critic-model.mjs` (one tiny call plus one rejected-model call per harness;
exit 0 only when every harness is at ceiling and verified). Run on randomserver it reported:

| Harness | Result |
| --- | --- |
| claude | ok: `claude-opus-5-5`, at ceiling, refuses a missing model |
| codex | ok: `gpt-6.1-sol` at `high`, at ceiling, refuses a missing model |
| opencode | ok: `zai-coding-plan/glm-5.3` at `high`, refuses a missing model |
| kiro | unverified: requested `claude-opus-4.5`, below ceiling (Opus 5.5 missing), refuses a missing model |
