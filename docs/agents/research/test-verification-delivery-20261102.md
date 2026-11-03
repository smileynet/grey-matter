# Test verification: core delivery and adoption

The owner accepted core delivery on 2026-11-02 and requested integration of useful findings
without waiting for the remaining platform and failure-diagnosis items. The core is delivered;
the four independent follow-ups retain their unfinished acceptance criteria and original
`stream:test-verification` tag for lineage. No release or device acceptance is implied.

## Intent and integrated findings

The original #152 request was to stop running an expensive full suite for every small change
and bound verification scratch. Its motivating project reported 6–8 minute commit gates and
roughly 32 GB of retained verification output. #119 contributed the complementary rule:
choose the cheapest environment that executes the actual implementation boundary being claimed.

| Finding | Integrated owner | Evidence and limits |
| --- | --- | --- |
| Select checks by changed paths and lifecycle stage; keep reversible tooling changes proportional. | [Local gates](../local-gates.md), `scripts/gate.mjs`, `scripts/gates.json`, setup/adoption/conformance guidance | #152 and #114; docs-only metadata and source changes have separate observed selected-check results. Budgets are policy, not a promise every adopter currently meets them. |
| Use the cheapest faithful environment and escalate only for added boundaries. | [Test environment ladder](../test-environment-ladder.md), TDD and implementation pointers | #119/#104/#105; a fake or mock cannot establish native, provider or installed-device behavior. |
| Reduce repeated fixture setup and isolate personal Git configuration. | Shared fixture helpers and release/deployer regressions | #137/#176; [measured evidence](evidence/test-optimization-20261102.json) retains timeouts and variable host load. Targeted improvements do not establish a universal speedup. |
| Bound storage and preserve necessary originals and first failures. | Artifact-hygiene skill, retention lifecycle, pruning recipe and footprint inspector | #106/#115/#181–184; [retention inventory](evidence/test-verification-retention-20261102.json) names kept inputs and disposition. No general deletion authority follows. |
| Report incomplete observations honestly. | Gate empty-selection disclosure, dashboard evidence contract, platform reports | #112/#116/#132/#133/#182; Windows and WSL checks are distinct. Mac, cloud placeholder and rendered dashboard acceptance remain limited as recorded. |

