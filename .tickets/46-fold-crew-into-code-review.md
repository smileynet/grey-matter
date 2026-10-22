---
id: "46"
title: "Fold crew-research review nuggets into code-review (findings-as-hypotheses, closed-ticket AC, cross-family leg, invalid-state smell)"
status: done
blocked_by: []
validation_criteria:
  - "code-review files findings as unconfirmed hypotheses with reproduce-first AC"
  - "Spec axis checks closed tickets' AC; optional cross-family reference and Representable Invalid State smell added"
  - "check-repo.mjs green"
tags: ["type:enhancement", "stream:migration"]
---

# Fold crew-research review nuggets into code-review (findings-as-hypotheses, closed-ticket AC, cross-family leg, invalid-state smell)

## What to build

Four crew-research skills fold into `engineering/code-review` (verdicts + exact nugget text in
[../docs/agents/research/crew-research-relevancy/a-review-eval.md](../docs/agents/research/crew-research-relevancy/a-review-eval.md) and [../docs/agents/research/crew-research-relevancy/d-partials-guardrails.md](../docs/agents/research/crew-research-relevancy/d-partials-guardrails.md)):

- **review-new-work → step 5 (ticket filing):** findings are reviewer hypotheses. Each filed ticket's
  AC starts with "reproduce and mark each finding confirmed / rejected / obsolete (with evidence)
  before changing code". When the diff closes tickets, the Spec axis checks their AC were met.
- **dispatch-review → a `references/` file:** optional cross-family second opinion (`codex exec`,
  `claude -p --output-format json`). Validate a reviewer by its output content, never its exit code.
  A reviewer that timed out, came back empty, or hit quota is a coverage gap, never "clean".
- **data-modeling → `references/rubric-app.md`:** a "Representable Invalid State" smell, plus the
  exhaustiveness gotchas (`_ =>`, `assertNever`, Go `nil`).

Context: [proposal 04](../docs/agents/proposals/04-crew-research-migration.md).

## Acceptance criteria

- [x] Step 5 files findings as unconfirmed hypotheses with reproduce-first AC.
- [x] Spec axis checks closed tickets' acceptance criteria.
- [x] Cross-family reference file and Representable Invalid State smell added.
- [x] `node scripts/check-repo.mjs` green.

## Resolution (2026-10-22)

done: crew-research review-new-work, dispatch-review, data-modeling nuggets folded into code-review

### Verification
1. ✓ code-review files findings as unconfirmed hypotheses with reproduce-first AC — "step 5: first AC of every filed finding is reproduce + confirmed/rejected/obsolete"
2. ✓ Spec axis checks closed tickets' AC; optional cross-family reference and Representable Invalid State smell added — "Spec brief (d) checks closed tickets' AC; references/cross-family.md added; rubric-app gains Representable Invalid State"
3. ✓ check-repo.mjs green — "node scripts/check-repo.mjs: all 7 invariants pass"
