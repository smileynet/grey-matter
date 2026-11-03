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
  nativeApi: 'collaboration.followup_task'
})
```

The envelope must already exist at `messages/<id>.json`, have a valid content hash, be in `accepted` state, and route to the exact active versioned target in `registry.json`. The separately supplied native ID and generation must equal that complete target. Only the `codex:desktop` target lane is accepted; other interfaces and adapter names fail as unsupported. A successful result contains a `toolAction` with:

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

CLI input is JSON data, never executable code:

```powershell
node skills/engineering/orchestrate/scripts/native-notification.mjs prepare --root D:\private\task-mailbox --json .scratch\notification.json
```

The JSON file contains the API fields above. The command accepts exactly these five arguments after the script name; extra arguments fail before any intent is written. On success stdout is a JSON object with `result: prepared`, the intent path, and the tool action. Errors exit nonzero and print a diagnostic to stderr. There is no retry mode.

## Intent and ambiguous outcomes

Before returning the tool plan, the helper acquires the same exclusive `.lock` used by the core spool, rechecks the registry and accepted message, then atomically persists `notification-intents/<id>.json`. The intent binds version, message ID and content hash, full target, expected native ID, native API, registry version, state `prepared`, and preparation time. That lock temporarily prevents core spool operations. A normal call releases it; a process crash can leave it behind. The helper never removes a lock it did not create.

At most one prepare result is returned for a message ID. A duplicate call, existing intent, stale lock, interrupted process, or uncertain native invocation fails closed; it never returns another notification action automatically. Inspect the persisted intent and native tool result manually. If it is unclear whether the action ran, do not resend under the same or a new ID until the coordinator resolves the ambiguity. This is at-most-once action-plan issuance, not exactly-once native delivery. There is no automatic intent cleanup: retain it with the owning spool through recovery/review, then disposition the owned runtime according to its lifecycle. Unknown files are untouched.

The runtime root, registry, message directory, message file and intent directory are required to be regular non-symlink paths where checked. Registry/message version, exact identities, hash, and state are checked before preparation. Filesystem permissions still govern access; use a private task-scoped runtime root, never a shared/global harness configuration directory. No credentials, transcript copies, arbitrary command fields, or provider/model calls are involved.

## Verification

```powershell
node --test skills/engineering/orchestrate/scripts/native-notification.test.mjs
```

The fixture covers exact target binding, separate expected native ID, accepted-record hash and state, one-time intent behavior, ambiguous lock, unsupported lanes, stale generation, unsafe message IDs and malformed targets. It does not invoke the native tool or qualify delivery. #179's bounded existing-worker canary is a separate parent-owned step.
