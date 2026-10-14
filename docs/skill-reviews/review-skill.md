# review-skill

- Bucket: engineering. Invocation: user-invoked. **New skill** (no upstream origin).
- Verdict: **new** (codifies grey-matter's own skill-adaptation method).

## What it is

The reusable method for reviewing one upstream `mattpocock/skills` skill for adaptation:
the lens (purpose-first; agent-audience not human; apps-vs-games treatment; depth bar;
repoint to tkt) and the process (re-read fresh, research credible prior art, re-filter
for an agent audience, discuss, then author + record + ticket). User-invoked, run once
per skill under review.

## Why it exists

Ticket 03 is a 38-skill walkthrough. The approach converged over the first several
skills (grilling, domain-modeling, tdd, code-review) through user feedback, into a
consistent method. Capturing it as a skill keeps later reviews consistent with earlier
ones and makes the method reusable beyond this one ticket.

## Decision

**New.** Encodes decisions the user set during ticket 03: one at a time; purpose before
doctrine (the tdd lesson); the agent-audience filter as a standing check on
human-oriented research (the classicist lesson); the apps/games spectrum
(sibling / lens / split-artifact); keep lean and un-editorialized; tkt as the tracker;
the user owns verdicts. Held to the depth bar at ~60 lines.

## Cross-skill dependencies

Governs the ticket-03 reviews. References `game-native-design` (games default) and the
review index/notes convention. Uses the issue-tracker doc for filing spun-off work.

## Web-app bias

None. It is the method that *decides* each skill's apps/games treatment; it carries the
games-default (Godot, Unreal anchor, portable core) as a lens rule, not a bias.
