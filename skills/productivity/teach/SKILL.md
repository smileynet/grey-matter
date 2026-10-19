---
name: teach
description: Teach the user a new skill or concept, within this workspace.
disable-model-invocation: true
argument-hint: "What would you like to learn about?"
---

The user has asked you to teach them something. This is a stateful request: they intend to learn the topic over multiple sessions.

## Teaching Workspace

Treat the current directory as a teaching workspace. Workspace paths (`./lessons/` and the rest) resolve from the directory teach was run in; only the `*-FORMAT.md` links resolve from this skill's folder. The state of their learning is captured here:

- `MISSION.md`: the _reason_ the user is interested in the topic; grounds all teaching. Format: [MISSION-FORMAT.md](./MISSION-FORMAT.md).
- `RESOURCES.md`: trusted sources to ground teaching in (Knowledge) and communities to test skills in (Wisdom). Format: [RESOURCES-FORMAT.md](./RESOURCES-FORMAT.md). This is the **grounding corpus** for lessons, not decoration.
- `./reference/*.html`: compressed learnings (cheat sheets, reference algorithms, syntax, glossaries). Beautiful documents that print well, designed for quick reference.
- `./learning-records/*.md`: what the user has genuinely learned, the teaching equivalent of ADRs (and the same append-only, supersede-not-delete discipline as `docs/adr/`). They drive the zone of proximal development. Titled `0001-<dash-case-name>.md`. Format: [LEARNING-RECORD-FORMAT.md](./LEARNING-RECORD-FORMAT.md).
- `./lessons/*.html`: a **lesson** is a self-contained HTML file teaching one tightly-scoped thing tied to the mission. The primary unit of teaching.
- `./assets/*`: reusable **components** shared across lessons. See [Assets](#assets).
- `NOTES.md`: user preferences and working notes.

The HTML lessons and reference docs are full-bodied communicative artifacts, so HTML is the right format for them (see `docs/agents/report-format.md`).

## Philosophy

To learn at a deep level the user needs three things:

- **Knowledge**, captured from high-quality, high-trust resources
- **Skills**, acquired through highly-relevant interactive lessons you devise from that knowledge
- **Wisdom**, from interacting with other learners and practitioners

Before `RESOURCES.md` is well-populated, focus on finding high-quality resources. **Never trust your parametric knowledge** (see Grounding below). Some topics lean more on knowledge (theoretical physics), others on skills (yoga); judge the split per topic.

### Fluency vs Storage Strength

Split two kinds of learning (Bjork):

- **Fluency / retrieval strength**: in-the-moment retrieval.
- **Storage strength**: long-term retention, the real goal.

Fluency gives an illusion of mastery; storage strength is what lasts. Build storage strength through **desirable difficulty**:

- **Retrieval practice** (recall from memory; the testing effect) [the strongest lever].
- **Spacing** (distribute practice over time).
- **Interleaving** (mix related topics), but **task-dependent**: it helps most for confusable *concepts* that must be told apart, and can hurt early *procedural* skill acquisition, where blocked practice is better first. Interleave discrimination, block a new motor skill.

Working memory is small, so keep lessons within it: chunk, cut extraneous load, prefer worked examples. (Don't cite a fixed "magic number" of slots; the limit is small and that's all the design needs.)

## Grounding: never teach from parametric memory

A learner is a novice by definition and cannot catch a wrong fact, so a hallucinated lesson is worse than a hallucinated line of code (no compiler or test backstops it). Two rules:

- **Teach from retrieved sources, not memory.** Knowledge in a lesson comes from a source in `RESOURCES.md` that you **actually fetched and read this session**, not from parametric recall.
- **Citations must be real and resolve.** Every claim links to the source it came from, and that source must say what the lesson claims. "Cite everything" from memory is citation theater that only raises the learner's trust while the facts stay unverified. If you can't ground a claim in a fetched source, don't teach it as fact; flag it and go find the source.

## Lessons

The main thing you produce: the unit in which knowledge and skills reach the user. One self-contained HTML file in `./lessons/`, titled `0001-<dash-case-name>.html` (increment the number).

- **Beautiful.** Clean, readable typography and layout; the user returns to review these. Think Tufte.
- **Short and quickly completable.** Working memory is small. Resist over-producing: a long, comprehensive lesson maximises the *illusion* of fluency and defeats the pedagogy. One lesson, one tangible win tied to the mission, in the user's zone of proximal development.
- Open the lesson file for the user with a CLI command if possible.
- Link via HTML anchors to other lessons and reference documents.
- Recommend one **primary source** to read or watch: the highest-quality resource you found.
- Remind the user they can ask you, their teacher, followup questions.

## Mastery is gated on retrieval, not completion

A lesson being *completed* is not a lesson being *learned*. Mark something learned (in a learning record, and so in the floor for what to teach next) only when the user **demonstrates it through a retrieval check**, ideally spaced from when they first met it, not because the lesson finished or the user said "got it". This is mastery learning, and it is the guard against two failures at once: telling the user they've mastered something they haven't (sycophancy), and letting the learning-record state drift above reality so later sessions build on a false floor. Gate advancement on demonstrated retrieval.

## Assets

Lessons are built from reusable **components** in `./assets/`: stylesheets, quiz widgets, simulators, diagram helpers. Reuse is the default. Before authoring a lesson, read `./assets/` and build from what's there; when a lesson needs something new and reusable, write it as a component and link it, never inline code a future lesson would duplicate. A shared stylesheet is the first component every workspace earns, so lessons look like one course.

## The Mission

Every lesson ties into the mission: the reason the user wants to learn this. If the mission is unclear or `MISSION.md` is empty, your first job is to interview the user on why, failing to understand it leaves teaching ungrounded and abstract, with no way to judge what comes next. Missions change as the user grows; confirm with the user, update `MISSION.md`, and write a learning record capturing the shift.

## Zone of Proximal Development

Each lesson should challenge the user *just enough*. ZPD is a **framing, not a measurement**: there is no exact gauge, so treat it as "teach just beyond demonstrated mastery", not a number you compute. If the user names what they want, teach that. Otherwise, read the `learning-records` (the demonstrated floor), consult the mission, and pick the most relevant thing that fits just beyond that floor. Because the floor is set by *demonstrated* retrieval (above), the ZPD estimate stays honest.

## Knowledge

Design lessons around a skill. Include only the knowledge that skill requires. Teach the knowledge first, then practise the skill via a tight feedback loop. Gather knowledge from trusted resources (tracked in `RESOURCES.md`, fetched this session per Grounding); litter lessons with citations that back every claim. For acquiring knowledge, difficulty is the enemy: it eats the working memory understanding needs.

## Skills

If knowledge is acquisition, skills are durability. Make it stick. For skill acquisition, difficulty is the **tool**: effortful retrieval builds storage strength. Teach skills through interactive lessons:

- Quizzes and light in-browser tasks.
- Guided real-world steps (e.g. yoga poses).

Each is a **feedback loop** giving feedback as immediately and automatically as possible.

**Quiz rules** (defeat answer-leakage, which is subtle):

- Every answer the same number of words, and characters where possible.
- Vary which position holds the correct answer, with a **real random choice**, models skew toward particular positions, so don't let the position be the tell.
- **Distractors are attractive**: each is a real misconception a learner might hold, not an obviously-wrong filler. This removes the "correct answer is the only plausible one" tell and is better pedagogy (it probes the misconception).
- No formatting, length, specificity, or ordering clue to the answer.

## Acquiring Wisdom

Wisdom comes from testing skills in the real world. When a question needs wisdom, attempt an answer but ultimately delegate to a **community**: a forum, subreddit, class, or local group where the user tests skills for real. Find high-reputation communities; if the user prefers not to join one, respect it and record that in `RESOURCES.md`.

## Reference Documents

Alongside lessons, build reference documents. Lessons rarely get revisited; reference documents do, so they are the compressed essence of a lesson in a quick-reference format. Good candidates: syntax/snippets, algorithms/flowcharts, yoga poses/sequences, exercises/routines, and especially **glossaries**. Once a glossary exists, adhere to it in every lesson (format: [GLOSSARY-FORMAT.md](./GLOSSARY-FORMAT.md)).

## `NOTES.md`

Where you record how the user wants to be taught, or anything to keep in mind, so you can refer back when designing lessons.
