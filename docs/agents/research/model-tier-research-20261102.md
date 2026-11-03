# Model tier research results

**Status: all 18 calls captured; 13 have valid blind scores (11 pass, 2 fail), and 5 are unscorable.** Two earlier pass receipts lack retained reviewer dispatch/completion provenance; three more receipts failed validation. Ticket #169 compares
three read-only research tasks under each harness's low-cost profile and native
default. All cells completed without retry; all six Claude outputs report model
identity. Codex and Kiro outputs do not report actual identity. Their responses
with valid blind grades remain requested-profile observations; no model-level
comparison or adoption claim is supported. Google and Agy were not
invoked. The first-wave protocol, authorization and measurement ledger are
preserved at their original hashes in private scratch. The active continuation
protocol SHA-256 is
`927726a9190c0612d5c562e1fe44c95b14f7d1842ca87b5402faf0e17b37ebb0`.

## What the comparison measures

The same eight-file synthetic source packet supports three tasks: discover all
callers of an exported function (including alias and dynamic imports), summarize
a policy module, and answer a question from a cited document. Exact prompts and
inputs are in the [task manifest](../../../scripts/fixtures/model-research/t169/tasks.json)
and [source packet](../../../scripts/fixtures/model-research/t169/source-files.json).
The held-out answer key remains private; receipts bind its hash without
including its contents. Each session received one prompt and the same eight
sources.

The grader records deterministic candidate evidence only: mentioned paths,
citation path/heading presence, and a whitespace-token word count. These checks
do not award semantic passes. A fresh independent reviewer manually checks each
response against the source packet and held-out rubric in a blinded context.
Mentioning a path alone does not establish that it is a caller.

A profile passes this small fixture bar only if all three one-shot task scores
pass both native execution checks and independent manual review. Otherwise the
recommendation is to keep the native default. A semantic pass with unreported
Codex/Kiro identity remains a requested-profile observation and cannot support
an adoption recommendation. These are directional examples, not a reliability
or broad coding benchmark. The native default can differ in both model identity
and reasoning effort, so any difference will be reported as an
invocation-profile result, not attributed to model identity alone.

## Candidate profiles and prior evidence

The candidates are Claude `claude-haiku-5-5`, Codex `gpt-6-luna`, and Kiro
`qwen3-coder-next`. In each default profile, the runner omits both model and
effort overrides. A prior #168 observation requested Claude's `haiku` alias,
but the native response reported Claude Sonnet 5.5. This protocol therefore
uses the documented canonical Haiku ID and requires native output to report the
served identity. Codex and Kiro may retain successful responses when identity
is absent, but those are requested-profile observations only; they cannot
support a model-level comparison or adoption recommendation.

The #167 adapter inventory captured the current harness versions and selected
help output on 2026-11-03 at 05:43 UTC. Its raw inventory SHA-256 is
`4163dd66914448a75a99baf6eecdf0d6870cb256e46c1b5f036ca1a1511b0a57`. Selected
help hashes, model candidates and exact argv are bound in the private protocol.
The controller's argv recording test preserves empty safety arguments and
ensures the prompt remains one argument.

All six Google/Agy cells are security-blocked by the workstream decision; no
replacement provider will be tried. Two prior Google model catalogs disagreed
on the Flash effort suffix. That conflict remains unresolved and is not needed
to execute the three permitted providers.

## Execution evidence (2026-11-03)

Blind review was attempted for all 18 outputs. Eleven valid scores passed and
two valid scores failed. Five outputs are unscorable; they are not counted as
model failures or passes. Claude's native defaults reported Opus 5.5 and the cheap profile
reported Haiku 5.5. Codex and Kiro completed all six requested profiles but did
not report actual identity. The first caller cells were initially held as
`identity-unreported`; a reviewed, hash-bound continuation allowed the remaining
five cells per provider. All twelve Codex/Kiro receipts record
`actualModel=null`, `identityUnreported=true`, and `profileComparable=false`.

