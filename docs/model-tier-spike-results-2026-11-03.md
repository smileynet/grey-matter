# Fast text-task model results

Date: 2026-11-03

## What we found

No lower-cost profile passed all three test tasks, so this spike does not support
switching away from current defaults for documentation rewrites, ticket triage,
or changelog classification.

| Requested profile | Passed tasks | Tasks that passed |
|---|---:|---|
| Claude Haiku 5.5 | 1/3 | Documentation rewrite |
| Claude default | 1/3 | Documentation rewrite |
| Codex GPT-6 Luna | 2/3 | Documentation rewrite, ticket triage |
| Codex default | 1/3 | Documentation rewrite |
| Kiro Qwen3 Coder Next | 1/3 | Documentation rewrite |
| Kiro default | 1/3 | Documentation rewrite |

Changelog classification failed in all six profiles. Only Codex GPT-6 Luna passed
the triage task. The results come from one synthetic example per task and
profile; they do not establish repeatability or prove that defaults pass
reliably.

The Claude calls reported lower cost for Haiku than for the default, but Haiku
passed only one task. Codex and Kiro did not report served model identity, and
their cost was not reported. That leaves their profile comparison incomplete.

The six Google/Agy cells were held and not run. They are not counted as failures.

See the [full research results and evidence limits](agents/research/model-task-tiers-20261103.md)
for task timings, native usage, the grading bar, provenance limits, and the
per-cell evidence record.
