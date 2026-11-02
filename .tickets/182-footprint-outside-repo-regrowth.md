---
id: "182"
title: "Detect footprint growth outside repository scratch"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Synthetic agent-home and runner-temp fixtures are reported as separate read-only families with active-state protections and explicit partial coverage."
  - "Paired snapshot fixtures flag regrowth only when prior cleanup is recorded; ordinary growth is distinguished from regrowth."
  - "Summary fixtures report free-space change and elapsed-time rate from valid same-volume samples; absent or invalid history is explicitly unavailable."
  - "A disposable checkout fixture proves tracked LFS payloads are not materialized or copied by the documented test-checkout pattern."
tags: ["stream:tooling"]
---

# Detect footprint growth outside repository scratch

## What to build

Extend the read-only footprint inspector so agents can see disk-growing families outside
repository scratch, recognize recreation after cleanup, and see a free-space trend when
the host supplies history. Preserve active work and report missing probes as partial
coverage. Add regression coverage for the existing no-LFS-materialization guidance.

## Intent source and context

Sam requested review and integration of preserved commits `bad784d7` and `d5e02bb9`
on 2026-11-01, with unfinished requirements captured separately without reopening #110.
The commits have identical proposal/ticket changes. Their historical measurements and
current disposition are in [proposal 16's recovered addendum](../docs/agents/proposals/16-agent-footprint-guardrails.md#recovered-addendum-2026-10-31-whole-drive-deep-dive).

Read first:

- `skills/meta/repository-artifact-hygiene/scripts/inspect-footprint.mjs`: `inspect`
  discovers repo families and accepts explicit `--path` roots; `--recheck` currently
  detects citation changes only. `summary` reports current free space without its rate of change.
- `scripts/inspect-footprint.test.mjs`: synthetic families and supplied open-file sets.
- `skills/meta/repository-artifact-hygiene/SKILL.md`: existing skip-smudge rule and
  24-hour quiet floor for agent state; ownership remains required for cleanup.
- `skills/meta/orient/SKILL.md`: consumes the inspector summary.
- `docs/agents/research/footprint-commands-by-os-20261031.md`: existing LFS observations.

Keep configured agent-state and runner-temp roots bounded and report child families
separately; do not treat an entire home directory as disposable. Explicit `--path`
support already exists, so reuse it where appropriate. A quiet directory alone does
not establish ownership or permission to delete it.

For regrowth, accept a prior inspection plus an explicit cleanup record; a larger
second sample alone is ordinary growth. For trends, consume host-supplied timestamped
free-byte samples identified by filesystem/volume. Validate identity, increasing
timestamps and numeric ranges; distinguish unavailable history from zero growth.
Document the input contract, including an explicit freshness limit, alongside fixture
examples. Do not install a scheduler.

## Acceptance criteria

- [ ] Synthetic agent-home and runner-temp roots yield separate families, preserve active-state protections, and report unavailable roots/probes as partial coverage.
- [ ] Paired snapshots with a cleanup record flag recreated/regrown families; the same size increase without cleanup is reported as ordinary growth.
- [ ] Valid same-volume samples produce free-byte change and elapsed-time rate in the summary; absent, malformed, stale or mismatched samples explicitly make the trend unavailable.
- [ ] A disposable checkout regression fixture proves the documented pattern leaves tracked LFS payloads unmaterialized and avoids copying the payload; it uses a small local fixture and no network download.

## Out of scope

Reopening or changing #110; changing host watch schedules or alert thresholds; deleting
agent state, simulator data, worktrees or caches; rerunning a whole-drive inventory.
Host watch values in the recovered addendum are historical suggestions, not a new
grey-matter daemon. Existing platform follow-ups #131–133 and #175 retain their scope.
