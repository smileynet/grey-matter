# Ticket 171 host-pin correction audit

> The spike harness this doc cites was removed from `scripts/` (ticket 209). Paths below are as of commit `e35d8a8`; see [rerunning the model-tier spikes](model-tier-spikes-rerun.md).

**Reviewed source commit:** `1a71074c8b09a45b4bd4d97346fa21002d2b5bae`
**Amended plan digest:** `8b887b09f7d1eb8ce2667967a4741dbf2d61927718a96b70f4a2bb2f23d366cd`
**Amended plan bytes:** `1b5a645ac309ca0cf6967437b91258096be4e844befdcba721d605c664a64aaf`
**Verdict:** accepted for parent authorization of the nine unconsumed Codex cells only; this audit releases no lease
**Trust score:** 0.91 — the pin correction and amended plan verify; one consumed setup attempt has only a transcript, not raw stderr.

## Correction to my prior review

My preceding audit of `3376c6342386424b58ce0735e856e5520271242b` incorrectly said its Codex host pin matched the installed bytes. I misread the hash literal. Reading the exact source blob now confirms the prior controller expected `...a8dacfbe...`; the actual host bytes hash to `...a8dacbfe...`. The runtime guard therefore correctly stopped the Codex diagnosis `low` attempt before provider spawn. The cell is consumed and must not be retried. This was a critic error; the source correction fixes it.

The retained attempt ledger labels the supporting text as a transcription of tool output, not raw stderr. I independently verified the old source's wrong pin, the corrected source's pin, and the actual host bytes. I cannot independently recover raw stderr or derive a provider cost from that transcription. Keep the attempt classified as setup-failed/consumed, with zero native model calls and cost unknown as reported by the parent; do not claim it was a zero-cost event.

## Verification

- The corrected source constant is `977c1f01c9efac0bfe1b9032717c95f92e1c965c8441a8dacbfe824c5c79a527`. Read-only hashing of the installed companion host produced that exact SHA-256. The source's verifier checks the pin before spawn. A regression proves matching synthetic bytes pass and changed bytes fail.
- Independently ran `node --test scripts/spike-model-effort-t171.test.mjs` in a detached checkout of the exact source commit, with no private preparation directory before or after. **Pass:** 11 tests, 0 failures, 0 skipped. The retained fresh-checkout transcript hash independently matches `8f18b06e69f1ae26e909442e99cd9d56d4101c3fb09cbc3b318e2e96adb89ab4`. The producer's ordinary offline run transcript hash is `99ec4feaaff2b9664014f0b318a003bc6d43b8860b6d339a94b77a4f171c746c` and also reports 11/11 passing.
- The corrected controller hash is `3c6d0d3091d4a3fcc082b914bfa913d4e6441101ef005accab2dde79b173bd20`; protocol hash is `65260b7b6466dab98a0496619d8b1734bcb7f2e52bcf0364943f1382200d34c0`. The amended plan recomputes to its recorded digest and byte hash. A field-by-field comparison with the previously reviewed prepared plan found the only body changes are `controllerSha256` and `protocolSha256`; `planSha256` changes as their consequence. All 20 task/model/effort/argv/cwd identities, private-input hashes, and caps remain identical. I independently rechecked all 20 unique directory identities and found all 20 current directories empty and matching.
- The amended plan still describes the full frozen 20-cell matrix: 10 Claude, 10 Codex, 10 Kiro held for pinned-model effort uncertainty, and 10 Google blocked without commands. The *new authorization* must select only the nine unconsumed Codex cells: diagnosis `medium`, `high`, `xhigh`, `max`, and all five design efforts. It must exclude Codex diagnosis `low`, which was already consumed as a setup failure. Existing authorization files bind the superseded controller/protocol/plan and are historical evidence only; they do not authorize execution under this revision.
- Read the four completed Claude diagnosis streams directly and checked their receipt hashes. Each raw response envelope reports canonical `claude-opus-5-5` via `modelUsage`; none reports actual effort. Claude `max` is a 120-second timeout with no response, so identity and effort remain unknown for that attempt. Those prior results remain bound to their original controller, protocol, and authorization. Do not relabel requested effort as observed effort or use these samples as grading results.
- The setup-failed Codex `low` attempt must remain separate from model-call counts. Preserve its original attempted plan, authorization, transcript and ledger entry. No provider CLI or model was invoked during this audit.

## Authorization boundary

This review accepts the exact corrected source and amended plan only as inputs for the parent to write a new authorization for the nine cells listed above. The parent authorization must bind this source commit, corrected controller and protocol hashes, exact amended-plan bytes, actual private-input hashes and original call caps. It must not reuse the historical authorization or retry the consumed Codex `low` cell. Claude design and Google/Agy remain held/blocked. No calls, cleanup, grading, push, merge, or ticket closure are authorized by this audit.
