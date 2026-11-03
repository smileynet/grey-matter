# Independent audit: ticket 168 model review run

**Verdict: evidence integrity and the parent-led blinded score package accepted for integration.** This audit verifies the frozen controller's 23-row ledger, the parent-provided blind scoring artifacts, the published summary, and the cleanup receipts. The parent owns the semantic adjudication; this audit did not independently reread the 22 responses or reproduce the judgments.

## Identities and integrity

| Check | Result | Evidence |
|---|---|---|
| Run ledger | Supported | Private `measurement-ledger.json`, SHA-256 `3fa510a13a359f8c52ac6958ca37598d81d69a032d56ff42e4f7d7a3ad9b20f5`; 23 distinct cell IDs and 23 distinct provider/fixture/tier combinations. |
| Integrity audit | Supported | Private `ledger-integrity-audit.json`, SHA-256 `2d3e27bf335df5eb6d996701b98ddf21bec89c3bffbf44dfa5f739756297cdf3`; it binds to the exact ledger hash. |
| Receipt and raw files | Supported | Independently recomputed 23 `receipt.json` hashes and 46 stdout/stderr hashes. Every file exists and matches the ledger, receipt, and integrity-audit manifest; zero mismatches. |
| Provider coverage | Supported | Claude 7, Codex 8, Kiro 8, Google 0. Eight Google/Agy cells remain blocked; no Google call or provider fallback is recorded. |
| R14 evidence relocation | Supported | The recorded prior path under the t190 worktree is absent; the corrected t168 path exists. Its receipt hash matches `8bfb9235ad8b63c917e5f93927983dda513024cb9e7efcd5b77ce3763c8e6b69`; the ledger says status unchanged. |

## Status and continuation checks

The receipt classifications agree with the ledger: 14 completed reviews with valid JSON, seven invalid-format responses, one Codex process failure, and one Kiro infrastructure/error outcome. R09 is the empty-stdout Codex startup failure before a native review turn. R21's native turn ended, but its response did not satisfy the required JSON format after a denied optional local arithmetic command; it is not a scored review. These outcomes remain consumed and were not retried.

The ledger records two parent-authorized continuation transitions. Codex's R09 setup failure permits only new IDs R10–R16; all seven rows start after authorization. Kiro's R21 non-quality failure permits only R22–R24; all three rows start after authorization. Both transitions explicitly set `retryPriorCell`, `usageLimitOverride`, and `googleAllowed` to false. No row reports a usage limit, and `providerStopped` is empty after the authorized cells completed. No use of `--trust-all-tools` or other permission expansion is recorded in the accepted controller protocol.

## Parent-led blinded scoring and published results

The parent reports a fresh, provider-unaware scoring context assessed all 23 mapped attempts, with 22 nonempty responses available for scoring. The resulting private score artifact `semantic-scores.json` has SHA-256 `44d12c4d653f1dc31abe0d676368aff0943c98a665415a8b3cac1519abbff71e`; its corrected independent scorer audit `scoring-audit.md` has SHA-256 `2e0b80ec52089e4be9847d5e182c64c596079ca3c9ba6363be5f787e6d69b5e1`. The private derived 23-row join `derived-results-join.json` has SHA-256 `61d6b6c80e2baab4f00b5d00dae9f94e3ddf1891a0aa563051b3caeb41299315`. The join binds the score, scoring audit, blind packet, key, rubric, raw ledger, and R14 path correction. Exact locations are listed in the private artifact index.

The accepted score package reports 22/22 target findings and 22/22 exact changed-line citations among nonempty responses, 9 unsupported claims, and 5 duplicates. These are secondary semantic results: all 7 format-invalid responses and the Kiro R21 denied-tool response remain invalid under the primary format measure. The primary outcome is 14 valid JSON responses out of 23 attempts; eight returned invalid JSON text and one returned no response. R09 remains a pre-turn Codex process failure; R21 remains a denied optional local-computation outcome, not a retry. The empty R09 response is unavailable, not scored as a miss.

The published report is `docs/agents/research/model-tier-review-20261103-results.md`, SHA-256 `f3a9cafe106180bad7d05a6f093ec7bb04ff8fe8823c6558389ddbcbd9104ccb`; its sanitized evidence JSON is `docs/agents/research/model-tier-review-20261103-evidence.json`, SHA-256 `321612da2cbf299314b528cb94ec5c908bb78bd6874bb3852c5b87bd6c61a39e`. Both distinguish primary format validity from secondary semantic scores, note that requested Claude Haiku was served as Sonnet 5.5, leave Codex/Kiro model identity and costs unknown, report Claude list estimates rather than billing, and state that total Claude budget compliance is unverified because an earlier unintended turn's usage is unknown. Eight Google cells were blocked; Claude cheap f1 was omitted for budget accounting. No model configuration changed, and retaining defaults is presented as a conservative choice under incomplete coverage rather than a universal pass claim.

## Final cleanup and retention

After the earlier audit accepted the results, commit `1f68547b9dd93fd7db11b507b63ae515fae223a0` updated only the report and evidence JSON with the cleanup outcome. The private cleanup-final audit `cleanup-final-audit.json` (SHA-256 `fd12ea5636438054a2f5b6fa2189b2b5fbad34b9de844e1b153f7dc7b9e8a6e1`) binds the Kiro cleanup receipt `cleanup-audit.json` (SHA-256 `bc6bd450a4e6cdb6aadf9040f23d22e7252c78dbf9e68f235a347d16aa62b903`) and the empty-workdir Recycle Bin receipt `temp-workdir-recycle-receipt.json` (SHA-256 `222592e22c611338451e185aa2573235d7120913d9cd0511b5e233a281e25f4a`). Exact locations are listed in the private artifact index.

All eight measured Kiro V2 session IDs match the recorded R17–R24 cells, were deleted through the pinned CLI, and were absent from the final listing. The same 7,599 non-target sessions remained, verified by matching before/after tuple-set hashes. All 23 controller work directories were verified empty, sent to the OS Recycle Bin, and confirmed absent. No permanent-purge or reclaimed-space claim is made. The raw 23-cell evidence, blind map, scoring inputs, and answer key remain in private scratch for the 169–172 handoff; the cleanup plan inventories 148 files / 7,219,659 bytes. No raw responses, keys, or session IDs were added to the public artifacts.

This is a bounded audit of the retained artifacts and the parent's independent score package, not a general reliability estimate. No provider call or cleanup action was run during this audit update.

## Citation normalization

This public audit received a documentation-only citation normalization after its evidence review. Private artifact paths were moved to the companion artifact index so temporary paths do not appear in durable Markdown. This editorial change does not alter the frozen native cells, evidence hashes, score judgments, or the earlier audit's scope.
