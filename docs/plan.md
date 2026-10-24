# Current work plan

The coordinated [release plan](agents/proposals/09-release-readiness.md) and
[release contract](agents/release-contract.md) define scope and acceptance.
User-approved staging versions: grey-matter 0.2.0 and tkt 0.5.0. Publication is
not authorized. Candidate preparation and install/upgrade verification are complete. Finish the
final audit and artifact staging after native Windows/Linux validation on the user's machines.

## Active release thread

| ID | Work | Status |
| --- | --- | --- |
| 68 | Publish and resume coordinated GitHub and plugin releases safely | ✅ done |
| 67 | Prepare version-consistent release candidates and plugin bundles | ✅ done |
| 69 | Verify plugin fresh installs and upgrades in isolated harness homes | ✅ done |
| 77 | Validate native release candidates on Windows (user machine) | open |
| 78 | Validate native release candidates on Linux (user machine) | open |
| 70 | Audit both projects before release staging | in_progress |
| 71 | Stage reviewed changelogs README files and release artifacts | open |

Tickets 67–69 are complete, including the independent integrated publication review,
prepared Cargo evidence, sole CI publisher/dispatcher, candidate preparation and
isolated fresh-install/upgrade checks. Audit-discovered resource closure ticket 76 is
also complete; the restored evidence file is verified in all three grey-matter bundles.

Current frozen candidates are grey-matter
`e071b7b03d02025dc1af6c3ff2c4f8369f777587` and tkt
`2b6ff173993c9fe413c40287fb1cb3f0a9879ca1`. Product/native checks, all six harness
probe groups, Windows/Linux product gates and tkt's five-target build-only stage pass.
The [final audit](agents/research/final-release-audit-20261024.md) records evidence,
ticket dispositions and the native-platform coverage gap. The user will run tickets
77 and 78 on the respective machines; both block the final audit.

The remaining sequence is parallel 77/78 → 70 → 71. Keep staging tied to these frozen candidates;
source behavior or release-documentation changes require replacement artifacts and
affected evidence. This live plan and ticket receipts record later progress; embedded
plans in frozen bundles remain snapshots of their source revisions.

## Parked work

These are existing backlog items, not newly approved release scope. Ticket 70 must
record explicit release dispositions; this table does not clear any blocker.

| ID | Work | Status |
| --- | --- | --- |
| 04 | Migrate grey-matter conventions to native tkt features once 192-199 land | backlog |
| 06 | Model-eval harness: track how model changes affect skill handling and leverage | backlog |
| 09 | Spike: shell-invoked fresh agent (kiro-cli/codex/claude) vs subagent for fresh-context tasks | backlog |
| 10 | Make skills tkt-preferred but tracker-adaptable (GitHub Issues, others) by context | backlog |
| 11 | Revisit triage: make GitHub adapter first-class once dependency work lands | backlog |
| 12 | Deep-dive original cited sources (Ousterhout, Tornhill, Feathers, etc.) to sharpen lenses and references | backlog |
| 15 | Add and test wizard sinks for game projects (export_presets.cfg, keystore path) | backlog |
| 16 | Test wizard end-to-end against known and unknown scenarios (post v0.1.0 deploy) | backlog |
| 18 | Test an agent-focused routing skill (adapt the router or create a separate agent-router) | backlog |
| 19 | Live-test teach against existing projects and related works | backlog |
| 20 | Consider trimming pr's inline visual catalog to references/ (depth-bar nit) | backlog |
| 21 | Review the beta (in-progress) and frozen (misc) upstream skills for adaptation | backlog |
| 23 | Spike: validate the release-process skills (changelog, readme, release) | backlog |
| 24 | Wrap tkt-provided skills (not commands); record the wrap-skills-not-commands rule | backlog |
| 33 | tkt: allow checking ACs on a superseded/closed ticket (or validate --fix to repair unchecked-acs-on-done) | backlog |
| 43 | Revisit adopt-project glossary seeding: (b) stage-then-write vs (c) hybrid, from real-use findings | backlog |
| 44 | orient could nudge if the pre-commit hook isn't installed (optional) | backlog |
