# Kiro ACP adapter

This adapter owns one Kiro CLI ACP child and one new ACP session. It is a protocol
transport, not a task dispatcher or command runner. The parent orchestrator remains
responsible for authorization, task identity, native delivery, evidence retention and
deciding what a returned task result means.

## Entry point

`startKiroAcp({ executable, cwd, env, limits, agent, model })` verifies and starts a
child through `owned-process.mjs`. The executable descriptor, explicit environment,
canonical working directory and finite limits must come from trusted parent
preflight. The adapter snapshots them synchronously before starting asynchronous work.
It constructs fixed arguments:

```text
acp --agent-engine v2 --agent <trusted-agent-name> --model <trusted-model-name>
```

Kiro's current CLI reference documents `acp`, `--agent`, `--model`, and the explicit
`--agent-engine v1|v2|v3` selection. Its current guidance says ACP defaults to V3 on
CLI 3.0+, with V2-only flags including `--agent` and `--model` selecting V2; this
adapter sets V2 explicitly so saved settings and future default changes do not select
another engine. Kiro may change these flags; recheck its official [ACP CLI
documentation](https://kiro.dev/docs/cli/acp/) and [agent-engine selection
guide](https://kiro.dev/docs/cli/agent-harness/) before changing the argv contract.

The supplied `agent` must be a parent-approved, task-private tool-free profile. The adapter checks only the
profile name's shape: it cannot inspect or prove profile contents. Never treat this
adapter's refusal to answer ACP tool requests as proof that a Kiro profile cannot
execute its own tools.

## Protocol and results

The connection uses ACP protocol version 1 over UTF-8, newline-delimited JSON-RPC on
stdio. It advertises no filesystem, terminal or terminal-authentication capability.
It calls `initialize` then `session/new` with the exact working directory and an
empty `mcpServers` list. ACP v1's client notification union does not include a plain
`initialized` notification, so the adapter does not send one. It binds only the opaque
`sessionId` returned by that call. It does not call `session/load`, reuse a previous
session, connect MCP servers, restore work, or attach to a foreign session.

Prompts are sent one at a time as ACP text content. Each prompt requires a stable
parent `messageId` and SHA-256 `messageHash`; the identity stays separate from the
text, and the returned request/session IDs provide a parent integration seam. This
module does not create a native action hash or emit native notifications. Do not
queue or resend a prompt after a busy refusal, timeout, disconnect, malformed
response, or ambiguous result.

The returned `pid`, `generation`, and `requestedAt` are immutable observations from
the exact owned child handle. They support parent-side routing and cleanup records;
they do not prove process-tree settlement or authorize PID adoption or signaling.

`prompt()` resolves only after the correlated `session/prompt` response and returns
the protocol `stopReason` separately from local process completion. A disconnect
after send is `AMBIGUOUS`; it does not prove delivery or task completion. A returned
`cancelled` reason is a protocol result. `close()` stops only the exact child owned by
the `owned-process.mjs` handle. Local child exit/close is separate evidence and does
not prove the Kiro task's outcome or descendant cleanup. No PID lookup, process-name
kill, adoption, automatic restart or retry is supported.

An owner-initiated `close()` ends the local updates iterator with `CLOSED` only when the
owned-process handle reports its exact `stopped` result. Unexpected process exit, remote
EOF, deadline, abnormal termination and any earlier protocol failure remain
`DISCONNECTED` or retain the original error. This is a local transport classification;
it does not assert that Kiro completed graceful provider-side shutdown.

`processCompletion` exposes the close result independently. `completion` waits for
both process close and bounded stderr collection and rejects when the configured
stderr stream limit is exceeded. `stderr` is a private `Promise<Buffer>` with raw
child diagnostics. Read it only for an authorized investigation, redact before
retention, and never use authentication strings from it to obtain access.

Updates are available from the session's async `updates` iterator. They are scoped to
the exact returned session ID. Unknown, duplicate, late, malformed or foreign-session
responses fail the connection rather than being guessed into a task result.

## Trust and permission boundaries

The client advertises no file-system, terminal or terminal-authentication support.
ACP `session/request_permission` calls receive the explicit `cancelled` outcome.
File-system and terminal requests receive JSON-RPC `-32601` (unsupported method).
Other agent-to-client requests are also rejected with `-32601`. The adapter never
reads/writes workspace files, starts a terminal, approves a permission, answers
access-token requests, copies credentials, or changes CLI/global settings. Use only
the already-authenticated Kiro CLI account (`kiro-cli login`); if session creation
reports authentication is required, the adapter returns `AUTH_REQUIRED` for the
parent to resolve manually. It never enables trust flags.

Client capabilities and method boundaries follow the ACP [initialization
contract](https://agentclientprotocol.com/protocol/v1/initialization), [stdio
transport](https://agentclientprotocol.com/protocol/v1/transports), [session
setup](https://agentclientprotocol.com/protocol/v1/session-setup), [prompt
turn](https://agentclientprotocol.com/protocol/v1/prompt-turn), [tool permission
contract](https://agentclientprotocol.com/protocol/v1/tool-calls), and [cancellation
rules](https://agentclientprotocol.com/protocol/v1/cancellation), [the current v1
schema](https://agentclientprotocol.com/protocol/v1/schema), and
[extensibility rules](https://agentclientprotocol.com/protocol/v1/extensibility).
Capability advertisement is the authority for optional features; the adapter uses no optional
load, resume, file, terminal, or extension methods.

## Limitations and lifecycle

- This source implements only the V2 route. It does not resolve the known V3
  shutdown behavior from ticket #189; preserve that ticket's exact observed scope.
- There is no client-side permission UI, tool execution, terminal, file access,
  authentication handoff, MCP configuration, resume, load, steer, queue or retry.
- `session/cancel` requests cancellation but does not assert that the agent stopped;
  observe the protocol response and process lifecycle separately.
- If startup fails, the thrown error includes whether owned-child shutdown was
  observed. If bounded shutdown itself times out, `processCompletion` remains
  available as a promise and no teardown success is asserted.
- A timed-out or disconnected prompt can have an unknown result. Preserve the parent
  task's message identity and raw evidence; never automatically replay it.
- Protocol tests in `kiro-acp.test.mjs` use synthetic JSON-RPC frames. On Windows,
  when the already-installed Framework C# compiler is available, wrapper tests also
  launch a small local fake executable that checks initialization order and writes
  bounded stderr. These tests do not launch Kiro, authenticate, call a model, qualify
  an installed profile or prove native delivery. `owned-process.test.mjs` covers
  generic local child mechanics, not Kiro engine shutdown.

Raw provider transcripts and environment variables may contain secrets. Retain only
bounded, task-owned evidence approved by the parent; never place credentials or
unredacted transcripts in normal logs or committed fixtures.
