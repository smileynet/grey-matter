# Owned subprocess streams

Use `scripts/owned-process.mjs` only from trusted harness-adapter code that owns a
specific provider executable and invocation. It is an internal module, not a CLI and
not a command runner for ticket files, user messages, or other JSON packets. Adapter
code supplies its expected canonical executable path and SHA-256, fixed argument
construction, working directory, and explicit environment. Never let a message or
registry field choose an executable, argument vector, working directory, or environment.

## Start and observe

`startOwnedProcess({ executable, argv, cwd, env, limits, stdoutMode })` verifies the
executable before spawning it. It snapshots and validates the option values
synchronously before its first asynchronous filesystem check; later caller mutation
does not change the invocation or its limits. `executable` is `{ canonicalPath, sha256, maxBytes }`;
the path must resolve to the expected canonical file, be a regular file, fit the byte
ceiling, and match the expected hash. `argv` is an array of NUL-free strings, `cwd` is
an absolute canonical directory, and `env` is an explicit string map. The module never
uses a shell, never inherits the parent's environment implicitly, and hides the child
window on Windows.

Every call provides finite `limits`:

- `maxArgumentBytes`: maximum UTF-8 bytes in `argv` and, separately, in `env`.
- `maxInputBytes`: cumulative bytes accepted from adapter writes.
- `maxStdoutBytes` and `maxStderrBytes`: total observed stream bytes.
- `maxLineBytes`: maximum unterminated JSONL record size.
- `deadlineMs`: maximum process lifetime before owned shutdown begins.
- `eofGraceMs`, `terminateGraceMs`, `forceGraceMs`: bounded time for each stop phase.

The implementation enforces hard ceilings in addition to requiring each value. The
`maxBytes` on `executable` separately bounds hashing. `stdoutMode` is `jsonl` (default)
or `raw`; use raw bytes only for an adapter protocol that needs to inspect its own
framing. There is no implicit default executable, working directory, timeout, or output
limit.

The returned handle exposes only this child: `pid`, a unique `generation`,
`requestedAt`, `stdout`, `stderr`, `completion`, `write(data)`, `endInput()`, and
`stop()`. Consume `stdout` and `stderr` while the process runs. The streams preserve
backpressure; `write` waits for the child input pipe to drain and reports whether it
was backpressured. `completion` resolves with local process observations (`pid`,
`generation`, requested/start/exit/close timestamps, exit code, signal, output byte
totals, and a reason: `exit`, `stopped`, `deadline`, `output-limit`, or `spawn-error`).
`exitedAt` is when the child process exits; `closedAt` is when its stdio has closed.
Inspect the exit code and reason; process exit does not prove that a provider received
a prompt or completed a task.

In `jsonl` mode, each newline-terminated UTF-8 record emits one event:

- `{ type: "record", line, value }` for valid JSON.
- `{ type: "malformed", line }` for invalid JSON.
- `{ type: "invalid-utf8", line }` for invalid UTF-8.
- `{ type: "truncated", line, bytes }` for final bytes without a newline.

Malformed, invalid-UTF8 and truncated records are observations, not valid protocol
messages. Adapters decide whether their protocol can continue after them. Total-output
and line limits fail the affected stream and start bounded shutdown of the owned child;
an over-limit line rejects with `OwnedProcessError` code `LINE_LIMIT` and its line and
limit, while stream totals reject with code `OUTPUT_LIMIT` and stream/byte details.
Stderr remains bounded raw bytes. A synchronous spawn error rejects the start call with
`OwnedProcessError` code `SPAWN_ERROR`; an asynchronous spawn failure is reported by
`completion.reason === "spawn-error"` and its token-free error fields. Failed writes,
input limits, output limits, and stop timeouts have distinct error codes (`WRITE_ERROR`,
`EARLY_EXIT`, `INPUT_LIMIT`, `OUTPUT_LIMIT`, `LINE_LIMIT`, `STOP_TIMEOUT`).

## Stop and ownership

`endInput()` sends EOF and waits for the stream to finish. `stop()` sends EOF, waits up
to `eofGraceMs`, then signals only the exact `ChildProcess` created by this call, first
with termination and then force if needed. It observes close for `terminateGraceMs` and
`forceGraceMs`; a stop timeout is an error, never a successful teardown receipt. It
does not look up, adopt, signal, or kill a PID from input, a sibling, a process group,
or a prior run. After the child emits `exit`, the handle waits for `close` without
signaling again. A child that launches descendants does not transfer their ownership
to this handle; no process-tree cleanup is implied.

The executable hash is checked immediately before spawn, but the operating system
starts a path rather than the file handle used to hash it. Adapters must bind the
expected hash and canonical install path from trusted, current harness evidence and
avoid mutable/untrusted executable directories. This module does not close that OS
path-replacement race or validate provider protocol identity.

Keep protocol/session correlation, retry policy, durable spool, native calls,
authorization decisions, and provider-specific configuration in the owning adapter or
parent coordinator. Do not auto-restart after an ambiguous exit. Do not log child
environment variables, message transcripts, or raw provider streams; retain only the
bounded, task-owned evidence required by the adapter.

Fixture:

```powershell
node --test skills/engineering/orchestrate/scripts/owned-process.test.mjs
```

The fixture uses the current Node executable through a real child process, verifies its
hash before launch, and creates no provider session or model call. It tests process
ownership and stream behavior only; it does not qualify any harness adapter.
