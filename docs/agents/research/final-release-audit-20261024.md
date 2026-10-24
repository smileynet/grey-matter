# Final release candidate audit — 2026-10-24

**Technical checks pass within the measured scope. Linux native validation now passes in ticket 78. [Windows validation now passes](windows-native-validation-completion-20261024.md), including the complete Codex candidate catalog after authorized live duplicate cleanup. Audit 70 and staging 71 remain incomplete.** No release tag, GitHub release, registry publication, stable promotion or public plugin-directory submission was performed. This report covers the approved grey-matter 0.2.0 and tkt 0.5.0 candidates; it does not authorize publication.

## Exact candidates and evidence

| Product | Source revision | Frozen candidate | Local output directory |
| --- | --- | --- | --- |
| grey-matter 0.2.0 | `d9978415af4a1d908f91538263bd5dc372f405e3` | `e071b7b03d02025dc1af6c3ff2c4f8369f777587` | `.scratch/candidates/grey-matter-0.2.0-d997841` |
| tkt 0.5.0 | `df4b652aa16e98fceda1fc58ec226691c11bbc0d` | `2b6ff173993c9fe413c40287fb1cb3f0a9879ca1` | `.scratch/candidates/tkt-0.5.0-df4b652` |

Both candidates have dedicated clean worktrees and pushed `codex/release-*` branches. Their version authorities, plugin manifests, tkt Cargo lock and generated notes agree. Outputs are reproducible with `release.mjs prepare --repo … --version … --out … --execute`; preparation defaults to preview without `--execute`. The committed staging index in ticket 71 must bind the final notes, metadata, verification files and six gate receipts. These local paths are locators, not integrity authorities.

[L1:verified] [Candidate audit evidence](evidence/final-candidate-audit-20261024.json) records all six archive hashes, full native/product reports, per-file contract comparisons, 109 ticket dispositions and the collector source. `readCandidateEvidence` checked the verification index against its expected digest, child report/log hashes and sealed archive identities. [Compatibility catalogs](evidence/plugin-compatibility-catalogs-20261024.json), [Claude session catalog](evidence/claude-upgrade-session-catalog-20261024.json) and [tkt CLI proof](evidence/tkt-final-candidate-verification-20261024.json) contain the freshly executed probes and their source hashes.

## Plugin conformance against primary sources

Independent source-documentation reviews read the primary pages on 2026-10-24. Their [Codex](final-plugin-codex-20261024.md), [Claude](final-plugin-claude-20261024.md) and [Antigravity](final-plugin-agy-20261024.md) reports preserve the predecessor candidate hashes. Every manifest, marketplace, skill, sidecar, hook and legal contract file is byte-identical in the replacements. The evidence lists every changed path. Fresh native checks and install/upgrade probes bind the replacement archives below.

| Product / host | Archive SHA-256 | Fresh result |
| --- | --- | --- |
| grey-matter / Codex | `9b2a1bf7a32811bca8ee7fe7b3d15604125169c9208a17ec05f13a23b75a668a` | 46 namespaced skills; manifest, catalog, YAML and isolated loading pass. |
| grey-matter / Claude | `730e2a6410cf9aef62f80880b50deb19d578e73b5f260b369adfa68e31405089` | 46 skills and one PreToolUse hook; manifest, marketplace and flattened component validation pass. |
| grey-matter / Antigravity | `b0064837165f74ee505cc1801730b278932dab3e7911bf4288d52d331074973d` | 46 skills; strict native validation, namespaces, policy metadata and installed-byte comparison pass. |
| tkt / Codex | `5644d295398f3953b6a9068f10e770ef179508fff14459000d42dd3a3018f6e9` | Four namespaced skills; manifest, catalog, YAML and isolated loading pass. |
| tkt / Claude | `e45a1329306effeea115f111061c991b41a20cd5f072bb9ae43ff7fb3c421d47` | Four skills and one SessionStart hook; manifest, marketplace and flattened component validation pass. |
| tkt / Antigravity | `840e7015eac5f8734a52bd721cb88bfbc3c4186ec661f310d5e144a535815b16` | Four skills; strict native validation, namespaces, policy metadata and installed-byte comparison pass. |

[L4:verified by independent reviewers] Applicable contracts:

