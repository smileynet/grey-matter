---
name: grill-with-docs
description: A relentless interview to sharpen a plan or design that also leaves a paper trail (glossary and decision records). Use when grilling inside a working directory.
disable-model-invocation: true
---

Run a grilling session that leaves a paper trail. Call the Skill tool with `grilling`
for the interview, and pair it with the modeling discipline that fits the project so
the vocabulary and decisions get written down as they crystallise.

Pick the modeling skill by project type (load one or both as the work demands):

- **App / backend / business software** (incl. a game's backend, economy, meta,
  inventory, progression): call the Skill tool with `domain-modeling`.
- **A game's real-time systems and design model** (mechanics, core loop, systems,
  feel): call the Skill tool with `game-modeling`.
- **A game with a substantial backend**: load **both**, `game-modeling` for the
  simulation and design model, `domain-modeling` for the business-software half.

If the project type is unclear, detect it (engine markers like `project.godot` or
`*.uproject` signal a game) and, if still ambiguous, ask the user which to load. Both
share one thing, a canonical glossary (ubiquitous language); the rest differs, so load
the one(s) that match what you are actually modeling this session.
