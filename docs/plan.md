# Current work plan

The coordinated [release plan](agents/proposals/09-release-readiness.md) and
[release contract](agents/release-contract.md) define scope and acceptance.
User-approved staging versions: grey-matter 0.2.0 and tkt 0.5.0. Publication is
not authorized. Candidate preparation, install/upgrade verification, final audit and
artifact staging are complete. Native Linux and Windows validation are verified.

## Active release thread

| ID | Work | Status |
| --- | --- | --- |
| 68 | Publish and resume coordinated GitHub and plugin releases safely | ✅ done |
| 67 | Prepare version-consistent release candidates and plugin bundles | ✅ done |
| 69 | Verify plugin fresh installs and upgrades in isolated harness homes | ✅ done |
| 77 | Validate native release candidates on Windows (SharkTank) | ✅ done |
| 78 | Validate native release candidates on Linux (randomserver) | ✅ done |
| 70 | Audit both projects before release staging | ✅ done |
| 71 | Stage reviewed changelogs README files and release artifacts | ✅ done |

Tickets 67–69 are complete, including the independent integrated publication review,
prepared Cargo evidence, sole CI publisher/dispatcher, candidate preparation and
isolated fresh-install/upgrade checks. Audit-discovered resource closure ticket 76 is
also complete; the restored evidence file is verified in all three grey-matter bundles.

Current frozen candidates are grey-matter
`e071b7b03d02025dc1af6c3ff2c4f8369f777587` and tkt
`2b6ff173993c9fe413c40287fb1cb3f0a9879ca1`. Product/native checks, all six harness
probe groups, Windows/Linux product gates and tkt's five-target build-only stage pass.
The [final audit](agents/research/final-release-audit-20261024.md) records evidence,
ticket dispositions and the completed native platform evidence. Linux ticket 78 is complete after SSH validation on randomserver. [Windows ticket 77](agents/research/windows-native-validation-completion-20261024.md) is complete after authorized live duplicate cleanup and a passing complete Codex candidate catalog/state probe, with no scope exclusion.

Audit 70 and staging 71 are complete. The [staging closeout](agents/research/release-staging-20261024.md) pins review commit
`c24720f77f252544659a376a1493fd5c53985018` and the dedicated review branch.
No further release execution is authorized. Keep staging tied to these frozen candidates;
source behavior or release-documentation changes require replacement artifacts and
affected evidence. This live plan and ticket receipts record later progress; embedded
plans in frozen bundles remain snapshots of their source revisions.

On 2026-10-28 the user chose to prepare grey-matter 0.2.0 again from current main
rather than publish `e071b7b`, which main had passed by 91 commits (it lacks
`data-modeling`, `delivery-dashboard` and later work). The frozen candidate and review
branch stay as the worked example; the new candidate needs its own evidence and staging.
Current candidates: grey-matter `05792a71c7e936b3ed26a623933bbfa224d7b93c` (from main
`a4db04a`, pushed branch `codex/release-grey-matter-0.2.0-a4db04a9`) and tkt
`a827bb6f264ad2ef73157fd8c0a471cb78e634fe` (from tkt main `c4d2ad5`, pushed branch
`codex/release-tkt-0.5.0-c4d2ad54`); work output is `~/release-work/20261028/` on
randomserver. The first grey-matter re-candidate `1efb247` failed the Windows product
gate on two artifact-hygiene tests (ticket 99, fixed in `a4db04a`) and is superseded.
grey-matter's deploy engine had changed since tkt `2b6ff17` vendored it, so the user
approved preparing tkt 0.5.0 again, with all open tickets in both repos deferred.

Passing evidence for the current pair:
- Linux (randomserver): product and native gates for both (agy via the pinned 1.4.6
  wrapper); all six harness probe groups, with the 10-24 Linux probes retargeted and
  their expected catalog size raised from 51 to 53 (48 + 4 + 1 foreign).
- Windows (SharkTank, re-keyed 2026-10-29): product and native gates for both, and the
  previous-release-to-Codex upgrade probe (53 skills, foreign preserved). The tkt clone
  uses `core.autocrlf=false`, as on 10-24. Evidence archive
  `windows-evidence-20261029.zip`, sha256 `4f135c6a…db9dbf`.
- macOS (SpaceJam, arm64, macOS 26.6.2, 2026-10-29): product gates (all 16 grey-matter
  groups) and native gates for both under the loopback-only sandbox; all six harness
  probe groups, using the Mac's 10-24 probes with the same retargeting. Installed Kiro
  2.35.1 refuses an unauthenticated session, so the kiro probe ran the notarized
  official Kiro 2.34.0 build that matches the Linux pin (recorded in `kiro-pin.json`).
  Evidence archive `mac-evidence-20261029.zip`, sha256 `faa4e26d…85cc4021`.
- tkt five-target build-only stage, Actions run 40822712451.

- tkt CLI: the CI x86_64 Linux binary reports `tkt 0.5.0 (a827bb6)`; the CLI-surface
  check (386 invocations, 42 files, 21 commands) and tag-context check pass.

Staged 2026-10-29 for review: the [final audit](agents/research/final-release-audit-20261029.md)
is go for staging. The carrier is on `codex/stage-grey-matter-020-tkt-050-20261029` at
review commit `6b983fcda0e3326f96d32a656fa691cc188bacb3`, and its
`docs/agents/releases/20261029/verify.mjs` passes at that commit (both products, no pending
gates, tkt CI provenance re-read). tkt's publication plan passes read-only. Publication
waits for an explicit request; recheck crates.io, artifact retention and the changelog
merge first ([publication commands](https://github.com/smileynet/grey-matter/blob/codex/stage-grey-matter-020-tkt-050-20261029/docs/agents/releases/20261029/publication.md)).

## Parked work

These are existing backlog items, not newly approved release scope. Audit 70 records
their release dispositions; this table does not clear any blocker.

| ID | Work | Status |
| --- | --- | --- |
| 04 | Migrate grey-matter conventions to native tkt features once 192-199 land | open |
| 06 | Model-eval harness: track how model changes affect skill handling and leverage | backlog |
| 09 | Spike: shell-invoked fresh agent (kiro-cli/codex/claude) vs subagent for fresh-context tasks | backlog |
| 10 | Make skills tkt-preferred but tracker-adaptable (GitHub Issues, others) by context | backlog |
| 11 | Revisit triage: make GitHub adapter first-class once dependency work lands | backlog |
| 12 | Deep-dive original cited sources (Ousterhout, Tornhill, Feathers, etc.) to sharpen lenses and references | backlog |
| 15 | Add and test wizard sinks for game projects (export_presets.cfg, keystore path) | backlog |
| 16 | Test wizard end-to-end against known and unknown scenarios (post v0.1.0 deploy) | backlog |
| 18 | Test an agent-focused routing skill (adapt the router or create a separate agent-router) | backlog |
| 19 | Live-test teach against existing projects and related works | backlog |
| 20 | Consider trimming pr's inline visual catalog to references/ (depth-bar nit) | open |
| 21 | Review the beta (in-progress) and frozen (misc) upstream skills for adaptation | backlog |
| 23 | Spike: validate the release-process skills (changelog, readme, release) | backlog |
| 24 | Wrap tkt-provided skills (not commands); record the wrap-skills-not-commands rule | backlog |
| 33 | tkt: allow checking ACs on a superseded/closed ticket (or validate --fix to repair unchecked-acs-on-done) | ✅ done |
| 43 | Revisit adopt-project glossary seeding: (b) stage-then-write vs (c) hybrid, from real-use findings | backlog |
| 44 | orient could nudge if the pre-commit hook isn't installed (optional) | open |
