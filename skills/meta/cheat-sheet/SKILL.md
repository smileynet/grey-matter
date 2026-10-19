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
3. Within a bucket, note each skill's **invocation**: a skill with
   `disable-model-invocation: true` is **user-invoked** (shown `[user]`); otherwise
   **model-invoked** (shown `[model]`).
4. Condense each `description` to **one line**: the lead clause, dropping the trailing
   "Use when..." trigger phrasing. Keep it to roughly a dozen words; don't paste the whole
   description. Use a plain ASCII hyphen ` - ` as the separator between name and
   description, not an em-dash (matches the repo's house style).

## Output

This card is shown to the user **in chat**, so make it visually pleasant to scan in a
terminal, not a flat wall of bullets. It is still markdown (chat renders it), styled for
glanceability.

Style rules:

- **One section per bucket**, most-used first (engineering, then productivity, then meta),
  each with an icon + title + one-line purpose: `## 🛠 engineering - build software`,
  `## 💬 productivity - think & communicate`, `## 🧰 meta - tend the skill set`.
- Within a bucket, **list every skill alphabetically** (don't split into two sub-lists);
  show invocation as a compact trailing tag, `` `[user]` `` or `` `[model]` ``, so the eye
  can still pick out what it can type vs what the agent fires, without fragmenting the list.
- **Bold the skill name**, then ` - ` (ASCII hyphen, house style), then the one-line gist
  (the description's lead clause, trigger phrasing dropped, ~a dozen words).
- Open with a **title + one-line legend**, and a `---` rule under it. Separate buckets with
  a blank line; keep it tight, no empty filler lines between rows.
- Close with a one-line footer: the total count and the per-bucket split.

Shape to produce (illustrative, names/counts come from disk):

```markdown
# 📇 Skills cheat sheet

`[user]` you invoke it by name · `[model]` the agent can also reach it
---

## 🛠 engineering - build software
- **code-review** - two-axis (Standards + Spec) review of a diff, files findings as tickets `[model]`
- **grill-with-docs** - sharpen an idea by interview, leaving a glossary/ADR trail `[user]`
- **tdd** - the red-green test-first feedback loop `[model]`
- ... (every engineering skill, alphabetical)

## 💬 productivity - think & communicate
- **grill-me** - a relentless interview to sharpen a plan or design `[user]`
- **writing-for-agents** - how to write skills, AGENTS.md, and docs agents read `[model]`
- ...

## 🧰 meta - tend the skill set
- **compass** - find which skill or flow fits your situation (the router) `[model]`
- **cheat-sheet** - this card: every skill by category, one line each `[user]`
- ...

---
33 skills · 21 engineering · 7 productivity · 5 meta
```

That markdown is the default in-chat form. If the user wants a keepable/shareable
artifact, offer the full-bodied **HTML** card per `docs/agents/report-format.md`.

## Keep it honest

The card must list exactly the skills that exist on disk, no more, no less, same
staleness invariant `compass` and the bucket READMEs hold. Because it's generated each run,
it can't drift; don't "remember" a skill list from a previous run, re-read the tree.
