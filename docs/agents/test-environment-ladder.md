# Test-environment ladder

Answer each question in the **leftmost tier** that executes the actual implementation and can
observe the asserted boundary. Climb to prove an added boundary. When a higher tier catches a bug,
pin it lower where the same failure can be reproduced faithfully; retain the higher-tier check
for the boundary only it observes. Report
the tier each claim was verified at; a tier you did not run is "not run", an outcome class, never
a pass.

Tiers are sized by the resources a test uses, after Google's small/medium/large sizes (prior art);
the browser, simulator and device rungs follow Android's testing-strategy table, which maps each
layer to an environment and a cadence (prior art). Sources: [test tiers and
cadence](research/test-tiers-and-cadence-20261031.md), [simulator vs
device](research/simulator-vs-device-testing-20261031.md), [agent prior
art](research/agent-test-tiering-prior-art-20261031.md). Decided in [proposal
16](proposals/16-agent-footprint-guardrails.md) (P7).

## Select by assertion

Before planning commands, record one row per distinct assertion:
**assertion → implementation/seam → environment → added boundary or exclusion → measured cost
(setup, runtime, disk) → criticality → lifecycle gate**. Use the rows below as starting points,
not a required test-count ratio or device matrix. Group assertions that share a command.

Cost and criticality are independent: an authorization decision can be both cheap and release
critical; an installed-update retention check can be expensive and release critical. Cost chooses
the feedback loop and setup reuse; criticality determines which claims must be proved before
promotion. Run the project's declared gates as defined in [local gates](local-gates.md); this
ladder selects evidence environments, not new mandatory hooks or hosted jobs.

Execute the shipped reader/model/parser, in its own runtime, for claims about its behavior.
Use fakes or injected faults to control adjacent boundaries; name the real provider, UI or storage
boundary those fakes exclude. A web mock proves its design/web surface. It cannot establish native
controls, OS secure storage or installation behavior. A real provider read-back establishes the
provider state queried, not that a device installed the build.

## Tiers

| Tier | Runs in | Cost | What only this tier catches | Default cadence |
|---|---|---|---|---|
| 0. Static | typecheck, lint, format, parse/import | seconds, no runtime | ill-typed code, banned patterns, broken links, config syntax | every slice |
| 1. Logic | one process, no I/O: unit tests, a seeded simulation step, golden output | milliseconds per test | logic and edge cases; regressions pinned from higher tiers | every slice, affected tests |
| 2. Headless | isolated processes, real filesystem/database, owned non-production provider data, `godot --headless`, Unreal automation with NullRHI | measure setup and runtime; network cost varies | process/provider contracts, save/load, config wiring | affected integration set before merge |
| 3. Rendered | a real browser engine; an engine scene with a display and injected input | seconds to tens of seconds; flake-prone | layout, real DOM and event timing, input handling | affected critical flows before merge |
| 4. Simulator | iOS Simulator, Android emulator | tens of seconds to minutes; boot cost; 1.4 to 1.9 GiB per Android system image | OS integration, lifecycle, permissions, platform APIs across versions | smoke before merge when platform code changed; matrix before release |
| 5. Device | physical hardware running the packaged build | minutes; scarce hardware or farm fees; often a human | real GPU, performance and memory, input feel and frame pacing, sensors, actual installation/update | release device checks; approved installed-update pilot after availability |

## What forces a climb

- **jsdom does no layout**: layout values read as zero. Layout needs tier 3.
- **Playwright's WebKit is not Safari**; it is closest when run on macOS.
- **Godot `--headless` renders nothing**, and gdUnit4 refuses to run input tests headless: injected
  input needs tier 3.
- **iOS Simulator runs Metal on the Mac's GPU** and never shows memory pressure or out-of-memory
  kills; rendering-engine and memory claims for iOS need tier 5.
- **Android Macrobenchmark refuses emulators**: performance needs tier 5.
- **Smoothness needs a cold shader cache** (Unreal `-clearPSODriverCache`; Godot driver caches).
- Input feel, frame pacing, camera, motion, thermals and install paths end at tier 5.

A deterministic simulation step (fixed timestep, seeded randomness) is tier 1 or 2 and answers
much of what would otherwise need tiers 4 and 5. Build that seam first; see `game-native-design`.

