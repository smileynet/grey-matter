# Worktree takeover scenarios (#148)

This applies the takeover procedure to the reported Philippines handoff: seven
worktrees and 46 branches, with patch-equivalent commits, superseded branches,
four branches with unique work, and one candidate storing LFS-managed images as raw
blobs. The source checkout's #206 helper was not present in the accessible checkout
or visible scratch directory during this review, so no comparison with its bytes or
behavior is claimed.

| Observation | Source decision | Artifact decision | Checkout decision |
| --- | --- | --- | --- |
| `git cherry` marks every commit `-` against the selected base. | Treat commits as patch-equivalent and do not integrate them again; this does not prove semantic equivalence. | Inspect ignored/private content and its owner, purpose, recovery and end condition separately. | Retire only after checking live bindings and the supported lifecycle. |
| A candidate has `+` commits, is accepted, and its prerequisites are satisfied. | Integrate in feature order; preserve a verified ticket-scoped `archive/` ref before any later local branch removal. | Keep useful originals and evidence until consumers confirm recovery or release. | Retire only after moving current inputs and updating consumers. |
| A candidate has `+` commits needed by unfinished work but is not safe to merge. | Preserve the exact SHA on a named `archive/<ticket-or-date>` ref; document the dependent work and leave it unmerged. | Keep its fixtures and private evidence under an accountable retention record. | Do not retire a checkout still needed to recover those inputs. |
| A newer ticket branch is proposed as replacement. | Mark the older ref superseded only when the owner/ticket identifies the replacement and the replacement contains the older source commits (or independently verifies equivalent required changes). Otherwise retain `unique`/unknown. | A replacement's source history does not prove its ignored artifacts were copied. | A superseded branch alone does not authorize checkout retirement. |
| A changed path has `filter=lfs` at the candidate but contains a full blob. | Preserve the original ref; prepare a reviewed squash and renormalization plan and verify the normalized Git pointer before integration. | Verify required LFS payload retrieval and restore before disposition; Git pointer presence alone is insufficient. | Retire only after the normalized source and required payload are recoverable. |
| Source is landed and checkout is clean, but the harness refuses retirement because it is primary/shared. | Source may be complete; make no further source change on that basis. | Preserve any unresolved artifacts and ownership records. | Report the refusal once with the supported handoff/binding change; retry after that relevant change. Never force Git removal. |

These are decision examples, not a reclassification of the historical branches.
The helper reports only refs currently available in its selected local object store,
and cached remote refs may be stale. It does not inspect ignored/private files, live
session state, remote LFS payload or app lifecycle eligibility.
