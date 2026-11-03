# Model tier research: preparation and invocation plan

**Status: eight calls captured; no quality findings yet.** Ticket #169 compares
three read-only research tasks under each harness's low-cost profile and native
default. Six Claude cells have terminal responses. The first Codex and Kiro
cells also completed, but their native output omitted actual model identity.
Their raw responses remain eligible for semantic blind grading as requested-
profile observations; they cannot support model-level comparison. Ten planned
cells remain pending renewed critic review and a parent continuation receipt.
The first-wave protocol, authorization and measurement ledger are preserved at
their original hashes in private scratch. The continuation clarification is
bound by protocol SHA-256
`927726a9190c0612d5c562e1fe44c95b14f7d1842ca87b5402faf0e17b37ebb0`.

## What the planned comparison measures

The same eight-file synthetic source packet supports three tasks: discover all
callers of an exported function (including alias and dynamic imports), summarize
a policy module, and answer a question from a cited document. Exact prompts and
inputs are in the [task manifest](../../../scripts/fixtures/model-research/t169/tasks.json)
and [source packet](../../../scripts/fixtures/model-research/t169/source-files.json).
The held-out answer key is private at `.scratch/t169/answer-key.json`; only its
hash is recorded in receipts. Each session will receive one prompt and the same
eight sources.

The grader records deterministic candidate evidence only: mentioned paths,
citation path/heading presence, and a whitespace-token word count. These checks
do not award semantic passes. A fresh independent reviewer manually checks each
response against the source packet and held-out rubric in a blinded context.
Mentioning a path alone does not establish that it is a caller.

A profile passes this small fixture bar only if all three one-shot task scores
pass both native execution checks and independent manual review. Otherwise the
recommendation is to keep the native default. These are directional examples,
not a reliability or broad coding benchmark. The native default can differ in
both model identity and reasoning effort, so any difference will be reported as
an invocation-profile result, not attributed to model identity alone.

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

## Partial execution evidence (2026-11-03)

Every response below has a pending semantic grade. No row is a quality pass.
Claude's native defaults reported Opus 5.5 and the cheap profile reported
Haiku 5.5. Codex and Kiro completed the caller task but did not report actual
identity. Their statuses were retained by the first-wave controller as
`identity-unreported`; the accepted clarification keeps them as requested-
profile observations with `actualModel=null` and `profileComparable=false`.

| Harness | Requested profile | Task | Native result | Actual identity | Time | Reported usage or cost |
|---|---|---|---|---|---:|---|
| Claude | Haiku 5.5 | Caller discovery | Terminal response; blind grade pending | Haiku 5.5 | 8.139 s | $0.001527 list estimate |
| Claude | Native default | Caller discovery | Terminal response; blind grade pending | Opus 5.5 | 6.562 s | $0.036134 list estimate |
| Claude | Haiku 5.5 | Module summary | Terminal response; blind grade pending | Haiku 5.5 | 11.010 s | $0.001653 list estimate |
| Claude | Native default | Module summary | Terminal response; blind grade pending | Opus 5.5 | 8.480 s | $0.036270 list estimate |
| Claude | Haiku 5.5 | Cited answer | Terminal response; blind grade pending | Haiku 5.5 | 5.251 s | $0.000851 list estimate |
| Claude | Native default | Cited answer | Terminal response; blind grade pending | Opus 5.5 | 6.930 s | $0.031826 list estimate |
| Codex | `gpt-6-luna` requested | Caller discovery | Terminal response; blind grade pending | Unreported | 6.381 s | 18,599 input / 108 output tokens; cost unknown |
| Kiro | `qwen3-coder-next` requested | Caller discovery | Terminal response; blind grade pending | Unreported | 6.526 s | Context-use metadata only; cost unknown |

Claude's six list estimates total USD 0.108260 against the USD 0.60 ceiling.
The Codex and Kiro first cells were consumed once and will not be retried.
Their five remaining cells each can resume only under parent authorization
listing those exact held cell IDs; other errors or limits still stop that
provider. Raw responses, full receipts, the identity crosswalk and first-wave
ledger remain private in `.scratch/t169/`.

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
hashes before it can emit a pass or fail. Until then, the semantic grade stays
`pending`.

## Verification before measurement

The [controller](../../../scripts/spike-model-tier-research-t169.mjs) SHA-256 is
`a499ef5bf3f45195062ec167c08f0248c26cede0401f91d53110c31f347e9cc1`; the
[separate held-out grader](../../../scripts/grade-model-tier-research-t169.mjs)
SHA-256 is
`7db36c67ceca1c8eaaf20d7bfd103684fb7319b91447d9ed653931df79a6c88c`. Their
exact hashes and the source/task hashes are bound in the continuation protocol.
No model response is semantically scored by the producing session.
