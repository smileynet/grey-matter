# Agent test tiering: prior art

Checked 2026-10-31. Question: how do agent skill sets and agent guidance tell a coding
agent which tests to run when, by cost, and how do they keep test environments from
consuming disk and time? Prior art below is prior art, not authority: "X does this
(prior art); grey-matter chose Y". Related: [proposal 16](../proposals/16-agent-footprint-guardrails.md)
(ticket 110) owns disk footprint; this note covers test cadence and cost, and only touches
footprint where the two meet.

**Source note.** `.references/` in this checkout holds only `README.md`; no reference is
cloned, and mattpocock/skills is not listed there. The mattpocock/skills copy read here is
`~/code/crew-research/.references/mattpocock-skills` (commit `96a3d1b`, 2026-10-27).

## 1. Local prior art

### crew-research atomics (`~/code/crew-research/atomics/`)

- (a) Cheapest test: `skills/feedback-loop-debugging/SKILL.md:22-28` orders loop sources
  existing failing test, targeted new test, CLI one-liner, script harness, bisection; `:37`
  and `:43` require "seconds, not minutes", target under 5 s; `:90` names "Running full test
  suite as your loop (too slow, too noisy)" an anti-pattern. `references/tighten.md:5-12`:
  cache setup, skip unrelated init, narrow scope. `skills/testing-guide/SKILL.md:60` sets
  budgets: unit tests under 100 ms each, suite under 10 s.
- (b) Cadence: two tiers only, debugging loop then "verify full test suite"
  (`feedback-loop-debugging/SKILL.md:56`, `:74`). `verification-protocol/SKILL.md:16-34`
  is a single pre-done gate (build, test, lint, scope by task type, config gets "smoke
  test"); `:48-63` scales depth to reversibility and blast radius, never diff size.
  `git-protocol/references/commit-messages.md:14-18` "Pre-Commit Checks" are git log and
  diff only, no tests. `enforcement-hierarchy/SKILL.md:37-41` puts linters and pre-commit
  hooks at Level 2, test suites at Level 3 (judgement gate). No pre-merge or CI tier.
- (c) Footprint: `project-conventions/references/windows.md:35-40` says launch long test
  suites detached and observe by process/port; `dispatch-review/SKILL.md:26` warns that
  review subagents run `godot --headless` and tests, giving false results. Nothing on
  simulator/device cost, build-cache size, or test-runner temp retention.
- (d) Gaps: no tier between "my loop" and "full suite"; no notion of environment cost
  (headless vs scene vs device); `testing-guide` budgets are for writing tests, not choosing
  which to run.

### mattpocock/skills (prior art for grey-matter's own lineage)

- (a) `skills/engineering/diagnosing-bugs/SKILL.md:18-29` ranks ten loop kinds from failing
  test to HITL script; `:37` "Cache setup, skip unrelated init, narrow the test scope"; `:57`
  "Fast: seconds, not minutes".
- (b) `skills/engineering/implement/SKILL.md:11`: "Run typechecking regularly, single test
  files regularly, and the full test suite once at the end." This is the clearest
  three-tier cadence in any source read. `skills/misc/setup-pre-commit/SKILL.md:37-47,91`
  installs a pre-commit hook: lint-staged (staged-only, fast), then full typecheck and tests.
  `resolving-merge-conflicts/SKILL.md:12`: after a merge, typecheck, then tests, then format.
- (c) None. `codebase-design/DEEPENING.md:15` prefers local stand-ins (PGLite, in-memory
  filesystem) inside the suite, which lowers cost but is framed as design, not cost.
- (d) Web-only; "full suite" is assumed cheap enough to run every time.

### grey-matter today

- `skills/engineering/tdd/SKILL.md:73-81` (Rules of the loop) says red before green, one
  slice at a time; nothing on which command to run or its cost. `:19-23` re-points the seam
  for games but not the runner.
- `skills/engineering/implement/SKILL.md:13`: "Typecheck and run the relevant test file
  after each slice; run the full test suite before you commit." (inherited from Pocock's
  `:11`, moved full-suite from "at the end" to "before you commit"). Review depth
  (`:22-29`) scales *review* to reversibility and blast radius; it does not scale *testing*.
- `skills/engineering/implement-spec/SKILL.md:32`: after every merge, integration-branch
  build and full suite green before the next merge. This is a de facto pre-merge tier, but
  it repeats the full suite N times for N tickets, with no cheaper option when the suite is
  slow or device-bound. `:40` cleans implementer worktrees "and their build artifacts".
- `skills/engineering/game-native-design/SKILL.md:60-70` decides *what* is testable
  (deterministic core yes; feel, rendering, input timing by play). The engine tables name
  the cost tiers without ordering them: Godot `references/godot.md:32` (off-tree pure logic
  and seeded sim vs a running scene via GdUnit4 Scene Runner); Unreal `references/unreal.md:32`
  (Automation with no world / Functional needing a PIE level / Gauntlet session).
