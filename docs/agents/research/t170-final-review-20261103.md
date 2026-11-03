# Ticket 170 final evidence review

> The spike harness this doc cites was removed from `scripts/` (ticket 209). Paths below are as of commit `e35d8a8`; see [rerunning the model-tier spikes](model-tier-spikes-rerun.md).

Reviewed worker commit `a9de155c5d35e9ba721a16c356088abc5a0662d8` against the retained native evidence and the frozen blind-review record.

## Findings

The report and results note accurately summarize the retained evidence: 18 native calls completed; the independent frozen scoring ledger records 7 passes and 11 failures; documentation rewrite passed in all six profiles, triage passed only for Codex's requested lower-cost profile, and changelog classification failed in all six. No profile passed all three tasks. The recommendation to keep current defaults for these bounded task classes follows the frozen adoption bar.

Usage, cost, and served identity are reported with the necessary limits: Claude emitted cost and model identity; Codex and Kiro did not report cost or served identity. The three-of-three denominator is explicit, and the documents state that one observation cannot establish repeatability or broad reliability. Google/Agy's six held cells are not described as provider failures.

The provenance language is appropriately narrow. The audit supports byte/hash bindings and the recorded tally, but the review dispatch/completion traces are parent transcriptions rather than a platform export. It does not authenticate platform UUIDs, reviewer blindness, or semantic correctness. The review-09 note accurately says the first write failed and its missing bytes prevent comparison with the recovered same-reviewer decision.

The private artifact index points to the relevant evidence and distinguishes the Kiro cleanup plan from its completed cleanup receipt. The plan hash matches `05C1DF2047A9A1144A703E90C1C1A8FE88957A83CD3640BEAC2DE1FDC51E8B9E`. A later read-only review verified the cleanup receipt and retained listings as detailed below; no cleanup was performed during that review.

## Integrity anchors

- Worker commit: `a9de155c5d35e9ba721a16c356088abc5a0662d8`.
- Frozen parent grading ledger SHA-256: `13EC7F7E07B788D9B747CC1D9AB6E9E45FDFFA82C873910A1976AB77C55368AA`.
- Independent integrity audit SHA-256: `FA2708345CA2647ACB34A42094F3C59AB08098F446840EBE7001F774C1DAA102`.
- Committed per-cell evidence SHA-256: `435E38F5A7E7574E9E7D7BFAF340A9A539A7AC1AECA977C14428B335EDF8171B`.
- Frozen review ledger: 18 bound rows; tally independently reported by audit is 7 pass / 11 fail.
- Cleanup receipt SHA-256: `B9D72862033B03E358043B1D132D0136341939854167874649A2FDDED433230E`; sanitized cleanup summary SHA-256: `D5FEF4D8FE23BF4CC9F172C884C231D49226A7F2F73421CAEC85BA68771BAAEC`.
- Frozen protocol SHA-256: `D49E8C8C9B3BFE4E6CB246F94A12BAA22856EC9D0B65DE5225C4C2A3067DAA19`; current controller SHA-256: `D7E8187E046574755E5876917E0D1B7AF282C6E8CFDD1A27D3BF5DDEBCF873C6`; controller test SHA-256: `D713B3FD82FA08D5C77489D945A1E79C259979E11020B082E909C9F6AA67D866`.
- Parent guide SHA-256: `D468150ED1355529C5AE3E8A27EC3AB1A6C94D5569B90E4F82CA6A3049E77533`; parent gate manifest SHA-256: `1ACB0E6675FA926BE0836277CB93C7AC9C7455EAA88EED91E37C54E7FB2F46EC`.

## Scope and checks

The final worker commit reviewed here is `d5e65e103cc2544ccc04c65eeaa282f5569675bf`; it preserves the original frozen protocol bytes in a dedicated protocol document and points the controller at that document. The updated controller hash differs from the controller used for the historical native calls; the retained call receipts and source bindings continue to describe the version actually used. The parent guide keeps the current-default recommendation and the gate now includes the immutable protocol path.

In a detached checkout at the exact final worker commit, with the private answer-key file absent, `node --test scripts/spike-model-task-tier-t170.test.mjs` passed: 7 tests, 0 failures, 0 skipped, 1.480 seconds. The suite exercises the real controller `main(argv)` path and a harmless fake process; it made no model/provider call. `node --test scripts/review-receipt.test.mjs` passed 14/14 in the worker checkout. `node scripts/check-docs-consistency.mjs` passed. In the parent checkout, `node scripts/check-gates-coverage.mjs` passed (49 gated scripts, 3 documented exemptions), the gate manifest parsed, and `git diff --check` passed. The parent gate's 10-second budget is five times its preflight measured 2.0 seconds; its fresh gate run is represented by the isolated seven-test run above, not a gate-runner execution.

For cleanup, the plan listed six exact V2 IDs; each matched its retained native receipt and appeared once as V2 before deletion. The six successful exact-source deletion receipts and after-listing show all targets absent, all six planned working directories absent, and the same 7,600 non-target ID/source pairs before and after. Independent SHA-256 recomputation of that pair set matched `D4BF1D29205EFA580D395D9BD93697EC353FC6DE9577F8D26EC74F0F88F9E459` on both sides. The before and after listing bytes are retained privately and hash-bound; no listing contents or session identifiers are included here.

No native calls, new grades, live session listings, or cleanup were performed in this final review. The parent owns integration, push, and ticket closure.