## Every time vs before merge

A check stays in the every-slice loop while it is fast (tiers 0 and 1 for the affected code within
about a minute), deterministic and local. Split or select the tests rather than skipping them.
Schedule expensive fidelity checks at the lifecycle gate their assertion requires. Diagnose
flakiness and preserve failures; quarantine only with an owner, ticket, residual risk and return
gate. A later stage is not a substitute for a critical check needed before merge. Move a check
back into the tight loop when it becomes cheap and deterministic. Device tests only nightly is
the anti-pattern Android names: run required release device checks before exposure.

| When | Run |
|---|---|
| Each logical change | complete cheap relevant suites and affected build/lint; use deterministic faults or clocks for edge cases at the selected seam |
| Pre-merge: before the push or branch merge that lands a ticket's code | declared pre-merge gate plus full affected feature/integration coverage; native UI/OS smoke only for boundaries changed |
| Frozen release | verify the exact signed artifact, runtime/config and provider target; run the simulator/device checks the release names before availability |
| Physical pilot, after availability and before wider exposure or installed-update retention claims | with approval, install the exact available artifact over the prior installation on physical hardware; observe the named retained state and relevant assistive technology/hardware/network boundary |

Stop dependent promotion when a lower-layer check fails. Preserve its first failure and
investigate before retrying. A later passing layer does not clear an earlier failure. Project
release authorization still governs availability and pilot exposure; this table grants none.

This is what the agent runs. A commit is a local save point, not a stage; a pre-push Git hook
enforces only a small, budgeted subset ([proposal 18](proposals/18-three-stage-verification.md)).

## Evidence and reuse

Record source/config/schema/toolchain/fixture identities, command, working directory, timestamp,
executed test/assertion count, outcome and exclusions; include the artifact hash for artifact
claims. Distinguish assertion failure, infrastructure error, timeout, skip, survivor and not run.
Zero executed tests is not a pass. Report the narrow claim observed, not the unrun next tier.

Reuse expensive evidence only when its relevant inputs are unchanged: identify the prior run,
compare those inputs and label the result **reused**. Rerun after a relevant change, failure or
uncertainty. Mutable provider audience/track/availability state needs fresh authoritative
read-back even if source and artifact hashes match. Keep numbered failed attempts until their
useful evidence is promoted and recovery no longer needs them. Related ownership stays in
tickets [98](../../.tickets/98-sync-tkt-skills-ahead-of-cli.md),
[104](../../.tickets/104-stateful-change-contracts.md), [105](../../.tickets/105-qualify-generated-oracles.md)
and [106](../../.tickets/106-release-verify-attempts.md): executable/pack identity, stateful contracts,
oracle qualification and release-attempt retention respectively.
Tickets [114](../../.tickets/114-portable-wrap-verification.md) and
[115](../../.tickets/115-preservation-evidence.md) own fail-stop orchestration and positive,
scoped preservation evidence; the ladder only chooses environments and cadence for those claims.

### Preservation claims need positive, matched observations

Service health and inventory success do not establish byte preservation. Before the operation,
select an explicit, nonempty fixture in the authorized root and record its expected paths and
coverage. Capture fresh before and after observations for that same selection. Bind each
observation to its source/configuration revision and manager version, the evaluated job and
authorized root; compare those context values against the operation's declared contract. List
each expected resource once with its path, the provider's documented resource identity and a
content checksum. Require
the before and after sets to match the selected coverage, the same identity for each path and
the same checksum, with at least one resource and positive aggregate bytes. Reject missing,
malformed or duplicate identities, an absent baseline, missing or out-of-scope paths, changed
identities or checksums, and zero-file or zero-byte totals. A legitimate empty file may be one
selected resource, but an empty-only sample has no positive byte coverage. Do not assume inode
semantics: state and check the identity contract the provider actually supplies. A healthy
service with a successful but empty inventory supports service-health/inventory claims only.

