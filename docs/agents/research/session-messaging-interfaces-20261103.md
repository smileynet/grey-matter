# Current session messaging interfaces (2026-11-03)

Scope: current primary documentation plus local CLI version/help checks for the Codex,
Claude Code, and Kiro CLI surfaces. This is a capability survey, not a live delivery
test. No model calls, user conversations, native messages, or settings changes were
made. Antigravity CLI probing remains held by the project’s recorded security stop.

## What an orchestrator can use

Qualification update, 2026-11-04: the table below remains the original survey.
The [owned Kiro V2 case](session-messaging-kiro-owned-20261104.md) subsequently
completed two core-acknowledged turns and observed physical process cleanup.
Its original update-stream disconnect and local-only classification fix are
reported separately. This does not qualify V3 teardown, busy queueing or a
foreign-session attachment surface.

The [owned Claude case](session-messaging-claude-owned-20261104.md) also completed
two correlated core-acknowledged turns and observed process settlement on Windows
with CLI 2.1.316. Its identical initialization metadata remained status only.
The version-pinned source and historical failures remain in the linked evidence;
this does not qualify arbitrary attachment or native reconnect.

| Surface | Existing-session input and wake-up | Busy/idle and completion | Evidence status / adapter direction |
|---|---|---|---|
| **Codex CLI `queue`** | Current local CLI 0.166.0 accepts `codex queue --thread <UUID or exact session name> --message <TEXT>`; `--resume` is optional. This targets a known existing thread. The official CLI reference documents the same interface and says queue messages use that thread’s model. | Queue is meant for a thread message and optional resume. A resume failure only warns; the CLI still exits successfully. Therefore a zero exit is not a receipt. This help does not promise busy-turn steer semantics or an end-to-end receipt. | **Locally observed command/help; docs corroborate interface, delivery not probed here.** Good low-cost idle/existing-thread adapter candidate after verify target identity, record output, and independently observe correlated follow-up. Treat resume warning as a non-receipt. [Codex CLI reference](https://learn.chatgpt.com/docs/cli/reference) |
| **Codex App Server** | Current official protocol supports `thread/resume` by known ID then `turn/start` with user input; `turn/steer` appends to a currently active turn. | `turn/steer` requires the expected active turn ID and fails if the thread has no active turn. App-server emits turn/item events; inspect completed status rather than treating the request acknowledgement as task completion. | **Documented protocol; no local app-server invocation in this research.** Best documented route when building a persistent controller: keep one app-server connection, correlate thread/turn IDs and consume lifecycle events. Keep separate from CLI `queue`; these are distinct interfaces. [Codex App Server](https://learn.chatgpt.com/docs/app-server) |
| **Codex desktop collaboration tools** | Parent’s retained #210 evidence establishes one bounded native follow-up to a precisely selected idle owned agent. | A correlated completion was acknowledged through the parent channel. Busy-agent delivery, crash recovery, cross-harness use, and text-byte equality were not established; native arguments were opaque. | **One narrow native idle-agent success, independently constrained.** Reuse the existing native dispatch path only with exact identity/schema checks and correlated return. Do not generalize to busy sessions or claim plaintext receipt. [#210 retained evidence](evidence/orchestration-delivery-210-20261103.json) |
| **Claude Agent SDK, persistent streaming input** | Claude’s current Agent SDK documents a long-lived process that accepts later user messages in the same session. Its streaming mode documents sequential queued messages and interruption. This is the clearest supported way to send follow-ups to an agent process the orchestrator owns. | Stream each message/result and correlate session/turn state in the controller. The docs describe one-shot print mode separately from the persistent streaming session. Do not treat `claude --resume <id>` as an external message endpoint to a concurrently running process. | **Officially documented owned-process interface; no SDK package check or live session was performed.** Prefer one persistent worker process and explicit input/output event tracking; test restart and delivery semantics before calling it durable. [Streaming Input](https://code.claude.com/docs/en/agent-sdk/streaming-vs-single-mode), [CLI reference](https://code.claude.com/docs/en/cli-reference) |
| **Claude Code CLI / Desktop** | Local CLI 2.1.316 offers `--resume`, `--session-id`, background session lifecycle commands, and `--input-format stream-json` for print mode. Desktop offers a prompt box for a user to send a correction during work and a session sidebar for resuming. | Desktop documents OS notifications when a hidden session finishes, not a programmatic notification/message API. Print-mode stream JSON is an input/output mode for a launched command, not documented as a remote attach endpoint for an already-running desktop session. | **Local help observed; desktop behavior documented, no UI/native testing.** For automation, own the SDK process; use Desktop only as a person-operated route unless a supported public control API is identified. A completion alert is not task acceptance. [CLI reference](https://code.claude.com/docs/en/cli-reference), [Desktop](https://code.claude.com/docs/en/desktop) |
| **Kiro CLI chat** | Local CLI 2.37.1 has `--resume-id <SESSION_ID>` and session listing. Official docs say sessions save each turn. | A session active in another process cannot be resumed; Kiro reports that it is active to avoid conversation corruption, and docs offer closing the other process or forking a copy. No documented external queue/steer command appears in current CLI help. | **Local version/help and docs observed.** Useful to resume a stopped/saved session, not a controller-to-live-worker message primitive. Do not infer unsupported product capability from this CLI gap; use ACP or Crew where their live interfaces are advertised and authorized. [Session management](https://kiro.dev/docs/cli/chat/session-management/) |
| **Kiro CLI via ACP** | Local `kiro-cli acp --help` advertises an ACP command that uses stdio. The help was captured only; no server launch or handshake was performed. Kiro’s current ACP page documents `session/load` for existing session IDs and `session/prompt` to send prompts; its server advertises `loadSession: true`. | ACP standard gives a client prompt/session lifecycle, while Kiro’s documented standard method list includes cancel but not a portable busy-queue or steer operation. Kiro V2 signals `TurnEnd`; V3 settles via the `session/prompt` response. | **Local help plus official docs; no ACP server launch, handshake, or model-bearing probe.** A client-owned live ACP process can resume/load the identified session and prompt it, subject to handshake-advertised capabilities. Treat busy queuing, disconnected-client recovery and receipt beyond protocol response as unqualified; do not infer API parity across Kiro engine versions. [Kiro ACP](https://kiro.dev/docs/cli/acp/), [ACP architecture](https://kiro.dev/docs/acp/) |
| **Kiro Crew / KAS** | The bundled CLI resolves as Kiro Crew 0.11.1. A read-only query found `agent.session_control=True`; the current `kirocrew-conductor` agent mounts the dashboard server but does not allow `@kirocrew-dashboard/session_send`. The installed dashboard server source exposes strict-identity `session_send(target, message, steer?)`; it starts an idle target, queues on a busy target by default, and tries to steer only when requested. | The tool description says the result identifies whether the message queued or steered and directs the sender to read the target message afterward. Official docs describe persisted UI queue cards and conductor monitoring, but no native send was performed to check actual receipts, ordering or restart recovery. | **Installed version, targeted setting, current tool grant and source schema observed read-only; no message sent.** A tool allowlist change alone is insufficient: KAS project-agent projection drops `allowedTools`, `permissions` and `mcpServers`, and a project fixture cannot grant this capability. The existing guarded route requires an authorized grant in a trusted user-level profile and a valid Gateway-issued caller identity; no grant or configuration change was made here. Even with those prerequisites, delivery/recovery still needs disposable-session qualification. Official docs changelog’s latest visible entry is Crew 0.9.0 (Oct 16), inconsistent with installed 0.11.1 (Nov 3); apply the installed source observation, and treat public version-history details as stale or a distinct stream. [Sessions](https://kiro.dev/docs/crew/chat/sessions/), [Workflows](https://kiro.dev/docs/crew/features/workflows/), [Security](https://kiro.dev/docs/crew/security/), [installed surface record](../harness-surfaces/kiro-crew.md) |
| **Antigravity CLI / desktop** | Current official docs describe two separate routes: the CLI can import an Antigravity App thread by cloning its history, context and tool trajectory into the terminal session; the App/CLI can message a subagent owned by the current conversation using its own supported UI/`@name` route. Import is not attachment to the original live App thread. | CLI `@name` messaging is an interactive subagent route. The `queuedMessages` setting controls input while the agent is working (`queue` waits for its turn; `send-immediately` interrupts). These product interactions are not evidence of an external controller API or a live cross-app attachment. | **Docs-only; local probing is held.** The workstream security ledger records a native-hook stop with unknown global-vs-conversation scope, so no Agy CLI/version/help/PATH/model/settings probe is authorized. Preserve the hold. If later cleared by supported security-owner guidance, qualify the supported public interface in a disposable account/workspace before any adapter claim. [Mentions and quoting](https://antigravity.google/docs/at-mentions), [CLI resume/import](https://antigravity.google/docs/cli/commands/resume), [Antigravity Settings](https://antigravity.google/docs/settings?tab=ide) |

## ACP boundary

ACP is a client-to-agent protocol: the client sends prompts and receives session
updates. Kiro advertises optional extension methods at runtime and instructs clients
to read `initialize` capabilities rather than assuming a fixed set from product name
or version. Thus ACP is a good adapter boundary for a long-lived, controller-owned
Kiro process, but it does not make a disconnected controller, an already-running
foreign client, busy-turn queueing, or crash recovery portable by itself. Negotiate
capabilities, load only the exact registered session, and persist request IDs plus
terminal response/update evidence. [Kiro ACP architecture](https://kiro.dev/docs/acp/),
[Kiro CLI ACP method list](https://kiro.dev/docs/cli/acp/).

## Suggested qualification order for #179

1. Add an adapter around a single known interface at a time: Codex App Server for
   target-thread idle/busy cases; Crew `session_send` only if the installed version
   advertises its guarded tool; Claude SDK only for workers whose process is owned
   by the orchestrator; Kiro ACP only for sessions owned/loaded by that client.
2. Record `prepared → sent/accepted → worker-observed → correlated completion` as
   distinct states. A CLI exit, queued card, protocol acknowledgement, or successful
   task result alone does not prove all later states.
3. Exercise idle, busy, cancellation, restart/disconnect, wrong-target, duplicate,
   and crash recovery using disposable sessions and no production transcript data.
   Require a clear terminal result and independent artifact/critic review.
4. Keep desktop alerts and unread badges as notification-only unless the harness
   exposes a documented, tested return route. Keep native hook behavior held where
   security scope is unresolved.

## Evidence limits

This survey documents current interfaces and makes bounded local observations; it
does not establish cross-harness delivery reliability, exactly-once processing,
message persistence after a client disconnect, or safe recovery from ambiguous sends.
The local Codex, Claude and Kiro CLI help output hashes, versions, and capture paths
are indexed in [the evidence manifest](evidence/session-messaging-interfaces-20261103.json).
Older #208/#210 native evidence remains limited to its own claims; it is not promoted
into broad harness qualification.

## Primary-source excerpts

These brief excerpts anchor the documented claims above; docs were checked on
2026-11-03. Local binary versions are recorded separately in the evidence manifest.

- **Codex CLI** — [Command line options](https://learn.chatgpt.com/docs/cli/reference):
  “If Codex can’t resume the session, it prints a warning and still exits successfully.”
- **Codex App Server** — [Codex App Server](https://learn.chatgpt.com/docs/app-server):
  “Call `turn/steer` to append user input to the currently in-flight turn”.
- **Claude Agent SDK** — [Streaming Input](https://code.claude.com/docs/en/agent-sdk/streaming-vs-single-mode):
  “Queued messages: send multiple messages that process sequentially, with ability to interrupt”.
- **Claude Desktop** — [Desktop](https://code.claude.com/docs/en/desktop):
  “The desktop app sends an OS notification when a Code session finishes”.
- **Kiro CLI** — [Session management](https://kiro.dev/docs/cli/chat/session-management/):
  “Sessions can only be active in one process at a time”.
- **Kiro ACP** — [ACP for Kiro CLI](https://kiro.dev/docs/cli/acp/):
  “`session/load` Load an existing session by ID”; “`session/prompt` Send a prompt to the agent”. The retained local artifact is CLI help only: it advertises the stdio ACP command, but no server was launched and no handshake was captured.
- **Kiro Crew** — [Sessions](https://kiro.dev/docs/crew/chat/sessions/):
  “Steer delivers the message to the running turn”; “Queue stores it for the next turn”.
- **Kiro Crew cross-session** — [Workflows](https://kiro.dev/docs/crew/features/workflows/):
  “`session_send` delivers a message into another session as its next turn.”
- **Kiro Crew docs version marker** — [Crew changelog](https://kiro.dev/changelog/crew/):
  the latest visible entry is “0.9.0 Crew” dated October 16, 2026. This differs from
  the project’s recorded local Crew 0.11.1 observation dated November 1, 2026 and
  this check’s installed version, 0.11.1. Exact local version is observed; the reason
  for the mismatch in the public release history is unknown.
- **Installed Kiro Crew** — `kirocrew-conductor` currently has `@kirocrew-dashboard`
  mounted, but its `allowedTools` omits `@kirocrew-dashboard/session_send`. The installed
  0.11.1 server source describes a strict-identity target and required message, with
  optional `steer`; a busy target queues by default and an unavailable mid-turn
  injection falls back to queue. The caller is instructed to read the target message
  afterward. This code/schema evidence does not prove a live delivery or receipt.
- **Kiro Crew setting query** — The targeted `config get agent.session_control` returned
  `True`. It also emitted warnings that a malformed/truncated security audit log tail
  was skipped and the previous complete chain tip reused. The log itself was not read
  or modified; this operational warning is retained for the parent to assess.
- **Kiro Crew 0.11.1 installed source** — The captured `session_send` declaration says:
  “An idle target starts a turn on your message straight away. A BUSY target queues it
  for its next turn, unless you pass steer=true”. With `steer=true`, it injects into the running turn; if that is
  unavailable, the message falls back to queue. The declared strict identity and tool
  schema are fingerprinted in the evidence manifest. No call was made.
- **Antigravity** — [Settings](https://antigravity.google/docs/settings?tab=ide):
  “`queue` (default, Queue) holds it until the current turn ends”.
- **Antigravity import and subagent messages** — [Resume command](https://antigravity.google/docs/cli/commands/resume) says importing an App thread clones its history, context and tool trajectory into a terminal session; it does not describe attachment to the original live App session. [Mentions and quoting](https://antigravity.google/docs/at-mentions) separately documents messaging a subagent from its own App message box or, in CLI, with `@` followed by its exact name.

The Antigravity excerpts describe documentation only; they do not override the
project’s native security hold or establish that a particular local build is safe
or available.
