---
id: "206"
title: "Reconcile operational reference drift found in the orchestration review"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - "Each observed contradiction is reproduced from current primary files/help and corrected with version/scope evidence."
  - "Operational references, role guidance and historical proposal status agree without reviving completed tickets or modifying held harness settings."
  - "Independent content review, syntax/invocation/docs checks as applicable and repository stages pass; guidance deployment is recorded."
tags: ["stream:orchestration", "type:chore"]
assignee: "codex"
---
# Reconcile operational reference drift found in the orchestration review

## Intent

User approved [proposal 19](../docs/agents/proposals/19-outcome-driven-orchestration.md) on 2026-11-03 and explicitly requested tickets plus agent skill guidance for all tool scripts.

## What to build

Apply proposal 19's concrete documentation corrections: plugin discovery uses bucket directories per actual manifest/distribution maintenance; distinguish cancelled-ticket reopen from terminal done semantics using installed CLI help; mark proposal 17 as implemented historical design with current successor. Existing #166 retains harness overview version refresh; do not perform unqualified broad harness detection or invoke Agy under its hold. Review unconditional TDD routing so research/reversible prose does not invent implementation-mirroring tests. Keep changes scoped to observed contradictions and add only necessary navigation pointers.

## Acceptance criteria

- [x] Each observed contradiction is reproduced from current primary files/help and corrected with version/scope evidence.
- [x] Operational references, role guidance and historical proposal status agree without reviving completed tickets or modifying held harness settings.
- [x] Independent content review, syntax/invocation/docs checks as applicable and repository stages pass; guidance deployment is recorded.

## Resolution (2026-11-03)

Corrected plugin discovery and tkt lifecycle/capability reference drift, historical proposal status and proportional TDD routing. Independently reviewed on integrated source, verified and deployed with Agy excluded. No new native experiment or global setting change; promoted compact delivery evidence; retained ongoing-cycle preparation inputs until cycle settles.

### Verification
1. ✓ Each observed contradiction is reproduced from current primary files/help and corrected with version/scope evidence. — "PASS: actual bucket-root manifest/distribution source compared; installed tkt0.4.0(898ceb5) reopenhelp limited tocancelled, capability inputSchema confirms tags/vc. Corrected only observed contradictions, no lifecycle or harness probes."
2. ✓ Operational references, role guidance and historical proposal status agree without reviving completed tickets or modifying held harness settings. — "PASS: independent critic renewed acceptance on29928893 after reviewed202 proposal17historicalstatus integration. TDD remains conditional on behavior and applicable verification;166 broader overview ownership unchanged."
3. ✓ Independent content review, syntax/invocation/docs checks as applicable and repository stages pass; guidance deployment is recorded. — "PASS: parent syntax/invocation/docs checks, integrated premerge syntaxfixture1/1 and prepush5/5; deploy --no-agy terminal installed50skills. Evidence and artifact lifecycle in outcome-orchestration-delivery-20261103.md; no native invocation claimed."
