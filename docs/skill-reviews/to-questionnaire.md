# to-questionnaire

- Bucket: productivity. Invocation: user-invoked.
- Verdict: **adapt** (near-keep): one anti-padding guard, nothing else.

## What it is

Turns a decision the user can't answer alone into a Markdown questionnaire for the one
person who can. **Grill the send, not the subject**: interview the user only about who
it goes to and what they need back, then aim questions at the knowledge gap. Three
steps with completion criteria, an embedded discovery-questionnaire template, writes
one file to CWD.

## What it does for the user

Gets usable answers from a knowledgeable third party in one async pass, by producing a
well-framed, bounded discovery questionnaire the user can hand off.

## Prior art (agent-filtered)

Research (Dillman Tailored Design, Pew/GOV.UK question-wording, knowledge-elicitation /
expert-interview literature, async response-rate studies) found the skill well-grounded
and self-contained:

- **One-idea-per-question, clear wording, themed grouping, most-important-first**:
  textbook survey hygiene. Strong.
- **"Grill the send, not the subject"**: the skill's coinage, but the move (interview
  the party who holds answerable info about *needs*, target questions at the gap)
  mirrors the gathering-vs-elicitation distinction in requirements engineering. Sound.
- **Open-for-understanding / specific-for-fact + "why this matters" + answer stub**:
  matches expert-elicitation best practice; "why this matters" motivates considered
  answers. Strong. (Recent research describes AI-interview-agents using "structured
  elicitation lenses", validating the agent-authored-questionnaire pattern.)
- **Async one-pass design** (deadline, effort, permission to say "I don't know"/partial,
  most-important-first): well-supported; skip-permission is the strongest finding
  (requiring answers roughly quadrupled dropout).

## Decision

**Adapt (barely).** One change:

- **Anti-padding guard**: "ask the fewest questions that cover step 2, merge
  overlapping ones, don't inflate a single need into many sub-questions." The skill
  already bounds *coverage* (to the step-2 needs, unlike to-spec's deliberate "be
  extensive"), but nothing bounded *count*, and an LLM over-generates. The length-burden
  evidence (long questionnaires get abandoned) makes this worth one clause. In-direction:
  it completes the skill's own bounding intent, the opposite of to-spec because the
  intent points the opposite way.

Not changed: grill-the-send, the three steps, the embedded template, "why this matters",
skip-permission. **Output stays in CWD** (not `.scratch/`): it is a deliverable the user
hands to a person, not throwaway agent working state.

## Cross-skill dependencies

None. Self-contained, no tracker, harness, or sibling coupling. The inverse of
`grill-me`: instead of interviewing the user about the subject, it interviews them about
the send and aims questions at the gap.

## Web-app bias

None. Domain-neutral: works for a game design question as readily as a web one. No lens.
