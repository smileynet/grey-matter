# Ticket 171 offline preparation audit

**Reviewed source commit:** `3376c6342386424b58ce0735e856e5520271242b`
**Prior audit:** `fc574ad584a40f06270a670ac9b4ed3259be0c54`
**Verdict:** accepted for parent authorization review; no native lease is released by this audit
**Trust score:** 0.93 — the exact-plan execution boundary and private-input binding are covered; pinned Kiro support remains correctly held.

## Findings and disposition

The two prior blockers are resolved. `makePlan` requires explicit private-input hashes; production preparation and execution compute those hashes from the actual answer key and rubric, while tests use public synthetic hashes. The tests passed in an independently created detached worktree at this exact source commit, before any private preparation files existed, and the private directory remained absent after the suite. The suite has ten passing tests, zero failures, and zero skips.

The production `--execute --plan ... --authorization ... --cell ...` path reads canonical plan and authorization files under the private root, checks bounded regular-file bytes and identity during read, validates exact schemas and source hashes, verifies fixture-derived prompts, model/effort/argv, execution caps and private-input hashes, then matches authorization to exact plan bytes, lease, selected cells and accepted critic commit before calling the run function. The production command exposes no test dependency overrides. Tests exercise the same dispatcher and persisted-file path with injected fake spawn, private-input hashing, and executable verification; they reject plan/auth mutations, wrong private hashes, invalid canonical bytes, wrong caps, repeated execution, nonempty/replaced working directories, and invalid CLI paths before spawn.

## Independently checked evidence

- In a detached source worktree with no private preparation directory, ran `node --test scripts/spike-model-effort-t171.test.mjs`: **pass**, 10 tests, 0 failures, 0 skipped. Confirmed the private preparation directory was absent before and after. Raw test output SHA-256: `c193c36c5ec3033e4f77231f9adf42e9155aa22b7d2c3f997053a75f74deb4da`.
- Recomputed the current prepared plan digest: `6a840d7e686cbfb4821bb25d6cc124b8deaee3c36780b67a31560a30d171f066`; it matches the plan. Exact plan bytes SHA-256: `5d6cdfbfdc30bcde6b823d0b52228f1eb95b362d5eb8a07309522ed044d09ad9`. The current protocol hash matches the plan. Actual private answer-key and rubric byte hashes also match its recorded private-input hashes.
- Independently checked all 20 prepared cells: 10 Claude and 10 Codex, 20 unique directory identities, all current paths resolve to the recorded identity and all directories are empty. The plan holds 10 Kiro cells because support for the pinned model/version is unverified, and blocks 10 Google cells without commands. Caps are one attempt per cell, 120 seconds, no retry, with Claude's explicit per-call and aggregate request ceilings; Codex-reported cost remains unknown.
- The controller uses the prepared argv and working directory unchanged. It rechecks directory identity and emptiness immediately before spawn, writes a one-shot reservation, serializes native runs, and records completion, usage, and identity uncertainty separately from semantic grading. The replacement test uses a local synthetic Node fixture; no model provider CLI was invoked.
- The retained local catalog supports the five requested Codex effort levels and lists `ultra` separately as automatic delegation; excluding it keeps the sweep focused on effort. Official Kiro documentation states support varies by model, and the retained pinned evidence does not resolve Qwen3 Coder Next support for the installed version, so the hold is correct. Official Claude documentation supports the requested controls; child-only environment override matches the command-line effort. The actual provider identity/effort and resulting quality remain unmeasured until a parent releases the lease.
- Installed Codex executable and companion host hashes match the reviewed source pins. This review confirms those two pinned files only; remaining installed support files are trusted local state with integrity unverified, as scoped by the parent.

## Boundary

This accepts the exact offline preparation for the parent to review and, if appropriate, authorize. It does not authorize a provider invocation, native lease release, cleanup, push, merge, or ticket closure. The parent should bind the exact source commit, protocol hash, controller hash, plan-byte hash, private-input hashes, limits and selected cells in its authorization record. Do not treat requested effort as observed effort when a provider omits identity or effort from its response.
