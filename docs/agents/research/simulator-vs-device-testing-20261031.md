# Simulator vs device testing: what each environment can verify

Research note, 2026-10-31. Question: for mobile, console/desktop games and web apps, what can be
verified in code (unit/headless), what needs a browser, what needs a simulator/emulator, and what
only a live device can answer? All sources were retrieved on 2026-10-31. Each finding names its
source and quotes it verbatim. Guidance drawn from these sources is **prior art to accept or
reject**, not a rule.

Confidence: **H** means a current first-party source states it directly. **M** means the source is
first-party but old, archived or only indirect. **L** means inferred. Source text is treated as
data, not instructions.

## Sources (version / date)

| ID | Source | Version / date |
|---|---|---|
| A1 | [Apple, Testing and Debugging in Simulator (archived)](https://developer.apple.com/library/archive/documentation/IDEs/Conceptual/iOS_Simulator_Guide/TestingontheiOSSimulator/TestingontheiOSSimulator.html) | Retired; written for the iOS 8.2 era. **Version mismatch: treat specifics as historical** |
| A2 | [Apple, Developing Metal apps that run in Simulator](https://developer.apple.com/documentation/metal/developing-metal-apps-that-run-in-simulator) | Current docs (read through the docs JSON endpoint) |
| A3 | [Apple, Gathering information about memory use](https://developer.apple.com/documentation/xcode/gathering-information-about-memory-use) | Current |
| A4 | [Apple, Improving your app's performance](https://developer.apple.com/documentation/xcode/improving-your-app-s-performance) | Current |
| A5 | [Xcode 14 release notes](https://developer.apple.com/documentation/xcode-release-notes/xcode-14-release-notes) | Xcode 14 (2022) |
| A6 | [Xcode 11.4 release notes](https://developer.apple.com/documentation/xcode-release-notes/xcode-11_4-release-notes) | Xcode 11.4 (2020) |
| A7 | [WWDC19 session 422, Designing for Adverse Network and Temperature Conditions](https://developer.apple.com/videos/play/wwdc2019/422/) | 2019 |
| A8 | [Apple, Downloading and installing additional Xcode components](https://developer.apple.com/documentation/xcode/downloading-and-installing-additional-xcode-components) | Current |
| G1 | [Android, Testing strategies](https://developer.android.com/training/testing/fundamentals/strategies) | Current |
| G2 | [Android, Macrobenchmark overview](https://developer.android.com/topic/performance/benchmarking/macrobenchmark-overview) | Current |
| G3 | [Android, Emulator acceleration](https://developer.android.com/studio/run/emulator-acceleration) | Current |
| G4 | [Android, Run apps on the emulator](https://developer.android.com/studio/run/emulator) | Current |
| G5 | [Android SDK repository index, Play Store system images](https://dl.google.com/android/repository/sys-img/google_apis_playstore/sys-img2-3.xml) | Fetched 2026-10-31. **Observed bytes, not prose** |
| G6 | [Google Testing Blog, Where do our flaky tests come from?](https://testing.googleblog.com/2017/04/where-do-our-flaky-tests-come-from.html) | April 2017 |
| G7 | [Android, apksigner](https://developer.android.com/tools/apksigner) | Current |
| F1 | [Firebase Test Lab, Usage, quotas and pricing](https://firebase.google.com/docs/test-lab/usage-quotas-pricing) | Current. **The page says Test Lab shuts down on 2027-09-30** |
| W1 | [AWS Device Farm pricing](https://aws.amazon.com/device-farm/pricing/) | Current |
| P1 | [Playwright browsers.md](https://raw.githubusercontent.com/microsoft/playwright/main/docs/src/browsers.md) ([rendered](https://playwright.dev/docs/browsers)) | main branch, 1.65.0-next |
| P2 | [Playwright, Retries](https://playwright.dev/docs/test-retries) | Current |
| P3 | [Playwright, Emulation](https://playwright.dev/docs/emulation) | Current |
| J1 | [jsdom README](https://github.com/jsdom/jsdom/blob/main/README.md) | 30.1.3 |
| J2 | [happy-dom README](https://github.com/capricorn86/happy-dom/blob/master/README.md) | master |
| D1 | [Godot, Command line tutorial](https://docs.godotengine.org/en/stable/tutorials/editor/command_line_tutorial.html) | stable |
| D2 | [Godot main.cpp](https://github.com/godotengine/godot/blob/4.5-stable/main/main.cpp) and [display_server_headless.h](https://github.com/godotengine/godot/blob/4.5-stable/servers/display_server_headless.h) | 4.5-stable |
| D3 | [Godot, Reducing stutter from shader (pipeline) compilations](https://docs.godotengine.org/en/stable/tutorials/performance/pipeline_compilations.html) | stable (4.4 or later) |
| D4 | [GUT, Command line](https://gut.readthedocs.io/en/latest/Command-Line.html) | latest |
| D5 | [gdUnit4, GdUnitTestCIRunner.gd](https://github.com/godot-gdunit-labs/gdUnit4/blob/master/addons/gdUnit4/src/core/runners/GdUnitTestCIRunner.gd) | master @956bbff |
| D6 | [gdUnit4 PR #252](https://github.com/MikeSchulze/gdUnit4/pull/252) | September 2023 |
| U1 | [Unreal, Automation Test Framework](https://dev.epicgames.com/documentation/en-us/unreal-engine/automation-test-framework-in-unreal-engine) | UE5 current |
| U2 | [Unreal, Run Automation Tests](https://dev.epicgames.com/documentation/en-us/unreal-engine/run-automation-tests-in-unreal-engine) | UE5 current |
| U3 | [Unreal, Gauntlet overview](https://dev.epicgames.com/documentation/en-us/unreal-engine/gauntlet-automation-framework-in-unreal-engine) and [Running Gauntlet tests](https://dev.epicgames.com/documentation/en-us/unreal-engine/running-gauntlet-tests-in-unreal-engine) | UE5 current |
| U4 | [Unreal, Screenshot Comparison Tool](https://dev.epicgames.com/documentation/en-us/unreal-engine/screenshot-comparison-tool-in-unreal-engine) | UE5 current |
| U5 | [Unreal, PSO Precaching](https://dev.epicgames.com/documentation/en-us/unreal-engine/pso-precaching-for-unreal-engine) | UE5 current |
| U6 | [Unreal API, FApp::CanEverRender](https://dev.epicgames.com/documentation/en-us/unreal-engine/API/Runtime/Core/FApp/CanEverRender) | UE5 current |

## 1. Known simulator and emulator gaps

### Apple Simulator
- **GPU / Metal (H, A2).** Simulator maps Metal calls onto the Mac's GPU. It does not emulate the
  device GPU: "Simulator doesn't try to exactly simulate the GPU ... Simulator translates any calls
  you make and directs them to the selected GPU on the host Mac." Its feature level is "similar to an
  Apple family 2 GPU". Apple also says: "Don't use Simulator to design your iOS, tvOS, or visionOS
  rendering engine." Specific gaps:
  - "Simulator doesn't support programmable blending."
  - "Don't create constant buffers larger than 64 kilobytes."
  - "Don't write to sRGB textures in Simulator."
  - "Simulator doesn't support separate depth and stencil formats."
- **Performance profiling (H, A2, A4).** "You can't use Xcode to analyze the memory footprint or
  measure performance when running in Simulator" (A2). "You get higher-fidelity measurements by
  profiling on a device instead of the simulator" (A4). Apple's older guide adds that Simulator UI
  "may appear to run both faster and smoother than on a device" (A1, M).
- **Memory limits (H, A3).** Simulator never shows memory pressure: "the memory gauge always stays in
  the green (safe) region because macOS doesn't issue memory warnings or out-of-memory terminations
  ... memory use in the green region of the gauge in the simulator doesn't necessarily mean that
  your app's memory use is within safe limits."
- **Thermals (M, A7).** Xcode can force a thermal-state floor on a connected device: "have your
  device reach different thermal states without it needing to be physically warm". The condition
  "does not fix your thermal state, but it rather acts like a floor". Whether Simulator supports this
  is **unverified** (see the last section).
- **Sensors and camera (M, A1, historical).** As of iOS 8.2, these were not simulated: "Motion
  support (accelerometer and gyroscope)", "Audio and video input (camera and microphone)", "Proximity
  sensor", "Barometer", "Ambient light sensor". No current Apple page restating the list was found.
- **Push notifications (H, A5, A6).** This gap has narrowed. Since Xcode 11.4, local injection works:
  "Simulator supports simulating remote push notifications, including background content fetch
  notifications" (A6), but "Notification Service Extensions do not work in simulated push
  notifications" (A6). Since Xcode 14: "Simulator now supports remote notifications in iOS 16 when
  running in macOS 13 on Mac computers with Apple silicon or T2 processors. Simulator supports the
  Apple Push Notification Service Sandbox environment" (A5). The production APNs path still needs a
  device (L).
- **Background execution and frameworks (M, A1, historical).** The Simulator APIs did not offer "The
  `UIBackgroundModes` key", "Handoff support", or "Privacy alerts for access to Photos, Contacts,
  Calendar, and Reminders". Several frameworks were unsupported (External Accessory, Media Player,
  Message UI). Re-check these on the current Xcode before relying on them.

### Android emulator
- **Capability (H, G4).** "The emulator provides almost all the capabilities of a real Android device
  ... simulate rotation and other hardware sensors". Google says "In most cases, the emulator is the
  best option for your testing needs." No current Google page lists the emulator-vs-device gaps.
- **Performance numbers (H, G2).** "We discourage running the benchmarks on an emulator, as they don't
  produce performance numbers representative of the end-user experience." Macrobenchmark "returns
  errors when attempting to measure an emulator".
- **Graphics (H, G3).** Rendering runs through the host GPU or a software backend (`host`,
  `swiftshader`): "If you enable a graphics acceleration option that your computer doesn't support,
  you are likely to see crashes or incorrect images". The emulator's GPU is the host's, not the
  device's. That it therefore says nothing about device GPU behaviour is inference (L).
- **CI hosting (H, G3).** "You can't run a VM-accelerated emulator inside another VM, such as a VM
  hosted by VirtualBox, VMWare, or Docker."

## 2. Game engines: headless vs GPU, display and input

- **Godot `--headless` is a no-render, no-audio mode (H, D1, D2).** It expands to "`--display-driver
  headless --audio-driver Dummy`. Useful for servers and with `--script`" (D1). The source comment
  reads "enable headless mode (no audio, no rendering)", and the headless display server calls
  `RasterizerDummy::make_current()` (D2). For exports, `--headless` is "required on platforms that do
  not have GPU access", for example CI (D1). So logic, state, saves, signals and scene-tree tests run
  in headless mode. Nothing that depends on pixels does.
- **gdUnit4 refuses headless mode by default because input is not delivered (H, D5).** "By default,
  running GdUnit4 in headless mode is not allowed." With `--ignoreHeadlessMode` it warns: "tests that
  use UI interaction do not work correctly in headless mode. Godot 'InputEvents' are not transported
  by the Godot engine in headless mode and therefore have no effect in the test!" In 2023 the
  maintainer said "running test with --headless mode is actually not supported" (D6, M, older).
- **GUT (M, D4).** The CLI is `godot -d -s --path "$PWD" addons/gut/gut_cmdln.gd`. It returns "`0` ...
  if all tests pass" and "`1` ... if any fail". GUT's docs say nothing about headless mode, a display
  or a GPU. Headless GUT runs are **unverified** here.
- **Unreal automation (H, U1, U2).** Test types are Unit, Feature ("verify such things as PIE, in-game
  stats, and changing resolution"), Smoke ("considered a speed promise"), Content Stress ("loading all
  maps or compiling all Blueprints") and Screenshot Comparison (U1). CLI form:
  `-ExecCmds="Automation RunTest Test1+Test2;Quit"`, with `-ReportExportPath` for JSON output (U2).
  The Null RHI is the no-render path: "Certain application types never render, while for others this
  behavior may be controlled by switching to NullRHI ... servers or games running in headless mode
  (e.g. automated tests)" (U6). The `-nullrhi` flag itself was not found in the official arguments
  reference (see the last section).
- **Unreal Gauntlet targets real platforms (H, U3).** "Gauntlet is a framework to run sessions of
  projects in Unreal Engine that perform tests and validate results ... designed for ... running
  Unreal sessions on a variety of platforms", for example "four clients and a server".
  `UE.TargetAutomation` "Runs Engine Automation Test Framework on Editor and Client". Console and
  mobile deployment needs per-platform device interfaces: "Gauntlet can only deploy console and
  mobile device builds if you implement the corresponding `ITargetDevice`, `IDeviceFactory` ...".
- **Rendering correctness needs a GPU, and results vary by platform and driver (H, U4).** Screenshots
  are bucketed "based on Platform_RHI_ShaderModel". "Occasionally, two images can both be correct",
  because of small differences "in hardware or driver". The default tolerance is Low "because there's
  some constant variability in every pixel's color."
- **Shader-compile stutter only shows on cold caches and target hardware (H, D3, U5).** In Godot,
  pipeline compilation "is dependent on the GPU driver and the hardware". Users may hit stutters "you
  might be unable to experience them yourself without deleting your driver cache or testing on a
  weaker system" (D3). In Unreal: "Use the `-clearPSODriverCache` switch consistently for all test
  runs that assess the smoothness of your game. Without it, hitches may be masked by the PSO cache"
  (U5). Epic also suggests "limiting the core count to 8 ... to more accurately replicate the final
  user experience" (U5).
- **Feel, frame pacing and input latency (L).** No source found gives an automated way to measure
  game feel or input latency. They follow from the points above: input is not delivered in headless
  mode (D5), and simulator/emulator timing is not representative (A4, G2). So they need real display
  and input hardware, and often a human. That they need a human is **inference**.

## 3. Browser tier

- **jsdom does no layout or rendering (H, J1).** "jsdom still does not do any layout or rendering".
  Unimplemented "Layout ... impacts methods like `getBoundingClientRects()` or properties like
  `offsetTop`". It returns "zeros for many layout-related properties". Without the `canvas` package,
  "`<canvas>` elements will behave like `<div>`s".
- **happy-dom (M, J2)** is "A JavaScript implementation of a web browser without its graphical user
  interface." Its README makes no layout claim. That it shares jsdom's layout gap is **unverified**.
- **Headless vs headed Playwright (H, P1).** "Playwright ships a regular Chromium build for headed
  operations and a separate chromium headless shell for headless mode." Chrome and Edge's new headless
  mode is "closer to a regular headed mode. This differs from chromium headless shell ... so expect
  different behavior in some cases." New Headless "is the real Chrome browser, and is thus more
  authentic, reliable".
- **WebKit is not Safari (H, P1).** "Playwright doesn't work with the branded version of Safari since
  it relies on patches." Also: "available media codecs vary substantially between Linux, macOS and
  Windows. While running WebKit on Linux CI is usually the most affordable option, for the
  closest-to-Safari experience you should run WebKit on mac".
- **Device emulation is browser settings, not a device (H, P3).** Playwright "will simulate the
  browser behavior such as" user agent, screen size, viewport and touch. Real mobile Safari or Chrome
  on a phone is a device-tier check (L).

## 4. Cost of each environment

- **Disk (observed and documented).**
  - Playwright browsers "will take a few hundred megabytes", about 281M for Chromium, 187M for
    Firefox and 180M for WebKit (P1, H).
  - Android Studio needs "16 GB disk space" (G4, H).
  - One Play Store system image is a **1.4 to 1.9 GiB compressed download**. Examples:
    `android-34;google_apis_playstore;x86_64` is 1441 MiB, `android-35;...;x86_64` is 1680 MiB and
    `android-36;...;x86_64` is 1836 MiB (G5, measured from the `<size>` fields in the repository
    index). The extracted size and AVD data are larger but were not measured.
  - Apple documents no sizes for simulator runtimes, DerivedData or xcresult bundles. Xcode's
    Components settings only show "the amount of storage you can recover", and the default is to
    download "an Apple silicon variant to save disk space" (A8). **Sizes unverified.**
- **Flakiness (H, G6, 2017).** Across Google's tests: "All tests 1.65%" flaky, "Java WebDriver
  10.45%", "Python WebDriver 18.72%", "Android emulator 25.46%". "There's virtually no correlation
  between binary size and flakiness for Android emulator tests." Playwright classes a test as
  "Flaky" when it "failed on the first run, but passed when retried", and "By default failing tests
  are not retried" (P2).
- **Device-farm prices (H).**
  - Firebase Test Lab: "$5 per hour for each physical device" and "$1 per hour for each virtual
    device", billed "per-minute basis, rounded up". The Spark plan allows "10 test runs per day on
    virtual devices" and "5 test runs per day on physical devices" (F1). **Deprecated: shuts down
    2027-09-30**, with Google Cloud's Developer Device Platform named as the replacement (F1).
  - AWS Device Farm: "$0.17 / DEVICE MINUTE", unmetered slots at "$250.00 per slot per month",
    private devices "STARTS AT $200/MONTH", desktop browsers "$0.005 / instance minute", and "a
    one-time free trial of 1,000 device minutes" (W1).
- **Wall time.** No first-party source gives comparable timings across tiers. Google states the
  trade-off only qualitatively: "Small tests ... fast and reliable. Big tests ... have more fidelity"
  (G1). **Unverified as numbers.**

## 5. Prior art for "test leftmost first"

- **Google/Android is the clearest documented example (H, G1).** It is prior art; grey-matter can
  adopt or reject it. Tiers by environment and trigger:

  | Tier | Where | When |
  |---|---|---|
  | Unit, Component | Local (JVM) | Every commit |
  | Feature | "Local and emulators" | "Pre-merge" |
  | Application | "Local, emulators, 1 phone, 1 foldable" | "Post-merge" |
  | Release Candidate | "8 different phones, 1 foldable, 1 tablet", "Minified release build" | "Pre-release" |

  Google also says: "Release Candidate tests run nightly on a phone, foldable and tablet" and "Most
  apps should have many small tests and relatively few big tests".
- **Apple (H/M, A2, A4).** "Use Simulator to rapidly prototype and test application behavior ... test
  on real devices to tune its performance" (A2). For games, Simulator is fine where "you only care
  about how the game plays, not whether the pixels match what renders on device" (A2). Profiling
  belongs on a device (A4).
- **Epic (H, U1, U3, U5).** Fast in-process automation runs first (Smoke tests should finish quickly
  per U1). Gauntlet runs packaged builds on target platforms (U3). Smoothness checks run on cold
  caches with consumer-like core counts (U5).
- **Console certification.** Platform holders' requirements (Sony TRC, Xbox XR, Nintendo lotcheck)
  are under NDA. No public primary source was found. **Unverified.**

## Synthesis: cheapest environment per check

This table is a synthesis of the findings above (prior art, not a rule). `*` marks an inferred or
unverified cell.

| Check | Cheapest environment that can answer it | Cadence | Basis |
|---|---|---|---|
| Logic (rules, math, parsing) | Code: unit tests; Godot `--headless`; Unreal unit/automation with NullRHI | Every time | D1, D2, U1, U6, G1 |
| State / save / load | Code: headless engine or JVM tests (real file I/O) | Every time | D2, G1. Device storage quirks `*` |
| UI layout (web) | Real browser engine. Headless Chromium for the common case; WebKit on macOS for Safari fidelity. **Not jsdom** | Every time (one engine); before merge (cross-engine) | J1, P1 |
| UI layout (native mobile / game UI) | Simulator or emulator. In Godot, a display is needed when the test injects input | Before merge | A2, G1, D5 |
| Rendering / GPU correctness | GPU host with screenshot comparison per platform/RHI; **target device for mobile Metal** | Before merge (desktop); before release (device) | A2, U4 |
| Performance (frame time, memory, launch) | **Live device** (an emulator is refused by Macrobenchmark; Simulator has no memory pressure); cold PSO/driver cache | Before release, or nightly | A2, A3, A4, G2, D3, U5 |
| Input feel / latency / frame pacing | **Live device with real display and input, plus a human** `*` | Before release / milestone | D5 (no input in headless); otherwise `*` |
| Sensors / hardware (camera, motion, thermal, push via production APNs) | Emulator for sensor injection (Android); **live device** for camera, motion, thermal and production push on iOS | Before release | G4, A1 (historical), A5, A7 |
| Store / signing / install | Code for signature checks (`apksigner verify`); **device or farm** for install and upgrade paths; console cert is NDA `*` | Before release | G7, F1, W1 |

## Couldn't verify (what was tried)

- **Current Apple list of Simulator hardware gaps.** The live Xcode pages tried returned 404 through
  the docs JSON endpoint: `testing-in-simulator-versus-testing-on-hardware-devices`,
  `running-your-app-in-simulator-or-on-a-device`, `devices-and-simulator`. Only the retired A1 has
  the sensor/camera/background list.
- **Whether Simulator supports thermal device conditions.** The A7 transcript only refers to "your
  device".
- **Sizes of Xcode DerivedData, simulator runtimes and xcresult bundles.** No Apple doc gives
  figures (A8). Measuring them needs a Mac, which this Linux host is not.
- **An official Android emulator-vs-device gap list.** G4 and the Test Lab devices page only cover
  capability and capacity.
- **Unreal `-nullrhi` in the official command-line arguments reference.** Only U6 and API pages were
  found. U2 does not list it.
- **GUT headless behaviour.** D4 is silent. Whether happy-dom does layout: J2 is silent.
- **Console certification requirements** (NDA). **Studio write-ups** on device reservation beyond
  Epic's docs were not searched in depth.
- **Comparable wall-time figures across tiers.** None found in first-party sources.
