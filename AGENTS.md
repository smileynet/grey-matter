# grey-matter

A customized, adapted set of agent skills derived from `mattpocock/skills`,
reshaped for this workflow and for game-centric (not just web-app) development.

This is the primary agent-instructions file. `CLAUDE.md` just points here, so every
harness reads one source.

## Vocabulary and conventions (read these first)

- [`GLOSSARY.md`](./GLOSSARY.md): the one shared vocabulary. Binding homonym
  rulings: **frontier** (never bare "ready") vs. **triage:ready-for-agent**;
  **spec** is the requirements document, the tkt pointer field is the **spec-slug**.
- [`docs/agents/tkt-conventions.md`](./docs/agents/tkt-conventions.md): how we create, tag, link,
  and close tickets. Note the **interim** rules (epics-via-tags, single-select tag
  discipline) that become native once tkt tickets 192-199 land (tracked by
  grey-matter ticket 04).
- [`docs/agents/skill-frontmatter.md`](./docs/agents/skill-frontmatter.md): the all-up SKILL.md
  frontmatter schema across Claude Code, Codex, and Kiro, the safe core, per-harness
  invocation control, and what belongs in `metadata` (inert data only).
- [`docs/agents/report-format.md`](./docs/agents/report-format.md): generated documents, reports, and
  dashboards pick a format by purpose, **markdown for light, skimmable documents** and
  **HTML for full-bodied documents that communicate finished ideas to users** (siblings,
  not source-and-render).
- [`docs/agents/doc-conventions.md`](./docs/agents/doc-conventions.md): where things live.
  `SKILL.md` and this file are **agent-facing** (terse); **`docs/` is for user-facing
  docs**, **`docs/agents/` for agent-facing reference** (reviews, lenses, research,
  proposals, conventions), loaded on demand via pointers, never auto-loaded; `.scratch/`
  is ephemeral. Plus the promotion test (note -> skill) and the dot-prefix rule.
- [`docs/agents/maintenance-skills.md`](./docs/agents/maintenance-skills.md): the three
  buckets (`engineering` build, `productivity` think/communicate, `meta` maintain the set),
  why `meta` exists, the `compass` router, per-bucket READMEs, and how the index stays in
  sync.

## Scratch

`.scratch/` (gitignored) is the project-local place for non-committed working files:
handoff documents, agent notes, throwaway output. One consistent location per project
so a fresh agent knows where to look. Nothing in `.scratch/` is durable or shared;
anything worth keeping is promoted to committed `docs/agents/` reference or a tkt ticket
(see `docs/agents/doc-conventions.md`).

## References

`.references/` holds cloned prior-art and reference material. Its contents are
gitignored; only [`.references/README.md`](./.references/README.md) is committed, as the
rehydration index. On a fresh checkout the dir is empty, re-clone the references listed
in that README. Add new references there with their clone command.

<!-- tkt:begin -->
## Tickets

This project uses tkt for work tracking. Run `tkt ready` to see what's available.

Commands: ready, claim <id>, close <id> --check-all --evidence "..." --resolution "...", validate --brief
Create: new <slug> --title "..." [--tags stream] [--blocked-by N,N] [--priority P]  (defaults to open)
Edit: edit <id> --status backlog (park deferred work), --status open (unpark)

Status: open (frontier, the default) -> in_progress -> done; backlog = parked, hidden from ready
New work defaults to open. Use --status backlog only for deliberately deferred work, not actionable discovered work.
Reach done only via `tkt close` - never hand-edit status to done (skips close gates).

Workflow: tkt ready -> close <id> --check-all --resolution "done: what was shipped"
For shared repos: tkt ready -> claim <id> -> work -> close <id> --check-all --resolution "..."
Discovered work: tkt new <slug> --title "..." (open, a separate ticket; --blocked-by if it depends on current work)
Tag new tickets with their work stream (--tags <stream>) in multi-stream projects.
<!-- tkt:end -->
