# Test-environment ladder

Answer each question in the **leftmost tier** that can observe it. Climb only when that tier
cannot. When a right-hand tier catches a bug, add a test in a left-hand tier that pins it. Report
the tier each claim was verified at; a tier you did not run is "not run", an outcome class, never
a pass.

Tiers are sized by the resources a test uses, after Google's small/medium/large sizes (prior art);
the browser, simulator and device rungs follow Android's testing-strategy table, which maps each
layer to an environment and a cadence (prior art). Sources: [test tiers and
cadence](research/test-tiers-and-cadence-20261031.md), [simulator vs
device](research/simulator-vs-device-testing-20261031.md), [agent prior
art](research/agent-test-tiering-prior-art-20261031.md). Decided in [proposal
16](proposals/16-agent-footprint-guardrails.md) (P7).

## Tiers

| Tier | Runs in | Cost | What only this tier catches | Default cadence |
|---|---|---|---|---|
| 0. Static | typecheck, lint, format, parse/import | seconds, no runtime | ill-typed code, banned patterns, broken links, config syntax | every slice |
| 1. Logic | one process, no I/O: unit tests, a seeded simulation step, golden output | milliseconds per test | logic and edge cases; regressions pinned from higher tiers | every slice, affected tests |
| 2. Headless | one machine: real filesystem, database, subprocess, `godot --headless`, Unreal automation with NullRHI | seconds per test | seam and contract errors, fakes that drift from the real thing, save/load, config wiring | affected set before commit; full set before merge |
| 3. Rendered | a real browser engine; an engine scene with a display and injected input | seconds to tens of seconds; flake-prone | layout, real DOM and event timing, input handling | affected critical flows before merge |
| 4. Simulator | iOS Simulator, Android emulator | tens of seconds to minutes; boot cost; 1.4 to 1.9 GiB per Android system image | OS integration, lifecycle, permissions, platform APIs across versions | smoke before merge when platform code changed; matrix before release |
| 5. Device | physical hardware, a device farm, a packaged build | minutes; scarce hardware or farm fees; often a human | real GPU, performance and memory, input feel and frame pacing, sensors, install and store builds | before release; on demand when no lower tier reproduces |

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
Move a check to before commit, merge or release when it is slow, flaky (Google's 2017 data: 25.5%
of Android emulator tests flaky, against 1.65% of all tests), costly, or needs fidelity a lower
tier lacks. Move it back once it is made deterministic. Device tests only nightly is the
anti-pattern Android names: run a device smoke before release, not only overnight.

| When | Run |
|---|---|
| Each slice | tiers 0 and 1 for the affected code |
| Before commit | up to tier 2 for the affected set, or the project's declared commit gate |
| Before merge | the full tier 0 to 2 suite; tier 3 critical flows; a tier 4 smoke when platform code changed |
| Before release | the tier 4 matrix and tier 5 checks the ticket or release names |

## Projects declare their commands

The ladder runs only if a project names its commands. A project's `AGENTS.md` lists them by tier:
at least the single-test command, the commit gate, and the slow tier with the environment it needs.
`init-project` writes that list; `conformance-audit` reports its absence.

## Footprint

Tiers 3 to 5 cost the most disk: browser builds, simulator runtimes, system images, device builds.
They follow [repository-artifact-hygiene](../../skills/meta/repository-artifact-hygiene/SKILL.md#while-you-work):
keep one booted simulator or emulator across a ticket's slices and shut it down at close.

Not measured here: real run times of the Godot and Unreal tiers on these hosts; Xcode
DerivedData, simulator runtime and `xcresult` sizes (need a Mac); console certification rules.
