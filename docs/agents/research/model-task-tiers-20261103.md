# Fast tiers for routine text tasks

> The spike harness this doc cites was removed from `scripts/` (ticket 209). Paths below are as of commit `e35d8a8`; see [rerunning the model-tier spikes](model-tier-spikes-rerun.md).

Date: 2026-11-03
Ticket: [170](../../../.tickets/170-spike-model-tier-docs-triage.md)
Status: native calls and one recorded blind review per cell are complete; results and evidence limits follow below.

Frozen protocol used for the native calls: [model-task-tiers-protocol-20261103.md](./model-task-tiers-protocol-20261103.md). Its bytes remain unchanged at the recorded protocol SHA-256.

Human-readable summary: [Fast text-task model results](../../model-tier-spike-results-2026-11-03.md).

## Question and scope

Compare a lower-cost profile with each provider's native default on one fixed
documentation rewrite, one ticket-triage recommendation, and one harness
changelog classification. This is an exploratory single run per cell, not an
estimate of general model reliability or proof of “no quality loss.” The only
eligible cohorts are Claude Code, Codex CLI, and Kiro CLI. The six Google/Agy
cells remain blocked by the workstream security stop; do not run a help probe,
preflight, model call, or replacement cell.

The three synthetic fixtures contain no real request, reporter, ticket, user
message, or private repository change. Their bytes and this protocol are frozen
before any call. Fixture JSON supplies the task, source facts, and scoring
dimensions; the answer key is stored privately until scoring is complete.
Frozen fixture SHA-256 values are `24EA54EAA73ECF773199A7A4232AB807F94F5F72BBBD478E591B46F4D34CC5F0`
(doc rewrite), `913BDE4F8434EDB55ADE019E70263A6FE991AE6C6BE72434B77B22CA76BC51BE`
(triage), and `A7719B052FCB1390657D598A1C23D0B06474C4B25CE2ECB2624FBB494009C91F`
(changelog classification). The private answer-key SHA-256 is
`975DDA95E186A4735915D4647FC331D068DCE6DDF9F25F019FCAB9ED9DFD6634`.

## Frozen matrix and budgets

| Provider | Lower-cost requested profile | Default profile | Cells |
|---|---|---|---:|
| Anthropic / Claude Code | `claude-haiku-5-5` | omit model flag | 6 |
| OpenAI / Codex CLI | `gpt-6-luna` | omit model flag | 6 |
| Amazon / Kiro CLI | `qwen3-coder-next` | omit model flag | 6 |
| Google / Agy | blocked by workstream hold | blocked by workstream hold | 0 |

There are three tasks per profile and one attempt per cell: 18 planned attempts,
with no retry. A request or actual model identity is not proof of the served
identity; record actual identity only when native output reports it. Record
usage and cost only from native output. Missing values remain unknown. Do not
run usage or quota probes. Each call has a 120-second ceiling. Claude calls have
a $0.10 native per-call cost ceiling and a $0.60 planned ceiling across its six
cells; a cost field that is absent remains unknown, not zero. If any provider
reports a usage limit, stop that provider's cohort and classify untouched cells
as not attempted. Never substitute another provider or tier.

The requested Claude model is the explicit canonical identifier
`claude-haiku-5-5`, not the `haiku` alias: the earlier review trial requested
`haiku` but native metadata reported Sonnet 5.5. The implementation trial's
retained evidence reports `claude-haiku-5-5` for the canonical Haiku profile.
Default profiles omit the model flag. Before releasing a cell, the parent must
confirm the pinned local executables and candidate availability against the
current recorded catalog. A changed executable hash or unavailable model stops
that provider's cohort; do not select a replacement.

No model, effort, account, permission, provider, or global configuration changes
are permitted. Do not edit real tickets or publish real messages. Prompts carry
only the supplied synthetic source and task. No credential or user home path may
enter a prompt or promoted report.

## Invocation and isolation

The dedicated Node controller uses absolute, hash-pinned executable paths and
explicit argument arrays (`shell: false`). Plan mode creates a unique empty
temporary directory and freezes its absolute path, filesystem identity, and the
complete argv (including the matching cwd) into one JSON plan file. The parent
reviews the full plan and authorizes the SHA-256 of the exact plan file bytes.
Execution loads that same file with `--plan <absolute-path>`; it validates the
serialized inputs and passes its authorized cwd and argv unchanged to the
process. Before launch, the controller verifies the path still names the same
ordinary, non-reparse, empty directory. A native call also requires an
authorization receipt bound to the plan file hash, controller and protocol
hashes, independent critic acceptance, and the parent's release of the serial
native lease. Before writing that receipt, the parent reads the private answer
key and verifies its actual bytes against the frozen answer-key SHA-256 in the
plan. The controller requires `answerKeyVerified: true` and the matching key
hash in the receipt; it never opens or sends the key. The controller reserves
each provider/task/profile cell before launch; duplicate cells cannot be
retried. It captures stdout, stderr, native completion or failure, elapsed
time, requested/served identity, usage fields when present, and raw stream
hashes. Unused plan directories must be removed by their exact path after the
plan is abandoned; execution removes the used directory.

