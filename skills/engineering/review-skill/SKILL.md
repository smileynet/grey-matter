---
name: review-skill
description: Review one upstream skill for adaptation into grey-matter. Use when deciding whether to keep, adapt, drop, or replace a mattpocock/skills skill, one at a time.
disable-model-invocation: true
---

# Review Skill

Work one skill at a time. Never batch, never pre-commit a verdict across skills. For
the skill under review, produce a committed review note, a decision the user makes, and
(on a keep/adapt/new) the authored skill. The source set lives at `d:\code\skills`.

## The lens

Evaluate the skill through these, in order:

1. **Purpose first.** Read the skill for what it is *for* in this set, not against a
   textbook ideal. State its intent and the problem it solves before judging it.
   Debates imported from the wrong altitude dissolve once the purpose is clear (a
   feedback-loop skill is not design-TDD; it takes no side in a design-method war).
2. **Agent audience, not human.** These instruct agents. Filter every research insight
   through "does this change what the **agent** does," not "is this true for a human
   developer." Ask of each finding: is it human-ergonomic (review fatigue, muscle
   memory, team dynamics) or agent-behavioural? Does it hit a real agent failure mode
   (over-production, over-triggering, false positives, premature completion,
   context-rot)? Agent failure modes are often the inverse of human ones, a rule that
   looks "too strict" for a person can be correctly calibrated for an agent that
   over-emits. Credible human-oriented sources sound authoritative and will pull you
   toward "corrections" that degrade the skill for an agent; this filter is the check.
3. **Apps vs games.** Decide where the skill falls, by how much actually differs:
   - whole discipline differs -> a **separate sibling skill**;
   - workflow shared, only domain assumptions differ -> a **pointer to a lens**;
   - one artifact differs -> **split that artifact** (e.g. two rubric files).
   Default to the lightest that is honest. Games default to Godot, Unreal second
   anchor, portable core (see `game-native-design`).
4. **Depth bar.** Match the upstream skills: terse, principle-dense, judgment over
   coverage. Progressive disclosure into siblings. Honor house conventions (no
   em-dashes). Do not over-editorialize: keep the skill close to its purpose, drop
   calibration asides, and never hedge an instruction into a no-op.
5. **Repoint to our reality.** tkt is the tracker (findings and specs are tickets with
   full context and clear acceptance criteria). Strip Matt-Pocock branding and the
   setup-skill precondition. Keep the "Skill tool" invocation model, mapped to our
   harness.

## Process

1. **Re-read** the skill's `SKILL.md` and every sibling fresh from `d:\code\skills`,
   never from memory.
2. **Research** related topics, best practices, and prior art via subagents, from
   **credible sources** (primary authors, official docs, peer-reviewed or well-regarded
   practitioner work). Rate evidence strength and flag where credible experts disagree.
3. **Re-filter** each insight through the lens above, the agent-audience filter first.
4. **Discuss** before authoring: present what the skill is, its purpose, the prior-art
   finding, and the candidate adjustments as options with your lean and reasoning. The
   user decides. Record *why* a contested call went the way it did, so a future reader
   does not reopen it.
5. **Author and record.** On keep/adapt/new, write the skill under
   `skills/<bucket>/<name>/` to the depth bar. Write the review note at
   `docs/skill-reviews/<name>.md` (sections: what it is, what it does for the user,
   prior art, decision + why, cross-skill dependencies, web-app bias). Update the
   review index with the verdict. File tickets for spun-off or deferred work; reconcile
   any already-authored skill this one couples to. Validate, commit, push.

## Verdicts

**keep** (take largely as-is), **adapt** (take, with changes), **drop** (leave
behind), **defer** (revisit later; beta/frozen), **new** (a grey-matter skill with no
upstream origin, e.g. a game-native counterpart). The verdict is the user's call; bring
a researched lean, not a decision.