The 25 completed tickets are merged and pushed; changed skills were deployed locally.
The [plan](../../plan.md#test-optimization-and-verification) preserves their
per-ticket evidence. The final #181/#182 integration is `654ebab`; the final native inspector
run passed 24 tests with one explicit Git LFS skip, while Windows passed the LFS control.
See the [native report](evidence/footprint-growth-native-182-20261102.json). No new benchmark,
Mac test, provider operation or rendered UI observation was run for this closeout.

## Independent follow-ups

| Ticket | Remaining claim | Activation condition |
| --- | --- | --- |
| #122 | Explain the original intermittent Windows deployer failure. | Capture a matching actual failure with full output and process/resource context. The original log is missing; 20 green runs do not identify its cause. |
| #175 | Reproduce and diagnose the Mac inspector hang; `lsof` is an unproven cause. | User resumes deferred testing and a fresh SpaceJam check shows at least 20 GiB free. Preserve both project simulators. |
| #131 | Validate macOS/APFS commands, inspector and allocation/free-space behavior. | Same user/space conditions, with distinct platform acceptance evidence. |
| #192 | Validate an owned online-only OneDrive placeholder. | User resumes the work and supplies an approved fixture already online-only. Previously inspected fixture was local; do not change its state to manufacture a test. |

Dashboard laptop/phone visual acceptance is a separate pending observation. Its source/data
checks passed; browser policy blocked local-file rendering and no bypass was attempted.

## Adoption audit scope

Two workers inspected only verification instructions/configuration, then checked source
currency. Local `tagalog-helper` at `c8dd498` predates the cited scoped-gate change, has no
remote/upstream, and lacks `bf9726e`. Local `philippines-trip` at `247f7d1` follows only
`origin/codex/ux-spikes` and lacks cited `b570747`. Neither local snapshot establishes a
current adoption defect. Current GitHub source is inspected at pinned revisions instead;
no clone, checkout update, build, simulator, cloud file or adopter runtime operation is used.

### Current source observations

| Project / pinned revision | Already adopted | Difference needing project reconciliation |
| --- | --- | --- |
| [tagalog-helper `583f4b8`](https://github.com/smileynet/tagalog-helper/tree/583f4b8cb56271959f34828eeaf6768487cc6926) | Authored path-to-stage selection, preview/full override, full release/phone checks, fingerprints, latest-three attempt retention and protected whole snapshot groups. | Its instructions and tracked hook still use blocking pre-commit verification, whereas current grey-matter excludes that stage. No explicit `Verification phase:` line is present. Owner phase/cadence must be reconciled before changing enforcement. |
| [philippines-trip `233b84d`](https://github.com/smileynet/philippines-trip/tree/233b84d9e578bc210d780f120e78ffd6f0cc5fb6) | Custom path-selected edit/commit/merge/release runner, left-first test hierarchy, manual device/provider checks at release, ownership/recovery holds and bounded uncited attempts. | No explicit `Verification phase:` line; documentation describes a Mac Claude push hook rather than the current project-owned Git-stage contract. An older test-strategy introduction still describes automated selection as a proposal although runner/policy source implements it. |

For Tagalog Helper, pinned [AGENTS.md](https://github.com/smileynet/tagalog-helper/blob/583f4b8cb56271959f34828eeaf6768487cc6926/AGENTS.md)
and [scope data](https://github.com/smileynet/tagalog-helper/blob/583f4b8cb56271959f34828eeaf6768487cc6926/scripts/commit-scope.json)
are implemented by [commit_gate.py](https://github.com/smileynet/tagalog-helper/blob/583f4b8cb56271959f34828eeaf6768487cc6926/scripts/commit_gate.py)
and the tracked [pre-commit hook](https://github.com/smileynet/tagalog-helper/blob/583f4b8cb56271959f34828eeaf6768487cc6926/.githooks/pre-commit).
[Retention data](https://github.com/smileynet/tagalog-helper/blob/583f4b8cb56271959f34828eeaf6768487cc6926/scripts/scratch-retention.json)
and the [review-only pruner](https://github.com/smileynet/tagalog-helper/blob/583f4b8cb56271959f34828eeaf6768487cc6926/scripts/prune_scratch.py)
already cover latest-three families and separately authorized retirement. This is substantial
adoption, not an absence of test optimization.

For Philippines Trip, pinned [AGENTS.md](https://github.com/smileynet/philippines-trip/blob/233b84d9e578bc210d780f120e78ffd6f0cc5fb6/AGENTS.md),
[runner guide](https://github.com/smileynet/philippines-trip/blob/233b84d9e578bc210d780f120e78ffd6f0cc5fb6/.memory/guides/check-runner.md)
and [policy](https://github.com/smileynet/philippines-trip/blob/233b84d9e578bc210d780f120e78ffd6f0cc5fb6/tools/check_policy.json)
establish existing selection and cadence. The [test-strategy review](https://github.com/smileynet/philippines-trip/blob/233b84d9e578bc210d780f120e78ffd6f0cc5fb6/.memory/reviews/test-strategy.md)
has the stale proposal wording; the [storage lifecycle](https://github.com/smileynet/philippines-trip/blob/233b84d9e578bc210d780f120e78ffd6f0cc5fb6/.memory/guides/storage-lifecycle.md)
already carries retention ownership, recovery and bounded history.

These are source observations retrieved through the GitHub connector, not fresh runtime
results. Installed hook activation, current test durations, device/provider state and local
storage usage remain unknown. A missing phase line defaults to speed under grey-matter;
neither a native application nor release activity authorizes an agent to select stability.
Different runner names alone are not a defect or a reason to replace a working implementation.

The remaining adoption reconciliation belongs to existing [ticket #164](../../../.tickets/164-grey-matter-upgrade-skill.md),
which already owns migration of these two consumers to post-proposal-18 conventions. This
audit supplies pinned examples and narrows its starting point; it does not add another
core-delivery prerequisite, silently change either project's policy, or expand to #130.

Independent critic source review accepted the delivery/adoption claims and follow-up
separation. The only new scratch artifact was a 3,653-byte metadata-update helper; after
use it was sent to the OS trash and its original path was absent. Bin contents were not
inspected. No source clone, raw corpus, screenshot or dependency copy was created. Previously
retained and unowned artifacts keep the sizes and lifecycle recorded in the linked inventory.
