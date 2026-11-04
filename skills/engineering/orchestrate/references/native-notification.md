# Native notification preparation

`native-notification.mjs` prepares narrowly typed data actions from an already persisted #208 message. It does not discover agents, inspect the live tool registry, call a native tool, connect to a provider, invoke a shell command, or decide that the recipient is authorized.

## Current capability boundary

| Harness/interface | Result |
|---|---|
| Codex desktop, `collaboration.followup_task` | Conditional preparation support only. Caller must verify this exact tool is currently available and that the supplied native ID names the intended existing agent. |
| Codex CLI `queue` | Fixed plan preparation only. The exact UUID and local remote endpoint are bound to the plan; parent must verify the owned process and loopback listener immediately before execution. Busy/idle wakeup, question/reply, receipt and completion behavior remain unqualified pending the parent-owned canary. |
| Claude Code stream-json | Fixed intent preparation and pure owned-client input conversion only. Parent must supply the exact held stream client and verify its live session/process binding. Native delivery remains unqualified. |
| kiro-cli ACP | Fixed intent preparation and pure owned-client input conversion only. Parent must supply the exact held ACP client and verify its negotiated session/process binding. Native delivery remains unqualified. |
| Kiro Crew | Unsupported/unqualified. |
| Antigravity | Unsupported and held. |

The desktop route uses `followup_task` against an existing exact agent ID. The CLI route targets an existing Codex thread by full UUID through the public `codex queue` command. The owned Claude and Kiro routes target an already-created client held by the same trusted caller. None of these routes creates or discovers a recipient. The caller independently selects the exact registered target; never derive it from an untrusted packet or use a “last active” target. A tool plan, local intent, CLI exit status, or local `accepted` state is not native acceptance, receipt, execution or completion. The queue plan omits `--resume`: this work does not claim it wakes an unloaded thread.

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

The envelope must already exist at `messages/<id>.json`, have a valid content hash, be in `accepted` state, and route to the exact active versioned target in `registry.json`. The separately supplied native ID and generation must equal that complete target. Every new intent also requires `deadlineAt`, an explicit future UTC ISO timestamp (for example, computed with `new Date(Date.now() + 30 * 60_000).toISOString()`). Missing, malformed, offset-based, or already-expired deadlines fail before an intent is written. The desktop route accepts only the `codex:desktop` target lane; the CLI route is prepared only by [codex-queue.mjs](codex-queue.md) for `codex:cli` targets whose native IDs are full UUIDs.

The owned routes are also prepared here. Claude requires `nativeApi: 'claude-stream.send'`, a `claude:stream-json` target with a UUID session ID, and trusted `transport: { route: 'claude-owned-stream', owner: { pid, generation }, protocolUuid }`. Kiro requires `nativeApi: 'kiro-acp.prompt'`, a `kiro-cli:acp` target with the exact opaque session ID returned by `session/new`, and trusted `transport: { route: 'kiro-owned-acp', owner: { pid, generation } }`. The owner values are copied from the actual client handle and remain caller assertions in the plan. Claude's protocol UUID must be a separate fresh UUID from its session ID. Both plans bind `sessionId === target.nativeId === expectedNativeId` and persist the complete target, message identity, owner, and self-contained text. Unknown fields and accessors are rejected for these owned route inputs.

The owned text includes the accepted message identity, context and body directly; it does not ask the provider to read the spool file. The stored action has no callback, command, provider selection, permission grant, or arbitrary arguments. Preparation does not invoke either client.

New plans persist an exact `transportAction` and its canonical SHA-256 `actionHash` in intent version 3. The returned lifecycle binding includes that hash. An `attempt-start` mutation must provide the exact current binding; it persists the hash before returning the stored action to the trusted caller. The caller must execute only that returned action. Version-2 desktop intents remain usable with their original binding fields; their prior intent is not rewritten. Version-1 intents remain inspect-only with unknown lifecycle.

```json
{
  "tool": "collaboration.followup_task",
  "arguments": {
    "target": "the independently supplied exact native ID",
    "message": "Read the accepted coordination record ... then the persisted message body ..."
  }
}
```

This argument shape matches the Codex desktop collaboration tool used by the current runtime; callers still inspect the current tool signature before invocation. The message identifies the exact spool record and its hash, includes the persisted body, and includes canonical optional work context when present. The receiver can read the local record only if the runtime root is available to that receiver. Existing task authorization remains authoritative; the notification grants no permission. The [bounded desktop case](../../../../docs/agents/research/session-messaging-codex-owned-20261104.md) records native question/completion and its timing/identity limits; it is not a general delivery guarantee.

CLI input is JSON data, never executable code. Each lifecycle command takes the same five-argument shape after the script name:

```powershell
node skills/engineering/orchestrate/scripts/native-notification.mjs prepare --root D:\private\task-mailbox --json .scratch\notification.json
node skills/engineering/orchestrate/scripts/native-notification.mjs attempt-start --root D:\private\task-mailbox --json .scratch\notification-binding.json
node skills/engineering/orchestrate/scripts/native-notification.mjs outcome --root D:\private\task-mailbox --json .scratch\notification-outcome.json
node skills/engineering/orchestrate/scripts/native-notification.mjs inspect --root D:\private\task-mailbox --json .scratch\notification-inspect.json
node skills/engineering/orchestrate/scripts/native-notification.mjs expire --root D:\private\task-mailbox --json .scratch\notification-binding.json
node skills/engineering/orchestrate/scripts/native-notification.mjs receipt --root D:\private\task-mailbox --json .scratch\notification-binding.json
```

