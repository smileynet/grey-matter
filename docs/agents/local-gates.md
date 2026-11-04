# Local gates

Where a project's checks run, and what may block a commit, push, merge or release. Decided in
[proposal 18](proposals/18-three-stage-verification.md); terms (**Git hook**, **agent hook**,
**stage**, **speed / stability phase**) as ruled in the [glossary](../../GLOSSARY.md#verification-terms).
Which tier a question needs is the [test-environment ladder](test-environment-ladder.md); this doc
says when each check runs.

Every check runs on the owner's machine first. A check that taxes every commit or push taxes the
whole life of the project, so the default is fewer, faster, scoped checks.

## Phase: speed until the owner declares stability

A project's `AGENTS.md` carries one line, `Verification phase: speed` or
`Verification phase: stability`. `init-project` writes `speed`. Only the owner changes it, when
they choose release stability over iteration speed; a tag, a store build or an early release does
not switch it. Agents may suggest the switch (persisted user data, outside users) but never infer
it. With no line, assume speed and report the gap.

| | Speed (default) | Stability (owner-declared) |
|---|---|---|
| Entry point | one `check` command (npm script, `just`, `mise`, `make`, `bin/ci`) | `gate.mjs <stage>` over `gates.json` |
| Runs | tier 0 (format, lint, typecheck, data-file parse); unit tests only where someone has been wrong or the logic is tangled; one headless smoke that boots the app or steps the game loop | adds a regression test per shipped bug fix, migration tests over old save versions, the pre-release stage |
| From day one | a round-trip test for anything persisted: saves, schemas, wire formats | same |
| Budget | `check` under 60 s warm | pre-push 30 s, pre-merge 5 min, pre-release none |
| Who runs it | the agent, before pushing finished work, citing the output at close | as below |
| Not yet | Git hooks, agent hooks, hosted CI, coverage targets, a device matrix, tests of prototype code | hosted CI only as in [Hosted CI](#hosted-ci) |

## The three stages (stability)

| Stage | Question | Runs | Budget | Enforced by |
|---|---|---|---|---|
| pre-push | Would this push break whoever pulls or installs now? | tier 0 invariants on consumer-facing files, scoped to the pushed paths | 30 s total, 10 s per check; 0 s when no scope matched | an opt-in Git pre-push hook per clone |
| pre-merge | Does this change work before it joins the trunk? | tiers 0 to 2 for the changed areas; a tier 3 or 4 smoke only when its scope changed | 5 min total, 2 min per check | the agent, before the push that carries a ticket's code, citing the output at `tkt close` |
| pre-release | Does the release work where users run it? | every check in every stage, plus the release artifact on every OS, real installs, simulators and devices | none; once per release | the `release` skill, as receipts |

A check not run is "not run", never a pass. Agent and LLM reviews take minutes and vary run to
run: they run on demand at pre-merge, never in a Git hook. An agent runs a stage expected to take
over a minute in the background and waits for it, never as a long foreground call.

## Discovering required checks

Before a dependent commit, push, deploy or publish, follow the adopting project's declared
verification phase and required commands. With no phase line, use the existing speed default
and report the gap. In speed phase, run its one documented `check`
command. In stability phase, run the declared `gate.mjs` stage. A project that documents only
individual commands has no implied aggregate: run every command it marks required and retain
each result. A missing required command or executable, timeout, nonzero exit, or incomplete
tool result is unresolved, not green; identify the owner and stop the dependent
mutation. Read the completed result before scheduling that action. Independent read-only work
may continue. Optional probes and observations are reported separately and do not block.

| Adopter declaration | Observed result | Dependent mutation |
|---|---|---|
| Speed/default phase with one aggregate `check` | Exit 0 and complete output | May proceed; record command and result |
| Stability phase with declared stage | Stage passes all selected required checks | May proceed; record stage and result |
| Only individually documented required commands | Every command completes with exit 0 | May proceed; record each result |
| No required command is documented for the declared or default phase | Required gate is missing, not run | Stop; identify the project owner |
| Any required command fails, times out, is unavailable, or returns incomplete output | Failure or unresolved gate | Stop before dependent mutation; record owner and diagnostic |
| Optional observation is unavailable or reports a finding | Optional finding, not a required gate | May proceed; report it separately |

The caller owns this sequencing contract regardless of shell or tool: wait for the actual
command completion, classify its exit/structured result, retain the diagnostic, and schedule a
dependent mutation only after a complete passing result. Shell fail-fast flags alone do not
establish this for asynchronous tool calls.

`SKIP=<id>` is for a failure shown to exist already on `origin/main`, not one the push introduces;
name the skipped id and why in the ticket's close evidence or the commit message.

### Artifact safety and host discovery

The `artifact-hygiene` check runs only disposable, Git-scoped artifact fixtures when
their inspector or tests change. Keep its staged-source fidelity, read-only behavior,
explicit policy, symlink and incomplete-coverage safety assertions blocking.

Whole-host footprint discovery is on-demand, including at release time. Run
`node --test scripts/inspect-footprint.test.mjs` only when host integration evidence
is requested; it invokes platform tools and machine-wide open-file discovery.
It is listed in `not_gated`, so no `SKIP` override is needed for normal delivery.
This does not establish a macOS runtime pass or resolve the scan-runtime cause.
Ticket 175 retains the deferred scanner improvements and host diagnosis.
An actual cleanup still needs fresh target-specific preservation evidence under the
artifact-hygiene skill; optional scan results do not authorize deletion.

### Home-path privacy check

Keep one cheap blocking check for home paths in added text from the outgoing commits.
Historical paths in unchanged lines do not block unrelated work, including edits elsewhere
in the same file. The check examines each commit, so removing a newly introduced leak in a
later commit does not hide it from the public-history guard. Renames preserve old evidence;
for merges, the guard scans resolution text newly added against all parents. There are no filename exemptions
that let new leaks enter historical evidence files.

Runner version 4 supplies `GM_GATE_RANGES`: JSON arrays of Git revision arguments for
the exact tip being checked. Existing refs use the remote tip as their base; new refs
exclude known commits on the selected remote. Multi-ref pushes carry each tip's own
ranges. An unknown/invalid range is an execution error, never a clean scan.

Standalone `node scripts/check-home-path.mjs --base REF --head REF` checks committed
changes; without a base it uses the origin/main merge-base, or reachable history if
there is no remote baseline. `--all` is a whole-tree inventory at the selected head, not a push
requirement. The old test asserting that this machine's entire checkout is clean is
retired. Disposable-history fixtures stay in the existing source-scoped pre-merge suite;
do not add another pre-push suite or a native-platform requirement for this guard.

**Pre-commit is not a stage.** On trunk a commit integrates only when pushed, so pre-push judges
everything a pre-commit check could. A Git pre-commit hook fires on every `tkt new`, `claim` and
`close` and judges a staged index that can hold another session's work. A project may keep one
only as formatter tooling: it fixes staged files in about a second, never blocks, and sits outside
`gates.json`.

## Admitting a check

A check enters a stage only with all of:

1. **Catches** one named failure that has happened, often enough to earn its time.
2. **Scope**: repo-relative path prefixes (`assets/saves/`, `scripts/deploy`). Out of scope, it does
   not run. Dependency pins and the gate's own files go in `full_triggers`, which run the whole stage.
3. **Measured** on this host, dated, inside the stage budget.
4. **Bounded by the runner**: the runner owns the timeout and kills the process tree; stdin closed,
   `CI=true`, a fresh temp dir. Killed is `timeout`; a missing tool is `infrastructure error`;
   neither is a pass.
5. **Cannot prompt**: no stdin reads, OS trash or credential prompts.
6. **Green on every supported host**, or skipped there with a stated reason. Quarantine a flaky check
   with a ticket naming the stage it returns to; never retry to green.

Commit the candidate first, then refresh selected timings with
`node scripts/gate.mjs pre-merge --base <start-ref> --record`. It updates passed checks' `measured`
objects with seconds rounded to 0.1, the local calendar date and `win`/`mac`/`linux`, preserving
other UTF-8 manifest bytes. Failed, skipped and timed-out checks retain their previous measurements.
For multiple pushed tips, a check records its largest duration only when every checked tip passes.
Detected manifest edits during the run leave the newer file untouched and make recording fail.

Over budget moves a check one stage later; budgets are never raised. A check that catches nothing
over three releases moves later too. Docs, tickets and art match no scope and run nothing.

## Manifest and runner

grey-matter keeps the reference files: [`scripts/gate.mjs`](../../scripts/gate.mjs) (version line at
the top), [`scripts/gates.json`](../../scripts/gates.json) and
[`.githooks/pre-push`](../../.githooks/pre-push). A stability project **vendors** copies: it commits
its own `gate.mjs`, `.githooks/pre-push` and `gates.json`, so its checks change only when it commits
a change. A clone opts in with `git config core.hooksPath .githooks`; there is no installer. A
project already using lefthook, husky or pre-commit adds a pre-push job to that manager instead, since
`core.hooksPath` replaces the whole Git hook directory; lefthook needs `use_stdin: true` or it hangs.
`conformance-audit` reports a vendored `gate.mjs` behind the reference version and offers the update;
nothing applies it automatically.

A worked example, shaped on ticket 152: tagalog-helper's Git pre-commit hook ran 32 stages on every
commit, docs and tickets included, for 6 to 8 minutes, about 250 s of it native suites that matter
only when persistence code changes. Its areas (decks, the mirrored engine, native persistence) map
onto checks like these; the paths, commands and times are illustrative, not its real values:

```json
{
  "full_triggers": ["requirements.txt", "package-lock.json", "scripts/gates.json", "scripts/gate.mjs"],
  "checks": [
    { "id": "deck-schema", "stage": "pre-push", "catches": "a deck file that no longer parses, so the app crashes on load",
      "scope": ["decks/"], "run": ["python", "scripts/check_decks.py"], "timeout_s": 10,
      "measured": { "s": 0.8, "date": "2026-10-31", "host": "mac" } },
    { "id": "engine", "stage": "pre-merge", "catches": "the Python and TypeScript scheduling engines disagreeing",
      "scope": ["engine/", "web/src/engine/"], "run": ["python", "-m", "pytest", "tests/engine", "-q"], "timeout_s": 120,
      "measured": { "s": 21, "date": "2026-10-31", "host": "mac" } },
    { "id": "native-persistence", "stage": "pre-merge", "catches": "a Swift persistence change that loses saved progress",
      "scope": ["ios/Persistence/"], "run": ["python", "-m", "pytest", "tests/native", "-q"], "timeout_s": 120,
      "measured": { "s": 95, "date": "2026-10-31", "host": "mac" } }
  ]
}
```

A docs or ticket push then runs nothing (tagalog-helper's own scoped fix brought docs commits to
0.3 s), and the native suites run only when persistence code changes.

## Hosted CI

Only when the user explicitly asks, or for a need no local machine meets: an OS the owner has no
machine for, a clean-machine check before release, contributors outside the trusted circle, or
signed provenance. Prefer manual dispatch; never on every push.

## Scratch from checks

The runner gives each check a fresh temp dir and removes it. A check or test that keeps run
directories, screenshots or simulator builds follows
[repository-artifact-hygiene](../../skills/meta/repository-artifact-hygiene/SKILL.md#while-you-work):
keep the latest three, never every run.

## Changing a gate is a reversible tooling change

Adding, scoping, moving or removing a check is reversible: the owner's decision closes the
discussion. Don't open pilot, ledger or decision tickets for it, and don't run multi-stage evidence
on it; tagalog-helper stalled five tickets deep on a change that took one commit. Reserve heavy
evidence for user data, acceptance and release risk. Other skills point here rather than restate it.

A Git hook failing on a check unrelated to the change is a gate-scope bug. Propose moving that
check to a later stage; investigate its underlying failure outside the hook instead of debugging
or adding a time box to unrelated work there.

## Findings

For `retro` and `conformance-audit`, each needs judgment, never an automatic fix:

- a Git hook or check over its stage budget, without a scope, or guarding a failure no longer seen;
- a blocking Git pre-commit hook, or one that runs a full suite;
- an agent hook used as a gate, including one shipped in a plugin;
- hosted CI on every push or pull request without one of the needs above;
- a vendored `gate.mjs` behind the reference version;
- a missing `Verification phase` line, or stability-phase checks in a speed project;
- verification scratch that keeps every run.
