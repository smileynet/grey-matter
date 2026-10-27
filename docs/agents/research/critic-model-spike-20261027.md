# Critic model pinning spike: first results (2026-10-27, randomserver)

Spike from [proposal 14](../proposals/14-critic-model-spike.md), ticket 91. **Partial:** Kiro CLI and
Claude Code (through its in-session subagent tool) were exercised. Claude Code's own CLI, Codex and
opencode could not start a model call because their stored credentials are expired, so their cells
are blocked, not failed. Raw outputs are in `.scratch/spike-critic-models/` (not committed). Prompts
were one line, except the single critic run in P7.

Hosts: Claude Code 2.1.252, Codex 0.147.0, Kiro CLI 2.16.0, opencode 1.18.21.

## Matrix

| Probe | Claude Code (in-session `Agent` tool) | Claude Code CLI (`claude -p`) | Codex | Kiro CLI | opencode |
| --- | --- | --- | --- | --- | --- |
| P1 pin and prove | **Pass.** `model: opus` gave `claude-opus-5-5` in the subagent transcript's `model` field | Blocked: logged out | Blocked: auth (see below) | **Pin accepted, model unverified.** No structured record found | Blocked: provider key expired |
| P2 effort | **Pass.** Transcript request shows `effort: medium` by default for Opus and `high` when set | Blocked | Blocked | **Unverified.** `--effort low` accepted, no record | Blocked |
| P3 subagent pin | **Pass.** Explicit `opus` held under a Sonnet 5.5 parent. A spawn with no model ran on `claude-sonnet-5-5`, the parent's | Not run | Not run | **Fail.** The `subagent` tool spawns `kiro_default`; no way to choose its model | Not run |
| P4 unavailable model | Not testable: the tool only accepts aliases | Not run | Partial: see below | **Pass.** Exit 1, "Model 'x' does not exist", lists the available models | Blocked |
| P5 overrides | Not run | Not run | Not run | Not applicable (no documented override) | Not run |
| P6 read-only | Not run | Not run | Not run | **Pass.** Write refused ("no user to approve"), file not created | Not run |
| P7 output contract | Not run | Not run | Not run | **Partial.** Parsed, but see below | Not run |

## What was found

1. **Claude Code's in-session subagents meet the rule.** The model and effort a subagent ran on are
   recorded in its transcript file, and an explicit `model` and `effort` on the spawn are honoured.
   The spawn result returned to the parent does not include the model, so a "Reviewed on" line must
   be filled from the transcript (or the parent's own record of what it requested), not from the
   critic's words.
2. **Inheritance is real.** A spawn with no model ran on the parent's model, Sonnet 5.5. This is the
   evidence for proposal 13's rule 1: a critic spawned without a pin reviews on whatever the parent
   happens to be.
3. **A critic's self-report cannot be the model of record.** On Kiro the run pinned to Haiku 4.5
   answered "I'm Claude 3.5 Sonnet". The critic's `Reviewed on:` line echoed the requested model and
   proves nothing. The recorded model must come from the harness.
4. **Kiro fails loudly on a missing model, which is good.** `--model claude-opus-5-5` exits 1 and
   prints the available list, which confirms Opus 5.5 is absent from Kiro 2.16.0 and gives the
   probe a clean "ceiling missing" signal. Kiro's best Claude today is `claude-opus-4.5`.
5. **Kiro subagents cannot take a model.** Critics on Kiro must run as top-level CLI sessions
   (a separate `kiro-cli chat --no-interactive --model <id>` call), per the decision table in
   proposal 14. Kiro produced no machine-readable record of the model it ran, so its `Reviewed on`
   is "requested model, unverified".
6. **Read-only holds on Kiro in non-interactive mode.** Even with `fs_write` untrusted, the harness
   rejected the write because nobody can approve it. The critic prompt still should not rely on that.
7. **Kiro loads global steering into a fresh session.** The scratch run mentioned "the steering"
   even from an empty directory, so a Kiro critic is not context-isolated from the user's global
   rules. That may be wanted (the critic should know the standing rules) but it is not "fresh".
8. **Kiro's format discipline was weak.** Asked for findings only, it listed all five reviewed
   fields as finding rows with "—" placeholders and then returned CLEAN. A parser must treat
   placeholder rows as non-findings, or the prompt must say "no findings, no rows".
9. **Credentials are a prerequisite, and three CLIs lack them here:**
   - Claude Code CLI: `claude auth status` reports `loggedIn: false`. This desktop session works
     because it holds its own session; a nested `claude -p` cannot reuse it.
   - Codex: "Your access token could not be refreshed because your refresh token was already used.
     Please log out and sign in again."
   - opencode: the `opencode` provider returned 401, "This API key has expired".
   The probe and `sync` must report "not authenticated" as a distinct result from "model missing".
10. **Codex does not reject an unknown model on the client.** Before failing on auth it logged
    "Model metadata for `gpt-6.1-sol` not found. Defaulting to fallback metadata; this can degrade
    performance and cause issues." and went on to start the turn. Whether the server accepts
    `gpt-6.1-sol` from CLI 0.147.0 is not yet known.

## Recipes so far

| Harness | Recipe | Evidence of the model |
| --- | --- | --- |
| Claude Code, in-session | `Agent` tool with `model: "opus"` and `effort: "high"` | The subagent transcript: `"model":"claude-opus-5-5"`, `"effort":"high"` |
| Kiro CLI | `kiro-cli chat --no-interactive --model <id from --list-models> --effort high --trust-tools=fs_read "<prompt>"`, run as a top-level call | None found; record "requested, unverified" |
| Claude Code CLI, Codex, opencode | Candidates in proposal 14, untested | Blocked on credentials |

## To finish the spike

The owner re-authenticates the three CLIs (an interactive step I did not attempt): `claude auth login`,
`codex login`, and a new key for opencode's `opencode` provider (or auth another provider). Then
rerun P1 to P7 for those harnesses, add P5, and build `scripts/probe-critic-model.mjs` and the
corrected `harnesses.md` table from the full matrix.
