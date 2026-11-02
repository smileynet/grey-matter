---
id: "184"
title: "Revalidate preservation state before cleanup recommendations"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - "Synthetic fixtures make recommendations stale after scope/path identity, candidate inventory, ownership, workspace or observable dependency changes."
  - "Unknown ownership and partial probes retain explicit uncertainty rather than authorize cleanup."
  - "Symlink escapes and overlapping roots cannot silently widen scope or double count totals."
  - "Measurement output distinguishes logical and allocated accounting from unproven reclaimable space."
  - "Existing citation recheck behavior remains covered and the inspector stays read-only."
  - "Applicable inspector tests and repository gates pass; no whole-drive or live deletion test is needed."
tags: ["stream:test-verification"]
---

# Revalidate preservation state before cleanup recommendations

## Intent source

Sam requested portable follow-ups from the Philippines-trip storage review on 2026-11-02. Read-only inspection of inspect-footprint.mjs found --recheck compares citation keep lists but does not establish that the full preservation context still matches. Local project cleanup scripts also illustrated why Git-clean and merged are insufficient. This brief is self-contained and does not require private project access.

## What to build

Strengthen the existing read-only footprint inspector so a prior cleanup recommendation becomes stale when relevant preservation state changes. Recheck canonical scope/path identity, candidate file inventory, ownership/retention inputs supplied by the project, workspace identity and observable active dependencies. Report missing or partial probes explicitly; do not imply inactive from an unavailable probe. Keep logical length, allocated accounting and unknown physical reclaim distinct. Do not interpret missing citations as proof of disposability.

Define a small bounded optional ownership/retention input seam rather than hard-code one project's queue, agent names or device leases. Reuse existing skip/ask semantics. No deletion executor in this ticket.

## Read first

- skills/meta/repository-artifact-hygiene/scripts/inspect-footprint.mjs
- scripts/inspect-footprint.test.mjs
- skills/meta/repository-artifact-hygiene/references/inspection.md
- .tickets/110-agent-footprint-guardrails.md
- .tickets/182-footprint-outside-repo-regrowth.md

## Acceptance criteria

- [x] Synthetic fixtures make recommendations stale after scope/path identity, candidate inventory, ownership, workspace or observable dependency changes.
- [x] Unknown ownership and partial probes retain explicit uncertainty rather than authorize cleanup.
- [x] Symlink escapes and overlapping roots cannot silently widen scope or double count totals.
- [x] Measurement output distinguishes logical and allocated accounting from unproven reclaimable space.
- [x] Existing citation recheck behavior remains covered and the inspector stays read-only.
- [x] Applicable inspector tests and repository gates pass; no whole-drive or live deletion test is needed.

## Out of scope

Automatic cleanup, deletion approval APIs, a central agent registry, a daemon, #182's trend/regrowth work, and changing device or cloud data.

## Execution pickup 2026-11-02

After the user deferred OneDrive work, this related footprint-verification follow-up was
selected for the session. Moved from stream:tooling to stream:test-verification, preserving
the original intent, dependencies and acceptance scope. The validation fields now mirror
the existing six acceptance criteria. Code inspection confirmed that current --recheck only
compares citation keep lists when a current family exists. Revalidation comes before broader
growth/trend work so that later reports can reuse a sound preservation-state boundary; this
ordering introduces no dependency edge. Worker implementation and independent critic review
must precede root integration, evidence closure and dashboard update.

## Implementation and review 2026-11-02

Worker source commits through 6dbf44f add an optional versioned project preservation input
and bind saved reports to canonical workspace/scope, metadata inventory, ticket state,
ownership/retention disposition, dependency observations and final probe coverage. Recheck
rejects malformed/empty old reports and newly actionable candidates; delete/slim/prune all
remain conservative when context changes or observations are unknown. No cleanup executor
or owner registry was added. The existing citation-change regression remains covered.

Independent critic and test/spec review found substantive first-draft gaps: freeform retention
was not release, dependency declarations needed provenance/freshness, allocation fallback was
not measured allocation, prune needed the same checks, malformed prior reports could bypass
comparison, and host-volume coverage changed after an early recommendation gate. Corrections
also distinguish exact cap totals from known lower bounds and unverified allocation in JSON
and summary output. Renewed source/data-model review accepted the final contract.

