# Ticket 155 research audit

Audited 2026-11-02 against the installed Kiro Crew 0.11.1 package, the named private probe artifacts, and the sanitized receipt. The installed source hashes match the receipt. Raw gateway readiness/log files were not opened or reproduced because they contain an expired authentication token.

**Overall trust: 8/10 — high confidence in the narrow setup/routing conclusion, with the implementation details and outcomes properly bounded.** The evidence establishes adapter initialization and selector behavior. It does not establish an end-to-end child dispatch, authenticated model use, or cross-harness reporting and acceptance.

## Claim verdicts

| Claim | Verdict | Basis |
|---|---|---|
| Both pinned ACP adapter entries answered `initialize` with protocol version 1 and exited cleanly. | supported | `adapter-init.json` contains matching JSON-RPC replies, versions, exit code 0, and no timeout; package lock pins the stated versions. This is initialization only. |
| Ordinary conductor and worker keys route to configured default `kas` for either member backend value (`claude` or `codex`). | supported | `routing.json` records all four results. Installed 0.11.1 `select_provider_backend` routes member/crewmate keys through `member_backend` and otherwise returns `configured_default`; source hash matches receipt. |
| Ordinary children inherit the configured default, so the proposed settings do not produce the requested KAS conductor plus external-backend ordinary child split. | supported, bounded | Installed `session_create.py` computes `child_backend` from the crewmate worker backend only for `own_worker`, otherwise from `cfg.agent.acp_backend`. This supports the settings limitation. No live child was created, so label this source-traced plus selector-probed, not end-to-end observed. |
| `create_session` has no backend parameter. | supported | The probe's introspected parameter list in `routing.json` omits it. This is direct runtime introspection, not a claim that no alternative dispatch APIs exist. |
| ACP adapter resolver accepts process-only executable overrides and Node-wrapped scripts. | supported | `probe.py` sets the two override environment variables only in the probe process; installed `acp/launch.py` describes/implements the override-first resolution behavior and Node wrapping. Scope is local entry resolution, not full ACP session success. |
| The conductor's work-ledger path differs from `spawn_run` and changing the default would not test the requested configuration. | supported as product guidance; weak as universal behavior | Installed `spec_prompts.py` text specifies the ledger workflow and explicitly constrains work items away from alternate spawn APIs. This is current primary source for the shipped prompt/charter, but prompt text alone does not prove every runtime path or prohibit a future supported design. The report appropriately frames those as alternatives/designs. |
| Gateway readiness and clean shutdown occurred; optional config read returned 403; fixture baseline passed 1/1. | supported by sanitized receipt, with limited independent corroboration | Receipt reports READY, approval mode, stop and listener absence, HTTP 403, and baseline counts. `probe.py` corroborates the configuration and command paths; raw output was intentionally not examined due to the secret. Treat gateway facts as recorded sanitized observations, not independently re-read logs. |
| Mixed loop was skipped; work report, wake, and acceptance remain unverified. | supported | Receipt explicitly classifies the loop as skipped because setup did not support the requested split and marks each downstream behavior unverified. This correctly distinguishes setup limitation from failed behavior. |

## Findings

- No unsupported claim found in the ticket 155 section. Its answer consistently says “couldn't verify,” distinguishes the selector probe from end-to-end dispatch, and marks downstream checks unverified.
- Preserve the limitation in any summary: `pass` applies only to ACP initialization and fixture baseline; `skip` applies to the mixed loop; the 403 is an infrastructure error. Do not summarize this as a failed mixed-backend work loop.
- The optional unrecognized `embedding.enabled` setting was explicitly reported as ignored and excluded from the supported recipe; this is appropriately scoped.
- The sanitized receipt contains no token field. Do not retain or quote `ready.json`, `gateway.out`, or `gateway.err`; their token-bearing raw material is not needed for the audit.

**Fail check:** passed. Multiple verifiable claims are supported by current installed primary source and probe receipt; this is not a stub.
