---
id: "183"
title: "Preserve artifact ownership across agent handoffs"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - "One existing skill owns the retention rule and other workflow surfaces use concise pointers."
  - "Worked scenarios cover merged but retained workspace, shared artifact, blocked worker, cross-harness handoff and unknown owner."
  - "Each scenario preserves ignored originals and useful evidence until classified recovery/disposition is recorded."
  - "Small reversible tasks require no mandatory registry or archive service."
  - "Conformance scenarios flag contradictory disposable/retained guidance while preserving project-specific policy."
  - "Applicable guidance checks and repository gates pass; global text stays within its existing budget."
tags: ["stream:test-verification"]
---

# Preserve artifact ownership across agent handoffs

## Intent source

Sam requested portable global follow-ups from the Philippines-trip storage review on 2026-11-02. The case found retained workspaces losing owner records after merge and ignored source/evidence outliving active assignments. This brief is self-contained; the private project is illustrative, not a required dependency.

## What to build

Extend the existing artifact lifecycle owned by repository-artifact-hygiene (#97/#110). When active work ends or changes harness, retained artifacts keep an accountable owner or explicit unknown state plus purpose and end condition. Separate active assignment from retention ownership. Closure/handoff distinguishes reproducible output, useful evidence, source originals and private recovery state. Git landing and clean status never establish ignored-data recovery.

Keep small tasks lightweight: a scoped note suffices; a project may use its own registry. Reuse existing implement/orchestrate/wrap/curate pointers rather than adding a cleanup skill or universal database. Extend conformance guidance to surface conflicting project retention rules without silently rewriting them. Honor existing user/project authorization; do not impose new approval on cleanup already authorized.

## Read first

- skills/meta/repository-artifact-hygiene/SKILL.md
- skills/meta/curate-docs/SKILL.md
- skills/engineering/implement/SKILL.md
- .tickets/97-scratch-retention.md and .tickets/181-scratch-prune-recipe-in-artifact-hygiene.md
- .tickets/104-stateful-change-contracts.md

## Acceptance criteria

- [x] One existing skill owns the retention rule and other workflow surfaces use concise pointers.
- [x] Worked scenarios cover merged but retained workspace, shared artifact, blocked worker, cross-harness handoff and unknown owner.
- [x] Each scenario preserves ignored originals and useful evidence until classified recovery/disposition is recorded.
- [x] Small reversible tasks require no mandatory registry or archive service.
- [x] Conformance scenarios flag contradictory disposable/retained guidance while preserving project-specific policy.
- [x] Applicable guidance checks and repository gates pass; global text stays within its existing budget.

## Out of scope

Project-specific paths, device names, file formats, universal new byte thresholds, cleanup daemons, automatic deletion, and implementing #184. #181 owns the pruning recipe; #182 owns growth/trend inspection.

## Execution pickup 2026-11-02

The user asked this session to proceed after #184. This related retention-verification
follow-up is now in stream:test-verification; validation fields mirror the existing six
acceptance criteria. The ownership policy remains in the existing artifact-hygiene owner,
with a scoped note or project registry sufficient. Work runs in parallel with #182 using
disjoint file scopes; no new dependency edge or shared cleanup executor is introduced.

## Implementation and acceptance 2026-11-02

Worker c610f91/be3ea7c makes artifact-hygiene the canonical owner of retention handoffs,
with a scoped lifecycle reference and concise pointers from implement, orchestrate, wrap,
curate, handoff and conformance. Active assignment is distinct from retention ownership;
purpose, end condition and explicit unknown state survive task/harness changes. A small
note or existing project registry is sufficient. Required originals and evidence remain
protected until recovery/disposition is recorded, without adding deletion authority.

Independent critic accepted the five worked scenarios and same-scope conformance conflict
scenario. These are guidance examples/manual review, not runtime agent-compliance proof.
Unknown owner maps to omission plus unknown disposition in #184's optional input; no actor
name blacklist, universal database, archive service or extra approval workflow was added.

Worker docs consistency and syntax checks passed; syntax fixtures passed 10/10. Its default
pre-merge selected zero checks, a skip rather than a pass. Extra check-guidance audit initially
failed: main had one existing false-positive args error; the nested worker also lacked the
relative prior-art sibling. AGENTS.md blobs were identical and the main sibling existed, so
the additional worker dead-path was environmental. #195 separately fixes the slash-argument
false positive; no AGENTS or prior-art reference was rewritten for this ticket.

Root integrated reviewed #183/#195 at 8d5c49f, explicitly ran pre-merge syntax/agent-guidance
2/2 (0.3/1.0 s), and ran checker fixtures 7/7 with no skips. New checker against unchanged
main guidance reported zero mechanical errors and six judgment reread notices, which remain
distinct from automated acceptance. Global guidance is unchanged at 2,423 bytes of its
3,072-byte budget. Pre-push passed 6/6; canonical deploy check/default passed, installing
50 skills. Source is pushed. Keep the named t183-worker checkout (19,327,040 file bytes)
through current #182 combined integration/review, then retire it; no other scratch output
or unowned-data operation was created by this worker.

## Resolution (2026-11-02)

done: accountable artifact retention survives handoffs through one canonical rule and lightweight pointers; independently reviewed, merged, pushed and deployed. Worked cases are reviewed guidance, not runtime compliance evidence. Baseline/path audit limitations preserved and args false positive fixed separately195. No user data, global policy or existing authorization changed. Keep t183-worker through current182 combined audit, retire afterward; no other worker scratch output.

### Verification
1. ✓ One existing skill owns the retention rule and other workflow surfaces use concise pointers. — "Canonicalartifact-hygiene ownershiprule/reference withshortpointers from6existingworkflow surfaces; criticSpec/Standardsreviewacceptedno duplicatedpolicyowner."
2. ✓ Worked scenarios cover merged but retained workspace, shared artifact, blocked worker, cross-harness handoff and unknown owner. — "Fiveworkedscenarios merged-retained/shared/blocked/crossharness/unknown manuallyreviewed, distinctactiveassignee vsretentionowner/purpose/endcondition. Nofalseclaimruntimeagentcompliance."
3. ✓ Each scenario preserves ignored originals and useful evidence until classified recovery/disposition is recorded. — "Scenariosprotectignoredoriginals/usefulevidence untilclassifiedrecovery/disposition; merge/clean/age/no-citationarenotdisposabilityproof, releasedstategrantsno newdeletionauthority."
4. ✓ Small reversible tasks require no mandatory registry or archive service. — "Scopednote/existingprojectregistryenough; nomandatoryuniversalregistry/archive/newapprovalgate, unknownowneromitted+unknownretention in184input."
5. ✓ Conformance scenarios flag contradictory disposable/retained guidance while preserving project-specific policy. — "Conformanceconflict examplesreportbothsame-scoperulesneeds-judgment,preserveexplicitprojectpolicy,noautomaticsilentrewrite; criticaccepted."
6. ✓ Applicable guidance checks and repository gates pass; global text stays within its existing budget. — "Worker syntaxfixtures10/10/docs50; rootforcedpremerge2/2andchecker7/7, prepush6/6deploy50passed. Baselineaudit1main/2worktreeerrorsseparatefrompass,195fixesargs; newmainaudit0errors6judgment. Global2423of3072Bunchanged."
