# Durable session message spool

Use this helper only for a local, file-backed coordination fixture or an explicitly authorized manual spool. It records a caller-selected existing session identity and message lifecycle. It does not attach to, wake, inspect, or send anything to a native harness session. A `queued` or `accepted` receipt is not native delivery, receipt, task acceptance, or exactly-once processing.

## Current adapter qualification

This implementation exposes only the deterministic local spool/manual-poll path. It has no native adapter command. The current shared owner, [ticket 179](../../../../.tickets/179-inter-harness-session-communications.md), requires evidence-backed qualification for each native surface and explicitly keeps the Agy hold. It records prior Codex CLI and Antigravity spike evidence but also says versions and warnings must be revalidated before implementation; this artifact performed no native probes. Therefore none of these interfaces is qualified by this helper:

| Harness/interface | Result here | Evidence boundary |
|---|---|---|
| Codex desktop / CLI queue | Unsupported by this helper; unqualified current interface | #179 records historical Codex CLI 0.164.0 queue evidence and requires revalidation; no current probe in #208. |
| Claude Code | Unsupported by this helper; unqualified | #179 acceptance requires current primary-source and observed capability evidence; none was collected here. |
| kiro-cli | Unsupported by this helper; unqualified | Same #179 evidence requirement; no current probe here. |
| Kiro Crew | Unsupported by this helper; unqualified | Same #179 evidence requirement; no current probe here. |
| Antigravity App / CLI / IDE sidecars | Unsupported by this helper; unqualified; Agy hold remains | #179 records historical App 2.28.2 evidence and requires revalidation; no Agy commands or current probes were run here. |

These results describe this helper's capabilities, not whether another separately qualified product surface exists. Do not infer permission to probe from the table.

## Authorization and runtime root

Every invocation requires `--root PRIVATE_DIR`. Choose a private, caller-owned, task-scoped directory outside the repository and outside shared/global harness configuration. The tool has no default root and creates no root when a command other than `init` is used. `init` creates `registry.json` and `messages/` but preserves all existing files, directories, and unknown data. It does not initialize a task ledger, store credentials, or copy conversation history.

Before using it, confirm that the parent task authorizes the particular local registry/message writes and that the selected session details are accurate. A message written to this spool does not grant its recipient authority. `register`, `send`, lifecycle transitions, and `init` mutate the supplied runtime root. `poll` and `status` only read. `replay` only returns the existing record; it never retries delivery. Native sends, replacement-session creation, settings changes, and implicit “last active” selection are not implemented.

## Schema and selection

`registry.json` is `{ "version": 1, "sessions": [...] }`. Each session has a `target`, status (`registered`, `superseded` or `retired`), and registration timestamp. A target contains exactly:

```json
{
  "project": "project-key",
  "host": "host-key",
  "harness": "codex",
  "harnessVersion": "not-reported",
  "interface": "desktop",
  "nativeId": "opaque-existing-session-id",
  "generation": 1,
  "role": "worker",
  "worktree": "absolute-or-recorded-worktree",
  "branch": "worker/topic"
}
```

All values except `generation` are nonempty strings. Set `harnessVersion` to the observed harness/client version or the explicit value `not-reported` when it is unknown; the latter records missing metadata and does not qualify that interface. Generation is a positive integer. Registering the same project/host/harness/interface/native ID requires a strictly higher generation and marks prior generations superseded, including when the recorded harness version changes. Every route and transition must present the full exact target object, including the same harness version. A version mismatch is a different target. There is no partial lookup or fallback target.

Each message is a version 1 JSON record in `messages/<id>.json`, with stable `id`, `correlationId`, optional `replyTo`, `kind` (`message`, `reply`, `done`), exact `from` and `to` targets, bounded UTF-8 `body` (16 KiB), `state`, timestamps and content hash. An existing ID with the same content is idempotent; changed content under that ID is a conflict. A reply or done message must reference a persisted parent, reverse its exact route, and keep its correlation ID. Acknowledgments are control state, never messages, so they cannot produce acknowledgment loops.

## Commands

The CLI accepts exactly `COMMAND --root PRIVATE_DIR` and optional `--json INPUT.json`. JSON input files are read as data; the tool never executes their contents. Invoke from the repository root:

