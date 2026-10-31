# Test tiers and cadence (verified 2026-10-31)

Question: how should a test suite be layered by cost and by when each layer runs, so an agent
tests in the cheapest (leftmost) environment that can answer the question and saves expensive
layers for when they are needed?

Method: primary sources only (Google's book and blog, Fowler's site, vendor docs, the original
papers or the engineering posts by the people who built each practice). Every snippet marked
**[byte]** was checked as an exact substring of the live page on 2026-10-31 (fetched with curl,
HTML stripped). These are prior art for grey-matter to accept or reject, not rules. Section 5 is
a synthesis and cites nothing.

Confidence: **high** = verbatim snippet byte-checked; **medium** = snippet from the fetch tool but
not byte-checked, or the inference goes beyond the snippet.

## 1. Classification by cost and size

### Google: size (resources) is separate from scope (code exercised)

- **Sizes are limits the infrastructure enforces, not labels.** "small tests run in a single
  process, medium tests run on a single machine, and large tests run wherever they want" [byte].
  Medium tests "aren't allowed to make network calls to any system other than localhost" [byte].
  Source: [SWE at Google ch. 11](https://abseil.io/resources/swe-book/html/ch11.html) (2020).
  High.
- **The 2010 resource table** (from the Testing Blog, "Test Sizes", 2010-12-13): "Network access
  No localhost only Yes Database No Yes Yes File system access No Yes Yes Use external systems No
  Discouraged Yes Multiple threads No Yes Yes Sleep statements No Yes Yes ... Time limit (seconds)
  60 300 900+" [byte, table text flattened]. It also says: "A Small test equates neatly to a unit
  test, a Large test to an end-to-end or system test" [byte].
  [Source](https://testing.googleblog.com/2010/12/test-sizes.html). High. The page's text does
  not name the author (the label reads "Simon Stewart"), so authorship is unverified.
- **Bazel puts sizes into code.** `size` "Specifies a test target's "heaviness": how much
  time/resources it needs to run" [byte]. The table: "small 20 [MB] 1 [core] short (1 minute)
  medium 100 1 moderate (5 minutes) large 300 1 long (15 minutes) enormous 800 1 eternal (60
  minutes)" [byte, flattened]. Sources:
  [Bazel common definitions](https://bazel.build/reference/be/common-definitions) and the
  [test encyclopedia](https://bazel.build/reference/test-encyclopedia) (live docs). High.
- **What decides placement is cost, then fidelity.** Google draws the size line "as opposed to
  the more traditional "unit" or "integration," because the most important qualities we want from
  our test suite are speed and determinism" (ch. 11, fetch-tool quote). Medium. Larger tests exist
  for fidelity: "The primary reason larger tests exist is to address fidelity" [byte]. ch. 14 names
  the gaps only they close: "Unfaithful doubles", "Configuration issues", "Issues that arise under
  load", "Unanticipated behaviors, inputs, and side effects" [byte, section headings]. Source:
  [ch. 14](https://abseil.io/resources/swe-book/html/ch14.html). High.
- **Proportions are rough guides.** ch. 11: "around 80% of our tests being narrow-scoped unit
  tests ... 15% medium-scoped integration tests ... and 5% end-to-end tests" [byte]. The 2015
  Testing Blog version: "Google often suggests a 70/20/10 split" [byte],
  ["Just Say No to More End-to-End Tests"](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html)
  (2015-04-22). The two figures differ by date. Neither is a law. High.

### Fowler and Vocke: the pyramid

- **Why there are fewer UI tests.** UI end-to-end tests are "brittle, expensive to write, and time
  consuming to run" [byte]. Before fixing a bug a high-level test found, "you should replicate the
  bug with a unit test" [byte].
  [TestPyramid bliki](https://martinfowler.com/bliki/TestPyramid.html) (2012-05-01). High.
- **Two rules:** "Write tests with different granularity" and "The more high-level you get the
  fewer tests you should have" [byte, second rule]. "Push your tests as far down the test pyramid
  as you can" [byte]. "If a higher-level test spots an error and there's no lower-level test
  failing, you need to write a lower-level test" [byte]. Vocke, [The Practical Test
  Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html) (2018-02-26). High.

### Contrasting shapes: trophy and honeycomb

- **Trophy (Kent C. Dodds):** the layers are Static, Unit, Integration, End to End. The shape is
  "a general guide for the return on investment" [byte] of each kind of test, where return is
  confidence and investment is time. Its guiding line: "The more your tests resemble the way your
  software is used, the more confidence they can give you" [byte]. Static analysis counts as a
  layer. [Source](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
  (2021-06-03; the trophy dates from a 2018 tweet). High.
- **Honeycomb (Spotify):** for microservices, mostly integration tests. "The biggest complexity in
  a Microservice is not within the service itself, but in how it interacts with others" [byte].
  It avoids "integrated tests", defined as "A test that will pass or fail based on the correctness
  of another system" [byte]. [Testing of
  Microservices](https://engineering.atspotify.com/2018/01/testing-of-microservices) (2018-01-11).
  High.
- **Fowler's reconciliation:** the honeycomb's "unit test" means a solitary test and its
  "integration test" a sociable unit test, so "This makes the pyramid versus honeycomb discussion
  moot" [byte]. He quotes Justin Searls: debating percentages "is a distraction" (fetch-tool
  quote). [On the Diverse And Fantastical Shapes of
  Testing](https://martinfowler.com/articles/2021-test-shapes.html) (2021-06-02). High.
- **Takeaway:** all four agree that the cheapest test which gives the needed confidence wins. They
  disagree on what counts as "unit" and on whether static checks are part of the suite. Medium
  (inference).

### Android: tiers by where a test runs (closest to the device ladder)

- "the most important distinction for app developers is where tests run" [byte]. Instrumented
  tests "run on an Android device, either physical or emulated"; local tests "execute on your
  development machine or a server ... They're usually small and fast" [byte]. "Big local test:
  You can use an Android simulator that runs locally, such as Robolectric" [byte].
  [Fundamentals](https://developer.android.com/training/testing/fundamentals) (updated
  2026-10-23). High.
- **The strategy table maps each layer to an environment and a lifecycle stage:** Unit (Local,
  Pre-merge); Component (Local, Robolectric, Emulator, Pre-merge); Feature (adds Devices,
  Pre-merge); Application (Staging or Prod server, Emulator, Devices, "Pre-merge Post-merge");
  Release Candidate ("Minified release build", "Post-merge Pre-release") [byte, table text].
  "Fidelity refers to the similarity of the test runtime environment to the production
  environment" [byte]. The anti-pattern it warns against: "device tests are only executed nightly.
  This means that too few tests are run before merging" [byte].
  [Strategies](https://developer.android.com/training/testing/fundamentals/strategies) (updated
  2026-10-08). High.

### Microsoft: L0 to L4 with time budgets

- "L0 is a broad class of fast, in-memory unit tests. L2 are functional tests that might require
  the assembly plus other dependencies, like SQL or the file system. L3 functional tests run
  against testable service deployments ... L4 tests are a restricted class of integration tests
  that run against production" [byte]. Budgets: "average execution time per L0 test in an assembly
  should be less than 60 milliseconds ... per L1 test ... less than 400 milliseconds. No test at
  this level should exceed 2 seconds" [byte].
  [Shift testing left with unit tests](https://learn.microsoft.com/en-us/devops/develop/shift-left-make-testing-fast-reliable)
  (live doc). High.

## 2. Cadence: per edit, presubmit, merge, post-submit, release

- **Presubmit admits only fast, reliable tests.** Google's rule for presubmit: "only fast,
  reliable ones" [byte]. "we don't want to run unreliable tests on presubmit" [byte]. "we typically
  limit presubmit tests to just those for the project where the change is happening" [byte].
  Release: "As CD builds RCs, it will run larger tests against the entire candidate" (fetch-tool
  quote). [SWE at Google ch. 23](https://abseil.io/resources/swe-book/html/ch23.html). High.
- **Record-and-replay splits one large test across two cadences.** The large "Record Mode" test
  "runs continuously on post-submit" and the small "Replay Mode" test "is used during development
  and presubmit testing" [byte]. [ch. 14](https://abseil.io/resources/swe-book/html/ch14.html).
  High.
- **Staged builds (Fowler).** "The commit build is the build that's needed when someone pushes
  commits to the mainline" (fetch-tool quote). "Since the secondary build may be much slower, it may
  not run after every commit" [byte]. The target is the XP "ten minute build" [byte]. "the best way
  to fix the build is to revert the faulty commit" (fetch-tool quote). [Continuous
  Integration](https://martinfowler.com/articles/continuousIntegration.html) (rev. 2024-01-18).
  High.
- **Microsoft's gates by level:** "developers always run through L2 tests before committing, a
  pull request automatically fails if the L3 test run fails, and the deployment might be blocked if
  L4 tests fail" [byte]. [Source](https://learn.microsoft.com/en-us/devops/develop/shift-left-make-testing-fast-reliable).
  High.
- **Merge queues test the result as it will land.** GitHub: "The merge queue will ensure the pull
  request's changes pass all required status checks" [byte]. Each entry is tested against the
  latest base plus the entries ahead of it. Actions must trigger on `merge_group` [byte]: "Runs
  your workflow when a pull request is added to a merge queue" (fetch-tool quote).
  [Managing a merge queue](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue);
  [events](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows).
  High.
- **Bors is the origin, now deprecated.** "Bors merges your pull request into a staging area, and
  runs your automated test suite" [byte]. The public instance is "being phased out" in favour of
  GitHub merge queues [byte]. [bors.tech](https://bors.tech/). High. Graydon Hoare's original "not
  rocket science rule" post could not be fetched (both known URLs returned 404): **unverified**.
- **Google TAP** runs a "massive continuous build" over the whole codebase. Under load it batches
  changes, and "TAP automatically splits a failing batch up into individual changes and reruns the
  tests" (fetch-tool quotes, [ch. 23](https://abseil.io/resources/swe-book/html/ch23.html)).
  Medium. Memon et al.: even Google is "unable to regression test each code change individually"
  [byte]. Failing tests are generally "closer" to the code they test [byte]. [Taming Google-Scale
  Continuous Testing](https://research.google/pubs/taming-google-scale-continuous-testing/) (ICSE
  2017). High.
- **Nightly or scheduled runs:** GitHub's `schedule` event runs at most "once every 5 minutes"
  [byte], only on the default branch, and "can be delayed during periods of high loads"
  (fetch-tool quote). Medium.

### Test impact analysis and selection

- **Dependency-graph selection (deterministic):** TAP selects tests by "an analysis of the
  downstream dependency graph for every change" [byte, ch. 23]. Bazel has no built-in "affected
  tests" command. The building block is `rdeps(u, x)` in [query](https://bazel.build/query/guide)
  (fetch-tool quote), and the third-party
  [bazel-diff](https://github.com/Tinder/bazel-diff) "Performs Bazel Target Diffing between two
  revisions in Git, allowing for Test Target Selection" (fetch-tool quote). Medium.
- **Predictive selection (probabilistic):** Meta's model picks a subset that will "catch more than
  99.9 percent of all regressions" while "running just a third of all tests that transitively
  depend on modified code" [byte, phrases].
  [Engineering blog](https://engineering.fb.com/2018/11/21/developer-tools/predictive-test-selection/)
  (2018-11-21). The paper: "reduces the total infrastructure cost of testing code changes by a
  factor of two ... over 99.9% of faulty changes are still reported" [byte].
  [arXiv:1810.05286](https://arxiv.org/abs/1810.05286) (Machalica et al., rev. 2019). High.
- **Launchable** (the login now points at CloudBees "smart tests"; acquisition status
  **unverified**) has the same goal: "predict which tests are most likely to fail in the shortest
  amount of testing time" [byte]. Subset targets are `--confidence`, `--time` and `--target`.
  [How Launchable selects
  tests](https://help.launchableinc.com/features/predictive-test-selection/how-launchable-selects-tests/).
  High. Neither page says where in the pipeline to use a subset: unverified.

### Flaky tests and quarantine

- **Rates and thresholds:** "as you approach 1% flakiness, the tests begin to lose value. At
  Google, our flaky rate hovers around 0.15%" [byte, ch. 11]. The 2016 blog put it at "about 1.5%
  of all test runs reporting a "flaky" result" and found "about 84% of the transitions we observe
  from pass to fail involve a flaky test" [byte]. The two figures differ by date and by what was
  measured. [Flaky Tests at
  Google](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html)
  (2016-05-27, label "John Micco"). High.
- **Quarantine has a cost.** "if the flakiness is too high, it automatically quarantines the test.
  Quarantining removes the test from the critical path and files a bug ... but could easily mask a
  real race condition" [byte]. Retries delay the signal: a 15-minute flaky-marked test needs "3
  executions ... or 45 minutes" [byte]. Same source. High.
- **Mechanisms:** Bazel `flaky` "executes the test up to three times, marking it as failed only if
  it fails each time" [byte]. Google teams "remove such flaky tests from presubmit temporarily"
  [byte, ch. 23]. High.

## 3. Shift left

- **The term in Google's usage:** CI "is also sometimes called "shifting left on testing."" [byte,
  ch. 23]. Microsoft: teams "use shift-left or shift-right strategies to move different test types
  earlier or later in the process" [byte]. High.
- **Static analysis comes first, but only if trusted.** New checks must "Produce less than 10%
  effective false positives" [byte]. "Code review is a sweet spot for analysis results" [byte].
  Google avoids warnings because "developers ignore compiler warnings" [byte]. Compiler checks
  "need to be fast so that they don't slow down the build" (fetch-tool quote). [SWE at Google ch.
  20](https://abseil.io/resources/swe-book/html/ch20.html). The CACM paper (Sadowski et al., 2018)
  says issues are fixed "before the problematic code is checked into the codebase" (fetch-tool
  quote, [abstract](https://research.google/pubs/lessons-from-building-static-analysis-tools-at-google/)).
  High.
- **Unverified:** the origin of "shift-left testing" (Larry Smith, Dr. Dobb's, 2001). drdobbs.com
  did not resolve. The common claim that "a bug costs 10x more per later phase" was not found in
  any primary source fetched here and is not repeated.

## 4. Deciding pre-merge-only versus every time

The sources state these criteria directly or imply them. Citations are above.

| Criterion | Pushes a check later (merge, post-submit, release) | Source |
| --- | --- | --- |
| Runtime | Presubmit only takes "fast" tests; the commit build targets ten minutes; L0 averages under 60 ms | ch. 23; Fowler CI; Microsoft |
| Flake rate and determinism | "we don't want to run unreliable tests on presubmit"; above 1% flakiness a test loses value | ch. 23; ch. 11 |
| Cost (compute or devices) | Meta halves test infrastructure cost by subsetting; device tests are costly, yet nightly-only is the named anti-pattern | arXiv 1810.05286; Android strategies |
| Scope and blast radius | Presubmit is limited to the changed project; the downstream graph picks the rest; cross-project runs come later | ch. 23 |
| Fidelity needed | Only larger tests catch config, load and fake-versus-real drift; the release candidate needs the minified build | ch. 14; Android strategies |
| Reversibility | A production test "cannot themselves block the release" (too late); reverting is the cheap fix for mainline breaks | ch. 14 [byte: "cannot themselves block the release of the code"]; Fowler CI |

The table does not resolve a conflict between criteria. Android says to run more device tests
before merge, while Google keeps presubmit lean. Both handle the conflict by changing the test
(record/replay, Robolectric, hermetic backends), not by choosing a cadence.

## 5. Synthesis (grey-matter proposal, not a citation)

The rule: answer each question in the leftmost tier that can answer it. When a right-hand tier
catches a bug, add a test in a left-hand tier (Vocke and Fowler, above). Move a check right only
when it is too slow, too flaky or too costly to stay left. Move it back once it is made
deterministic.

| Tier | Typical cost (order of magnitude) | What only this tier catches | Default cadence |
| --- | --- | --- | --- |
| 0. Static: types, lint, format, schema | Seconds, incremental; no runtime | Ill-typed code, banned patterns, broken links and config syntax, before any code runs | Every slice (each edit or loop iteration) |
| 1. Unit (small: one process, no I/O) | Milliseconds per test; the suite in seconds | Logic errors in one module, edge cases, regressions pinned from higher tiers | Every slice, scoped to affected tests |
| 2. Integration / headless (medium: one machine, localhost) | Seconds per test; real database, filesystem, subprocesses, headless engine | Seam and contract errors, fakes that drift from the real thing, serialization, wiring and config load | Before commit (affected set); full set before merge |
| 3. Web / browser (real browser engine) | Seconds to tens of seconds per test; flake-prone | Rendering, layout, real DOM and event timing, cross-browser differences | Affected critical flows before merge; full matrix post-merge or nightly |
| 4. Simulator / emulator | Tens of seconds to minutes; boot cost; CI capacity | OS integration, lifecycle, permissions, platform APIs on many OS versions | Smoke before merge when platform code changed; broad matrix post-merge or nightly |
| 5. Live device / production-like | Minutes; scarce hardware or farm cost; manual steps possible | Real GPU, input and sensor feel, thermals and performance, store or minified build behaviour, hardware-specific bugs | Before release (release candidate); on demand when a lower tier cannot reproduce |

Notes for agents:
- "Every slice" means it has to fit inside an agent's inner loop. If tier 0 plus tier 1 (affected
  tests) take longer than about a minute, split or select. Do not skip them.
- A tier-3 or higher result that no lower tier reproduces is a missing test, not a pass condition.
- Report the tier at which a claim was verified. "Verified headless" and "verified on device" are
  different evidence.
- For games, a headless simulation step (fixed timestep, seeded randomness) is tier 2 and replaces
  much of what would otherwise need tier 4 or 5. Feel and performance stay at tier 5.

## Couldn't verify

- Graydon Hoare's original "not rocket science rule" post: graydon2.dreamwidth.org/1597.html and
  graydon.livejournal.com/186550.html both returned 404. Only secondary descriptions were found.
- The origin of shift-left (Larry Smith, Dr. Dobb's, 2001): the domain did not resolve.
- The author of the 2010 "Test Sizes" post and of the 2016 flaky post: inferred from post labels
  only.
- Whether Launchable is now CloudBees: inferred from a login link only.
- Where Launchable recommends running subsets in the pipeline: not on the pages read.
