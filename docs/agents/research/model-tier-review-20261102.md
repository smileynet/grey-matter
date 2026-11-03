# Ticket 168: cheap versus default model reviewers

**Status: fixture and protocol preparation only. No model calls have been made.**
Ticket 167 currently owns the shared native measurement lease. This note records
the frozen fixture design and available local catalog facts for critic review.
Measured results, recommendations and usage attribution remain pending.

## Question and scope

Give each reviewer one ticket and one proposed diff, then ask it to report only
actionable findings with changed-line evidence and impact. Each fixture contains
one intended defect: an off-by-one error, a missed requirement, destructive data
removal, or a required test omitted from the diff. A reviewer never receives the
answer key or another fixture. Use the same fixture bytes and prompt wording for
the cheap and default tier of each provider. Open a separate ephemeral session
per fixture and model.

The prepared cases are `scripts/fixtures/model-review/t168/f1.json` through
`f4.json`. Their SHA-256 identities and a private answer key will be frozen in the
evidence receipt before the first call. The key will stay in ticket scratch and
will not be copied into a reviewer directory or prompt. This is a non-adversarial
host evaluation: as the runner trial documents, host execution alone is not an OS
security boundary. No secret or production data belongs in the fixture.

## Scoring protocol for critic preflight

Before the first call, freeze the fixture hashes, prompt, accepted changed-line
evidence, and model/effort matrix. Preserve the raw response and native usage
output for every call. A separate scorer, who did not author or run the measured
reviews, compares responses with the hidden key.

- A true positive names the seeded defect, points to the changed line, and
  explains the ticket impact. Count each seeded defect at most once.
- A seeded defect omitted or mislabeled is a false negative.
- An actionable claim with no seeded defect is a false positive. Record it even
  when other findings are correct; do not reward verbosity.
- Give the destructive case severity 3, other correctness/requirement defects
  severity 2, and missing-test coverage severity 1. Report recall per fixture,
  severity-weighted recall, false positives per review, and exact changed-line
  citation rate separately.
- Treat an unusable/failed model response as a failed cell, not as a missed
  defect. Do not replace it with a call to another provider or tier.

The protocol does not presume a cutoff that makes a tier safe to approve
production changes. Any recommendation will be limited to this four-case set.

## Local inventory (2026-11-02)

Read-only version/catalog commands succeeded on this Windows host: Claude Code
2.1.316, Codex CLI 0.166.0, kiro-cli 2.37.1 and agy 1.4.12. Kiro's
`kiro-cli chat --list-models -f json` listed `qwen3-coder-next` at 0.05 credits
and `auto` as the default model. `agy models` listed Gemini 3.8 Flash low and
Gemini 4 Argon medium, but the listing did not identify which is configured as
the account's actual default. Resolve the Google default from its current local
configuration/catalog before fixing the matrix; do not infer a served model from
the `agy models` listing.

The existing shared models-and-usage note names Claude Haiku as a cheap tier and
Opus 5.5 as the default, Codex Luna as a cheap tier and `gpt-6.1-sol` as the
machine default, and Google Flash as a cheap tier. These are candidate selections,
not fresh invocation results. Recheck current advertised tiers and usage limits
before measurement. #167 holds the model-call lease while this preparation runs.

Current CLI help advertises headless modes for all four families: Claude
`--print`, Codex `exec --json`, Kiro `chat --no-interactive`, and agy `--print`.
Only Claude and Codex have a reusable implementation runner at the selected
fixture revision. Kiro and agy command adaptation, native output/identity fields,
and whether their listed tiers can be pinned through headless calls remain to be
verified before any spend. The ticket's validation table must include a reason
for each unsupported or unavailable cell.

## Planned usage and isolation

Proposed pair, pending preflight and live catalog confirmation:

| Provider | Cheaper tier candidate | Default candidate | Native receipt to inspect |
|---|---|---|---|
| Anthropic / Claude Code | Haiku 5.5 (`haiku`) | Opus 5.5 (`opus`) | JSON result model usage, elapsed time, CLI list-cost estimate; provider usage check where available |
| OpenAI / Codex | `gpt-6-luna` | `gpt-6.1-sol` | JSONL token counts and elapsed time; observed model and dollar cost may be unavailable |
| Amazon / Kiro | `qwen3-coder-next` | `auto` | Native turn output, requested and observed identity separately, credit usage if emitted and account usage check |
| Google / Antigravity | `gemini-3.8-flash-low` | configured/default Argon tier, to verify | Native JSON usage/identity fields and account usage check; missing attribution stays unknown |

Each prompt will include only the fixture ticket/diff and the fixed review-output
request. Put it in a new empty temp working directory, disable persistence/continuation
where the CLI supports that mode, and supply no repository checkout. Use read-only
or tool-free execution if the harness exposes it; otherwise record the actual
permission mode. Record requested tier, CLI version, elapsed time, session ID,
observed tier, tokens, provider credits and dollars only when native output
actually supplies them. Do not infer cost from model names or timing. The harness's
native user/plan limit check is required before its calls; checks and their resets
must be recorded for each provider. A usage limit ends that provider's measurements
until its reset and does not authorize substitution.

Per-call timeout and any spend cap will be fixed with the critic after checking
each native CLI's supported limit options. The Claude CLI natively accepts a
`--max-budget-usd` flag; the other subscription CLIs may not expose comparable
per-turn dollar caps. No global setting, account plan, default model, provider
configuration, or trust list is to be changed.

## Retention and unresolved protocol items

Promote a sanitized report, metadata receipt, aggregate metrics and the independent
audit only. Do not promote chain-of-thought or private reasoning. Retain raw native
response bytes only until the independent critic and parent integration accept the
result; then record exact identities/sizes and recycle ticket-owned raw files, or
retain any specific file with a documented lifecycle reason. Temporary review
directories are outside the repository and must be disposed at close. The hidden
key stays private through scoring.

Before calls, resolve: fixture/key hashes; current catalog and Google default;
supported command and session-isolation switches for each CLI; API/account
availability and reset; per-call cap/timeout; receipt fields; and independent
critic acceptance. If an installation, account, entitlement or command cannot
support a cell, record the observed block with its exact evidence. No measurement
or tier recommendation is made in this preparation note.
