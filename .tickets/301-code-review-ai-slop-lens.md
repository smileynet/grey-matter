---
id: "301"
title: "Explore an AI-slop and erosion review lens for code-review"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "Overlap checked against rubric-app.md, data-modeling/review-lens.md, Spec, and #221/#222, with evidence recorded."
  - "Three historical consequential diffs replayed with and without the curated AI-slop lens; unique confirmed findings, false-positive rate, and cost compared."
  - "If adopted: lens carries positive/negative indicators and firing gates without crying wolf; skill-syntax and doc-links gates pass."
  - "Resolution records adopt/adapt/reject and why."
tags: ["type:research", "stream:skills-review", "triage:ready-for-agent"]
---
## Finding

`skills/engineering/code-review/references/rubric-app.md` covers 13 Fowler OO smells and `data-modeling/references/review-lens.md` covers type representations, but neither systematically names LLM-specific erosion patterns (silent fallbacks, silent truncation, error-message destruction, lenient parsing, validation theater, inline flag state machines, lonely interfaces / single-entry registries, narration comments).

Prior art: `SprocketLab/slop-code-bench` (`configs/rubrics/llm_judge.jsonl`, commit `de70a479acce7b565d2d0c772f48d7c881c15510`, MIT — prior art, not authority) pairs 45 verbosity/erosion items with explicit `positive_indicators` and `negative_indicators`.

Candidate change: add a curated AI-slop and erosion lens for `code-review` carrying `positive_indicators`/`negative_indicators` and `review-lens.md`-style firing gates, keeping Standards and Spec axes separate.

## Approach: explore and test, don't adopt

This is a **hypothesis from prior art**, not a decided change. Before editing any skill:

1. **Check current behaviour.** Check overlap with `rubric-app.md`, `data-modeling/references/review-lens.md`, `Spec`, `#221`, and `#222`. Record whether the gap is real, partial, or already covered.
2. **Test it before changing it.** Replay 3 real historical consequential diffs from a real repo (e.g. `tagalog-helper`) with baseline `code-review` vs. baseline + curated AI-slop lens. Tally unique confirmed findings, false positives, and token/time cost.
3. **Decide.** Adopt only if the lens surfaces >=2 unique confirmed findings at <=20% false-positive rate; adapt to prune noisy criteria, or reject with evidence.

## Acceptance criteria

- [ ] Overlap checked against `rubric-app.md`, `data-modeling/review-lens.md`, `Spec`, and `#221`/`#222`, with evidence recorded.
- [ ] Three historical consequential diffs replayed with and without the curated AI-slop lens; unique confirmed findings, false-positive rate, and cost compared.
- [ ] If adopted: lens carries positive/negative indicators and firing gates without crying wolf; skill-syntax and doc-links gates pass.
- [ ] Resolution records adopt/adapt/reject and why.

Related: #221, #222.
