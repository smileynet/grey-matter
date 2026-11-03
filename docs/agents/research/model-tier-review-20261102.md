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
`f4.json`. The common prompt and each case have SHA-256 identities recorded below;
the hidden answer key has its own private SHA-256 receipt in ticket scratch. The
key will not be copied into a reviewer directory or prompt. This is a
non-adversarial host evaluation: host execution alone is not an OS security
boundary. No secret or production data belongs in a fixture.

## Scoring protocol for critic preflight

Before the first call, freeze the fixture hashes, prompt, accepted changed-line
evidence, and model/effort matrix. Preserve the raw response and native usage
output for every call. A separate scorer, who did not author or run the measured
reviews, compares responses with the hidden key.

- A true positive names the seeded defect, points to the changed line, and
  explains the ticket impact. Count each seeded defect at most once. Multiple
  reports for one defect count once as a true positive; record extra duplicates
  separately without counting them as additional false positives.
- A seeded defect omitted or mislabeled is a false negative.
- An actionable claim with no seeded defect is a false positive. Record it even
  when other findings are correct; do not reward verbosity.
- Give the destructive case severity 3, other correctness/requirement defects
  severity 2, and missing-test coverage severity 1. Report recall per fixture,
  severity-weighted recall, false positives per review, and exact changed-line
  citation rate separately.
- Treat an unusable/failed model response as a failed cell, not as a missed
  defect. Do not replace it with a call to another provider or tier.

The parent scores pseudonymized responses without the provider/tier mapping. The
producer and protocol critic do not make measured model calls. The protocol does
not presume a cutoff that makes a tier safe to approve production changes. Any
recommendation is limited to this four-case set.

## Local inventory (2026-11-02)

Read-only version/auth/catalog commands succeeded on this Windows host: Claude
Code 2.1.316, Codex CLI 0.166.0, kiro-cli 2.37.1 and agy 1.4.12. Claude auth
status reports a logged-in Claude.ai Max account; its CLI has no safe model-list
command, so `haiku` and `opus` remain documentation-backed aliases to verify in
the call response. Codex login status is true; its bundled catalog lists both
`gpt-6-luna` and `gpt-6.1-sol`, with `low` effort supported by both. Kiro's list
shows `qwen3-coder-next` at 0.05 credits and `auto` as its default. Agy's list
returns Gemini 3.8 Flash medium and Gemini 4 Argon medium, but not the configured
default. The known local `.gemini/settings.json` has no explicit model entry.
Invoke the Google default cell with `--model` omitted and record it as the
configured CLI default. If output does not expose the served model, the
comparison remains unverified; do not label it Argon. These checks establish
authentication/catalog availability, not account quota or remaining balance.

The existing shared models-and-usage note names Claude Haiku as a cheap tier and
Opus 5.5 as the default, Codex Luna as a cheap tier and `gpt-6.1-sol` as the
machine default, and Google Flash as a cheap tier. These are candidate selections,
not fresh invocation results. Recheck current advertised tiers and usage limits
before measurement. #167 holds the model-call lease while this preparation runs.

Current CLI help confirms the candidate invocations below. Kiro's V2 CLI can
delete an exact captured session; Claude and Codex support non-persistent
sessions. Agy lacks a no-persistence or session-deletion option in the inspected
help, so its local history lifecycle must be recorded and reviewed after calls.

## Planned usage and isolation

Proposed pair, pending preflight and live catalog confirmation:

| Provider | Cheaper tier | Default tier | Effort | Status |
|---|---|---|---|
| Anthropic / Claude Code | `haiku` | native CLI default | model-specific native effort default | Model alias from current guide; verify response model |
| OpenAI / Codex | `gpt-6-luna` | native CLI default | model-specific native effort default | Cheap model visible in catalog; default invocation omits model and effort |
| Amazon / Kiro | `qwen3-coder-next` | native CLI default | model-specific native effort default | Cheap model visible in catalog; default invocation omits model and effort |
| Google / Antigravity | `gemini-3.8-flash-medium` | native CLI default | model-specific native effort default | Both candidates visible; default identity must appear in native output to support a comparison |

The candidate invocation is frozen below. Substitute only the fixture prompt and
listed model; create a new empty `%TEMP%\gm-review-168-*` working directory with
no repository checkout, and run calls serially:

~~~~text
claude --print --tools "" --no-session-persistence --output-format json --permission-mode plan --max-budget-usd 0.10 <prompt> [--model haiku]
codex exec --ephemeral --cd <empty-temp-dir> --sandbox read-only --json <prompt> [--model gpt-6-luna]
kiro-cli chat --no-interactive --agent-engine v2 --trust-tools= --output-format stream-json <prompt> [--model qwen3-coder-next]
agy --print --mode plan --disable-slash-commands --print-timeout 120 <prompt> [--model gemini-3.8-flash-medium]
~~~~

Default-tier commands omit both `--model` and any effort override. Cheap-tier
commands pin only the named model; effort also remains at the model's native
default. This measures each tier under its native default configuration, not an
isolated model-only effect. Record requested model/effort as native default and
reported model/effort only when the CLI emits them.

All four providers have a fixed 120-second per-call timeout. A timeout is a
failed cell and will not be retried. The parent authorized exactly eight calls
per provider (four fixtures, two tiers); no retries or extra usage-check calls.
Claude's native per-call cap is USD 0.10 and aggregate cap USD 0.80. Codex, Kiro
and agy do not expose comparable dollar caps in checked help; report native
costs/usage if emitted, otherwise unknown. Do not infer cost from model names or
time. A missing quota counter remains unknown, not model unavailability. Stop a
provider on a reported usage limit; never substitute another provider or tier for
a failed cell.

No global settings, account plan, default model, provider configuration, or trust
list will change. Capture the Kiro V2 session ID and delete only that exact
session afterward using `--delete-session ID --session-source v2`. Claude and
Codex do not persist sessions. Record agy session retention as a limitation; its
inspected help has no no-persistence or session-deletion option.

## Retention and unresolved protocol items

Promote a sanitized report, metadata receipt, aggregate metrics and the independent
audit only. Do not promote chain-of-thought or private reasoning. Retain raw native
response bytes only until the independent critic and parent integration accept the
result; then record exact identities/sizes and recycle ticket-owned raw files, or
retain any specific file with a documented lifecycle reason. Temporary review
directories are outside the repository and must be disposed at close. The hidden
key stays private through scoring.

Frozen inputs: f1 `9d5bc51d86603ee367f14a678812eddcd4255cff00d261afcc29606d120f1ef7`;
f2 `97b66442410ada20b57e91a01025d20a6f31689d33a17009e0825c8871369108`;
f3 `94a10710978c9184c9877d23099a34f292a5f0bd02c47520cbdd34c3a6f9a9eb`;
f4 `757b2d57d664759c1c8e08c0b52af6052a824f93db3e27641d4e567087981e35`;
prompt `4a69932852c61207346ed7d62be9f3f6755bfcd86190e1818fd734dfd6229dd6`.
The answer key hash and requested model-to-blind-ID mapping are recorded in the
private evidence receipt, not the prompt. The parent owns blind scoring without
the tier map; the producer and protocol critic do not grade. These identities
and invocations require independent critic acceptance and parent release of the
#167 lease before calls. No measurement or tier recommendation is in this note.
