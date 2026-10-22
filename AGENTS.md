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
- [`docs/agents/windows-powershell-gotchas.md`](./docs/agents/windows-powershell-gotchas.md):
  the recurring Windows/PowerShell command traps in this repo (`Move-Item` vs
  `Rename-Item`, `;` not `&&`, `$env:` not `%VAR%`, quoting) with the correct form for each.

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

**Prior art is prior art, not authority.** grey-matter is a unique reimagining — your own
skills and preferences combined with Pocock's, built for a newer model generation without
legacy baggage. Other skill sets we study (notably **crew-research**, home
`code/crew-research/atomics/`) are **prior art we draw insight from, never an authoritative
source.** Cite them as "X does this (prior art); grey-matter chose Y" — consulted and weighed,
not inherited or adapted-from. Don't cite an incidental localized copy (e.g. a skill copied
into some project's `.kiro/`) as the source; cite the lineage's home.

## Install / distribution

Skills are installed into a harness scan root with `node scripts/install-skills.mjs`
(copies each skill into the known harness user roots, flattening the bucket structure;
`--project` for `<cwd>/.agents/skills`; manifest-tracked, idempotent,
`--dry-run`/`list`/`uninstall`). The decision and design are in
[`docs/agents/proposals/03-distribution-packaging.md`](./docs/agents/proposals/03-distribution-packaging.md);
the user-level standing rules (`global/AGENTS.md`, no steering) install with
`node scripts/install-agents-md.mjs` (owner-marked, never clobbers a foreign file);
per-harness deploy + test instructions are in
[`docs/agents/harnesses.md`](./docs/agents/harnesses.md); a Claude Code plugin package is
a later addition.

## Consistency checks

One command verifies every mechanical invariant the skill distribution depends on:

```
node scripts/check-repo.mjs
```

It aggregates (each also runnable on its own): installer ownership safety
(`scripts/install-skills.test.mjs`), invocation sidecars + README tiers
(`scripts/check-invocation-policy.mjs`), doc indexes + relative links
(`scripts/check-docs-consistency.mjs`), ticket health (`tkt validate`), adopt-project's
knowledge-relocation fixtures (`scripts/relocate-knowledge.test.mjs`), and the global AGENTS.md
size budget + ownership (`scripts/install-agents-md.test.mjs`). It is
**read-only on user state** (the installer check uses throwaway temp roots, never a real
harness skill root) and needs **no harness authentication or network** (tkt is local and
degrades to a skipped-with-warning if absent). Run it before a
release or a distribution change. Exit 0 = all invariants hold; nonzero names what failed.
Fixtures proving each invariant fails when seeded live in `scripts/check-repo.test.mjs`
(`node --test`).

An **opt-in pre-commit hook** can run this automatically: `node scripts/install-hooks.mjs`
installs a `pre-commit` hook that runs `check-repo.mjs` and blocks the commit on failure;
`list` / `uninstall` manage it, and it refuses to clobber a foreign hook. It is not forced
on clone — install it if you want the local gate. (This project uses local hooks only;
there is no CI pipeline.)

## Working rhythm

- **Commit after every task.** When a unit of work is complete and verified, commit it — don't let finished work sit unstaged.
- **Check before you push.** Run `node scripts/check-repo.mjs` before pushing when the task touched skills, indexes, docs, or the installer; a green run is cheap insurance against pushing a broken link or a lost sidecar straight to `main`. Install the opt-in pre-commit hook (`node scripts/install-hooks.mjs`) to run it automatically. (Local hooks only — this project has no CI.)
- **Push after every commit.** A commit isn't done until it's pushed. Another session may be pushing to `main` too — if a push is rejected, `git pull --rebase` (or fetch + rebase) and push again; don't force-push. (`tkt new`/`claim`/`close` auto-push, so they interleave with manual commits — the same rebase-and-retry applies.)
- **Deploy by default.** Prefer to deploy changes (install skills into the harness roots with `node scripts/install-skills.mjs`, the global rules with `node scripts/install-agents-md.mjs`, publish, etc.) as part of finishing the work, unless the user says otherwise.

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