```powershell
node skills/engineering/orchestrate/scripts/session-messages.mjs init --root D:\private\task-mailbox
node skills/engineering/orchestrate/scripts/session-messages.mjs register --root D:\private\task-mailbox --json .scratch\session.json
node skills/engineering/orchestrate/scripts/session-messages.mjs retire --root D:\private\task-mailbox --json .scratch\target.json
node skills/engineering/orchestrate/scripts/session-messages.mjs send --root D:\private\task-mailbox --json .scratch\message.json
node skills/engineering/orchestrate/scripts/session-messages.mjs accept --root D:\private\task-mailbox --json .scratch\targeted-message.json
node skills/engineering/orchestrate/scripts/session-messages.mjs poll --root D:\private\task-mailbox --json .scratch\target.json
node skills/engineering/orchestrate/scripts/session-messages.mjs receive --root D:\private\task-mailbox --json .scratch\targeted-message.json
node skills/engineering/orchestrate/scripts/session-messages.mjs handle --root D:\private\task-mailbox --json .scratch\targeted-message.json
node skills/engineering/orchestrate/scripts/session-messages.mjs reply --root D:\private\task-mailbox --json .scratch\reply.json
node skills/engineering/orchestrate/scripts/session-messages.mjs done --root D:\private\task-mailbox --json .scratch\done.json
node skills/engineering/orchestrate/scripts/session-messages.mjs ack --root D:\private\task-mailbox --json .scratch\targeted-message.json
node skills/engineering/orchestrate/scripts/session-messages.mjs replay --root D:\private\task-mailbox --json .scratch\targeted-message.json
node skills/engineering/orchestrate/scripts/session-messages.mjs status --root D:\private\task-mailbox
```

Inputs:

- `register`: `{ "target": TARGET }`.
- `retire`: `{ "target": TARGET }`, the complete exact active registration.
- `send`: `{ "id": "stable-id", "correlationId": "thread-id", "from": TARGET, "to": TARGET, "body": "...", "kind": "message" }`. `kind` and `correlationId` can be omitted; defaults are `message` and the stable ID.
- `reply` / `done`: same fields, plus required `replyTo` naming an existing parent. Correlation defaults to the parent's correlation ID and must match it.
- `poll`: `{ "target": TARGET }`.
- `accept`, `receive`, `handle`, `ack`, `replay`: `{ "id": "stable-id", "target": TARGET }`.
- `init` and `status`: no JSON input.

`retire` marks only the exact active registration retired. Wrong host, session ID, harness/interface, or generation fails closed. Historical messages and other registrations are retained; retirement never deletes records. Retired generations cannot route new messages or advance existing ones. Registering a higher generation is explicit; retired history remains retired. JSON inputs accept only the fields listed above, and the CLI accepts no trailing arguments beyond the optional single `--json FILE` pair.

`send` creates only an uncorrelated `message` record; it rejects `replyTo` and response kinds. Use `reply` or `done` to bind a response to an existing parent and enforce its reversed route and correlation. Normalized records are validated before any message file is written.

## Lifecycle and result interpretation

`send` persists `queued` before returning. This helper has no notification step. An explicitly invoked `accept` records manual/local spool acceptance; it is not harness acceptance. The receiver's `poll` returns accepted, non-acked records addressed to the exact target; queued records are excluded. Poll, status and replay leave records unchanged but acquire and remove a transient runtime lock, so they require write access to the private runtime. The receiver explicitly advances `accepted -> received -> handled -> acked`; each operation writes an atomic record. `reply` and `done` create new correlated queued records; they do not mutate the parent message's state.

Each successful command prints a JSON object. For sends, `result: queued` means only that a local record was persisted; `duplicate` means the same stable ID and content already exist. A changed-content collision exits nonzero. Lifecycle results name the persisted state; repeating a transition already reached returns `duplicate`. `poll` returns `result: polled` plus records, not a wakeup result. `replay` returns `replay-unchanged`, not a retry. Any nonzero exit is an error; inspect the supplied runtime and do not automatically retry ambiguous operations under a new ID.

## Concurrency, failure, and retention

The helper takes an exclusive `.lock`, writes JSON to a same-directory temporary file, flushes it, and renames it into place. A lock left by a crash is ambiguous. The tool deliberately refuses to remove it: inspect the named private runtime, process ownership and task state, then recover it manually under the parent task's authorization. Do not delete a lock merely because it is old. A timeout, permission error, malformed record, or ambiguous return is not success and does not trigger a delivery retry. Keep the root and records only for the owning coordination task's recovery/review window; after that, disposition them using the parent task's artifact-retention decision. The helper does not delete the root or any unknown files.

After an interrupted write, preserve the runtime and inspect the lock, target record and same-directory temporary files. Only after ownership and process state establish that the lock belongs to the interrupted operation may the parent authorize manual lock removal. A missing target record means persistence was not observed; it does not prove no external action occurred. A persisted `queued` record may be inspected or explicitly resent with the same ID and exact content after manual recovery; the helper itself never retries. A matching record returns `duplicate`. Do not create a new ID to resolve ambiguity. The fixture exits a child process immediately before and after the message-file rename: it proves local persistence, lock refusal and same-ID spool deduplication only, not delivery or exactly-once handling.

Verification fixture:

```powershell
node --test skills/engineering/orchestrate/scripts/session-messages.test.mjs
```

The fixture uses isolated temporary directories and removes only those test-owned roots.
