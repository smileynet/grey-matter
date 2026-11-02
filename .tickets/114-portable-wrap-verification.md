---
id: "114"
title: "Discover project verification gates and stop dependent mutations on failure"
status: done
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

- [x] Scenarios cover an adopter with an aggregate and one with only documented individual commands; neither reports a missing gate as passed.
- [x] A failing check, timeout and missing executable prevent a downstream marker mutation; a passing check permits it with its result recorded.
- [x] Guidance distinguishes required gates from optional observations and reconciles conflicting wrap/sync wording without silently expanding authorization.
- [x] Applicable behavioral fixtures and `node scripts/gate.mjs pre-merge` pass.

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

## Delegated implementation 2026-11-02

Worker commit e2702a1 updated portable gate discovery, wrap/sync guidance and a real gate/caller marker fixture. Critic Spec/Standards review found no blocking issue. Worker gate tests passed 23/23, syntax fixtures 10/10 and docs consistency passed. After merge root pre-merge completed 4/4 commands: gate-runner 22.0 s, ticket-graph 0.4 s, syntax fixtures 0.3 s, guidance 1.1 s. Main pre-push completed 6/6 selected commands. The fixture covers an exit-code caller contract for failure, timeout, missing executable and pass; it does not prove an LLM obeys asynchronous scheduling instructions. That caller limitation is explicit in the guidance.

Delivery dashboard: [current status](../docs/status.html). The shared renderer is unchanged;
strict source/data checks and critic source review pass. Actual laptop/phone visual review
remains pending because browser policy blocked local-file access; human review was requested.
[Observation limits](../docs/agents/research/evidence/dashboard-ui-20261102.json) preserve that boundary.
Root owns merge, deployment and native ticket closure. Worker worktrees are recycled after
integration; local commit history and this evidence remain in Git. The current deployment
package is retained until the next deployment.

## Resolution (2026-11-02)

done: worker implemented real caller fixture and portable guidance, critic accepted, root merged/pushed/deployed. Ticket holds evidence and dashboard link. Recycled merged worker114 worktree10255081bytes; shared stream helpers retained until orchestration completes, deployment package until next deploy. Dashboard source checks pass; visual acceptance remains pending without policy workaround.

### Verification
1. ✓ Scenarios cover an adopter with an aggregate and one with only documented individual commands; neither reports a missing gate as passed. — "Guidance scenarios discover adopting AGENTS/documented aggregate or individual commands; missing required gates remain unresolved with owner. Existing phase semantics preserved. Critic Spec/Standards accepted."
2. ✓ A failing check, timeout and missing executable prevent a downstream marker mutation; a passing check permits it with its result recorded. — "Worker actual gate/caller fixture covers failure, timeout, missing executable and pass; failing cases don't write marker, pass records command/output. Direct gate tests23/23. This proves the exit-result caller contract, not LLM async compliance."
3. ✓ Guidance distinguishes required gates from optional observations and reconciles conflicting wrap/sync wording without silently expanding authorization. — "Wrap/sync now wait for completed required results before dependent mutation, distinguish optional findings, and allow independent work within authorization; no universal checker added."
4. ✓ Applicable behavioral fixtures and `node scripts/gate.mjs pre-merge` pass. — "Root merged and premerge4/4 passed including gate-runner22.0s; prepush6/6 and canonical deployment50skills passed. Worker missing-yaml snapshot infra issue not counted as product failure or green evidence."
