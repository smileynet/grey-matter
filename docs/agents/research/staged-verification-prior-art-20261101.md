# Staged verification: prior art for pre-push, pre-merge, pre-release (verified 2026-11-01)

Question: what does prior art say about splitting verification into three stages, pre-push (most
critical), pre-merge (important) and pre-release (end to end, with simulators and devices), and
what belongs in each? Input to [proposal 18](../proposals/18-three-stage-verification.md).

Not repeated here (already cited): Google test sizes, presubmit "only fast, reliable" tests, TAP
batching, Fowler's commit build and ten-minute build, the Android strategy table, GitHub merge
queue mechanics, Bazel `flaky`, Google flake rates. See
[test tiers and cadence](test-tiers-and-cadence-20261031.md),
[agent test tiering](agent-test-tiering-prior-art-20261031.md) and the
[test-environment ladder](../test-environment-ladder.md).

Method: primary sources only, all read 2026-11-01. **[byte]** means the snippet was checked as an
exact substring of the page fetched with curl (HTML stripped, whitespace collapsed) or of the raw
source file. Confidence: **high** = byte-checked first-party text; **medium** = first-party but
indirect, inferred, or read from source code rather than docs. Terms follow GLOSSARY "Verification
terms": a source's bare "hook" is marked [Git hook] or [agent hook]. All findings below are about
**Git hooks**; none is about agent hooks. Prior art, not authority.

## Sources (version / date)

