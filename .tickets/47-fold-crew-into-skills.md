---
id: "47"
title: "Fold crew-research nuggets into domain-modeling, research, prototype, implement-spec"
status: done
blocked_by: []
validation_criteria:
  - "Each of the 4 target skills carries its nugget from proposal 04 (one line or a references/ file)"
  - "check-repo.mjs green"
tags: ["type:enhancement", "stream:migration"]
---

# Fold crew-research nuggets into domain-modeling, research, prototype, implement-spec

## What to build

Nuggets from crew-research skills fold into four grey-matter skills (exact text in
[../docs/agents/research/crew-research-relevancy/](../docs/agents/research/crew-research-relevancy/) a/d files):

- **domain-modeling § ADRs** (from adr-authoring): one ADR per independently reversible decision.
- **research** (from study-reference): a `.references/<name>` clone is the primary source. Read it
  local-first, cite file paths, weight findings toward the non-obvious, and frame guidance
  candidates as prior art.
- **prototype** (from multi-agent-validation): when asking a vision judge, state the intended
  stylization; trust its symptom report over its root-cause guess.
- **implement-spec** (from subagent-reliability): pass large inputs to workers via files. Before
  re-dispatching a stalled or empty worker, inspect its on-disk effects. Report failed or partial
  workers explicitly.

Context: [proposal 04](../docs/agents/proposals/04-crew-research-migration.md).

## Acceptance criteria

- [x] domain-modeling, research, prototype, and implement-spec each carry their nugget.
- [x] No skill body grows beyond its depth bar (detail goes to `references/`).
- [x] `node scripts/check-repo.mjs` green.

## Resolution (2026-10-22)

done: study-reference, multi-agent-validation, subagent-reliability, adr-authoring nuggets folded

### Verification
1. ✓ Each of the 4 target skills carries its nugget from proposal 04 (one line or a references/ file) — "research, prototype, implement-spec, domain-modeling each carry their nugget (1-3 lines in place, no body growth)"
2. ✓ check-repo.mjs green — "node scripts/check-repo.mjs all invariants pass"
