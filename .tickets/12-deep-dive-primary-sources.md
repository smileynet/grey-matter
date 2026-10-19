---
id: "12"
title: "Deep-dive original cited sources (Ousterhout, Tornhill, Feathers, etc.) to sharpen lenses and references"
status: backlog
blocked_by: []
priority: low
validation_criteria:
  - "A reference doc per major cited source (Ousterhout APoSD + talks, Tornhill crime-scene/x-rays, Feathers WELC, Nygard ADRs, Acton/Fabian DOD) capturing the primary claims our skills lean on, with precise attributions"
  - "Each deep-dive flags where our current skill wording paraphrases, sharpens, or diverges from the source, with a correction list if any"
  - "Findings land in .references/ (cloned/quoted) and/or docs/ reference notes, indexed so skills can cite them"
tags: ["type:research", "stream:skills-review"]
---

# Deep-dive original cited sources (Ousterhout, Tornhill, Feathers, etc.) to sharpen lenses and references

## What to build

Deep-dive the **original cited sources** our skills lean on, so our lenses and reference
docs rest on the primary material rather than second-hand paraphrase. Our skill prose
currently cites these from general knowledge / a research subagent's summary; this ticket
grounds them.

### Sources to cover (at least)

- **Ousterhout, _A Philosophy of Software Design_** (+ his talks/lectures): deep modules,
  classitis, information leakage, pass-through methods, "complexity is incremental,"
  depth-as-power-of-abstraction (not a lines ratio). Feeds `codebase-design`,
  `improve-codebase-architecture`.
- **Tornhill, _Your Code as a Crime Scene_ / _Software Design X-Rays_** (+ Nagappan &
  Ball churn-defect research): hotspot/churn analysis, change-frequency as the ROI signal
  for refactoring. Feeds `improve-codebase-architecture`'s scope-before-scan.
- **Feathers, _Working Effectively with Legacy Code_**: seams, sensing/separation,
  extract-for-testability-leaves-call-site-bugs. Feeds `codebase-design`,
  `diagnosing-bugs`.
- **Nygard, ADRs**: decision records, rejected-alternative content. Feeds
  `domain-modeling`, `triage`, `improve-codebase-architecture`.
- **Acton (CppCon 2014) / Fabian, _Data-Oriented Design_**: DOD, SoA vs AoS, cache
  locality, ECS as the opposite trade-off to deep modules. Feeds `game-native-design`,
  `game-modeling`, and the two-regime split in `codebase-design` /
  `improve-codebase-architecture`.

### What each deep-dive produces

- The primary claims we rely on, with **precise attributions** (chapter/section/timestamp).
- A note on where our current skill wording **paraphrases, sharpens, or diverges** from
  the source, with a correction list if we got something subtly wrong. (We already fixed
  one Ousterhout attribution during the codebase-design review; this is the systematic
  pass.)
- Material landed in `.references/` (cloned/quoted where license allows) and/or `docs/`
  reference notes, indexed so skills can cite a stable local reference instead of a
  from-memory claim.

Low priority / backlog: the skills work today on the paraphrased grounding; this sharpens
them later. Not a blocker for the skill walkthrough (ticket 03).

## Acceptance criteria

- [ ] A reference doc per major cited source (Ousterhout APoSD + talks, Tornhill crime-scene/x-rays, Feathers WELC, Nygard ADRs, Acton/Fabian DOD) capturing the primary claims our skills lean on, with precise attributions
- [ ] Each deep-dive flags where our current skill wording paraphrases, sharpens, or diverges from the source, with a correction list if any
- [ ] Findings land in `.references/` (cloned/quoted) and/or `docs/` reference notes, indexed so skills can cite them
