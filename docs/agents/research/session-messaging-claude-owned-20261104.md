# Two-message handoff to an owned Claude session

The parent completed two correlated tasks in one owned Claude CLI process and
session. The follow-up recalled the nonce from the first answer. Both inputs and
their replies reached shared-core acknowledgments, and the observed process tree
settled after stop. This qualifies the bounded owned-stream route, not attachment
to another person's running conversation.

## Observed result

The pinned CLI was 2.1.316, requesting `claude-haiku-5-5`, on Windows. Session
`9ec66c58-9dfd-4dd8-a894-76dbf240cd6c` returned two correlated `success` results.
Both responses were plain JSON: the first answered 42 with an eight-digit string
nonce; the second returned `done` with the same nonce, which was absent from its
input. Each input had its own persisted protocol UUID and action fingerprint.
The caller used only the action returned after persisted attempt-start.

All four core records were acknowledged. Both notification intents reached
revision 3 with matching receipt-confirmed state; the report records that current
state separately from its initial attempt snapshot. The adapter observed one
`system_init_repeated` status without resetting the active input or resolving
readiness again. Allowed rate-limit metadata remained nonterminal; no rejected
limit was observed in this run.

The owned root and child were observed at launch and before stop, then absent in
the final snapshot. Stop returned exit zero with closed stdio and empty stderr.
The event pump drained and the fixture reported `two-correlated-turns-completed`.

## Admission and failure handling

The caller held the verified executable and exact process/session/generation.
The process requested restricted operation, empty tools and MCP, no permission
prompts and no session persistence. Startup metadata was checked before accepting
results. No tool execution was observed. Requested model and CLI metadata are not
an independent attestation of the API-served model or account entitlement.

Known lifecycle and allowed rate-limit records cannot become input receipts or
completion. An identical, fully revalidated initialization record is status only;
changed identity or safety metadata fails. A rejected usage limit synchronously
faults the protocol, stops the owned process and reports available validated limit
and raw reset metadata. It never enables credits, retries or switches providers.
Faults raised while observing decoded JSONL records expose bounded, redacted shape
rather than contents; framing and other failures may have no record diagnostic.

## Limits and retained failures

- This is one bounded Windows case. macOS/Linux native delivery, busy queueing,
  steering, reconnect and disk-session recovery remain unqualified.
- No foreign conversation was used or attached. No persistent bridge, global
  permission change or replacement coordinator was installed.
- Earlier ambiguous inputs remain unchanged in the
  [qualification history](session-messaging-native-qualification-20261104.md).
  This success does not repair them or retroactively prove an unretained fault's
  cause. One older case lacked a launch tree baseline; its historical descendant
  settlement remains unproved.
- A saved message, pipe write or native replay alone is not business completion.
  Preserve ambiguous message identity and use manual reporting rather than resend.

The [evidence index](evidence/session-messaging-claude-owned-20261104.json) binds
the raw case, exact source and independent reviews. The parent owns private cited
artifacts through the #179 final audit and explicit disposition; raw credentials
and unrelated transcripts are not promoted.
