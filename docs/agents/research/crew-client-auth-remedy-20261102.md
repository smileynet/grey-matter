# Kiro Crew Windows client-auth remedy (2026-11-02)

## Finding

**Recommended scoped remedy: use Kiro Crew's own KAS bundle for Crew-owned
authentication. Confidence: high for the launch route and credential-unavailable
failure path; moderate for full Crew-vault delivery, which was not exercised.**

The installed Kiro Crew 0.11.1 backend still reproduces #186's Windows mismatch.
Its KAS relay builder emits `kiro-cli.exe acp --agent-engine v3` when it intends
Crew to own authentication. The installed Kiro CLI 2.37.1 help says V3 defaults
to CLI-owned authentication, and the official ACP migration guide says the same.
So the omitted flag sends authentication to the CLI's own sign-in, not Crew's
callback. The current Windows resolver selects the same executable recorded by
#186; its SHA-256 also matches #186's native probe.

Crew 0.11.1 includes a supported alternative: configure `agent.kas_bundle=true`
and restart Crew. Its own installation help describes this route as signing in
through Crew's dashboard. The runtime source selects Crew's installed/pinned KAS
engine instead of kiro-cli, builds Node arguments ending in
`--auth=acp-callback`, and marks Crew as the auth owner. This makes the owner
explicit and avoids the CLI's omitted-flag default. The installed desktop package
contains the pinned KAS 0.66.33 engine and its Node runtime. The setting is a
Crew configuration change; this research did not change it or restart the
shared gateway.

## Observed versions and selected launch

| Component | Observed value |
|---|---|
| Kiro Crew | 0.11.1, packaged backend build `20261026` |
| Kiro CLI | 2.37.1; resolver and `Get-Command` select `%LOCALAPPDATA%\\Kiro-Cli\\kiro-cli.exe` |
| Selected CLI SHA-256 | `f4a6c31a88822b7b67d5c795df87f1465b34c6a4acbba01e9a0158ab0ff4c66c` |
| Crew KAS pin and staged bundle | 0.66.33 |
| Node runtime in staged bundle | 22.23.3, Windows x64 |
| Relay, Crew-owned branch | `kiro-cli.exe acp --agent-engine v3` (auth flag omitted) |
| Relay, CLI-owned branch | `kiro-cli.exe acp --agent-engine v3 --auth-method cli` |
| Crew bundle branch | `node.exe --experimental-wasm-modules acp-server.js --transport=stdio --auth=acp-callback` |

The installed Crew source hashes for `kas_transport.py` and `harness/kas.py`
match #186's receipt exactly. The #186 receipt's CLI hash also matches the
currently resolved executable. It records a successful explicit CLI-owned
native run (`AUTH_OK`, no client token callbacks) and the omitted-flag run
behaving identically. That CLI-owned test used the existing signed-in CLI
account; no account identity was captured or compared in either ticket.

## Credential-free bundle probe

Ran the staged Node runtime and ACP server directly, without launching Kiro Crew
or kiro-cli. The process received a private temporary profile (`HOME`,
`USERPROFILE`, `APPDATA`, `LOCALAPPDATA`, `TEMP`, `TMP` and `KIRO_HOME`) and an
empty workspace. It was started with the exact bundle argv shown above. The
probe registered its token handler before session creation and always answered
with a fixed JSON-RPC `-32000` `credential unavailable` error. It did not save
callback parameters, tokens, identity, prompt output, raw stdout or stderr.

| Step | Observation | Classification |
|---|---|---|
| `initialize` | result | Pass |
| `session/new` with empty `mcpServers` | result | Pass |
| `_kiro/auth/getAccessToken` | 8 callbacks; each received the fixed unavailable error | Pass for client-owned routing and negative control |
| `session/prompt` | error code `-32000`; no token supplied | Pass for expected failure handling |
| Process exit | 0 after normal ACP stdin close | Pass |

The output is consistent with a client-owned KAS bundle route and confirms the
engine fails the prompt when the client cannot supply credentials. It does not
exercise Crew's actual vault callback, token refresh, successful sign-in, or the
full Crew session setup. The separate CLI-owned success and the relay mismatch
come from #186's receipt, tied to this exact same CLI executable by hash.

## Supported integration recipe

For Crew-owned KAS authentication on this Windows installation:

