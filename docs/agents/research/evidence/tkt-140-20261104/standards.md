# Standards review — ticket #140

Publication copy: ephemeral locators are replaced with the durable
[case report](../../tkt-140-staged-mutation-recheck.md). The original review and
raw fixture evidence remain privately retained; the verdict is unchanged.

**Verdict: PASS.** No actionable documented-standard violations or app-rubric
smells found in the fixed candidate `363005aa69301c55cbed3ba79bf3ac467ecc2370`
(base `c5700c36842598716aa15401e4ba4de94576d62d`). The only committed path is
`docs/agents/research/tkt-140-staged-mutation-recheck.md`.

The report distinguishes the old observed sweep from this installed-build
reproduction, records exact binary identity and output, and separates confirmed
behavior from untested edge cases. Its conclusion is supported by the retained
fixture evidence, not exit code alone: four isolated repositories exercise
`new`, `claim`, `edit`, and normal `close --check-all`; each resulting commit
contains only its ticket path. For each case, I independently hashed the actual
fixture `.git/index` and matched it to the recorded raw-index SHA-256, checked
`git diff --cached --name-only` still lists `unrelated.txt`, verified its actual
file hash matches the recorded staged bytes, and checked `git diff-tree` confirms
the committed file list. The close case does not use force.

The recorded query result contains both tags. The one-argument `new` and `edit`
comma cases each preserve the complete comma-containing criterion as one value;
the report limits that conclusion to those tested forms. I verified the cited
tkt checkout is clean at `ce6683f073467b2d07607abfbf819bcab62fb7f4`, its #235
and #231 tickets are done, and its commit helper uses `git commit --only --`
for the specified paths. Existing #43/#235 cover the latency and deferred-push
history; the report does not pretend a network/hook latency measurement ran.

The structure keeps current observations, historical context and unknowns
separate. No actionable duplication, speculative generality, unclear naming or
other rubric smell is present. This is Standards only, not a judgment that every
#140 acceptance criterion or upstream workflow is closed.

## Evidence and limits

Reviewed the exact report, retained `reproduction.json` (SHA-256
`27f0e45550f1b81861143b60724819edd60b62ae26d356413558925060b86e2e`),
and `reproduce.mjs`. Fixture folders remain privately retained in the assigned
worktree; no reproduction or mutation command was rerun.
Read-only source/ticket inspection confirmed the upstream references above.
I did not access external services, change source, Git or tracker state, or
verify future platform versions. The installed Windows binary is the observed
scope.
