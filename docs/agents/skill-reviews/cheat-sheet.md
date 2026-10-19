# cheat-sheet

- Bucket: meta. Invocation: user-invoked (`disable-model-invocation: true`).
- Verdict: **new** (grey-matter original, no upstream origin).

## What it is

A flat reference card: every skill in the set, grouped by bucket (and by invocation within
a bucket), one line each, generated live from the skills' own frontmatter.

## What it does for the user

Answers "what's available at a glance" in one shot, the quick index. Distinct from
`compass`, which is the router/map (flows, on-ramps, "which fits my situation"); cheat-sheet
is the flat enumeration you scan to recall a name.

## Why it exists

The user asked for a command that lists each skill by category with a one-line
description. It's the lightweight companion to compass: compass costs more to read (it
teaches the system); the cheat sheet is the cheap recall card.

## Design

- **Generated live from disk**, never a hardcoded list, so it can't go stale (the same
  staleness invariant compass and the bucket READMEs hold). The SKILL.md instructs the
  agent to read `skills/<bucket>/<name>/SKILL.md` frontmatter and emit the table.
- **Grouped by bucket then invocation** (user vs model, keyed off
  `disable-model-invocation`), mirroring the bucket READMEs.
- **One line per skill**: the description's lead clause, trigger phrasing dropped.
- **Markdown by default** (the quick skim per `docs/agents/report-format.md`), HTML offered
  if the user wants a keepable/shareable card.
- User-invoked: a human asks for it; the agent doesn't need to self-fire a reference card.

## Cross-skill dependencies

A meta skill beside `compass` (router), `curate-docs` (keeps the set honest),
`review-skill`, `init-project`. Reads the bucket structure from
`docs/agents/maintenance-skills.md`; output format follows `docs/agents/report-format.md`.

## Web-app bias

None. Listing the set is domain-neutral. No lens.
