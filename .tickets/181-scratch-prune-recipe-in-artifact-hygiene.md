---
id: "181"
title: "Add a scratch-prune recipe to repository-artifact-hygiene"
status: done
blocked_by: []
priority: low
validation_criteria:
  - "The recipe states the dry-run, citation-match, compact promotion, repoint and apply sequence."
  - "Done-ticket citations and generated dashboard data count as durable references."
  - "Whole run directories, raw xcresults and sqlite snapshots are excluded from ordinary tracked proof promotion."
  - "The recipe distinguishes tracked summaries from protected necessary raw originals and requires recovery/disposition before local removal."
  - "Missing citations or an ended ticket are review signals, not proof that unknown source/private artifacts are disposable."
tags: ["stream:test-verification", "type:chore"]
---

# Add a scratch-prune recipe to repository-artifact-hygiene

## Intent source

Recovered during the 2026-11-01 cleanup from local commit `bd11e83`, originally ticket 165 (now occupied upstream). Preserve the scratch-cleanup request from the Philippines-trip session.

## What to build

Extend `skills/meta/repository-artifact-hygiene/SKILL.md` with a scratch-prune recipe: inspect a dry-run plan, match durable citations, promote only small final artifacts, repoint citations, then apply the reviewed plan. Count references from closed tickets and generated dashboard data. Keep whole run directories, raw xcresults and sqlite snapshots out of durable storage.

## Acceptance criteria

- [x] The recipe states the dry-run → citation-match → promote → repoint → apply sequence.
- [x] Done-ticket citations and generated dashboard data count as durable references.
- [x] Whole run directories, raw xcresults and sqlite snapshots are excluded from ordinary tracked proof promotion.

## Portable preservation follow-up (2026-11-02)

Sam approved refining this ticket after the Philippines storage review. Excluding raw result bundles or database snapshots from ordinary tracked documentation does not authorize destroying their only copy. Distinguish compact promoted proof from necessary originals retained privately with scope, hashes and verified recovery. Raw originals may be needed for unresolved failure analysis or release evidence. Missing citations and age alone do not establish disposability. Keep the recipe small and use existing project authorization; no new generic cleanup executor. #183 owns handoff ownership and #184 owns stale-plan inspection; #182 retains growth/trend scope.

- [ ] The recipe distinguishes tracked summaries from protected necessary raw originals and requires recovery/disposition before their local removal.
- [ ] Missing citations or an ended ticket are review signals rather than proof that unknown source/private artifacts are disposable.

## Execution pickup 2026-11-02

The user asked this session to proceed with related work. After #183's canonical retention
rule landed, this small recipe follow-up moved to stream:test-verification. Validation fields
mirror the existing five acceptance checks, with raw-promotion wording clarified by the user's
portable preservation refinement above. Existing dependencies are unchanged. The change is
guidance only; no live prune, source-data operation or new approval executor is authorized.

## Implementation and review 2026-11-02

Worker commit `192df9682521c0d4e17867bba28e746f39ab94b1` adds the small recipe to
the existing artifact-hygiene owner. Independent critic Spec and Standards review accepted
all five criteria: exact dry-run targets, durable citations including closed tickets and
dashboard data, compact tracked proof, protected necessary originals, and uncertainty
that cannot authorize disposal. No cleanup executor or new approval layer was introduced.
Worker syntax fixtures passed 10/10 and documentation consistency covered 50 skills.
The nested worktree guidance audit's missing sibling `../crew-research/atomics` is an
environment limitation; the canonical checkout audit after #195 has zero errors and six
judgment items. This change performs no live cleanup and makes no recovery-test claim.

Root integration, deployment and native closure evidence follow below. The owned worker
checkout is retained through the final combined #182 audit, then may be retired; Git holds
the recoverable source. Dashboard visual acceptance remains pending separately.

Root integrated source at `654ebab`, pushed it to main, and deployed 50 skills with
`node scripts/deploy.mjs check` followed by `node scripts/deploy.mjs`; both completed
successfully (the optional plugin logo notice is informational). Before publication,
`node scripts/gate.mjs pre-merge --base b9d88f7 --include agent-guidance --include skill-syntax-fixtures`
passed all three selected checks: syntax fixtures 0.3 s, agent guidance 1.1 s and
artifact hygiene 22.6 s. The push hook passed six selected checks. The tracked
[retention inventory](../docs/agents/research/evidence/test-verification-retention-20261102.json)
extends the bounded checkout's lifecycle through remaining platform reproduction review;
no user or unowned artifact was removed.

## Resolution (2026-11-02)

done: small preservation-first scratch-prune recipe independently reviewed, verified, merged, pushed and deployed. No cleanup performed; retained inputs have an explicit lifecycle.

### Verification
1. ✓ The recipe states the dry-run, citation-match, compact promotion, repoint and apply sequence. — "Worker 192df968 adds the exact dry-run, citation-match, compact proof promotion, repoint, regenerate, immediate recheck and authorized apply sequence. Critic Spec and Standards review accepted all five criteria. Root integrated pre-merge syntax, guidance and artifact-hygiene checks passed 3/3; source pushed and canonical deployment passed."
2. ✓ Done-ticket citations and generated dashboard data count as durable references. — "Recipe explicitly counts done-ticket references and generated dashboard data as durable citations, and requires regenerating affected data after repointing. Manual critic review accepted the guidance, not a claim of runtime agent compliance."
3. ✓ Whole run directories, raw xcresults and sqlite snapshots are excluded from ordinary tracked proof promotion. — "Whole run directories, raw xcresults and sqlite snapshots are excluded from ordinary tracked proof promotion; only compact final artifacts enter tracked documentation. No raw artifact was deleted by this change."
4. ✓ The recipe distinguishes tracked summaries from protected necessary raw originals and requires recovery/disposition before local removal. — "Necessary raw originals remain privately retained with owner, purpose, hashes, recovery and end condition. They cannot be removed before recorded recovery or disposition. Recipe remains small and reuses existing project authorization."
5. ✓ Missing citations or an ended ticket are review signals, not proof that unknown source/private artifacts are disposable. — "Missing citations, ended tickets and old timestamps remain review signals; unknown source/private artifacts are not classified disposable. Source-only dashboard review is separate from pending human laptop/phone acceptance."
