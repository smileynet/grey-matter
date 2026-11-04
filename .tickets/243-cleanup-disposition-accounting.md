---
id: "243"
title: "Distinguish Trash removal from observed space recovery"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "Hygiene scenarios distinguish reversible Trash moves, exact authorized permanent disposal and unknown batch disposition."
  - "Report examples separately label moved bytes, removed targets, observed same-volume free-space change and unavailable physical attribution."
  - "Applicable documentation and syntax stages pass with independent scenario review."
tags: ["stream:test-verification", "kind:enhancement"]
---
## Intent source

Sam accepted this Tagalog Helper storage-retro follow-up on 2026-11-04. Moving about 3.2 GiB into Trash initially freed no space. Later disappearance of that batch had no attributable purge command in the inspected trace. The project subsequently implemented guarded Trash/purge and honest result metrics; portable hygiene guidance still needs the goal/disposition branch.

Source: https://github.com/smileynet/tagalog-helper/blob/ee4ecc8/docs/storage-retro-fixes-review.html

## Read first

- skills/meta/repository-artifact-hygiene/SKILL.md
- skills/meta/repository-artifact-hygiene/references/retention-lifecycle.md
- skills/meta/repository-artifact-hygiene/references/inspection.md
- docs/agents/report-format.md

## What to build

Judgement improvement with structured reporting support: distinguish a request for reversible removal from a request to free space. Describe the consequences of the project's supported executor dispositions and apply existing exact user authorization. A Trash move is removal from the workspace, not proof of reclaimed capacity. Permanent disposal remains a distinct authorized action; unknown disposition stays unknown.

Report moved bytes, purged target counts, remaining batches and observed same-volume free-space before/after separately. Explain that APFS clones, open files and concurrent writers prevent exclusive physical attribution from du or a volume delta. Prefer a short branch and disclosed examples in the existing hygiene owner, not more global instructions.

## Acceptance criteria

- [ ] Guidance identifies the cleanup goal and supported disposition before executing approved targets.
- [ ] A Trash-only scenario reports moved data without claiming freed disk space.
- [ ] A missing batch with no observed purge is reported as unattributed, not credited to the agent.
- [ ] A permanent-disposal scenario uses exact existing authorization and preserves unrelated Trash contents.
- [ ] Report examples separate candidate allocation from observed volume change and disclose concurrency limits.
- [ ] Applicable documentation checks and independent scenario review pass.

## Out of scope

A new generic purge executor, blanket Trash emptying, duplicate implementation of Tagalog Helper's completed repair, or new approval steps when authorization already exists. Local ticket 212 owns archive proof/recovery-consumer preflight, not this disposition-reporting contract.
