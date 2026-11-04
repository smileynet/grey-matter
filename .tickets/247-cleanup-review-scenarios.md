---
id: "247"
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

## Judgement and portability

Use the existing artifact-hygiene skill for purpose, ownership, useful evidence, retention and acceptance decisions. Tools supply measured facts, coverage and changed-input observations; they do not infer disposability from names, age, size, ticket status or a complete scan. Keep examples portable across build systems and storage layouts. Incident-specific formats are scenario inputs, not a required global taxonomy or policy engine. Prefer a short skill/reference improvement over new automation when the decision requires context.

## Acceptance criteria

- [ ] A disposable parent containing protected app/data payloads is rejected or narrowed with explicit evidence.
- [ ] Ownership arriving after a Trash move blocks dependent purge pending valid disposition.
- [ ] An interrupted purge reports partial/unknown progress rather than complete.
- [ ] Completion is recorded only after target removal and owned-batch finalization are verified.
- [ ] An unfamiliar material byte category prevents an exhaustive-cleanup claim without granting deletion authority.
- [ ] Scenario review distinguishes source inspection, historical test receipts, fresh executions and unverified coverage.
- [ ] Applicable checks and independent review pass using offline inputs; no live deletion is required.

- [ ] A destructive multi-target job records durable per-target intent and verified outcomes instead of publishing its only receipt after the entire loop.
- [ ] Offline interruption scenarios cover termination after removal but before receipt persistence, partial removal, ledger write failure and changed target identity; resume revalidates scope and authorization and never reports unverified success.

## Out of scope

Reimplementing completed Tagalog Helper tickets 211/217/218, resolving that project's legacy identity ticket 212, or adding mandatory global ledgers, hooks or a device campaign.

## Accepted Philippines skill follow-up · November 4

Sam requested upstream tickets after implementing the local artifact-retirement
skill, explicitly preferring agent judgment when uncertain. Extend the existing
hygiene scenario work rather than add a second cleanup/retention policy engine.
Source: https://github.com/smileynet/philippines-trip/blob/main/.memory/reviews/retro-followup-2026-11-04.md

Add a policy-change scenario: a prior promise retains release history through an
archive review, then the owner explicitly changes the project to retaining only
active inputs. Reassess actual current consumers under the latest scoped intent;
old citations alone do not perpetuate the hold. Preserve private originals, live
data and uncertain dependencies while resolving the particular uncertainty.
Archive when recovery is wanted, rather than as a substitute for this decision.

Acceptance additions:
- [ ] The existing hygiene skill/reference distinguishes current consumers, desired recovery material and obsolete evidence after an explicit policy change.
- [ ] Offline scenario review contrasts disposable preproduction data, a production recovery bundle and an actively consumed research dataset; neither always-archive nor always-delete is accepted.
- [ ] Project paths, preproduction policy, archive hosts, capacities and approval schemas remain local; no automated disposal classifier or global retention period is introduced.

Overlap checked: #97/#181/#183 are completed lifecycle/prune/handoff work; #246
owns disposition and measured reclaim; #212 owns archival proof. This extension
adds policy-supersession judgment without reopening or duplicating those repairs.

## Accepted remote Android retro extension · November 4

Sam accepted filing this portable follow-up after Philippines Trip #282 succeeded.
That one-off job published its applied receipt only after all targets completed;
no interrupted-deletion failure was observed. The remaining durability gap is
tracked locally in Philippines Trip #284. Source:
https://github.com/smileynet/philippines-trip/blob/84cf6935/.memory/reviews/remote-android-retro-followup-2026-11-04.md

Extend the existing interrupted-purge scenarios with a small reusable ledger
pattern or disclosed example, including durable intent before mutation and a
verified checkpoint immediately after each target. Bind resume to the same frozen
scope and authorization, plus fresh target identity, ownership and handle checks.
A missing target after interruption requires explicit reconciliation, not blind
retry or automatic success. A ledger failure stops further destructive work.
Keep mechanical failure-injection checks with any supplied helper/example.

This extends acceptance examples without requiring a mandatory global ledger or
building a second executor, deletion classifier or authorization policy. Project
operators retain removal judgment and permission scope. Coordinate with #246 on
capacity/disposition reporting; do not reopen the completed local cleanup.
