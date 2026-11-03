# Kiro V3 ACP shutdown findings (2026-11-02)

## Finding

Kiro CLI 2.37.1 V3 advertises `session/close`, but closing after a model-bearing prompt does **not** resolve the EOF teardown failure. A harmless marker-only prompt returned `end_turn`; `session/close` then returned `{}`; after stdin EOF the process still emitted `error: the v3 engine did not exit within 5 seconds after ACP stdin closed` and exited 1. A separate process loaded the closed session and recovered the marker. The close method preserves conversation data, but is not a verified workaround for a model-used engine.

Fresh baseline and close-after-turn probes both reproduced that exact KAS teardown error and exit 1. In a first supervised-mode attempt, Kiro ran harmless `git status --short` without asking permission, so that session was not treated as a cancellation test. In the cancel arm, the client switched the session's advertised `autopilot` option to `off`, requested one write to an owned scratch sentinel, received a native `session/request_permission` with `allow_once`, `allow_always`, `reject_once`, and `reject_always`, sent `session/cancel` without answering approval, received prompt stop reason `cancelled`, then `session/close` returned `{}`. EOF again produced the same error and exit 1. The sentinel was not created. This is a native teardown infrastructure failure, separate from prompt/cancel outcomes and session recovery.

## Protocol and observed sequence

The installed `kiro-cli` reported version **2.37.1** and started KAS **0.66.70**. `initialize` returned protocol version 1 and advertised `sessionCapabilities.list`, `.close`, and `.delete`; it advertised no V3 terminate extension. Probes used `acp --agent-engine v3 --auth-method cli`, a disposable local session, and the current repository cwd. No CLI/global settings or installed files changed. The cancel arm changed only that session's advertised `autopilot` option to `off`.

Sequence observed on an empty disposable session:

1. `initialize` returned the `close`, `list`, and `delete` capability objects.
2. `session/new` returned `sess_548c0e9c-5c11-4875-81b3-728b9686a2bb`.
3. `session/close` returned an empty success result.
4. `session/list` still included that same ID with status `idle`.
5. Closing stdin produced process exit 0; native stderr showed KAS 0.66.70 startup and no shutdown error.
6. In a separate process, `session/load` successfully loaded the same session. The probe then called `session/delete` on this exact disposable ID and `session/list` returned an empty array. The second process also exited 0.

For comparison, a second empty-session probe with `session/close` followed by EOF exited 0; the closed session remained listed as idle, loaded successfully in a separate process, then was explicitly deleted after that preservation check. This clean idle case does not generalize to model-used sessions. Do not use `session/delete` as shutdown; it discards the session record. `session/cancel` settled the active permission wait but did not settle the ACP process.

The new raw probes poll `Win32_Process` PID/parent PID/name trees at 500 ms intervals. During each model turn, the Kiro CLI PID had live `node.exe` KAS and `conhost.exe` children. After EOF error/exit, the final poll showed the owned CLI PID absent and no remaining descendants in its process tree. These observations establish settlement for the owned child tree in these runs, independently of the CLI exit status. The earlier #162 raw receipt did not preserve the same complete poll.

The completed-turn reload returned `end_turn` and streamed the exact marker `T189-amber-604`; the canceled-write session returned `cancelled`, and the sentinel file was not created. The canceled session is retained for review. No owned model-bearing session was deleted.

## Support sources

- Kiro's [ACP migration guide](https://kiro.dev/docs/cli/v3/acp-migration/) says the V2 `_kiro.dev/session/terminate` method has no V3 equivalent and `session/cancel` only stops an active turn. It directs clients to negotiate capabilities and use V3 session methods.
- The [Kiro ACP overview](https://kiro.dev/docs/acp/) likewise says the running server's advertised capabilities are authoritative.
- The [ACP protocol schema](https://github.com/agentclientprotocol/agent-client-protocol/blob/main/docs/protocol/v2/schema.mdx) defines `session/close` as closing an active session and freeing its resources; it cancels ongoing work as `session/cancel` would. It defines `session/delete` separately as deleting a session from the list. Kiro advertised both methods and the observation confirmed close preserved the empty session for a later load.

Checked 2026-11-02. Documentation was checked against observed capabilities from the installed Kiro 2.37.1 process. No fixed Kiro release containing a teardown fix or model-bearing shutdown sequence was identified.

## Disposition and remaining limit

- The empty idle-session probe was loaded, explicitly deleted, and absent from the final list; its processes exited 0. The completed-turn baseline, completed-turn close, reload, and canceled-permission close probes each exited 1 after reproducing the KAS EOF error. Their owned process trees were observed present while active and absent after exit.
- Model-bearing sessions `sess_ac66abe4-a0c8-4b89-9de8-657d36165bb6` (EOF baseline), `sess_1e07309c-94c8-49cd-b99f-681c356f58c7` (closed after completed turn and reloaded with marker), `sess_10cfb02d-fb98-4c55-aecd-eb3928f84474` (supervised read control), and `sess_d12b7099-e47f-41da-81e9-30689a24603c` (permission canceled, then closed) remain preserved and were not deleted. The original #162 session `sess_ad6e7317-8444-4745-b044-a4a5146d0c3f` was not closed, deleted, or modified.
- The original #162 session `sess_ad6e7317-8444-4745-b044-a4a5146d0c3f` was not closed, deleted, or modified; its retained evidence says it can be loaded and the marker recovered.
- No installed patch, global setting change, provider switch, or unrelated process termination occurred. Existing user Kiro configuration was used only for the native CLI's normal authentication/state.
- No supported fix or bounded workaround for model-bearing EOF teardown was verified. The advertised close method preserves state but still fails to settle both a completed turn and a canceled permission wait. Ticket acceptance must retain this unresolved criterion and communicate that callers can receive successful prompt/cancel results while ACP process shutdown still fails. No provider fallback or unrelated process termination occurred.

