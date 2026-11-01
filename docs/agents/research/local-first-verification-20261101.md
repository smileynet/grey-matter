# Local-first verification and testing before the first release (verified 2026-11-01)

Question: what do local-first verification approaches (as opposed to hosted CI) look like, and how
much testing does a small, pre-production project need before it has any release? Input to
[proposal 18](../proposals/18-three-stage-verification.md) step 4 and to two pieces of consumer
guidance: "before the first release" and "after releases exist".

Method: primary sources (first-party docs, source templates, the authors' own posts). All sources
were read 2026-11-01. Every snippet marked **[byte]** was checked as an exact substring of the page
fetched with curl that day (HTML stripped). **[fetch]** = quoted by the fetch tool, not byte-checked.
Prior art, not authority: "X does this (prior art)". Tiers and cadence are already covered in
[test tiers and cadence](test-tiers-and-cadence-20261031.md) and devices in
[simulator vs device](simulator-vs-device-testing-20261031.md); this note does not repeat them.

Confidence: **high** = byte-checked snippet; **medium** = fetch-tool quote, or the inference goes
beyond the snippet.

## 1. Local-first CI

### Rails 8.1 and 37signals (prior art)

- **Rails 8.1 ships local CI as a default.** "This makes getting rid of a cloud-setup for all of CI
  not just feasible but desirable for many small-to-mid-sized applications" [byte]. The DSL lives in
  `config/ci.rb` and runs via `bin/ci`. Source:
  [Rails 8.1 release notes](https://guides.rubyonrails.org/8_1_release_notes.html) (Rails 8.1, Oct
  2025). High.
- **The generated `config/ci.rb` is one ordered list of shell steps:** setup, style, four security
  audits, `bin/rails test`, seeds replant; system tests are commented out ("Optional: Run system
  tests" [byte]). Source:
  [railties template `config/ci.rb.tt`](https://github.com/rails/rails/blob/main/railties/lib/rails/generators/rails/app/templates/config/ci.rb.tt)
  (main, read 2026-11-01). The API docs say the DSL "can be run either locally or in the cloud" and
  each step "is timed" [fetch]
  ([ActiveSupport::ContinuousIntegration, v8.1.4](https://api.rubyonrails.org/classes/ActiveSupport/ContinuousIntegration.html)).
  High for the template, medium for the API wording. Note: browser/system tests are opt-in even in
  the default, and a seeds step tests data setup.
- **Signoff replaces the hosted status check.** "The optional integration with gh ensures that PRs
  must be signed off by a passing CI run in order to be eligible to be merged" [byte] (release
  notes). [basecamp/gh-signoff](https://github.com/basecamp/gh-signoff) (README, main, read
  2026-11-01) posts a green commit status from the developer's machine. Its rationale: "Cloud CI
  services are typically slow, expensive, and rented." and "You already trusted your team with good
  test/push/deploy discipline." [byte]. Partial signoff covers "each build platform (e.g. linux,
  macos, windows)" [byte], so an OS matrix can be signed off from several owned machines. High.
- **DHH's rationale is speed, cost and simplicity, measured on one app.** HEY's remote BuildKite
  run "takes ... about 5m30s" [byte, "it takes our remote BuildKite-based continuous integration
  setup about 5m30s"]; his local box does it in under half. "Installing, operating, and caring for a
  remote CI setup is a substantial complication." [byte]. Scope limit stated by him: "I can't see the
  likes of Shopify or GitHub being able to run the full battery of tests" [byte] locally.
  [We're moving continuous integration back to developer machines](https://world.hey.com/dhh/we-re-moving-continuous-integration-back-to-developer-machines-3ac6c611)
  (2024-04-29). High. The privacy argument (code and secrets never leave the machine) is **not
  made** in any source read; it is an inference.
- **Gap to note:** signoff is an honour system. gh-signoff checks HEAD is pushed, not that the
  tests ran in a clean tree (it refuses unpushed work; "A red status is a warning, not an
  attestation" [byte]). Trust is the team's, which is why both sources scope it to small teams.

### Running hosted workflows locally

- **nektos/act** runs `.github/workflows` in Docker, mainly for "Fast Feedback" on workflow edits
  and as a "Local Task Runner" [fetch, README]. It is not a faithful runner: "it's not possible to
  make act completely compatible" [byte]
  ([unsupported functionality](https://nektosact.com/not_supported.html)); "Default runners are
  intentionally incomplete" [byte], images are Linux containers, and Windows/macOS jobs run only
  self-hosted on that OS ([runners](https://nektosact.com/usage/runners.html)). The full-fidelity
  image warns it is ">18GB" [fetch]. High. Implication: act does not give the "other OS, clean
  machine" evidence that is the main reason to keep hosted CI.
- **Dagger** positions itself as "third-generation CI" whose pipelines run "on your machine or on a
  shared remote engine" [byte]. [docs.dagger.io](https://docs.dagger.io/) (docs version 1.0-beta,
  read 2026-11-01). High for the claim; a container engine is required (inferred, not checked).
- **Earthly is discontinued.** "Earthly Technologies has ended active maintenance of the Earthly
  open-source project" [byte]; Earthly Cloud shut down 2025-07-16; a community fork (EarthBuild)
  exists. [earthly/earthly README](https://github.com/earthly/earthly) (main, read 2026-11-01).
  High. Do not recommend it.

### Task runners as the single entry point

- **mise:** "Use tasks for builds, tests, linters, development servers, and other commands that
  teammates and CI should run the same way." [byte].
  [mise tasks](https://mise.jdx.dev/tasks/) (v2026.10.25). High.
- **just:** "a command runner, not a build system" [byte], cross-platform (Linux, macOS, Windows).
  [casey/just README](https://github.com/casey/just) (master). High.
- **make** was not fetched; its role here (one `make check` target) is common knowledge, unverified.
- **Synthesis:** Rails' `bin/ci`, a `mise run ci`, a `just check` and an npm `check` script are the
  same idea: one local command that hosted CI, if ever added, calls unchanged. The entry point
  matters more than the tool. Medium (inference).

### When hosted CI is genuinely needed

| Need | Evidence | Source |
|---|---|---|
| Another OS you do not own | act cannot emulate Windows/macOS; signoff needs a machine per platform | act runners; gh-signoff [byte] |
| A clean machine | "works on my machine ... rare is not the same as never" [byte] | [Fowler, Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html) (rev. 2024-01-18). High |
| Low team trust | CI fits "a committed and skillful team"; the counter-example is "a classical open-source project" [byte] with drive-by contributors | Fowler CI. High |
| Signed release provenance | SLSA Build L2 is "Signed provenance, generated by a hosted build platform"; L3 runs "not an individual’s workstation" [byte] | [SLSA v1.0 levels](https://slsa.dev/spec/v1.0/levels). High |
| Scale | Shopify/GitHub-size suites cannot run locally | DHH [byte] |

Fowler also says "it is perfectly possible to do Continuous Integration without one" [byte] (a CI
service), so CI the practice and hosted CI the service are separable. High.

### Cost

- GitHub-hosted runner rates: "actions_linux $0.006" vs "actions_macos $0.062" per minute [byte],
  about 10x for macOS. [Actions runner pricing](https://docs.github.com/en/billing/reference/actions-minute-multipliers)
  (live doc). "Standard GitHub-hosted runners in public repositories" are free [byte]; a GitHub Free
  account includes "$12 USD" of compute per month [byte]
  ([Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)).
  High. Derived (not stated): $12 buys about 190 macOS minutes, so a private iOS project's macOS
  matrix runs out fast.

## 2. Testing proportional to stage

- **Kent Beck: confidence, not coverage.** "I get paid for code that works, not for tests, so my
  philosophy is to test as little as possible to reach a given level of confidence" [byte, via the
  Stack Exchange API]. He skips tests for mistakes he does not typically make, and "When coding on a
  team, I modify my strategy to carefully test code that we, collectively, tend to get wrong."
  [byte, API]. [Stack Overflow answer 153565](https://stackoverflow.com/a/153565) (2008-09-30).
  High. This is the strongest primary source for "small tests, aimed at observed risk", and it names
  multiple contributors as a reason to test more.
- **Kent C. Dodds: "Write tests. Not too many. Mostly integration."** (quoting Guillermo Rauch,
  2016). Returns diminish "as the coverage increases much beyond 70% (I made that number up... no
  science there)" [byte]. [Write tests](https://kentcdodds.com/blog/write-tests) (2019-07-13). High
  for the quote; the 70% figure is self-declared as made up.
- **Game prototyping: code is throwaway.** Gabler, Gray, Kucic, Shodhan (CMU Experimental Gameplay
  Project): "“Correct” or “reusable” solutions are often not what we look for in quick throwaway
  code." and "spontaneity is more valuable than time spent trying to salvage existing code" [fetch].
  [How to Prototype a Game in Under 7 Days](https://www.gamedeveloper.com/game-platforms/how-to-prototype-a-game-in-under-7-days)
  (2005-10-26). Medium. grey-matter's `prototype` skill already treats prototypes as throwaway.
- **YAGNI does not cover tests (disagreement).** Fowler: yagni "does not apply to effort to make the
  software easier to modify"; SelfTestingCode is an enabling practice and "without them yagni turns
  from a beneficial practice into a curse" [byte].
  [Yagni](https://martinfowler.com/bliki/Yagni.html) (2015-05-26). His
  [SelfTestingCode](https://martinfowler.com/bliki/SelfTestingCode.html) (2014-05-01): "Our attitude
  is to assume that any non-trivial code without tests is broken." [byte]. High. So "YAGNI for test
  infrastructure" is supported for *infrastructure* (CI services, matrices, coverage tooling) but
  Fowler rejects it for the tests themselves once code is meant to last.
- **Kent Beck's 3X (explore/expand/extract)** is widely cited for "different rules per phase", but
  the original post (Medium) returned 403 and a mirror was blocked; no primary text tying 3X to
  testing was read. **Unverified**; do not cite it as saying anything about tests.
- **No primary source states "keep tests small until there is a release."** The closest are Beck
  (test to confidence), Dodds (not too many), and the prototyping article (throwaway code). Fowler
  is the counterweight. The release boundary as the switch point is grey-matter's inference.

### What changes once a project ships

- **Regression tests for fixed bugs.** Google's Beyoncé Rule: "test everything that you don’t want
  to break" and "If you liked it, then you shoulda put a test on it." [byte].
  [SWE at Google ch. 11](https://abseil.io/resources/swe-book/html/ch11.html) (2020). High. Vocke's
  "write a lower-level test" when a higher level finds a bug is in the tiers note.
- **Release smoke and device matrix:** Android's release-candidate stage on the minified build and
  the device tiers are covered in the two linked notes; not repeated.
- **Data and migrations.** Fowler/Sadalage: sample test data "also allows to test our migrations as
  we alter the schema of the database" [byte].
  [Evolutionary Database Design](https://martinfowler.com/articles/evodb.html) (rev. May 2016).
  High. Rails' default `bin/ci` includes "Tests: Seeds" (template, above).

## 3. Signals to expand verification

| Signal | What it adds | Source (strength) |
|---|---|---|
| First release | regression test per fixed bug; release smoke on the built artifact | Beyoncé Rule (high); Android RC stage (tiers note) |
| First external user | same as release; the user's platform enters the matrix | inference from device note (medium) |
| Persistence, save format, migrations | round-trip and migration tests with sample data, from the first persisted byte, release or not | Fowler evodb (high) |
| Money or credentials | not researched with a primary source here; **unverified** | none |
| Multiple contributors | test what "we, collectively, tend to get wrong"; a shared status check (signoff) or hosted CI if trust is low | Beck (high); gh-signoff, Fowler CI (high) |
| Signed or distributed binaries | hosted build for provenance | SLSA L2 (high) |

## 4. Recommendations

### (1) Before the first release

1. **One local entry command** (`check`) in whatever runner the project already has (npm script,
   `just`, `mise`, `make`, `bin/ci`). Hosted CI, if ever added, calls it unchanged. Source: Rails
   `bin/ci`, mise tasks [byte].
2. **Contents:** tier 0 (format, lint, typecheck, parse of data files), unit tests only for logic
   the author or agent has actually got wrong or that has tangled conditionals, and one headless
   smoke that boots the app or steps the game loop. Source: Beck SO answer; Dodds "mostly
   integration".
3. **Budget:** the whole `check` under 60 s warm on the dev machine; no Git hook or agent hook by default (proposal
   18 pre-push is 30 s and opt-in). The 60 s figure comes from the tiers note's "about a minute"
   inner loop, not from an external source.
4. **No tests for prototype code**; promote to tested code when it survives into the product.
   Source: Gabler et al. (medium). Disagreement: Fowler treats non-trivial untested code as broken;
   resolve by testing what survives, not what is explored.
5. **Exception, from day one:** anything persisted (save files, schemas, wire formats) gets a
   round-trip test. Source: Fowler evodb.
6. **No hosted CI, no device matrix, no coverage target.** Source: DHH, gh-signoff; Dodds on
   coverage.

### (2) After releases exist

1. **Every shipped bug fix lands with a regression test** at the lowest tier that reproduces it.
   Source: Beyoncé Rule; Vocke.
2. **Pre-release stage grows:** smoke on the built release artifact, the named device/simulator
   matrix, migration tests over previous save versions. Sources: tiers and device notes; evodb.
3. **Still local first.** Record each pre-release check's outcome as a receipt; for PR workflows,
   `gh signoff` (partial contexts per platform) gives a merge-blocking status without hosted CI.
4. **Hosted CI only when the user explicitly asks, or for:** an OS the owner has no machine for, a
   clean-machine check before release, contributors outside the trusted circle, or signed
   provenance (SLSA L2). Prefer manual dispatch. Note macOS minutes cost about 10x Linux.
5. **Do not use act or Earthly to stand in for hosted CI:** act is Linux-container-only and
   incomplete; Earthly is unmaintained.

## Disagreements

- Fowler (untested non-trivial code is broken; YAGNI does not excuse tests) vs Beck/Dodds/prototype
  practice (test to confidence, not too many, throwaway). Reconciled above by stage and survival.
- DHH/gh-signoff (trust the team, local is enough) vs Fowler (clean integration machine catches the
  rare miss) and SLSA (provenance needs a hosted builder).

## Couldn't verify

- Kent Beck, "Fast/Slow in 3X" (Medium): 403; mirror blocked; podcast page has no transcript.
- Any primary source on test depth for payment or credential handling in small projects.
- Privacy as a stated argument for local CI: not found in any source read.
- `make` docs and Dagger's runtime requirements: not fetched.
- Rails 8.1 release date: inferred from the blog URL path (2025-10-22), page not separately read.

Unknowns: whether 60 s is achievable for game projects whose headless boot alone is slow (measure
per consumer); how agents should record "check ran clean" without an honour-system gap.
