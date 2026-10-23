---
name: sync
description: "Pull grey-matter current and re-synchronize the coupled pieces — deployed skills, the tkt command surface, ticket IDs, and repo invariants — then redeploy. Use when updating this repo and pushing the skills back out to the harnesses, or asking to 'pull and deploy' / 'sync and redeploy'."
disable-model-invocation: true
---

# Sync

The **inbound twin of `release`**. `release` tags and pushes the repo *outward*; `sync`
pulls *inward*, re-synchronizes the four things that move in lockstep, and redeploys the
skills to the harnesses. A bare `git pull` desyncs them silently — this skill is the single
command that gets current *safely*.

The four couplings it keeps aligned:

1. **Repo ↔ deployed skills.** A pull can add, change, or remove skills; the harness scan
   roots and the Antigravity (`agy`) plugin keep serving the old copies until
   `install-skills.mjs` and `build-agy-plugin.mjs install` re-run.
2. **Skills ↔ tkt command surface.** The skills inline tkt commands; a tkt upgrade can
   rename a flag or drop a subcommand and break a skill mid-task.
3. **Local tickets ↔ upstream tickets.** A pull can collide ticket IDs; `tkt rebase`
   resolves them (upstream wins).
4. **Repo invariants.** `check-repo.mjs` must stay green (indexes, links, invocation
   sidecars, installer safety).

**Sync is an orchestrator.** It does the pull/deploy *judgement* itself and hands every
specialized check to the skill or script that owns it — it reimplements none of them.

**Disposition: report, don't gate.** No *finding* stops the deploy. The deploy is
mechanically safe regardless (the installer is idempotent, manifest-tracked, and never
touches a dir it didn't install), so drift and red checks are surfaced loudly as follow-ups
rather than used as a gate. The **only** hard stop is a mechanical impossibility — a
non-fast-forward pull — because merging the user's divergent work is not sync's call.

## Steps

1. **Snapshot the before-state.** Record what you're about to change against:

   ```bash
   git rev-parse HEAD                        # commit before the pull
   tkt --version                             # tkt version before
   node scripts/install-skills.mjs list      # per-root installed counts before
   ```

2. **Pull safely (the one hard gate).** Fetch, show the gap, fast-forward only:

   ```bash
   git fetch
   git status -sb
   git pull --ff-only
   ```

   If `--ff-only` refuses (local commits have diverged from upstream), **stop and report**.
   Do not auto-merge or auto-rebase the user's work — that's their decision, surface it and
   let them choose. Everything below assumes the pull fast-forwarded.

3. **Reconcile tickets if the pull touched `.tickets/`.** If the diff from step 1's HEAD to
   now changed anything under `.tickets/`:

   ```bash
   tkt rebase --dry-run     # show ID collisions (upstream always wins)
   tkt rebase               # apply if collisions exist
   tkt validate --brief     # structural health after the rebase
   ```

   A `tkt rebase` renumber is a repo change tkt owns: **commit it** (`chore(tickets):
   rebase ids after sync`) so the tree stays clean, matching tkt's own push convention.
   This step fixes **ID collisions only** — if the board itself needs real grooming
   (stale WIP, untracked work, re-ordering), that's **`reconcile-tickets`**'s job; name it
   as a suggested follow-up rather than running it inside sync.

4. **Check tkt drift if tkt changed.** Compare `tkt --version` now against the snapshot. If
   it changed, the skills' inlined tkt commands may have drifted — hand to the skill that
   owns that check:

   > Call the Skill tool with **`verify-tkt-usage`** (it diffs every inlined tkt command
   > against the live `tkt capabilities` manifest).

   Report whatever it finds in the final delta (step 7). **Do not gate the deploy on it** —
   drift is a follow-up to fix, not a reason to leave the harnesses stale.

5. **Verify repo invariants.** Run the consistency checker (it owns installer-safety,
   invocation-policy, doc-consistency, and `tkt validate`):

   ```bash
   node scripts/check-repo.mjs
   ```

   If it's red, **report the failure** and still proceed to deploy (the installer is safe
   regardless); flag the red check as needs-fixing. A green run is the normal case after a
   clean pull.

6. **Redeploy to the harnesses.** Push the current skills back out to every owned root and
   refresh the Antigravity (`agy`) plugin if `agy` is installed:

   ```bash
   node scripts/install-skills.mjs --dry-run   # if step 1 showed a surprising count delta
   node scripts/install-skills.mjs             # copy into every owned harness root
   node scripts/build-agy-plugin.mjs install   # rebuild, validate, and install the agy plugin (skip if agy is absent)
   ```

   The installer is idempotent: it refreshes changed skills, adds new ones, and prunes
   skills removed upstream. User-level roots (`~/.kiro`, `~/.codex`, `~/.claude`,
   `~/.agents`) are the default, and `build-agy-plugin.mjs install` refreshes the global
   `grey-matter` plugin in `~/.gemini/config/plugins/` (where `agy` discovers skills).
   Crush reads **project** roots only, so for it note `node scripts/install-skills.mjs --project`
   inside each project that wants it — sync doesn't chase project roots.

7. **Report the delta.** One compact summary, most-pressing-first:

   - **Commits pulled** (`git log --oneline <before>..HEAD`).
   - **Skills changed**: added / modified / pruned, the **per-root count** after, and
     whether the `agy` plugin was refreshed.
   - **tkt**: version before → after, and any **drift** `verify-tkt-usage` found.
   - **Ticket health**: whether a rebase ran, and `tkt validate` status.
   - **Repo check**: green, or exactly what `check-repo.mjs` flagged.
   - **Follow-ups**: e.g. "run `reconcile-tickets`", "fix the drift in skill X", "`--project`
     install for Crush in repo Y".

   Optionally confirm with one live discovery probe on the primary harness
   (`kiro-cli chat --no-interactive --trust-all-tools "list the skills available to you"`).

## Notes

- **Requires `git`, `node`, and `tkt`.** The pull and the installer are cross-platform;
  `tkt` is local.
- **Inbound twin of `release`.** `release` is the outbound half (tag + publish the repo);
  `sync` is the inbound half (pull + redeploy locally). Neither runs the other.
- **Not `orient`.** `orient` is bias-to-action onto the frontier at session start; `sync`
  is a deliberate maintenance pass. If you just pulled, run `sync` *before* `orient` so the
  board and the deployed skills are current before you pick up work.
- **Deploy is local.** Steps 1-5 may change the repo (only a `tkt rebase` commit); step 6
  writes to harness roots, never the repo. After sync the working tree is clean apart from
  that one possible rebase commit.

## It's working if

- `git pull --ff-only` fast-forwarded (or sync stopped cleanly and told you why it couldn't).
- Every owned harness root reports the same skill count as the repo has, with new skills
  present and removed ones pruned.
- A tkt version change surfaced a `verify-tkt-usage` report; a clean tkt did not.
- The delta names exactly what changed and what to follow up on — and nothing was gated:
  the harnesses are current even when a finding needs later attention.
