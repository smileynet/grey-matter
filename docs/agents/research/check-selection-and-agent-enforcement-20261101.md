# Check selection, time bounds and agent enforcement

Checked 2026-11-01. Question: what is best practice for (a) selecting which checks to run
from changed paths, (b) bounding check time so nothing hangs, and (c) how coding agents should
run verification and how agent harnesses enforce it? Input to
[proposal 18](../proposals/18-three-stage-verification.md) (`gates.json` + `gate.mjs`), tickets
151, 152, 153. Prior art is prior art, not authority: "X does this (prior art); grey-matter
chose Y". Not repeated here: test sizes and cadence ([test-tiers-and-cadence](test-tiers-and-cadence-20261031.md)),
agent test-command guidance from Claude best practices, AGENTS.md, Codex, Cursor and Aider
([agent-test-tiering](agent-test-tiering-prior-art-20261031.md)), OS trash commands
([footprint-commands-by-os](footprint-commands-by-os-20261031.md)).

**Method.** Every page below was fetched with curl on 2026-11-01 and searched as stripped text;
quotes are substrings of that text. **[probe]** marks a local experiment on this host (Windows 11,
Node 22.22.3), scripts kept under the session scratchpad `probe/`.

## 1. Change-based selection

| Tool (prior art) | Selects by | Base default | Forced full run | Source |
|---|---|---|---|---|
| Nx `affected` | project graph + per-task `inputs` globs (task-level since Nx 24) | "The default base is your main branch, and the default head is your current file system"; CI should set base to "the latest successful commit on the main branch" | "By default, a change to your package manager's lock file affects every task"; opt out with `projectsAffectedByDependencyUpdates: "auto"`. `.gitignore`/`.nxignore` paths never select | [nx.dev affected](https://nx.dev/docs/features/ci-features/affected), [inputs](https://nx.dev/docs/reference/inputs) |
| Turborepo `--affected` | package graph; task `inputs` behind `futureFlags.affectedUsingTaskInputs` | `--filter=...[main...HEAD]`; `TURBO_SCM_BASE`/`TURBO_SCM_HEAD` override | "Changes to root configuration files ( package.json , turbo.json ...), the package manager lockfile, or globalDependencies will always cause all tasks to be selected". "If the checkout is too shallow, then all packages will be considered changed" | [run reference](https://turborepo.com/docs/reference/run), [configuration](https://turborepo.com/docs/reference/configuration) |
| Bazel (bazel-diff) | hash of every target in the build graph at two revisions, diffed | two explicit revisions | `WORKSPACE`/`.bzl`/`BUILD` changes rehash dependents (graph, not a rule) | [Tinder/bazel-diff README](https://github.com/Tinder/bazel-diff) |
| Buck2 Change Detector | changed files to transitively impacted targets | changed-file set (a PR) | none stated; claims it will "still guarantee to detect all problems introduced by those changes" | [buck2-change-detector](https://github.com/facebookincubator/buck2-change-detector) |
| Jest `--changedSince` / `--findRelatedTests` | module import graph | a branch or commit; "If the current branch has diverged from the given branch, then only changes made locally will be tested" | none in CLI docs | [jestjs.io/docs/cli](https://jestjs.io/docs/cli) |
| Vitest `--changed [since]` | Vite module graph | uncommitted, or a ref | `forceRerunTriggers`, default `['**/package.json', '**/vitest.config.*', '**/vite.config.*']`: "will run the whole test suite if the trigger is found in the git diff". Named reason: tests that spawn CLIs, "because Vite cannot construct a module graph" | [vitest CLI](https://vitest.dev/guide/cli), [forceRerunTriggers](https://vitest.dev/config/forcereruntriggers) |
| pytest-testmon | coverage-recorded test-to-code dependencies in `.testmondata` | its own database; "works independently of version control" | none; selects "too many" on signature changes "by design" | [testmon.org](https://testmon.org/) |
| Gradle Develocity Predictive Test Selection | ML model over past results; profiles Conservative/Standard/Fast | n/a | n/a; commercial extension | [docs.gradle.com PTS](https://docs.gradle.com/develocity/predictive-test-selection/) |
| pre-commit | per-check `files`/`exclude` regex, `types` | staged files; on `pre-push`, `PRE_COMMIT_FROM_REF`/`TO_REF` from the push; `run --from-ref --to-ref` | `always_run: true` "will run even if there are no matching files" | [pre-commit.com](https://pre-commit.com/) |
| lefthook | per-job `glob` with `{staged_files}`, `{push_files}` ("committed but not pushed"), `{all_files}` | as named | none built in; `skip` by git state, branch or shell test | [lefthook docs/configuration](https://github.com/evilmartians/lefthook/tree/master/docs/configuration) |
| GitHub Actions `paths` | workflow-level path globs, `!` negation, order matters | the event's commits | none | [workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax) |

**Findings.**

1. **Two families.** Graph-derived (Nx, Turbo, Bazel, Buck2, Jest, Vitest, testmon) computes the
   dependency closure; declared-map (pre-commit, lefthook, GHA `paths`) trusts an authored glob.
   Graph tools still need declared escape hatches for what the graph cannot see: Nx `inputs`,
   Turbo `globalDependencies`, Vitest `forceRerunTriggers` for spawned CLIs. grey-matter's
   checks are almost all scripts that spawn tools or read files by path, which is exactly
   Vitest's stated blind spot, so a declared map is the fitting family (inference).
2. **The universal forced-full set** is lockfile, root package manifest, and the selector's own
   config (Turbo: always; Nx: lockfile by default; Vitest: package.json and its config). Nobody
   documents "the checker scripts themselves", but Turbo's root-config rule is the same idea.
3. **Failure direction is "select more".** Turbo treats missing history as "all packages
   ... changed"; Nx and Turbo default the lockfile to everything; Buck2 claims it never misses.
   No source found that fails open (runs nothing) on an unknown base.
4. **Base choice matters more than the matcher.** Nx recommends the last successful run, Turbo
   `main...HEAD`, Jest warns that divergence narrows to local changes, pre-commit and lefthook
   use the pushed range. Git's pre-push hook receives `<local-ref> SP <local-object-name> SP
   <remote-ref> SP <remote-object-name>` on stdin; a new remote ref arrives as "the all-zeroes
   object name" ([githooks](https://git-scm.com/docs/githooks)). That is the authoritative range
   for pre-push, and the case an all-zeroes base must handle (153 items 5, 6).
5. **Granularity moved from package to task.** Nx 24 and Turbo's flag both moved from "any file
   in the package selects all its tasks" to per-task inputs. grey-matter's per-check `scope` is
   already task-level.

## 2. Bounding time and isolation

| Runner (prior art) | Per-test default | Whole-run bound | Source |
|---|---|---|---|
| node:test | `timeout` "Default: Infinity"; `--test-timeout` since v21.2.0/v20.11.0, also Infinity | none | [test](https://nodejs.org/api/test.html), [cli](https://nodejs.org/api/cli.html) |
| Jest | `testTimeout` 5000 ms; `openHandlesTimeout` 1000 ms warns on probable open handles | none | [cli](https://jestjs.io/docs/cli), [config](https://jestjs.io/docs/configuration) |
| Vitest | `testTimeout` 5000, `hookTimeout` (test lifecycle hooks) 10000, `teardownTimeout` 10000 | none | [cli](https://vitest.dev/guide/cli) |
| pytest-timeout | per test incl. fixtures; `signal` or `thread` method | `session_timeout`, cooperative only | [README](https://github.com/pytest-dev/pytest-timeout) |
| Bazel | by size: short 60 s, moderate 300, long 900, eternal 3600 | per target | [test encyclopedia](https://bazel.build/reference/test-encyclopedia) |
| GitHub Actions | step `timeout-minutes` | job default 360 min | [workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax) |
| Claude/Codex agent hooks | 600 s default command agent hook | n/a | [Claude hooks](https://code.claude.com/docs/en/hooks), [Codex hooks](https://developers.openai.com/codex/hooks) |

**Findings.**

1. **node:test does not bound anything by default.** Our runner's default is Infinity, unlike
   Jest's and Vitest's 5 s. 151's hang ran 524 s before an outer timeout ended it.
2. **An in-process timeout cannot stop a blocked event loop.** [probe] A node:test with
   `timeout: 500` that calls `spawnSync` on a 3 s child reported **`ok`** after 3039 ms: the
   timer never fired, so a hang inside a synchronous call (a modal dialog behind `execFileSync`,
   say) passes rather than times out. With async `spawn`, the test failed at 505 ms as
   `testTimeoutFailure`, but the run still took 6.1 s because the orphaned child kept the
   process alive. pytest-timeout says the same in its terms: a session timeout "is cooperative"
   and only interrupts a stuck test "if there is also a function timeout set"; the `signal`
   method may leave later fixtures unfinalised, so "the thread method which terminates the
   entire process might result in clearer output". So **the bound must live in the parent
   runner, around the process**, not only in the test.
3. **Kill the tree, not the child.** Node's `spawn` `timeout` sends `killSignal` (default
   `SIGTERM`) to the child only ([child_process](https://nodejs.org/api/child_process.html)).
   [probe] On this Windows host both `child.kill()` and `taskkill /T /F` ended the child and its
   grandchild, and `close` fired within ~5 ms of the kill. The mechanism and the POSIX behaviour
   (grandchildren normally survive unless the runner kills a process group) were **not**
   verified here.
4. **Timeouts are an outcome, not a tuning knob.** pytest-timeout: "timeouts being a last
   resort, not an expected failure mode". Bazel: "set your timeout as tight as you can without
   incurring any flakiness"; the runner "must not report the test as passing after sending a
   signal". Bazel's own outcome is failure; it does not separate timeout from fail at exit
   code. grey-matter's outcome classes (pass, assertion failure, skip, infrastructure error,
   timeout) are finer than any runner read; the runner has to produce them itself.
5. **Nothing may prompt.** Bazel: stdin "shall be open for reading, but what it is attached to
   is unspecified. Tests must not read from it"; `HOME` is set to `$TEST_TMPDIR`, "absolute path
   to a private writable directory". lefthook attaches `/dev/tty` as stdin only for jobs marked
   `interactive` (inference: others get no terminal input). The Windows shell delete API prompts unless told not to: `FOF_NOCONFIRMATION`
   "Respond with Yes to All for any dialog box", `FOF_NO_UI` = silent + no confirmation + no
   error UI ([SHFILEOPSTRUCTW](https://learn.microsoft.com/en-us/windows/win32/api/shellapi/ns-shellapi-shfileopstructw));
   VB `FileSystem.DeleteDirectory` defaults to `UIOption.OnlyErrorDialogs`, and its `showUI`
   options "are not supported in applications that are not user interactive"
   ([DeleteDirectory](https://learn.microsoft.com/en-us/dotnet/api/microsoft.visualbasic.fileio.filesystem.deletedirectory)).
   grey-matter already chose the fix in `scripts/review-receipt.test.mjs:39-41`: fixtures the
   test made in `mkdtemp` are removed with `rmSync`, never sent to the OS trash. A recoverable
   delete is a user-facing safety rule, not a test-cleanup rule (inference).
6. **Hermetic temp dirs bound disk too.** pytest keeps the last 3 base temp dirs
   (`tmp_path_retention_count`, `tmp_path_retention_policy`); `--basetemp` is "cleared blindly
   before each test run" ([tmp_path](https://docs.pytest.org/en/stable/how-to/tmp_path.html)).

## 3. Agent harness enforcement

| Harness (prior art) | Turn-end gate | Per-command gate | Distribution scope | Source |
|---|---|---|---|---|
| Claude Code | `Stop` hook, exit 2 sends Claude back; cap of 8 consecutive continuations; `stop_hook_active` | `PreToolUse` with `matcher` (tool name, regex) and `if` (permission-rule syntax) | plugin agent hooks fire "When plugin is enabled"; user-scope install = "every project on this machine"; skill frontmatter agent hooks register when the skill is invoked | [hooks](https://code.claude.com/docs/en/hooks), [best practices](https://code.claude.com/docs/en/best-practices), [discover plugins](https://code.claude.com/docs/en/discover-plugins), [components](https://code.claude.com/docs/en/plugins/components) |
| Codex | `Stop` | `PreToolUse`, matcher | `~/.codex`, `<repo>/.codex`, and plugin `hooks/hooks.json`; "Non-managed hooks [agent hooks] must be reviewed and trusted before they run"; all layers load, none replaces | [Codex hooks](https://developers.openai.com/codex/hooks) |
| Cursor | `stop` with `followup_message`, `loop_limit` default 5 | `beforeShellExecution`, `preToolUse`, regex `matcher`, `failClosed` | user, project `.cursor/hooks.json`, team, enterprise | [Cursor hooks](https://cursor.com/docs/agent/hooks) |
| Kiro | named use case "Validate before commit" (trigger name not checked) | `PreToolUse`, matcher by tool id or regex | `.kiro/hooks/*.json` per workspace | [Kiro hooks](https://kiro.dev/docs/hooks/) |
| Aider | none | `--auto-test` runs `--test-cmd` "after each time the AI edits your code" | per invocation | [lint-test](https://aider.chat/docs/usage/lint-test.html) |
| lefthook `ai` (beta) | generates `Stop`/`stop` entries calling `lefthook run <hook>` | `PreToolUse` likewise | writes the **project's** `.claude/settings.json`, `.codex/hooks.json`, `.cursor/hooks.json` | [lefthook ai](https://github.com/evilmartians/lefthook/blob/master/docs/configuration/ai.md) |

**Findings.**

1. **Command matching is best effort by the vendor's own account.** Claude: a `matcher` is a
   regex that "succeeds on a match anywhere in the value"; the `if` filter checks each
   subcommand, but "When Claude Code can't determine which commands the Bash input runs, it
   runs your hook [agent hook] regardless of the pattern. Because the `if` filter is best-effort, use the
   permission system rather than a hook [agent hook] to enforce a hard allow or deny." That is 153 item 1
   (`git stash push`, heredoc text) explained from the source: a PreToolUse push gate cannot be
   made exact.
2. **Plugin agent hooks are global by construction.** Claude: plugin hooks [agent hooks] "don't wait for one of the
   plugin's skills or commands to be used ... they fire on their events from then on. To limit
   when a hook [agent hook] runs, narrow its `matcher`." A user-scope install means every project. Codex and
   Cursor merge all layers the same way. No source read says "do not ship project-wide agent hooks in
   shared plugins"; that is grey-matter's own observed lesson (153). **Disagreement:** Claude's
   components page says "If a rule must hold every time ... add it to the plugin as a hook [agent hook] rather
   than a skill". That advice assumes the rule is the plugin's own; grey-matter's push gate ran
   each consumer's checker, a rule the plugin did not own.
3. **The vendor-endorsed agent gate is `Stop`, not `PreToolUse`.** Claude best practices put
   "Tests, typecheck, a `Stop` hook [agent hook], CI" under deterministic "When it's done", with
   `pnpm tsc --noEmit 1>&2 || exit 2` as the example, and the tip "If something has to happen
   every time, make it a hook [agent hook] ... `CLAUDE.md` is for guidelines". Every harness read has a
   turn-end event with a loop cap (Claude 8, Cursor 5). lefthook generates exactly that
   (`Stop: validate`) into the **project's** settings, not a plugin.
4. **Where enforcement belongs is the project.** Project-scope locations exist in all four
   harnesses (`.claude/settings.json`, `<repo>/.codex/hooks.json`, `.cursor/hooks.json`,
   `.kiro/hooks/`), and Git's own `core.hooksPath` is per repository. A middle option exists in
   Claude only: skill frontmatter agent hooks register when the skill is invoked and persist for the
   session (`once: true` removes after first success). Portability of that to Codex, Kiro and
   agy was not checked.
5. **Agents run checks the project names.** AGENTS.md's sample: "Find the CI plan in the
   .github/workflows folder" and per-package `turbo run test --filter` ([agents.md](https://agents.md/)).
   Rails 8.1 ships `bin/ci` + `config/ci.rb` so local and cloud run one declared list; it sets
   `CI=true` and exits non-zero on any failed step
   ([ContinuousIntegration](https://api.rubyonrails.org/classes/ActiveSupport/ContinuousIntegration.html)).
   The pattern across sources is one project-owned command that agents, Git hooks, agent hooks and CI all call.

## 4. Manifest prior art

| Field | pre-commit | lefthook | Rails `config/ci.rb` | Nx / Turbo | Bazel |
|---|---|---|---|---|---|
| id / name | `id`, `name` | job `name` | step title | target / task | target |
| stage | `stages`, `default_stages` | Git hook key (`pre-commit`, `pre-push`) | n/a (one list) | n/a | `size` |
| scope | `files`, `exclude`, `types` | `glob`, `files`, `exclude`, `root` | none | `inputs` / `globalDependencies` | deps graph |
| run all anyway | `always_run` | none | always | `--all`, `--force` | n/a |
| command | `entry`, `args`, `pass_filenames` | `run` with file templates | `step "Title", *argv` (argv form) | task | rule |
| timeout | none found | none in config listing | none | none | `timeout`, implied by `size` |
| skip/condition | `SKIP=` env | `skip`, `only`, `tags` | Ruby `if success?` | filters, tags | `tags` |
| ownership / why | `description` "metadata purposes only" | none | none | none | none |
| measured time | none | none | printed per step | cache stats | test logs |

**Findings.** No manifest read carries **catches**, **owner**, or **measured time** as data; Rails
prints step runtime but does not store it, and only Bazel declares a time budget. A
`catches` field is grey-matter's own invention with no prior art (flag, not a reason to drop it).
pre-commit and Rails pass argv lists, which avoids shell quoting on Windows (consistent with the
exec-form choice in [claude-plugin-hooks](claude-plugin-hooks.md)).

## 5. Synthesis

- (a) **Selection:** declared path map plus a forced-full list, judged on the pushed range for
  pre-push and the branch/ticket range for pre-merge, failing toward "run more" when the base is
  unknown. Graph tools are the better answer only where a module graph exists and checks do not
  spawn tools; neither holds for grey-matter or most consumers' gate scripts.
- (b) **Bounding:** the parent runner owns the timeout, kills the process tree, closes stdin,
  sets `CI=true` and a private temp `HOME`, and reports a timeout as its own outcome. In-test
  timeouts are a second line that cannot catch synchronous blocking [probe].
- (c) **Agents:** guidance tells the agent which project command to run and to cite its output;
  hard enforcement, where a project wants it, is a project-scoped `Stop` hook or Git hook that
  calls that same command. A shared plugin should not ship a command-matching agent hook into other
  people's repositories.

## 6. Recommendations for proposal 18

1. **Manifest fields.** Keep `id`, `stage`, `catches`, `scope`, `run` (argv, as Rails `step` and
   pre-commit `entry`+`args`), `timeout_s`, `measured`. Add `always: true` for checks that run
   regardless of scope (pre-commit `always_run`), and a top-level `full_triggers` list (Turbo
   `globalDependencies`, Vitest `forceRerunTriggers`). Make `measured` an object
   `{ "s": 1.6, "date": "2026-11-01", "host": "win" }` so the runner can warn when a run exceeds
   it (Bazel's "as tight as you can"). Drop nothing for lack of prior art: `catches` is new and
   is the admission rule's evidence. Optional `owner` only if consumers ask; no source has one.
2. **Selection rules.** (i) Pre-push range from Git's stdin lines; all-zeroes remote object means
   "new ref": diff against the merge-base with the remote default branch, and if that is unknown,
   run every pre-push check (Turbo's shallow-checkout rule). Deleted refs (all-zeroes local) run
   nothing. (ii) Pre-merge range: `--base REF`, default merge-base with `origin/main`; never the
   working tree (153 item 6; Nx's "head is your current file system" default is the thing to
   avoid). (iii) Default `full_triggers`: `package-lock.json`, `package.json`, `scripts/gates.json`,
   `scripts/gate.mjs`, `.githooks/**` (Turbo root-config rule; Vitest default). (iv) Paths are
   prefix or glob matched against repo-relative POSIX paths; no regex (GHA, lefthook).
3. **Timeout defaults.** Runner-enforced per check: pre-push 10 s, pre-merge 120 s (proposal's
   values; inside Bazel's short 60 s / moderate 300 s classes). Kill the process tree
   (`taskkill /T /F` on Windows [probe]; process group on POSIX, unverified), spawn with stdin
   `ignore`, `CI=true`, `GIT_TERMINAL_PROMPT=0` (unverified here; Git docs not fetched for it),
   and a fresh `mkdtemp` as `TMPDIR`/`HOME` for test checks (Bazel `TEST_TMPDIR`). Outcome `timeout`
   when the runner killed it, `infrastructure error` for spawn failure or missing tool, never
   `pass` (Bazel: "must not report the test as passing after sending a signal"). Separately,
   every `node --test` invocation in pre-merge passes `--test-timeout` (default is Infinity) as a
   second line, not the bound.
4. **Test cleanup rule** (151, recycle-bin hang): test-created temp dirs are removed with
   `rmSync(..., { recursive: true, force: true })`; no test or check calls an OS-trash or shell
   API. Add as an admission rule: "cannot prompt" means no shell file operations without
   `FOF_NO_UI`-equivalent, no stdin reads (Bazel).
5. **What to ship to consumers.** Ship guidance plus the runner pattern (`gates.json` schema,
   `gate.mjs` reference) and **no agent hook in the plugin** (Claude: plugin agent hooks fire in every
   enabled session; `if` is best-effort; 153). For a consumer that wants enforcement, the
   guidance offers two project-scoped options that call the same `gate.mjs`: a Git pre-push hook
   via `core.hooksPath` (judges the pushed refs, exact by construction) and, optionally, a
   project `Stop` agent hook (`gate.mjs pre-merge`, exit 2 on fail) in `.claude/settings.json` /
   `.codex/hooks.json` (Claude best practices; lefthook `ai` does this generation). Do not use
   `PreToolUse` command matching for gating anywhere.
6. **Agent guidance wording.** `tkt-work`/`implement` cite `gate.mjs pre-merge` output (command,
   per-check time and outcome class) as close evidence; AGENTS.md names `gate.mjs` as the one
   check command (AGENTS.md sample, Rails `bin/ci`). Open decision 1 in the proposal (before
   `tkt close`) matches the Stop-hook "when it's done" model better than "before every push".

## Disagreements and unverified

- Claude's components page advises plugin agent hooks for rules that "must hold every time"; this
  note recommends none in a shared plugin. The difference is ownership of the rule (section 3.2).
- Nx and Turbo moved to task-level selection only recently (Nx 24; Turbo behind a future flag);
  older docs and blog posts describe package-level selection.
- Node orphan behaviour on POSIX, the mechanism behind Windows `child.kill()` ending the
  grandchild [probe], `GIT_TERMINAL_PROMPT`, and portability of skill-scoped agent hooks to Codex, Kiro
  and agy were not verified. No lefthook `timeout` option appears in its configuration doc
  listing; absence from a listing is not proof. Bazel and Buck2 target-determination claims are
  from READMEs, not exercised. pytest-testmon's README fetch was a stub; its site was used.

**Unknowns:** whether consumers' gate scripts (tagalog-helper `commit-scope.json`, philippines-trip)
fit the proposed fields without an `owner` or per-area `stages` list; the real per-check timings
on Linux; whether a project `Stop` agent hook running a 2-minute pre-merge is tolerable in practice
(no source gives a budget for turn-end agent hooks beyond the 600 s default).
