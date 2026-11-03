# Kiro V3 ACP shutdown findings (2026-11-02)

## Finding

Kiro CLI 2.37.1 V3 advertises a supported `session/close` capability. In a bounded metadata-only probe, closing a newly created session before closing ACP stdin exited cleanly (status 0), and the session remained listable and loadable from a second process. The disposable session was then deleted using its separately advertised `session/delete` method. This establishes a supported, state-preserving close sequence for an idle session. It does **not** prove the sequence fixes EOF teardown after a model-bearing or cancelled turn: that path was not rerun with `session/close`.

The failure in #162 is reproduced in the retained evidence: model-bearing prompt responses completed (including a `cancelled` response), and a later process recovered the same session and marker, while the two ACP processes that received stdin EOF exited 1 with `error: the v3 engine did not exit within 5 seconds after ACP stdin closed`. This is a native teardown infrastructure error, not a failed prompt assertion or failed session recovery. It shows why successful prompt results and durable reload do not establish that the process tree has settled.

## Protocol and observed sequence

The installed `kiro-cli` reported version **2.37.1**. `initialize` returned protocol version 1 and advertised `sessionCapabilities.list`, `.close`, and `.delete`; it also advertised Kiro V3 extensions. No `_kiro/session/terminate` method was advertised. The probe used the normal installed CLI with `acp --agent-engine v3 --auth-method cli`, the current repository as cwd, and the already configured user Kiro state. It changed no settings and sent no prompt/model request.

Sequence observed on an empty disposable session:

1. `initialize` returned the `close`, `list`, and `delete` capability objects.
2. `session/new` returned `sess_548c0e9c-5c11-4875-81b3-728b9686a2bb`.
3. `session/close` returned an empty success result.
4. `session/list` still included that same ID with status `idle`.
5. Closing stdin produced process exit 0; native stderr showed KAS 0.66.70 startup and no shutdown error.
6. In a separate process, `session/load` successfully loaded the same session. The probe then called `session/delete` on this exact disposable ID and `session/list` returned an empty array. The second process also exited 0.

This is a bounded workaround candidate: after a prompt reaches a terminal response and before ending the ACP stream, call `session/close` for the session, wait for its response, then close stdin and verify the child/descendant process tree has exited. The tested close was on an idle session, so applying it after a completed or cancelled turn remains unverified. Do not use `session/delete` as shutdown; it discards the session record. Do not treat `session/cancel` as process shutdown: it stops an active turn only.

The raw #162 receipt reports no surviving captured engine processes after the EOF failures, but did not retain a complete PID/parent-tree poll. The new close probe observed the direct CLI child exit code, but did not instrument every descendant PID. Therefore descendant settlement is **not independently proven** for either captured run; a live descendant must not be inferred absent from a parent exit alone.

## Support sources

- Kiro's [ACP migration guide](https://kiro.dev/docs/cli/v3/acp-migration/) says the V2 `_kiro.dev/session/terminate` method has no V3 equivalent and `session/cancel` only stops an active turn. It directs clients to negotiate capabilities and use V3 session methods.
- The [Kiro ACP overview](https://kiro.dev/docs/acp/) likewise says the running server's advertised capabilities are authoritative.
- The [ACP protocol schema](https://github.com/agentclientprotocol/agent-client-protocol/blob/main/docs/protocol/v2/schema.mdx) defines `session/close` as closing an active session and freeing its resources; it cancels ongoing work as `session/cancel` would. It defines `session/delete` separately as deleting a session from the list. Kiro advertised both methods and the observation confirmed close preserved the empty session for a later load.

Checked 2026-11-02. Documentation was checked against observed capabilities from the installed Kiro 2.37.1 process. No fixed Kiro release containing a teardown fix was identified.

## Disposition and remaining limit

- The new empty session was loaded, explicitly deleted, and absent from the final list. The two probe ACP CLI processes returned exit code 0. No prompt was sent, so no model call occurred.
- The original #162 session `sess_ad6e7317-8444-4745-b044-a4a5146d0c3f` was not closed, deleted, or modified; its retained evidence says it can be loaded and the marker recovered.
- No installed patch, global setting change, provider switch, or unrelated process termination occurred. Existing user Kiro configuration was used only for the native CLI's normal authentication/state.
- The #162 teardown failure remains open as an engine/driver qualification issue. The close-before-EOF sequence is promising and state-preserving for an idle session, but must be exercised after both a clean model turn and a cancelled permission wait before claiming the failure fixed. Instrument process IDs and parent-child settlement in that follow-up; direct process exit alone is insufficient.

