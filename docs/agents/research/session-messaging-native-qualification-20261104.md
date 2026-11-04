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