- `skills/engineering/diagnosing-bugs/SKILL.md:45,65`: fast loop, seconds not minutes
  (Pocock lineage).
- `skills/meta/repository-artifact-hygiene/SKILL.md:70-92` (At ticket close): build output,
  worktrees, disposable homes get promote/keep/delete; `:92` keeps files hard-linked into a
  simulator until the tool is done; `:108-109` excludes machine-wide disk cleanup.
  Proposal 16 (`docs/agents/proposals/16-agent-footprint-guardrails.md:54,68-76,143-149`)
  adds "While you work": measure before a build, test run or simulator, 500 MiB per
  attempt, pytest `tmp_path_retention_policy = "failed"`, prefer tool prune commands
  (`:176`, `xcrun simctl delete unavailable` unverified).
- `global/AGENTS.md:3-4`: run build/test/lint, classify outcomes, scale verification depth
  to reversibility and blast radius. Says *how deep*, not *which tier when*.

## 2. Public prior art

- **Anthropic, Claude Code best practices** (https://code.claude.com/docs/en/best-practices,
  fetched 2026-10-31). (a) CLAUDE.md should hold "the exact test, typecheck, and lint
  commands, and how to run a single test file", with the example "Run one test file: pnpm
  vitest run path/to/file.test.ts"; scoped prompts like "run the auth tests after". (b) No
  named per-slice/pre-commit/pre-merge tiers; enforcement split: "When it's done ... Tests,
  typecheck, a `Stop` hook, CI" are deterministic, CLAUDE.md lines are guidelines; Stop hook
  example runs `tsc` before a turn may end. Ask for evidence: the command and its output.
  (c) Only token/context cost: keep "a full test run" out of the main conversation via
  subagents. No disk or device guidance.
