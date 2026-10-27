# Critic model pinning spike: results so far (2026-10-27, randomserver)

Spike from [proposal 14](../proposals/14-critic-model-spike.md), ticket 91. **Three of the four
harnesses are measured.** Claude Code was exercised through its in-session subagent tool, Kiro CLI and
opencode through their CLIs. Claude Code's own CLI (`claude -p`) and Codex could not start a model call
because their credentials on this machine are still expired, so those cells are blocked, not failed.
Raw outputs are in `.scratch/spike-critic-models/` (not committed). Prompts were one line, except the
single critic run (P7) per harness.

Hosts: Claude Code 2.1.252, Codex 0.147.0, Kiro CLI 2.16.0, opencode 1.18.21. opencode was run on
the owner's z.ai Coding Plan subscription (`zai-coding-plan/glm-5.3`) because its `opencode`
provider key is expired and the owner chose z.ai models there.

## Matrix

| Probe | Claude Code (in-session `Agent` tool) | Claude Code CLI | Codex | Kiro CLI | opencode (z.ai) |
| --- | --- | --- | --- | --- | --- |
| P1 pin and prove | **Pass.** `model: opus` gives `claude-opus-5-5` in the subagent transcript | Blocked | Blocked | Pin accepted, **model unverified** | **Pass.** `opencode export <session>` records provider, model and variant on every message |
| P2 effort | **Pass.** Transcript request shows `effort: medium` by default and `high` when set | Blocked | Blocked | Accepted, **unverified** | **Pass for the setting.** The variant (`minimal`, `high`) is recorded. Reasoning-token counts did not move in the expected direction on one sample (48 vs 31), so effect is unverified |
| P3 subagent pin | **Pass.** Explicit pin held under a Sonnet 5.5 parent; a spawn with no model ran on the parent's | Not run | Not run | **Fail.** `subagent` tool runs `kiro_default`, no model choice | **Pass.** Pinned subagent ran on `glm-5.3` under a `glm-5.3-flash` parent (all 12 messages, from the child session); an unpinned one inherited `glm-5.3-flash`. The pinned run then wandered through 26 read-only tool calls and hit the 150 s limit |
| P4 unavailable model | Not testable (tool takes aliases only) | Blocked | Partial (see 10) | **Pass.** Exit 1, names the model and lists the available ones | **Pass, opaque.** Exit 1 for `zai-coding-plan/glm-9` and for an unconfigured provider, with only "Unexpected server error" and a reference ID |
| P5 overrides | Not run | Not run | Not run | n/a | **Finding.** A `-m` flag beats the model pinned in an agent file (`--agent critic -m …-flash` ran on flash). The export shows what ran |
| P6 read-only | Not run | Not run | Not run | **Pass.** Write refused, no file | **Pass.** Agent with write, edit and bash disabled and edit denied refused; no file |
| P7 output contract | Not run | Not run | Not run | **Partial.** Parsed, but listed non-findings as rows | **Pass** with a stricter prompt: no placeholder rows, correct CLEAN, honest coverage line |

## What was found

1. **Claude Code in-session subagents meet the rule.** The model and effort a subagent ran on are
   recorded in its transcript file, and an explicit `model` and `effort` on the spawn are honoured.
   The spawn result returned to the parent does not include them, so "Reviewed on" must be filled
   from the transcript, not from the critic's words.
2. **Inheritance is real in both harnesses that were tested.** An unpinned Claude Code spawn ran on
   the parent's Sonnet 5.5, and an unpinned opencode subagent ran on the parent's `glm-5.3-flash`.
   This is the evidence for proposal 13's rule 1.
3. **A critic's self-report cannot be the model of record.** On Kiro a run pinned to Haiku 4.5 said
   "I'm Claude 3.5 Sonnet". The recorded model must come from the harness: the transcript (Claude
   Code) or the export (opencode). Kiro has no record to read.
4. **Kiro fails loudly and informatively on a missing model.** `--model claude-opus-5-5` exits 1 and
   lists what exists, which confirms Opus 5.5 is absent from Kiro 2.16.0 (its best Claude is
   `claude-opus-4.5`). opencode also fails loudly but gives no hint.
5. **Kiro subagents cannot take a model.** Kiro critics must run as top-level
   `kiro-cli chat --no-interactive --model <id>` calls, and their `Reviewed on` is "requested,
   unverified".
6. **A pinned flag outranks an agent file in opencode.** The same holds for the documented Claude Code
   order (per-invocation parameter first). A critic's agent file is a default, not a guarantee, so the
   recorded model is what matters.
7. **Critic runs need a turn or time limit.** The pinned opencode subagent, told to reply "OK",
   ran 26 read-only tool calls and never finished within 150 s. opencode has no `--max-turns`; use an
   outer `timeout`. Kiro and Claude Code runs finished in seconds.
8. **Prompt wording decides output discipline.** Kiro, asked for "findings", listed five non-findings
   as rows. opencode, told "write no rows when there are no problems", returned none. The critic
   prompt must say so.
9. **Credentials are a prerequisite.** On this host the Claude Code CLI reports `loggedIn: false`
   (this desktop session holds its own session; a nested `claude -p` cannot reuse it).
   `~/.claude/.credentials.json` last changed at 07:16 today and `~/.codex/auth.json` on 2026-10-21, so
   the owner's refresh did not reach this machine. Codex still prints "Logged in using ChatGPT" but its
   token refresh fails with "refresh token was already used", which suggests the stored token was
   rotated by a login elsewhere (not confirmed). The probe and `sync` should report "not
   authenticated" as a distinct result from "model missing".
10. **Codex does not reject an unknown model on the client.** Before failing on auth it logged
    "Model metadata for `gpt-6.1-sol` not found. Defaulting to fallback metadata; this can degrade
    performance and cause issues." and started the turn. Whether the server accepts `gpt-6.1-sol`
    from CLI 0.147.0 is unknown until Codex can authenticate.
11. **Kiro loads the user's global steering into a fresh session**, so a Kiro critic is not
    context-isolated. opencode and Claude Code subagents were not checked for this.

## Recipes

| Harness | Recipe | Where the model of record comes from |
| --- | --- | --- |
| Claude Code, in-session | `Agent` tool with `model: "opus"` and `effort: "high"` | Subagent transcript: `"model"` and `"effort"` fields |
| opencode | `opencode run --agent <critic> -m zai-coding-plan/glm-5.3 --variant high --format json "<prompt>"` under an outer `timeout`; a critic agent in `opencode.json` with write, edit and bash disabled and `permission.edit: deny` | `opencode export <sessionID>`: `providerID`, `modelID`, `variant` per message; subagent model in the `task` tool metadata |
| Kiro CLI | `kiro-cli chat --no-interactive --model <id from --list-models> --effort high --trust-tools=fs_read "<prompt>"`, top-level only | None; record "requested, unverified" |
| Claude Code CLI, Codex | Candidates in proposal 14, untested | Blocked on credentials |

opencode's ceiling on this machine is `zai-coding-plan/glm-5.3` (also `glm-5.3-flash` and
`glm-5.3-highspeed`), by the owner's choice of z.ai models. It is a below-ceiling harness for
proposal 13's Opus 5.5 and Sol 6.1 target, and its critic results carry that mark.

## To finish the spike

Re-authenticate on this machine (interactive steps I did not attempt): `claude auth login` and
`codex login`. Then run P1 to P7 for the Claude Code CLI and Codex, add P5 for them, and build
`scripts/probe-critic-model.mjs` and the corrected `harnesses.md` table from the complete matrix.