Windows combined artifact/inspector fixtures passed 34 with 5 platform skips and no failures;
the inspector-only run passed 14 with 2 WSL-only skips. Root's final private integration
pre-merge selected artifact-hygiene (1/20) and passed in 9.6 s at 8654312. A later parallel
ticket-metadata merge passed its selected ticket-graph check in 0.3 s. Source/evidence was
fast-forwarded to main at 8e57707 and pushed with pre-push 6/6 passing. Canonical
`node scripts/deploy.mjs check` and `node scripts/deploy.mjs` passed, installing 50 skills.

The first native WSL run on 6dbf44f had 15 passes and one assertion failure: its recheck case
still expected review despite an intentional preservation-changed finding. Its wrapper also
failed to capture the child exit code; neither outcome is called a pass. Test-only 4f5ae25
retains the fresh-report review/ask control and separately checks stale-plan fail/ask.
The final direct native run on exactly 4f5ae25 passed 16/16 with no skips and process exit 0
in 53.526 s. Before/after HEAD and tracked source were unchanged and clean. The
[native evidence record](../docs/agents/research/evidence/footprint-inspector-native-184-20261102.json)
preserves commands, candidates, earlier failures, measured free space and limitations.

Scope limits: inventory is metadata-only and cannot detect same-size rewrites that preserve
recorded metadata; project provenance/completeness/freshness are caller assertions, not an
independently queried registry. Reclaimable bytes remain unknown. No live cleanup, OneDrive
probe, whole-drive scan, global WSL shutdown or sparse-mode change was performed. Only the
owned disposable distro was started/terminated; other distro states/default were preserved.
macOS execution remains deferred under #131/#175 at the user's request.

Promoted evidence is durable in the report and this ticket. Keep the named t184-worker,
small numbered native logs and shared WSL baseline as bounded regression/reproduction inputs
through #182 and the remaining platform integration; retire them when that audit no longer
needs them. The successful raw log is 3,849 bytes; the earlier failed log remains scoped to
the owned distro, with its size unmeasured. No unowned artifact was removed.

## Resolution (2026-11-02)

done: preservation-bound footprint rechecks and conservative measurement/reporting shipped, independently reviewed, merged, pushed and deployed. No real cleanup or OneDrive work resumed. Metadata-only inventories and caller-declared dependency limits remain explicit; macOS validation stays deferred131/175. Evidence promoted in native report/ticket. Keep t184-worker, numbered native logs and owned shared WSL baseline for182/remaining-platform regression audit; retire when no longer needed. Existing user data, distro settings and unrelated artifacts preserved.

### Verification
1. ✓ Synthetic fixtures make recommendations stale after scope/path identity, candidate inventory, ownership, workspace or observable dependency changes. — "Publicfixture comparisons invalidate changedcanonicalscope/path,inventory,owner,workspace,ticket,open/dependencyobservations; versionedpriorschema rejects malformed/empty/newunreviewedcandidates. Source4f5ae25reviewed, nocandidatecontenthashclaim."
2. ✓ Unknown ownership and partial probes retain explicit uncertainty rather than authorize cleanup. — "Structuredretained/released/unknown; onlyreleasedcanpermitrecommendation withknownownerfreshcompletecaller-declareddependencies. Unknown/partial/staleprobesask; finalcoverageboundafterWSLhostprobe. Criticfirstdraftfindingsfixedandaccepted."
3. ✓ Symlink escapes and overlapping roots cannot silently widen scope or double count totals. — "Synthetic symlinkescape isnottraversed, overlappingrootsexcludedandcoveragepartial; read-onlypublictestsprovenoFSexpansion/doublecount. No liveuserdata orcleanup."
4. ✓ Measurement output distinguishes logical and allocated accounting from unproven reclaimable space. — "logicalBytes vsallocatedBytes/null andkeepBytes/null; reclaimableBytesnull. Exactcaptotals, knownlowerbound allocatedBytesAtLeast, andunverifiedcapremainseparateinJSON/summary, withpositive/negativefixtures."
5. ✓ Existing citation recheck behavior remains covered and the inspector stays read-only. — "Existingcitationkeep-list-changecase retained; freshnesscheckscoverdelete/slim/prune anddonotgrantdeletionauthority. Optionalprojectinputusesexistingownershipnoteswithno centralregistryorexecutor."
6. ✓ Applicable inspector tests and repository gates pass; no whole-drive or live deletion test is needed. — "Workercombined34pass5platformskip; finalnative4f5ae25:16pass0fail0skiptrueexit0,53.526s. Rootpremergeartifact1/20pass9.6splusmetadata ticketgraphpass; prepush6/6andcanonicaldeploy50pass. Prior15/1assertionandwrapperinfra recorded, notcountedpass."
