# Plugin release semantics

Research date: 2026-10-23. Coverage: ✅ official Codex packaging and official Claude Code marketplace, loading, publishing, and CLI documentation read. Documentation findings; no installed-client behavior was tested.

## Supported facts

### Codex

- [L4:verified] Official packaging docs support Git marketplace registration with `codex plugin marketplace add owner/repo --ref <ref>` or `owner/repo@ref`, and refresh through `codex plugin marketplace upgrade [marketplace-name]`. Git-backed plugin entries separately support `ref` or `sha`; an unresolved entry is skipped rather than breaking the catalog. [Package your plugin](https://developers.openai.com/plugins/build/plugins#add-a-marketplace-from-the-cli)
- [L4:verified] Local marketplace installs load a cached copy under `~/.codex/plugins/cache/<marketplace>/<plugin>/<version>/`; local plugins use `local` as that directory version. The documented local development refresh is to update the source directory and restart the desktop app. It accepts the legacy `.claude-plugin/marketplace.json` catalog. [Package your plugin](https://developers.openai.com/plugins/build/plugins#how-local-marketplaces-work)
- [L4:verified] New packages use root `plugin.json`; OpenAI accepts legacy/Claude-compatible manifests. These packaging docs do **not** explicitly promise Claude’s same-semver update detection or a particular automatic refresh cadence. [Package your plugin](https://developers.openai.com/plugins/build/plugins#plugin-structure)

### Claude Code

- [L4:verified] For ordinary marketplace sources, version precedence is plugin manifest, marketplace entry, then source-derived identity. Git sources without explicit versions use commit identity; same computed version keeps the cached copy. Local-path marketplace relative plugins instead load source files in place, so edits apply at startup/reload without a version bump. Most other sources load versioned cache copies. Running sessions need reload/restart after updates. [Plugin loading reference](https://code.claude.com/docs/en/plugins/loading#versions-and-updates)
- [L4:verified] Custom marketplace auto-update defaults off. When enabled, background refresh happens after the first message with up to ten minutes of delay. [Plugin loading reference](https://code.claude.com/docs/en/plugins/loading#when-auto-update-runs)
- [L4:verified] Plugin Git source `ref` is a branch or tag, defaulting to the default branch. `sha` is a full lowercase 40-character commit pin; when both exist, `sha` wins. Marketplace Git sources separately support branch/tag `ref`, with default-branch fallback when omitted. Relative plugin paths use the marketplace checkout; URL-only JSON catalogs cannot provide those files. [Marketplace reference](https://code.claude.com/docs/en/plugins/marketplace-reference#plugin-sources)
- [L4:verified] `claude plugin marketplace update` refreshes the configured branch/tag itself, never automatically switches to the default branch. [Plugin commands](https://code.claude.com/docs/en/plugins/cli-reference#plugin-marketplace-update)
- [L4:verified] Current publishing guidance says `claude plugin update name@marketplace` refreshes the marketplace and installs changed versions. Explicit manifest versions must increase for releases. Git tags are required when dependents declare version ranges, whose resolution uses tags; the documented tag command creates `{name}--v{version}`. [Publish a plugin](https://code.claude.com/docs/en/plugins/publish#ship-updates-to-users)

## Release implications and pitfalls

- [L4:inferred] A catalog following `main` with a relative plugin source exposes current main to **new** installs; retaining an unchanged manifest version only prevents existing users’ cache replacement. A version field is not a source snapshot. To distribute tested releases while developing on main, make the plugin source point at a release ref/SHA, or distribute the marketplace itself from a release-only ref.
- [L4:inferred] An immutable version-tagged marketplace remains on that old release until the configured ref changes. For continuing stable updates, use a moving release branch/catalog that advances plugin refs to immutable release commits. Source pinning and version changes are separate release duties.
- [L4:verified] Claude’s unchanged-version rule can mask pushed fixes. Avoid putting competing version values in catalog and manifest because manifest precedence wins. [Plugin loading reference](https://code.claude.com/docs/en/plugins/loading#how-claude-code-computes-the-version)
- [L4:inferred] Refreshing a marketplace and loading an updated plugin are separate layers; fresh catalog metadata alone is insufficient evidence that a running session uses new files.

## Open questions / limits

- Codex’s public packaging page supports ref/SHA selectors but does not document exact same-version cache invalidation, manifest precedence for all legacy formats, or refresh behavior for each Git ref type. Do not transfer Claude rules to Codex without a focused fixture or implementation inspection.
- Search found older stale-catalog/cache reports, but current Claude publishing docs explicitly say plugin update refreshes the marketplace. Treat old reports as version-specific observations, not the current contract; test the installed client if this distinction affects automation.
- Whether release refs and version bumps are updated atomically is a repository workflow property, not guaranteed by either host.

## Currency and execution gate

These findings were researched on 2026-10-23. Re-read the linked primary documentation
and record installed client/tool versions before implementation or conformance claims.
Local file observations describe the checkout at that date, not a permanent API contract.