1. Confirm the installed Crew release has a staged KAS bundle (this 0.11.1
   desktop package stages 0.66.33 and Node 22.23.3 for Windows x64).
2. Set `agent.kas_bundle` to `true` in the Kiro Crew configuration.
3. Restart Kiro Crew so the boot-time backend choice takes effect.
4. Sign in to the intended account in Kiro Crew itself. Keep access tokens and
   callback payloads out of logs and diagnostics.
5. If the bundle is absent, stop and install the pinned Crew bundle through
   Crew's documented `kirocrew kas install` flow before enabling the route.

Crew's installed command help at `cli_parser_gateway.py` gives this exact
configuration sequence: “Then: `kirocrew config set agent.kas_bundle true &&
kirocrew restart`” and says “The engine signs in through Kiro Crew's own login
(dashboard → Sign in).” This is a Crew-level backend selection, not a per-agent
auth flag. Do not use it if the desired owner is the Kiro CLI account; keep the
relay's explicit `--auth-method cli` route for that case. The existing relay
builder uses that explicit flag when `host_auth` is false.

This recommendation is Windows-install-specific. Do not infer that POSIX
chat-sibling routing, standalone engine installs, other Crew releases, or other
CLI versions share this behavior.

## Supporting source excerpts

Installed-source excerpts are from the Kiro Crew 0.11.1 packaged backend; paths
are relative to `kiro_crew/` within its installed `site-packages`.

1. `acp/kas_transport.py:109-142`, installed source hash
   `238e91a280d43fc599825c0bd4977d772d37565491fccfaa7fae62d1f182e06b`:
   “`host_auth=True` omits the flag. kiro-cli then leaves the engine's
   `_kiro/auth/getAccessToken` request on the wire for Crew to answer from
   `kiro_crew.auth`.” The builder appends `--auth-method cli` only under
   `if not host_auth:`.
2. `acp/kas_transport.py:154-174`, same hash: the bundle route says “Crew is
   ALWAYS the auth owner” and emits `--auth=acp-callback`.
3. `acp/harness/kas.py:355-420, 453-454`, installed source hash
   `d70294991fd38b035febd95d756a295eaee3af23f948de75e52148d665b2fd4b`: the
   bundle path returns `build_kas_bundle_argv(...)` with `host_auth=True`; the
   relay path reads `host_auth` from Crew vault state and passes that value to
   `build_kas_argv`.
4. `agent_sdk/backend_install.py:195-205, 219-232`: `_kas_bundle_route()` reads
   `KiroCrewConfig.load().agent.kas_bundle`; when enabled, the KAS backend
   resolver checks the installed Crew bundle instead of resolving the shared
   CLI backend.
5. `cli_parser_gateway.py:249-262`: Crew's built-in help gives the install and
   enable commands and states that the bundle signs in through Crew's own login.
6. `acp/kas_pin.py:41-43` plus staged `install.json`: Crew pins
   `@kiro/agent` 0.66.33; the packaged runtime is Node 22.23.3 Windows x64 and
   the staged server/Node file hashes are in the evidence JSON.

Kiro's first-party [ACP client migration guide](https://kiro.dev/docs/cli/v3/acp-migration/)
(page updated 2026-10-09; read 2026-11-02) says: “By default, CLI V3 handles
access-token requests with your Kiro CLI login. Pass `--auth-method=client`
when your client must answer the agent-to-client `_kiro/auth/getAccessToken`
request.” It also requires this callback handler when that option is selected.
Current local `kiro-cli acp --help` independently reports `cli` as the default
and describes `client` as forwarding access-token requests to the ACP client.

## Limits and cleanup

- No Crew configuration, global settings, shared Crew gateway, CLI login, or
  account selection was changed.
- No live Crew-vault credential was requested, received, logged, or verified.
- No real identity comparison was made. Crew dashboard identity and Kiro CLI
  identity must be treated as different owners unless the operator confirms
  them through their intended sign-in flow.
- The direct bundle probe demonstrated a client callback error path, not Crew's
  implementation of token delivery or refresh.
- The temporary runtime profile/workspace was 12,456 bytes and was sent to the
  Windows Recycle Bin; absence at its original path was verified. The process
  exited normally before cleanup. After independent review clearance, both
  scratch runner/source-inspection scripts were sent to the Windows Recycle
  Bin (7,110 bytes total); both original paths were verified absent.
  Installed Crew/CLI files were read-only inputs and were not changed.
