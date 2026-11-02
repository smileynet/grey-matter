# Ticket 162 evidence audit

**Audited:** the Ticket 162 section of [harness experimental features](harness-experimental-features-20261101.md) and its [sanitized receipt](evidence/headless-drivers-20261102.json). Raw native captures and probe scripts were inspected read-only. The older [ticket 111 dry-run receipt](orchestrate-skill-dry-runs-20261101.md) was consulted only to distinguish its earlier question path and retained process interruption evidence.

**Overall trust: 8/10 — supported for the captured Windows exchanges; several broad recipe/recommendation claims need explicit scope limits.** Native events, tool records, and session IDs support the key results. The sanitized receipt is a faithful index, not a substitute for native evidence; no approval was answered, and this does not establish general unattended operation.

## Verdicts

| Claim | Verdict | Evidence and limit |
| --- | --- | --- |
| Claude and agy paired streams carried a question and follow-up in one process; Codex resume and Kiro chat/ACP reload preserved sessions | **Supported** | Native session IDs match across turns/processes. ACP reload first labels the old QUESTION/DONE messages `replay: true`; subsequent fresh chunks recall the marker and answer. Do not count replay as a new answer. Claude/agy cross-process resume remains untested. |
| Claude and Kiro chat ran the harmless Git command | **Supported** | Claude native `Bash` tool result is `is_error=false`; Kiro chat native tool update is `completed`, exit code 0. Their final prose alone would not establish execution. |
| agy command attempt was denied by headless permission handling, rather than rejected by a person | **Supported** | Native `denied_actions` identifies `command`; stderr says headless mode cannot prompt and auto-denied it. Empty final text and process exit 0 are not a successful command or a user rejection. The assertion requiring BLOCKED prose failed. |
| Codex command attempt was blocked by missing host infrastructure, not an approval denial | **Supported** | Native error identifies missing `codex-code-mode-host.exe` / OS error 2; no permission request or denied action appears. Exit 0 coexists with the error item. Approval behavior is untested. |
| Kiro ACP exposed a permission request and cancellation without an approval answer | **Supported** | Native `session/request_permission` included four option kinds; controller sent cancel; native tool result says cancelled before approval, exit code -1. This is cancellation, not a user rejection. |
| Kiro ACP session/load recovered the same conversation | **Supported** | Same native session ID; replay-marked earlier messages are followed by fresh chunks recalling the marker/name and `end_turn`. This establishes the captured reload path, not arbitrary crash recovery. |
| ACP exit 1 was caused by the probe controller's timeout | **Unsupported if inferred; receipt correctly says otherwise** | Raw stderr reports the V3 engine did not exit within Kiro's five seconds after stdin closed; process exit was 1 and the controller's 60-second timeout remained false. Report as Kiro EOF teardown limitation, separate from successful turns/cancellation. |
| The Kiro V3 ACP driver is recommended for #173's live approval/question watch | **Weak, qualified recommendation** | Appropriate for the observed session routing, reverse permission request, cancellation, and reload. One captured probe does not establish robust production use; EOF teardown is unresolved and no approval option was exercised. Keep the stated #189 limitation prominent. |
| The four CLI recipes are generally usable for orchestration | **Weak / overbroad if read generally** | Specific invocations and outcomes are observed. agy needs corrected argument ordering and auto-denies its command; Codex's tool host is missing; Kiro ACP teardown exits 1; Kiro chat output is fenced text rather than schema-enforced JSON. Describe as observed recipes with those constraints, not qualified general drivers. |

## Findings for the producer

- Keep terminal claims anchored to native tool events/results. The current table does this well for Claude, agy, Codex, Kiro chat, and ACP; avoid treating final model text, empty output, or exit 0 as proof of tool success.
- Preserve the explicit distinction among agy's automatic denial, ACP's controller cancellation, Codex's missing host executable, and a human rejection. No human rejection or approval answer occurred.
- Preserve the exact ACP teardown attribution: Kiro's 5-second EOF message, exit 1, controller timeout false. It is not the controller's 60-second timeout.
- Keep the ACP recommendation scoped to the live exchange tested and its unresolved teardown. Approval handling was observed only through a request and cancellation, not an approval answer.
- Session identity and replay handling are well supported by native IDs/events. The sanitized receipt's hashes are useful for linkage; individual native IDs need not be repeated here.

No unsupported core transport claim was found. The ticket 111 receipt confirms its earlier Kiro transport observations and that its initial implementation pre-answered its question; it does not widen Ticket 162's evidence or repair those earlier protocol limitations.
