# Learning Record Format

Learning records live in `./learning-records/` and use sequential numbering: `0001-slug.md`, `0002-slug.md`, etc. Create the directory lazily: only when the first record is written.

They are the teaching equivalent of ADRs (the same append-only, supersede-not-delete discipline as `docs/adr/`): they capture non-obvious lessons, key insights, and stated prior knowledge that steer future sessions. They set the **demonstrated floor** the zone of proximal development is measured from, so their accuracy is load-bearing: a record claiming the user knows something they don't inflates the floor and misaims every later lesson.

## Template

```md
# {Short title of what was learned or established}

{1-3 sentences: what was learned (or what prior knowledge was established), and why it matters for future sessions.}
```

That is the whole format. A learning record can be a single paragraph. The value is recording _that_ this is now known and _why_ it changes what to teach next, not in filling out sections.

## Optional sections

Only include these when they add genuine value. Most records won't need them.

- **Status** frontmatter (`active | superseded by LR-NNNN`): useful when an earlier understanding turns out to be wrong and is replaced.
- **Evidence**: how the user demonstrated the understanding. For a "learned" record this is **the retrieval check they passed** (see below), not merely that a lesson was completed. Record it whenever the claim might be revisited.
- **Implications**: what this unlocks or rules out for future sessions. Worth recording when non-obvious.

## Numbering

Scan `./learning-records/` for the highest existing number and increment by one.

## When to write a learning record

Write one when any of these is true:

1. **The user demonstrated mastery through retrieval**: not that a lesson was covered or the user said "got it", but that they **recalled or applied the concept correctly in a retrieval check**, ideally spaced from first exposure. Coverage is not learning; completion is not learning; a passed retrieval is. This is the record that raises the floor for what to teach next, so gate it on real evidence (this is the mastery-learning rule from SKILL.md). Note the evidence.
2. **The user disclosed prior knowledge**: "I already know X." Record it, and the _depth_ claimed, so future sessions don't re-teach it. (Treat a bare claim as weaker evidence than a passed retrieval; probe it before building high on it.)
3. **A misconception was corrected**: the user previously believed something wrong and now sees why. High-value: these predict future stumbling blocks for related topics.
4. **The mission shifted in response to learning**: the user discovered they cared about something different. Cross-link to [[MISSION.md]] and update it.

### What does _not_ qualify

- Material that was merely covered, or a lesson merely completed. Coverage and completion are not learning; wait for demonstrated retrieval.
- Anything already captured tersely in [[GLOSSARY.md]] as a term definition. Don't duplicate.
- Session-by-session activity logs. Learning records are decision-grade insights, not a journal.

## Supersession

When a later record contradicts an earlier one (understanding deepened or corrected), mark the old record `Status: superseded by LR-NNNN` rather than deleting it. The history of how understanding evolved is itself useful signal.
