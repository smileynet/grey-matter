# Owned Claude stream adapter

`scripts/claude-stream.mjs` wraps one Claude Code CLI process owned by the
orchestrator. It is an internal adapter, not a CLI command, a general process
runner, or a way to attach to another person's terminal or desktop session.

## Start one disposable session

Call `startClaudeStream({ executable, cwd, env, limits, sessionId, model })` only
from trusted orchestration code. `executable` is the expected canonical path,
SHA-256 and byte ceiling used by `owned-process.mjs`; `cwd`, an explicit
environment map, and all finite process limits are required. The adapter copies
these values synchronously before the first filesystem await. Its own fixed argv
is `-p --input-format stream-json --output-format stream-json
--replay-user-messages --verbose
--include-partial-messages --session-id <sessionId> --model <model> --restricted
--tools "" --permission-prompts none --strict-mcp-config --mcp-config
{"mcpServers":{}} --no-session-persistence`. Caller data cannot change that
argv. There is no shell, resume, fork, retry, or fallback model.

The session ID is a caller-selected canonical UUID. `ready` resolves only after a
`system/init` record reports that exact ID and includes Claude's resolved model,
CLI version, tool list, MCP server list, and permission mode. It rejects if the
observed built-in tool list or MCP server list is non-empty, or if the session is
in an automatic permission mode. The parent still checks the exact binary, model
entitlement, managed policy, and disposable-task preflight before sending any
task. A version or `system/init` record is not authorization.

`--restricted` is a supported CLI setting that avoids user/project/local settings
and customizations while retaining managed policy. The empty strict MCP config
and empty built-in tool list narrow the session surface further. Managed policy
and account-level model access remain parent preflight concerns. No host settings
are changed. `--no-session-persistence` keeps this owned process ephemeral: its
session cannot be resumed from disk, and the adapter does not claim restart,
reconnect, or transcript persistence. The parent may separately retain only
bounded, task-owned input, replay, and result evidence.

## Send and observe

The parent may call `send({ messageId, messageHash, protocolUuid, sessionId, text })`
while startup is pending, but only for the first actual, already accepted and
durably attempt-started message bound to this exact owned session. The adapter
snapshots and validates those values before its first await, rejects unknown
fields, enforces the exact owned session, and permits only one in-flight turn.
This input stays pending until init validates the exact session and metadata;
init then moves the session to busy, so a second message cannot enter before the
first correlated terminal result. The init-first sequence remains supported.
For startup-first order, persist the shared notification `attempt-start`, convert
that exact stored action for the already-held client, call `send` once, then
await `ready` to validate the post-input init metadata.
`messageHash` is a SHA-256 hex digest. `protocolUuid` is a canonical UUID
and is sent as Claude's documented user-message `uuid`; core identity fields stay
outside the provider wire message. The wire message contains only documented
user-message fields: `type: "user"`, `uuid`, `session_id`, `message` with
`role: "user"` and text `content`, `parent_tool_use_id: null`, and
`client_composed: true`. Text stays on stdin as JSONL data; it never enters argv.
The `send` return value `stdin-written` means only that the local child pipe
accepted the encoded line. It does not prove Claude read or processed it. An
unsafe or mismatched init, failed write, or disconnect with that startup input
pending leaves delivery ambiguous and requires parent recovery; there is no
bootstrap prompt, automatic retry, or second input on that process. `ready` can
resolve after the first write and validates startup metadata only; it is neither
an input receipt nor a task result.

Some current CLI paths can emit the same `system/init` metadata again after a
session control change. The adapter accepts a re-emitted init only when its
session ID, model, CLI version, permission mode, tool list, MCP server list, and
capabilities exactly match the originally validated metadata. It emits a
status-only `system_init_repeated` event; it does not resolve `ready` again,
change the current phase, acknowledge an input, release the active turn, or
produce a result. Changed or unsafe metadata faults the protocol. This handles
the documented producer possibility; it does not identify the cause of the
earlier native #236 protocol-order failure.

The `events` async iterable reports distinct observations:

- `input-replayed`: Claude echoed the exact UUID, session, text, and
  `isReplay: true`. This confirms the provider stream replayed the input; it is
  not a task result.
