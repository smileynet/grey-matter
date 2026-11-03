# Agent Client Protocol and orchestration fit (2026-11-03)

**Question:** does ACP provide a useful external worker boundary for this workstream beyond the already-observed harness drivers?

**Scope and versions:** primary-source review on 2026-11-03. The ACP TypeScript SDK release page reports v1.5.1 (2026-09-28); its README distinguishes stable ACP v1 from experimental v2. These moving/current pages are dated here, not treated as immutable. No install, runtime probe, model call, or account action was performed.

## Verified findings

| Finding | Evidence and confidence |
|---|---|
| ACP is a client↔coding-agent protocol, not a general-purpose multi-agent scheduler. It defines session interaction and client-mediated UI/services; an orchestrator still owns ticket selection, worker isolation, acceptance and lifecycle policy. | **High, documented.** ACP organization source, current page: “A protocol for connecting any editor to any agent.” [ACP organization](https://github.com/agentclientprotocol). The TypeScript SDK describes it as “a standardized communication protocol between code editors and AI-powered coding agents.” [SDK README](https://github.com/agentclientprotocol/typescript-sdk). |
| The stable integration target is ACP v1. SDK v2 is explicitly experimental/draft and can change incompatibly; importing v2 does not mean the peer supports a capability. | **High, documented.** SDK README (current as of this review): “The default SDK import remains ACP v1.” and “Both v2 entrypoints remain experimental.” [SDK README](https://github.com/agentclientprotocol/typescript-sdk). Release page identifies v1.5.1 dated 2026-09-28. [SDK releases](https://github.com/agentclientprotocol/typescript-sdk/releases). |
| The official TypeScript SDK implements both sides and supplies runnable client/agent examples. It is implementation material, not a guarantee that a particular agent implements all optional methods or extensions. | **High, documented.** ACP official library docs (current): “provides implementations of both sides of the Agent Client Protocol.” [TypeScript library docs](https://github.com/agentclientprotocol/agent-client-protocol/blob/main/docs/libraries/typescript.mdx). |
| ACP and MCP occupy different boundaries: ACP connects a client to an agent; MCP connects an agent to tool/data servers. A client can host tools requested through ACP, while MCP servers are separately configured by the agent/runtime. | **High for Kiro's documented architecture; general framing consistent with ACP's client/agent role.** Kiro KAS architecture in the existing source-traced note explicitly separates the ACP client/agent link from KAS's MCP tool connections. [KAS architecture findings](kirocrew-orchestration.md#what-kas-is). Do not infer that ACP itself supplies MCP server management. |
| ACP can carry structured lifecycle/update events and permission requests, but these are protocol messages, not a standardized orchestration result contract or proof that a command succeeded. The host must inspect method results, update events, and its own process/acceptance evidence. | **High for the observed Kiro V3 path; protocol capability support remains peer-specific.** Ticket 162's observed Windows matrix reports Kiro V3 ACP approval request, cancellation and session/load recovery, and separately reports driver limitations. [Driver findings](harness-experimental-features-20261101.md#ticket-162-headless-driver-probes-2026-11-02). |
| Kiro-specific custom agent registration, auth selection, extensions, advertised session capabilities and Crew approval gates are adapter/engine behavior, not portable ACP guarantees. | **High, source-traced and observed for the named builds.** Kiro Crew 0.11.1/Kiro CLI 2.37.1 findings trace session mode selection and custom-agent data; Windows native probe establishes CLI-vs-client auth routing. [KAS findings](kirocrew-orchestration.md#kas-under-kiro-crew-0111-2026-11-02), [auth audit](kirocrew-orchestration-t186-audit.md). |

## Comparison to observed drivers

| Need | ACP/Kiro V3 evidence | Other observed driver evidence | Remaining gap |
|---|---|---|---|
| Dispatch | Kiro ACP session/new and prompt work in one persistent server session. | Claude and agy paired JSONL streams; Codex and Kiro CLI resume across processes. | ACP does not choose/claim work or provide worktree isolation. Controller must launch and isolate the process. |
| Structured result | ACP emits typed session updates and a prompt response; observed Kiro results had native event evidence. | Other transports retain native markers, with some harnesses requiring careful distinction between response text and structured task result. | Define a controller-owned result/acceptance envelope; do not treat assistant prose or exit 0 as acceptance. |
| Same-worker follow-up | Same Kiro ACP session accepts another prompt; ticket 162's question/follow-up/load probe is a direct observation. | Claude/agy paired streams preserve follow-up; Codex/Kiro resume preserve the session across processes. | No cross-agent message bus or work queue is provided by ACP. |
| Cancel and recovery | Cancellation and session/load were observed. | Driver report distinguishes follow-up and saved-session recovery. | Process teardown after stdin EOF has a separate Kiro ACP failure: EOF teardown, exit 1. Resume and cancellation do not solve shutdown. See #189. |
| Approval | A native permission request was observed; Kiro client auth callback routing was separately tested. | Driver matrix records differing approval visibility and headless limitations by harness. | No scripted approval answer; no common approval policy or unattended approval semantics. Crew/Kiro policy and extensions must not be generalized. |
| Isolation/security | ACP itself is a protocol boundary. | KAS/Kiro Crew has its own launch/policy layers; Windows Crew has no OS-level sandbox backend in the traced route. | No ACP-provided filesystem/process sandbox. Worktree, OS sandbox, credentials, and trust policy remain host responsibilities. |
| Windows/setup/cost | The local Kiro CLI 2.37.1 ACP path ran on Windows in ticket 162; a newer TypeScript SDK is available as a package. | Native driver probes already cover Windows streams and session recovery. | No SDK installation or SDK-backed driver was performed; no comparative setup time, process cost, token cost, or billing evidence exists. ACP does not itself reduce model usage. |

## Recommendation

**No additional ACP-specific spike is warranted now.** Ticket 162 already answered the material near-term question: a Kiro V3 ACP driver worked for request, native approval visibility, cancel, and session/load recovery; separate evidence identifies the EOF teardown blocker (#189). Existing orchestration work already tests live request/cancel/reload (#173). A generic SDK client spike would duplicate proven transport behavior without a decision it changes.

Reconsider one bounded integration spike only if #189 is repaired and a concrete user-facing need requires a reusable client beyond the Kiro CLI adapter. Deciding question: does a minimal, version-pinned ACP v1 client add a measurable capability over the existing Kiro CLI driver on Windows? Compare one request/follow-up/cancel/reload flow with identical isolated fixture and native evidence; require capability negotiation, structured result capture, approval forwarding without auto-approval, interruption cleanup, and exact process/session cleanup. Do not execute this spike as part of this research.

## Could not verify

- ACP protocol details for every lifecycle method were not individually re-read from the generated schema in this pass; this note relies on official SDK entrypoint/version statements plus the already-audited, versioned Kiro probe for runtime claims.
- SDK-backed Windows setup complexity, process recovery, performance, and cost were not measured.
- No generic ACP guarantee was found or asserted for same-worker follow-up semantics, agent-to-agent messages, worktree creation, OS isolation, approval resolution policy, or cost controls.

## Sources

- ACP official organization and repositories: [agentclientprotocol](https://github.com/agentclientprotocol), current page accessed 2026-11-03.
- Official TypeScript SDK README: [typescript-sdk](https://github.com/agentclientprotocol/typescript-sdk), current page accessed 2026-11-03; stable v1/default and experimental v2 statements.
- Official SDK release history: [releases](https://github.com/agentclientprotocol/typescript-sdk/releases), v1.5.1 dated 2026-09-28.
- Official TypeScript library guide: [ACP repository docs](https://github.com/agentclientprotocol/agent-client-protocol/blob/main/docs/libraries/typescript.mdx), current page accessed 2026-11-03.
- Local audited workstream evidence: [headless driver findings](harness-experimental-features-20261101.md#ticket-162-headless-driver-probes-2026-11-02), [KAS findings](kirocrew-orchestration.md#kas-under-kiro-crew-0111-2026-11-02), [Kiro auth audit](kirocrew-orchestration-t186-audit.md), and ticket #189 blocker (local ticket).
