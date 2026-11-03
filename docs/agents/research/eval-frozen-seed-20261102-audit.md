# Independent audit: frozen evaluation seed

**Verdict: accepted.** Reviewed exact commit `6825896e8023c8024881c741b6032ae48a24b1d3`.

## Findings

| Claim | Verdict | Evidence |
|---|---|---|
| The runner no longer depends on a live fixture generator or host `tkt init`. | Supported | `freezeFixture` materializes the checked-in seed manifest and dashboard snapshot directly. The invocation path runs this validation before the native CLI version/session calls. |
| The committed source bytes reproduce the demonstrated fixture tree. | Supported | The manifest pins 14 file byte lengths and SHA-256 values; the existing dashboard snapshot pins the fifteenth. The runner validates each source, stages the new fixture, and requires Git tree `c474646ea61e037fcdbc1be3d2dc6c0833f5e260` before invocation. The integration test exercises that path. |
| Unexpected fixture drift is rejected. | Supported | Existing staged/unstaged tracked changes are compared from HEAD; untracked and ignored files are included in the preflight check; the full staged tree is checked against the expected tree. The regression test adds an unexpected staged file and verifies rejection. |
| The verification result is current and correctly classified. | Supported | On Windows, `node --check scripts/spike-model-eval.mjs`, `node --check scripts/spike-model-eval.test.mjs`, `node --test scripts/spike-model-eval.test.mjs`, and `git diff --check 6825896^ 6825896` completed. The test suite passed 15/15 in 3.25 seconds; diff check was clean. Git emitted LF-to-CRLF warnings for temporary test fixtures. No model call occurred. |

The committed seed manifest and tested tree match the independent reviewer’s inspected bytes. The report’s comparison against the mutable live generator relies on the recorded parent-side generator observations; I did not rerun that generator. This does not weaken the committed seed-tree proof.

## Scope

The review accepts the deterministic seed construction and its pre-call drift gate. It does not revalidate historical native model results or claim OS-level isolation for future model processes.
