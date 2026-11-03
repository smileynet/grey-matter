# Dispatch and review preflight

Run the read-only packet check from the candidate's registered Git worktree before
acceptance:

```text
node skills/engineering/orchestrate/scripts/preflight-dispatch.mjs --expected-base <recorded-base-sha> <packet.json>
```

The orchestrator supplies `--expected-base` from its recorded dispatch contract. It is a
separate trust input and must not be copied from the worker packet. The helper compares
the packet's base with this expected full SHA before checking Git ancestry. Git only shows
that one commit is an ancestor; it cannot establish which ancestor was the dispatch base.

The packet is JSON with exactly these fields:

```json
{
  "version": 1,
  "root": "<absolute worktree root>",
  "branch": "<checked-out branch name>",
  "base": "<full base commit SHA>",
  "candidate": { "kind": "commit", "sha": "<full candidate HEAD SHA>" },
  "owner": "<assigned worker/session identity>",
  "scope": ["src/", "docs/spec.md"],
  "evidence": [{ "path": "evidence/review.txt", "sha256": "<SHA-256 of exact file bytes>" }]
}
```

For a scoped branch diff, use `"candidate": { "kind": "branch-diff", "head":
"<full candidate HEAD SHA>" }`. Both modes bind the supplied HEAD and compare the
committed `base..HEAD` diff; `commit` names a final candidate, while `branch-diff` makes
the reviewed range explicit. The helper requires the candidate to equal current `HEAD`,
the base to resolve and be an ancestor, and the checkout to be clean. Scope entries are
relative files/directories; every changed path must fall under one. Evidence paths are
relative regular files inside the worktree and their byte hashes must match. Keep evidence
available at the exact candidate when running the check.

Pass output is JSON containing canonical root, branch, base and candidate SHAs, declared
owner, changed paths, and each evidence path/hash/byte length. Invalid input or any
mismatch exits nonzero with an error on stderr. The packet cannot supply commands: Git
calls use fixed argument arrays, and unknown packet fields are rejected.

This check proves only the observed Git root/registration, externally expected base,
branch/base/HEAD relationship, clean committed scope and supplied file hashes at check
time. It does not authenticate the owner string, establish that declared scope is
semantically complete or disjoint, prove evidence is relevant, or prove reviewer
independence from a name. Keep review receipts as the separate check for their declared
source/capture bindings. This helper does not claim or update tickets, modify files, create
a ledger, or replace independent review. Regression fixtures:
`node --test skills/engineering/orchestrate/scripts/preflight-dispatch.test.mjs`.
