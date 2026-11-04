---
id: "205"
title: "Reject stale review receipts and source mismatch before dashboard publication"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - "Stale receipt, changed render input and mismatched packaged source cannot pass preflight; existing receipt implementation is reused."
  - "Guidance specifies preflight before authorized publication, exact commands and limits, preserving audience/credentials and requiring actual deployment results."
  - "Meaningful rejection fixtures, current dashboard checks, independent review and required repository stages pass."
tags: ["stream:orchestration","type:chore","epic:outcome-orchestration"]
assignee: "codex"
---
# Reject stale review receipts and source mismatch before dashboard publication

## Intent

User approved [proposal 19](../docs/agents/proposals/19-outcome-driven-orchestration.md) on 2026-11-03 and explicitly requested tickets plus agent skill guidance for all tool scripts.

## What to build

Add an on-demand publication preflight around existing dashboard receipt checks, current rendered inputs and packaged source identity. Keep parent ownership and existing Site audience/publication authorization. Fail closed before push/publication on stale review or failed required check; do not introduce a new credential store, general Site publisher or global hook. Skill guidance must show exact inputs/commands and what evidence is not proved. Coordinate #118 execution-flow and #139 custom-dashboard work; preserve their scope.

## Acceptance criteria

- [x] Stale receipt, changed render input and mismatched packaged source cannot pass preflight; existing receipt implementation is reused.
- [x] Guidance specifies preflight before authorized publication, exact commands and limits, preserving audience/credentials and requiring actual deployment results.
- [x] Meaningful rejection fixtures, current dashboard checks, independent review and required repository stages pass.

## Resolution (2026-11-03)

Delivered and deployed read-only publication preflight over exact copies and this effort fixed hosted-link transformation, with exact source/receipt/check-attestation/package binding and negative fixtures. Independent review and actual local payload check accepted; no claim about archives or later remote uploads. Promoted compact evidence/private retention index, retain raw/worktree through cycle audit/reuse, preserve unrelated tkt owner commits and source.

### Verification
1. ✓ Stale receipt, changed render input and mismatched packaged source cannot pass preflight; existing receipt implementation is reused. — "PASS: independently accepted79df42f and integrated-source equivalence renewed afterupstreamrebase; 10/10 rejection/acceptancefixtures and real materialized202206Sitepayload preflightpassed against unprojectedreviewedGitblob. Failed/stale check/receipt, altered payload andunknowntransforms reject."
2. ✓ Guidance specifies preflight before authorized publication, exact commands and limits, preserving audience/credentials and requiring actual deployment results. — "PASS: owningdashboard skill/reference and146pathcatalog document exactcommands/schema, independentexpectedidentity, attestationlimits andfixedknownlinktransform. No credentialstore/publisher/arbitrarytoolrunner; archive/remoteuploadproof excluded. Rawoutputs/packets indexed in evidence/orchestration-delivery-205-20261103.json."
3. ✓ Meaningful rejection fixtures, current dashboard checks, independent review and required repository stages pass. — "PASS: parent premerge2/2 andprepush5/5 onaccepted rebasedsource; deploy --no-agy --no-kirocrew completed installed50skills andpushsucceeded. Worker56dashboard-receipt tests10syntaxpass; missing optionalPlaywright wasinfrastructure, notpass. Ownedraw/worktrees retainedthroughcycleaudit; currentSiteactualdeployment separate202206snapshot."
