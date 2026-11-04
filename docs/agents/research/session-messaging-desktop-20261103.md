# Bounded existing-worker desktop handoff

Parent #179 / child #235 exercised the current Codex desktop collaboration surface
against an owned disposable worker. Shared source was
`6115e4acce0c872f53033fafe8d2ad0ecabe9d0c`; the desktop native version was not
reported. Local generation 1 is routing metadata, not native lifecycle attestation.

## Observed result

The parent independently selected the exact canonical ID returned by the native
spawn tool. The live roster showed that worker running during a bounded clock
wait. A context-bearing accepted spool message was prepared and its attempt-start
persisted before one `collaboration.followup_task` call. The recipient handled
that exact message and returned a reversed-route question through both the core
spool and the existing native parent channel.

After the roster showed the same worker completed/idle, a second prepared action
woke it with the correlated answer. The worker returned a done record containing
the original nonce from its earlier turn. The parent validated and acknowledged
question and completion, and validated both outbound core receipts. Each intent
contains one attempt-start, a parent native-return attestation and a validated
handled receipt. Wrong native ID and generation were refused before preparation.

The busy marker-to-native-return upper bound was 24.136 seconds, inside its
30-second window. This establishes that bounded clock-wait case; it does not
establish arbitrary mid-work steering, scheduling order or all busy conditions.

## Retained failure and review

The initial canary reported an ad hoc Node import syntax error before core receipt.
It was stopped and never resent. Its intent was explicitly expired after its
deadline as dead-letter-ambiguous. A fixed receiver script passed a real local
Node question/completion roundtrip before independent preflight approval of a
fresh test with its own runtime, target and nonce. Both runs remain retained.

Independent postflight review accepted the corrected bounded case, including
exact routes, message hashes, correlation, nonce, receipt state and prior expiry.
The parent-recorded native witness is a reconstruction of actual observed tool
results and parent-channel messages, not an authenticated native event export.
Recipient files are observations, not an independent authentication mechanism.
The [evidence index](evidence/session-messaging-desktop-20261103.json) binds retained
private artifacts and those limitations.

This evidence predates #235's planned action-fingerprint/CLI extension. It does
not qualify that extension, CLI queue delivery, crash/disconnect recovery, global
installation or other harnesses. The worker completed; no close-agent tool was
available, and no process or unrelated session was killed. Owned records are kept
through the #179 final audit and explicit artifact disposition.
