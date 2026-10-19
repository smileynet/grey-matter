---
id: "19"
title: "Live-test teach against existing projects and related works"
status: backlog
blocked_by: []
priority: low
validation_criteria:
  - "teach run on at least two real topics (one knowledge-heavy, one skill-heavy) producing a real workspace: MISSION, RESOURCES (fetched sources), lessons, learning-records, glossary"
  - "Verified against the four executor fixes: citations resolve to in-session-fetched sources (no citation theater); a learning record is written only after a passed retrieval check; quiz distractors are real misconceptions with randomized position; lessons stay short (no over-production)"
  - "Compared against related works (intelligent tutoring systems, Anki/SRS, Khanmigo-style LLM tutors) to note where teach is weaker (e.g. no real SRS scheduler) and whether that gap matters in practice"
  - "Findings recorded with any SKILL.md / FORMAT adjustments the real runs justify"
tags: ["type:research", "stream:skills-review"]
---

# Live-test teach against existing projects and related works

## What to build

Validate `teach` by actually using it, since its risks (citation theater, false mastery,
over-production, state drift) are executor behaviors that only show under real runs, not in
the authored prose.

### Run it for real

Run teach on at least two real topics with different shapes, one **knowledge-heavy** (e.g.
a concept with primary literature) and one **skill-heavy** (e.g. a procedural/motor or
hands-on skill), each producing a genuine multi-session workspace: `MISSION.md`,
`RESOURCES.md` with real fetched sources, `lessons/*.html`, `learning-records/`,
`GLOSSARY.md`, `assets/`.

### Check the four executor fixes actually hold

- **Retrieval-backed citations**: every lesson claim resolves to a source the agent fetched
  in-session, no fabricated or memory-emitted citations (citation theater).
- **Mastery gated on retrieval**: a learning record appears only after a passed (ideally
  spaced) retrieval check, not on lesson completion or a bare "got it".
- **Quiz integrity**: distractors are attractive real misconceptions; correct-answer
  position is genuinely randomized (no position tell).
- **No over-production**: lessons stay short and within working memory, not bloated HTML.

### Compare to related works

Place teach against intelligent tutoring systems, Anki/SRS, and Khanmigo-style LLM tutors.
Note where it is weaker, especially the **known gap that it has the spirit of spacing but
no real SRS scheduler** (no per-item interval/ease tracking), and judge whether that gap
matters in practice or warrants a follow-up (e.g. a lightweight scheduler in `assets/`).

Record findings and any SKILL.md / FORMAT-file adjustments the real runs justify. Low
priority until there is a real learner/topic to run against.

## Acceptance criteria

- [ ] teach run on at least two real topics (one knowledge-heavy, one skill-heavy) producing a real workspace
- [ ] Verified against the four executor fixes: retrieval-backed citations, mastery-gated-on-retrieval records, misconception-distractor randomized quizzes, short lessons
- [ ] Compared against related works (ITS, Anki/SRS, LLM tutors); the no-SRS-scheduler gap assessed for whether it matters
- [ ] Findings recorded with any SKILL.md / FORMAT adjustments the runs justify
