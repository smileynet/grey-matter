# Research the repo's PR conventions

Before writing the PR body, learn how this repo's PRs actually read, so yours fits
local norms and dodges known rejection triggers. PR acceptance and review speed track
*fit with the project* (size, description shape, tests, following CONTRIBUTING) more
than raw code quality, and agent PRs are rejected more for verbosity and missing tests
than for topic. Match the norm; keep it small.

Only worth doing when the repo has PR history. On GitHub use `gh`; on GitLab the
`glab mr` equivalents. Read list-level JSON first, open full bodies only for the few
most representative, cap total PRs read around 15-20 to stay cheap.

## Four signals to gather

**1. How accepted PRs are written** (sample the last ~10-15 merged):
```
gh pr list --state merged --limit 15 --json number,title,additions,deletions,changedFiles
gh pr view <n> --json title,body,files,closingIssuesReferences
```
Extract: body structure and length, section headings, whether they show test evidence
or screenshots, how they reference issues (`Fixes #123`), typical diff size.

**2. Code conventions**:
```
gh api repos/{owner}/{repo}/contents/CONTRIBUTING.md --jq .content | base64 -d
gh pr diff <n>
```
Also read `.editorconfig`, linter/formatter config, any STYLE doc. Extract: formatting,
naming, where tests live, commit-message convention.

**3. Recurring review feedback**:
```
gh pr view <n> --json reviews,comments,latestReviews,reviewDecision
gh api repos/{owner}/{repo}/pulls/<n>/comments   # inline comments aren't in `pr view`
```
Extract recurring themes (add a test, split this up, naming, out of scope, needs
changelog), as themes, not by who said them.

**4. Rejected / abandoned PRs** (closed but not merged):
```
gh pr list --state closed --limit 30 --json number,title,mergedAt --jq '.[] | select(.mergedAt==null)'
gh pr view <n> --json title,body,comments,closedAt
```
Look for why they failed: too big, no tests, wrong approach, scope creep, ignored
CONTRIBUTING, superseded.

Sampling: last 10-15 merged (convention) plus 3-5 recent closed-unmerged (rejection);
fully read only the ~5 most representative.

## Guardrails

- A pattern is a norm only if it appears in **3+ PRs**; a single PR is an anecdote.
- Prefer **explicit** sources (CONTRIBUTING, PR template) over inferred norms when they
  conflict. Weight recent PRs; ignore patterns seen only in old merges.
- Don't invent a rule from a formatting coincidence. Attribute feedback to themes, not
  authors.

## Fallback (new / solo / no PR history)

If there are few or no merged PRs, this yields little. Fall back, in order, to the PR
template (`.github/pull_request_template.md`), `CONTRIBUTING.md`, and recent commit
messages (`git log --oneline -20`) for tone, size, and conventions. State the fallback
rather than fabricating norms.
