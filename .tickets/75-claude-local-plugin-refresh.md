---
id: "75"
title: "Refresh Claude local plugins when source changes without a version bump"
status: in_progress
blocked_by: []
priority: high
validation_criteria:
  - "A same-version source change reaches the installed Claude plugin through one portfolio deploy."
  - "Refresh verifies the local marketplace binding and preserves the prior deployment on failure."
  - "Strict portfolio audit reports no source mismatch after adding a skill; normal deploy verifies or refreshes each enabled plugin once."
tags: ["stream:tooling"]
---

# Refresh Claude local plugins when source changes without a version bump

## Intent source

Found while implementing ticket 54 under the user's requirement that guidance/sync/
deploy refresh plugins on change through one deploy, without duplicate skill copies.

## What to build

The portfolio deploy verifies that every installed local development plugin loads
the registered checkout, even when the release version has not changed. For a
client that reads the folder directly, verify that selection once per enabled
plugin before pruning owned bare copies. Use supported refresh operations where
needed, preserving the working installation on failure. Release versions still change only during preparation.

## Observed failure

In the initial observation on 2026-10-23, Claude Code on PATH reported 2.1.223. Its known_marketplaces.json
registers grey-matter and tkt as directory sources at their respective checkouts.
The installed Claude cache still has 44 grey-matter skills after adding spike-options;
the source and refreshed Codex/AGY/bare roots have 45. Strict portfolio audit reports:
`claude plugin grey-matter@grey-matter: source mismatch (missing: spike-options; extra: )`.
`claude plugin update grey-matter@grey-matter` exits 0 and reports latest 0.1.0,
without changing the cache. This establishes a stale cache, but not which source
a fresh session selects. The 2.1.310 follow-up below verifies direct-folder selection.

## Context

Read `scripts/deploy.mjs` (claudePlugin, refreshCodex, doInstall),
`scripts/deploy.test.mjs`, `AGENTS.md` (keeping plugins current), and
`docs/agents/research/plugin-release-semantics.md`. The canonical engine is copied
into tkt `tools/deploy.mjs`; keep the vendor byte-identical. Read [local refresh research](../docs/agents/research/claude-local-refresh.md).
Official changelog records local-folder update fixes in 2.1.289; 2.1.223 is older.
Use supported client behavior before changing either cache or registration files.
Do not solve this with a release-version bump or a second bare skill installation.
Update guidance to match observed behavior, add failure/replay fixtures, and
verify both packs with a strict portfolio audit after one normal portfolio deploy.
This ticket blocks final release audit 70; source-authoring ticket 54 can retain
its own completion evidence without claiming Claude has refreshed.

## Acceptance criteria

- [ ] One portfolio deploy makes a same-version source addition visible in Claude's installed plugin.
- [ ] Foreign marketplace bindings and failed refreshes preserve the working deployment.
- [ ] Fixtures prove one source verification or refresh per pack, no extra bare copies, and harmless replay.
- [ ] Guidance, sync, and the vendored tkt engine agree with the supported refresh path.
- [ ] Strict live portfolio audit passes for both packs.

## Verified implementation direction

Claude's supported updater moved this machine to 2.1.310. `plugin list --json`
now exposes enabled `readFromFolder` values for both local checkouts, while
`installPath` still names the old historical caches. `plugin update` explicitly
reports direct folder loading with reload/new-session semantics. No extra
installation or cache edit is needed. Verify this source selection in normal
deploy before pruning, and audit the active folder rather than the historical
cache; reject legacy/foreign/failed CLI observations. See the research follow-up.

## Implementation and live evidence

Engine 1.5.0 verifies enabled Claude `readFromFolder`/`folderVersion` against the
checkout before pruning. Disabled plugins permit bare-root coverage; failed,
foreign, ambiguous and legacy source observations preserve existing copies.
Audit uses enabled CLI rows, selects active folders ahead of historical caches,
and makes unverifiable local selection an explicit strict finding.

One live portfolio deploy verified both Claude packs once and refreshed both
Codex caches once. Strict audit passes: 19 plugins across four portfolio entries,
zero findings/errors; grey-matter has 45 skills and tkt four through Claude and
Codex. [Recorded evidence](../docs/agents/research/evidence/claude-active-source-20261023.json)
binds the canonical engine hash and vendor equality. Local checks pass all 12
grey invariants (including 32 deploy fixtures), 14 tkt Node checks and six tkt
Rust deployment tests. Source-selection evidence is not a new-chat model capture;
hosted Windows/Linux checks and final candidate probes remain separate gates.
