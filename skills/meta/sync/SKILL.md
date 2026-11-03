---
name: sync
description: "Pull grey-matter current and re-synchronize the coupled pieces — deployed skills, the tkt command surface, ticket IDs, and repo invariants — then redeploy. Use when updating this repo and pushing the skills back out to the harnesses, or asking to 'pull and deploy' / 'sync and redeploy'."
disable-model-invocation: true
---

# Sync

Tracked script roles, task-specific usage routing and the on-demand inventory update
procedure live in [orchestrate's tool-script catalog](../../engineering/orchestrate/references/tool-scripts.md).

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
4. **Repo invariants.** `gate.mjs pre-merge` checks indexes, links, invocation sidecars and
   the ticket graph. Its result gates a dependent commit or push that carries the relevant
   changes; a red result is a follow-up only when no such dependent mutation is planned.

Read the [release contract](../../../docs/agents/release-contract.md) when choosing
development, stable or pinned sources. Sync refreshes the configured source; it
does not publish a release or promote stable.

**Sync is an orchestrator.** It does the pull/deploy *judgement* itself and hands every
specialized check to the skill or script that owns it — it reimplements none of them.

**Disposition: findings and required gates differ.** Drift, guidance findings and optional
observations are reported without gating. A required verification result gates only the
dependent mutation it protects: do not commit, push, publish or deploy work that requires a
red or unresolved gate. A safe read-only investigation or an independently safe operation may
continue. The deployer's installer safety does not make an unrelated required gate pass. A
non-fast-forward pull or failed plugin refresh remains a mechanical stop; preserve existing
copies when a refresh fails.

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

4. **Check tkt compatibility before deploying its pack.** Call **`verify-tkt-usage`** for
   every tkt pack deployment, even when the installed CLI version is unchanged. It records
   the CLI executable/version/build, pack commit, commands, working directory and environment
   identity, then checks the actual CLI help where the capabilities manifest is partial.
   If the pack uses an unsupported command or flag, stop that pack deployment. Ask the owner
   to choose a pack release tag compatible with the installed CLI or approve a CLI upgrade;
   do not infer that updating the pack upgrades the CLI. Report the finding and choice in the
   final delta (step 7). An unrelated pack may proceed only if its deployment is independent.

5. **Synchronize owned tools and verify invariants.** Resolve tkt's registered checkout
   from `skill-packs.json`. Before a tkt vendor repair, fetch its configured upstream and
   compare history and vendor files:

   ```bash
   git -C /path/to/tkt fetch
   git -C /path/to/tkt status -sb
   git -C /path/to/tkt log --oneline --left-right HEAD...@{upstream}
   git -C /path/to/tkt diff HEAD @{upstream} -- tools/deploy.mjs
   ```

   If tkt is behind, inspect the upstream vendor bytes before fast-forwarding. If it is
   ahead or diverged, compare both versions and ask the tkt owner before dropping or
   rebasing any local commit; matching vendor bytes do not authorize a history rewrite.
   The repair command refuses dirty vendor paths, unregistered checkouts, and any
   ahead/behind history. After owner-approved history alignment and a clean tree, use
   `node scripts/sync-release-tools.mjs --target /path/to/tkt --deployer` to inspect the
   deployer vendor, then add `--write` to repair it. The output identifies the owner and
   records its hash in tkt. If shared release modules changed, use the existing command
   without `--deployer` to check/sync that owned inventory independently. Keep tkt's
   private package/lock aligned with canonical development dependencies. A foreign/local
   edit refusal is a mechanical stop; preserve the files and report it. Run `mise run
   check` in tkt, then commit/push the owned update. A tkt-only installation runs its own
   copies and needs no grey-matter checkout. Do not add another deploy inside this step.

   Run the consistency checker (it owns installer-safety,
   invocation-policy, doc-consistency, and `tkt validate`):

   ```bash
   node scripts/gate.mjs pre-merge
   ```

   Read the completed result. If it's red or unresolved, record the check and its owner; do
   not commit or push changes that depend on it. Deployment may proceed only when it is an
   independent, locally safe refresh and no required verification gate protects that
   deployment. Otherwise stop before deploy. A green run records the result for the delta.

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

   Then refresh the standing rules and check this machine's guidance for rot (read-only):

   ```bash
   node scripts/install-agents-md.mjs
   node scripts/check-guidance.mjs
   ```

   A refused target (a hand-edited block or a generated file) and each guidance finding are
   follow-ups for the user; don't `--force` without them.

7. **Report the delta.** One compact summary, most-pressing-first:

   - **Commits pulled** (`git log --oneline <before>..HEAD`).
   - **Skills changed**: added / modified / pruned, the **per-root count** after, and
     which plugin caches were refreshed.
   - **tkt**: version before → after, and any **drift** `verify-tkt-usage` found.
   - **Ticket health**: whether a rebase ran, and `tkt validate` status.
   - **Repo check**: command and completed outcome, or unresolved gate with owner; distinguish
     required gates from optional findings.
   - **Agent shell**: `ok`, `n/a`, or each `probe-agent-shell.mjs` finding with its fix.
   - **Critic models**: each harness's `probe-critic-model.mjs` line (model it ran on, ceiling, auth).
   - **Guidance**: standing-rules install result, and each `check-guidance.mjs` finding.
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
- Every tkt pack deployment has a `verify-tkt-usage` report, including when the CLI version
  is unchanged; an incompatible pack is held until the owner chooses a compatible release
  tag or approves a CLI upgrade.
- The delta names exactly what changed and what still needs follow-up, including any held
  pack deployment and the owner's compatibility choice.
