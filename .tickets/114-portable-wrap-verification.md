---
id: "114"
title: "Discover project verification gates and stop dependent mutations on failure"
status: open
blocked_by: []
validation_criteria:
  - "Behavioral scenarios verify the reported session failure and corrected outcome"
  - "Guidance has one maintained owner with scoped implementation and evidence limits"
  - "Applicable fixtures and repository consistency gate pass"
tags: ["stream:tooling"]
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
- [ ] Applicable behavioral fixtures and `node scripts/check-repo.mjs` pass.