| Harness | Requested profile | Task | Native result | Actual identity | Time | Reported usage or cost |
|---|---|---|---|---|---:|---|
| Claude | Haiku 5.5 | Caller discovery | Unscorable: reviewer provenance unverified | Haiku 5.5 | 8.139 s | $0.001527 list estimate |
| Claude | Native default | Caller discovery | Unscorable: reviewer provenance unverified | Opus 5.5 | 6.562 s | $0.036134 list estimate |
| Claude | Haiku 5.5 | Module summary | Blind review fail: 101 words; unsupported claim | Haiku 5.5 | 11.010 s | $0.001653 list estimate |
| Claude | Native default | Module summary | Unscorable: review evidence failed validation | Opus 5.5 | 8.480 s | $0.036270 list estimate |
| Claude | Haiku 5.5 | Cited answer | Unscorable: review receipt failed schema validation | Haiku 5.5 | 5.251 s | $0.000851 list estimate |
| Claude | Native default | Cited answer | Blind review pass | Opus 5.5 | 6.930 s | $0.031826 list estimate |
| Codex | `gpt-6-luna` requested | Caller discovery | Blind review pass | Unreported | 6.381 s | 18,599 input / 108 output tokens; cost unknown |
| Codex | `gpt-6-luna` requested | Module summary | Blind review pass | Unreported | 5.362 s | 18,586 input / 94 output tokens; cost unknown |
| Codex | Native default | Caller discovery | Blind review pass | Unreported | 8.478 s | 19,289 input / 129 output tokens; cost unknown |
| Codex | Native default | Module summary | Blind review pass | Unreported | 6.573 s | 19,274 input / 129 output tokens; cost unknown |
| Codex | `gpt-6-luna` requested | Cited answer | Blind review pass | Unreported | 5.042 s | 18,579 input / 51 output tokens; cost unknown |
| Codex | Native default | Cited answer | Blind review pass | Unreported | 6.161 s | 19,277 input / 51 output tokens; cost unknown |
| Kiro | `qwen3-coder-next` requested | Caller discovery | Blind review pass | Unreported | 6.526 s | Context-use metadata only; cost unknown |
| Kiro | `qwen3-coder-next` requested | Module summary | Blind review pass | Unreported | 10.268 s | Context-use metadata only; cost unknown |
| Kiro | Native default | Module summary | Blind review pass | Unreported | 6.930 s | Context-use metadata only; cost unknown |
| Kiro | Native default | Caller discovery | Unscorable: reviewer returned no actual callers | Unreported | 9.705 s | Context-use metadata only; cost unknown |
| Kiro | `qwen3-coder-next` requested | Cited answer | Blind review fail: required heading not cited | Unreported | 4.653 s | Context-use metadata only; cost unknown |
| Kiro | Native default | Cited answer | Blind review pass | Unreported | 5.510 s | Context-use metadata only; cost unknown |

Claude's six list estimates total USD 0.108260 against the USD 0.60 ceiling.
Codex reported token counts but no cost. Kiro reported context-use and
turn-duration metadata, not tokens or credits; its cost remains unknown. These
wall times include process startup and host load, so they are observations, not
pure model latency. Raw responses, full receipts, blind-review candidates,
identity crosswalk and first-wave ledger remain private in the evidence bundle.

## Safety, limits and classification

The controller uses `spawnSync` with an argv array, `shell: false`, empty closed
stdin, a fresh empty directory outside the repository, and a 120-second timeout.
Codex uses an ephemeral, read-only session with user config ignored and the
documented skip-repository-check flag. Claude uses safe mode, strict empty MCP,
no tools, denied MCP tools, plan permission, no session persistence and a
USD 0.10 per-call ceiling. Kiro uses V2, non-interactive mode, and an empty
trusted-tool list; the protocol does not claim its no-tool catalog is disabled.
Executable and Codex sibling hashes are pinned in the runner.

