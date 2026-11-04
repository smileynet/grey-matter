# Native messaging qualification: first cases

The shared input and startup source is shipped. Native qualification remains open:
these first Claude and Kiro cases did not complete the question/completion canary.
Both used fresh owned sessions, and their observed process trees settled afterward.
The code candidate was `e9a771681eb1871773399c7dcbb4818b817638eb`.

| Case | Observed result | What remains unknown |
|---|---|---|
| Claude 2.1.316, requested Haiku 5.5 | The first actual bound input was written. The parser rejected an early record with `PROTOCOL_ORDER`, before init, replay or result. Stdout was 198 bytes; stderr was empty. | The offending record was not retained. Native acceptance, response and billing are unknown. No receipt or completion is claimed. |
| Kiro 2.37.1, V2 ACP, requested Haiku 4.5 | Nine message-chunk updates arrived in the selected session. The canary failed its JSON check; the second input was not attempted. | The failed response text and prompt-result metadata were not retained before parsing. The response-format cause is unknown; RPC success is an inference from reviewed control flow. Served model identity is unreported. |

The original intents remain ambiguous, and both failed cases remain in the evidence.
A new diagnostic is a separate, explicitly admitted case; it does not resend or
repair either original message.

## Process and policy observations

Claude required explicit termination after the parser failure. Its observed root
and child were absent at final inspection, with stdio closed. Kiro stopped with
exit 0 and closed stdio; its observed root and child were also absent. Task outcome
and process settlement are separate findings.

Kiro used a unique local profile requesting empty tools, allowed tools and MCP
servers. The fixed ACP client cancels permission requests and does not advertise
filesystem or terminal capabilities. No tool-call updates were observed. This does
not establish that all provider-side tools were unavailable.

## Preflight trap: Kiro validation returns zero for an error

On the pinned Kiro binary, the valid profile produced no output and exit 0. A
deliberately invalid typed profile also returned exit 0, while stderr reported an
invalid type. The agent list writes its listing to stderr. Preflight therefore
checks the actual diagnostic output, uses that negative control, and searches both
streams for the exact private profile. A zero exit alone is insufficient.

## Continuation

The next Claude diagnostic records bounded wire-shape metadata before the same
unchanged parser and stops on its fault. The Kiro fixture needs to retain response
shape and native RPC identity before application parsing. Neither change qualifies
delivery by itself, and neither permits automatic retry, provider fallback or
broader permissions.

The [evidence index](evidence/session-messaging-native-first-cases-20261104.json)
binds ten private preflight, result and independent postflight artifacts. They are
retained by the parent through the final #179 audit. Unknown native response text,
credentials and unrelated conversations are not included in this document.

## Subsequent diagnosis and Kiro result

A distinct bounded Claude diagnostic retained first-record shape metadata before
the unchanged parser rejected it. Its type hash matched `command_lifecycle` in
the exact pinned CLI binary, with a matching session and no retained lifecycle
state or input correlation. Anthropic's [SDK changelog](https://github.com/anthropics/claude-agent-sdk-typescript/blob/main/CHANGELOG.md#030206)
documents that family, while the pinned SDK message type union omits its full
schema and the pinned CLI consumer ignores it. The narrow adapter correction
treats only this exact session-bound family as opaque status: it cannot establish
readiness, input receipt or completion, and other unknown frame types still fail.
Independent local protocol checks pass 17/17. This diagnosis does not repair the
original ambiguous input or qualify native delivery.
The [diagnosis evidence index](evidence/session-messaging-claude-lifecycle-20261104.json)
binds the retained wire observation, public-source excerpts and exact-source reviews.

A separate [Kiro V2 case](session-messaging-kiro-owned-20261104.md) subsequently
completed both business turns and their core acknowledgments, with observed
physical process cleanup. Its original update-stream disconnect and local-only
close-classification correction remain separate from business delivery. Neither
new finding reclassifies the first failed cases above.

## Later Claude cases: receipt is not completion

After the lifecycle correction, a fresh business case reached initialization,
an exact input replay and assistant output. It stopped before an accepted terminal
result with `UNEXPECTED_RECORD`; the helper's `EVENT_STREAM_CLOSED` was secondary.
No reply, task completion or final shared-core receipt is claimed. Its rejected
record was not retained, so that case's underlying record type remains unknown.
The root process stopped with closed stdio, but tree inspection began too late
and failed; historical descendant settlement remains unproved. A later read-only
current parent-PID graph was empty, which does not repair that missing baseline.

A distinct wire diagnostic then observed `rate_limit_event` in the selected busy
session immediately before the unchanged parser rejected it. This proves another
unsupported event family in that diagnostic, not the exact cause of the earlier
business failure. Its payload was withheld: no usage exhaustion, limit or reset
time is inferred. The diagnostic recorded a validated receive receipt only,
without handling, reply or completion. This run captured root and child identities
at launch and before stop; both were absent afterward, with exit zero and closed
stdio.

The pinned public SDK distinguishes `allowed`, `allowed_warning` and `rejected`
rate-limit states. Supporting that family must preserve normal nonterminal status
without clearing the active input. Under this project's provider policy an actual
rejected limit requires stopping and reporting the available limit/reset metadata,
with no retry or provider switch. Native Claude completion remains open in #236.

The [later-case evidence index](evidence/session-messaging-claude-native-progress-20261104.json)
binds both cases, independent postflights and the read-only cleanup follow-up.

### One correlated turn completed; the follow-up remains unqualified

With rate-limit metadata support shipped, the next fresh business case completed
its first input: the correlated success result contained the expected answer and
eight-digit string nonce. The question and its reply were acknowledged by the
core; the persisted intent reached revision 3 with a validated receipt. The helper's
embedded revision-1 lifecycle snapshot was stale, so the independent review checked
the persisted records instead.

The second input ended with `PROTOCOL_ORDER` before replay or result. Its intent
remains ambiguous and was not retried. The rejected record's type/subtype was not
retained; repeated initialization is a hypothesis, not an observed cause of this
failure. The observed rate-limit event was `allowed`, not an exhausted-limit report;
its raw reset value does not establish billing or account entitlement.

Launch observations identified the owned root and child; both later cleanup
snapshots were empty and stop resolved with closed stdio. The helper nevertheless
recorded `settled: null` because it required the root in the cleanup-before snapshot.
Keep that original computed value separate from the observed disappearance of
the identities captured at launch. The next fixture must use its launch baseline
and preserve redacted fault shape without exposing message contents.

The [turn-progress index](evidence/session-messaging-claude-turn-progress-20261104.json)
binds this case and its independent review. Claude's two-turn qualification and
the parent outcome remain open.
