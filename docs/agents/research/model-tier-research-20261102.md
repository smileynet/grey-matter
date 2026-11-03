# Model tier research: preparation and invocation plan

**Status: no model calls made and no quality findings yet.** Ticket #169 compares
three read-only research tasks under each available harness's low-cost profile
and native default. Calls are gated on independent review of the frozen packet,
controller and blinded-review procedure, followed by the parent releasing the
serial measurement lease. Frozen protocol SHA-256 is
`e086dfb13a8ac3b16de4712d1e82707be6cad663b18eb98c0d2d40d60f62ec8c`.

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
served identity; a mismatch or missing identity is not a quality pass.

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
unreported identity or usage, identity mismatch, malformed output, or exceeded
budget holds the provider for parent review and cannot count as a pass. Startup
failures consume their planned cell. Captured raw output is private scratch
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
`7f1e53e42f952c155bf313a3081720ee66f1f700f49c475e5a978d671d7ef921`; the
[separate held-out grader](../../../scripts/grade-model-tier-research-t169.mjs)
SHA-256 is
`7db36c67ceca1c8eaaf20d7bfd103684fb7319b91447d9ed653931df79a6c88c`. Their
exact hashes, the source packet and prompt hashes are bound in the private
protocol. No live provider command or measurement call has been run for #169.
After critic acceptance, the parent must issue an authorization receipt
matching the exact controller, protocol and this report before the runner can
execute.
