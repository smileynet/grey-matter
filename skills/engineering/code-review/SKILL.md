---
name: code-review
description: "Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes: Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/spec asked for?). Runs both reviews in parallel sub-agents and files findings as tickets. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to \"review since X\"."
---

Two-axis review of the diff between `HEAD` and a fixed point the user supplies:

- **Standards**: does the code conform to this repo's documented coding standards?
- **Spec**: does the code faithfully implement the originating issue / spec?

Both axes run as **parallel sub-agents** so they don't pollute each other's context, then this skill aggregates their findings and files them as tickets.

## Process

### 1. Pin the fixed point

Whatever the user said is the fixed point (a commit SHA, branch name, tag, `main`, `HEAD~5`, etc.). If they didn't specify one, ask for it.

Capture the diff command once: `git diff <fixed-point>...HEAD` (three-dot, so the comparison is against the merge-base). Also note the list of commits via `git log <fixed-point>..HEAD --oneline`.

Before going further, confirm the fixed point resolves (`git rev-parse <fixed-point>`) and the diff is non-empty. A bad ref or empty diff should fail here, not inside two parallel sub-agents.

### 2. Identify the spec source

Look for the originating spec, in this order:

1. A ticket referenced in the commit messages or by the user: read its body and its `spec` (the spec-slug pointing at a `docs/` doc).
2. A path the user passed as an argument.
3. A spec file under `docs/` matching the branch name or feature.
4. If nothing is found, ask the user where the spec is. If they say there isn't one, the **Spec** sub-agent will skip and report "no spec available".

### 3. Identify the standards sources

Search the repo for every file that documents how code should be written. When `CODING_STANDARDS.md` or `CONTRIBUTING.md` exists, it must be on the list.

On top of whatever the repo documents, the Standards axis carries a **smell baseline**. Pick the rubric by project type: an app/general codebase uses [rubric-app.md](rubric-app.md); a game (engine markers `project.godot`, `*.uproject`) uses [rubric-game.md](rubric-game.md). Load the one that fits and pass it to the Standards sub-agent in full.

### 4. Spawn both sub-agents in parallel

Issue both sub-agent calls together, in the foreground, and aggregate the reports they return.

**Standards sub-agent prompt** should include:

- The full diff command and commit list.
- The list of standards-source files you found in step 3, **plus the chosen rubric from step 3** pasted in full (the sub-agent has no other access to it).
- The brief: "Report, per file/hunk where relevant, (a) every place the diff violates a documented standard: cite the standard (file + the rule); and (b) any baseline smell you spot: name it and quote the hunk. Distinguish hard violations from judgement calls: documented-standard breaches can be hard, but baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip anything tooling enforces. Under 400 words."

**Spec sub-agent prompt** should include:

- The diff command and commit list.
- The path or fetched contents of the spec.
- The brief: "Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Quote the spec line for each finding. Under 400 words."

If the spec is missing, skip the Spec sub-agent and note this in the final report.

### 5. File findings as tickets

Present the two reports under `## Standards` and `## Spec` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings, because the two axes are deliberately separate (see _Why two axes_).

Then file each finding worth acting on as a **ticket** (see the issue-tracker doc for the commands), so the fix is tracked work on the frontier rather than a comment that evaporates. Each ticket carries enough context to understand and address the finding on its own: the axis (Standards or Spec), the file and the quoted hunk, the standard or spec line it breaches, and **clear acceptance criteria** stating what "fixed" means. Tag Standards findings and Spec findings so they stay distinct. A finding the user judges not worth acting on is not filed.

End with a one-line summary: tickets filed per axis, and the worst issue _within each axis_ (if any). Don't pick a single winner across axes: that's the reranking the separation exists to prevent.

## Why two axes

A change can pass one axis and fail the other:

- Code that follows every standard but implements the wrong thing -> **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions -> **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.