- **AGENTS.md** (https://agents.md/, fetched 2026-10-31). Sample: focus one test with
  `pnpm vitest run -t "<test name>"`, per-package `pnpm turbo run test --filter`, "Fix any
  test or type errors until the whole suite is green", "Always run `pnpm lint` and `pnpm
  test` before committing", "The commit should pass all tests before you merge", "Find the
  CI plan in the .github/workflows folder." (a)(b) yes, by example; (c) none.
- **OpenAI Codex AGENTS.md guide** (developers.openai.com/codex/guides/agents-md, now
  redirecting to https://learn.chatgpt.com/docs/agent-configuration/agents-md). Samples only:
  "Always run `npm test` after modifying JavaScript files", "Run `npm run lint` before opening
  a pull request", a nested override "Use `make test-payments` instead of `npm test`"
  (scoping by directory), and review guidance to "reserve formatting and lint checks for CI".
  (c) none.
- **Cursor, agent best practices** (https://cursor.com/blog/agent-best-practices). Rule
  example "`npm run test`: Run tests (prefer single test files for speed)", "Always
  typecheck after making a series of code changes"; a hook loop "until all tests pass";
  worktrees so agents "edit, build, and test code without stepping on each other". (c) none.
  Third-party Cursor rule (https://docs.bugster.dev/guides/coding-agents/cursor.md): "E2E
  tests are slow (30-300 seconds). This rule is designed to run sparingly - only as final
  verification after code changes."
- **Aider** (https://aider.chat/docs/usage/lint-test.html). Auto-lint edited files by default;
  `--test-cmd` plus `--auto-test` runs the configured suite "after each time the AI edits your
  code", without arguments. One tier, no selection, no speed guidance.
- **Google, Software Engineering at Google ch. 11** (https://abseil.io/resources/swe-book/html/ch11.html).
  Not agent guidance but the sharpest cost taxonomy: small (single process, no sleep or
  I/O), medium (multi-process, localhost only), large (multi-machine), about 80/15/5; large
  tests run "only during the build and release process so as not to impact developer
  workflow"; "The slower a test suite, the less frequently it will be run". Sizes are by
  *resources used*, which maps onto game tiers (off-tree logic / running scene / device).
- **Simulator/device skills** (search 2026-10-31: Expo serve-sim, agent-runbook simctl,
  agent-device). Booted-simulator checks, confirmation before erasing simulators, routing
  device interaction through one tool; Expo EAS Simulator moves the device remote. No source
  found that budgets simulator disk or tells an agent when a device run is warranted.

## 3. Synthesis by question

- **(a) Cheapest test that answers the question.** Universal in spirit, always phrased as
  "single test file" or "narrow scope" for speed. Only diagnosing-bugs/feedback-loop-debugging
  make it a rule with a number (seconds; under 5 s). No source frames it as "pick the lowest
  rung whose environment can observe the behaviour", which is the game case.
- **(b) Cadence.** Consensus of three rungs: targeted test per edit/slice, full suite (plus
  lint/typecheck) before commit, CI before merge. Pocock implement, grey-matter implement,
  AGENTS.md sample and Codex samples all say a subset. Google adds a fourth: large tests
  at build/release, off the developer loop. Nobody says what to do when the "full suite"
  includes rungs too slow or too environment-heavy for every commit.
- **(c) Environment footprint.** Effectively absent from all agent guidance read. The only
  concrete rules are grey-matter's own proposal 16 (measure, retention, prune) and
  Cursor/Codex worktree isolation (which multiplies footprint).
- **(d) Gaps across prior art.** No ladder that names environment rungs (pure logic,
  headless engine, running scene, simulator/emulator, physical device) with when each is
  required; no rule for reusing a booted environment vs tearing it down; no rule for
  "full suite" when it is device-bound; no link between the cost tier and the evidence
  outcome classes (skip vs infrastructure error when a simulator is unavailable).

## 4. Gaps in grey-matter's current skills (recommendations)

1. **No environment ladder anywhere.** `implement:13` says "relevant test file" then "full
   suite", which assumes one cheap environment. For a Godot or mobile project the full suite
   may need a running scene or a booted simulator. *Recommend:* a new agent-facing reference,
   `docs/agents/test-environment-ladder.md`, defining rungs by resources used (Google's
   sizing, adapted): R0 static (typecheck, lint, parse/import); R1 in-process logic (unit,
   seeded sim, golden outputs); R2 local multi-process or headless engine (integration,
   `godot --headless`, Unreal Automation with no world); R3 rendered/scene (GdUnit4 Scene
   Runner, Functional/PIE, headless browser); R4 simulator/emulator; R5 physical device or
   multi-machine (Gauntlet, store builds). Rule: run the lowest rung that can observe the
   behaviour under test; climb only when it cannot. Reasoning: a reference, not a skill,
   because it is consulted by four skills and triggers on no task wording of its own
   (same argument as proposal 16 decision 1); keeps tdd and implement terse.
2. **implement cadence lacks a rule for heavy rungs.** *Recommend* rewording `implement:13`
   to: after each slice, typecheck and the slice's test at its lowest rung; before commit,
   every rung up to R2 (or the project's declared commit gate); R3+ only when the ticket's
   outcome lives there or the project's AGENTS.md names it; report rungs not run as
   "not run" in the evidence, using the outcome classes. Pocock runs the suite "once at the
   end" (prior art); grey-matter chose "before commit", and should keep it for cheap rungs
   only.
3. **implement-spec runs the full suite after every merge** (`implement-spec:32`). Keep the
   per-merge gate at R0-R2; run R3+ once on the integration branch before review (step 7)
   and before closing (step 8). Reasoning: the "two slices break together" risk it guards is
   caught at the cheap rungs in the common case; Google runs large tests at build/release.
4. **tdd names no runner cost.** Add one line to Rules of the loop: the red-green loop runs
   at the lowest rung that observes the seam, in seconds (link the ladder). Pocock and
   crew-research put the speed rule only in debugging skills (prior art); grey-matter
   should apply it to the build loop too.
5. **game-native-design tables list engine test kinds but not their rung.** Tag the Testing
   rows in `references/godot.md:32` and `references/unreal.md:32` with ladder rungs, and add
   to SKILL.md Testing that a sim-service test belongs at R1 off-tree, never in a scene.
   This is where the game-centric value is; no prior art read does it.
6. **Footprint stays with repository-artifact-hygiene** (proposal 16 "While you work").
   The ladder reference should point there for R3-R5 (simulators, device builds, engine
   import caches like `.godot/`) rather than repeat rules. One addition worth considering:
   reuse a booted simulator/emulator across slices within a ticket and shut it down at
   ticket close (Keep with lifecycle scope), since no source covers it.
7. **Projects need to declare their rungs.** Prior art (Claude Code, AGENTS.md, Codex)
   agrees the commands belong in the project's AGENTS.md. *Recommend* init-project /
   conformance-audit check for a "Test commands by rung" block (at least: single test, commit
   gate, slow tier). Without it the ladder is unexecutable.
8. **Enforcement.** Claude Code's doc and crew-research enforcement-hierarchy agree: a gate
   with no exceptions is a hook (Stop/pre-commit), not prose. The commit gate (R0-R2) is a
   pre-commit-hook candidate; R3+ is judgement and stays in skills.

**Unknowns.** Not verified: actual run times of Godot/Unreal rungs on this machine; the
original Google test-sizes blog body (fetch returned comments only; the SWE book chapter was
used instead); official Cursor docs on test commands (blog post used); no cloned
agentskills reference was available to check for spec-level guidance.
