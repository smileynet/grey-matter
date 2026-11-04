# Native notification preparation

`native-notification.mjs` prepares one narrowly scoped native action from an already persisted #208 message. It does not discover agents, inspect the live tool registry, call a native tool, invoke a shell command, or decide that the recipient is authorized. The caller independently selects and confirms an existing registered target, supplies its native ID separately, and checks that the live collaboration API still exposes the action before invoking it.

## Current capability boundary

| Harness/interface | Result |
|---|---|
| Codex desktop, `collaboration.followup_task` | Conditional preparation support only. Caller must verify this exact tool is currently available and that the supplied native ID names the intended existing agent. |
| Codex CLI | Unsupported/unqualified. |
| Claude Code | Unsupported/unqualified. |
| kiro-cli | Unsupported/unqualified. |
| Kiro Crew | Unsupported/unqualified. |
| Antigravity | Unsupported and held. |

This is runtime-specific. `followup_task` addresses an already existing agent by its exact ID and sends its follow-up context; it does not create a new session. The caller should select the intended current agent independently (for example, inspect the live agent roster) and pass that selected ID as `expectedNativeId`. Never derive that argument from an untrusted packet or use a “last active” target. A tool plan, local intent, or local `accepted` state is not native acceptance, receipt, execution or completion.

## Prepare contract

The module can be imported without side effects. Programmatic API:

```js
prepareNativeNotification(runtimeRoot, {
  id: 'stable-message-id',
  target: FULL_REGISTERED_TARGET,
  expectedNativeId: 'independently-selected-existing-agent-id',
  generation: 1,
  nativeApi: 'collaboration.followup_task',
  deadlineAt: new Date(Date.now() + 30 * 60_000).toISOString()
})
```

The envelope must already exist at `messages/<id>.json`, have a valid content hash, be in `accepted` state, and route to the exact active versioned target in `registry.json`. The separately supplied native ID and generation must equal that complete target. Every new intent also requires `deadlineAt`, an explicit future UTC ISO timestamp (for example, computed with `new Date(Date.now() + 30 * 60_000).toISOString()`). Missing, malformed, offset-based, or already-expired deadlines fail before an intent is written. Only the `codex:desktop` target lane is accepted; other interfaces and adapter names fail as unsupported. A successful result contains a `toolAction` and an exact lifecycle `binding` with message ID, full target, independently selected native ID, generation, content hash, and revision `0`.

```json
{
  "tool": "collaboration.followup_task",
  "arguments": {
    "target": "the independently supplied exact native ID",
    "message": "Read the accepted coordination record ... then the persisted message body ..."
  }
}
```

This argument shape matches the Codex desktop collaboration tool used by the current runtime; callers still inspect the current tool signature before invocation. The message identifies the exact spool record and its hash, and includes the persisted body. The receiver can read it only if the runtime root is available to that receiver. Existing task authorization remains authoritative; the notification grants no permission. This implementation has not independently qualified delivery.

CLI input is JSON data, never executable code. Each lifecycle command takes the same five-argument shape after the script name:

```powershell
node skills/engineering/orchestrate/scripts/native-notification.mjs prepare --root D:\private\task-mailbox --json .scratch\notification.json
node skills/engineering/orchestrate/scripts/native-notification.mjs attempt-start --root D:\private\task-mailbox --json .scratch\notification-binding.json
node skills/engineering/orchestrate/scripts/native-notification.mjs outcome --root D:\private\task-mailbox --json .scratch\notification-outcome.json
node skills/engineering/orchestrate/scripts/native-notification.mjs inspect --root D:\private\task-mailbox --json .scratch\notification-inspect.json
node skills/engineering/orchestrate/scripts/native-notification.mjs expire --root D:\private\task-mailbox --json .scratch\notification-binding.json
node skills/engineering/orchestrate/scripts/native-notification.mjs receipt --root D:\private\task-mailbox --json .scratch\notification-binding.json
```

The prepare JSON contains the API fields above. Mutation commands take the exact `binding` object returned by prepare (updated with each returned revision); `outcome` additionally takes `outcome` with one of `accepted`, `not-sent`, or `ambiguous`. Inspect takes only `{ "id": "stable-message-id" }`. Every command accepts exactly five arguments after the script name; extra arguments fail. On success stdout is a JSON result; errors exit nonzero and print a diagnostic to stderr. There is no retry mode.

## Intent and ambiguous outcomes

Before returning the tool plan, the helper validates the accepted spool message through `session-messages.mjs`'s replay operation, then acquires the same exclusive `.lock` and compares the entire spool record again. It rechecks the registry and atomically persists a version-2 `notification-intents/<id>.json`, binding message ID and content hash, full target, expected native ID, native API, registry version, deadline, revision, and append-only events. That lock temporarily prevents core spool operations. A normal call releases it; a process crash can leave it behind. The helper never removes a lock it did not create.

At most one prepare result is returned for a message ID. The caller must durably record `attempt-start` with the returned binding and current revision **before invoking** the native action. The helper does not invoke it. Once `attempt-start` is recorded, it cannot issue another action. The caller can append one `accepted`, `not-sent`, or `ambiguous` outcome attestation against the next revision. These are parent observations: `accepted` means only that the native call returned successfully; it is not delivery proof. A timeout or interruption after attempt-start leaves the lifecycle ambiguous.

Expiry is explicit and operator-driven; no timer or scheduler runs. `expire` is allowed only after the persisted deadline and rechecks the core spool while holding the intent lock. If a correlated `received`, `handled`, or `acked` spool record is already present when explicit expiry runs, the helper records that receipt instead of creating a dead letter. This applies whether the spool receipt was written before or after the deadline, provided it exists before the expiry operation. Otherwise, no attempt-start means a known-not-sent dead letter; an attempt-start without a correlated receipt means an ambiguous dead letter. Neither state can be reopened or used to prepare another action. A later spool receipt may still be appended, preserving the dead-letter event. Receipt confirmation is recorded only when the core spool replay operation validates the same message ID, content hash, full target, and monotonic `received`, `handled`, or `acked` state. A native result attestation never substitutes for this local receipt.

Every lifecycle mutation requires the exact message ID, full target, expected native ID, generation, content hash, and current revision. Stale revisions, changed spool records, superseded registrations, and mismatched bindings fail without changing the intent. `inspect` is read-only. Historical version-1 intents remain inspectable as `unknown-legacy`; their attempt history is not guessed, and no lifecycle operation reopens them. There are no automatic retries. Do not retry after ambiguity/timeout or work around it by inventing a replacement message ID. The helper cannot prevent a caller from creating a different business message, so the no-replacement-ID rule is an operator contract.

This is at-most-once action-plan issuance, not exactly-once native delivery. There is no automatic intent cleanup: retain it with the owning spool through recovery/review, then disposition the owned runtime according to its lifecycle. Unknown files are untouched.

The runtime root, registry, message directory, message file and intent directory are required to be regular non-symlink paths where checked. Registry/message version, exact identities, hash, and state are checked before preparation. Filesystem permissions still govern access; use a private task-scoped runtime root, never a shared/global harness configuration directory. No credentials, transcript copies, arbitrary command fields, or provider/model calls are involved.

## Verification

```powershell
node --test skills/engineering/orchestrate/scripts/native-notification.test.mjs
```

The fixture covers exact target binding, deadline validation, durable attempt-start/outcome events, explicit not-sent and ambiguous expiration, revision and identity rejection, process-independent inspection, legacy unknown state, and late receipt history from the validated core spool. It does not invoke the native tool or qualify delivery. #179's bounded existing-worker canary is a separate parent-owned step.
