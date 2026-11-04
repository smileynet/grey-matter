---
id: "244"
title: "Review cleanup plans against changing ownership and protected descendants"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Authored offline scenarios cover protected descendants, changed ownership between move and purge, interrupted purge and premature completion."
  - "Reviewer examples request existing mechanical regression evidence and distinguish source inspection from executed checks."
  - "Applicable repository stages and independent standards/spec review pass without performing live deletion."
tags: ["stream:test-verification", "kind:enhancement"]
---
## Intent source

Sam accepted this Tagalog Helper storage-retro follow-up on 2026-11-04. Independent review found protected payloads nested inside disposable-looking families and missing ownership revalidation between transfer and purge. A later correction kept global progress at purging until removal completed. Those app defects are repaired; this ticket transfers the lessons into upstream reviewer scenarios.

Durable source: https://github.com/smileynet/tagalog-helper/tree/ee4ecc8/.memory/reviews/storage-retro-fixes-2026-11-03

## Read first

- skills/meta/repository-artifact-hygiene/SKILL.md
- skills/meta/repository-artifact-hygiene/references/inspection.md
- skills/meta/repository-artifact-hygiene/references/retention-lifecycle.md
- skills/engineering/code-review/SKILL.md
- docs/agents/local-gates.md

## What to build

Judgement improvement: reviewers of a project's destructive artifact plan recognize misleading family labels, mutable ownership and incomplete terminal outcomes. Add concise scenarios under the existing hygiene reference and a conditional review pointer where needed. Ask for the project's existing synthetic checks rather than copying app-specific policies or building a second executor.

Mechanical checks belong in the owning project's tools. The reviewer should verify applicable evidence, its exact scope and execution status. Keep this focused on cleanup acceptance; local tickets 115 and 184 already own positive preservation evidence and fresh dependency observations.

## Acceptance criteria

- [ ] A disposable parent containing protected app/data payloads is rejected or narrowed with explicit evidence.
- [ ] Ownership arriving after a Trash move blocks dependent purge pending valid disposition.
- [ ] An interrupted purge reports partial/unknown progress rather than complete.
- [ ] Completion is recorded only after target removal and owned-batch finalization are verified.
- [ ] An unfamiliar material byte category prevents an exhaustive-cleanup claim without granting deletion authority.
- [ ] Scenario review distinguishes source inspection, historical test receipts, fresh executions and unverified coverage.
- [ ] Applicable checks and independent review pass using offline inputs; no live deletion is required.

## Out of scope

Reimplementing completed Tagalog Helper tickets 211/217/218, resolving that project's legacy identity ticket 212, or adding mandatory global ledgers, hooks or a device campaign.