- `input-observed`: matching user content appeared without `isReplay: true`. It
  is observable input but is not promoted to the replay acknowledgment.
- `status` with subtype `command_lifecycle`: a scheduling metadata frame with
  its own event UUID. The adapter validates the exact current session and event
  UUID, then ignores all other fields. The adapter does not use this status as
  input acknowledgment or correlation, and it cannot change readiness, release
  the active turn, or count as a result, even if the opaque frame contains
  lifecycle-looking values.
- `status` with subtype `rate_limit_event`: validated rate-limit state metadata.
  `allowed` and `allowed_warning` are informational only; they do not prove
  input receipt, change readiness, release the active turn, or count as a
  result. The status carries only the documented `status`, optional
  `rateLimitType`, and optional raw numeric `resetsAt` fields. The adapter does
  not infer a unit or forward unknown payload fields. A `rejected` status is a
  hard stop: the adapter faults the protocol before returning from observation,
  stops this owned process, and emits `protocol-fault` with the validated limit
  details. It never retries, switches providers, or sends another input. If an
  input was already active, process settlement remains an ambiguous disconnect;
  any earlier result remains separate evidence. Report the observed reset value
  as supplied, or report that no reset value was supplied.
- `stream-event` and `assistant`: correlated partial and completed response
  content. The first response frame must carry the submitted user UUID. Later
  frames without UUID correlation are attached only within that documented
  sequential response boundary, ending at a correlated result.
- `provider-result`: a terminal success or error result whose
  `user_message_uuid` or `user_message_uuids` identifies the submitted UUID.
  This is separate from process settlement and from parent-native task receipts.
- `ambiguous-disconnect`: the owned process closed before a matching terminal
  result. Exit code zero alone never means the task completed.
- `process-exit`: the exact owned process's close observation, with exit code,
  signal, generation, byte counts, and timestamps.
- `protocol-fault`: malformed, unexpected, out-of-order, wrong-session, or
  uncorrelated stream data, or a rejected usage-limit status. The adapter stops
  the owned child and does not retry. For a decoded JSON record that fails
  protocol observation, the event includes a bounded `diagnostic` projection:
  phase before the record, normalized JSON byte count, allowlisted type and
  subtype labels (unknown labels are represented only by SHA-256 and UTF-8 byte
  length), a small allowlisted set of present key names, and the count of keys
  outside that allowlist,
  parent-tool-use field kind/presence, and a session-match boolean. It never
  includes raw UUIDs, message text, unknown field names/values, or error text.
  Malformed or non-record output has no diagnostic because no decoded record
  exists to describe.

Consume `events` before sending and while the process runs. Its in-memory event
queue is bounded; a slow or absent consumer backpressures stdout, and process
limits/deadlines still apply. `stop()` closes the input and asks
`owned-process.mjs` to stop only this child. A stop result describes process
settlement; it does not retroactively prove a task result. `processCompletion` is the
lower-level process close observation. `completion` waits for both process close and
bounded stderr collection; it rejects if the stderr stream limit is exceeded.
`stderr` is a private `Promise<Buffer>` containing raw child diagnostics. Read it only
for an authorized investigation, redact before retention, and never use authentication
strings from it to obtain access.

`createClaudeStreamProtocol(sessionId)` is a pure, data-only boundary for testing
decoded records and for parent integration. It owns no process and confers no
authorization. Only `startClaudeStream` binds it to the exact verified child.

## Supported surface and limits

The following first-party pages were checked on 2026-11-03:

- Anthropic's [Streaming Input](https://code.claude.com/docs/en/agent-sdk/streaming-vs-single-mode)
  describes persistent input and uses `type: "user"` messages with
  `message.role: "user"` and `message.content`.
