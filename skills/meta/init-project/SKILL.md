---
name: init-project
description: Set up a new project's agent conventions once: AGENTS.md, scratch dir, gitignore, tkt, and whatever else the installed skills need tracked.
disable-model-invocation: true
---

# Init Project

Scaffold the conventions the skills assume, once per repo. Explore first, propose, then
write, don't clobber what's already there. The goal is a project where a fresh agent
and the skills both find what they expect.

## Process

### 1. Explore

Read the repo's current state before writing anything: is there a git remote, an
`AGENTS.md` or `CLAUDE.md`, a `.gitignore`, a `.scratch/`, a `.tickets/`, a `GLOSSARY.md`,
a `docs/`? Which skills are installed (they decide what needs tracking, see step 3)?
Note a game engine marker (`project.godot`, `*.uproject`) so game projects get the
game-native defaults.

**Check the prerequisites.** This skill set depends on **tkt** (until a no-tkt
optionality path exists). Verify both, and if either is missing, tell the user to install
it before continuing, don't improvise around a missing tracker:

- the **tkt tool** is on PATH (`tkt --version`);
- the **`tkt` skill** is deployed to the harness's skill root (so skills like
  `reconcile-tickets`, `to-tickets`, `implement` can call it for the command surface and
  ticket standards). It ships with tkt; deploy it the way that harness installs skills.

### 2. Agent instructions: AGENTS.md primary, CLAUDE.md points to it

`AGENTS.md` is the primary agent-instructions file (the portable standard every harness
reads). `CLAUDE.md` is a thin pointer to it, so Claude Code reads the same source. If
only one exists, reconcile to this shape; never maintain two divergent copies.

- No `AGENTS.md`: create it (move any `CLAUDE.md` content into it first).
- `CLAUDE.md` has real content: move it into `AGENTS.md`, replace `CLAUDE.md` with a
  one-line pointer ("See AGENTS.md.").
- Both exist: make `AGENTS.md` the source and `CLAUDE.md` the pointer.

### 3. Scratch, references, and gitignore

Create `.scratch/` as the project-local home for non-committed working files (handoffs,
agent notes, throwaway output) and gitignore it. Add a short `## Scratch` note to
`AGENTS.md` stating the rule: nothing in `.scratch/` is durable; anything worth keeping
goes in committed `docs/` or a ticket.

Create `.references/` as the place to clone prior-art and reference material. Gitignore
its *contents* but commit a `.references/README.md` (`.references/*` then
`!.references/README.md`). That README is the rehydration index: for each reference, what
it is, why it's a reference here, and the exact clone command, so a fresh checkout on
another machine can re-clone what the gitignored dir lost. Nothing in `.references/` is a
dependency, only material agents read.

### 4. Track what the installed skills need

Each skill that carries a convention gets its config set up and a pointer from
`AGENTS.md`. Set up only what is installed:

- **tkt** (ticket tracker): run `tkt init` if `.tickets/` is absent; it writes the
  tracking block into `AGENTS.md`. Point at `docs/agents/tkt-conventions.md` for the tag
  vocabulary, epic convention, and lifecycle. Confirm the gitignored `.context` and the
  push setting fit this repo.
- **domain-modeling / game-modeling**: a `GLOSSARY.md` (and `docs/adr/`) are created
  lazily by those skills, not here; just note in `AGENTS.md` that they are the vocabulary
  source once they exist.
- **game projects**: point `AGENTS.md` at `game-native-design` and `game-modeling` as
  the defaults, and record the engine.
- Any other installed skill with a project convention: add its config and a one-line
  `AGENTS.md` pointer. Keep `AGENTS.md` to pointers plus the few always-on rules; detail
  lives in the pointed-at docs.

### 5. Confirm and write

Show the user the `AGENTS.md` layout, the `.gitignore` additions, and which skills you
set up. Let them edit before writing. Then write, and tell them what to re-run if they
later install a skill with its own convention.
