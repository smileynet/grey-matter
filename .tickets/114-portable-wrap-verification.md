---
id: "114"
title: "Discover project verification gates and stop dependent mutations on failure"
status: in_progress
blocked_by: []
validation_criteria:
  - "Scenarios cover an adopter with an aggregate and one with only documented individual commands; neither reports a missing gate as passed."
  - "A failing check, timeout and missing executable prevent a downstream marker mutation; a passing check permits it with its result recorded."
  - "Guidance distinguishes required gates from optional observations and reconciles conflicting wrap/sync wording without silently expanding authorization."
  - "Applicable behavioral fixtures and `node scripts/gate.mjs pre-merge` pass."
tags: ["stream:test-verification"]
priority: medium
---

# Discover project verification gates and stop dependent mutations on failure


## Intent

Sam requested shared follow-ups on October 31 after the Philippines Trip wrap. The wrap skill assumed `scripts/check-repo.mjs`, which that project does not have. Separately, a whitespace check exited 2 but the agent scheduled a local commit before reading the result; the defect was corrected before push.

## What to build

Update `skills/meta/wrap-session/SKILL.md` and the owning implementation/verification reference to discover the adopting project's documented checks and supported tool surface. Retain grey-matter's own aggregate as this repository's command; do not impose its Node layout on every adopter. A missing required check is an explicit unresolved gate with ownership, never a synthetic pass or a reason to create a placeholder checker.

Make verification-dependent commit/deploy/publish stages fail closed on nonzero exit, timeout, missing executable or incomplete result. Read the completed result before scheduling a dependent mutation; unrelated read-only investigation may continue. Use an existing runner where available; choose any new reusable enforcement seam deliberately rather than building a universal deployment framework. Bash flags alone do not guard asynchronous tool orchestration. Document the caller's exit-code/structured-result contract rather than prescribing Bash semantics for Python/Node tools.

Inspect current `sync`, hook and verification guidance for overlap and contradictions. The local script-authoring skill is outside this pack; preserve one owner for reusable guidance instead of making that personal skill a dependency. Related tickets 98/106/119 own evidence identity and test cadence. Source project #88 owns its actual change-scoped runner.

## Acceptance criteria

- [ ] Scenarios cover an adopter with an aggregate and one with only documented individual commands; neither reports a missing gate as passed.
- [ ] A failing check, timeout and missing executable prevent a downstream marker mutation; a passing check permits it with its result recorded.
- [ ] Guidance distinguishes required gates from optional observations and reconciles conflicting wrap/sync wording without silently expanding authorization.
- [ ] Applicable behavioral fixtures and `node scripts/gate.mjs pre-merge` pass.

## Update 2026-11-01

`wrap-session` step 5 now names `node scripts/gate.mjs pre-merge` instead of `check-repo.mjs`,
but that is still grey-matter's own command. Per [local gates](../docs/agents/local-gates.md), a
project names its `check` command (speed phase) or its `gate.mjs` stages (stability) in its
`AGENTS.md`; the portable wrap should run whichever that file names.

## Workstream reconciliation 2026-11-02

Scope: `stream:test-verification`; execution order and completion requirements are in the
[workstream plan](../docs/plan.md#test-optimization-and-verification).

Next: exercise aggregate-only and individual-command adopters, plus failed/timeout/missing-tool
results preventing a downstream marker. Current wrap-session and sync still name this repository's
gate; #119 supplies environment/cadence choices but does not complete portable command discovery or
fail-stop orchestration.

Status remains open. This reconciliation adds no implementation or fresh host-validation claim;
verify the ticket's premises against current source and run its acceptance checks when picked up.