The cap is six calls per provider, one per task/profile pair, no retries, and a
maximum 120 seconds each. Claude's planned total cap is USD 0.60. Other native
costs are unknown; a reported usage limit or reset stops that provider, without
fallback. A timeout, native error, missing terminal success, empty text,
unreported usage, identity mismatch, malformed output, or exceeded budget holds
the provider for parent review and cannot count as a pass. Claude also holds on
unreported identity. Successful Codex/Kiro responses with unreported identity
can be graded semantically, but remain non-comparable. Startup failures consume
their planned cell. Captured raw output is private scratch
evidence and will not be promoted; private model reasoning is not collected as a
finding.

## Blinded scoring after capture

Each output gets a cryptographically random opaque ID. The parent keeps the
ID-to-cell mapping separately. A fresh independent reviewer context receives
one response at a time, in randomized order, with its candidate-evidence JSON,
the exact source packet and held-out rubric. The reviewer does not receive
provider, model, tier, invocation receipt, usage data or other responses. The
rubric and review receipt shape are frozen in the protocol before any calls.

For caller discovery, the reviewer distinguishes incidental path mentions from
caller claims, verifies the claimed and actual caller sets against source, and
cites response and source excerpts for every caller. For the module summary,
the reviewer records each of five named facts, quotes evidence, and lists every
unsupported material claim; negation and context are judged semantically. The
grader only counts whitespace-delimited tokens toward the 90-word cap. For the
cited answer, the reviewer confirms it is one sentence, states the managed
90-day default, says an explicit value of 12 means 12 days, explains that the
explicit value overrides the default, and cites the exact supporting document
and heading. Keyword or citation-presence checks never decide semantic pass.

The candidate command records deterministic evidence only. The `finalize`
command requires a blinded manual receipt bound to the candidate and response
hashes before it can emit a pass or fail. Five results remain unscorable: two
earlier pass receipts have no retained dispatch/completion trace, and three
receipts failed schema, quote, or semantic validation. Unscorable outputs have
no quality classification; the earlier pass receipts are retained only as
secondary evidence.

## Review outcome and validation notes

Eleven of the 13 valid receipts passed. Two failed: one module summary exceeded
the 90-token limit and made an unsupported claim; one cited answer omitted the
required heading in its citation. Three other results have no quality
classification because the reviewer receipt could not be validated: one
summary review used non-verbatim evidence, one citation review did not provide
a boolean for its one-sentence judgment, and one caller review returned an
actual-caller set inconsistent with the answer and source. These are review
validation failures, not model failures. Two earlier pass receipts lack
retained dispatch/completion traces proving reviewer independence; those grades
are unverified and do not count in the 13-score denominator.

The grader, rubric, source, key, and native answers were not changed. A
deterministic envelope helper attached candidate hashes and the observed
collaboration agent names to reviews with retained task provenance; it copied
task-specific review bodies without scoring or inferring any semantic field.
Two earlier receipt IDs were generated inside the review bodies and their
collaboration traces are unavailable, so they were not rebound and their pass
grades remain secondary only. Explicit field aliases and verbatim quote
corrections are recorded with their raw attempts.
An independent critic checked the helper and its two offline tests; both tests
passed. The [private artifact index](model-tier-private-artifact-index-20261103.json)
records paths and hashes without exposing the payloads, provider crosswalk,
review IDs, or session IDs. Private response and review evidence, the answer
key, and native Kiro sessions remain retained through the #169–#172 handoff.
After the independent audit, cleanup of six captured Kiro V2 sessions and 18
verified-empty controller working directories awaits parent authorization.

## Verification and cleanup status

The [controller](../../../scripts/spike-model-tier-research-t169.mjs) SHA-256 is
`a499ef5bf3f45195062ec167c08f0248c26cede0401f91d53110c31f347e9cc1`; the
[separate held-out grader](../../../scripts/grade-model-tier-research-t169.mjs)
SHA-256 is
`7db36c67ceca1c8eaaf20d7bfd103684fb7319b91447d9ed653931df79a6c88c`. Their
exact hashes and the source/task hashes are bound in the continuation protocol.
No model response is semantically scored by the producing session. The study
and its review are complete; private evidence cleanup has not been authorized or
performed.
