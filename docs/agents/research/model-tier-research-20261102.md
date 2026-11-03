# Model tier research: preparation and invocation plan

**Status: no model calls made and no quality findings yet.** Ticket #169 compares
three read-only research tasks under each available harness's low-cost profile
and native default. Calls are gated on an independent review of the frozen
packet and controller, followed by the parent releasing the serial measurement
lease. The protocol is `.scratch/t169/protocol.json` (SHA-256
`62e0c1e69998df5a3a09bf86f1f46ced55eaefa785a0b21a32f1a508f5d82c0a`).

## What the planned comparison measures

The same eight-file synthetic source packet supports three tasks: discover all
callers of an exported function (including alias and dynamic imports), summarize
a small policy module, and answer a question from a cited document. Exact
prompts, sources and hashes are listed in the protocol and in
[`scripts/fixtures/model-research/t169/tasks.json`](../../../scripts/fixtures/model-research/t169/tasks.json)
and
[`scripts/fixtures/model-research/t169/source-files.json`](../../../scripts/fixtures/model-research/t169/source-files.json).
The held-out answer key is private at `.scratch/t169/answer-key.json`; only its
hash is recorded in receipts. Each session will receive one prompt and all eight
sources. The grader independently checks the response text, including caller
precision/recall, keyed summary facts and citation correctness. Mentioning a
path alone does not establish that it is a caller.

A profile passes this small fixture bar only if all three one-shot task scores
pass. Otherwise the recommendation is to keep the native default. These are
directional examples, not a reliability or broad coding benchmark. The native
default can differ in both model identity and reasoning effort, so any
difference will be reported as an invocation-profile result, not attributed to
model identity alone.

## Candidate profiles and prior evidence

The candidates are Claude `claude-haiku-5-5`, Codex `gpt-6-luna`, and Kiro
`qwen3-coder-next`. In each default profile, the runner omits both model and
effort overrides. A prior #168 observation requested Claude's `haiku` alias,
but the native response reported Claude Sonnet 5.5. This protocol therefore
uses the documented canonical Haiku ID and requires the native response to
report the served identity; a mismatch or missing identity is not a quality
pass.

The #167 adapter inventory captured the current harness versions and selected
help output on 2026-11-03 at 05:43 UTC. Its raw inventory SHA-256 is
`4163dd66914448a75a99baf6eecdf0d6870cb256e46c1b5f036ca1a1511b0a57`. The
selected help hashes are Claude `ad08d3ae28285ca6751211aebf9b70cf63a13351aa0e229274d73ab60f887079`,
Codex `031e67c790835206fc786b24793207dd57ced5a169afa6f6320e85a46d50c5a3`,
and Kiro `f58673b80b3c6c004ce55f5791c2e9a7f7c65de688a3d0e48786d55f70ddb5b6`.
These are retained in the #167 worktree, not copied into this branch. The
controller's exact argv construction and captured empty-argument behavior are
covered by its local recorder tests.

All six Google/Agy cells are security-blocked by the workstream decision; no
replacement provider will be tried. Two prior Google model catalogs disagreed
on the Flash effort suffix, which remains unresolved and is not needed to
execute the three permitted providers.

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

## Verification before measurement

The controller is
[`scripts/spike-model-tier-research-t169.mjs`](../../../scripts/spike-model-tier-research-t169.mjs)
(SHA-256 `8aaca73abfcbc4d552a6207209fd35b7cca4cee4f446134004ead37d1ba50307`);
the separate held-out grader is
[`scripts/grade-model-tier-research-t169.mjs`](../../../scripts/grade-model-tier-research-t169.mjs)
(SHA-256 `a52ab3441de064f86addfdecfb90cb85e64072d9d7e1108ba82d46944697476d`).
Both and the exact prompts are bound in the protocol. No live provider command
or measurement call has been run for #169. After critic acceptance, the parent
must issue an authorization receipt matching the exact controller, protocol
and this report before the runner can execute.
