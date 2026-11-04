# Independent Spec review: #141

## Expectations

See `t141-spec-risks.md`, written from the ticket before evaluating its behavior.

## Verdict: PASS

The frozen staged candidate adds `git diff --cached HEAD` for index-to-HEAD,
`git diff` for unstaged tracked changes, an all-tracked-uncommitted mode, and
commit ranges. It requires a nonempty selected diff and records repository,
mode, HEAD and range identities. It names untracked-file coverage separately,
freezes one patch for both reviewers, distinguishes index content from working
content and compares the captured inputs again before acceptance. This addresses
the first criterion, including the case where staged and unstaged versions of a
file differ.

Step 5 conditions its direct ticket-mutation path on documented and verified
ticket-only commit isolation, then requires checking the resulting commit and
remaining index. When isolation is unknown, it directs filing through a clean
board checkout with explicit source-state references. It preserves the staged
review bytes and returns filing to the authorized parent. This gives a concrete
safe route while #140's environment-specific behavior is established.

This independent review itself consumed the frozen staged diff and index-side
source packet, exercising the new target selection for an actual staged review.
The ticket filing branch had no actionable finding to file, so its mutation
procedure was not invoked. Parent must finish input revalidation and combine this
axis with the separate Standards review before deciding whether all three ticket
criteria are met.

No Spec finding or scope expansion. This judgment covers the fixed packet and
ticket wording; it does not authenticate the reviewer or prove behavior for other
Git states beyond the described commands.
