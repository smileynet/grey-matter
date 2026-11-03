# Independent audit: ticket 168 model review run

**Verdict: evidence integrity accepted; semantic scoring remains with the blinded parent.** This audit covers the frozen controller's final 23-row run ledger and its receipt-to-ledger integrity audit. It does not inspect or score finding text, defect recall, false positives, or review quality.

## Identities and integrity

| Check | Result | Evidence |
|---|---|---|
| Run ledger | Supported | `.scratch/t168/measurement-ledger.json`, SHA-256 `3fa510a13a359f8c52ac6958ca37598d81d69a032d56ff42e4f7d7a3ad9b20f5`; 23 distinct cell IDs and 23 distinct provider/fixture/tier combinations. |
| Integrity audit | Supported | `.scratch/t168/ledger-integrity-audit.json`, SHA-256 `2d3e27bf335df5eb6d996701b98ddf21bec89c3bffbf44dfa5f739756297cdf3`; it binds to the exact ledger hash. |
| Receipt and raw files | Supported | Independently recomputed 23 `receipt.json` hashes and 46 stdout/stderr hashes. Every file exists and matches the ledger, receipt, and integrity-audit manifest; zero mismatches. |
| Provider coverage | Supported | Claude 7, Codex 8, Kiro 8, Google 0. Eight Google/Agy cells remain blocked; no Google call or provider fallback is recorded. |
| R14 evidence relocation | Supported | The recorded prior path under the t190 worktree is absent; the corrected t168 path exists. Its receipt hash matches `8bfb9235ad8b63c917e5f93927983dda513024cb9e7efcd5b77ce3763c8e6b69`; the ledger says status unchanged. |

## Status and continuation checks

The receipt classifications agree with the ledger: 14 completed reviews with valid JSON, seven invalid-format responses, one Codex process failure, and one Kiro infrastructure/error outcome. R09 is the empty-stdout Codex startup failure before a native review turn. R21's native turn ended, but its response did not satisfy the required JSON format after a denied optional local arithmetic command; it is not a scored review. These outcomes remain consumed and were not retried.

The ledger records two parent-authorized continuation transitions. Codex's R09 setup failure permits only new IDs R10–R16; all seven rows start after authorization. Kiro's R21 non-quality failure permits only R22–R24; all three rows start after authorization. Both transitions explicitly set `retryPriorCell`, `usageLimitOverride`, and `googleAllowed` to false. No row reports a usage limit, and `providerStopped` is empty after the authorized cells completed. No use of `--trust-all-tools` or other permission expansion is recorded in the accepted controller protocol.

The parent owns blinded semantic scoring and the final integration decision. Preserve private raw responses through that review; this audit contains no response text or answer-key data.
