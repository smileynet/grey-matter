# Agent Client Protocol and orchestration fit (2026-11-03)

**Question:** where does ACP help this workstream, and is a further spike worth doing?

**Method:** primary-source review of official ACP normative docs/schema, ACP TypeScript SDK releases, MCP specification, and existing dated/audited workstream evidence. No SDK install, executable download, runtime probe, model call, account action or setting change occurred. Source pages were accessed 2026-11-03; moving `main` pages are point-in-time references, with protocol schema versions taken from the latest SDK release that records schema changes.

## Protocol and implementation versions

Keep three identities separate:

| Layer | Current evidence as of 2026-11-03 | Meaning |
|---|---|---|
| ACP wire protocol | Stable ACP v1; v2 protocol remains draft/experimental. | Negotiated protocol generation; not an SDK package version. |
| ACP schema | SDK v2.3.0 (2026-11-02) records schema v1.29.1 and v2.0.0-alpha.13. SDK v2.4.0 (2026-11-02) is latest and records a cancellation-wait fix, with no newer schema update in its release entry. | Use schema v1.29.1 for the stable v1 baseline; alpha.13 is draft v2. |
| TypeScript SDK package | `@agentclientprotocol/sdk` v2.4.0, released 2026-11-02. | SDK major 2 does not mean stable ACP protocol v2. Its default entrypoint remains stable protocol v1; v2 requires experimental imports. |