- [OpenAI packaging](https://developers.openai.com/plugins/build/plugins), [skills](https://learn.chatgpt.com/docs/build-skills), [guidelines](https://developers.openai.com/plugins/plugin-guidelines) and [changelog](https://developers.openai.com/plugins/changelog): supported compatibility manifests, root-relative paths, marketplace identity, namespaces and optional invocation sidecars. Explicit empty hooks suppress discovery; neither Codex archive contains Claude hooks. The public-directory listing review is outside this own-marketplace staging scope.
- [Claude manifest](https://code.claude.com/docs/en/plugins-reference), [marketplaces](https://code.claude.com/docs/en/plugin-marketplaces), [skills](https://code.claude.com/docs/en/skills), [dependencies](https://code.claude.com/docs/en/plugins/dependencies), [distribution](https://code.claude.com/docs/en/plugins/publish) and [hooks](https://code.claude.com/docs/en/hooks): names and paths agree; grey-matter's `tkt@tkt` dependency has the required marketplace allowlist. Node hooks are confined to Claude packages. Tested prerequisite: Claude 2.1.310+ and Node 22+. The unversioned tkt dependency is valid syntax; compatibility with future tkt releases is not promised.
- [Antigravity live schema](https://antigravity.google/schemas/v1/plugin.json), [plugin guide](https://www.antigravity.google/docs/plugins?tab=cli) and [skills guide](https://www.antigravity.google/docs/skills/): root manifests and flat skill names conform. Schema digest and documentation conflicts are retained in the independent report. Native 1.4.6 behavior establishes the measured catalog/policy contract; unspecified automatic update feeds, remote SHA selectors and dependency resolution are not claimed.

Native versions: Codex 0.147.0, Claude 2.1.310, Antigravity 1.4.6, Kiro 2.34.0, OpenCode 1.18.21 and Crush 0.98.1. Catalog initialization does not prove every skill's model activation. The controlled invocation-policy evidence from ticket 73 remains applicable to the unchanged declarations; this audit adds no universal model-enforcement claim.

## Findings and disposition

| Finding | Disposition and evidence |
| --- | --- |
| Original OpenCode duplicate/unowned-directory findings | Resolved for managed skill loading. Fresh canonical portfolio refresh followed by strict audit: 19 plugins, four packs, zero findings/errors. Each isolated native catalog has all 50 managed skills exactly once. Forty-three distinct user-managed directories remain explicitly inventoried; installer ownership does not permit deleting them. Inventory-only source-name overlaps are not loaded duplicates. |
| Codex plugin inventory and shared scan-root claims | Addressed by ticket 64 and the current native probes. Actual catalogs verify plugin/bare selection, same-version cache repair, disable/enable and symlink-root separation; no inferred scan-root claim is used as proof. |
| tkt bash-only deployment | Addressed. `tools/deploy.mjs` matches the canonical engine; the bash script is an alternative entry point. One portfolio refresh deployed each changed pack once. |
| Windows portability and push-rejection fixture | tkt 219/220 closed. Exact replacement candidate CI passes Windows/Linux full gates, hooks and Rust 1.85 MSRV. Windows's deliberate symlink-fixture skip and Unix-only test difference are recorded, not counted as executed. |
| Missing transitive historical evidence link | Ticket 76 closed. Four artifact cases failed before the parser correction and pass after it. All three grey archives were extracted and the restored JSON matched SHA-256 `9ec93e8ef28c13561d38360fc81cb968fbf56076994bf0a962dd7794ecf8f0e5`. |
| Historical ticket 07 unchecked criteria | Existing warning preserved with its supersession rationale. It is not a current failing close gate; ticket 33 remains parked. |
| Claude listing icon / source-root context advice | Optional listing icon advice is nonblocking; source-root CLAUDE.md advice is absent from sealed payload validation. No public-directory listing eligibility is asserted. |
| Archive README install prerequisites | Staging must include the coordinated install guide: register/install the extracted tkt package before grey-matter, then install the tkt CLI separately. The compact archive README commands assume dependency marketplaces are registered. An extra fresh-home run of those compact commands timed out with network denied; it is inconclusive and is not substituted for the successful dependency-first candidate probes. |
| Native Windows/Linux vendor loading | [Linux native validation](linux-native-validation-20261024.md) now passes on randomserver, including all six clients and upgrade controls. [Windows native evidence](windows-native-validation-20261024.md) now includes all six package rows and fixture controls. The [completion report](windows-native-validation-completion-20261024.md) resolves those 48 live duplicates and records a passing complete Codex candidate catalog/state probe. No coverage exclusion has been approved. |

## Scope and ticket reconciliation

All current non-done tickets in both repositories are classified individually in the [audit evidence](evidence/final-candidate-audit-20261024.json), with status, title, dependencies, content hash and rationale. Existing backlog status is retained; it is not a new deferral of approved release work. Broader capabilities-manifest completeness (tkt 208), global instruction integration (tkt 202), tracker abstraction and native epic/label migration remain visibly parked and are not advertised as delivered.

The user explicitly required grey-matter 54 (spike-options), 55 (delivery-dashboard), 63 (Claude push hook) and tkt 210 (SessionStart); all are done and included. Grey-matter 59's tkt usage guidance and mandatory Windows/deployer blockers 60/64 are done. Guidance was checked against the actual candidate CLI help: 21 commands, 381 references across 42 files, zero unsupported current flags. Two migration-template flags are explicitly described as planned, not current CLI functionality. Temporary context filtering was executed and restored without changing the caller's persisted scope.

## Product, packages and recovery

[L1:verified] `node scripts/check-repo.mjs --require-tools` passes all 12 groups on the exact grey candidate; `mise run check` passes on the exact tkt candidate. The [platform report](evidence/release-platform-coverage-20261024.json) binds the successful [grey Windows/Linux run](https://github.com/smileynet/grey-matter/actions/runs/40085165446) and [tkt CI run](https://github.com/smileynet/tkt/actions/runs/40085001417), with metadata/log digests and selected output. Native checks and all six isolated harness probe groups pass on macOS. The checks exercised repeated deployment, dry runs, preservation of foreign content, removed skills, stale caches and enable/disable behavior.

[L1:verified] The [tkt build provenance](evidence/tkt-candidate-stage-2b6ff17-20261024.json) binds 16 assets from [build-only run 40085017493](https://github.com/smileynet/tkt/actions/runs/40085017493). The original ZIP digest is `ada187e85a77479331bb54b5c7ac8d0f298c93c1840576a45e24886a5f1b89c8`. The reader checked run/artifact identity before and after inspection, upload-log provenance, ZIP digest and all sealed file bytes. The [crate/binary inspection](evidence/tkt-release-content-2b6ff17-20261024.json) confirms the 50-file crate's VCS commit and executes the downloaded macOS ARM64 release binary: `tkt 0.5.0 (2b6ff17)`. Other target binaries were built, not executed on this machine.

The six plugin archives verify after extraction away from source, including referenced resources, runtime dependency manifests, license/attribution files and executable modes. Skills, manifests, hooks and legal bytes match the independent review. The archive verifier and seeded refusal fixtures exclude development trees, tickets, scratch files, prohibited credential paths, node_modules and target output. The [content scan](evidence/final-package-content-scan-20261024.json) found zero recognized private-key/GitHub/OpenAI token signatures; this is bounded signature detection, not exhaustive secret detection.

Maintainer requirements remain Node 22+ and Rust 1.85.0 or later. Tool dependencies remain pinned to yaml 2.9.1, tar 7.5.22, smol-toml 1.9.1, yauzl 3.4.0 and cargo-dist 0.32.0. `sync-release-tools.mjs --target ../tkt` verifies all 22 owned release files. The deployer copies match independently. Plugins do not install third-party CLIs or publish themselves. Source README, changelog and channel docs distinguish development, stable, pinned and staged delivery; default-branch marketplace examples do not pin a release.

Publication implementation review and its four remediations are closed in ticket 68. Fresh candidate gates reran the recovery/refusal fixtures, including lost dispatch responses, one-publisher ownership, immutable upload identities, interrupted Cargo/GitHub outcomes and stable-only resume. These are isolated/fake-service checks plus the retained read-only hosted probe; no actual publisher dispatch was used as a test.

## Go/no-go and staging rechecks

**Current decision: Windows evidence is complete; no-go remains until final audit 70 finishes.** [Linux 78](linux-native-validation-20261024.md) passes with recorded isolation/runtime limits. [Windows 77](https://github.com/smileynet/grey-matter/blob/main/.tickets/77-windows-native-candidate-validation.md) is closed with cited completion evidence. No Windows coverage waiver was needed or approved; there are no unresolved observed technical release defects within the already tested scope.

After the platform evidence is reconciled and audit 70 closes, ticket 71 must commit a review carrier (the staging files pinned to one Git commit), including scope, compatibility, upgrade, platform-approval, final-audit and staging receipts for each exact candidate. Include both note drafts, checksums, all six plugin archives, tkt's reviewed CI provenance, the pinned annotated tag object record and exact later publish/resume commands. A tag object record is not a pushed tag.

Recheck staged bytes with `readStagedCandidate` for both products and `readStagedTktCandidate` for the joined CI assets; verify regular committed blobs and their hashes, unchanged candidate worktrees, resource closure, version consistency, links/prose and current duplicate audit. Changes to source behavior or release-facing candidate documents require replacement artifacts and affected evidence. Ticket/plan status and the review-carrier audit do not change frozen candidate bytes. Preserve earlier reviews and their hashes rather than relabeling them as fresh executions.
