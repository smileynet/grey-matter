# Ticket 171 offline preparation audit

**Renewed review commit:** `1c81e04860978bfcdd1909fbb856092cf6dfded3`
**Prior reviewed commit:** `fc8548c6d9271b4bb3d87b3373ade8cb5d6d9b7d`
**Verdict:** not accepted for native-call authorization
**Trust score:** 0.84 — the directory replacement issue is fixed; fresh-checkout testability and the authorized execution boundary remain unresolved.

## Findings

### Resolved: the plan now binds the prepared directory identity

The revised plan records real path, device, file ID, and birth time for every directory. `runPreparedCell` checks identity and emptiness before and immediately before spawn. A regression replaces the authorized path with a different empty directory and verifies fake spawn is not reached. The protocol accurately limits this to detecting ordinary replacement and does not claim an OS security boundary. Independent verification of the retained 20-cell plan found 20 unique identities, all directories empty, and every identity still matching its path. The recomputed canonical plan hash matches the stored hash.

### Blocking: tests require private answer-key and rubric files

Every test that calls `makePlan` also requires the private answer-key and grading-rubric files: `makePlan` unconditionally hashes both from `.scratch/t171/preparation`. Those ignored files are absent in a fresh checkout. The test suite therefore cannot run self-contained without private grading material, contrary to the #169 regression constraint and parent acceptance requirement. Make the plan constructor accept test-only/injected hash inputs or otherwise isolate production private-input binding from the fake-plan tests; retain production validation against the actual private inputs.

### Blocking: no authorized execution entrypoint consumes the persisted plan

The CLI's `run` branch still always throws that authorization is disabled. There is no `--execute` entrypoint that reads the exact persisted plan bytes, parses and validates the plan and parent authorization at the trust boundary, then calls `runPreparedCell`. The fake-spawn integration round-trips a plan through JSON, but passes the resulting object directly to the exported function; it does not exercise the execution entrypoint or its parsing/authorization boundary. Parent acceptance criteria require `--execute` to consume the exact prepared plan and validate it before any spawn. Keep execution gated on explicit parent authorization; add the gated entrypoint and a fake-spawn integration test covering its exact persisted plan bytes and invalid/tampered input cases.

The previous environment restoration issue is fixed: the revised test preserves both value and presence of `OPENAI_API_KEY` and asserts restoration.

## Independently checked evidence

- Re-ran `node --test scripts/spike-model-effort-t171.test.mjs`: **pass**, 8 tests, 0 failures, 0 skipped. This confirms the new replacement regression in this checkout; it does not establish fresh-checkout independence because private scratch files are present here.
- Read the retained local Codex model catalog entry for `gpt-6.1-sol`: it advertises `low`, `medium`, `high`, `xhigh`, `max`, and `ultra`, with default `low`. The catalog is client version `0.166.0`, SHA-256 `88506958bbd8b2bfde50c7cce78583afd9ec203684661dacd9e8830f2fa28e4d`. Excluding `ultra` is appropriate for a fixed-effort comparison because this catalog describes it as automatic task delegation.
- The official [Kiro reasoning-effort guide](https://kiro.dev/docs/models/effort/) says supported levels vary by model; it does not establish support for the pinned Qwen3 Coder Next model and Kiro 2.37.1. Holding those cells without inventing support is correct.
- The official [Claude model configuration](https://code.claude.com/docs/en/model-config) documents effort configuration and that the environment variable can override the command-line setting. Setting the child-only variable to match the requested CLI effort avoids conflicting controls. The live docs can change independently of the pinned local CLI, so they do not establish the result of a future invocation.
- Independently hashed the installed Codex executable and its adjacent host. Their SHA-256 values match the source constants and retained receipt: executable `9d563ee4e0441ff9d59d612013e0460ddf8e5709735c2d9f6b98b7ef8ca4eb42`; host `977c1f01c9efac0bfe1b9032717c95f92e1c965c8441a8dacbfe824c5c79a527`. The worker-handoff typo `a8dacfbe` is not present in the controller constant. Claude and Kiro hashes in the private receipt were independently checked in the source worktree; their byte matches do not constitute full installed-package attestation. The controller pins the Codex launcher and host, not the remaining installed package files.
- Independently inspected the retained 20-cell prepared plan: 10 Claude and 10 Codex runnable cells, 10 Kiro cells held as model-effort-unverified, and 10 Google cells security-blocked without commands. All 20 runnable directories are unique, empty, non-reparse real directories with matching recorded identities. The hash-bound plan digest recomputes to `a932e4f07a5392a1fc9421a2b8f561c405aa80a7fbf5c80a2ba3f8a9de1bc60a`. Claude passes cwd as the spawn working-directory option, while Codex carries its directory flag in argv.
- The controller consumes the argv stored in the hash-bound plan and passes that same argv and cwd to `spawn` without reconstructing the command. However, no authorized CLI path currently loads that persisted plan.
- Fixture answer keys, private scoring rubric, blind-review template, attempt limits, explicit held/blocked cells, no-retry rule, and separation of output quality from execution/usage failures are clearly scoped. No provider CLI was invoked during this audit.

## Acceptance condition

Do not release the native measurement lease until tests can run without private grading files and a gated execution entrypoint reads and validates exact persisted plan and authorization bytes before spawn. The directory identity revision and environment restoration are accepted. Route the revised exact commit and updated raw evidence for renewed independent review.