Claude runs with built-in tools disabled, MCP tools denied, and session
persistence off. Codex runs with user configuration ignored, the local `0.166.0`
CLI `--disable shell_tool` feature, and a read-only sandbox in an empty temporary
directory. The repository's pinned Codex reference lists this as a common
feature-disabling flag: "disable a feature (repeatable); same as
`-c features.<name>=false`." The official configuration reference describes
`features.shell_tool` as controlling command execution tools (accessed
2026-11-03). These are planned controls, not a fresh invocation validation.
The output event stream is
also checked for tool actions. Kiro runs non-interactively with no tools
pre-approved. These controls
do not establish that all harnesses omit tool schemas; any attempted or denied
tool action is recorded and kept separate from task quality. An empty temporary
working directory is outside the repository. Each run is a fresh process and
session. A timeout, missing terminal
event, explicit provider error, empty final answer, or infrastructure failure
is not a quality pass.

Kiro V2 may retain a session. The raw receipt records its ID only in private
evidence when native output emits it. After critic review, the parent should
delete only the exact measured IDs through the pinned V2 delete operation and
verify a complete before/after session listing that preserves unrelated IDs.
If an ID or complete listing is unavailable, record the exact limitation and
leave the session state unresolved; never use a default-source delete.

## Scoring protocol

Before calls, freeze the fixture hashes, prompt builder, rubric, answer-key hash,
and cell matrix. After each nonempty response, an independent scorer in a fresh
context receives only that task's source, scoring dimensions, private key, and
response. Provider, profile, executable, cell ID, and all other responses are
withheld. The scorer returns exactly this JSON shape:

```json
{
  "scorable": true,
  "scores": {"dimension-id": 0},
  "issues": [
    {"kind": "unsupported|omission|incorrect|format|unsafe", "key": "answer-key-item-id", "evidence": "exact response substring or empty for an omission", "reason": "brief explanation"}
  ],
  "summary": "one sentence"
}
```

For an explicitly unscorable response, `scores` is `null`, `issues` is empty,
and `summary` gives the reason; the envelope validates that state without
filling scores or inferring a failure.

Before dispatching any scorer, the parent reads the private answer-key bytes
again and verifies them against the frozen SHA-256. A mismatch halts scoring;
the grader does not receive unverified key bytes. Keep this verification
separate from model execution: the key is held out of all native prompts and
provider receipts.

The exact dimension IDs and definitions come from that fixture. Every score is
an integer from 0 to 2. Any issue evidence for a present claim must be an exact
substring of the response; omission evidence is empty and its key must name a
frozen answer-key item. The grader envelope binder attaches the actual reviewer
identity from the exact private dispatch/completion trace: dispatched task text,
canonical task name returned by the collaboration service, completion status,
and the completed response hash. The trace remains private and is bound by its
own hash. The binder checks consistency of the supplied trace but cannot
authenticate it; the audit must compare its dispatch input, canonical task
identity, completion metadata, and response hash with the actual collaboration
records. The binder also attaches trusted fixture, response, rubric, key, and
prompt hashes after review. It copies the semantic body byte-for-byte; it does
not invent missing fields, map aliases, or change a judgment. Invalid schema, missing fields,
unrecognized dimension/key, or inexact evidence makes the reviewer result
unscorable. There is no second attempt to improve a grade. Preserve the raw
review bytes and the validator result.

Each fixture has four scored dimensions, each 0–2. Its frozen answer key defines
the required fields and unsafe/unsupported claims. A cell passes only when all
four dimensions score 2 and there is no `unsupported`, `omission`, `incorrect`,
or `unsafe` issue. A profile qualifies for the tested task class only if all
three cells pass. Format errors are counted independently and still make a cell
fail the four-dimension bar; malformed but nonempty responses may receive
semantic scores. A profile result is `unscorable` if the native run failed or
the independent reviewer result is invalid. Report format, task quality, native
completion, and identity/usage as separate observations.

The rubric's per-dimension meanings are in each fixture file. In brief: the
rewrite must preserve the exact behavior and user benefit without unsupported
claims; triage must classify a reported but unreproduced failure as a bug needing
more information and not invent its cause; changelog classification must mark
the permission change as a new capability and security relevant, identify the
evidence as documented, and recommend verification before any guidance or
default changes.

## Interpretation

Report every cell and its outcome, elapsed time, native usage/cost when emitted,
and served identity when reported. Show the six-cell profile denominator and
three task-level outcomes. A lower-cost profile qualifies only if every task
passes its frozen bar, every reported served identity matches the requested
profile (or a documented native default), and cost/identity evidence suffices to
identify what was measured. Otherwise recommend keeping the current default for this
bounded task class. Even 18 successful cells do not establish broad reliability;
one observation per task/profile cannot estimate repeatability. No conclusions
may pool task classes, infer missing identity, treat missing usage as zero, or
count a blocked Google cell as a provider failure.

## Results (2026-11-03)

All 18 authorized Claude, Codex, and Kiro runs completed. The native receipts
record no errors or tool events. Each of the three synthetic tasks was run once
for each requested profile. The frozen pass bar is all four scores at 2 with
no issue; 7 cells passed and 11 failed.

