# init-project

- Bucket: meta. Invocation: model-invoked since 2026-10-22 (was user-invoked; orchestrators like wrap-session must call it via the Skill tool, which Claude Code refuses for user-invoked skills; enforced by check-invocation-policy.mjs Check 3). **New skill** (grey-matter's
  replacement for the upstream `setup-matt-pocock-skills`).
- Verdict: **new**.

## What it is

The once-per-repo setup skill: scaffold the conventions the skills assume, AGENTS.md
(primary) + CLAUDE.md (pointer), `.scratch/` + gitignore, `tkt init`, and config +
an AGENTS.md pointer for each installed skill that carries a convention. Explore,
propose, write without clobbering.

## Why it exists

The upstream `setup-matt-pocock-skills` (reviewed earlier, verdict: adapt/rename) is
the config hub every tracker-coupled skill expects. grey-matter's version is repointed
to our reality: tkt as the tracker (not GitHub/GitLab/.scratch-markdown), AGENTS.md as
the primary instructions file, `.scratch/` as the scratch convention, and the branding
dropped. It also absorbs the new conventions we established while reviewing skills
(.scratch, the AGENTS.md/CLAUDE.md split, the game-native defaults).

## Decision

**New.** Encodes the setup decisions made across ticket 03:

- **AGENTS.md primary, CLAUDE.md points to it.** The portable standard: every harness
  reads AGENTS.md; CLAUDE.md is a one-line pointer so Claude Code reads the same source.
  Never two divergent copies.
- **`.scratch/` + gitignore** as the project-local non-committed working dir.
- **`.references/`** for cloned prior art: contents gitignored, a committed
  `.references/README.md` as the rehydration index (what to re-clone and how), so a
  fresh checkout can restore references the gitignore dropped.
- **tkt** set up via `tkt init` (which writes the tracking block into AGENTS.md), with a
  pointer to `docs/agents/tkt-conventions.md`.
- **Per-installed-skill conventions**: only set up what is installed; each gets its
  config and a one-line AGENTS.md pointer, detail stays in the pointed-at doc.
- **Game projects** point at `game-native-design` / `game-modeling` and record the
  engine.

Held to the depth bar at ~49 lines. Supersedes `setup-matt-pocock-skills`; that skill's
index verdict is "adapt -> replaced by init-project".

## Cross-skill dependencies

Precondition for the tracker-coupled skills (to-spec, to-tickets, triage, implement,
wayfinder) the way the upstream setup skill was: they assume the config this writes.
Runs `tkt init`. Points at `game-native-design`/`game-modeling`, `docs/agents/tkt-conventions.md`,
`GLOSSARY.md`, `docs/agents/skill-frontmatter.md`.

## Web-app bias

None. Carries the game-native defaults as a branch (engine detection), not a bias.
