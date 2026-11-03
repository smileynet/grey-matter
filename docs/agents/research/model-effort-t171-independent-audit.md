# Ticket 171 results: independent evidence audit

> The spike harness this doc cites was removed from `scripts/` (ticket 209). Paths below are as of commit `e35d8a8`; see [rerunning the model-tier spikes](model-tier-spikes-rerun.md).

Audit of the final sanitized result artifacts at source commit `7c7a4c6983d455c15df3a6a6dd8c514aac5d8e93`, following independent review of the native evidence, blind packets, grading ledger, binder commits, and parent-authorized cleanup receipt. No native calls, grading changes, rebinding, retries, cleanup actions, or crosswalk disclosure were performed by this audit.

## Final artifact identities

- [Results report](model-effort-t171-results.md): SHA-256 `edfc7529fa05db11533c9e7a0fcb26626f3cfe5342d1ddb02d9a118b4a3ee11a`.
- [Evidence index](evidence/model-effort-t171.json): SHA-256 `1bcd9097d5a88ee90dea3e733846b86303e3cfec7d53b76b24963e511eafa028`.
- [Sanitized cleanup receipt](evidence/model-effort-t171-cleanup.json): SHA-256 `4b41b3cd5538d8d8c749a1adce0334d0e6c7ea361e74f14bb67a32d4a230063e`; raw private cleanup receipt: `827adcbff6f6a87b84667700e0b162344c78ae42da6bad5a0a60fa836d12fcd5`.
- Frozen native manifest: `97655e3878031ef849bf35928cd4178fa4aa2e794bfe31516f7e56d9837dbcc0`; frozen summary: `1185a7195a078c8b02775b0e9316e5111b149c78e309a01d9ed5b330bd6a0dbb`.
- Blind manifest: `33e36505a112a69f961a81a126e0d8f25aaf29ee7850d77589f021160d7db6cc`; private crosswalk: `db1d633a2d3793eebf54772ecf11bd82071d6fc1c944e43fc30f444863125485`.
- Parent grading ledger: `e8f9d01fd98c28a565c917216ff0864a3d4d44c5cd14f55c60a8bf9e9ff74000`; cleanup plan: `5333bceadd6cf58418e0cad673baa843ae525af0f8b59b158b5277e6a657bc8e`.
- Historical grading binder commit: `4e90b304af5a4f4025ccc4edb5eef56108c5563e`. Later hermetic refactor: `9340ed1362681804b9a380eed7f23238cd9180d9`; no review was rebound or rescored by the refactor.

## Checks and findings

The final evidence index binds the frozen plan/key/rubric inputs, native attempts, packets, reviews, assignments, parent-transcribed traces, and envelope. Direct SHA-256 and byte-count checks found no mismatch in the 13 provider-invocation rows' retained raw streams, responses, and receipts. The index's attempt metadata matched the frozen manifest. It reports 14 consumed records: 13 provider invocations (5 Claude, 8 Codex), 11 complete responses, 2 timeouts, and 1 pre-spawn setup failure. Retries and fallbacks are zero.

All 11 reviewer rows matched the private crosswalk, native response mapping, and parent grading ledger. The 11 raw review bodies, assignments, dispatch traces, completion traces, and collaboration transcriptions matched their indexed hashes; the sole bound envelope also matched. The 10 validation failures reproduced against the retained bytes before sanitization. The public index now uses generic failure categories; an exact-string scan against the private answer key's required and unsafe facts found zero leaks in the final report and index.

The corrected Codex design/xhigh timeout description is byte-accurate: its retained stdout and stderr streams are nonempty (101 and 39 bytes respectively), while the separate complete-final-response file is empty. The result report does not describe the streams as empty.

Usage and elapsed-time values in all 12 report table rows matched the evidence index. Claude's four completed calls identify the canonical model in retained `modelUsage`, while effort remains unreported. Codex model identity and effort remain unknown in the retained evidence; all timeout identity/effort values remain unknown. Codex costs and aggregate billed cost remain unknown; Claude values are marked as provider estimates. The single usable pass is the Codex diagnosis response requested at `max`, which does not establish that actual `max` effort caused the outcome. The 10 unscorable reviews are explicitly not counted as model-quality failures. Keeping existing defaults is supported by these limitations.

The parent-authorized cleanup receipt records the exact 20 plan targets. Its raw entries match the plan's original paths, provider/task/effort cells, and frozen identities; the sanitized entries' target-path hashes match the UTF-8 hashes of those raw paths. All 20 removal-time identities match the frozen device, file ID, real path, and birth time. Every directory had zero entries immediately before recycling, every source path is absent now, and all targets were under the accepted plan's temporary root. Each operation is recorded as `Microsoft.VisualBasic.FileIO RecycleOption.SendToRecycleBin` with status `recycled`; the public receipt records no raw path. The raw receipt maps each original path to its identity and operation result, but does not record a Recycle Bin destination identifier. No unrelated directory was included in the 20-entry receipt, and no cleanup action was performed by this audit.

The report, evidence index, and sanitized cleanup receipt contain no raw model response, reviewer body, exact private required/unsafe fact string, or original cleanup path. The exact fact-string and raw-path scans returned zero matches. Provenance is parent transcription of actual collaboration records, not a platform-authenticated export. The parent reports verifying each actual spawn and FINAL_ANSWER hash against live collaboration history; retained bytes alone cannot cryptographically establish runtime origin. The earlier unsanitized draft commit containing private rubric wording must not be promoted through branch ancestry. Promote only the reviewed sanitized report/index/cleanup receipt bytes and companion audit, after applying the accepted binder code commit without merging the draft history.

## Verification

- In a retained detached checkout at commit `9340ed1362681804b9a380eed7f23238cd9180d9` with no `.scratch` directory or private key, `node --test scripts/bind-reviewer-evidence-t171.test.mjs`: **pass**, 3/3, 0 skipped.
- Current combined focused command `node --test scripts/spike-model-effort-t171.test.mjs scripts/bind-reviewer-evidence-t171.test.mjs`: **pass**, 14/14, 0 skipped, 707.973 ms.
- The proposed pre-merge gate covers the controller, binder, core, fixtures, and protocol. The production wrapper's private-input loader remains outside the hermetic unit tests; its pins were inspected unchanged, and the preserved historical envelope reached expected `EEXIST` without modification when checked against its existing destination.