| Before/after observation | Supported claim |
|---|---|
| Service reports healthy; inventory succeeds but contains no selected resources or bytes | Service health and inventory completed; no preservation claim |
| Preflight selection or before observation is missing | No baseline; preservation not established |
| Selected coverage has zero resources or zero aggregate bytes | No positive preservation evidence |
| An observed path is missing, unexpected, under another root, or outside the selected scope | Scope/coverage mismatch; preservation not established |
| A selected path's provider identity changes between observations | Resource continuity is unverified; preservation not established |
| A selected path's checksum changes between observations | Content changed; preservation not established |
| Preselected nonempty fixture has positive bytes; both fresh observations cover the same authorized paths with unchanged provider identities and checksums | Preservation of those selected resources at those two observation times |

These are behavioral review scenarios, not evidence that a provider was contacted. Synthetic
fixtures can test the comparison at its actual host seam; keep their result separate from live
provider observations. Two snapshots show only the selected resources at those instants: they do
not prove continuous retention, staging exclusion, installed-device retention, erasure of every
copy or authority to delete. Preservation evidence grants no deletion or wider-scope authority.
Use the leftmost faithful environment for worker-only comparisons; simulator/device checks apply
only when the asserted boundary includes native OS behavior, hardware or an installed update.

## Worked assertion routes

These are planning examples, not evidence that the checks ran. Each escalation adds a claim.

| Assertion | Lowest faithful check | Added boundary and evidence limit |
|---|---|---|
| UTF-8 payload exceeds a byte limit; midnight changes eligibility | Actual serializer/model in its host runtime, with literal byte cases and injected clock | Provider acceptance is a separate integration assertion; no waiting for tomorrow or phone required for the model rule |
| Expired authorization is rejected | Actual authorization implementation with a controlled clock/token fixture | Critical even when cheap; live provider enforcement requires a real owned test identity |
| Lost DAV response, concurrent writers or shutdown leaves the right terminal state | Real client in isolated processes against an owned non-production DAV provider, deterministic response-loss/barrier faults | Host rule tests do not establish remote locking, response ambiguity or process termination behavior |
| Rollback restores the previous persisted state | Real installer/storage adapter and prior-format fixture in isolated process integration | OS secure-storage behavior needs native integration; actual installed-update retention still needs the pilot |
| Native control focus, permission dialog or OS storage binding works | Native UI/OS integration with a driver that can observe that surface | A browser mock cannot prove it; actual assistive technology/hardware claims need the relevant physical check |
| Update preserves an existing phone's stored state | Approved physical pilot of the available signed artifact over the old installation | Simulator success or provider track read-back cannot establish this claim; read-back separately proves audience/track/availability |

### Review the route before running it

- A JavaScript rewrite agrees with examples from a native parser: **insufficient** for the native
  parser claim. Execute that parser in its supported host runtime; use shared vectors as inputs.
- A simulator update keeps seeded records: **simulator integration only**. Keep the physical
  installed-update claim unverified until the approved pilot observes it.
- An unchanged signed artifact has last week's passing install result: **reuse only for matching
  installation inputs**, explicitly labelled; query mutable provider availability/audience again.

Platform cross-check (2026-11-02): [Android's strategy](https://developer.android.com/training/testing/fundamentals/strategies)
treats scope, fidelity, execution and cadence as separate choices, with release-candidate coverage.
[Flutter's testing guide](https://docs.flutter.dev/testing/overview) distinguishes unit, widget and
integration environments and explicitly limits native platform UI access in `integration_test`.
Check the selected driver's capabilities rather than treating any simulator test as native UI proof.
The assertion routes, evidence rules and pilot sequencing above are grey-matter's workflow choices.

## Projects declare their commands

The ladder runs only if a project names its commands. A project's `AGENTS.md` lists them by tier:
at least the single-test command, the `check` command (speed) or `gate.mjs` stages (stability), and the slow tier with the environment it needs.
`init-project` writes that list; `conformance-audit` reports its absence.

## Footprint

Tiers 3 to 5 cost the most disk: browser builds, simulator runtimes, system images, device builds.
They follow [repository-artifact-hygiene](../../skills/meta/repository-artifact-hygiene/SKILL.md#while-you-work):
keep one booted simulator or emulator across a ticket's slices and shut it down at close.

Not measured here: real run times of the Godot and Unreal tiers on these hosts; Xcode
DerivedData, simulator runtime and `xcresult` sizes (need a Mac); console certification rules.
