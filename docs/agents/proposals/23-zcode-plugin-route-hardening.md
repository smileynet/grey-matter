# Harden the ZCode plugin route after the Windows install trial

Status: proposed, 2026-11-08. Builds on
[zcode-plugin-compat research](../research/zcode-plugin-compat-20261108.md)
(ticket 273) and the landed tickets 274/280 (ZCode harness entry, `zcodePlugin`
probe, `refreshZcode`, `install-agents-md` zcode row).

A Windows trial (2026-11-08) installed both plugins — `grey-matter@grey-matter`
0.2.0 and `tkt@tkt` 0.4.0 — by replicating the app's state files, then verified
through the bundled CLI (`plugins list`, `skills list`: 50 + 4 skills resolve
with bare-name aliases). The trial surfaced deltas the macOS spike could not.

## New findings

1. **Windows CLI path is absent from `refreshZcode`.** `deploy.mjs` hardcodes
   the darwin bundle path and yields `null` elsewhere, so Windows deploys skip
   plugin refresh unless `ZCODE_CLI` is set. Verified working path on Windows:
   `%LOCALAPPDATA%\Programs\ZCode\resources\glm\zcode.cjs` (Electron install;
   the CLI runs fine under `node` from Git Bash).
2. **The default-enabled assumption is wrong on this build.** `zcodePlugin`
   treats a cache hit with no `enabledPlugins` entry as covered ("a plugin with
   no entry is enabled by default"). Observed on ZCode 0.17.1 Windows: install
   records with no config entry list as `[disabled]`; the app's own install
   flow works because it writes the enable entry (`plugins enable` wrote
   `~/.zcode/cli/config.json`). So the fallback can claim coverage for a
   disabled install, and `deploy` would prune the working copy thinking the
   plugin carries the pack. The `zcode-guide` "enabled by default" wording
   describes the app-mediated flow, not foreign records (prior art; we plan for
   observed behavior).
3. **The tkt dependency is inert where resolvers read it.** grey-matter's
   plugin manifest declares `dependencies: [{name: tkt, marketplace: tkt}]`,
   but the marketplace entry in `.claude-plugin/marketplace.json` does not, and
   resolution (ZCode `JGr`, Claude Code the same) reads the **entry**. Result:
   no auto-install, no prompt, no enforcement (spike-confirmed). The wiring
   exists only as prose in the marketplace description.
4. **Marketplace staging is a blind full copy.** A directory-source add copies
   the whole source tree — a dev checkout drags `node_modules`, `.git`, Rust
   `target/` (the trial trimmed to ~9 MB per plugin by hand; untrimmed was
   ~300 MB). Committed
   [research evidence](../research/evidence) (715 files, ~107 MB) also rides
   every GitHub-source install of this marketplace.
5. **tkt ships two plugin manifests.** Root `plugin.json` plus
   `.claude-plugin/plugin.json`; ZCode probes only the dotted dirs and the
   vendored deployer reads only `.claude-plugin/plugin.json`. Two name/version
   authorities (plus `Cargo.toml` as the release authority) is a drift hazard;
   today all three agree at 0.4.0.
6. **tkt's `skills` field is implicit.** The manifest declares no `skills`;
   ZCode's default `skills/` root collection covers it (trial-verified), but
   grey-matter declares its roots explicitly. Implicit works; explicit matches
   the house style and survives default-behavior changes.
7. **Docs drift.** `AGENTS.md`'s deploy paragraph lists Claude, Codex,
   Antigravity, and Kiro — not the ZCode refresh `deploy.mjs` now performs.
8. **No first-install recipe.** `deploy` refreshes an installed plugin; a fresh
   machine has no scripted `marketplace add` + `plugins install` + `plugins
   enable`. The trial proved state-file replication works but the CLI is the
   authoritative tool; the scratch installer is not durable (`.scratch/`).

Cross-machine note: the macOS spike left `grey-matter@grey-matter` 0.1.0
installed while Windows now runs 0.2.0. Local-directory snapshots do not sync;
a published GitHub-source marketplace would let `plugins update` converge both
machines.

## Fixes — grey-matter

- **G1 (P1, small):** `refreshZcode`: probe `ZCODE_CLI`, then the darwin path,
  then `%LOCALAPPDATA%\Programs\ZCode\resources\glm\zcode.cjs` on win32.
- **G2 (P1):** `zcodePlugin`: count only an explicit `true`; when the CLI is
  reachable, verify enable state from `plugins list` output (mirrors
  `claudeInventory`). End `refreshZcode` with an idempotent `plugins enable`.
  Correct the code comment to the observed rule: no entry = disabled for
  foreign records.
- **G3 (P2):** Add `"dependencies": [{"name": "tkt", "marketplace": "tkt"}]`
  to the marketplace entry (object form; the ZCode normalizer accepts it and
  builds `tkt@tkt` ids). Alternatively drop the dependency from the plugin
  manifest — decide which truth we keep.
- **G4 (P2, docs):** `AGENTS.md` deploy paragraph + distribution-maintenance:
  add the ZCode refresh sentence and record the Windows state layout
  (`~/.zcode/cli/plugins/{marketplaces,cache,known_marketplaces.json,installed_plugins.json}`,
  config at `~/.zcode/cli/config.json`, app at `%LOCALAPPDATA%\Programs\ZCode`).
- **G5 (P3):** First-install script (CLI-driven: marketplace add this checkout,
  install `<pack>@<marketplace>`, enable) so a fresh machine reaches the state
  `refreshZcode` maintains. Replaces the scratch state-replication approach.
- **G6 (P3, needs a policy call):** Reduce marketplace/install weight: prune or
  relocate aging research evidence per repository-artifact-hygiene lifecycles,
  and/or pack a minimal marketplace dir (skills, manifests, legal, runtime
  files — `metadata.deploy` already enumerates them) for the GitHub-source
  route.

## Fixes — tkt

- **T1 (P2):** Single-source the manifests: audit root `plugin.json` readers;
  delete it or generate it from `.claude-plugin/plugin.json`, and add a
  consistency check to the vendored static checks.
- **T2 (P3, one line):** Declare `"skills": "./skills"` explicitly in
  `.claude-plugin/plugin.json`.
- **T3 (P2):** Version-sync gate across `Cargo.toml`, root manifest (while it
  exists), and `.claude-plugin/plugin.json` in pre-push checks.
- **T4 (P3, pairs with G6):** Publish a GitHub-source marketplace so both dev
  machines install from one canonical source and `plugins update` converges
  them.

## Decision asks (resolved by prior-art research)

Researched in
[zcode-marketplace-prior-art-20261108](../research/zcode-marketplace-prior-art-20261108.md);
recommendations below.

1. **One route per machine: plugin or copy, never both.** The lineage states
   the rule outright ("pick one per agent, because installing both gives you
   every skill twice"); user-scope copies shadow plugin skills in ZCode, so
   dual routes hide staleness. Plugin route for managed machines (this Windows
   machine), copy route only where `deploy.mjs` owns the checkout; deploy's
   duplicate guard stays the enforcement.
2. **Declare the dependency in both places.** Claude binds `dependencies` in
   plugin.json (a dependency "starts enabled regardless of defaultEnabled");
   ZCode resolves only the marketplace entry's copy. Keep the manifest
   declaration and mirror the same object array on the entry — no version
   pins (plugin.json's version silently wins over an entry's; duplication is
   warned against).
3. **Archive source + hygiene sweep, no LFS.** Publish the marketplace with an
   `archive` plugin source pinned to the release bundle sha256 (both repos'
   `release-artifacts.mjs` already build closed per-host bundles; the Claude
   bundle is ZCode-compatible). Local-directory adds remain the dev-machine
   route. Separately, run the repository-artifact-hygiene lifecycle over
   `docs/agents/research/evidence/` (715 files, ~107 MB) — findings are
   promoted into the research notes; superseded evidence deletes, keepers get
   lifecycle scopes. LFS is ruled out: clones never fetch LFS content,
   leaving pointer files.

## Suggested ticket split

grey-matter: G1+G2 (deploy correctness, one ticket), G3 (decision + one-line
change), G4 (docs sync), G5 and G6 backlog. tkt: T1+T3 (manifest
single-sourcing + gate), T2 fold into T1, T4 backlog pending the grey-matter
publish decision.
