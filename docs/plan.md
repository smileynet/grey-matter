# Current work plan

The coordinated [release plan](agents/proposals/09-release-readiness.md) and
[release contract](agents/release-contract.md) define scope and acceptance.
User-approved staging versions: grey-matter 0.2.0 and tkt 0.5.0. Publication is
not authorized. Candidate preparation is complete; run install/upgrade verification,
then the final audit and artifact staging.

## Active release thread

| ID | Work | Status |
| --- | --- | --- |
| 68 | Publish and resume coordinated GitHub and plugin releases safely | ✅ done |
| 67 | Prepare version-consistent release candidates and plugin bundles | ✅ done |
| 69 | Verify plugin fresh installs and upgrades in isolated harness homes | in_progress |
| 70 | Audit both projects before release staging | open |
| 71 | Stage reviewed changelogs README files and release artifacts | open |

Ticket 68 is complete, including prepared Cargo evidence, the sole CI publisher and
dispatcher, lifecycle/recovery checks, deployment audit and independent integrated
Standards/Spec review. Ticket 67 is complete on grey-matter candidate
`bec5afee9f4f070ef898ac309d45d5061a5be7b5` and tkt candidate
`cd96042a5a70123cfbfc656ddf34563c53cff7a0`. Both pass product/native preparation
checks; grey Windows/Linux gates and tkt CI/five-target staging build pass.

The remaining sequence is 69 → 70 → 71. Previous-release probes include the
v0.4 skill-link migration fixed by tkt 217. Keep audit and staging tied to these
frozen candidates; runtime or release-documentation changes require new artifacts
and affected evidence. This live plan and ticket receipts record later progress;
embedded plans in frozen bundles remain snapshots of their source revisions.

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
