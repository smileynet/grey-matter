# Staged review target qualification — 2026-11-04

The code-review skill now distinguishes commit ranges, staged changes, tracked
working-tree changes and all tracked uncommitted changes. It validates a nonempty
target before dispatch, reads the correct Git state, declares untracked coverage
and compares the frozen review inputs again before accepting results.

## End-to-end staged review

The parent staged only `skills/engineering/code-review/SKILL.md` at HEAD
`c5700c36842598716aa15401e4ba4de94576d62d`. It captured the binary/full-index
staged patch and source once; two independent critics consumed that same packet.
Patch SHA256: `519b419e7609d6dcf90210caf77307897ffa7a5428b894dab48b4c5e61a64e01`.
Source SHA256: `113c1151e07469c78f53b02f3c828385cec077afccadfce20a2a0e2e63912c2e`.

- [Standards](evidence/staged-review-20261104/standards.md): PASS, no actionable findings.
- [Spec](evidence/staged-review-20261104/spec.md): PASS, no actionable findings.

The axes used separate contexts sequentially under the four-agent capacity while
two implementation workers were active; this does not demonstrate simultaneous
dispatch. No finding needed filing, so that mutation branch was not exercised by
this review. The skill requires verified tracker commit isolation or a clean
separate board checkout before filing, preserving the implementation index.
Ticket #140 independently qualifies the installed tracker behavior.

After that qualification, the parent left this reviewed implementation staged
while closing #140 normally. Actual closure commit
`c2f9da0c5b20ba0cee1e348b50036a7eacbaa9ff` contains only #140's ticket and
the authored plan. Fresh before/after comparisons confirmed the reviewed patch
and staged source hashes above remained unchanged. This exercises a real
tracker mutation beside the staged review target; it does not manufacture a
review finding or claim a ticket-creation path was exercised by this review.

After both reviews, a fresh `git diff --no-ext-diff --no-textconv --cached
--binary --full-index HEAD -- skills/engineering/code-review/SKILL.md` and
`git show :skills/engineering/code-review/SKILL.md` matched the reviewed hashes;
the working file matched too. Parent command output classified PASS. Untracked
files were excluded explicitly; there was no requested untracked source.

`node --test scripts/skill-syntax.test.mjs`: PASS, 10 tests, zero failures/skips.
The explicit pre-merge syntax-fixture stage also passed. Final integrated gates
are recorded at closure; these runs alone do not establish publication/deployment.

The frozen packet, capture/verification scripts and raw reviews remain parent-owned
through integration and closure evidence promotion. No historical/private evidence
was released by this documentation change.
