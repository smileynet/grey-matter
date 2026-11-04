# Accepted orchestration retro amendments (2026-11-04)

The five approved amendments are implemented. Four complete their owning tickets;
#139's receipt-comparison amendment is complete while its broader custom-dashboard
hook and whole-board projection work remains open.

| Owner | Delivered behavior | Accepted source |
| --- | --- | --- |
| #225 | Reassess diagnostic progress, repaired behavior and preparation churn; adapt a qualitative prompt rather than a numeric growth or retry threshold. | Worker `5e7d225`; integrated `51c1c0c`. |
| #251 | Distinguish missing guidance, an instruction not followed, a missing execution path and an observable contract defect; choose the covering skill or existing check. | Worker `5e7d225`; integrated `51c1c0c`. |
| #145 | Use current host/dispatch evidence and read-only Git observations to distinguish possible local overlap, caller-attested writing, cached remote advance and unknown liveness. | Worker `98ac700`; integrated `d239371`. |
| #149 | Select exact tag membership from full-board facts and report excluded context, pending blockers and queue/priority/criteria advisories without changing the adopted queue. | Worker `98ac700`; integrated `d239371`. |
| #139 amendment | Inspect existing receipt inputs before renewing review; unchanged independent views retain acceptance, changed/shared inputs invalidate dependent receipts. | Integrated `2569dfb`. |

## Independent acceptance

- [Intervention and convergence review](evidence/retro-amendments-20261104/225-251-review.md)
  maps all original and amended criteria. Its three-case before/after application of
  written guidance and six intervention examples are offline assessments, not a
  controlled live-agent experiment or evidence of a speed improvement.
- [Coordination and queue review](evidence/retro-amendments-20261104/145-149-review.md)
  accepts the exact worker candidate and the parent's tool-guidance additions.
  Reported chat workspaces are distinct from actual command working directories;
  a supplied writer binding is an attestation, not authentication.
- [Receipt comparison review](evidence/retro-amendments-20261104/139-review.md)
  accepts the narrow amendment and preserves every broader #139 requirement.

Dispatch preflights bound both worker roots, branches, original base `404ffef`,
final candidate and retained evidence hashes. Parent integration preserved reviewed
file bytes; the tool catalog separately covers every new operator and fixture.

## Verification actually completed

| Check | Result |
| --- | --- |
| `node --test --test-timeout=60000 scripts/review-receipt.test.mjs` | PASS: 19 tests, no failures or skips. |
| `node --test --test-timeout=60000 skills/productivity/delivery-dashboard/scripts/preflight-publication.test.mjs` | PASS: 10 tests, no failures or skips, including stale-review refusal. |
| `node --test --test-timeout=60000 skills/meta/orient/scripts/classify-checkout-concurrency.test.mjs skills/meta/reconcile-tickets/scripts/priority-review.test.mjs` | PASS: six tests, no failures or skips, including real disposable Git fixtures. |
| Current exact-tag operator output versus an independent full `tkt query --all-context` | PASS: 30 included and 219 excluded tickets matched; two priority advisories, no automatic queue edits. These are a dated snapshot. |
| Current checkout operator | Dirty local source correctly left liveness unknown; no remote advance observed in cached tracking state. |
| `node skills/engineering/orchestrate/scripts/check-tool-guidance.mjs` | PASS: 153 tracked paths classified, with owning operator guidance. |
| `node scripts/gate.mjs pre-merge --include skill-syntax-fixtures` | PASS: receipt integration selected three checks; convergence and coordination integrations each selected the explicit syntax fixture. Separately invoked helper suites above remain on-demand. |
| Actual pre-push hooks | PASS: six selected checks for receipt source, five for convergence source and five for coordination source. |
| Documentation consistency and invocation-policy checks | PASS; 50 skills and 19 user-invoked entries remain consistent. |
| `node scripts/deploy.mjs --no-agy --no-kirocrew` | PASS after a clean fast-forward of the registered tkt checkout supplied its already-published matching shared deployer; installed 50 skills. No local tkt commits were dropped or rebased. |
| Installed helper smoke | PASS: installed helper bytes match source; the installed queue helper reported the same 30/219 membership, and the installed checkout helper ran read-only against the separate tkt project with liveness unknown. |

The worker's zero-selected pre-merge runs were skips, not passes; parent runs above
explicitly selected required syntax evidence. Initial missing-dependency/command
lookup attempts and the deployer-drift refusal were infrastructure gaps corrected
before dependent acceptance. No stale run was substituted for a current pass.
No native model call, broad host scan, global hook, provider switch, Agy/Crew
execution, cross-platform qualification or fresh historical-session replay was added.

## Disposition

Implementation, guidance, the cited case report and exact independent reviews are
promoted as durable evidence. Parent-owned raw batch logs, packets and preparation
helpers are kept through this amendment batch's wrap disposition; useful acceptance
summaries are promoted before those owned scratch files can be recycled. The reused
worktrees and their pre-existing ignored qualification evidence remain protected
under their earlier retention conditions. The worker's 3.9 MB dependency install
stays a routine validation dependency until that worktree is retired. Private
unpublished #171 ancestry and unrelated work were neither integrated nor removed.

The final delivery/dashboard refresh follows tracker closure so its statuses and
scope are current. It does not close the remaining #139 requirements or other
follow-up queue tickets. The batch monitor ends only after that delivery settles.

## Published delivery

The [private effort dashboard](https://orchestration-findings.sambiggins.chatgpt.site)
published successfully on 2026-11-04. Its
[publication provenance](evidence/retro-amendments-publication-20261104.json) binds
the reviewed owner candidate, actual Site source and terminal deployment result.
[Visual acceptance](evidence/retro-amendments-20261104/dashboard-review.md) covers
twelve phone/laptop captures: 38 findings and 66 effort tickets, with all seven
remaining effort tickets visible; the delivery dashboard retains all 249 tickets
and 87 entries. Those are dated snapshots, not a permanent count guarantee.

The existing default delivery flow scope was preserved; an optional orchestration
scope includes the proposal's epic and earlier spike stream. #225/#251/#145/#149
are closed; #139 remains open with its two amendment criteria checked and original
seven pending. The next unfinished queue item is #148, for the later session.

An initial browser launch ended before a page existed. That infrastructure error
was retained separately; the subsequent completed capture runs and independent
review establish the reported local rendering results. The owned 106,215-byte
publication archive was hashed and recycled only after terminal success.
The production browser handoff was queued; no production rendering check is claimed.
