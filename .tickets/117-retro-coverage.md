---
id: "117"
title: "Declare retrospective coverage and distinguish repairs from remaining work"
status: open
blocked_by: []
validation_criteria:
  - "Behavioral scenarios verify the reported session failure and corrected outcome"
  - "Guidance has one maintained owner with scoped implementation and evidence limits"
  - "Applicable fixtures and repository consistency gate pass"
tags: ["stream:tooling"]
---

# Declare retrospective coverage and distinguish repairs from remaining work


## Intent

Sam requested this shared follow-up after a fresh-context retrospective selectively inspected 180 messages/error outputs from a 35.9 MB session trace. The report correctly declared partial primary-trace coverage; that reporting practice should be explicit in the owning skill.

## What to build

Update `skills/engineering/retro/SKILL.md` or its existing report reference to state the inspected corpus, sampling/extraction limits, trace/file references and unverified areas. Bounded reads are desirable, but a truncated tool result requires a focused reread or an explicit remaining gap. Never infer completeness from a nonempty subagent report.

Separate observed defect, corrected verification gap, already-landed regression and remaining recommendation. Distinguish source inspection from freshly executed checks. Route remaining work to existing owners instead of duplicating tickets or adding a broad AGENTS rule. Use one compact coverage statement rather than a mandatory new report format. #119 owns evidence execution/reuse semantics; #118 owns bounded dashboard inspection guidance.

Do not require replaying the entire trace or redispatching facts already in context. The actual audit's coverage limit is historical fact, not a blanket defect in the final deployment proof.

## Acceptance criteria

- [ ] A sampled/truncated trace scenario produces explicit partial coverage with inspected scope and unresolved gaps.
- [ ] A report with inspected tests but no execution cannot claim fresh test success; repaired defects with existing regressions are not filed as new implementation work.
- [ ] Focused reread and retained coverage limits are both supported without requiring an exhaustive trace audit.
- [ ] Applicable guidance scenarios and `node scripts/check-repo.mjs` pass.
