# Repository artifact hygiene

Status: approved for implementation, 2026-10-25. The user accepted this proposal
and requested the skill after a repository-storage investigation exposed recurring
generated-evidence growth. The
[skill](../../../skills/meta/repository-artifact-hygiene/SKILL.md) now owns the
workflow; this document retains the rationale. Project migration, deletion,
spending and history changes still follow their own task authorization.

## Recommendation

Add **repository-artifact-hygiene** under `skills/meta/`, rather than a broad
**github-hygiene** skill. Its single concern is deciding which artifacts belong in
source history, how their payload is retrieved, and what recovery must preserve.
It applies across Git hosts. GitHub billing, account permissions, branch policy,
release publishing and machine-wide disk cleanup have different owners.

Approved invocation: callable by the user and model when adding media, generated
reports, screenshots, datasets or reference bundles. Inspect staged candidates by
default; broader history analysis requires an explicit audit request.

## Evidence and the rules that caused friction

- A measured 9.6 MB HTML report contained 9.46 MB of base64 characters. Twenty-two
  reachable versions represented about 200 MiB of logical Git blob content.
  Image-extension LFS rules cannot catch media embedded in HTML. These figures
  describe one incident, not universal thresholds or physically reclaimable bytes.
- The prior [adoption hygiene rubric](../../../skills/meta/adopt-project/references/repo-hygiene.md)
  proposed LFS when any binaries were tracked, including screenshots. File role,
  size, revision churn and retrieval needs should drive that choice instead.
- The prior [report format convention](../report-format.md) required fully inline,
  single-file HTML. That makes a portable deliverable but also encourages repeated
  payloads in changing dashboards. Resolve presentation and retention together.
