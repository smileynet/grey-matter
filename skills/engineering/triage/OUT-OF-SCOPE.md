# Out-of-Scope Knowledge Base

The `.out-of-scope/` directory stores persistent records of **rejected feature requests**. Two purposes:

1. **Institutional memory**: why a feature was rejected, so the reasoning isn't lost when the ticket closes.
2. **Deduplication**: when a new request matches a prior rejection, triage surfaces the previous decision instead of re-litigating it.

It is a committed KB (one file per concept), consistent with how this repo keeps ADRs: a structured markdown file carries machine-readable rationale an agent can match against, which a closed ticket's buried comment thread cannot.

## Directory structure

```
.out-of-scope/
  dark-mode.md
  plugin-system.md
  graphql-api.md
```

One file per **concept**, not per request. Multiple requests for the same thing group under one file.

## File format

Write it like a short design note, not a database row: paragraphs, examples, enough that someone meeting it cold understands the reasoning.

```markdown
# Dark Mode

This project does not support dark mode or user-facing theming.

## Why this is out of scope

The rendering pipeline assumes a single color palette defined in `ThemeConfig`.
Supporting multiple themes would require a theme context across the whole component
tree, per-component theme-aware style resolution, and a persistence layer for user
preferences. That is a significant architectural change that doesn't align with the
project's focus on content authoring; theming is a concern for downstream consumers.

## Prior requests

- tkt 42 / gh #42: "Add dark mode support"
- tkt 87 / gh #87: "Night theme for accessibility"
```

### Naming

Short, descriptive kebab-case for the concept: `dark-mode.md`, `plugin-system.md`. Recognisable enough that browsing the directory tells you what was rejected without opening the file.

### Writing the reason

Substantive, not "we don't want this". Good reasons reference:

- Project scope or philosophy ("this project focuses on X; Y is a downstream concern")
- Technical constraints ("supporting this needs Y, which conflicts with our Z architecture")
- Strategic decisions ("we chose A over B because...")

**Durable, not circumstantial.** Avoid "we're too busy right now": that's a deferral, not a rejection, and it doesn't belong here.

## Reading it during triage: surface-and-confirm

During triage step 1 (gather context), read all `.out-of-scope/*.md`. Matching is by **concept similarity, not keyword**: "night theme" matches `dark-mode.md`.

**The match is a surface, never an auto-close.** Semantic similarity is exactly where an agent over-generalises and silently dismisses a legitimately different request. So when a candidate matches:

1. State the behavioral **delta** between the new request and the stored rejection ("the prior rejection was about X; this asks for Y, which differs in Z").
2. Surface it to the maintainer: "This resembles `.out-of-scope/dark-mode.md`, rejected because [reason]. The difference is [delta]. Still out of scope?"
3. Act only on the maintainer's call:
   - **Confirm**: append the new request to the file's "Prior requests" list, then close as `wontfix`.
   - **Reconsider**: delete or update the file; the request proceeds through normal triage.
   - **Distinguish**: related but distinct; proceed with normal triage.

## Writing it: rejected enhancements only

Write here **only** when an **enhancement** (not a bug) is *rejected* as `wontfix`. Applies to enhancement PRs exactly as to issues: a rejected PR is recorded so the same request doesn't return as fresh code.

Do **not** write here when something closes as `wontfix` because it's **already implemented**. That's a built feature, not a rejected one; recording it would poison the dedup check (a future request for it would match a "rejection" and get wrongly dismissed, when the right answer is "it exists, here's where"). The closing comment points to where the feature already lives.

The flow:

1. Maintainer decides a request is out of scope.
2. Check for a matching `.out-of-scope/` file.
3. If yes: append the request to "Prior requests".
4. If no: create a file with the concept name, the reason, and the first prior request.
5. Comment on the ticket (and the external item, if any) explaining the decision and linking the file, with the AI disclaimer.
6. Close the ticket `wontfix`.

## Updating or removing

If the maintainer changes their mind about a rejected concept, delete the file. The skill does not reopen old tickets; they're historical records. The new request that triggered the reconsideration proceeds through normal triage.
