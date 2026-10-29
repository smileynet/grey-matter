# grey-matter

A customized, adapted set of agent skills derived from `mattpocock/skills`,
reshaped for this workflow and for game-centric (not just web-app) development.

This is the primary agent-instructions file. `.claude/CLAUDE.md` just points here, so every
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
  **HTML for visual explanations and interactive review** (siblings,
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
so a fresh agent knows where to look.

Nothing in `.scratch/` is durable or shared; anything worth keeping is promoted to committed `docs/agents/` reference or a tkt ticket
(see `docs/agents/doc-conventions.md`).

## References

`.references/` holds cloned prior-art and reference material. Its contents are
gitignored; only [`.references/README.md`](./.references/README.md) is committed, as the rehydration index.
Re-clone its listed references on a fresh checkout; add each new reference with its clone command.

**Prior art is prior art, not authority.** grey-matter combines your skills and preferences
with Pocock's for this workflow.

Other skill sets we study (notably **crew-research**, home
`code/crew-research/atomics/`) are **prior art we draw insight from, never an authoritative
source.**

Cite them as "X does this (prior art); grey-matter chose Y" — consulted and weighed,
not inherited or adapted-from. Cite the lineage's home rather than an incidental copy
such as a skill copied into a project's `.kiro/`.

## Maintainer commands

Read [distribution maintenance](./docs/agents/distribution-maintenance.md) when changing
skills, manifests, deployment or release guidance. It covers plugin updates, ownership,
shared release-tool synchronization, per-host validation and the consistency checks.

- Setup: Node 22+, then `npm ci --ignore-scripts` after clone or lockfile changes.
- Gate: `node scripts/check-repo.mjs` must exit 0 before committing/pushing distribution changes.
- Syntax fixtures: `node --test scripts/skill-syntax.test.mjs` must pass; native validation alone misses malformed YAML.

## When blocked

Record unavailable gates and exact failures in the owning ticket; continue independent
work. Release staging waits for required evidence or an explicit supported-scope decision.

Release preparation/publication: read [the release contract](docs/agents/release-contract.md)
for version authorities, mode boundaries, publishers and remaining gates.

## Working rhythm

- **Commit after every task.** When a unit of work is complete and verified, commit it — don't let finished work sit unstaged.
- **Check before you push.** Run `node scripts/check-repo.mjs` before pushing when the task touched skills, indexes, docs, or the installer; a green run is cheap insurance against pushing a broken link or a lost sidecar straight to `main`. Install the opt-in pre-commit hook (`node scripts/install-hooks.mjs`) to run it automatically. (Local gates by default; manually dispatched platform validation supplies Windows/Linux evidence.)
- **Push after every commit.** A commit isn't done until it's pushed. Another session may be pushing to `main` too — if a push is rejected, `git pull --rebase` (or fetch + rebase) and push again; don't force-push. (`tkt new`/`claim`/`close` auto-push, so they interleave with manual commits — the same rebase-and-retry applies.)
- **Deploy by default.** After skill or guidance changes, run `node scripts/deploy.mjs` once: it verifies Claude reads this checkout directly, refreshes the enabled Codex plugin, selects bare roots without duplicates, and refreshes the Antigravity plugin when `~/.gemini` exists. `sync` uses that same command; the legacy wrappers are alternatives, not extra deploy steps. Install changed global rules with `node scripts/install-agents-md.mjs`. Restart chats to load refreshed plugin skills.

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
