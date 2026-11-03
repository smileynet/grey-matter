# Ticket 174: model evaluation runner trial

**Decision.** Use the focused Node runner in this repository for the next model and effort comparisons on this Windows host. It completed the same two clean fixtures through native Claude Code and Codex CLI, ran independent grading, and retained each harness's observable usage data. Harbor remains a viable candidate for controlled Linux/container or remote-environment runs; this trial does not establish that Harbor is unsuitable in general.

**Scope.** Ticket 174 compares Harbor with the thin existing-fixture approach and should leave a runnable recipe for tickets 167–172. The recipe covers implementation tasks T1 and T3, not a broad benchmark or ACP evaluation. T2 asks for clarification and was excluded from ordinary pass/fail grading. No Kiro adapter or ACP support is claimed.

## What was run

The fixture generator is <code>scripts/spike-orchestrate-fixture.mjs</code>. Independently generated T1 and T3 inputs produced identical clean seed Git tree object ID <code>c474646ea61e037fcdbc1be3d2dc6c0833f5e260</code> (40-character SHA-1 Git object ID, not SHA-256). Each adapter/job receives its own fresh root. The task prompt contains the task but not the expected outputs or grader oracle, and the runner does not copy the oracle into the fixture. However, the harness processes are not isolated from the parent repository by an OS boundary; their own permissions/sandbox determine whether they could inspect it. Treat these as non-adversarial task runs. The runner verifies the unchanged seed, scopes changed paths, runs <code>npm.cmd test</code> from the task root, and applies an independent task behavior check. Result receipts are JSON and include adapter, fixture, seed object ID, runner source commit and SHA-256, requested/observed model where available, JSON argv, native exit/status, native usage/cost fields, independent test command and counts, grader outcome, changed paths, duration, and raw output paths.

The selected recipe, run with Node 22+ from the repository root. Set <code>$codexExe</code> to the absolute path of the same-version packaged Codex executable (including its sibling code-mode host). Every job needs a new work directory and evidence directory outside the repository:

~~~~powershell
$run = Join-Path $env:TEMP ('gm-eval-' + [guid]::NewGuid().ToString('N'))
$claudeExe = (Get-Command claude).Source
$codexExe = 'D:\tools\bun-install\global\node_modules\@openai\codex-win32-x64\vendor\x86_64-pc-windows-msvc\bin\codex.exe'
node scripts/spike-model-eval.mjs --adapter claude --fixture t1 --model sonnet --claude-exe $claudeExe --work-dir (Join-Path $run 'claude-t1-work') --evidence-dir (Join-Path $run 'claude-t1-evidence')
node scripts/spike-model-eval.mjs --adapter claude --fixture t3 --model sonnet --claude-exe $claudeExe --work-dir (Join-Path $run 'claude-t3-work') --evidence-dir (Join-Path $run 'claude-t3-evidence')
node scripts/spike-model-eval.mjs --adapter codex --fixture t1 --model gpt-6.1-sol --codex-exe $codexExe --work-dir (Join-Path $run 'codex-t1-work') --evidence-dir (Join-Path $run 'codex-t1-evidence')
node scripts/spike-model-eval.mjs --adapter codex --fixture t3 --model gpt-6.1-sol --codex-exe $codexExe --work-dir (Join-Path $run 'codex-t3-work') --evidence-dir (Join-Path $run 'codex-t3-evidence')
~~~~

Each command creates a distinct fixture root and evidence directory. The runner writes <code>result.json</code> plus native stdout/stderr into the evidence directory. The runner uses exact argv arrays; on Windows it invokes <code>npm.cmd</code> with shell handling for that executable, avoiding PowerShell or cmd.exe command-string quoting of model prompts. It captures native test exit and parsed pass/fail counts separately from the grader result. Nonzero CLI exit, timeout, malformed native output, failed agent turn, missing tests/counts, test assertion failure, grader failure, and out-of-scope changes are distinct unsuccessful classifications. A native CLI exit of zero alone does not count as a successful evaluation.

## Observed results

Direct clean-root runs establish native behavior; final wrapper runs separately establish that the selected runner launches and grades correctly.