| ID | Source | Version / date |
|---|---|---|
| G1 | [githooks](https://git-scm.com/docs/githooks) | page "last updated in 2.54.0" (2026-04-20) |
| G2 | [git-push](https://git-scm.com/docs/git-push) | live |
| P1 | [pre-commit.com](https://pre-commit.com/) | live; mentions Git 2.54 config-based Git hooks |
| P2 | [pre-commit `hook_impl.py`](https://github.com/pre-commit/pre-commit/blob/main/pre_commit/commands/hook_impl.py) | main, last commit `2e01c999b2`. **Source code, not docs** |
| L1 | lefthook docs source: [`run.md`](https://github.com/evilmartians/lefthook/blob/master/docs/configuration/run.md), [`use_stdin.md`](https://github.com/evilmartians/lefthook/blob/master/docs/configuration/use_stdin.md), [`files.md`](https://github.com/evilmartians/lefthook/blob/master/docs/configuration/files.md), [`skip.md`](https://github.com/evilmartians/lefthook/blob/master/docs/configuration/skip.md), [`LEFTHOOK.md`](https://github.com/evilmartians/lefthook/blob/master/docs/usage/envs/LEFTHOOK.md) | master. lefthook.dev subpages returned 404 |
| H1 | [husky how-to](https://typicode.github.io/husky/how-to.html) | live |
| S1 | [lint-staged README](https://github.com/lint-staged/lint-staged) | main |
| T1 | Thoughtworks, Matt Riley, [Pre-commit: Don't git hooked!](https://www.thoughtworks.com/en-us/insights/blog/pre-commit-don-t-git-hooked) | 2020-01-13 |
| B1 | trunkbaseddevelopment.com: [CI](https://trunkbaseddevelopment.com/continuous-integration/), [Committing straight to the trunk](https://trunkbaseddevelopment.com/committing-straight-to-the-trunk/), [Fast, Green Builds](https://trunkbaseddevelopment.com/fast-green-builds/) | site repo last commit 2026-10-26 (footer still says 2017-2020) |
| W1 | [SWE at Google ch. 23, CI](https://abseil.io/resources/swe-book/html/ch23.html) | 2020 |
| C1 | [Chromium CQ](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/infra/cq.md) | HEAD |
| F1 | Fowler, [DeploymentPipeline](https://martinfowler.com/bliki/DeploymentPipeline.html); [Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html) | bliki; CI rev. 2024-01-18 |
| A1 | Android, [Testing strategies](https://developer.android.com/training/testing/fundamentals/strategies) | updated 2026-10-08 |
| A2 | Play Console, [pre-launch report](https://support.google.com/googleplay/android-developer/answer/9842757?hl=en); [testing tracks](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en) | live |
| I1 | Apple, [TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview); [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) | live |
| V1 | Valve, [Steam Deck/Machine compatibility](https://partner.steamgames.com/doc/steamdeck/compat); [Review process](https://partner.steamgames.com/doc/store/review_process) | live |
| X1 | Microsoft, [XR-001 Title Stability](https://devdocs.xbox.com/publishing/certification/xr/xr-001) | "Version 5.0, 11/01/2025" |
| R1 | Google SRE book, [Reliable Product Launches](https://sre.google/sre-book/reliable-product-launches/) | 2016 |
| N1 | [Node test runner](https://nodejs.org/api/test.html); [GitHub Actions workflow syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions); [Bazel test encyclopedia](https://bazel.build/reference/test-encyclopedia) | live |

## 1. Git hooks: what goes in pre-commit vs pre-push

- **pre-push gets the pushed refs on stdin, and can block the whole push.** "Information about
  what is to be pushed is provided on the hook's [Git hook's] standard input with lines of the form:
  <local-ref> SP <local-object-name> SP <remote-ref> SP <remote-object-name> LF" [byte, G1]. "If
  the foreign ref does not yet exist the <remote-object-name> will be the all-zeroes object name.
  If a ref is to be deleted, the <local-ref> will be supplied as ( delete )" [byte, G1]. "If this
  hook [Git hook] exits with a non-zero status, git push will abort without pushing anything"
  [byte, G1]. High. Consequence for `gate.mjs`: a new branch has no remote base to diff against,
  a delete has nothing to check, and one push can carry several refs.
- **How pre-commit resolves that (prior art).** It diffs `remote_sha..local_sha` when the remote
  object exists locally; otherwise it runs `git rev-list <local_sha> --topo-order --reverse --not
  --remotes=<remote>` ("ancestors not found in remote") and skips deletions [byte, P2 source]. It
  `return`s on the first qualifying stdin line, so a multi-ref push is judged on its first ref
  only (read from source, P2). Medium: behaviour of code, not a documented contract.
- **lefthook's `{push_files}` is not the stdin refs.** It is "files that are committed but not
  pushed" [byte, L1 run.md]. A script that reads stdin needs `use_stdin: true`: "Without this
  option lefthook will hang: lefthook uses pseudo TTY by default, and it doesn't close stdin when
  all data is read" [byte, L1 use_stdin.md]. Only one command receives the data. High. A
  documented hang mode for exactly the step proposal 18 adds.
- **Scope by changed files is the default design of every manager.** pre-commit: "usually
  pre-commit will only run on the changed files during git hooks [Git hooks]" (P1, fetch-tool
  quote; medium) and it offers `pre-commit run --from-ref ... --to-ref ...`, "run against the files
  changed between FROM_REF...TO_REF in git" [byte, P1]. lint-staged's reason to exist: "running a
  task on a whole project can be slow, and opinionated tasks such as linting can sometimes produce
  irrelevant results. Ultimately you only want to check files that will be committed" [byte, S1].
  lint-staged rejects whole-project tools: "You should not use ng lint through lint-staged,
  because it's designed to lint an entire project" (S1, fetch-tool quote; medium). lefthook
  `files`: "If the result of this command is empty, the execution of commands will be skipped"
  [byte, L1 files.md]. High.
- **Which Git hook for which check: sources barely say.** pre-commit suggests a linter or
  formatter set `stages: [pre-commit, pre-merge-commit, pre-push, manual]` [byte, P1]; lefthook's
  home page says only "Run linters on pre-commit hook [Git hook]" (fetch-tool, medium); husky's
  only example is `npm test` in pre-commit (H1, fetch-tool, medium). lefthook's own example puts
  `yarn test` in pre-push with an env skip [byte, L1 examples/skip.md]. No manager publishes a
  time budget. Medium (absence across four docs).
- **An on-demand stage exists in pre-commit.** "The manual stage (via stages: [manual]) is a
  special stage which will not be automatically triggered by any git hook [Git hook] -- this is
  useful if you want to add a tool which is not automatically run, but is run on demand" [byte,
  P1]. High. This is the shape of proposal 18's pre-merge and pre-release: same runner, no Git hook.

### Speed budgets and bypass (the documented anti-pattern)

- **Every Git hook is bypassable, completely.** pre-push: "With --no-verify , the hook [Git hook]
  is bypassed completely" [byte, G2]. Managers add their own off switches: husky `HUSKY=0`
  "Temporarily disables all Git hooks" [byte, H1]; "Use LEFTHOOK=0 git ... or LEFTHOOK=false git
  ... to disable lefthook" [byte, L1]. High.
- **Per-check skip beats whole-Git-hook bypass (pre-commit).** "The SKIP environment variable is a
  comma separated list of hook ids", so you can skip one rather than "--no-verify ing the entire
  commit" (P1, fetch-tool quote around the byte-checked first phrase). Medium-high.
- **Thoughtworks names the slow-Git-hook anti-pattern.** "The pre-commit experience needs to be
  fast and frictionless to encourage the behaviours needed to achieve Continuous Integration"
  [byte]; "Make the quality checks really fast. Like 10 seconds fast!" [byte]; "It's great to have
  the ability to run the entire pipeline locally, but avoid enforcing it to be run during
  pre-commit" [byte]; "you could just bypass the hooks [Git hooks] altogether with --no-verify"
  [byte]. Its conclusion prefers discipline: "Rather than focusing effort into guardrails to
  prevent developers doing the "wrong thing", focus on building discipline" [byte]. T1, 2020.
  High (one org's opinion piece, not data).
- **No primary source measures bypass rates.** Search found only practitioner posts (Medium,
  personal blogs) claiming slow Git hooks drive `--no-verify`. Not cited.

## 2. Pre-merge without pull requests (trunk-based)

- **On trunk, the local build before push is the gate.** "Locally, before the commit/push is the
  gate. Developers determine for themselves that their change is good" [byte, B1 Fast, Green
  Builds]. "Remotely, in CI, after the push or before it lands in the trunk ... is the check that
  catches what the local build could not: bad timing, environment differences, and semantic
  clashes" [byte]. "Neither is a crutch for the other" [byte]. High. So for a direct-to-trunk repo
  the push *is* the merge, and "pre-merge" has to happen before the push that lands the work.
- **Small teams may push straight to trunk** "because they are a small team with each team member
  knowing what the others are up to. Their build is probably fast and relatively exhaustive"; if
  it breaks "they most likely 'revert' the commit straight away" [byte, B1 Committing straight].
  "Committing/pushing directly to the shared trunk may be fine for teams with only a few commits a
  day" [byte, B1 CI]. Budget: "Fast is say one minute, and slow is ten or above" [byte]. High.
- **TBD's tiering, newly written with agents in mind** (2026-10 commits): "A smoke tier before the
  push, the full-stack suite in CI, and longer tiers on a schedule: Non-functional tests
  (performance, soak, security scanning) usually belong in later pipeline phases" [byte]. It names
  the agent trap: "git push followed by watching the CI run, in a loop, is a very natural agent
  workflow, and an expensive one" [byte]. "A check that truly cannot run before the push still has
  a place. It belongs in an automated pull-request or merge queue job" [byte]. High.
- **Many agents on one trunk end in a commit queue.** "Twenty agents push far more often, and
  Git's "pull before you push" rule becomes a race that the slowest local build keeps losing. At
  that rate you end up where Google and Facebook ended up: a commit queue (or merge queue)" [byte,
  B1 Committing straight]. Review "has three places to go": before the commit, after it
  ("continuous review"), or at integration [byte, phrase]. High.
- **Small repos can serialize instead of queueing.** "CI systems for smaller repositories or
  projects can avoid this problem by serializing submits so that there is no difference between
  what is about to enter and what just did" [byte, W1]. High.
- **Chromium CQ: what earns a pre-merge slot.** "Median cycle time needs to be under 40 minutes for
  trybots" [byte]. "If a configuration only fails once every couple of weeks on the waterfalls,
  then it's probably not worth adding it to the commit queue" [byte]. Some tests run only
  post-submit because "the tests are too slow or too expensive or there is insufficient capacity"
  [byte], with an opt-in footer `Include-Ci-Only-Tests` and a "Mega CQ" that "aims to catch nearly
  all regressions regardless of cycle time" for "particularly risky CLs" [byte]. A dry-run mode
  "is intended to be used as a CL is developed" [byte]. C1. High.
- **Later stages feed earlier ones.** "As much as possible we want to ensure that any later-stage
  failure leads to new tests in the commit build" [byte, F1 CI]. Pipeline stages give "increasing
  confidence, usually at the cost of extra time" and "may include manual checks" [byte, F1
  DeploymentPipeline]. High.

## 3. Pre-release: release candidate, devices, store review

- **Rerun the full suite on the release candidate even if it passed before** (Google): "As a
  sanity check ... For auditability ... To allow for cherry picks" [byte, W1, headings]. "It's
  common to include some manual QA testing of the RC in shared environments, too" [byte]. High.
- **Android: release candidate means the minified build on a device matrix.** "A release candidate
  test verifies the functionality of a release build ... the application binary is minified and
  optimized" [byte, A1]. Its worked example: "Release Candidate 8 different phones, 1 foldable, 1
  tablet Pre-release" and "Release Candidate tests run nightly on a phone, foldable and tablet.
  Before a release, Release Candidate tests run on a large number of devices" [byte]. Moving tests
  later "might decrease CI build and test times, but you could also prolong the feedback loop"
  [byte]. High.
- **Store-side automated device runs exist but are capacity-bound.** Google Play: "we install it on
  a set of Android devices in our test lab. We then automatically launch and crawl your app for
  several minutes" [byte]; reports are generated "subject to capacity within our device lab"
  [byte]. Internal testing reaches "up to 100 testers" [byte]. A2. High. So a store pre-launch
  report can be absent; it is a "not run", not a pass.
- **Apple: on-device testing before submission is a review rule.** "Make sure your app has been
  tested on-device for bugs and stability before you submit it, and include demo account info (and
  turn on your back-end service!)" [byte, I1 guideline 2.1]. TestFlight: internal testers "up to
  100", external "up to 10,000"; "When you add the first build of your app to a group, the build
  gets sent to App Review ... A review is required only for the first build"; a build is testable
  "for up to 90 days" [byte, I1]. High.
- **Games: platform checklists are concrete, device-level and partly public.** Steam Deck/Machine
  "Verified" needs default controller access to all content, matching glyphs, controller text
  input, and "a playable framerate. On Steam Deck, this is 30fps at 800p" [byte, V1]. A title
  without results shows "Unknown: This game has not completed the compatibility review process"
  [byte, phrase]. Steam store review is once: "Once your game has been reviewed and approved, there
  is no need to go through review again" [byte, V1]. Xbox XR-001 test steps include navigating
  "Gameplay", "Menus and features", DLC, then repeating with "a new XBOX profile with no previous
  save data ... while disconnected from the XBOX network"; fails include "A non-interactive pause
  or static screen is presented lasting over twenty seconds" [byte, X1]. High. These are ready
  candidates for a game consumer's tier 5 release checklist.
- **Checklists are a launch tool at Google.** The launch checklist "helps an LCE assess the launch
  and provides the launching team with action items" [byte, R1]; staged rollouts start with
  "canaries" [byte]. High, but service-oriented; for store apps the staged-rollout analogue is
  testing tracks.

## 4. Flaky tests and timeouts by stage

- **Unreliable tests leave the early stage** (Google): "we don't want to run unreliable tests on
  presubmit" (already cited); for large tests, "allow large-scoped tests to be unreliable on
  presubmit but disable them aggressively when they start failing" [byte, W1]. TBD: "Flaky tests
  should be fixed or quarantined quickly, so the build is always green unless there is a genuine
  issue" [byte, B1]. High.
- **Chromium retries, then compares without the patch.** A failing shard is retried in the same
  configuration, then rerun "(without patch)"; the CL fails only on tests that failed twice with
  the patch "but passed in '(without patch)'" [byte]. "Since the CQ has roughly ~20,000 unique
  flaky tests, without retries, pretty much no CL would ever pass the CQ" [byte]. Retries raise the
  chance a flaky test lands "sublinearly" but cut its harm to others "exponentially" [byte]. C1.
  High. Viable at Chromium scale; for a small suite, quarantine is cheaper than retry machinery
  (inference, medium).
- **Default timeouts do not protect you.** Node test runner `timeout` "Default: Infinity" [byte];
  GitHub Actions job `timeout-minutes` "Default: 360" [byte]. Bazel instead implies a timeout from
  size ("small short", 60 s ... "eternal" 3600 s) [byte, flattened table]. N1. High. A per-check
  timeout must be set explicitly, as proposal 18 rule 4 does.

## 5. Synthesis (grey-matter reading, not a citation)

| Stage | Prior art's consensus | Where sources disagree |
|---|---|---|
| Pre-push (Git hook) | Changed files only; seconds; cheap static checks; bypassable, so never the only guard | Thoughtworks: avoid enforcing much at all (10 s, discipline over guardrails). TBD: the whole fast build (~1 min) is the pre-push gate, run by the developer, not necessarily a Git hook. Pocock's setup-pre-commit runs full tests (prior art, already cited) |
| Pre-merge | The developer's (agent's) local build of the affected area, before the change becomes visible on trunk; admission by catch rate and cycle time; opt-in "mega" run for risky changes | Android puts device feature tests pre-merge and calls nightly-only device runs an anti-pattern; Google and TBD keep presubmit lean and push non-functional tests later. Budgets span 1 min (TBD fast) to 10 min (Fowler) to 40 min median (Chromium) |
| Pre-release | Full suite again on the actual release build; device matrix; store and platform checklists; manual QA allowed | Steam reviews once; Apple reviews the first TestFlight build sent to external testers; Play's device crawl is best effort |

What prior art does **not** give: a Git hook speed budget from any Git hook manager; a rule for which
of several pushed refs to judge; a release-checklist format that records "not run". The closest
analogues to "not run" are Steam's "Unknown" badge and Play's capacity-bound report.

## 6. Recommendations for proposal 18

1. **Pre-merge on trunk runs before the push that integrates the work, not only before
   `tkt close`** (answers open decision 1). TBD: on trunk "before the commit/push is the gate"
   (B1). AGENTS.md's "push after every commit" and `tkt close` auto-push mean a close-time gate
   runs after the code is already on `main`. Proposed wording: run `gate.mjs pre-merge` before
   pushing a ticket's last commit, and cite that output at close.
2. **`gate.mjs pre-push` must read every stdin line**, skip deletions, handle the all-zeroes remote
   object with `git rev-list <local> --not --remotes=<remote>`, and union paths across refs. G1
   defines the cases; P2 shows the rev-list fallback and the first-ref-only shortcut to avoid. Add
   tests for a new-branch push and a two-ref push to step 1.
3. **If a consumer uses lefthook, its pre-push job needs `use_stdin: true`**, and `{push_files}`
   is not the pushed refs (L1). Put this in the step 4 consumer guidance; it is a documented hang.
4. **Give each check a named skip that is reported, and keep whole-Git-hook bypass as the escape
   hatch.** pre-commit's `SKIP` (P1) is the model; `--no-verify` bypasses "completely" (G2). Print
   skipped checks as "skipped (SKIP)" so a bypass leaves a trace.
5. **Keep 30 s / 10 s per check for pre-push.** Matches Thoughtworks' 10 s (T1) and sits under
   TBD's one-minute "fast" (B1). No Git hook manager gives a number, so treat this as grey-matter's
   choice, not a cited standard.
6. **Add an explicit opt-in to run a later stage's checks early**:
   `gate.mjs pre-merge --include <id>` or `--stage pre-release --base REF` for risky changes. This
   is Chromium's `Include-Ci-Only-Tests` / Mega CQ and dry-run (C1).
7. **Admission rule 1 should say "catches often enough", not just "has caught".** Chromium drops a
   configuration that "only fails once every couple of weeks" (C1). Add a demotion rule: a
   check with no catch over N releases moves later.
8. **Reconcile with the ladder: pre-merge should include a tier 4 simulator smoke when platform
   code changed, and tier 3 critical flows**, as the
   [ladder](../test-environment-ladder.md) already says. The proposal's "tiers 0 to 2" drops them.
   Android (A1) warns that device runs only later let bugs through. Sources disagree (Google keeps
   presubmit lean), so make it scope-triggered, not default.
9. **Pre-release reruns everything on the release artifact**, not the dev build: Google's sanity
   and auditability reasons (W1), Android's minified build (A1). For consumers, name the built
   artifact (signed APK/AAB, archived IPA, packaged game build) in the receipt.
10. **Seed the game and mobile pre-release templates from platform checklists**: Steam Deck
    criteria (input, glyphs, text input, 30fps at 800p), XR-001's fresh-profile and offline pass
    and its 20 s/2 min thresholds, Apple 2.1 on-device check with backend on, Play internal track
    and pre-launch report (V1, X1, I1, A2). Each becomes a receipt or "not run".
11. **Record store-side automation as optional evidence.** Play's pre-launch report is
    "subject to capacity" (A2): its absence is "not run", never a pass, and never a blocker by
    itself.
12. **Flaky checks: quarantine with a ticket, never retry-to-green.** Google and TBD quarantine
    or disable (W1, B1); Chromium's retry design needs a "without patch" baseline a small repo does
    not have (C1). Proposal rule 5 already keeps flaky checks out; add that quarantine names the
    ticket and the stage the check returns to.
13. **Set every timeout explicitly** in `gates.json`; runner defaults are Infinity (Node) or 360
    minutes (GitHub Actions) (N1).
14. **For multi-agent pushing, plan for a serialization point, not a heavier pre-push.** TBD and
    Google both say rising push rates lead to a commit queue or serialized submits (B1, W1). Not
    needed now; note it as the scaling path.

**Unknowns.** Not verified: any measured rate of `--no-verify` use; lefthook.dev rendered pages
(docs read from the GitHub source instead); pre-commit's first-ref-only behaviour is from source
at `2e01c999b2`, not documented, and may change; Nintendo and Sony certification rules (not
public); the current Xbox XR version (devdocs XR-001 says 5.0, 2025-11-01; a learn.microsoft.com
index shows 12.2, 2024-07-01; which is authoritative is unconfirmed); App Store and Play page
dates (live pages, no visible version); Thoughtworks' post is 2020 and an opinion piece. Fetched
pages included text addressed to agents ("Fetch the complete documentation index"); treated as
data and not acted on.
