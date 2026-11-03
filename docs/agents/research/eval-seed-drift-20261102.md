# Evaluation fixture drift and repair

Preflight for #167 and an independent critic reproduced a seed mismatch before
any new model calls. The current general fixture generator produced Git tree
`d1ae7bc7028f238f8207b2eec31f9d0ba5e1f40e`; the demonstrated #174 fixture was
`c474646ea61e037fcdbc1be3d2dc6c0833f5e260`. Both are SHA-1 Git object IDs.

Comparing committed seed files identified exactly one difference: the embedded
`docs/status.html`. Its older 45,998 bytes had changed to 49,281 bytes after
dashboard maintenance. AGENTS.md matched; the initial suspicion of tkt-generated
guidance drift was rejected. Model-modified working files were excluded from
this seed comparison.

The evaluation runner now restores the original dashboard snapshot before
checking the entire seed tree. The pinned asset is
`scripts/fixtures/model-eval/seed-status.html`, SHA-256
`f2c67d3e24d057be82d19c70b95ce1eaa6fd9afaf28bd7501e86d4a82474a12f`.
It was exported as raw Git blob bytes from the retained #174 seed, then verified
after copying. The general orchestration generator still uses the current
dashboard by default. Other seed drift continues to fail before model invocation.

`node --test scripts/spike-model-eval.test.mjs` passed 13/13 assertions in
3.52 seconds on this Windows host. The new integration case launches Node as a
harmless stand-in for Claude: it restores the expected seed, reaches native
invocation, and correctly reports `agent-process-failure` because Node rejects
Claude arguments. This is fixture/setup evidence, not a new model execution.
The same case adds an unrelated seed file and verifies rejection. No model calls,
credentials, global settings or billing changes were involved.

The repaired runner SHA-256 is
`f6a5a3bbf6e9456af40f60cdd08ffaafcf86cc184cc3607134c520ca11f01dbc`.
Historical native execution and later grader hashes in the
[trial report](eval-runner-trial-20261102.md) remain unchanged. New receipts record
both the generator's tree and the frozen evaluation tree; future runs must record
their own source identity rather than borrowing the historical proof.

Keep the 45,998-byte snapshot in ordinary Git as a frozen benchmark input. Test
temporary directories are removed by the existing test lifecycle. The retained
#174 fixture roots and raw logs remain private through follow-up validation;
this repair creates no additional model history.
