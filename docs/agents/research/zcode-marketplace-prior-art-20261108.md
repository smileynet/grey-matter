# ZCode marketplace prior art and open-decision research (2026-11-08)

Researched the three open decisions in
[proposal 23](../proposals/23-zcode-plugin-route-hardening.md) against
Claude Code's plugin documentation, Anthropic's official marketplace, the
mattpocock/skills lineage, and both repos' own release tooling.

## Findings

| # | Question | Verdict | Evidence |
|---|---|---|---|
| 1 | Where do dependency declarations actually bind? | **plugin.json is Claude's enforcement point; the marketplace entry is ZCode's resolution point — declare in both** | Claude manifest reference: `dependencies` in plugin.json lists plugins "that must be enabled"; a dependency "starts enabled regardless of `defaultEnabled`" when an enabled plugin depends on it. Marketplace entries legally mirror every manifest field. ZCode (zcode.cjs `JGr`) walks only `entry.dependencies`. Neither harness auto-installs cross-marketplace deps. |
| 2 | Is entry-level `dependencies` used in the wild? | No precedent either way | claude-plugins-official (276 entries): zero declare `dependencies`. Source shapes: url 142, git-subdir 79, string 53, github 2. No entry points at a dev checkout — directory sources are a dev-machine affordance, exactly as we use them. |
| 3 | LFS for the heavy evidence? | **Ruled out** | Claude hosting docs: "Keep plugin files out of Git LFS — clones never fetch LFS content, leaving pointer files." |
| 4 | Lightweight published install route? | **`archive` source (url + sha256) from release assets** | Both harnesses support `archive`/url plugin sources (ZCode: `QOe`/`vxi` handle zip+digest; Claude: v2.1.224+, ≤256 MiB, pin `sha256`). Both repos' `release-artifacts.mjs` already build closed per-host bundles from a committed revision — the Claude bundle is ZCode-compatible as-is (same manifest probe). |
| 5 | Sparse install without restructuring? | Possible but consumer-side | Marketplace `github` sources accept `sparsePaths` (Claude `--sparse`; ZCode implements the same clone flags). It trims the marketplace clone, but the burden lands on every consumer's add command; archive sources are cleaner. |
| 6 | Plugin vs copy route | **One route per machine; prior art states it outright** | mattpocock/skills README: "Pick one per agent, because installing both gives you every skill twice." Plugin = self-updating managed; copies = editable, deploy-owned. ZCode shadows plugin skills with user-scope copies (first wins), so dual routes hide staleness. `deploy.mjs` already suppresses the copy when plugin coverage is detected (`--allow-dual` escapes). |
| 7 | Version authority in entries | **Never set `version` in both entry and manifest** | Claude docs: plugin.json silently wins; the validator warns. Computed version gates updates — bump per release or omit to track commits. Aligns with the release contract (Cargo.toml/CHANGELOG authority) and tkt's three-authority drift risk (T3): stamp manifests at bundle-build time from the release authority. |

## Recommended resolutions

1. **D1 (route):** one route per machine. Plugin route where managed updates are
   wanted (this Windows machine now runs it); copy route only on a checkout
   `deploy.mjs` owns. Deploy's duplicate guard stays the enforcement; document
   the rule in distribution-maintenance.md, phrased after the lineage's
   "pick one per agent".
2. **D2 (dependency):** dual declaration — keep `dependencies` in the plugin
   manifest (Claude's enforcement point, per docs) and mirror the same object
   array on the marketplace entry (ZCode's resolution point). No version pins
   (the repos release in lockstep; docs warn against duplicate version
   authority). Cross-marketplace gate `allowCrossMarketplaceDependenciesOn`
   already exists.
3. **D3 (evidence weight):** two moves, no LFS. (a) Publish the marketplace
   with an `archive` plugin source pinned to the release bundle sha256 — the
   canonical cross-machine install that never transfers the repo tree; keep
   local-directory adds for dev machines. (b) Run the existing
   repository-artifact-hygiene lifecycle over `docs/agents/research/evidence/`
   (715 files, ~107 MB): findings are already promoted into the research
   notes; delete superseded evidence and give keepers explicit lifecycle
   scopes. The macOS 0.1.0 / Windows 0.2.0 divergence converges via
   `plugins update` once both machines install from the published source.

Sources: Claude Code plugin docs
([manifest reference](https://code.claude.com/docs/en/plugins/manifest-reference.md),
[marketplace reference](https://code.claude.com/docs/en/plugins/marketplace-reference.md),
[hosting](https://code.claude.com/docs/en/plugins/host-marketplace.md)),
the claude-plugins-official marketplace clone, zcode.cjs, both repos'
release tooling, and the mattpocock/skills README (prior art consulted, not
inherited).
