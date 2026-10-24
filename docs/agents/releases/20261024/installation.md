# Coordinated staged installation

These are unpublished candidates: grey-matter 0.2.0 (`e071b7b03d02025dc1af6c3ff2c4f8369f777587`) and tkt 0.5.0 (`2b6ff173993c9fe413c40287fb1cb3f0a9879ca1`). The staged artifacts and release-note drafts are ready for review. Registry, latest-release and stable URLs do not deliver these candidates. No public plugin-directory listing is included.

## Prerequisites and compatibility

Install the tkt CLI separately from its four workflow skills. Use a matching reviewed 0.5.0 executable from the sealed CI stage for candidate validation; plugins do not install it. Compilation requires Rust 1.85.0 or newer. Maintenance and Claude hooks require Node 22 or newer. The measured client versions are Codex 0.147.0, Claude 2.1.310, Antigravity 1.4.6, Kiro 2.34.0, OpenCode 1.18.21 and Crush 0.98.1. Future vendor versions and future unversioned tkt dependencies need their own compatibility check.

The candidate READMEs and changelogs are preserved as byte-exact `.snapshot.txt` files alongside each product's note draft. Read their relative links in the matching candidate checkout. The grey changelog includes Codex/Antigravity distribution, duplicate-safe deployment, spike-options, delivery-dashboard, session workflows and the Claude push gate. The tkt changelog includes four workflows, SessionStart guidance, audit baseline configuration, package identity/closure fixes and the Rust toolchain floor.

## Claude: install dependency first

Verify `SHA256SUMS` and `release-metadata.json`, then extract each product's **Claude** archive into its own empty directory. Set `TKT_PACKAGE` and `GREY_PACKAGE` to the absolute extracted roots containing `.claude-plugin/marketplace.json`:

```sh
claude plugin marketplace add "$TKT_PACKAGE"
claude plugin install tkt@tkt --scope user
claude plugin marketplace add "$GREY_PACKAGE"
claude plugin install grey-matter@grey-matter --scope user
```

These are the dependency-first steps used by the successful native probes. The compact archive README assumes dependency marketplaces are already registered. Root CLAUDE.md is repository guidance; it is not automatically loaded plugin context. The tkt SessionStart hook supplies the launch project's frontier when the CLI is on PATH; grey-matter's PreToolUse hook checks recognized agent Git pushes. The installed Git pre-push gate covers other push paths. Restart sessions after refreshing plugins.

## Codex, Antigravity and bare roots

Use each host's matching archive rather than its Claude archive. Codex packages contain namespaced skills and suppress Claude hook discovery; Antigravity packages include their flat skill payload and policy metadata. Use the pinned native installation commands recorded in the [compatibility evidence](../../research/evidence/plugin-compatibility-catalogs-20261024.json) and platform reports. These candidate installation checks use owned test homes, not a production profile migration.

For checkout-based development installation, run each pack's canonical deployer **once**: `node scripts/deploy.mjs` for grey-matter, `node tools/deploy.mjs` for tkt. It refreshes enabled local plugins and selects bare roots to avoid duplicate discovery. `sync` invokes the same command; wrappers are alternatives, so do not run them as additional deploy steps. Inspect `audit` before and after migrating a real profile. Preserve unowned skills; an unowned warning alone is not permission to delete a directory.

## Updates, migration and reproduction limits

The unqualified GitHub marketplace examples in the candidate READMEs track development defaults. A pinned version identifies a release; `stable` is a release-only channel promoted after immutable publication and does not exist merely because it is documented. Update a selected marketplace, update the selected plugin, then restart the session. Do not assume every host repairs a same-version cache identically; the recorded probes test each supported path.

Old Windows Git Bash tkt installs can be regular copies. The migration tool preserves those copies for explicit source/file-list/byte review; remove only confirmed owned duplicates with a rollback backup. SharkTank's authorized cleanup is recorded in the [Windows completion report](../../research/windows-native-validation-completion-20261024.md). Windows Codex reads the real Known Folder shared root despite HOME/USERPROFILE overrides, so those variables alone do not isolate its catalog. The final complete catalog passed after actual duplicate cleanup.

Native Kiro reproduction must set `KIRO_HOME` as well as the disposable HOME/config roots. Pin Antigravity 1.4.6 with an updater-disabling child launcher; an ambient updater flag can be dropped by the canonical helper. Windows/Linux network isolation was unavailable. Catalog checks do not prove every model activation or authenticated interactive hook. Windows Antigravity uses actual plugin inventory plus byte-identical installed-payload shadow loading; no authenticated live session is claimed. See the [Linux report](../../research/linux-native-validation-20261024.md) and Windows completion report for executable receipts, sources and raw archives.
