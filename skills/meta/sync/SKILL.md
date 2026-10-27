---
name: sync
description: "Pull grey-matter current and re-synchronize the coupled pieces — deployed skills, the tkt command surface, ticket IDs, and repo invariants — then redeploy. Use when updating this repo and pushing the skills back out to the harnesses, or asking to 'pull and deploy' / 'sync and redeploy'."
disable-model-invocation: true
---

# Sync

The **inbound counterpart of `release`**. Sync pulls the configured source, aligns
its coupled state and refreshes local skills/plugins. Release handles versioned
preparation, staging and separately authorized publication.

The four couplings it keeps aligned:

1. **Repo ↔ deployed skills.** A pull can add, change, or remove skills; the harness scan
   roots and cached Codex/Antigravity plugins keep serving the old copies until
   `deploy.mjs` re-runs.
2. **Skills ↔ tkt command surface.** The skills inline tkt commands; a tkt upgrade can
   rename a flag or drop a subcommand and break a skill mid-task.
3. **Local tickets ↔ upstream tickets.** A pull can collide ticket IDs; `tkt rebase`
   resolves them (upstream wins).
4. **Repo invariants.** `check-repo.mjs` must stay green (indexes, links, invocation
   sidecars, installer safety).

Read the [release contract](../../../docs/agents/release-contract.md) when choosing
development, stable or pinned sources. Sync refreshes the configured source; it
does not publish a release or promote stable.

**Sync is an orchestrator.** It does the pull/deploy *judgement* itself and hands every
specialized check to the skill or script that owns it — it reimplements none of them.

**Disposition: report, don't gate.** No *finding* stops the deploy. The deploy is
mechanically safe regardless (the installer is idempotent, manifest-tracked, and never
touches a dir it didn't install), so drift and red checks are surfaced loudly as follow-ups
rather than used as a gate. Mechanical failures stop the run: a non-fast-forward pull or a failed plugin
refresh. Preserve existing copies when a refresh fails.

## Steps

1. **Snapshot the before-state.** Record what you're about to change against:

   ```bash
   git rev-parse HEAD                        # commit before the pull
   tkt --version                             # tkt version before
   node scripts/deploy.mjs list              # per-root installed counts before
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

5. **Synchronize owned release tools and verify invariants.** If the pull changed
   shared release modules, resolve tkt's registered checkout from `skill-packs.json`.
   When present, run `node scripts/sync-release-tools.mjs --target /path/to/tkt`
   to inspect drift, then `--write` for owned updates. Keep its private package/lock
   aligned with canonical development dependencies. A foreign/local edit refusal is
   a mechanical stop; preserve the files and report it. Run `mise run check` in
   tkt, then commit/push the owned update. A tkt-only installation runs its own copies
   and needs no grey-matter checkout. Do not add another deploy inside this step.

   Run the consistency checker (it owns installer-safety,
   invocation-policy, doc-consistency, and `tkt validate`):

   ```bash
   node scripts/check-repo.mjs
   ```

   If it's red, **report the failure** and still proceed to deploy (the installer is safe
   regardless); flag the red check as needs-fixing. A green run is the normal case after a
   clean pull.

6. **Redeploy to the harnesses.** Push the current skills back out to every owned root and
   refresh installed plugins through the single deploy command:

   ```bash
   node scripts/deploy.mjs --dry-run   # if step 1 showed a surprising count delta
   node scripts/deploy.mjs             # verify Claude source, refresh Codex, choose roots, refresh agy once
   node scripts/deploy.mjs audit       # report unowned dirs and skills a harness sees twice
   ```

   When step 5 changed both registered packs, replace the install line with
   `node scripts/deploy.mjs --portfolio skill-packs.json`; it refreshes each active
   pack once. Do not also run per-pack deploy commands or compatibility wrappers.

   The installer is idempotent: it refreshes changed skills, adds new ones, and prunes
   skills removed upstream. It picks user-level roots from its harness table so each harness
   sees each skill once (an installed Claude or Codex plugin counts as the copy), and refreshes
   the enabled Codex plugin cache and, when `~/.gemini` exists, the Antigravity plugin.
   For enabled Claude plugins, it verifies the CLI's active `readFromFolder` and
   `folderVersion` against this checkout before pruning; audit uses that folder,
   not a historical cache. Reload Claude plugins or start a new chat after edits.
   A failed, foreign or legacy source observation is a mechanical stop.
   Codex must use this
   checkout as its local marketplace; a refresh failure stops deployment before copies are
   removed. Run this command once; legacy wrappers are alternatives, not additional steps.
   Report `audit` findings; don't delete unowned dirs without the user.
   Crush reads **project** roots only, so for it note `node scripts/deploy.mjs --project`
   inside each project that wants it — sync doesn't chase project roots.

   Then probe this machine's agent shell (report-only; it never writes without `--apply`):

   ```bash
   node scripts/probe-agent-shell.mjs
   ```

   Each `finding` line carries its fix; carry it into the delta as a follow-up. Run
   `--apply` only when the user says so: `~/.claude/settings.json` is theirs. See
   [harnesses](../../../docs/agents/harnesses.md) ("Bash tool shell").

   Then check that critic models can still be pinned and proven here (one tiny call per
   harness; it reports, never changes anything):

   ```bash
   node scripts/probe-critic-model.mjs
   ```

   A `below-ceiling`, `unverified`, `not-authenticated` or `unavailable` line is a follow-up, not a
   failure. See [harnesses](../../../docs/agents/harnesses.md) ("Critic model").

7. **Report the delta.** One compact summary, most-pressing-first:

   - **Commits pulled** (`git log --oneline <before>..HEAD`).
   - **Skills changed**: added / modified / pruned, the **per-root count** after, and
     which plugin caches were refreshed.
   - **tkt**: version before → after, and any **drift** `verify-tkt-usage` found.
   - **Ticket health**: whether a rebase ran, and `tkt validate` status.
   - **Repo check**: green, or exactly what `check-repo.mjs` flagged.
   - **Agent shell**: `ok`, `n/a`, or each `probe-agent-shell.mjs` finding with its fix.
   - **Critic models**: each harness's `probe-critic-model.mjs` line (model it ran on, ceiling, auth).
   - **Follow-ups**: e.g. "run `reconcile-tickets`", "fix the drift in skill X", "`--project`
     install for Crush in repo Y".

   Optionally confirm with one live discovery probe on the primary harness
   (`kiro-cli chat --no-interactive --trust-all-tools "list the skills available to you"`).

## Notes

- **Requires `git`, `node`, and `tkt`.** The pull and the installer are cross-platform;
  `tkt` is local.
- **Not `orient`.** `orient` is bias-to-action onto the frontier at session start; `sync`
  is a deliberate maintenance pass. If you just pulled, run `sync` *before* `orient` so the
  board and the deployed skills are current before you pick up work.
- **Deploy is local.** Steps 1-5 may create ticket-rebase and owned vendor-update commits;
  step 6 refreshes harness roots/plugins. Commit/push those changes before deployment.

## It's working if

- `git pull --ff-only` fast-forwarded (or sync stopped cleanly and told you why it couldn't).
- Each harness sees the source skill set once, through its plugin or selected owned root,
  with new skills present and removed ones pruned.
- A tkt version change surfaced a `verify-tkt-usage` report; a clean tkt did not.
- The delta names exactly what changed and what to follow up on — and nothing was gated:
  the harnesses are current even when a finding needs later attention.
