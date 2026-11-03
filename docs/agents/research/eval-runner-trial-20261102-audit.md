# Independent audit: model evaluation runner trial

**Overall trust: 9/10 (high).** The decision is supported by source-bound native-run receipts, a runnable Windows recipe, and a grader-scope correction tested against retained fixtures. Harbor conclusions are correctly limited to this host's setup attempt; this is not evidence that Harbor fails generally.

## Claim checks

| Claim | Verdict | Basis |
|---|---|---|
| The thin runner completed the T1 and T3 fixture tasks on this Windows host. | Supported | The evidence receipt binds three fresh-root end-to-end runs to runner commit `1fc45626e396115d7379715b8a56a23b79f621ad` and source SHA-256 `d1e567abd677cc67161024d21245e050e6c928aa840773a289c1c49dd8c3546f`. I independently matched their receipt byte counts, hashes and raw agent stdout/stderr hashes. Claude T1 and T3 pass; Codex T1 passes. Direct native evidence separately records Codex T3. |
| Fixture identity and grader separation are described accurately. | Supported with stated limit | The generator identifies the fixture with `git rev-parse HEAD^{tree}`, so the report correctly calls the 40-character value a Git tree object ID (SHA-1), not SHA-256. The task prompt and fixture root omit the oracle; the report now explicitly says there is no OS boundary preventing the native harness from reading the parent repository and scopes the runs as non-adversarial. |
| Changed-path grading covers staged, unstaged, untracked, and committed changes. | Supported after correction | The first grader version missed staged and committed out-of-scope files. The final version compares tracked paths against the frozen seed with NUL-delimited Git output, unions all untracked paths (including ignored paths), and rejects any changed HEAD. I checked the recorded before/after reproductions and the four-case offline regrade, whose result and raw-output hashes match the evidence index. |
| Test and behavior results are independent of the agent's self-report. | Supported | The runner independently invokes `npm.cmd test`, checks test counts and task behavior, checks expected/forbidden exports, compares changed paths, and requires an unchanged fixture commit. Its focused tests reject zero tests, missing counts, malformed Codex output, and failed turns. `node --test scripts/spike-model-eval.test.mjs` passed 12/12 on review, including staged, unstaged, ignored-untracked, committed-out-of-scope, and in-scope-commit cases. |
| Cost and usage are reported without false precision. | Supported | Raw Claude output identifies `costBasis: list`; the report labels these as CLI list estimates, not billing. Codex JSONL provides token totals but no verified model ID or dollar amount, which remain unknown. |
| Harbor's local setup was blocked, while remote or other configurations remain untested. | Supported | At pinned Harbor commit `f6cf2e2e86a102a9d2980ce8888f4bda251aa998`, the [README](https://github.com/harbor-framework/harbor/blob/f6cf2e2e86a102a9d2980ce8888f4bda251aa998/README.md) documents local Docker and a cloud environment example; [`pyproject.toml`](https://github.com/harbor-framework/harbor/blob/f6cf2e2e86a102a9d2980ce8888f4bda251aa998/pyproject.toml) specifies Python >=3.12 and uv >=0.13.5. The promoted evidence records unreachable Docker and stopped Podman endpoints, then an interrupted 883,638,935-byte ticket-local dependency setup before Harbor ran. It does not generalize this to packaged installs or remote environments. |

## Remaining limitation

The native harnesses and grader execute task code on the host without an OS isolation boundary, as the report discloses. The runner trial is explicitly non-adversarial; use a sandbox for hostile task code or secrets.

The recipe in the report uses supported `--work-dir`, `--evidence-dir`, and absolute executable arguments. The earlier excluded contaminated Codex attempt and local Harbor setup failure are retained with explicit classifications; neither is counted as a successful run.

## Verdict

No unsupported or materially overstated research claim remains after the revisions. The decision to use the thin runner for the immediate fixture-based Windows trials is supported. Keep Harbor open for future container/remote needs; Kiro ACP compatibility remains untested.

Reviewed grader source: `scripts/spike-model-eval.mjs` at commit `962a9247aec4aaa8f3129937b28c31569a8a1685`, SHA-256 `92588b2ef6356eeb56b75ddc77f87fd3b73b6b9624d7eb9c38134f561960adea`. The four offline grades are explicitly separated from their earlier execution provenance; the Codex T3 case is identified as a direct native run without a prior runner receipt. Evidence index: [`eval-runner-trial-20261102.json`](eval-runner-trial-20261102.json). Findings report: [`eval-runner-trial-20261102.md`](eval-runner-trial-20261102.md).
