---
name: line-craft
description: Line craft for fiction prose and dialogue — feeling written as acts and errands, then the lines checked against a catalog of sentimental shapes. Use when drafting or revising story prose or dialogue, when the author rejects a line as sentimental, portentous or "emo", or when setting up a project's prose shape check.
---

Lines that obey a voice guide ("never name the emotion", "warmth without sentimentality") can still
read sentimental. The fix is a set of **moves**, practised on every line, with a **shape catalog**
as the backstop. The moves come from prior art (the LucasArts adventures; see
[`references/MOVES.md`](references/MOVES.md)) and are offered as craft, not law: the project's own
voice guide outranks them.

## The moves

Feeling lives in what people **do** and **ask for**, stated plainly:

- **Errand.** At the peak of feeling, the next line is a task, an instruction or a want, with one
  concrete detail. A line that could be the story's moral becomes an errand.
- **Reply or act.** After a line of dialogue comes another speaker's reply or a physical action. The
  narrator reports behaviour; the reader supplies the meaning.
- **Puncture.** When someone reaches for the big statement, the next speaker shrinks it with
  something literal or practical. The warmth is in their paying attention.
- **Literal act.** A change in a person shows as one checkable thing they do now, or no longer do.
  One retained habit, observed once, and the line stops.
- **Hedge.** Sincerity is one short line, hesitant or aimed sideways, and then the scene moves.
- **Literal-first.** A dark or wise line makes plain sense at face value, and a character says it to
  another character in reply. Endings land on an act or a small fact.

Deflation keeps the warmth: a dry narrator's dryness costs them something, or someone sees through it.

## Steps

1. **Find the project's voice and catalog.** Read the voice guide (a constitution, style guide or
   `AGENTS.md` pointer). Look for an existing shape catalog (a JSON file of shapes with `bad`/`clean`
   examples, e.g. `voice-shapes.json`) and the project's own check. Done when you know which voice
   rules apply and which catalog and check you will use; with no catalog, the starter is
   [`references/shapes.json`](references/shapes.json).
2. **Draft with the moves.** Every line of the beat, branch and choice lines included. Done when each
   line of feeling is carried by an errand, a reply, an act or a hedged short line.
3. **Revision pass.**
   - *Literal-reply drill:* for every grand line, write the literal-minded reply a sceptical listener
     would give. Where the reply is truer, replace the grand line with an errand or an act.
   - *Read flat:* a line that needs a gloss after it, or a drumbeat rhythm, to land is replaced by
     its act.
   Done when every grand line has faced the drill.
4. **Check.** Run the project's check if it has one. Otherwise:
   `node <this skill>/scripts/check-shapes.mjs <prose-file> --catalog <catalog.json>`.
   Done when no `fail` shape remains and every `warn` has been looked at (kept only with a reason).
5. **When the author rejects a line, capture it.** Add it to the project's catalog (format:
   [`references/CATALOG.md`](references/CATALOG.md)): the verbatim line as `bad`, the accepted
   rewrite as `clean`, the source, and a pattern only if the shape is mechanical. Then run
   `check-shapes.mjs --self-test --catalog <catalog.json>`. Done when the self-test passes: every
   `bad` trips its own rule and every `clean` trips nothing. With no catalog yet, copy the starter
   into the project and point the voice guide at it.

A surface check catches shapes, not sensibility. The moves are the lever; read the lines aloud.
