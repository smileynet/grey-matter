# Independent audit: Kiro V3 ACP shutdown findings

Reviewed worker commits `fc59af8`, `dfce362`, and `3a4da32` against the promoted findings and evidence receipt at [kiro-acp-shutdown-20261102.md](kiro-acp-shutdown-20261102.md) and [kiro-acp-shutdown-20261102.json](evidence/kiro-acp-shutdown-20261102.json). Raw probe traces and runners are named in the receipt and remain in the worker's `.scratch/` directory; they were inspected for this audit.

## Verdicts

| Claim | Verdict | Audit note |
|---|---|---|
| Installed CLI 2.37.1 / KAS 0.66.70, V3 launch, and the native EOF error were observed. | supported | Direct version output, initialization records, stderr and exit status in the retained probes. |
| A clean model prompt can return `end_turn` while EOF still returns exit 1 with the KAS five-second teardown error. | supported | Fresh baseline trace separates the prompt response from the process exit. |
| `session/close` after a completed model turn preserves the marker but does not resolve EOF teardown. | supported | Close-arm trace, separate-process reload/marker recall, stderr, exit status and process polls agree. |
| A pending permission can be canceled, return `cancelled`, and still leave the same EOF error after close. | supported | Cancel trace records the native permission request, no approval response, cancellation, absent sentinel, close response, EOF error and exit status. |
| Owned CLI/KAS process trees were observed gone after these runs. | supported, bounded | Runners sample Win32 PID/parent PID trees every 500 ms and after exit. This establishes the observed runs, not all Kiro launches or a general guarantee. |
| Close preserves session content; delete removes a session from the list. | supported for observed outcomes; protocol rationale weak | Runtime traces show close/reload marker recovery and deletion of the empty disposable session. The linked ACP schema is under `protocol/v2`, while Kiro negotiated `protocolVersion: 1`; the report does not establish how that schema revision maps to the negotiated integer, so use runtime behavior as the authority for this CLI. |
| Kiro V3 has no advertised terminate extension and documents `session/cancel` as stopping an active turn. | supported | The current Kiro migration guide says V2 terminate has no V3 equivalent and instructs clients to use cancel only for an active turn; runtime initialization records no terminate extension. |
| `session/close` is a supported, state-preserving workaround for model-used sessions. | unsupported; findings correctly reject this claim | Both completed-turn and canceled-permission close arms still exit 1. No fixed version or bounded model-bearing shutdown sequence is verified. |

## Acceptance criteria

- **AC1 — reproduced or obsolete, with response/settlement separated: met.** Fresh V3 baseline reproduces the native EOF teardown failure after a successful model turn. The cancellation arm separately records `cancelled`; neither result is mislabeled as process settlement.
- **AC2 — verified shutdown, fix, or bounded workaround: unmet.** Idle close exits cleanly, but close after both completed work and canceled permission still exits 1. No upstream fixed version was identified. This is an actual unresolved Kiro/KAS behavior, not a resolved ticket or a false pass from closing an idle session.
- **AC3 — process/session/fixture disposition, checks, driver limit: partially met.** The probes record process-tree samples, retain four owned model-bearing sessions, leave the #162 session untouched, and state the driver limitation. The evidence receipt lists the retained sessions; they remain preserved pending parent coordination. Project verification gates and final artifact cleanup are not established by this research evidence and remain for parent integration.

## Trust score and next trigger

**Trust: 0.88 (high for the bounded observations; not a fix qualification).** Raw runtime behavior is well evidenced and the report states its limits. The main source caveat is the unverified mapping between the ACP schema path revision and Kiro's negotiated protocol integer; observed capability negotiation and requests are stronger evidence for this installed Kiro version than the schema's semantic prose.

Keep #189 open or explicitly blocked on upstream behavior. Reopen the fix qualification when Kiro/KAS changes, or when a supported shutdown method is identified. Close only after a fresh Kiro V3 model-bearing clean-turn and canceled-permission run demonstrates: successful prompt/cancel response kept separate from shutdown; documented/advertised shutdown; exit classification; owned CLI and descendant tree absent after shutdown; and durable session marker loadable afterward. Do not delete the four retained sessions or touch the #162 session before the parent records the preservation proof and agrees their disposition.

## Sources re-fetched

- Kiro's [ACP migration guide](https://kiro.dev/docs/cli/v3/acp-migration/) is first-party and current; it says optional methods are capability-negotiated and V2 `_kiro.dev/session/terminate` has no V3 equivalent, with `session/cancel` only stopping an active turn.
- Kiro's [ACP overview](https://kiro.dev/docs/acp/) is first-party and current; it describes ACP's shared agent harness and standard session/prompt lifecycle.
- The [ACP schema file](https://github.com/agentclientprotocol/agent-client-protocol/blob/main/docs/protocol/v2/schema.mdx) is the protocol project's primary source. The report does not identify whether `/v2/` describes a schema revision or the same version space as the negotiated integer `1`; treat its close/delete semantics as contextual until that mapping is verified against Kiro 2.37.1.