| Provider and requested profile | Rewrite | Triage | Changelog classification | Passed | Total wall time |
|---|---|---|---|---:|---:|
| Claude Code, `claude-haiku-5-5` | Pass | Fail | Fail | 1/3 | 23.0 s |
| Claude Code, default | Pass | Fail | Fail | 1/3 | 17.9 s |
| Codex CLI, `gpt-6-luna` | Pass | Pass | Fail | 2/3 | 14.4 s |
| Codex CLI, default | Pass | Fail | Fail | 1/3 | 19.3 s |
| Kiro CLI, `qwen3-coder-next` | Pass | Fail | Fail | 1/3 | 27.3 s |
| Kiro CLI, default | Pass | Fail | Fail | 1/3 | 25.7 s |

No profile passed all three tasks. The documentation rewrite passed in all six
profiles. Changelog classification failed in all six, and triage passed only
for the Codex lower-cost profile.

| Provider and profile | Native usage reported across three runs | Native cost reported | Served identity |
|---|---|---:|---|
| Claude Code, `claude-haiku-5-5` | 6 `input_tokens`, 14,368 cached input tokens, 2,045 output tokens | $0.00289217 | `claude-haiku-5-5` |
| Claude Code, default | 6 `input_tokens`, 12,044 cached input tokens, 1,232 output tokens | $0.0914774 | `claude-opus-5-5` |
| Codex CLI, `gpt-6-luna` | 52,107 input, 21,760 cached input, 267 output tokens | Not reported | Not reported |
| Codex CLI, default | 53,257 input, 34,944 cached input, 241 output tokens | Not reported | Not reported |
| Kiro CLI, `qwen3-coder-next` | Context usage rose to 7.31% | Not reported | Not reported |
| Kiro CLI, default | Context usage rose to 2.77% | Not reported | Not reported |

The token and context values above are only the fields each CLI emitted. Cost
and served identity are unknown where the native output did not report them.
The Claude lower-cost profile was cheaper in this sample, but it passed only
one task. Codex lower-cost passed two tasks but did not report its served model
or cost. No lower-cost profile clears the all-task bar, and Codex and Kiro
identity evidence is incomplete. **Recommendation: keep the current defaults
for these task classes.** This sample does not establish that defaults pass
reliably or that any profile has no quality loss.

The six Google/Agy cells were not run under the workstream hold; they are not
provider failures. The 18 native calls produced no reported tool events,
native errors, or usage-limit stops. One observation per task/profile cannot
show repeatability or broad reliability.

An independent integrity audit checked the frozen packet, response, review,
and trace hash bindings and confirmed the 7-pass/11-fail tally. It did not
regrade the responses or authenticate collaboration records as a platform
export. Reviewer dispatch and completion evidence is a parent transcription;
no platform UUID claim is made. For review 09, the initial file write failed
and a same-reviewer recovery was recorded. The unchanged decision is recorded,
but it cannot be byte-compared with the absent first file.

Per-cell native usage, timing, cost, outcomes, and evidence hashes are retained
in [`t170-results-evidence-20261103.json`](./t170-results-evidence-20261103.json).
Private source and recovery artifacts are listed in the companion
[`t170-private-artifact-index.json`](./t170-private-artifact-index.json).

## Source basis

The rubric follows the repository's own contracts:

- The earlier review trial explicitly says its `haiku` request served Sonnet 5.5;
  the earlier implementation evidence records the canonical observed ID
  `claude-haiku-5-5`. These are observed study records, not a fresh account or
  availability probe. See the dated
  [review results](./model-tier-review-20261103-results.md) and
  [implementation evidence](./model-tier-implementation-20261102-evidence.json).

- The ticket-triage skill says an unverified claim cannot become `ready-for-agent`
  and missing real evidence is a `needs-info` signal. See
  [`triage/SKILL.md`](../../../skills/engineering/triage/SKILL.md).
- The namespaced tag convention distinguishes the triage state from the
  work-tracker frontier. See [`tkt-conventions.md`](../tkt-conventions.md).
- The harness-changelog skill distinguishes new capability, changed behavior or
  default, removed/deprecated, and security/permission changes, and marks claims
  as observed or documented. See
  [`harness-changelog/SKILL.md`](../../../skills/meta/harness-changelog/SKILL.md).
- Current advertised profile references are in
  [`models-and-usage.md`](../harness-surfaces/models-and-usage.md); the prior
  implementation and review trials show why requested and served identities,
  tool-policy outcomes, formatting, and semantic quality must remain separate.
- OpenAI's [Codex configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference)
  says `features.shell_tool` “Enable command execution tools”; this scope is
  also reflected in the pinned local
  [Codex 0.166.0 reference](../harness-surfaces/codex.md), which describes
  `--disable <FEATURE>` as repeatable and equivalent to `-c features.<name>=false`.

The private key, trial ledger, raw responses, and review receipts are listed by
basename and purpose in the companion
[private-artifact index](./t170-private-artifact-index.json). The key remains
private through scoring and independent audit; raw response text and reviewer
outputs are not promoted into this note.
