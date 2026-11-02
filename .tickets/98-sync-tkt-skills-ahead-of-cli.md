---
id: "98"
title: "sync can deploy tkt skills from a dev checkout that are ahead of the installed tkt release CLI"
status: done
blocked_by: []
validation_criteria:
  - "A fixture where pack skills use a flag the installed CLI lacks is reported before deploy"
  - "sync documents whether to pin the tkt pack to the installed CLI's tag or upgrade the CLI"
  - "`verify-tkt-usage` records the CLI identity it checked (version and build hash) and reruns when that identity, the pack commit or the command changes; a stored result is reused only when all of them match"
tags: ["type:enhancement","stream:test-verification"]
priority: medium
---

# sync can deploy tkt skills from a dev checkout that are ahead of the installed tkt release CLI

## Observed (2026-10-28 sync, macOS host)

- Installed CLI: tkt 0.4.0 (crates.io release). tkt checkout: `main` at 7834976.
- `3105683 feat(tickets): enforce invocation-scoped agent eligibility` added to all four
  tkt skills: identify with global `--agent <slug>` or `TKT_AGENT` before `ready`/`claim`,
  and `--agents` / `--exclude-agents` on `new`, `batch`, `edit`.
- tkt 0.4.0 rejects both: `tkt --agent kiro ready` and `tkt new ... --agents codex` fail
  with `unexpected argument`.
- `verify-tkt-usage` only runs when the tkt version changes, so a pack refresh against an
  unchanged CLI is never checked. Sync was held manually: grey-matter deployed, tkt pack
  left at the copies that match 0.4.0.

Seen again 2026-10-31 (Windows host): the installed CLI reports tkt 0.4.0 (92d4833) and warns `unknown config key "audit.resolution_baseline_id"` for the tkt checkout's `.tickets/config.toml`, so the checkout is also ahead of the CLI in config keys. The same pre-deploy check should surface it.

## What to build

Before deploying the tkt pack, check the pack's inlined commands against the installed CLI
(not only on a CLI version change); when they disagree, either deploy the pack from the
CLI's release tag or say the CLI must be upgraded. Document the choice in sync.

## Acceptance criteria

- [x] A fixture where pack skills use a flag the installed CLI lacks is reported before deploy
- [x] sync documents whether to pin the tkt pack to the installed CLI's tag or upgrade the CLI
- [x] `verify-tkt-usage` records the CLI identity it checked (version and build hash) and reruns when that identity, the pack commit or the command changes; a stored result is reused only when all of them match

## Scope change (2026-10-29, ticket 101)

Workflow-guidance recommendation 5 (high confidence against unbound reuse): a stored
verification result is only valid for the commit, command, working directory, environment
and executable it ran against. Today `verify-tkt-usage` reruns only when the tkt version
changes, which is how this ticket's drift went unnoticed. Pairs with tkt ticket 153
(stale-binary guard).

## Workstream reconciliation 2026-11-02

Scope: `stream:test-verification`; execution order and completion requirements are in the
[workstream plan](../docs/plan.md#test-optimization-and-verification).

Next: compare pack commands against the actual installed CLI and bind reuse to executable/build,
pack commit, command, directory and environment identities. At reconciliation the installed CLI is
still tkt 0.4.0 (92d4833), whose help lacks tag-edit/agent flags advertised by newer skills. #120
handles vendor repair; do not silently upgrade the CLI or treat a pack deployment as compatibility
proof.

Status remains open. This reconciliation adds no implementation or fresh host-validation claim;
verify the ticket's premises against current source and run its acceptance checks when picked up.

## Delegated implementation 2026-11-02

Worker commits 1ec69b8 and 7e4ad74 add the command/flag compatibility audit, exact-identity
help-result reuse, fixtures and mandatory pre-pack-deploy guidance. Critic required stale sync
success bullets to match the stop-on-incompatibility contract; corrected review accepted.
Focused fixtures pass 3/3, including partial capabilities falling back to actual help,
unsupported flags and identity changes invalidating reuse. Prose-only references and enum
values remain manual review; absence from a capabilities listing alone is not proof.

The read-only production audit of tkt 0.4.0 (92d4833) against companion pack commit 62c8226
checked 67 commands and correctly returned exit 1 for unsupported global --agent and new
--agents. The identical second invocation reported reused:true. No CLI upgrade or incompatible
tkt pack refresh occurred. Root private integration pre-merge passed all 20 commands, then
the latest reviewed documentation merge passed its selected ticket-graph check; main was
fast-forwarded and pushed with all seven pre-push checks passing. Canonical deploy check and
deployment passed, installing 50 grey-matter skills. Initial worker missing-dependency and
gate-runner EBUSY failures were infrastructure errors; subsequent worker20/20 and root20/20
runs passed. Keep t98-worker and shared integration checkout through final stream cleanup;
worker audit caches and dependency junction were removed. Evidence is promoted here and in source.

## Resolution (2026-11-02)

done: CLI/pack compatibility audit and exact-identity reuse shipped, reviewed, merged, pushed and deployed. Installed tkt/pack incompatibility is detected and pack deployment held; no upgrade chosen or performed. Prose/enum coverage remains manual. Evidence promoted in ticket/source; keep t98-worker and shared integration artifacts through final stream cleanup, worker caches/junction removed.

### Verification
1. ✓ A fixture where pack skills use a flag the installed CLI lacks is reported before deploy — "Focused3/3 fixture suite reports unsupported flags before deployment, partial capabilities fall back to help. Actual CLI0.4.0/pack62c8226 audit checks67commands and correctly fails agent/agents; no incompatible pack deployed."
2. ✓ sync documents whether to pin the tkt pack to the installed CLI's tag or upgrade the CLI — "Sync guidance requires audit every pack deployment; incompatible pack held for owner choice of compatible release tag or CLI upgrade. Critic stale-summary finding corrected7e4ad74 and accepted."
3. ✓ `verify-tkt-usage` records the CLI identity it checked (version and build hash) and reruns when that identity, the pack commit or the command changes; a stored result is reused only when all of them match — "CLI version/build/path/hash, prefix, capabilities, packHEAD/root, commandinventory,cwd,envhash bind help reuse; fixtures invalidate on changedidentity and confirm exactreuse; live secondcheck reusedtrue. Root20/20 premerge7/7prepush and deployment50skills pass."
