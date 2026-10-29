# Coordinated staged installation

These are unpublished candidates: grey-matter 0.2.0
(`05792a71c7e936b3ed26a623933bbfa224d7b93c`) and tkt 0.5.0
(`a827bb6f264ad2ef73157fd8c0a471cb78e634fe`). Registry, latest-release and stable URLs do
not deliver them. No public plugin-directory listing is included.

## Prerequisites and compatibility

- **tkt CLI.** Install it separately from its four workflow skills; the plugins don't
  install it. For candidate testing, use the reviewed 0.5.0 binary from the sealed CI
  stage.
- **Toolchains.** Compiling tkt needs Rust 1.85.0 or newer. Maintenance tools and the
  Claude hooks need Node 22 or newer.
- **Measured client versions:**
  - Codex 0.147.0 (Windows), 0.164.0 (macOS) and 0.165.0 (Linux);
  - Claude 2.1.310–2.1.311;
  - Antigravity 1.4.6;
  - Kiro 2.34.0;
  - OpenCode 1.18.21;
  - Crush 0.98.1.

  Other versions need their own check. Kiro 2.35.1 needs a signed-in session before it
  lists skills.

Each product's README and changelog are kept as byte-exact `.snapshot.txt` files next
to its note draft. Read their relative links in the matching candidate checkout.

## Claude: install the dependency first

1. Verify `SHA256SUMS` and `release-metadata.json`.
2. Extract each product's **Claude** archive into its own empty directory.
3. Set `TKT_PACKAGE` and `GREY_PACKAGE` to the absolute extracted roots that contain
   `.claude-plugin/marketplace.json`.
4. Install tkt first:

```sh
claude plugin marketplace add "$TKT_PACKAGE"
claude plugin install tkt@tkt --scope user
claude plugin marketplace add "$GREY_PACKAGE"
claude plugin install grey-matter@grey-matter --scope user
```

The compact archive README assumes the dependency marketplaces are already registered.

The plugins add two hooks:
- tkt's SessionStart hook shows the launch project's frontier when the CLI is on PATH;
- grey-matter's PreToolUse hook checks recognized agent Git pushes.

The installed Git pre-push gate covers other push paths. Restart sessions after
refreshing plugins.

## Codex, Antigravity and bare roots

Use each host's matching archive, not the Claude archive:
- Codex packages contain namespaced skills.
- Antigravity packages contain their flat skill payload and policy metadata.

For an install from a checkout, run each pack's deployer **once**:
`node scripts/deploy.mjs` for grey-matter, `node tools/deploy.mjs` for tkt. It refreshes
enabled local plugins and picks bare roots so each harness sees each skill once. `sync`
runs the same command, so don't add it as an extra step. Inspect `audit` before and
after migrating a real profile. Preserve unowned skills: an unowned warning is not
permission to delete a directory.

## Updates and limits

**Channels.** The unqualified GitHub marketplace examples in the READMEs track
development defaults:
- a pinned version identifies a release;
- `stable` exists only after an immutable publication promotes it.

**To update:** update the marketplace, then the plugin, then restart the session.

**Measurement limits:**
- Catalog checks show the skills load. They do not prove every model activation or
  authenticated interactive hooks.
- Network isolation was enforced on macOS only; Linux and Windows used disposable homes
  and an environment allowlist.

See the [audit](../../research/final-release-audit-20261029.md) and its platform
archives for the executable evidence.
