# Ticket 168: cheap versus default model reviewers

**Status: preparation only; no fixture review has been run.** Ticket 167 owns the
shared native measurement lease. A controller revalidation produced one Claude
assistant-style response to an attempted help command; an independent critic
assessed it as a likely unintended model turn, but no native turn or usage
metadata was retained, so consumption and cost are unknown. An agy help attempt
returned an argument parse error. Both raw outputs are private at
`.scratch/t168/controller-preflight/`; neither is a review result or scored cell.
All provider invocations are stopped pending renewed parent and critic review.
Measured results and recommendations remain pending.

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

### Controller revalidation (2026-11-03)

The earlier receipts invoked provider names through `PATH`; they do not prove
which executable a future measurement would launch. Exact proposed executable
paths and hashes are pinned in the private
`.scratch/t168/controller-preflight/incident.json`. Codex must use the
same-version package executable beside its verified code-mode host, as in ticket
188; the PATH-selected copy is not acceptable. Future launches must use
PowerShell 7.6.9 with recorded absolute executable, actual argv, native exit,
timeout, stdout/stderr bytes, and native turn/usage metadata. The command text
and tool metadata from the anomalous preflight are retained at
`.scratch/t168/controller-preflight/command-record.json`; it used splatted
variables, merged stdout/stderr, and did not capture OS-level argv or per-process
exit/time/usage events.

The batch help collection exposed a PowerShell argument-construction bug, not
CLI help behavior. A safe Node argv recorder independently reproduced that the
one-item `switch` result for Claude and agy became a scalar string; splatting it
passed its characters (`-`, `-`, `h`, `e`, `l`, `p`) as separate arguments.
Claude returned an assistant response to the malformed arguments; the critic
assesses this as a likely unintended turn, with consumption/cost unknown. Agy
returned an argument parse error with no assistant response. Codex and Kiro's
two-item argument arrays remained intact. The exact PowerShell command and raw
outputs are retained privately. These are not review results or scored cells.
All provider commands remain held until the argument builder is corrected,
verified with an argv recorder, independently reviewed, and the parent releases
the measurement lease.

The earlier agy catalog receipt is incomplete: its helper retained only a hash
of full command output, then extracted two model rows with a regex that excluded
other rows. Ticket 167's separate full 590-byte catalog capture confirms both
`gemini-3.8-flash-low` and `gemini-3.8-flash-medium` are available alongside
Argon tiers; the earlier difference came from each inventory filtering for a
different Flash tier, not evidence of changed availability. The full capture is
retained at `.scratch/t168/controller-preflight/agy-catalog/agy-models.stdout.bin`
(SHA-256 `B8EF1100468943EC66037166702B013793898730D02BCD3008EC0DA5A3A70755`).
The pinned medium cheap candidate is therefore available. The configured default
identity remains unknown until native model output reports it.

The existing shared models-and-usage note names Claude Haiku as a cheap tier and
Opus 5.5 as the default, Codex Luna as a cheap tier and `gpt-6.1-sol` as the
machine default, and Google Flash as a cheap tier. These are candidate selections,
not fresh invocation results. Recheck current advertised tiers and usage limits
before measurement. #167 holds the model-call lease while this preparation runs.

The prior CLI help inspection confirmed the candidate invocations below. Kiro's V2 CLI can
delete an exact captured session; Claude and Codex support non-persistent
sessions. Agy lacks a no-persistence or session-deletion option in the inspected
help, so its local history lifecycle must be recorded and reviewed after calls.

Use each CLI's scoped tool restrictions: Claude's empty `--tools` list, Codex's
`--ignore-user-config` plus read-only sandbox, and Kiro's empty `--trust-tools`
list. Agy's inspected help advertises plan mode and sandboxing but no all-tools
deny option. The CLI help does not establish whether a separate computer-use
integration is exposed; keep agy held until the critic confirms its invocation
cannot access such a tool or approves a scoped control.

## Planned usage and isolation

Proposed pair, pending renewed controller review and lease release:

| Provider | Cheaper tier | Default tier | Effort | Status |
|---|---|---|---|
| Anthropic / Claude Code | `haiku` | native CLI default | model-specific native effort default | Model alias from current guide; verify response model |
| OpenAI / Codex | `gpt-6-luna` | native CLI default | model-specific native effort default | Cheap model visible in catalog; default invocation omits model and effort |
| Amazon / Kiro | `qwen3-coder-next` | native CLI default | model-specific native effort default | Cheap model visible in catalog; default invocation omits model and effort |
| Google / Antigravity | `gemini-3.8-flash-medium` | native CLI default | model-specific native effort default | Cheap model confirmed in full catalog; default identity must appear in native output to verify comparison |

The candidate argument vectors below are frozen, but may not be launched until
the anomaly and controller preflight receive renewed approval and the parent
releases the lease. Use only the absolute executable paths and hashes in the
private controller receipt. Substitute only the fixture prompt and listed
model; create a new empty `%TEMP%\gm-review-168-*` working directory with no
repository checkout, and run calls serially:

~~~~text
<absolute-claude.exe> --print --tools "" --no-session-persistence --output-format json --permission-mode plan --max-budget-usd 0.10 <prompt> [--model haiku]
<absolute-codex.exe> exec --ephemeral --ignore-user-config --cd <empty-temp-dir> --sandbox read-only --json <prompt> [--model gpt-6-luna]
<absolute-kiro-cli.exe> chat --no-interactive --agent-engine v2 --trust-tools= --output-format stream-json <prompt> [--model qwen3-coder-next]
<absolute-agy.exe> --print --mode plan --disable-slash-commands --print-timeout 120 <prompt> [--model gemini-3.8-flash-medium]
~~~~

Default-tier commands omit both `--model` and any effort override. Cheap-tier
commands pin only the named model; effort also remains at the model's native
default. This measures each tier under its native default configuration, not an
isolated model-only effect. Record requested model/effort as native default and
reported model/effort only when the CLI emits them.

All planned fixture calls have a fixed 120-second timeout. A timeout is a failed
cell and will not be retried. The parent authorized eight calls per provider
(four fixtures, two tiers); no retries or extra usage-check calls. Claude had
one unintended assistant-style turn during controller preflight; count it
against the eight-call ceiling. Therefore, at most seven Claude fixture cells
remain, and the first cheap cell (fixture f1) is omitted for budget accounting,
not counted as a model-quality failure. Do not replace it. The seven planned
Claude cells have at most USD 0.70 of requested per-call ceilings; because the
preflight turn's usage is unknown, the aggregate USD 0.80 cap cannot be claimed
verified. Codex, Kiro and agy retain eight planned fixture cells each. They do
not expose comparable dollar caps in retained help; report native cost/usage if
emitted, otherwise unknown. Do not infer cost from model names or time. A missing
quota counter remains unknown, not model unavailability. Stop a provider on a
reported usage limit; never substitute another provider or tier for a failed
cell.

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
