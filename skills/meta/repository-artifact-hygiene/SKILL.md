---
name: repository-artifact-hygiene
description: "Classify repository artifacts and choose storage, retention and reproducible retrieval. Use when adding source art, generated evidence, screenshots, embedded HTML, datasets or reference bundles; reviewing repository growth; choosing ordinary Git versus LFS; or closing a ticket, to promote, keep or delete its scratch and build artifacts. Trigger: artifact hygiene, generated evidence, source assets, repository storage, LFS, report growth, scratch cleanup."
---

# Repository Artifact Hygiene

Inspect staged candidates during work; use a selected tree or bounded history only
when requested. User and agent invocation are both supported. Inspection is
read-only; use the user's existing authorization for subsequent changes.

## Workflow

1. **Freeze scope.** Read the project's conventions. Name the repository root,
   inspected index/ref, owning account, concurrency and local/remote coverage.
   Keep independent owners separate. Untracked/ignored data needs its own explicit
   scope; neither Git metadata nor a successful push covers it.

2. **Measure.** Run the bundled script with Node 22+ from the installed skill path:

   ```text
   node <skill-dir>/scripts/inspect-artifacts.mjs --repo <repository-root>
   ```

   Use locally available Git storage; cloud-only Git object stores are outside
   this helper's scope. Git must support `--no-lazy-fetch`; older Git fails closed.
   Default: staged index candidates, not the working copy. With explicit policy,
   removing a manifest also checks its unchanged dependents, disclosed in scope.
   `--ref HEAD` inspects
   a committed tree. Add `--history` only for an explicit history audit. It defaults
   to 1,000 commits and 10,000 objects; limits and incomplete coverage are reported.
   Body inspection is bounded to 32 MiB/blob and 64 MiB total. Read `coverage`,
   `history` limits and `errors` before drawing conclusions. No fetch, checkout,
   worktree walk, filters, staging or hook installation occurs.

   Report Git blob lengths, declared LFS payload and embedded base64 characters
   separately. They are not allocation, billed storage, staleness or reclaimable
   bytes. A pointer is not proof of available local or remote payload. Exit 0
   permits review warnings; 1 means an explicit policy failed; 2 means inspection
   or input failed. Do not present partial/error results as a complete audit.

3. **Classify purpose.** For every candidate establish one role from project
   evidence: changing source original, generated evidence, reproducible
   output/reference, explicit dataset or private recovery state. Extension,
   size and equality alone cannot establish the role or disposability. Record
   unknowns; never infer deletion safety from a warning.

4. **Choose storage and recovery.** Keeping small assets in ordinary Git is valid.
   Consider LFS for revision-coupled source assets, pinned bundles for frozen
   evidence, and explicit data storage for datasets. Name the retained original,
   version/hash, retrieval command, private access, checkpoints and restore test.
   Independent backup covers ignored/private state. Verify owner-specific usage
   and billing before making cost claims; do not infer it from local bytes.

5. **Present concrete targets.** Separate keep/move/regenerate recommendations
   from uncertainty and state consequences. Preserve source originals and useful
   evidence. Apply approved work within the user's scope; untracking, upload,
   history rewrite, remote purge, deletion and spending are distinct actions.
   Keep unresolved pointers off published refs. A forward-only conversion leaves
   old Git blobs; reverting only its tip leaves pointer-bearing ancestors.

6. **Verify approved changes.** Confirm remote payload availability and restore
   latest plus a required historical revision into an empty-cache checkout.
   Compare hashes and run the asset-dependent build. Report unavailable gates;
   Git-only mirrors and source ZIPs are not proof of complete asset recovery.

Finish when every scoped candidate has a role or explicit uncertainty, retained
recovery inputs and a justified recommendation, with coverage and checks stated.

## At ticket close

Every uncommitted artifact a ticket made gets one of three outcomes before `tkt close`:
`.scratch` files, build output, worktrees, disposable homes, and work folders outside
the repo (`~/release-work/…`, a remote host's checkout).

- **Promote** what must outlive the ticket into tracked docs or evidence, and cite the
  tracked copy. A `.scratch` path in a Resolution or tracked doc dangles once the
  scratch goes; the docs check fails on new ones.
- **Keep** an item only while something still needs it, and give it a lifecycle scope:
  the ticket(s), release or shared purpose it serves, and the condition that ends it.
  Put the scope in the name (`t97-…`, `release-0.3-…`, `shared-<slug>-…`) and, for
  anything kept past this close, one line in the Resolution. A shared item stays until
  the last ticket it names closes.
- **Delete** everything else.

Keep a bounded history: the latest three attempts of each kind, plus any failed or cited
attempt that recovery or a release record still needs. Promote before pruning.

Record the outcome in the Resolution: what was promoted where, what was deleted, and
what was kept, with its scope. Deleting files outside the repo or on another host uses
the same authorization as any other deletion there. Items marked as relied on by another
tool (for example files hard-linked into a simulator) are kept until that tool is done.

## Policy and ownership

The inspector warns by default. `--warn-bytes N` adds a review signal, not a gate.
Only pass `--policy FILE` for a project-approved policy. It supports path-scoped
byte/embedded-content limits and manifest presence, with exact reasoned exceptions.
It does not decide purpose or install a gate. See
[inspection and policy](references/inspection.md) for flags, JSON and examples.

[Report format](../../../docs/agents/report-format.md) owns offline presentation;
[doc conventions](../../../docs/agents/doc-conventions.md) owns placement;
[curate-docs](../curate-docs/SKILL.md) owns the periodic promotion/pruning sweep;
this skill owns the close-time rule above. Use the project's
Git workflow for commits and hooks. Do not copy their policies here.

Does NOT cover GitHub account administration, general Git governance, release
publication, backup administration or machine-wide disk cleanup. Provider access
is separate from artifact classification. Read the bounded
[GitHub billing access reference](../../../docs/agents/research/github-billing-access.md)
only when that provider's access is the question.
