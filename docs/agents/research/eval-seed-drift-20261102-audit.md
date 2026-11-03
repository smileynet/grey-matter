# Independent audit: evaluation fixture seed repair

**Overall trust: 9/10 (high).** The repair addresses a reproduced seed mismatch without changing the general fixture generator or making another model call. It preserves the historical #174 execution receipts and gives future runs a committed, hash-checked input.

## Claim checks

| Claim | Verdict | Basis |
|---|---|---|
| The current generator drifted from the demonstrated #174 fixture. | Supported | A fresh run of `scripts/spike-orchestrate-fixture.mjs` produced tree `d1ae7bc7028f238f8207b2eec31f9d0ba5e1f40e`; the report compares it with the frozen #174 tree `c474646ea61e037fcdbc1be3d2dc6c0833f5e260` and attributes the only changed blob to `docs/status.html`. |
| The pinned dashboard snapshot is the historical fixture input. | Supported | In the parent checkout I independently checked the retained #174 T3 fixture's `docs/status.html`: 45,998 bytes, SHA-256 `f2c67d3e24d057be82d19c70b95ce1eaa6fd9afaf28bd7501e86d4a82474a12f`, Git blob `9bf84ecc6b8c491097301c52b93f3ab152703121`. The committed `scripts/fixtures/model-eval/seed-status.html` has the same size, SHA-256 and Git blob. |
| The runner repairs this known drift and refuses unrelated drift before invoking a model. | Supported | In commit `afcc706`, `freezeFixture` restores only the committed dashboard snapshot, stages it, amends the generated fixture seed, then checks the entire tree against the frozen expected tree. The call happens before CLI version and agent invocation. The integration test runs the whole runner with Node as a fake Claude executable: setup reaches the fake native process, records `agent-process-failure`, and reports the matched seed; an extra staged seed file causes the frozen-tree check to throw. |
| Verification and provenance are accurate. | Supported | `node --test scripts/spike-model-eval.test.mjs` passed 13/13 in 3.42 seconds on Windows; only temporary Git LF/CRLF warnings appeared. `git diff --check afcc706^ afcc706` was clean. I confirmed the runner SHA-256 `f6a5a3bbf6e9456af40f60cdd08ffaafcf86cc184cc3607134c520ca11f01dbc` and snapshot SHA-256. No model call was made by the repair or my verification. |

## Limits

The correction intentionally pins only the known dashboard drift. Any other generated tree change fails instead of being silently accepted. The harness still lacks an OS boundary around native agent access; the trial report correctly limits these fixtures to non-adversarial runs. Historical #174 executions were not rerun or relabeled; future receipts need the current runner source identity.

## Verdict

The repair and its regression evidence are accepted. It restores reproducibility for the recorded T1/T3 seed and keeps unrelated generator drift visible. The trial's existing conclusions remain bounded to its two demonstration tasks and host setup.

Reviewed parent change: commit `afcc706`. Runner: `scripts/spike-model-eval.mjs`. Snapshot: `scripts/fixtures/model-eval/seed-status.html`. Research report: [`eval-seed-drift-20261102.md`](eval-seed-drift-20261102.md). The model evaluation findings remain in [`eval-runner-trial-20261102.md`](eval-runner-trial-20261102.md) with the durable index at [`evidence/eval-runner-trial-20261102.json`](evidence/eval-runner-trial-20261102.json).
