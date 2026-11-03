# Rerunning the model-tier spikes (tickets 168-171)

The spike harnesses were removed from `scripts/` by ticket 209. Their findings stay in the
research docs below; the code, fixtures and tests live on at the pinned commit
[`e35d8a8`](https://github.com/smileynet/grey-matter/tree/e35d8a8cd117eec6bb0519c2fb8ba9f28a192b0f/scripts).
Rerun only to reproduce or extend a result, never as part of a normal gate.

| Ticket | Question | Findings | Protocol |
|---|---|---|---|
| 168 | Cheap vs default models as reviewers | [model-tier-review-20261102](model-tier-review-20261102.md) | same doc |
| 169 | Fast models for read-only research | [model-tier-research-20261102](model-tier-research-20261102.md) | [audit](model-tier-research-20261103-audit.md) |
| 170 | Fast models for doc edits, triage, changelog | [model-task-tiers-20261103](model-task-tiers-20261103.md) | [protocol](model-task-tiers-protocol-20261103.md) |
| 171 | Effort levels, one model per provider | [model-effort-t171-protocol](model-effort-t171-protocol.md) | same doc |

## 1. Check out the harness

```
git worktree add --detach ../gm-spikes e35d8a8cd117eec6bb0519c2fb8ba9f28a192b0f
cd ../gm-spikes
npm ci --ignore-scripts
```

Remove it afterwards with `git worktree remove ../gm-spikes`.

## 2. Host

The harnesses were built and measured on **Windows only**. They pin executable paths and
hashes at import time, and refuse to run when a path, hash or version differs:

| CLI | Pinned path | Version |
|---|---|---|
| Claude Code | `%USERPROFILE%\.local\bin\claude.exe` | 2.1.316 |
| Codex | `D:\tools\bun-install\global\node_modules\@openai\codex-win32-x64\vendor\x86_64-pc-windows-msvc\bin\codex.exe` (plus `codex-code-mode-host.exe`) | 0.166.0 |
| kiro-cli | `%LOCALAPPDATA%\Kiro-Cli\kiro-cli.exe` | 2.37.1 |

Agy/Google cells are blocked by design in all four spikes. To run with other CLI versions or on
another OS, edit the launcher table and its hash literals in the harness first, and record that
the result is not comparable to the original.

## 3. Prove the harness before any model call

Each harness has offline tests that use fake processes:

```
node --test scripts/spike-model-tier-review-t168.test.mjs
node --test scripts/spike-model-tier-research-t169.test.mjs
node --test scripts/spike-model-task-tier-t170.test.mjs
node --test scripts/spike-model-effort-t171.test.mjs scripts/bind-reviewer-evidence-t171.test.mjs
```

## 4. Plan, authorize, execute

Every harness prints a dry-run plan by default and makes no provider call. Execution needs a
parent-written authorization file bound to the plan's hashes, as each protocol describes.

| Ticket | Dry run | Execute |
|---|---|---|
| 168 | `node scripts/spike-model-tier-review-t168.mjs --provider claude\|codex\|kiro --fixture f1..f4 --tier cheap\|default --cell-id R01` | add `--execute --authorization PATH [--evidence-dir PATH]` |
| 169 | `node scripts/spike-model-tier-research-t169.mjs --provider ... --task callers\|module-summary\|cited-answer --tier cheap\|default --cell ID` | add `--execute --authorization PATH` |
| 170 | `node scripts/spike-model-task-tier-t170.mjs --provider ... --fixture ... --tier ... --cell-id ID` | add `--execute --authorization PATH --plan PATH` |
| 171 | plan is prepared per the protocol | `node scripts/spike-model-effort-t171.mjs --execute --plan PATH --authorization PATH --cell ID` |

## 5. Grade

- 169: `node scripts/grade-model-tier-research-t169.mjs candidate TASK RESPONSE.txt BLIND_ID CANDIDATE.json`,
  then a bound manual review finalizes it.
- 170: blind review envelopes are validated by `scripts/t170-review-envelope.mjs`.
- 171: `node scripts/bind-reviewer-evidence-t171.mjs PACKET_ID REVIEW_BODY DISPATCH_TRACE COMPLETION_TRACE OUTPUT ATTEMPT`.

Raw provider output can contain sensitive model content. Keep it in `.scratch/` under the
ticket, and promote only the summarized findings, as the original runs did.
