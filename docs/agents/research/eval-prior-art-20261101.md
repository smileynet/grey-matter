# Evaluation prior art for the model and harness spikes

**Question:** what can open-source model and coding-agent evaluation projects teach the model-tier, effort, fast-mode and harness spikes (tickets 154-162, 167-173)?

**Status:** prior art, not authority. Each technique is a candidate for grey-matter to adopt or reject. A survey subagent read the READMEs; this session then verified repository metadata with `gh repo view` and spot-checked the cloned code. A claim not checked against code is marked **(README)**.

**Gathered:** 2026-11-01. Clones are in `.references/` (see its [README](../../../.references/README.md)).

## The repos

Ranked by how directly they serve the spikes. Stars and last push are from `gh repo view` on 2026-11-01.

| Repo | Stars | Last push | License | Clone | Why it matters here |
|---|---|---|---|---|---|
| [harbor-framework/harbor](https://github.com/harbor-framework/harbor) (Terminal-Bench 2 harness) | 6.7k | 2026-11-01 | Apache-2.0 | `.references/harbor`, 144 MB | One runner drives many coding-agent CLIs over the same tasks. Adapters in `src/harbor/agents/installed/` include `claude_code.py`, `codex.py`, `gemini_cli.py`, `antigravity_cli.py`, `opencode.py`, `aider.py`, `mini_swe_agent.py`, and a generic `acp.py` that launches any local ACP command (verified). There's no Kiro adapter; `kiro-cli acp` through the generic ACP agent is untried (I) |
| [harbor-framework/harbor-cookbook](https://github.com/harbor-framework/harbor-cookbook) | 260 | 2026-10-31 | Apache-2.0 | `.references/harbor-cookbook` | Worked task layouts (`recipes/`: multi-step, multi-reward, multi-container, MCP tools, computer use on Ubuntu and Windows). The template for our fixtures |
| [meridianlabs-ai/inspect_swe](https://github.com/meridianlabs-ai/inspect_swe) | 41 | 2026-10-30 | MIT | `.references/inspect_swe` | Claude Code, Codex CLI, Gemini CLI, Antigravity, OpenCode, Kimi Code and mini-swe-agent wrapped as Inspect agents (verified: `src/inspect_swe/_*`), with an `acp/` layer. Head-to-head comparison inside Inspect's sandboxes. Few stars but very current |
| [review-bench/ReviewBench](https://github.com/review-bench/ReviewBench) | 88 | 2026-11-01 | MIT | `.references/reviewbench` | Code-review evaluation: a corpus of PRs, `golden/` findings, and an LLM judge that matches each candidate finding to a golden one, then classifies the unmatched ones (verified: `docs/JUDGING.md`). Has a `docs/HARBOR.md` integration |
| [SWE-agent/mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent) | 9.0k | 2026-10-26 | MIT | `.references/mini-swe-agent` | A bash-only minimal agent: the control condition that shows how much a harness adds over the bare model |
| [Dubibubii/tokenmeter](https://github.com/Dubibubii/tokenmeter) | 12 | 2026-08-04 | MIT | `.references/tokenmeter` | Reads the session logs Claude Code and Codex already write, giving tokens in and out, cache split, active time, API-equivalent cost and tool calls per "lane", with no wrapper or proxy (verified: README). Very few stars, so treat it as an idea, not a dependency |
| [Aider-AI/aider](https://github.com/Aider-AI/aider) `benchmark/` | 49.9k | 2026-05-22 | Apache-2.0 | `.references/aider`, sparse `benchmark/` only | Polyglot Exercism tasks with tests. Reports pass rate on the first and second try (the second sees the test output), seconds per case and total cost. `rungrid.py` sweeps a model × setting grid (verified: files present). Last pushed 5 months ago |

Read online rather than cloned, because they're large or less direct:
- [UKGovernmentBEIS/inspect_ai](https://github.com/UKGovernmentBEIS/inspect_ai) (3.1k stars, 482 MB): epochs and reducers for repeated runs, model-graded scorers, sandboxed tasks, transcript viewer (README).
- [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo) (26.7k stars): a declarative test matrix with rubric grading, and providers for the Claude Agent SDK, Codex SDK and OpenCode (README).
- [SWE-bench/SWE-bench](https://github.com/SWE-bench/SWE-bench) (6.1k stars): hidden FAIL_TO_PASS and PASS_TO_PASS tests.
- [microsoft/SWE-bench-Live](https://github.com/microsoft/SWE-bench-Live): fresh monthly tasks against contamination.
- [evalplus/evalplus](https://github.com/evalplus/evalplus): extra hidden tests that catch code passing for the wrong reason (last push 2025-10).

Dropped as stale, archived or off-topic: METR's task-standard and vivaria (archived; METR moved to Inspect), openai/simple-evals (deprecated), anthropics/evals (behavioural datasets, 2024), lm-evaluation-harness (model-only, not agentic).

## Techniques, by spike

- **167, implementation workers**
  - Shape each fixture as instruction + hidden tests + an oracle solution (harbor). Running the oracle first proves the fixture can be solved.
  - Split the hidden tests into "must now pass" and "must still pass" (SWE-bench).
  - Report pass rate on the first try and on a second try that sees the test output (Aider).
  - For the "passes for the wrong reason" trap, keep extra tests the worker never sees (EvalPlus).
- **168, reviewers**
  - Keep golden findings per planted defect, and match each reviewer finding to one with a judge (ReviewBench).
  - Report recall and precision, and count false positives, so a noisy reviewer doesn't score as thorough.
  - Use a judge from a different tier than the reviewer under test.
- **169, research and exploration**
  - Score answers against a held-out answer key for recall (callers found), and check citations with a closed-QA judge (autoevals, README).
  - Keep the key out of the agent's context, as harbor keeps `tests/` hidden.
- **170, docs and triage**
  - Run a fixtures × tiers matrix with exact-match checks on triage labels and a rubric judge on prose (promptfoo, README).
  - Grade blind, with model labels hidden from the grader (tokenmeter).
- **171, effort sweep**
  - Treat each effort level as a lane and hold everything else fixed (tokenmeter).
  - Run several repeats per cell before calling a knee in the curve (Inspect epochs, README).
  - Drive the grid with a runner like Aider's `rungrid.py`.
- **172, fast mode**
  - Read time, tokens and cost from the harness's own session logs, with no proxy (tokenmeter). Fast-mode credits still need the provider's usage check ([models and usage](../harness-surfaces/models-and-usage.md#usage)).
  - Report seconds per case and cost next to pass rate (Aider).
- **154-162, 173, harness comparisons**
  - Run one task set through each harness adapter (harbor, inspect_swe).
  - Use mini-swe-agent as the bash-only control.
  - Keep full trajectories for later analysis.
- **All spikes**
  - Write fixtures after the models' training cutoff, or keep them private, to avoid contamination (SWE-bench-Live, LiveCodeBench).
  - Never put an answer key in a worker's context.
  - Never move work between providers to finish a run ([provider switching](../provider-switching.md)).

## What grey-matter should decide

- **Adopt a runner, or write a small one.** harbor already drives most of our harnesses and is current and well-starred, but it is Docker-centred and has no Kiro adapter. A thin runner of our own over the existing spike fixture keeps Windows-native runs simple. A one-day trial of harbor with two adapters (Claude Code, Codex) would settle this before tickets 167-172 start.
- **Cost accounting:** read the harnesses' own logs (the tokenmeter approach), plus each provider's usage check, rather than wrapping the CLIs.

## Couldn't verify

- inspect_ai and promptfoo features, from READMEs only.
- Whether harbor's generic ACP agent can drive `kiro-cli acp` or Kiro Crew.
- tokenmeter's cost model and its Windows log paths.
