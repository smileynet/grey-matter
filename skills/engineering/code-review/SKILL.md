---
name: code-review
description: "Review a commit range, staged changes or working-tree changes along two axes: Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/spec asked for?). Runs both reviews in parallel sub-agents and files findings as tickets. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to \"review since X\"."
---

Two-axis review of the user's selected commit range, index or working tree:

- **Standards**: does the code conform to this repo's documented coding standards?
- **Spec**: does the code faithfully implement the originating issue / spec?

Both axes run as **parallel sub-agents** so they don't pollute each other's context, then this skill aggregates their findings and files them as tickets.

## Process

### 1. Pin the review target

For repeated review of revised candidates, apply the
[shared critic round budget and reassessment](../retro/references/convergence.md#critic-review-budget).

For UX, layout, style, or visual changes, use the
[browser and visual evidence workflow](references/visual-critics.md). Bind the
critic's Playwright or native browser lane and image access to the review packet.

Resolve an explicit request for staged or uncommitted work from these modes. Ask
only when the requested target is ambiguous (for example, both staged and unstaged
changes exist and the user did not select which).

| Target | Diff command | Compared states |
|---|---|---|
| Commit range | `git diff --no-ext-diff --no-textconv <fixed-point>...HEAD` | Merge-base to HEAD; resolve both refs to full SHAs first. |
| Staged | `git diff --no-ext-diff --no-textconv --cached HEAD` | HEAD to index. |
| Working tree | `git diff --no-ext-diff --no-textconv` | Index to tracked working files; staged changes are excluded. |
| All tracked uncommitted | `git diff --no-ext-diff --no-textconv HEAD` | HEAD to tracked working files, including staged changes. |

Record the repository root, mode, full HEAD SHA, resolved range endpoints when
applicable and path exclusions. Validate refs and a nonempty selected diff before
dispatch. For a range, also record `git log <fixed-point>..HEAD --oneline`.
List untracked paths separately with `git ls-files --others --exclude-standard`:
these commands omit them. Include requested untracked files explicitly in the
review packet without staging them, or state the coverage limit.

Capture the selected binary-capable patch (`--binary --full-index`) and the
relevant file contents in project scratch once, then give both reviewers that
same frozen packet. Keep private contents within the project's access boundary.
Read staged contents from the index (`git show :path`), range contents from the
resolved commits and working-tree contents from disk; a file can have different
staged and unstaged versions. Include the matching comparison-side contents.
Bind it to the source states and file hashes; do not make a commit just to review
uncommitted work. Before accepting the reports, recapture the selected diff and
compare its bytes and included file hashes. Changed reviewed inputs require a
new review of the affected scope; unrelated edits do not expand the target.

### 2. Identify the spec source

Look for the originating spec, in this order:

1. A ticket referenced in the commit messages or by the user: read its body and its `spec` (the spec-slug pointing at a `docs/` doc).
2. A path the user passed as an argument.
3. A spec file under `docs/` matching the branch name or feature.
4. If nothing is found, ask the user where the spec is. If they say there isn't one, the **Spec** sub-agent will skip and report "no spec available".

### 3. Identify the standards sources

Search the repo for every file that documents how code should be written. When `CODING_STANDARDS.md` or `CONTRIBUTING.md` exists, it must be on the list.

On top of whatever the repo documents, the Standards axis carries a **smell baseline**. Pick the rubric by project type: an app/general codebase uses [references/rubric-app.md](references/rubric-app.md); a game (engine markers `project.godot`, `*.uproject`) uses [references/rubric-game.md](references/rubric-game.md). Load the one that fits and pass it to the Standards sub-agent in full. The baseline is the one load-bearing reference here: open the rubric file and read it. If it genuinely can't be reached, say so and run the Standards axis against the repo's documented standards alone (a thinner review, not a blocked one), rather than inventing a baseline from memory.

When the diff adds or changes a type, enum or schema in app or service code, also pass the `data-modeling` skill's [review lens](../data-modeling/references/review-lens.md) and [language patterns](../data-modeling/references/patterns.md) to the Standards sub-agent in full.

### 4. Spawn both sub-agents in parallel

Issue both sub-agent calls together, in the foreground, and aggregate the reports they return.

**Standards sub-agent prompt** should include:

- The pinned target mode, captured diff command/packet and commit list when applicable.
- The list of standards-source files you found in step 3, **plus the chosen rubric from step 3** pasted in full (the sub-agent has no other access to it).
- The brief: "Report, per file/hunk where relevant, (a) every place the diff violates a documented standard: cite the standard (file + the rule); and (b) any baseline smell you spot: name it and quote the hunk. Distinguish hard violations from judgement calls: documented-standard breaches can be hard, but baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip anything tooling enforces. Under 400 words."

**Spec sub-agent prompt** should include:

- The pinned target mode, captured diff command/packet and commit list when applicable.
- The path or fetched contents of the spec.
- Any tickets the diff closes (their acceptance criteria and resolution), so closures are checked too.
- The brief: "Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong; (d) any closed ticket whose acceptance criteria the diff doesn't actually meet. Quote the spec line or AC for each finding. Under 400 words."

If the spec is missing, skip the Spec sub-agent and note this in the final report.

For a high-stakes diff, an optional **cross-family second opinion** runs the Standards brief through a different model family's CLI: [references/cross-family.md](references/cross-family.md).

### 5. File findings as tickets

Before recommending a fix, confirm the finding on the pinned candidate. Record
the trigger, observed result, expected result, and effect. Keep hypotheses and
observations separate when reproduction is unavailable. For external behavior
or uncertain remedies, consult current primary sources and version-matched
upstream guidance, including recommended mitigations. Check that the remedy
fits the project's constraints. Propose the smallest supported repair or
temporary mitigation and name its verification. If the choice still depends
on an unobserved behavior, propose a [bounded follow-on spike](../prototype/references/technical-spikes.md)
with the deciding question, observation, budget, and stop condition.

Protect the review target before running a ticket mutation. Inspect the installed
tracker's documented commit behavior and verify its ticket-only commit isolation
in a disposable repository when that behavior is unknown. With verified isolation,
leave unrelated staged work in place and inspect the resulting ticket commit and
index afterward. Otherwise file through a clean separate checkout of the same
board, using the frozen review packet and explicit source-state references. Keep
the review checkout's staged/unstaged bytes intact; do not commit or unstage the
implementation merely to file findings. A read-only critic returns proposed
findings to the authorized parent for filing. Rerun step 1's input comparison
before the final verdict, since a tracker mutation may advance HEAD.

Present the two reports under `## Standards` and `## Spec` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings, because the two axes are deliberately separate (see _Why two axes_).

Then file each finding worth acting on as a **ticket** (see the issue-tracker doc for the commands), so the fix is tracked work on the frontier rather than a comment that evaporates. Each ticket carries enough context to understand and address the finding on its own: the axis (Standards or Spec), the file and the quoted hunk, the standard or spec line it breaches, and **clear acceptance criteria** stating what "fixed" means. Findings are a reviewer's **hypotheses**, so the first criterion is always: reproduce the finding and mark it confirmed, rejected, or obsolete with evidence before changing code (reject a false positive instead of "fixing" it). Tag Standards findings and Spec findings so they stay distinct. **Before filing, check existing tickets for overlap** (`tkt query`): when a finding matches or extends an open ticket, update that one rather than filing a near-duplicate. A finding the user judges not worth acting on is not filed.

End with a one-line summary: tickets filed per axis, and the worst issue _within each axis_ (if any). Don't pick a single winner across axes: that's the reranking the separation exists to prevent.

## Why two axes

A change can pass one axis and fail the other:

- Code that follows every standard but implements the wrong thing -> **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions -> **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.