**Primary support, high confidence:** the [official SDK release history](https://github.com/agentclientprotocol/typescript-sdk/releases) lists “2.4.0 (2026-11-02)” and the previous release records “schema v1.29.1 and v2.0.0-alpha.13.” Its [current README](https://github.com/agentclientprotocol/typescript-sdk) says “The default SDK import remains ACP v1.” and that v2 is experimental. The normative [v1 overview](https://github.com/agentclientprotocol/agent-client-protocol/blob/main/docs/protocol/v1/overview.mdx) and [v1 schema](https://github.com/agentclientprotocol/agent-client-protocol/blob/main/schema/v1/schema.json) are the stable protocol sources; [v2 overview](https://github.com/agentclientprotocol/agent-client-protocol/blob/main/docs/protocol/v2/overview.mdx) and [v2 schema](https://github.com/agentclientprotocol/agent-client-protocol/blob/main/schema/v2/schema.json) are draft sources. SDK package release 2.4.0 must not be described as stable ACP v2.

## What the normative protocol says

| Capability | Normative ACP v1 behavior | Consequence for this workstream |
|---|---|---|
| Negotiation | `initialize` negotiates protocol version and exchanges capabilities. Optional features must be gated on what that peer advertises. | Detect compatible behavior per agent at launch; do not infer support from ACP branding or SDK imports. |
| Dispatch and follow-up | Client creates or loads a session, then sends `session/prompt`; a later prompt can continue a completed conversation using prior context. | Same-session follow-up is standard v1 behavior. It is not cross-worker messaging, scheduling, or a work ledger. |
| Structured events/results | Agent reports progress through `session/update` notifications; the original prompt request returns a `stopReason`. Updates include message chunks, tool calls/statuses, plans and notices. | Capture both typed updates and terminal prompt result. Neither alone proves repository acceptance; retain independent artifact/check evidence. |
| Cancellation | Client sends `session/cancel`; agent should stop work and must settle the original prompt with `cancelled` after aborting operations and sending pending updates. | ACP specifies turn cancellation semantics, not process shutdown/EOF behavior or recovery from an abruptly killed client. |
| Approval | Agent may request client authorization for tool calls with `session/request_permission`; client returns an allow/reject outcome. | Protocol provides a decision exchange, not a universal policy, auto-approval rule, identity assurance, or OS sandbox. The host owns consent and policy. |
| Session recovery | `session/load` is optional and requires the agent to advertise `loadSession`; resumption is distinct and capability-gated. | Persist session identifiers and re-check advertised capabilities. Recovery is implementation-dependent. |
| Environment/tool boundary | Client controls environment and access to resources, may provide filesystem/terminal capabilities, and passes MCP server configuration at session setup. | ACP itself does not create an isolated worktree or OS sandbox. The launcher/host must supply and verify those controls. |

**Supporting excerpts (verbatim, total under 25 words per source):** ACP v1 overview: “Negotiate versions and exchange capabilities”; “Cancel ongoing operations”; “Request user authorization.” ACP v1 prompt-turn: “The Client may send another `session/prompt`” and “Agents MUST catch these errors.” ACP v1 session-setup: “Clients MUST verify that the Agent supports this capability.” All quotes and behaviors are from the cited official protocol docs; capability conditions and RFC-style MUST/SHOULD/MAY language are preserved.

## ACP versus MCP

ACP standardizes the client↔agent session, prompt, progress, permission and environment-capability boundary. MCP standardizes host/client↔server context and tool primitives. MCP's [versioned 2025-11-25 architecture](https://modelcontextprotocol.io/specification/2025-11-25/architecture) calls out host orchestration, separate stateful client/server connections and capability negotiation; the [tools specification](https://modelcontextprotocol.io/specification/2025-11-25/server/tools) defines tool list/call and structured tool result data. The two protocols can be composed: ACP session setup may supply MCP servers to an agent, but MCP is not the agent dispatch/session protocol and ACP is not an MCP server manager.

**MCP excerpts (total under 25 words/source):** “Host applications handle complex orchestration responsibilities”; “Servers provide specialized context and capabilities.” For tools, results may contain structured content and clients should validate it against an output schema when provided. These do not establish a standardized worker-completion or ticket-acceptance result.

## Comparison with this workstream's evidence

| Need | Documented ACP v1 | Directly observed here | Gap and interpretation |
|---|---|---|---|
| Dispatch | `session/new` creates a conversation; `cwd` and MCP servers describe its context. ACP has no queue/claim/scheduler method. | Kiro V3 ACP request flow worked in #162. #155's Kiro Crew 0.11.1 selector probe showed ordinary conductor and child sessions both routed to configured KAS, despite Claude/Codex adapter packages initializing successfully. | ACP clients/adapters can connect to more agents, but installed Crew did not provide a mixed ordinary-child routing path. ACP alone does not solve that integration gap. |
| Structured result | Typed updates plus prompt result/stop reason; tool completion is represented as update data. | #162 recorded native Kiro prompt outcomes, event evidence, and resume marker. Other driver transports vary in result channels; use source [driver matrix](harness-experimental-features-20261101.md#ticket-162-headless-driver-probes-2026-11-02). | Standardized transport makes parsing more structured; acceptance still needs controller-owned checks. No head-to-head SDK adapter comparison was run. |
| Same-worker follow-up | A second prompt in the same session continues its conversation after a turn completes. | Kiro ACP and several other captured drivers passed follow-up/reload exchanges in #162. | ACP gives same-session continuity, not worker-to-worker message routing. |
| Cancel/recovery | Cancel settles the prompt; load/resume are optional advertised features. | Kiro V3 prompt cancel and session/load were observed in #162. #189 separately reproduces EOF teardown failure after completed/cancelled prompts despite durable session reload. | #189 is specifically Kiro CLI/KAS teardown; it does **not** block independent questions about another ACP agent or SDK adapter. Other peers/process cleanup remain unmeasured. |
| Approval/policy | ACP permission request/response is normative, with peer/client methods and options; behavior depends on advertised support. | Kiro ACP request visibility was observed; no approval answer was scripted. Kiro auth routing was probed separately. | Need to verify each client maps consent and tool outcomes faithfully; protocol does not ensure approval policy or isolation. |
| Isolation | Client chooses `cwd` and may expose additional directories/tool APIs. | Kiro Crew relay on Windows has no OS sandbox backend in the traced route. | A cwd is context, not containment. Worktree, OS sandbox, credential boundary and cleanup are host responsibilities. |
| Windows/setup/usage cost | Official SDK examples establish available libraries, not native Windows qualification for this repo or cost savings. | #155 installed Claude ACP 0.99.1/Codex ACP 2.5.0 in a disposable area; initialize-only passed on Windows. It consumed 849,527,296 allocated bytes and did not test authenticated prompt/tool execution. Kiro #162 completed model-bearing exchanges. | Existing evidence establishes setup footprint and adapter initialization, but not comparative SDK build effort, Windows reliability, full behavior or billing/usage advantage. ACP does not itself change model usage. |

### Source-traced adapter and extension boundary

The [KAS architecture findings](kirocrew-orchestration.md#kas-under-kiro-crew-0111-2026-11-02) trace Kiro Crew 0.11.1's custom agent definitions, Kiro-specific session metadata/modes, auth-owner selection and advertised Kiro extension methods. The [ticket 186 audit](kirocrew-orchestration-t186-audit.md) validates Windows Kiro CLI 2.37.1 auth routing for that build. These facts belong to Kiro Crew/KAS/Kiro CLI, not ACP v1. In particular, version `1` negotiated by KAS did not identify the V2/V3 Kiro engine; Kiro uses its engine-selection/configuration surface.

## Recommendation and candidate work

**Do not create an implementation spike from this research alone.** The protocol study closes the standards question: ACP v1 has useful prompt/session lifecycle, structured event and permission semantics, but no scheduler, acceptance policy or sandbox. The remaining meaningful uncertainty is implementation fit outside the one tested Kiro relay. However, #155's Claude/Codex adapters only initialized, installed almost 850 MB allocated, and Kiro Crew 0.11.1 could not route ordinary workers to those backends. There is no identified selected backend, production need, or integration owner that makes another adapter spike actionable today. This is a bounded no-spike decision, not a consequence of #189.

If a specific non-Kiro ACP backend is selected for #173 or later orchestration work, propose a separate spike with this deciding question: **does that exact adapter support one complete isolated worker exchange on Windows with structured completion, a same-session follow-up, permission request/response, cancellation, and clean process/session recovery—and does it improve a named workflow enough to justify its setup footprint?** Acceptance should record adapter/agent/schema/package versions, capability negotiation, raw-to-sanitized event/result mapping, denial and allow paths, interruption/cleanup settlement, fixture Git/check result, measured setup bytes/time, and token/usage evidence or explicit unknown. Dependencies: selected backend and owner approval for scoped execution; #189 is a dependency only if reusing the Kiro relay. Include cleanup of only owned package/install/cache/session/fixture artifacts; leave shared installs/settings untouched. No spike is executed or ticket created by this note.

## Could not verify

- This research did not install SDK v2.4.0 or build a client, so Windows SDK build/run compatibility, true integration effort, performance and usage attribution remain unknown.
- #155 did not send a prompt to Claude/Codex adapters; it establishes initialize-only compatibility and routing limitation in that Kiro Crew release, not end-to-end worker suitability for those agents.
- Direct protocol docs establish wire semantics, not conformance of every agent/client. Capability negotiation and runtime behavior must be checked on the named versions.
- No exact cross-agent worker result envelope, multi-agent coordination method, OS isolation guarantee or billing/cost control is specified by ACP.

## Sources

- ACP v1 protocol overview: [official normative overview](https://github.com/agentclientprotocol/agent-client-protocol/blob/main/docs/protocol/v1/overview.mdx), accessed 2026-11-03.
- ACP v1 session setup and prompt/cancel: [session setup](https://github.com/agentclientprotocol/agent-client-protocol/blob/main/docs/protocol/v1/session-setup.mdx), [prompt turn](https://github.com/agentclientprotocol/agent-client-protocol/blob/main/docs/protocol/v1/prompt-turn.mdx), accessed 2026-11-03.
- ACP v1 and v2 schemas: [stable schema](https://github.com/agentclientprotocol/agent-client-protocol/blob/main/schema/v1/schema.json), [draft schema](https://github.com/agentclientprotocol/agent-client-protocol/blob/main/schema/v2/schema.json); the SDK release record gives v1.29.1 and v2.0.0-alpha.13 as of 2026-11-02.
- ACP SDK release and current entrypoint guidance: [release history](https://github.com/agentclientprotocol/typescript-sdk/releases), [official SDK README](https://github.com/agentclientprotocol/typescript-sdk), accessed 2026-11-03.
- MCP versioned architecture and tools: [2025-11-25 architecture](https://modelcontextprotocol.io/specification/2025-11-25/architecture), [2025-11-25 tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools), accessed 2026-11-03.
- Local observations/source traces: [#155 mixed-backend setup and #162 driver findings](harness-experimental-features-20261101.md#ticket-155-mixed-backend-setup-probe-2026-11-02), [KAS architecture](kirocrew-orchestration.md#kas-under-kiro-crew-0111-2026-11-02), [#186 auth audit](kirocrew-orchestration-t186-audit.md), and [#189 teardown diagnosis](../../.tickets/189-kiro-v3-acp-relay-times-out-after-stdin-closes.md).
