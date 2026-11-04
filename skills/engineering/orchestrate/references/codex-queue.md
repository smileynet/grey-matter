# Codex CLI queue plan

`codex-queue.mjs` prepares one fixed `codex queue` action from an already accepted local spool message. It does not start Codex, connect to an app server, invoke a shell, discover threads, or qualify native delivery. Current route name is `codex-cli-queue`; it requires a full existing thread UUID registered as the exact `codex:cli` target.

## Inputs

Keep the notification request and trusted runtime configuration as separate files. The request contains only the accepted spool identity and route target:

```json
{
  "id": "stable-message-id",
  "target": {
    "project": "project-key",
    "host": "host-key",
    "harness": "codex",
    "harnessVersion": "observed-version",
    "interface": "cli",
    "nativeId": "123e4567-e89b-12d3-a456-426614174000",
    "generation": 1,
    "role": "worker",
    "worktree": "D:/worker",
    "branch": "codex/task"
  },
  "threadId": "123e4567-e89b-12d3-a456-426614174000",
  "deadlineAt": "2099-01-01T00:00:00.000Z"
}
```

The parent-owned trusted runtime configuration supplies the executable and explicitly owned local endpoint. It is not selected from message body or work context:

```js
const trustedRuntimeConfig = {
  executable: {
    canonicalPath: parentConfig.codexExecutablePath,
    sha256: parentConfig.codexExecutableSha256,
    maxBytes: parentConfig.codexExecutableMaxBytes
  },
  remote: {
    endpoint: parentConfig.ownedAppServerEndpoint,
    owner: {
      pid: ownedProcessHandle.pid,
      generation: ownedProcessHandle.generation
    }
  }
};
```

`maxBytes` is a caller-owned resource ceiling, not an observed size or authorization fact. It must be a positive integer no larger than 1 GiB. Preparation reads the canonical regular executable and confirms its current byte hash and size against the supplied configuration. Those checks can become stale after preparation; the trusted executor must recheck the same executable bytes immediately before execution.

The endpoint must be exactly `ws://127.0.0.1:<port>` with an explicit port. Hostnames, other loopback spellings, non-loopback hosts, TLS, credentials, paths, query strings, and fragments are rejected. `owner` is a caller assertion copied from the actual #238 child-process handle, with exactly its `pid` and UUID `generation` fields. Preparation does not inspect the operating system's listening sockets and does not authenticate this assertion. Before executing, the trusted parent must bind that same handle and independently verify the OS reports its process as the listener for this endpoint; retain that OS observation separately. If this preflight or required remote authentication is unavailable, do not execute the plan. No bearer token or auth environment variable is part of this route.

The full target must be the only active registered Codex CLI target with that thread UUID. Preparation rejects duplicate active UUID mappings, and `attempt-start` rechecks this before returning the persisted action.

## Preparation and fixed arguments

```powershell
node skills/engineering/orchestrate/scripts/codex-queue.mjs prepare --root D:\private\task-mailbox --request .scratch\codex-queue-request.json --runtime-config .scratch\trusted-codex-runtime.json
```

The command accepts exactly these arguments. It validates the exact registered target through the shared spool, hashes the accepted message (including optional context) through the core API, creates the existing bounded intent, and emits a version-3 action plan with a canonical `actionHash`. No second message or lifecycle ledger is created.

The public arguments are derived from that exact persisted plan only:

```js
['queue', '--thread', threadId, `--message=${message}`, '--remote', endpoint]
```

The message is one `--message=<text>` value, including if its text starts with a hyphen. The action schema has no argv, shell, callback, model, provider, or arbitrary-command field. This first route omits `--resume`; it does not claim to wake an unloaded thread. A queued item, warning-free exit, or exit code zero is still only a CLI result attestation, not native receipt or worker completion.

Before execution, persist `attempt-start` using the returned exact lifecycle binding and revision. The operation returns the stored route action and action hash; do not substitute caller-edited text, executable, endpoint, target, or flags. The trusted parent/#238 then verifies the action hash, same owned process handle and listener, and current executable bytes before spawning the executable directly without a shell. Afterward, record only the observed outcome. Timeouts remain ambiguous and are never retried automatically. A correlated response through the spool is required for receipt; a different/new thread UUID is not a retry workaround.

`codex-queue.test.mjs` exercises fixed argv, exact UUID/target binding, executable hash and size mismatches, endpoint and arbitrary-argument rejection, pre-execution action-hash binding, caller-input snapshotting during asynchronous hashing, and optional context identity. These are local deterministic fixtures only. They do not start Codex or prove endpoint ownership, queue behavior, busy/idle wakeups, receipt, or completion. Those require the separately authorized parent-owned native canary.

The shared route enum currently permits only `desktop-followup` and `codex-cli-queue`. Claude Code and Kiro routes remain unselectable until separately researched and qualified; this guide makes no capability claim for them.
