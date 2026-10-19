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
3. Determine each skill's **invocation tier** from the literal frontmatter: the line
   `disable-model-invocation: true` present means **User only**; its **absence** means
   **User or agent** (model-invoked, which the human can still type). A third tier,
   **Agent only**, has no flag in our convention and is normally empty. Read the flag
   literally, don't guess from the skill's name or purpose (e.g. `compass` has no
   `disable-model-invocation` line, so it is **User or agent**).
4. Condense each `description` to **one line**: the lead clause, dropping the trailing
   "Use when..." trigger phrasing. Keep it to roughly a dozen words; don't paste the whole
   description. Use a plain ASCII hyphen ` - ` as the separator between name and
   description, not an em-dash (matches the repo's house style).

## Output

This card is shown to the user **in chat**, so make it visually pleasant to scan in a
terminal, not a flat wall of bullets. It is still markdown (chat renders it), styled for
glanceability.

Invocation has three possible tiers; **subgroup each bucket by tier** (it reads far better
than one mixed list):

- **User only** - `disable-model-invocation: true`: only the human, by name.
- **User or agent** - model-invoked (the default; no `disable-model-invocation`): the human
  can type it *and* the agent can reach it on its own.
- **Agent only** - a skill hidden from the human. Our convention has no flag for this, so
  this tier is normally **empty**, omit the subheading entirely when a tier has no skills.
  (Keep the tier in the skill's logic so it appears automatically if that ever changes.)

Style rules:

- **One section per bucket**, most-used first (engineering, then productivity, then meta),
  each with an icon + title + one-line purpose: `## 🛠 engineering - build software`,
  `## 💬 productivity - think & communicate`, `## 🧰 meta - tend the skill set`.
- **Within a bucket, subgroup by the three tiers** under a small bold label
  (`**User only**`, `**User or agent**`, `**Agent only**`), omitting any empty tier. List
  skills **alphabetically** within each tier.
- **Bold the skill name**, then ` - ` (ASCII hyphen, house style), then the one-line gist
  (the description's lead clause, trigger phrasing dropped, ~a dozen words). No per-row
  tag, the subgroup heading already says the tier.
- Open with a **title + one-line legend**, and a `---` rule under it. One blank line
  between buckets and between subgroups; no empty filler rows.
- Close with a one-line footer: the total and the per-bucket split.

Shape to produce (illustrative, names/counts come from disk):

```markdown
# 📇 Skills cheat sheet

Grouped by who can invoke each skill. `User only` = you, by name · `User or agent` = you or the agent.
---

## 🛠 engineering - build software

**User only**
- **grill-with-docs** - sharpen an idea by interview, leaving a glossary/ADR trail
- **implement** - implement a piece of work from a spec or set of tickets
- ... (alphabetical)

**User or agent**
- **code-review** - two-axis (Standards + Spec) review of a diff, files findings as tickets
- **tdd** - the red-green test-first feedback loop
- ...

## 💬 productivity - think & communicate

**User only**
- **grill-me** - a relentless interview to sharpen a plan or design
- ...

**User or agent**
- **grilling** - grill the user relentlessly to stress-test their thinking
- ...

## 🧰 meta - tend the skill set

**User only**
- **cheat-sheet** - this card: every skill by category, one line each
- ...

**User or agent**
- **compass** - find which skill or flow fits your situation (the router)

---
33 skills · 21 engineering · 7 productivity · 5 meta
```

That markdown is the default in-chat form. If the user wants a keepable/shareable
artifact, offer the full-bodied **HTML** card per `docs/agents/report-format.md`.

## Keep it honest

The card must list exactly the skills that exist on disk, no more, no less, same
staleness invariant `compass` and the bucket READMEs hold. Because it's generated each run,
it can't drift; don't "remember" a skill list from a previous run, re-read the tree.
