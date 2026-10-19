---
name: cheat-sheet
description: "List every skill in this set by category with a one-line description. Use when the user wants a quick reference card of available skills, asks \"what skills are there\", or \"list all commands\"."
disable-model-invocation: true
---

# Cheat Sheet

Print a flat reference card of every skill in this set, grouped by category, one line each.
This is the quick glance: "show me everything available." (For "which skill fits my
situation", the flows and on-ramps, that's `compass`; this is the index, compass is the
map.)

## How to build it

**Generate it live from the skills on disk, never from a hardcoded list** (a frozen copy
rots the moment a skill is added or renamed). Each skill is `skills/<bucket>/<name>/SKILL.md`
with YAML frontmatter carrying `name` and `description`.

1. List the buckets under `skills/` (currently `engineering`, `productivity`, `meta`).
2. For each bucket, read every `<name>/SKILL.md`'s frontmatter: take `name` and
   `description`.
3. Within a bucket, split by **invocation**: a skill with `disable-model-invocation: true`
   is **user-invoked**; otherwise **model-invoked**. (This mirrors the bucket READMEs.)
4. Condense each `description` to **one line**: the lead clause, dropping the trailing
   "Use when..." trigger phrasing. Keep it to roughly a dozen words; don't paste the whole
   description.

## Output

A cheat sheet, grouped by bucket then invocation, most-used buckets first
(engineering, productivity, meta). Lead with a one-line legend. For example:

```markdown
# Skills cheat sheet

Buckets: engineering (build) · productivity (think/communicate) · meta (maintain the set).
`user` = you invoke it by name; `model` = the agent can also reach it.

## engineering

### user-invoked
- **grill-with-docs** - sharpen an idea by interview, in a repo, leaving a glossary/ADR trail
- **to-spec** - synthesise a grilled thread into a spec
- ...

### model-invoked
- **tdd** - the red-green agent feedback loop
- **code-review** - two-axis (Standards + Spec) review of a diff, files findings as tickets
- ...

## productivity
...

## meta
...
```

Render as a **markdown** card by default (the quick skim, per `docs/agents/report-format.md`).
If the user asks for something richer to keep or share, offer the full-bodied **HTML**
form per that convention.

## Keep it honest

The card must list exactly the skills that exist on disk, no more, no less, same
staleness invariant `compass` and the bucket READMEs hold. Because it's generated each run,
it can't drift; don't "remember" a skill list from a previous run, re-read the tree.
