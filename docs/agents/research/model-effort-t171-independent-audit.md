# Ticket 171 results: independent evidence audit

Audit of the final sanitized result artifacts at source commit `0e06613b476998c24f0b170641ea8fbd36541799`, following independent review of the native evidence, blind packets, grading ledger, and binder commits. No native calls, grading changes, rebinding, retry, cleanup, or crosswalk disclosure were performed during this final review.

## Final artifact identities

- [Results report](model-effort-t171-results.md): SHA-256 `5a7f1bb8d7a6a7396ea7fbdd8df37c05b9ab1602045c61b02739439e3cb641a5`.
- [Evidence index](evidence/model-effort-t171.json): SHA-256 `8074afd54f749eeb8df1bbd1ad756d619b9237ded3b4a113930a9a8165767fe3`.
- Frozen native manifest: `97655e3878031ef849bf35928cd4178fa4aa2e794bfe31516f7e56d9837dbcc0`; frozen summary: `1185a7195a078c8b02775b0e9316e5111b149c78e309a01d9ed5b330bd6a0dbb`.
- Blind manifest: `33e36505a112a69f961a81a126e0d8f25aaf29ee7850d77589f021160d7db6cc`; private crosswalk: `db1d633a2d3793eebf54772ecf11bd82071d6fc1c944e43fc30f444863125485`.
- Parent grading ledger: `e8f9d01fd98c28a565c917216ff0864a3d4d44c5cd14f55c60a8bf9e9ff74000`; cleanup plan: `5333bceadd6cf58418e0cad673baa843ae525af0f8b59b158b5277e6a657bc8e`.
- Historical grading binder commit: `4e90b304af5a4f4025ccc4edb5eef56108c5563e`. Later hermetic refactor: `9340ed1362681804b9a380eed7f23238cd9180d9`; no review was rebound or rescored by the refactor.

## Checks and findings

The final evidence index binds the frozen plan/key/rubric inputs, native attempts, packets, reviews, assignments, parent-transcribed traces, and envelope. Direct SHA-256 and byte-count checks found no mismatch in the 13 provider-invocation rows' retained raw streams, responses, and receipts. The index's attempt metadata matched the frozen manifest. It reports 14 consumed records: 13 provider invocations (5 Claude, 8 Codex), 11 complete responses, 2 timeouts, and 1 pre-spawn setup failure. Retries and fallbacks are zero.

All 11 reviewer rows matched the private crosswalk, native response mapping, and parent grading ledger. The 11 raw review bodies, assignments, dispatch traces, completion traces, and collaboration transcriptions matched their indexed hashes; the sole bound envelope also matched. The 10 validation failures reproduced against the retained bytes before sanitization. The public index now uses generic failure categories; an exact-string scan against the private answer key's required and unsafe facts found zero leaks in the final report and index.

The corrected Codex design/xhigh timeout description is byte-accurate: its retained stdout and stderr streams are nonempty (101 and 39 bytes respectively), while the separate complete-final-response file is empty. The result report does not describe the streams as empty.

Usage and elapsed-time values in all 12 report table rows matched the evidence index. Claude's four completed calls identify the canonical model in retained `modelUsage`, while effort remains unreported. Codex model identity and effort remain unknown in the retained evidence; all timeout identity/effort values remain unknown. Codex costs and aggregate billed cost remain unknown; Claude values are marked as provider estimates. The single usable pass is the Codex diagnosis response requested at `max`, which does not establish that actual `max` effort caused the outcome. The 10 unscorable reviews are explicitly not counted as model-quality failures. Keeping existing defaults is supported by these limitations.

The 20 CWD entries in the parent-only cleanup plan were checked read-only against the accepted plan hash and current filesystem identity. All 20 exist under the accepted temporary root, match the frozen device/file identity and birth time, and are empty. No directories were deleted or moved; the plan remains only a proposal.

The report and evidence index contain no raw model response or reviewer body. Provenance is parent transcription of actual collaboration records, not a platform-authenticated export. The parent reports verifying each actual spawn and FINAL_ANSWER hash against live collaboration history; retained bytes alone cannot cryptographically establish runtime origin. The earlier unsanitized draft commit containing private rubric wording must not be promoted through branch ancestry. Promote only the reviewed sanitized report/index bytes and separately reviewed companion audit, after applying the accepted binder code commit without merging the draft history.

## Verification

- In a retained detached checkout at commit `9340ed1362681804b9a380eed7f23238cd9180d9` with no `.scratch` directory or private key, `node --test scripts/bind-reviewer-evidence-t171.test.mjs`: **pass**, 3/3, 0 skipped.
- Current combined focused command `node --test scripts/spike-model-effort-t171.test.mjs scripts/bind-reviewer-evidence-t171.test.mjs`: **pass**, 14/14, 0 skipped, 707.973 ms.
- The proposed pre-merge gate covers the controller, binder, core, fixtures, and protocol. The production wrapper's private-input loader remains outside the hermetic unit tests; its pins were inspected unchanged, and the preserved historical envelope reached expected `EEXIST` without modification when checked against its existing destination.
