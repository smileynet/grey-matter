---
name: sync
description: "Pull grey-matter current and re-synchronize the coupled pieces — deployed skills, the tkt command surface, ticket IDs, and repo invariants — then redeploy. Use when updating this repo and pushing the skills back out to the harnesses, or asking to 'pull and deploy' / 'sync and redeploy'."
disable-model-invocation: true
---

# Sync

Refresh configured sources and their installed skills. Read the
[release contract](../../../docs/agents/release-contract.md) for development, stable
and pinned delivery; sync never publishes or promotes a release. Delegate specialized
checks to their owning scripts/skills, indexed in [the tool-script catalog](../../engineering/orchestrate/references/tool-scripts.md).

## Boundaries

Preserve unrelated edits, foreign installs and local commits. Fast-forward a clean,
behind-only registered checkout only within the authorized source scope. Divergence,
conflicting edits or source/channel changes need the owner's decision; never reset,
auto-merge or auto-rebase them.

Carry existing authorization through retries, including CLI upgrades and session-scoped
footprint exceptions. Follow [artifact hygiene](../repository-artifact-hygiene/SKILL.md#while-you-work)
for disk checks; sync creates no blanket low-space exemption. Await every command's
completed result before starting dependent work.

Required gates protect dependent mutations. Unsupported usage holds the affected
pack; a failed refresh preserves existing copies. Host-health findings and unrelated
failures are reported separately. Never turn a baseline failure into a dependent pass.

## 1. Snapshot and update sources

Record the original SHA, dirty paths, selected source/channel and installed counts:

```bash
git rev-parse HEAD
git status -sb
tkt --version
node scripts/deploy.mjs list
git fetch
git log --oneline HEAD..@{upstream}
```

Resolve the selected source before updating. Only after confirming a clean,
behind-only checkout on that source, run `git pull --ff-only`; an already-current
checkout needs no pull. Apply the boundaries above to dirty or divergent history.

**After pulling, re-read this checkout's skills/meta/sync/SKILL.md.** Cached skills can
name retired commands. Continue with the current workflow while retaining the original
pre-pull SHA, completed steps and authorization. Do not restart the snapshot.

Resolve active packs from skill-packs.json; inventory-only entries are not update
targets. Snapshot each authorized checkout before fetching. For tkt:

```bash
git -C /path/to/tkt fetch
git -C /path/to/tkt status -sb
git -C /path/to/tkt log --oneline --left-right HEAD...@{upstream}
git -C /path/to/tkt diff HEAD @{upstream} -- tools/deploy.mjs tools/deployer-vendor.json
```

Inspect upstream vendor bytes, then fast-forward clean behind-only development
checkouts when authorized. Otherwise name the held pack and continue independent work.
Pinned/stable sources keep their selection; never switch them to main to cure drift.

## 2. Establish CLI compatibility before ticket operations

Resolve the native installed tkt executable, not just a mise shim. Compare its full
version/build hash with the selected checkout; product versions can remain identical
across incompatible development builds. Identify required commands from pack usage
and current help, including lifecycle features needed by pulled tickets (such as
cancel/cancelled). Updating the pack does not update the binary.

Run [verify-tkt-usage](../verify-tkt-usage/SKILL.md) for every deploying pack that inlines
tkt usage, even when the product version is unchanged:

```bash
node scripts/verify-tkt-usage.mjs --pack /path/to/tkt --tkt /native/path/to/tkt
node scripts/verify-tkt-usage.mjs --pack /path/to/grey-matter --tkt /native/path/to/tkt
```

Exit 1 means unsupported usage; exit 2 means the audit could not complete. Neither
proves compatibility. Fix a faulty checker with fixtures rather than treating a patched
temporary checker as official evidence. Capabilities can be partial; actual help is
the tiebreaker. Review named prose and enum usage outside the extractor's coverage.

If an upgrade is needed and already authorized, run cargo install --path . --locked
in the selected clean tkt checkout, then bash tools/check-binary-fresh.sh, tkt --version,
required help probes and both audits again. Otherwise ask once for a CLI upgrade or
compatible pack release. Hold only dependent packs. Never edit ticket statuses to
make an old CLI parse them.

## 3. Reconcile ticket IDs and owned tools

For each pulled checkout whose .tickets/ changed, run tkt rebase --dry-run and
tkt validate --brief. Apply tkt rebase only for collisions (upstream wins), then
validate again. Commit/push renumbering as chore(tickets): rebase ids after sync.
Board grooming belongs to reconcile-tickets, a separate follow-up.

After history alignment, inspect both owned inventories:

```bash
node scripts/sync-release-tools.mjs --target /path/to/tkt --deployer
node scripts/sync-release-tools.mjs --target /path/to/tkt
```

Add --write only for owned drift. Recheck after pulling: upstream may already contain
the repair. A foreign/local edit refusal stops that repair; preserve the files.
Keep tkt's private package/lock aligned when canonical dependencies change. Verify
owned vendor updates with `mise run check` in tkt and the applicable grey-matter
gates in step 4, then commit/push before deployment.
Do not deploy separately inside this step.

If cargo, bash or another dependency is unavailable, record the exact failed command
and owning ticket. Use a documented equivalent only when it checks the same contract;
otherwise leave the required gate unresolved. Compare against the original source
when needed to distinguish an existing failure from a regression.

Use GIT_TERMINAL_PROMPT=0 for unattended Git and bound external credential helpers.
After authentication/push failure, inspect retained commits and fetch/compare upstream
before retrying the push. Do not repeat ticket mutations or recreate local commits.

## 4. Verify the pulled range

Use the original grey-matter pre-pull SHA, not the new origin/main:

```bash
node scripts/gate.mjs pre-merge --base <pre-pull-sha>
```

Read selected paths and completed outcomes. The runner judges committed bytes;
uncommitted fixes need applicable direct checks, then verification of the committed
result before push. Zero selected checks prove nothing about excluded paths. Required
failures hold dependent mutations; independent safe refreshes may proceed only when
no required deployment gate protects them.

## 5. Deploy and resume by observed target state

Preflight compatibility and owned vendor alignment first. Run
`node scripts/deploy.mjs check` and `node /path/to/tkt/tools/deploy.mjs check` for the
packs being deployed; these include native checks that installation alone omits.
For multiple updated packs:

```bash
node scripts/deploy.mjs --portfolio skill-packs.json
```

For one pack use node scripts/deploy.mjs. Use --dry-run first for surprising counts or
roots. The deployer validates generated Antigravity packages before installed-target
writes. Fix packaging at its owner; do not bypass strict warnings or activate linked
reference documents as rules.

After interruption, inspect which pack/root/plugin finished and rerun the same
authorized command. The installer compares requested and installed bytes, skips
current targets and repairs changed/missing outputs. Do not force, delete old installs
or call legacy wrappers to recover. Root ownership, Claude's local source/version and
Codex's local marketplace must still be verified. Report refused/unfinished targets
separately from successful ones.

```bash
node scripts/deploy.mjs audit --portfolio skill-packs.json
```

Report unowned directories without deleting them. Crush uses project roots only;
note node scripts/deploy.mjs --project inside projects that want it, without traversing
arbitrary projects. Kiro Crew owner/trust refusals retain the deployer's exact owner
instructions and remain pending, not successful activation.

## 6. Refresh guidance and report host health

```bash
node scripts/install-agents-md.mjs
node scripts/check-guidance.mjs
node scripts/probe-agent-shell.mjs
```

Guidance refusals and shell findings are independent follow-ups.
Never force generated/hand-edited guidance, apply shell settings, change model/provider
defaults or launch hosted checks without relevant authorization.

Live model qualification is not part of sync. Run the critic-model diagnostic only
when the user explicitly requests it; its model calls and forced-write probe are not
authorized by a routine sync or a harness upgrade. An unrun diagnostic is not an
outstanding deployment requirement. Keep its offline regression tests scoped to
changes to the diagnostic itself.

Other-platform native matrices belong to release-candidate qualification, not local
maintenance. Report platform-specific fixture skips as coverage limits without turning
them into a requirement to obtain another host before finishing sync.

## Report the delta

Lead with completed versus held deployments. Include commits pulled per checkout;
skills added/modified/pruned and per-root counts; plugin refreshed/current status;
CLI before/after builds and compatibility evidence; ticket rebase/validation; gate
scope/outcomes; guidance/shell findings and any explicitly requested diagnostic results;
and retained artifact scope.
Separate deployment success from host health. Restart chats/reload plugins to load
refreshed skills. Never claim a held target is current because another succeeded.
Sync is maintenance; orient picks the next frontier ticket afterward.
