# wait-what

- Bucket: productivity. Invocation: user-invoked (`disable-model-invocation: true`).
- Verdict: **adapt**: keep it tiny; force the context-addition; inline the STE behaviors
  instead of citing the standard.

## What it is

The shortest skill in the set: a one-sentence, user-invoked mid-conversation corrective
fired inside any other skill when the agent's last message didn't land. It makes the agent
re-explain, with context, in controlled language, using the project's `GLOSSARY.md`
vocabulary.

## What it does for the user

Repairs a breakdown in understanding on the spot without derailing the current skill:
the user says "that didn't land", the agent re-grounds and re-pitches.

## Prior art (agent-filtered)

A clean composite of real practice: **conversational repair** (Schegloff et al., the
hearer signals a breakdown and the speaker reformulates, the exact move), **grounding**
(Clark & Brennan, re-establishing common ground, which the GLOSSARY anchor literally does),
and **ubiquitous language** (Evans/DDD, re-pitching in the canonical vocabulary keeps it
precise, not vaguely simpler). Best agent framing: repair + grounding + ubiquitous
language, which is what makes it more than "say it again, simpler".

**ASD-STE100** (the Simplified Technical English the upstream skill cites) is real and
accurately described, but an over-specified proxy here: it was built for written
safety-critical procedures, its ~900-word lexicon would strip the domain terms a
re-explanation needs, and for an agent its **compliance is unverifiable** (no 900-word
checker in context), so naming it invites a false claim of adherence. Its sub-principles
(short sentences, active voice, one meaning per word) are exactly right, though.

Dominant agent failure mode: **reword-without-adding-context**, paraphrasing the same
sentence when the real gap was a missing premise or step. That is the skill's whole reason
to exist, and the upstream body only gestures at it.

## Decision

**Adapt**, two tightenings, size kept to one sentence:

1. **Force the context-addition** (the key fix): "add the context I was missing, don't just
   reword the same message (the gap is usually a premise or step you assumed)". Converts
   rephrase into actual repair.
2. **Inline the STE behaviors** ("short, active-voice sentences, one meaning per word")
   with a parenthetical nod to Simplified Technical English, rather than citing a standard
   the agent can only pretend to meet.

Kept: the `GLOSSARY.md` anchor (the skill's best feature, the guard against
simplify-into-dumb-down), the one-sentence size (brevity is a feature for a mid-flow nudge
that interrupts another skill), user-invoked. Repointed: upstream's `GLOSSARY-MAP.md`
multi-glossary pointer phrased conditionally ("if the repo has more than one glossary,
follow its glossary map"), since grey-matter has a single `GLOSSARY.md`; AGENTS.md-primary.

## Cross-skill dependencies

Fires inside any other skill mid-conversation. Anchored on `GLOSSARY.md` (the ubiquitous
language `grill-with-docs`/`domain-modeling` build). The upfront cure for the jargon it
repairs is agreeing shared language early via `grill-with-docs`.

## Web-app bias

None. Conversational repair is domain-neutral. No lens.