| Fixture/adapter | Native and independent grading | Usage and cost |
|---|---|---|
| T1 / Claude Code 2.1.316 | Both test assertions passed (2/2); independent behavior check passed | Observed model <code>claude-sonnet-5-5</code>; native CLI list-cost estimate USD 0.1046697; not a billed amount |
| T3 / Claude Code 2.1.316 | Test passed (1/1); independent behavior check passed | Observed model <code>claude-sonnet-5-5</code>; native CLI list-cost estimate USD 0.1005851; not a billed amount |
| T1 / Codex CLI 0.166.0 | Native <code>npm.cmd test</code> passed (3/3); independent host test and behavior check passed | Requested <code>gpt-6.1-sol</code>, low effort; JSONL reports 88,368 input tokens (69,376 cached), 607 output tokens; actual model ID and dollar cost were not reported |
| T3 / Codex CLI 0.166.0 | Native <code>npm.cmd test</code> passed (1/1); independent host test and behavior check passed | Requested <code>gpt-6.1-sol</code>, low effort; JSONL reports 89,191 input tokens (70,912 cached), 577 output tokens; actual model ID and dollar cost were not reported |

The final selected-runner proof includes Claude T3 (two tests passed, native list-cost estimate USD 0.0962241), Codex T1 (three tests passed, 67,248 input tokens, 57,472 cached, 528 output; dollar cost/model ID unknown), and Claude T1 (two tests passed, native list-cost estimate USD 0.0950106). All final wrapper receipts were produced by the runner with a fresh work root per adapter/job. Claude session persistence was disabled for these final runs; Codex was invoked ephemerally. These are low-sample task demonstrations, not comparative model-quality estimates.

Claude's CLI reported USD 0.5938129 in aggregate list-cost estimates across six calls, including two initial controller-launch failures. This is the displayed list-price estimate, not billing. Codex exposes token counts in the captured JSONL but no price or verified actual model identity; leave both unknown rather than estimating from a possibly incorrect model identity.

## Harbor comparison and limits

The reference clone was pinned at Harbor commit <code>f6cf2e2e86a102a9d2980ce8888f4bda251aa998</code> (version 0.25.0). Its README says, “This will launch the benchmark locally using Docker.” The CLI environment implementation defaults to Docker and includes Podman and remote environment types. README: [Harbor at pinned revision](https://github.com/harbor-framework/harbor/tree/f6cf2e2e86a102a9d2980ce8888f4bda251aa998); inspected files: [README](https://github.com/harbor-framework/harbor/blob/f6cf2e2e86a102a9d2980ce8888f4bda251aa998/README.md), [pyproject.toml](https://github.com/harbor-framework/harbor/blob/f6cf2e2e86a102a9d2980ce8888f4bda251aa998/pyproject.toml), [jobs.py](https://github.com/harbor-framework/harbor/blob/f6cf2e2e86a102a9d2980ce8888f4bda251aa998/src/harbor/cli/jobs.py).

Observed local blockers:

- Docker CLI 29.3.1 had no reachable daemon: <code>failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine; check if the path is correct and if the daemon is running: open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.</code>
- Podman was installed, but its machine was stopped and its API refused the connection at <code>127.0.0.1:54641</code>. No VM/container was started.
- Harbor requires Python >=3.12 and its project metadata requires uv >=0.13.5. System uv was 0.11.21. A ticket-local uv 0.13.7 avoided global changes, but <code>uv run</code> resolved Harbor's development dependency group and began large downloads (including a 108.5 MiB torch wheel). After the ticket-local cache reached 883,638,935 bytes, setup was interrupted before the Harbor CLI ran. This checkout/dev dependency attempt is not evidence of the footprint of the documented packaged installation.
- Harbor also documents remote environments, but none was configured or tried. That mode could avoid the local daemon prerequisite and remains an open option.

Thus the recommendation is based on a runnable focused recipe versus a failed local setup on this host, not on a feature-by-feature benchmark of Harbor. The thin runner is deliberately small and suitable for the immediate existing fixtures; Harbor offers broader task/environment support if later work needs container isolation, remote execution, or a large maintained benchmark suite.

## Attempts excluded from comparison

- The first Codex T1 reused a Claude-mutated fixture root; it is contaminated and not a valid comparison.
- A fresh Codex T1 produced correct implementation output but the agent's child shell could not find <code>mise.exe</code>. The independent host test passed; the corrected clean run added the process Node directory to PATH and passed native tests. This was a runner environment issue, not a model result.
- The first CLI attempt combined <code>--approve-for-me</code> with <code>--sandbox workspace-write</code>; the CLI rejected the incompatible flags before making a model call.
- Two early runner launch attempts exposed Windows cmd quoting errors. They are retained as controller failures, not agent/fixture failures. The final argv-based launcher was exercised end-to-end.

Raw outputs, wrapper receipts, excluded attempts, setup failure manifest and hashes are indexed in [the evidence receipt](evidence/eval-runner-trial-20261102.json). Large private session logs were hashed without reading their content and are not promoted. No prompt/private reasoning is included in the report. Raw evidence is retained through independent critic review.
