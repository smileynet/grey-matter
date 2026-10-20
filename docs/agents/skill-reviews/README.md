# Skill reviews

One note per upstream `mattpocock/skills` skill: what it is, what it does for the
user, and our **keep / adapt / drop** decision for the grey-matter set. Source
reviewed in the sibling repo `d:\code\skills`. See
[`docs/agents/proposals/02-game-native-development.md`](../proposals/02-game-native-development.md)
for the game lens the web-bias flags feed.

Note shape (per `docs/agents/tkt-conventions.md`, reference lives in docs, the ticket is the
work record): each note is `docs/agents/skill-reviews/<skill>.md` with sections **What it is**,
**What it does for the user**, **Decision** (keep/adapt/drop + why), **Cross-skill
dependencies**, **Web-app bias**.

Verdict legend: **keep** (take largely as-is), **adapt** (take, with changes noted),
**drop** (leave behind), **defer** (revisit later / beta or frozen), **new** (a
grey-matter skill with no upstream origin, e.g. the game-native counterparts).

## Index

| Skill | Bucket | Invocation | Verdict | Note |
| --- | --- | --- | --- | --- |
| review-skill | meta | user | new | [review-skill.md](review-skill.md) |
| init-project | meta | user | new (replaces setup-matt-pocock-skills) | [init-project.md](init-project.md) |
| grilling | productivity | model | adapt | [grilling.md](grilling.md) |
| domain-modeling | engineering | model | adapt | [domain-modeling.md](domain-modeling.md) |
| game-modeling | engineering | model | new | [game-modeling.md](game-modeling.md) |
| game-native-design | engineering | model | new | [game-native-design.md](game-native-design.md) |
| curate-docs | meta | user | new | [curate-docs.md](curate-docs.md) |
| cheat-sheet | meta | user | new | [cheat-sheet.md](cheat-sheet.md) |
| changelog | meta | user | new | [release.md](release.md) |
| readme | meta | user | new | [release.md](release.md) |
| release | meta | user | new | [release.md](release.md) |
| reconcile-tickets | meta | user | new (wraps tkt skill) | [reconcile-tickets.md](reconcile-tickets.md) |
| writing-for-agents | productivity | model | keep | [writing-for-agents.md](writing-for-agents.md) |
| setup-matt-pocock-skills | engineering | user | adapt -> replaced by init-project | |
| tdd | engineering | model | adapt | [tdd.md](tdd.md) |
| code-review | engineering | model | adapt | [code-review.md](code-review.md) |
| pr | engineering | model | adapt | [pr.md](pr.md) |
| diagnosing-bugs | engineering | model | adapt | [diagnosing-bugs.md](diagnosing-bugs.md) |
| to-spec | engineering | user | adapt | [to-spec.md](to-spec.md) |
| to-tickets | engineering | user | adapt | [to-tickets.md](to-tickets.md) |
| handoff | productivity | user | adapt | [handoff.md](handoff.md) |
| to-questionnaire | productivity | user | adapt | [to-questionnaire.md](to-questionnaire.md) |
| codebase-design | engineering | model | adapt | [codebase-design.md](codebase-design.md) |
| implement | engineering | user | adapt | [implement.md](implement.md) |
| implement-spec | engineering | user | adapt | [implement-spec.md](implement-spec.md) |
| grill-with-docs | engineering | user | adapt | [grill-with-docs.md](grill-with-docs.md) |
| retro | engineering | user | adapt | [retro.md](retro.md) |
| ask-matt | meta | model | adapt -> renamed to compass | [ask-matt.md](ask-matt.md) |
| wayfinder | engineering | user | adapt | [wayfinder.md](wayfinder.md) |
| triage | engineering | user | adapt | [triage.md](triage.md) |
| improve-codebase-architecture | engineering | user | adapt | [improve-codebase-architecture.md](improve-codebase-architecture.md) |
| prototype | engineering | model | adapt | [prototype.md](prototype.md) |
| research | engineering | model | adapt | [research.md](research.md) |
| research-audit | engineering | model | new | [research.md](research.md) |
| wizard | engineering | model | adapt | [wizard.md](wizard.md) |
| grill-me | productivity | user | keep | [grill-me.md](grill-me.md) |
| teach | productivity | user | adapt | [teach.md](teach.md) |
| wait-what | productivity | user | adapt | [wait-what.md](wait-what.md) |
| chief-of-staff | in-progress | user | TBD | |
| claude-handoff | in-progress | user | TBD | |
| loop-me | in-progress | user | TBD | |
| setup-ts-deep-modules | in-progress | user | TBD | |
| writing-fragments | in-progress | user | TBD | |
| writing-shape | in-progress | user | TBD | |
| writing-beats | in-progress | user | TBD | |
| git-guardrails-claude-code | misc | model | TBD | |
| migrate-to-shoehorn | misc | model | TBD | |
| scaffold-exercises | misc | model | TBD | |
| setup-pre-commit | misc | model | TBD | |
