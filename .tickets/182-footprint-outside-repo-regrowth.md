---
id: "182"
title: "Detect footprint growth outside repository scratch"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - "Synthetic agent-home and runner-temp fixtures are reported as separate read-only families with active-state protections and explicit partial coverage."
  - "Paired snapshot fixtures flag regrowth only when prior cleanup is recorded; ordinary growth is distinguished from regrowth."
  - "Summary fixtures report free-space change and elapsed-time rate from valid same-volume samples; absent or invalid history is explicitly unavailable."
  - "A disposable checkout fixture proves tracked LFS payloads are not materialized or copied by the documented test-checkout pattern."
tags: ["stream:test-verification"]
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
  discovers repo families and accepts explicit `--path` roots. #184 now binds `--recheck`
  to versioned preservation snapshots as well as citations; reuse that boundary rather
  than restoring its older citation-only behavior. `summary` still lacks a space trend.
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

- [x] Synthetic agent-home and runner-temp roots yield separate families, preserve active-state protections, and report unavailable roots/probes as partial coverage.
- [x] Paired snapshots with a cleanup record flag recreated/regrown families; the same size increase without cleanup is reported as ordinary growth.
- [x] Valid same-volume samples produce free-byte change and elapsed-time rate in the summary; absent, malformed, stale or mismatched samples explicitly make the trend unavailable.
- [x] A disposable checkout regression fixture proves the documented pattern leaves tracked LFS payloads unmaterialized and avoids copying the payload; it uses a small local fixture and no network download.

## Out of scope

Reopening or changing #110; changing host watch schedules or alert thresholds; deleting
agent state, simulator data, worktrees or caches; rerunning a whole-drive inventory.
Host watch values in the recovered addendum are historical suggestions, not a new
grey-matter daemon. Existing platform follow-ups #131–133 and #175 retain their scope.

## Execution pickup 2026-11-02

The user asked this session to proceed after #184. This related verification follow-up is
now in stream:test-verification. Existing dependencies and acceptance scope are unchanged.
Only explicit bounded external roots and synthetic fixtures are authorized; no live agent-home
inventory, watch schedule, cleanup or deferred OneDrive/Mac probe is part of this work.
Worker implementation and independent critic review precede root integration and closure.

## Implementation and review 2026-11-02

The final worker source is `910597f3c681d25054294f257281910fe529d380`, independently
accepted by the critic for Spec and Standards. The inspector remains read-only and
requires explicit bounded external roots; no home discovery, scheduler or cleanup was
added. Child discovery and traversal are bounded, partial logical and observed allocated
lower bounds remain distinct, and unknown ownership or preservation state cannot grant
cleanup authority. Regrowth requires a valid whole-family cleanup attestation matching
the prior inventory and ordered observations. Space history requires a fresh same-volume
identity and a uniquely limiting measured filesystem.

Windows focused inspector fixtures passed 23 tests with two WSL-only skips and zero
failures. Its real local 4 KiB LFS control verifies both ordinary materialization and
explicit skip-smudge behavior without downloading payloads. Worker syntax fixtures
passed 10/10; node syntax and diff checks passed. Root's private combined pre-merge
selected syntax, agent guidance and artifact-hygiene checks: 3/3 passed (0.3, 1.1 and
22.6 seconds). These counts are not native WSL or Mac evidence.

Native attempts preserved two source/test issues rather than weakening assertions:
canonical uppercase Volume GUID output initially failed to round-trip through the parser;
the parser now accepts case consistently. A subsequent equal-minimum fixture sampled free
space before writing files and correctly observed a different real minimum. A narrow
existing-style filesystem-stat dependency seam now fixes that test's input and explicitly
asserts the tie before checking ambiguity. CLI defaults remain unchanged. The first native
attempt also had a missing interop PATH; the second attempt's outer exit was not retained.
The promoted native report records these limits and the final run separately.

Root owns publication, deployment and closure. Bounded worker/source and numbered native
logs are retained through the remaining platform audit; the tracked retention inventory
names their owner, purpose and end condition. OneDrive and Mac testing remain deferred at
the user's request. No user data or pre-existing simulator state was changed.

Root integrated and pushed the final worker at merge `654ebab`. Native attempt 004 on
unchanged clean `910597f` ran `node --test scripts/inspect-footprint.test.mjs` through
the existing owned WSL distro with the explicit interop PATH: 24 pass, zero fail, one
Git LFS skip in 84.379 seconds, direct exit 0. Both WSL-specific tests and free-space
history ran successfully; native LFS remains unverified. The full command, source
before/after state, earlier failures and environment limits are in the
[native evidence report](../docs/agents/research/evidence/footprint-growth-native-182-20261102.json).
The push hook passed six selected checks. `node scripts/deploy.mjs check` and
`node scripts/deploy.mjs` passed, deploying 50 skills. No global rules changed.
The owned distro and other distros are stopped; default and sparse settings are unchanged.

## Resolution (2026-11-02)

done: bounded explicit external footprint families, evidence-qualified regrowth, same-volume space trends and tiny local LFS checkout regression shipped. Independently reviewed; Windows and native WSL evidence qualified, merged, pushed and deployed. OneDrive and Mac work remain deferred.

### Verification
1. ✓ Synthetic agent-home and runner-temp fixtures are reported as separate read-only families with active-state protections and explicit partial coverage. — "Final worker 910597f and critic acceptance cover explicit bounded agent-state/runner-temp roots, individual child families, streaming 256-child and 10000-entry bounds, partial coverage, symlink/overlap gaps, active-state and preservation protections. Windows inspector 23 pass/2 WSL-only skips; final native WSL 24 pass/1 git-lfs skip, exit0. Root pre-merge selected checks passed 3/3. No live agent-home inventory or deletion performed."
2. ✓ Paired snapshot fixtures flag regrowth only when prior cleanup is recorded; ordinary growth is distinguished from regrowth. — "Paired snapshot controls require a valid completed whole-family cleanup record tied to prior inventory, stable scope and ordered timestamps before reporting regrowth. Without that record growth stays ordinary; malformed, incomplete or mismatched evidence is rejected. Critic accepted positive and negative controls."
3. ✓ Summary fixtures report free-space change and elapsed-time rate from valid same-volume samples; absent or invalid history is explicitly unavailable. — "Versioned same-volume UTC samples produce timed free-byte change only with fresh ordered safe values and a uniquely identified limiting volume. Stale, malformed, missing, mixed or ambiguous histories remain unavailable. Native WSL GUID canonical roundtrip and deterministic equal-minimum ambiguity controls passed; earlier parser assertion and free-space fixture race are preserved in the native evidence report."
4. ✓ A disposable checkout fixture proves tracked LFS payloads are not materialized or copied by the documented test-checkout pattern. — "Windows real git-lfs control uses a 4KiB local payload: ordinary checkout materializes it while explicit GIT_LFS_SKIP_SMUDGE=1 checkout retains pointer bytes and leaves shared-store bytes unchanged. No remote download or large payload. Native LFS control skipped because git-lfs is unavailable; it is not counted as a native pass. Source pushed, canonical deployment passed; native report records earlier failed/infra attempts and final exact source."
