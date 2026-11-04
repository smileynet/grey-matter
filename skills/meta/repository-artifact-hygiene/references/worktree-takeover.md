# Worktree and branch takeover

Use this sequence when inheriting an agent's checkout. It guides inspection and
preservation; it does not authorize merge, deletion, remote changes or app lifecycle
operations.

1. Record the repository, base revision, active ticket owners and any checkout or
device bindings. Inventory registered worktrees and local plus cached remote refs.
Do not fetch just to make an old remote observation look current. State whether refs
are local, cached or freshly observed.
2. For each candidate ref, compare it to the intended integration base with
`git cherry <base> <ref>`. All `-` commits are patch-equivalent to commits reachable
from the base (landed); any `+` commit remains unique. This comparison does not
establish that a newer branch supersedes it. Mark a branch superseded only when an
owner or ticket record identifies its replacement and the replacement contains the
needed work. Otherwise keep it unique or unknown.
3. Inspect changed paths against `.gitattributes` at the candidate revision. A path
with `filter=lfs` must contain a valid Git LFS pointer in Git; a full image blob is
LFS-breaking. Check newly changed attributes too. Unknown attribute coverage means
manual review, not a clean result. Use `plan-worktree-takeover.mjs` to produce a
read-only first-pass inventory; its LFS check compares target-base and candidate
attributes and blob bytes for changed paths, and all tracked candidate paths when
`.gitattributes` changes.
4. Resolve dependencies and integrate accepted unique work in feature order. For an
LFS-breaking branch, preserve its original commit, prepare a reviewed squash and
renormalization against the target's attributes, then verify the resulting pointer
and remote payload/recovery path before merge. Never merge raw blobs merely to simplify
cleanup. Recheck the base and branch immediately before each integration.
5. Preserve unique unfinished work under a ticket-scoped or dated local `archive/`
ref before considering branch removal. Verify the ref resolves to the intended SHA.
The named ref preserves source without merging unverified code. Remove local refs only
after the owner accepts the archive and source dependencies; remove remote refs only
with their owner's approval.
6. Decide source integration, ignored/private artifact disposition and checkout
retirement independently. Record owners, purpose, state and end condition for retained
artifacts. Copy current inputs to canonical locations and update their consumers before
retirement; a Git ref does not preserve ignored files or private evidence.
7. For harness-managed workspaces, consult that harness's supported lifecycle and
current primary/shared task bindings. A refusal is a handoff blocker: report it once
with the supported operation or binding change required, then wait for that relevant
change before retrying. Never force removal through Git or infer eligibility from a
clean checkout.

## Classification limits

`git cherry` detects patch-equivalent commits relative to the supplied base, not semantic
equivalence. Supersession needs explicit evidence. Cached remote refs can be stale.
The helper does not inspect live harness sessions, ignored files, LFS server payload,
remote branch deletion rights, or checkout-retirement eligibility. Unknowns stay
visible for the owner to resolve.
