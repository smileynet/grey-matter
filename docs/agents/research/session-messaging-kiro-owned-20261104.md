# Two-message handoff to an owned Kiro ACP session

The parent completed a question and a follow-up in one owned Kiro V2 ACP session.
The second answer recalled a fresh nonce from the first answer. Both inputs and
replies were acknowledged through the shared message core. This qualifies the
bounded owned-client route; it does not attach to another running Kiro chat.

## Observed delivery

The pinned CLI was 2.37.1, requesting `claude-haiku-4.5`. Requests 3 and 4 both
returned `completed` / `end_turn` in session
`5c9c2e64-2053-452e-86ea-2843ab2d6b36`. Both responses were valid JSON inside one
whole JSON fence. The first answered 42 and supplied an eight-digit string nonce;
the second returned `done` and the same nonce without receiving it in that input.
The private spool retains all four acknowledged records and two accepted,
revision-3 notification intents with matching message hashes and receipt events.

Only the action returned after persisted attempt-start was converted to native
input. The caller held the same process handle, generation and exact ACP session
throughout. No resume, foreign-session attachment, queue or steer was used.

## Delivery and shutdown are separate results

Both turns passed. Physical cleanup also passed: the observed owned root and child
were absent after stop, exit was zero, and stdio closed. The update pump nevertheless
ended with `DISCONNECTED`. That original result remains in the raw evidence.

Source inspection found that process exit always emitted `DISCONNECTED`, including
intentional owner stop. The separately reviewed local adapter correction distinguishes
owner stop (`CLOSED`) from unexpected exit and preserves an earlier protocol fault.
Fake-peer regressions cover that correction; they are not a second native teardown
measurement. No additional model run was used to change the recorded outcome.

## Scope and limits

- Served model identity was unreported. The model name above is requested identity.
- The private profile requested empty tools, allowed tools and MCP. The client
  advertised no filesystem or terminal capability and cancelled permission requests.
  Zero tool-call updates were observed; effective provider tool capacity is unproved.
- Busy queueing, persistence, reconnect and crash recovery remain unqualified.
  Ambiguous inputs retain their identity and require manual reporting, not replay.
- This V2 result does not resolve #189's V3 shutdown limitation. Continue the
  documented bounded owned-process workaround and observe survivors separately.
- The earlier strict-JSON failure is retained with its original unknown response
  format. This new case does not repair or reclassify that failed intent.

The [evidence index](evidence/session-messaging-kiro-owned-20261104.json) binds
retained private preflight, raw native observations, source checks and independent
reviews. The parent owns those artifacts through the #179 final audit and explicit
disposition. No credentials or raw provider transcript are promoted here.