The desktop prepare JSON contains the API fields above. Mutation commands take the exact `binding` object returned by prepare (updated with each returned revision); `outcome` additionally takes `outcome` with one of `accepted`, `not-sent`, or `ambiguous`. Inspect takes only `{ "id": "stable-message-id" }`. Every command accepts exactly five arguments after the script name; extra arguments fail. On success stdout is a JSON result; errors exit nonzero and print a diagnostic to stderr. The Codex CLI request/config format and its separate command are documented in [the Codex queue guide](codex-queue.md). There is no retry mode.

## Existing owned-client handoff

Only the parent that already owns and retains the client may convert and invoke an owned-provider plan. Persist `attempt-start` before converting or sending. Pass only the action/hash returned from that attempt and a projection of the same live client handle:

```js
const started = startNativeNotificationAttempt(root, prepared.binding);
const { route, input } = ownedStreamInput(started.transportAction, started.actionHash, {
  pid: client.pid,
  generation: client.generation,
  sessionId: client.sessionId,
});
if (route === 'claude-owned-stream') await client.send(input);
else if (route === 'kiro-owned-acp') await client.prompt(input);
else throw new Error('Unsupported owned provider route');
```

`ownedStreamInput(action, actionHash, live)` is a pure data converter. It snapshots and validates the stored action and live projection, verifies the whole action fingerprint, checks exact PID/generation ownership and enforces `action.sessionId === action.target.nativeId === live.sessionId`. Claude receives `{ messageId, messageHash, protocolUuid, sessionId, text }`; the separately persisted protocol UUID is reused for that action and is never regenerated by the converter. Kiro receives `{ messageId, messageHash, text }`; its held ACP client allocates the request ID only when `prompt()` is invoked, and the returned request ID is an observation rather than preparation data.

Invoke with two explicit route branches as shown. Do not choose a client, discover/adopt a PID, reconnect, attach to a prior session, change model/grants, retry, or generate a new message ID. Caller-supplied owner fields are not operating-system proof; the trusted caller must pass the actual already-held client and preserve its own ownership/lifecycle evidence. The [Claude stream](claude-stream.md) and [Kiro ACP](kiro-acp.md) references describe their separate adapter boundaries. This converter itself does not authenticate ownership or establish delivery.

## Intent and ambiguous outcomes

Before returning the action plan, the helper validates the accepted spool message through `session-messages.mjs`'s replay operation, then acquires the same exclusive `.lock` and compares the entire spool record again. It rechecks the registry and atomically persists a version-3 `notification-intents/<id>.json`, binding message ID and content hash, full target, expected native ID, native API, registry version, deadline, revision, exact route action and action hash, and append-only events. That lock temporarily prevents core spool operations. A normal call releases it; a process crash can leave it behind. The helper never removes a lock it did not create.

At most one prepare result is returned for a message ID. The caller must durably record `attempt-start` with the returned binding and current revision **before invoking** the native action. The helper does not invoke it. Once `attempt-start` is recorded, it cannot issue another action. The caller can append one `accepted`, `not-sent`, or `ambiguous` outcome attestation against the next revision. These are parent observations: `accepted` means only that the native call returned successfully; it is not delivery proof. A timeout or interruption after attempt-start leaves the lifecycle ambiguous.

Expiry is explicit and operator-driven; no timer or scheduler runs. `expire` is allowed only after the persisted deadline and rechecks the core spool while holding the intent lock. If a correlated `received`, `handled`, or `acked` spool record is already present when explicit expiry runs, the helper records that receipt instead of creating a dead letter. This applies whether the spool receipt was written before or after the deadline, provided it exists before the expiry operation. Otherwise, no attempt-start means a known-not-sent dead letter; an attempt-start without a correlated receipt means an ambiguous dead letter. Neither state can be reopened or used to prepare another action. A later spool receipt may still be appended, preserving the dead-letter event. Receipt confirmation is recorded only when the core spool replay operation validates the same message ID, content hash, full target, and monotonic `received`, `handled`, or `acked` state. A native result attestation never substitutes for this local receipt.

Every lifecycle mutation requires the exact message ID, full target, expected native ID, generation, content hash, and current revision. Stale revisions, changed spool records, superseded registrations, and mismatched bindings fail without changing the intent. `inspect` is read-only. Historical version-1 intents remain inspectable as `unknown-legacy`; their attempt history is not guessed, and no lifecycle operation reopens them. There are no automatic retries. Do not retry after ambiguity/timeout or work around it by inventing a replacement message ID. The helper cannot prevent a caller from creating a different business message, so the no-replacement-ID rule is an operator contract.

This is at-most-once action-plan issuance, not exactly-once native delivery. There is no automatic intent cleanup: retain it with the owning spool through recovery/review, then disposition the owned runtime according to its lifecycle. Unknown files are untouched.

The runtime root, registry, message directory, message file and intent directory are required to be regular non-symlink paths where checked. Registry/message version, exact identities, hash, and state are checked before preparation. Filesystem permissions still govern access; use a private task-scoped runtime root, never a shared/global harness configuration directory. No credentials, transcript copies, arbitrary command fields, or provider/model calls are involved.

## Verification

```powershell
node --test skills/engineering/orchestrate/scripts/native-notification.test.mjs
node --test skills/engineering/orchestrate/scripts/codex-queue.test.mjs
```

The notification fixture covers exact target binding, deadline validation, durable action-hash-bound attempt-start/outcome events, explicit not-sent and ambiguous expiration, revision and identity rejection, version-1 unknown state, version-2 compatibility, process-independent inspection, and late receipt history from the validated core spool. The queue fixture covers fixed argv and queue-plan validation. Neither invokes a native tool or qualifies delivery; #179's bounded existing-worker canary remains parent-owned.
