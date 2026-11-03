# Ticket 170 preparation audit

> The spike harness this doc cites was removed from `scripts/` (ticket 209). Paths below are as of commit `e35d8a8`; see [rerunning the model-tier spikes](model-tier-spikes-rerun.md).

**Scope:** preparation commit `2e607a7e1767d55791cccce9046dfacc4655bc8b`.

**Initial finding:** commit `2e607a7` needed revision before a native call. The
execution authorization mismatch is fixed in the renewed commit below. The
three tasks and answer key are synthetic, the six Google/Agy cells are blocked,
the provider limits are stated, and the retained offline run reports 5 tests
passed, 3 syntax checks passed, and a plan-only dry run passed. I verified the
frozen protocol, controller, fixtures, key, test, and envelope hashes against
the preparation evidence. No provider executable was invoked for this audit.

## Required revision: authorize the executed working directory and arguments

The parent authorization binds the complete plan hash at
[`spike-model-task-tier-t170.mjs`](https://github.com/smileynet/grey-matter/blob/e35d8a8cd117eec6bb0519c2fb8ba9f28a192b0f/scripts/spike-model-task-tier-t170.mjs),
where `buildCellPlan` chooses a predictable cell-specific path and builds
`plan.argv` with it. During execution, `runCell` instead creates a different
random `mkdtemp` directory and builds a new argv array containing that new path.
The authorization check compares its hash to the original plan; it does not
compare the actual `cwd` and argv with the authorized plan. The bytes sent to a
provider therefore are not the exact plan the parent authorized.

Keep the empty temporary directory and make it unique. Bind the directory and
the exact argv that will be executed into the parent-approved plan, then execute
those same values. At runtime, fail closed if the directory is occupied, is not
an empty ordinary directory, or otherwise differs from the authorized path.
Add an offline regression that drives the execution boundary with a harmless
fake executable and proves the observed process cwd and argv match the
authorization; it must make no provider call. The current 5 tests exercise
plan generation, parsing, and envelope validation, but do not call `runCell` or
prove that authorization covers the actual spawn.

## Review observations

The three frozen fixtures cover the stated text tasks, with four objective
dimensions each. The private key gives concrete expected behavior and
unsupported claims. The protocol correctly limits the result to one run per
cell, reports requested and served identity separately, keeps cost unknown when
native output omits it, and distinguishes task quality from tool-policy and
process failures. The launch plans use explicit argv arrays, hash-pinned
executables, closed stdin, fresh temporary directories, bounded time, and
provider-specific restrictions. The key and raw study evidence remain private.

The binder copies semantic review fields unchanged and verifies their schema,
candidate hashes, dispatch/completion identity equality, and response hash.
Those checks establish consistency of the supplied trace; the retained trace
must still be checked against the actual collaboration dispatch and completion
records during scoring. Its synthetic unit-test trace does not establish that
external provenance on its own.

Before a later native release, the parent should recheck the exact executable
and sibling-host hashes and model availability against the retained current
catalog. The source note explicitly treats the earlier observations as
historical evidence, and no new model or provider call is needed for that
preflight.

## Revisions and acceptance

### Renewed review of commit `5044392703fefa97f4bbfb7ce2e9c71a54d600d7`

**Verdict: the flagged execution-plan gap is fixed; preparation is accepted for
the parent's native-release decision.** The updated plan is materialized before
authorization with a unique empty directory, recorded filesystem identity, and
the complete argv. `loadPlanFile` hashes the exact plan bytes; `readAuthorization`
matches that hash and the controller/protocol hashes. `validatePlan` rebuilds
the expected argv from the frozen inputs. Before execution, `verifyPlannedCwd`
checks that the path is still an empty ordinary directory with the recorded
filesystem identity. `runCell` passes that same `plan.cwd` and `plan.argv` to the
process; it removes the directory only if its recorded identity still matches.

The revised test runs `runCell` against a harmless fake process and checks the
actual child cwd, complete argv and `shell: false` against the authorized plan.
It also tests a changed authorization, a nonempty directory and a junction.
The test changes no provider state. No provider CLI or model was called in this
review.

Independent checks on this worktree:

- `node --test scripts/spike-model-task-tier-t170.test.mjs`: **pass**, 7 tests,
  0 failures, 0 skips, 1.806s.
- `node --check scripts/spike-model-task-tier-t170.mjs`: **pass**.
- `node --check scripts/spike-model-task-tier-t170.test.mjs`: **pass**.
- `node --check scripts/t170-review-envelope.mjs`: **pass**.
- `git diff --check`: **pass**; worktree clean before this audit update.

The retained revision evidence file has SHA-256
`A76DD06982BE703C7218CDF2DEAB90BF533E1D6B68192A7CE0F3F40D0436E2F5` and
records six successful commands, including 7/7 tests, three syntax checks,
`git diff --check`, and a plan-only dry run. Independently recomputed hashes
match the revised protocol (`64AB145A...`), controller (`C77B5616...`), tests
(`8D1786FB...`), artifact index (`22A8F90F...`), three fixture files, grader
prompt, envelope, and private answer key. I also independently verified the
vendored Codex executable hash `9D563EE4...` and sibling host hash
`977C1F01...`; neither was invoked. The local `models_cache.json` is 459,986
bytes, fetched for CLI 0.166.0 at 2026-11-03 09:14 UTC, and lists `gpt-6-luna`
with `visibility: list` and `supported_in_api: true`. No CLI catalog command was
run. Other providers' executable hashes and candidate availability must still
be checked by the parent before their cells are released.

The local Codex 0.166.0 reference documents `--disable <FEATURE>` as repeatable
and equivalent to `-c features.<name>=false`; its model catalog confirms the
requested Luna ID. The controller's `--ignore-user-config`, read-only sandbox,
shell-tool disable and package-owned executable/host pair are consistent with
that reference. The report correctly keeps actual served identity, usage and
cost unknown unless native output emits them. It blocks Google/Agy and does not
recommend a model change from a one-shot set. The report also now states that
the envelope binder validates supplied dispatch-trace consistency but does not
authenticate the trace; a later study audit must compare trace evidence with
actual collaboration records. The worker's private trace files remain subject
to that review.

The controller hashes and rechecks the installed Codex launcher and companion
host, and resolves them from the observed 0.166.0 package layout. The installed
package metadata also declares `codex-resources` and `codex-path`; those support
files are trusted as part of the already installed package and are not covered
by the controller's two binary hashes. I observed the layout, package version,
Luna model entry, and launcher/host bytes. I did not hash every support file or
establish which helpers a read-only invocation uses. The report calls this the
selected installed layout with a two-binary pin, not a cryptographically pinned
complete package. The parent must confirm the required support files remain
present at execution; a missing required file blocks that Codex cell. The
requested read-only mode and shell-tool disable are recorded as invocation
settings, not an adversarial OS security boundary.

The filesystem identity checks narrow ordinary path replacement, but they do
not establish an operating-system security boundary against a hostile process
racing between the last check and process launch. This remains a bounded local
experiment using synthetic content; no stronger isolation claim is made.

This audit accepts only the preparation/controller for a parent-controlled
native-release decision. The parent must issue a new authorization bound to
these exact hashes, confirm the current pinned executable/model availability
for each provider, retain the actual review dispatch and completion records,
and release the serial native lease explicitly. This critic did not release it.

### Renewed hermeticity review of commit `74e8d3a4fc5285c927f2a1a9d5ca98255aab309f`

**Verdict: accepted for the parent's native-release decision.** The source
changes in `c2f3c44087d6c9845a6c26c2b81825f1acc6730b` remove the unit test's
dependency on the private answer-key file and route execution-boundary tests
through the exported `main(argv)` path, parsing the persisted plan and
authorization arguments. The controller no longer reads the answer key. Its
release receipt now requires an explicit parent verification flag and the
frozen key hash; the parent must still check the private key's actual bytes
before setting that flag. The fake authorization in tests exercises parsing
and refusal behavior only; it is not evidence of parent verification.

I inspected the detached source checkout directly and confirmed the private
answer-key file and its containing private directory are absent. I reran the
test suite there: **pass**, 7 tests, 0 failures, 0 skipped, 1.323s. Syntax
checks for the controller, its test, and review-envelope script all passed;
`git diff --check` on the source commit passed. The 7th test reaches
`main(["--execute", "--plan", ..., "--authorization", ...])`, confirms an
unverified receipt is refused before the fake child runs, then confirms the
actual fake child's cwd, argv, and `shell: false` match the authorized plan.
The refusal cases also use `main` and cover a changed plan, occupied directory,
and junction. No provider process or model was invoked.

Independently recomputed source hashes are controller
`0B57B14603D72E650B5A61782EFA83E422959FF5E256BBF7CECF05A57D305469`, test
`D713B3FD82FA08D5C77489D945A1E79C259979E11020B082E909C9F6AA67D866`, and
protocol `D49E8C8C9B3BFE4E6CB246F94A12BAA22856EC9D0B65DE5225C4C2A3067DAA19`.
The three frozen fixture hashes match the controller constants. The exact
reviewed branch head adds only the private-artifact index entry for the fresh
checkout evidence; its index SHA-256 is
`F37BEDC909C00FC3F04A272FD917ED621F4118C5A4FF740F7EF1705424EC86A4`. The
retained hermetic evidence JSON hash is
`9246AFE268CAFF07A26C3107324BC3EBEC05580ADB3C7EA011084B620443EEAD`.

This review validates offline test hermeticity and the preparation/controller
only. Parent verification of the held-out answer-key bytes, actual host and
provider/model availability, and retained real collaboration records remain
prerequisites to any native release or scoring; this critic did not release
the serial lease.
