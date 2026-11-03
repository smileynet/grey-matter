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

- **Runner choice for tickets 167-172 (ticket 174).** Use the focused Node runner in <code>scripts/spike-model-eval.mjs</code> for the existing fixtures on this Windows host. The four-case recipe runs T1 and T3 with Claude Code and Codex CLI, gives each adapter/job its own fixture and evidence directory, and independently grades native tests and task behavior. The trial report has the exact supported commands, adapter executable paths, receipt fields, results and failure classifications: [evaluation runner trial](eval-runner-trial-20261102.md). This is a bounded local-host decision: consider Harbor if later tasks need container isolation, remote environments or a maintained benchmark suite. The tested local Harbor setup could not reach Docker or Podman and stopped before Harbor ran; no claim is made about its packaged installation or remote modes.
- **Cost accounting:** keep native usage as the source: Claude reports list-price estimates, not billing; Codex's captured JSONL reports token counts but no actual model ID or dollar amount. Do not fill those gaps with estimates.

### Runnable selected path (2026-11-02)

Use Node 22+ and the checked-in T1/T3 manifests under
<code>scripts/fixtures/model-eval/</code>. Both pin seed Git tree object ID
`c474646ea61e037fcdbc1be3d2dc6c0833f5e260` (SHA-1). The reviewed hardened
grader was reviewed at SHA-256 `92588b2ef6356eeb56b75ddc77f87fd3b73b6b9624d7eb9c38134f561960adea`.
The current runner also pins the fixture dashboard before checking the full tree,
so later template maintenance cannot silently alter a comparison. Other seed
drift still blocks execution. See the [seed repair](eval-seed-drift-20261102.md)
for current source identity and the setup-only regression; historical native
execution provenance is unchanged.
From the repository root, use a fresh directory for every fixture/adapter pair:

~~~~powershell
$run = Join-Path $env:TEMP ('gm-eval-' + [guid]::NewGuid().ToString('N'))
$claudeExe = (Get-Command claude).Source
$codexExe = 'D:\tools\bun-install\global\node_modules\@openai\codex-win32-x64\vendor\x86_64-pc-windows-msvc\bin\codex.exe'
foreach ($fixture in @('t1', 't3')) {
  node scripts/spike-model-eval.mjs --adapter claude --fixture $fixture --model sonnet --effort low --claude-exe $claudeExe --work-dir (Join-Path $run "claude-$fixture-work") --evidence-dir (Join-Path $run "claude-$fixture-evidence")
  node scripts/spike-model-eval.mjs --adapter codex --fixture $fixture --model gpt-6.1-sol --effort low --codex-exe $codexExe --work-dir (Join-Path $run "codex-$fixture-work") --evidence-dir (Join-Path $run "codex-$fixture-evidence")
}
~~~~

The executable paths are host-specific; discover and verify installed binaries
before reuse. <code>result.json</code> schema version 1 records runner commit/hash,
fixture seed, adapter version and argv, requested and observed model separately,
native duration/exit/usage/cost, raw output hashes and independent grading.
Unknown usage or identity stays null. A pass requires a completed native turn,
passing nonzero test counts, independent expected behavior and export checks,
only allowed paths changed relative to the frozen seed, and unchanged HEAD.
Staged, unstaged, ignored untracked and committed changes are checked.

The oracle is omitted from task inputs, but no OS isolation prevents host file
access: these demonstrations are non-adversarial. Native execution evidence
predates the hardened grader; four retained runs passed offline regrading under
the hardened source. The report separates those provenance records. This recipe
is a foundation for #167–172; review/research/effort tasks need their own frozen
fixtures, rubrics and any additional adapter support before model comparisons.
Kiro ACP remains untested by this runner.

## Couldn't verify

- inspect_ai and promptfoo features, from READMEs only.
- Whether harbor's generic ACP agent can drive `kiro-cli acp` or Kiro Crew.
- tokenmeter's cost model and its Windows log paths.
