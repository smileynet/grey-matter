# Proposal 20: a `.local/` tier for durable, untracked material

**Status:** proposed 2026-11-04; decisions settled the same day (see [Decisions](#decisions)). Not yet approved for implementation; no skill, script or project has changed.

**Scope:** `skills/meta/init-project` (step 3), `docs/agents/doc-conventions.md` (placement tiers), `skills/meta/repository-artifact-hygiene` (close-time outcomes, footprint inspector), `skills/meta/conformance-audit`, `skills/meta/adopt-project/references/repo-hygiene.md`, `skills/meta/curate-docs`. No new skill.

**Builds on:** [proposal 16](16-agent-footprint-guardrails.md) (footprint while agents work) and ticket 97's "At ticket close" rule. Those decide what happens to scratch. This proposal fixes what scratch is allowed to hold.

## Recommendation

Add a third ignored tier, `.local/`, for material that is not committed but is not disposable either, and make `.scratch/` mean only "disposable". Classify untracked material by what losing it costs:

| Tier | Path | Losing it costs | Cleanup rule |
|---|---|---|---|
| Disposable | `.scratch/` | nothing | Promote or trash at ticket close; name per ticket (`t<N>-…`). |
| Rehydratable | `.references/` | a re-clone | Committed README holds the clone commands (unchanged). |
| Local, durable | `.local/` | time, a re-fetch or permanent loss | Never an automatic cleanup target; only the registry owner releases it. |

Inside `.local/`, split by why the material is not committed:

- `.local/state/`: regenerable but slow to rebuild (packager resume state, scan caches, derived libraries). Deleting is safe and costly in time.
- `.local/sources/`: downloaded inputs that can be fetched again. Each entry needs a URL or manifest and a hash.
- `.local/private/`: not recoverable and not committable (private originals, receipts, device backups, personal data). Needs an independent backup.
- `.local/README.md`: committed registry, one row per item: owner, purpose, `retained` / `released` / `unknown`, and the condition that ends it. This is the record "Ownership across handoffs" already requires, placed where cleanup cannot remove it.

Gitignore: `.local/*` then `!.local/README.md` (a plain `.local/` line would make the negation unreachable, as with `.references/`).

Name: `.local/` follows the XDG meaning ("this machine only") and names the purpose. `.nocommit` names only the mechanism and would invite tracked-by-accident reading in reverse.

## Evidence

Observed 2026-11-03/04 while auditing every `.scratch` and `.claude` folder under `~/code`:

| Observation | Source | Consequence |
|---|---|---|
| clvgm-extract's packagers default their resume state to the `full-video` and `ios-package` folders in `.scratch/`; the README says both resume from it. | `scripts/package_ios_video.py` (`run_dir` default), `scripts/package_ios_audio.py`, `scripts/package_ios_notation.py`, `README.md` | The only way to know these were not disposable was to read the scripts. The project's `AGENTS.md` had no scratch rule, so a first estimate of "70 GB safe" was wrong. |
| philippines-trip keeps its retention registry in an ignored scratch file (`artifact-retention.json` under a `coordination` folder). | `.memory/guides/storage-lifecycle.md` | The record that protects other artifacts lives in the folder cleanup targets. |
| philippines-trip has a bespoke `.private/` (28 entries: receipts, candidates, account files, `retained-workspaces`). | project directory | Projects invent their own durable-untracked home when none is defined. |
| `init-project` says "nothing in `.scratch/` is durable" and also writes handoff notes there; `inspect-footprint.mjs` treats `.scratch/*` as delete/slim candidates. | `skills/meta/init-project/SKILL.md` step 3; `scripts/inspect-footprint.mjs` | Anything durable placed in scratch is exposed to the cleanup tooling by design. |
| grey-matter, local-first and mac-health-suite repeat the "nothing in `.scratch` is durable" rule; tagalog-helper and philippines-trip have richer policies; system-health, ios-helper and tkt have none. | each project's `AGENTS.md` | Per-project rules diverge on the same question. |

Limits of this evidence: it comes from one audit of nine projects. It shows where durable material lands today, not how often a `.local/` tier would be misused.

## Rules

1. **Where a tool writes.** Resume state and caches default to `.local/state/<tool>`, not `.scratch/`. Per-run evidence goes in a `t<N>-…` folder in `.scratch/`.
2. **At ticket close.** The hygiene skill's three outcomes become: Promote (to tracked docs), Move (to `.local/` with a registry row naming its scope and end condition), Delete. `.scratch/` no longer has a "keep" outcome.
3. **Cleanup tooling.** `inspect-footprint.mjs` reports `.local/` families as `keep`, never delete, slim or prune, unless the registry row is `released`. A missing or `unknown` row is `ask`.
4. **Always-on line.** Each project's `AGENTS.md` gets a short pointer in place of the old Scratch rule: `.scratch/` disposable; `.local/` durable and untracked, registry in `.local/README.md`.

## Skill changes

| Skill / doc | Change |
|---|---|
| `init-project` step 3 | Create `.local/` with README and gitignore pattern if absent; write the `AGENTS.md` pointer; keep create-what's-missing behaviour. |
| `doc-conventions.md` | Add the local-durable tier beside the ephemeral ones; state that a dot-prefix does not imply disposable for `.local/`. |
| `repository-artifact-hygiene` | Replace the close-time "Keep in scratch with lifecycle scope" with "Move to `.local/`"; point the ownership record at `.local/README.md`; add `.local/` to the footprint families (outcome `keep`/`ask`). |
| `inspect-footprint.mjs`, `references/inspection.md` | Scan `.local/` immediate children as families; honour registry state. |
| `conformance-audit` | Flag scripts whose default state or output path is `.scratch/`; flag bespoke ignored folders (`.private/`, similar); keep the existing `scratchCitations` check. |
| `adopt-project` / `repo-hygiene.md` | Detect bespoke ignored folders during adoption and propose a move in the existing gate. |
| `curate-docs` | State that the sweep covers `.scratch/` only. |

## Migration for existing projects

Each is project work, done by that project under its own authorization.

- **clvgm-extract:** point the three packagers at `.local/state/` and update the README line naming the `ios-package` scratch folder; register `video/` in place (it is referenced by `target_path`; do not move 3.8 GB). Its `AGENTS.md` Scratch section (commit `1279211`) then drops the two named exceptions.
- **philippines-trip:** move `.private/` to `.local/private/` and the retention registry out of scratch; reconcile with `.memory/guides/storage-lifecycle.md`.
- **tagalog-helper:** its policy and `prune_scratch.py` already protect durable items; decide only where the registry lives.
- **Others:** add the pointer on next touch.

## Decisions

Settled 2026-11-04 by the owner, taking the recommendations:

1. **Name:** `.local/`.
2. **State vs cache:** one `.local/state/` tier.
3. **Registry:** one `.local/README.md` per project. A project with an existing registry (philippines-trip) moves its rows into it during migration.

## Not covered

Backup of `.local/private/` (separate from this layout), machine-wide cleanup, history rewriting, and any change to `.references/`.
