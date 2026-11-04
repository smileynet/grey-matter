# Existing-worker Codex handoffs

An owned desktop worker received a saved question and then a follow-up after it
became idle. It returned the original nonce through the same session and the
shared message core. The CLI queue adapter is implemented and locally tested;
native CLI delivery remains unqualified under the current integration hold.

## Desktop observation

The fresh version-3 case used exact target `/root/canary235_v3` and one persisted
attempt for each of two actions. The parent copied only the action returned after
attempt-start, observed the native return and recorded it separately from receipt.
The first input produced a correlated question. After the live roster showed the
same target completed, the answer woke it and produced a correlated done record
with the remembered nonce. The second input did not supply that nonce.

All four spool records, both notification intents and the two recipient observations
were independently inspected. The inputs reached handled receipts; the parent
acknowledged the question and done records. Wrong target and generation were
rejected before action preparation.

The roster showed the recipient running immediately before the first call. The
retained timing does not prove that call fell inside its declared 30-second clock
hold: marker-to-native-return upper bound was 37.440 seconds, and the exact call
timestamp was not exported. This supports the observed running/idle exchange with
that timing limit, not a guaranteed scheduling window or arbitrary mid-task steering.
The [older busy case](session-messaging-desktop-20261103.md) remains a separate
observation on its older action format; the cases are not combined into one run.

Native identity/version and generation were not authenticated. The parent witness
is reconstructed from actual tool results and messages, not an authenticated event
export. Recipient files alone are not independent native authentication.

## CLI queue boundary

The fixed queue adapter binds the exact thread UUID, executable hash, parent-owned
loopback endpoint and saved message action. Local regression evidence qualifies
those preparation and refusal rules; it does not prove CLI delivery or wakeup.

The proposed native app-server preflight could start configured MCP integrations
before its model gate. Pinned-source research found no established process-wide
MCP disable or safe effective-server inventory within current authorization. Empty
table overrides merge rather than clear inherited entries. The CLI run therefore
stayed held; no app server, connector or model was launched by that fixture.
The [prelaunch research](codex-prelaunch-integration-admission-20261104.md) records
the pinned sources and exact gap. This is a qualification limit, not a claim that
Codex cannot queue messages.

Use the qualified owned desktop surface when available. Otherwise retain the saved
message and report manually through the owning session or the established quiet
mailbox/heartbeat path. Do not resume a replacement thread, scan held configuration,
enable a grant, retry an ambiguous message or infer receipt from CLI exit zero.

The [evidence index](evidence/session-messaging-codex-owned-20261104.json) binds
the private case records, local checks and independent reviews. The parent retains them
through the #179 final audit and explicit disposition. No user conversation,
credentials, global configuration change or provider fallback was used. The
completed canary remains available because no native close-agent operation was
provided; no unrelated process was stopped.