- A forward-only LFS conversion preserves earlier ordinary Git blobs. Reverting
  only the tip leaves pointer-bearing ancestors; the pre-push hook still requires
  their payload. Provider migration is not a substitute for recovery verification.
  See the [migrate](https://github.com/git-lfs/git-lfs/blob/main/docs/man/git-lfs-migrate.adoc)
  and [pre-push](https://github.com/git-lfs/git-lfs/blob/main/docs/man/git-lfs-pre-push.adoc)
  contracts, read 2026-10-25.

## Proposed workflow

1. **Freeze scope.** Name the repository, owning account, inspected ref/index,
   local/remote coverage, untracked/ignored exclusions and concurrent-work risk.
2. **Measure candidates.** Report current Git blob lengths, LFS declared payload,
   embedded content and explicitly requested reachable history separately.
   Distinguish logical bytes, allocation, billed storage and reclaim estimates.
3. **Classify purpose.** Establish whether each candidate is a changing source
   original, generated evidence, reproducible output/reference, dataset or private
   recovery state. Unknown purpose remains a finding, not a removal candidate.
4. **Choose storage and retention.** For every proposed move, name the retained
   original, exact version/hash, retrieval command, private access model, retained
   checkpoints and offline behavior. Keeping a small asset in ordinary Git is a
   valid outcome. Choose LFS for revision-coupled source assets, bundles for frozen
   evidence and explicit data storage for datasets where those workflows fit.
5. **Present a plan.** Keep inspection read-only. Treat untracking, payload upload,
   history rewrite, remote purge, deletion and billing changes as distinct actions
   whose authorization follows the user's request. Reuse authorization already given.
6. **Verify approved changes.** Confirm payload availability before publishing
   dependent refs; restore latest and one required old revision in an empty-cache
   checkout and compare hashes. Test the asset-dependent build. Verify private
   ignored state through its independent backup, not through a Git push.

Completion: every inspected candidate has a role or explicit uncertainty, retained
recovery inputs and a justified keep/move/regenerate recommendation; coverage and
verification gaps are stated. No broad scan or migration follows automatically.

## Resolve the inline-report conflict in its existing owner

Revise `report-format.md` to distinguish these artifact roles:

| Role | Proposed storage contract |
| --- | --- |
| Small evolving dashboard | Commit the meaningful dashboard. Reference separately versioned local assets when that avoids repeated payload; provide a tested offline opening route. |
| Intentional portable deliverable | A self-contained HTML file remains valid. Record its publication/retention purpose; embedding is not automatically a defect. |
| Per-run evidence | Default to ignored scratch. Promote selected proof, a compact summary or a pinned bundle when it needs to survive a fresh clone. |
| Frozen evidence bundle | Retain an immutable version/hash and authenticated retrieval instructions in Git; verify extraction and offline inspection. |
| Source art and private originals | Preserve editable originals and provenance; select ordinary Git, LFS and independent backup deliberately. |

Keep the [document placement/promotion convention](../doc-conventions.md) as the
single owner of location and durability. Keep
[delivery-dashboard](../../../skills/productivity/delivery-dashboard/SKILL.md) as
the presentation owner. They link to classification when relevant rather than
copying its rules. No blanket HTML, screenshot, binary or embedding ban.

## Mechanical enforcement

Propose one distributed, read-only inspector at
`skills/meta/repository-artifact-hygiene/scripts/inspect-artifacts.mjs`.
It reads the specified Git tree/index directly, without checking out files,
walking ignored trees, materializing cloud files, fetching, staging or installing
hooks. Default candidate mode must not traverse full history.

Return JSON containing scope/ref, coverage, metrics, findings and errors. Detect
blob sizes, valid/malformed LFS pointers, embedded data and project-approved
manifest requirements. Surface warnings first; an extension or large byte count
cannot establish disposability or source-versus-output intent.

Only an explicit project policy can turn a deterministic finding into a blocking
gate, with narrow path/reason exceptions. Do not invent universal byte thresholds,
a mandatory policy file, automatic expiry or a binary ban. Human/agent review
owns purpose and retention judgments. The existing Git workflow owns commits,
pushes and hook preservation; no parallel hook installer.

Fixture coverage must include small intentional art, large embedded report,
diffable dataset, valid/malformed pointer, missing Git object, path with spaces,
partial coverage, ignored large tree, approved exception and caller Git context.
Verify unchanged index, refs, worktree bytes and no network access. Root
`scripts/check-repo.mjs` runs this same inspector's disposable fixture suite;
adoption, conformance and optional project gates reuse its findings.

## Integration and boundaries

| Existing owner | Proposed change |
| --- | --- |
| Adoption hygiene reference + orchestrator | Replace binary-implies-LFS advice with classification; consume its result at the existing approval boundary. Retain privacy and reference-index ownership. |
| Report format | Own the role-based offline/inline/bundle contract above. |
| Doc conventions / delivery dashboard | Add a conditional pointer; retain placement and presentation ownership. |
| Conformance audit | Consume mechanical evidence and classify storage decisions as needs-judgment; own no new storage policy. |
| Curate docs | Retain promotion/pruning ownership; route storage questions to classification. |
| Meta README / compass | Register one distinct skill if approved, with no always-loaded policy expansion. |
| Distribution checks | Add detector fixtures; retain current packaging, link, syntax and invocation gates. |

Provider-specific access facts belong in a bounded reference such as
[GitHub billing access](../research/github-billing-access.md), not in this skill's
core workflow. Keep volatile prices, tokens, account balances and personal repo
inventories out of shared instructions. The skill can require verified owner
usage when making a provider recommendation without becoming an account admin.

## Acceptance before implementation is called complete

- Confirm invocation and owner boundaries; author a self-sufficient skill entry.
- Revise the two existing conflicting rules rather than leave competing copies.
- Prove role/measurement distinctions and read-only behavior with fixtures.
- Pilot one asset-heavy repo and one small code repo; both may legitimately keep
  current storage. Preserve an intentional self-contained HTML deliverable.
- Verify latest/historical recovery and surface unavailable remote evidence.
- Run the distribution, syntax, index/link and detector gates; deploy the approved
  skill once through the existing workflow. No release publication is implied.

Project-specific decisions remain: artifact roles, warning thresholds, policy
limits, exceptions and retention. The optional inspector policy is enabled only
when explicitly supplied; no universal size or retention gate was enacted.
