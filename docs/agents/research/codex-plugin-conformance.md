> Preserved research evidence from 2026-10-23. Scratch output names below describe historical probe artifacts; reproduce the commands rather than depending on those temporary files. This report is not a release sign-off.

# Codex plugin conformance — 2026-10-23

Coverage: static inputs, isolated native catalog discovery, isolated install and native skills/list verified for both rows. Upgrade, prompt activation and public-directory eligibility remain unverified. No real user home/config, credentials or installed caches were modified. Parent clarified that installs into disposable scratch homes are permitted; both were installed there without invoking a model.

## Primary documentation actually read

Fetched 2026-10-23; these pages expose no publication/revision date in the fetched Markdown. Retrieval date is not a claimed publication date.

- [L4:verified] [Package your plugin](https://developers.openai.com/plugins/build/plugins): introduction and compatibility fallback; Build your own curated plugin list; Add a marketplace from the CLI; Marketplace metadata; How local marketplaces work; Plugin structure; Add OpenAI-specific metadata; Path rules; lifecycle-hook eligibility. The cited official page is the durable reference.
- [L4:verified] [Build skills](https://developers.openai.com/plugins/build/skills): Write SKILL.md; Define the workflow boundary; Review instruction following; Add supporting resources; Connect skills to MCP tools; Test the skill; Package the skill.
- [L4:verified] [Build skills / optional metadata](https://learn.chatgpt.com/docs/build-skills#optional-metadata): skills must carry name/description; explicit/implicit invocation; scan locations; optional agents/openai.yaml and policy.allow_implicit_invocation (default true). The former developers.openai.com/codex/skills redirects here.
- [L4:verified] [Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines): Overview; Respect user intent; Privacy policy; Skills. Public-directory submissions need privacy/listing compliance even for skills-only packages. These are not evidence that a private local catalog needs a public-directory listing.

## Tool and artifact identity

[L1:verified] `codex --version` → `codex-cli 0.147.0`. `codex plugin --help` exposes add/list/marketplace/remove and no standalone validate subcommand. CLI help is runtime evidence, not a replacement for documentation. Desktop app version was not measured by this worker.

| Repository / host | Exact tested Git artifact | Inputs and identity | Native evidence | Disposition |
| --- | --- | --- | --- | --- |
| grey-matter / Codex | `4e06a3cfa77cc27fffb761dbecccf373510329f1` | `.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`; name grey-matter, version 0.1.0, skills ./skills/ | Isolated archive: marketplace add exit 0, then plugin list --available --json exit 0 discovers grey-matter@grey-matter 0.1.0; stderr empty | Static/catalog/load pass; invocation semantics unverified |
| tkt / Codex | `603f740944adaad8784a3389b633689944a35dda` | Same input paths; name tkt, version 0.4.0, skills ./skills/ | Isolated archive: marketplace add exit 0, then plugin list --available --json exit 0 discovers tkt@tkt 0.4.0; stderr empty | Static/catalog/load pass; invocation semantics unverified |

Archives were created with git archive HEAD into `codex-isolated/{grey-matter,tkt}`. HOME and CODEX_HOME each point to a fresh separate scratch home. Native output is retained in `codex-isolated/*-configured-discovery.json`, initial unconfigured output in `*-discovery.json`. Manifest/catalog SHA-256 values and counts are in `codex-artifact-inventory.json`. Both initial unconfigured catalogs returned empty available/installed lists. Explicit marketplace registration made both discoverable. This is not a format conflict: repo trust/autodiscovery was not established for those newly extracted directories.

## Field and resource audit

- [L1:verified] Both manifests have kebab-case stable names, SemVer versions, nonempty descriptions, author name, homepage/repository URLs, MIT license, keywords and OpenAI interface displayName/shortDescription/developerName/category. Both use the supported compatibility layout; neither has a portable root plugin.json. **No migration required**: current OpenAI docs expressly support the fallback.
- [L1:verified] Both catalogs have matching top-level/plugin names, interface.displayName, local source ./, AVAILABLE installation, ON_INSTALL authentication, Productivity category. ./ resolves to archive root, not .agents/plugins. Both native listings confirmed the resolved root. No Git ref/SHA is embedded because these entries use local sources; Git marketplace registration ref/SHA delivery is a separate release/install test.
- [L1:verified] grey-matter packages 44 SKILL.md files, all with name/description; 34 optional OpenAI sidecars, 20 policy.allow_implicit_invocation=false. tkt packages four SKILL.md files, all with name/description, no sidecars (documented default implicit invocation true). grey-matter `node scripts/check-invocation-policy.mjs` freshly returned: “invocation-policy check OK: 44 skills, 20 user-invoked (frontmatter, sidecar policy, and README groupings all agree).” This local check is not native parser or runtime activation evidence.
- [L1:verified] grey-matter's skills are nested by bucket under skills/; tkt's four skills are directly under skills/. Subsequent native skills/list proved recursive discovery of all 44 bucketed grey-matter skills and all four tkt skills. The current session's skill list includes grey-matter names, but that session has maintainer installations and is deliberately excluded as isolated evidence.
- [L1:verified] Neither Codex manifest declares MCP servers, apps, dependencies, hooks, executable entrypoints or assets. No authentication provider, OAuth app, hook lifecycle, UI iframe, MCP annotations, or server security metadata applies to these manifests. tkt's description correctly declares its external tkt CLI PATH prerequisite; this audit did not install or execute tkt workflows.
- [L1:verified] Tracked Git archives contain full repository runtime/reference files, not only skills directories. Example grey-matter release references/release.sh and sync's scripts/deploy.mjs/scripts/check-repo.mjs exist in the archived repo. This does not certify future ZIP contents or every script's behavior. Whole-tree link/package closure remains the parent audit's mechanical check.
- [L4:verified] ON_INSTALL is documented marketplace policy and does not itself imply a bundled authenticated service. No public-directory privacyPolicyURL is present. Public-directory submission is outside the release plan; eligibility/privacy metadata is **unverified**, and becomes a blocker if submission is added. Do not label this an unconditional private-catalog defect.

## Warnings, conflicts, blockers

1. **Runtime load verified after parent clarification:** `codex plugin add NAME@NAME --json` exited 0 for both disposable homes; stdio app-server initialize, initialized, skills/list(forceReload=true) returned 44 grey-matter and four tkt plugin skills, all enabled, errors empty. Cache file bytes match all 300 grey-matter and 308 tkt tracked archive files. Every reported skill path stays within its disposable home; six bundled system skills were bootstrapped by Codex in each fresh home. Raw protocol: `codex-isolated/*-skills-list.jsonl`; install output: `*-install.json`; counts and byte comparison: `runtime-summary.json`. No model request was made. **Invocation-policy runtime enforcement remains unverified:** skills/list exposes name/description/interface/path/scope/enabled, not policy; static sidecars agree with documented shape but a model activation test was not run.
2. **Unverified:** upgrade, same-version cache behavior, ref/SHA selectors, stable-channel promotion, removed-skill pruning, Windows/Linux and native desktop loading. Ticket 69 owns full install/upgrade testing; ticket 65 isolated loading is now recorded above.
3. **Client anomaly:** all six auto-bootstrapped system skills were returned with names prefixed `grey-matter:` even in the tkt-only home (e.g. grey-matter:skill-installer), while paths are fresh system paths, not grey-matter package paths. This namespace behavior is not explained by the cited documentation; reproduce and isolate it under ticket 73 before considering a host/client report. Do not change either manifest speculatively. Plugin skills themselves have the expected grey-matter:NAME / tkt:NAME namespaces. Compatibility acceptance and marketplace root resolution agree between docs and CLI. Empty default discovery before explicit registration is a bounded coverage observation, not proof that documented repo discovery is broken.
4. **Warning:** skill instruction safety/activation semantics were not exhaustively reviewed. No claim that all 48 workflows comply with public-directory instruction-following/privacy review.
5. No new schema/lint rule was implemented; therefore no new seeded failing fixture is claimed.

Evidence: isolated `codex plugin marketplace add <archived-root> --json` and `codex plugin list --available --json` → both exit 0, expected name/version/root, no stderr, installed empty. Evidence: `node scripts/check-invocation-policy.mjs` → 44 skills / 20 manual policies agree. Evidence: `git status --short` → empty before this scratch report (scratch is gitignored); this worker made no tracked edits.

Scope note: the later `git diff --stat` shows scripts/deploy.mjs changed by another concurrent worker (115 lines); this worker edited only ignored scratch files and did not alter that diff.

## Current policy evidence (ticket 73)

The earlier unverified invocation-policy observation is resolved for the exact native versions in [policy evidence](plugin-invocation-policy.md), using loopback-only captured context, explicit human expansion and a removed-policy control. This does not certify every platform or future candidate bundle. [Current Claude validation](claude-current-validation.md) records the newer validator and seeded nested-scanner limitation. Tickets 65/67/69 retain those candidate gates.
