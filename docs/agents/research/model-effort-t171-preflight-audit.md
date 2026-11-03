# Ticket 171 offline preparation audit

**Reviewed commit:** `fc8548c6d9271b4bb3d87b3373ade8cb5d6d9b7d`  
**Verdict:** not accepted for native-call authorization  
**Trust score:** 0.78 — the study design and most provenance boundaries are sound, but the prepared working-directory identity is not frozen as required.

## Findings

### Blocking: the plan binds a path, not the prepared directory identity

`makePlan` creates each fresh cell directory and records only its path in the hash-bound plan. `runPreparedCell` later checks that the path resolves under the temporary root and is empty. It does not compare a stable directory identity captured when the plan was prepared. Replacing the authorized path with a different empty directory under the root therefore passes the check while preserving the path string, argv, and plan hash. The reviewer-required guarantee is that directory identity is frozen before parent authorization and checked before spawn.

Revise the plan to retain a platform-appropriate stable identity for every cell directory, verify it again before spawn, and fail closed on mismatch. Add a fake-spawn integration case that replaces the authorized directory with a different empty directory and proves spawn is never called. Keep the check scoped to the controller; do not claim an OS security boundary.

### Minor: the environment test does not restore `OPENAI_API_KEY`

The child-environment test assigns `process.env.OPENAI_API_KEY = "test-secret"` and unconditionally deletes it in `finally`. Preserve and restore the prior value, as the test already does for `CLAUDE_CODE_EFFORT_LEVEL`, so this test cannot mutate the environment for other tests in the same process.

## Independently checked evidence

- Re-ran `node --test scripts/spike-model-effort-t171.test.mjs`: **pass**, 7 tests, 0 failures, 0 skipped. This confirms current behavior but does not address the missing directory-replacement case.
- Read the retained local Codex model catalog entry for `gpt-6.1-sol`: it advertises `low`, `medium`, `high`, `xhigh`, `max`, and `ultra`, with default `low`. The catalog is client version `0.166.0`, SHA-256 `88506958bbd8b2bfde50c7cce78583afd9ec203684661dacd9e8830f2fa28e4d`. Excluding `ultra` is appropriate for a fixed-effort comparison because this catalog describes it as automatic task delegation.
- The official [Kiro reasoning-effort guide](https://kiro.dev/docs/models/effort/) says supported levels vary by model; it does not establish support for the pinned Qwen3 Coder Next model and Kiro 2.37.1. Holding those cells without inventing support is correct.
- The official [Claude model configuration](https://code.claude.com/docs/en/model-config) documents effort configuration and that the environment variable can override the command-line setting. Setting the child-only variable to match the requested CLI effort avoids conflicting controls. The live docs can change independently of the pinned local CLI, so they do not establish the result of a future invocation.
- Independently hashed the installed Codex executable and its adjacent host. Their SHA-256 values match the source constants and retained receipt: executable `9d563ee4e0441ff9d59d612013e0460ddf8e5709735c2d9f6b98b7ef8ca4eb42`; host `977c1f01c9efac0bfe1b9032717c95f92e1c965c8441a8dacbfe824c5c79a527`. The worker-handoff typo `a8dacfbe` is not present in the controller constant. Claude and Kiro hashes in the private receipt were independently checked in the source worktree; their byte matches do not constitute full installed-package attestation. The controller pins the Codex launcher and host, not the remaining installed package files.
- The controller consumes the argv stored in the hash-bound plan and passes that same argv and cwd to `spawn` without reconstructing the command. This is good, but does not repair the identity gap above.
- Fixture answer keys, private scoring rubric, blind-review template, attempt limits, explicit held/blocked cells, no-retry rule, and separation of output quality from execution/usage failures are clearly scoped. No provider CLI was invoked during this audit.

## Acceptance condition

Do not release the native measurement lease until the producer records stable prepared-directory identity in the plan and the regression test rejects a different empty directory before spawn. Fix the environment restoration issue in the same revision. Route the revised exact commit for renewed independent review.