- The [CLI reference](https://code.claude.com/docs/en/cli-reference) documents
  print-mode `--input-format stream-json`, `--output-format stream-json`,
  `--replay-user-messages` (which re-emits stdin user messages to stdout for
  acknowledgment and requires both stream-json formats),
  `--include-partial-messages`, `--session-id`, `--model`, `--restricted`,
  `--tools`, `--permission-prompts`, `--strict-mcp-config`, `--mcp-config`, and
  `--no-session-persistence`.
- [Run Claude Code programmatically](https://code.claude.com/docs/en/headless)
  documents newline-delimited `stream-json` output and describes the final line
  as a `result` record. It also documents `system/init` session metadata.
- The [TypeScript Agent SDK reference](https://code.claude.com/docs/en/agent-sdk/typescript)
  defines `SDKUserMessage`, `SDKUserMessageReplay`, `SDKAssistantMessage`,
  `SDKResultMessage`, `session_id`, and `user_message_uuid(s)` correlation. Its
  `user_message_uuid` entry states: “Claude Code echoes a `uuid` only if you set
  one on the message.”
- The pinned public [`sdk.d.ts` for 0.3.316](https://unpkg.com/@anthropic-ai/claude-agent-sdk@0.3.316/sdk.d.ts)
  defines `rate_limit_event` as a same-session UUID frame with a
  `rate_limit_info` object. The SDK's documented `status` values are
  `allowed`, `allowed_warning`, and `rejected`; `rateLimitType` and `resetsAt`
  are optional fields. The declaration does not specify reset units. This
  adapter treats `rejected` as the project's hard-stop condition even though
  SDK/CLI behavior can include waiting or retries; project policy takes
  precedence and no provider retry is attempted.
- Anthropic's [TypeScript Agent SDK changelog](https://github.com/anthropics/claude-agent-sdk-typescript/blob/main/CHANGELOG.md#030206)
  says SDK 0.3.206 added `command_lifecycle` frames to stream-json and SDK
  sessions and describes their lifecycle states; 0.3.238 adds `refused`. The
  pinned public [`sdk.d.ts` for 0.3.316](https://unpkg.com/@anthropic-ai/claude-agent-sdk@0.3.316/sdk.d.ts)
  omits this frame from its `SDKMessage` union, so this adapter does not claim
  full schema support or interpret lifecycle fields.

The parent-retained, redacted first-record observation for the pinned Claude
Code 2.1.316 executable identified `command_lifecycle` before `system/init`.
The official SDK changelog and versioned declaration were checked on 2026-11-04.
The exact pinned executable SHA-256 was
`e896a9d8da519353a49bf69ca4a695ba7e09067752687c675b3969041e632d52`; its
consumer switch at byte offset `319927613` ignores the event. The retained
observation showed the event UUID differed from the input UUID; the raw frame
and two unneeded field names were not retained. The adapter accepts only the
exact `type`, exact session ID, and a canonical UUID for the event itself, and
projects those to a status observation. It does not read, correlate, validate,
or act on other frame fields. Unknown event types and malformed/wrong-session
metadata continue to fault as before.

A later parent-owned fresh-wire observer recorded `rate_limit_event` while the
session was busy, with the exact session match and an independent event UUID.
See the parent-maintained [native qualification report](../../../../docs/agents/research/session-messaging-native-qualification-20261104.md)
for the retained diagnostic. Its status and reset fields were not retained, so
it does not establish that quota was exhausted or identify the earlier #236
failure. The adapter validates against the published schema and reports only
fields actually present in a future frame.

The previous local read-only capture recorded Claude Code CLI 2.1.316 and its
help text in the [#231 interface report](../../../../docs/agents/research/session-messaging-interfaces-20261103.md)
and its evidence manifest; the adapter did not launch that CLI. Documentation
and help establish interface shape, not current account entitlement or runtime
qualification. Parent-owned disposable native canaries must verify actual
startup, empty tool/MCP state, exact replay, correlated result, and shutdown
before describing live delivery as qualified.

Fixtures check the synthetic protocol contract and, on Windows when the already
installed Framework C# compiler is present, launch a tiny local fake executable
through the actual wrapper. It writes 2 MiB to stderr before its startup record,
exercising the drain and byte-limit paths without launching Claude:

```powershell
node --test skills/engineering/orchestrate/scripts/claude-stream.test.mjs
```

The protocol fixture uses the current Node executable through the owned-process
helper. The wrapper fixture is local synthetic code. Neither makes a Claude process,
model call, native call, or account/config change, and neither qualifies a Claude
installation or production worker. The wrapper fixture skips when the compiler is
not already installed.
