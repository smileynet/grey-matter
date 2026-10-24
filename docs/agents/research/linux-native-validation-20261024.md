# Linux native candidate validation — 2026-10-24

**Ticket 78 passes for the measured Linux scope.** Both frozen candidates passed their product gates, native plugin verification and all six discovery/upgrade probe groups on `sam@randomserver`. Windows ticket 77 remains required before final audit 70 and staging 71 can close. Nothing was published.

## Machine and exact inputs

The target is Linux x86_64, kernel `7.0.0-34-generic`, glibc 2.39. The [machine-readable report](evidence/linux-native-validation-20261024.json) contains the distribution, executable paths/hashes, native versions, candidate identities and results. The [raw evidence ZIP](evidence/linux-native-validation-20261024.zip) preserves 39 reports, logs, probe sources and provenance records; SHA-256 is `037322d68a8f9cc88a369e5c60b694f3ee51fc72013fb581cb2d34d3ee00b2c9`.

| Product | Exact candidate | Result |
| --- | --- | --- |
| grey-matter 0.2.0 | `e071b7b03d02025dc1af6c3ff2c4f8369f777587` | Product gate and Codex/Claude/AGY native rows pass. |
| tkt 0.5.0 | `2b6ff173993c9fe413c40287fb1cb3f0a9879ca1` | Product gate and Codex/Claude/AGY native rows pass. |

The expected grey-matter directory was absent, so it was cloned from the configured upstream into `/home/sam/code/grey-matter`. The existing tkt main checkout was fast-forwarded; its untracked `.overseer/` directory was preserved. Tests used separate detached candidate worktrees, both clean afterward.

The six sealed plugin archives were copied from the already audited local outputs. Native verification checked their hashes and extracted members against release metadata: these are the same archives as the [final audit](final-release-audit-20261024.md), rather than platform-specific reconstructions. Source snapshots and runtime artifacts keep their original identities.

## Product and native results

[L1:verified] `release-product.mjs --execute` on each exact candidate completed successfully:

- grey-matter: `node scripts/check-repo.mjs --require-tools` passed all 12 invariant groups, including YAML, resource packaging, deployment and hook fixtures.
- tkt: `mise run check` passed 37 Node tests, formatting, Clippy and 296 Rust tests. This machine used Rust/Cargo 1.93.1; the separate exact-candidate hosted job establishes the declared 1.85.0 minimum.

[L1:verified] `release-native.mjs --execute` passed all six product/host rows with native Linux Codex, Claude and Antigravity. This includes exact skills/namespaces, independent YAML parsing, Claude seeded validation controls and Antigravity installed-byte/policy comparisons. Shared helpers use the same source hashes as the reviewed candidate tooling; native success is not inferred from schema checks alone.

| Native client | Version | Combined probe result |
| --- | --- | --- |
| Codex | 0.147.0 | 50 managed namespaced skills plus one foreign sentinel; system skills recorded separately. Historical bare migration, identical repeated catalog, same-version cache repair, disabled bare fallback and shared-root symlink separation pass. |
| Claude Code | 2.1.310 | All 50 managed user commands; zero when both plugins are disabled; the same 50 restored. Dependency-first installation, required-tkt disable refusal, repeated catalogs and foreign-content preservation pass. Both Claude hooks are registered. |
| Antigravity | 1.4.6 | 50 managed skills plus one foreign sentinel. Synthetic old plugin versions exercise added/modified/removed skills, replacement, disable/enable and identical repeated bytes; all 253 grey-matter and 43 tkt installed files match. Zero model turns. |
| Kiro CLI | 2.34.0 | ACP initialization/session metadata lists 50 managed bare skills plus one foreign sentinel. Zero model requests or credential inputs. |
| OpenCode | 1.18.21 | Native `debug skill --pure` reports all 50 managed skills and the foreign sentinel at the expected owned paths. Dry-run/repeated deployment and physical-root comparisons pass. |
| Crush | 0.98.1 | Credential-free local server workspace/catalog APIs list 50 managed project skills plus one foreign sentinel. Provider configuration is empty; zero model requests. |

Previous `v0.1.0` and `v0.4.0` tags were used for the actual bare-to-plugin migration controls. They contained no Antigravity plugin, so AGY's old-plugin controls are explicitly synthetic. Catalog counts are paired with expected names, namespaces, paths and byte comparisons; counts alone are not the pass signal.

[L1:verified] The provenance-verified CI Linux x86_64 release binary reports `tkt 0.5.0 (2b6ff17)`. Its archive SHA-256 is `23498311d6acc124e32dba7e16c6bb345297025d1924ce5d1238feff4ddec613`. Against that binary, guidance checks cover 21 commands and 381 references across 42 files with zero unsupported current flags. Two planned migration-template flags remain explicitly labeled unimplemented. The context example includes untagged work and restores the previous scope: scoped IDs 01/03, restored IDs 02/03.

## Isolated tools and installation sources

Node 22.23.4 was added to mise's cache without activating it globally. Newer/missing native clients were downloaded into the owned validation directory and SHA-256 checked before execution. Installers that change launchers or shell profiles were bypassed; Kiro's sibling binaries were kept together, and a recorded AGY wrapper disabled its automatic updater.

The normal user's versions remained Node 20.20.2, Claude 2.1.252, Antigravity 1.1.22 and Kiro 2.16.0. This validation does not upgrade the user's ordinary plugin installations or CLI launchers. Build/npm/tool caches and the explicit validation workspace were written as part of the authorized setup; no claim of an entirely write-free SSH session is made.

Primary installation sources were read on 2026-10-24 and then checked against the downloaded bytes:

- [Anthropic 2.1.310 release manifest](https://downloads.claude.ai/claude-code-releases/2.1.310/manifest.json) and [setup guidance](https://code.claude.com/docs/en/setup): direct Linux binary, avoiding the launcher-managing installer.
- [Google Antigravity 1.4.6 release metadata](https://api.github.com/repos/google-antigravity/antigravity-cli/releases/tags/1.4.6) and [troubleshooting](https://antigravity.google/docs/cli/troubleshooting): pinned binary plus per-command updater suppression.
- [Kiro stable manifest](https://prod.download.cli.kiro.dev/stable/latest/manifest.json) and [ACP reference](https://kiro.dev/docs/cli/acp/): the inspected manifest selected 2.34.0; its versioned archive and checksum were preserved before execution. No bootstrap/install script ran.
- [OpenCode v1.18.21 release metadata](https://api.github.com/repos/anomalyco/opencode/releases/tags/v1.18.21) and [pinned installer source](https://raw.githubusercontent.com/anomalyco/opencode/v1.18.21/install): isolated x86_64 baseline binary avoids an AVX2 assumption and global V1/V2 launcher conflicts.
- [Crush v0.98.1 release metadata](https://api.github.com/repos/charmbracelet/crush/releases/tags/v0.98.1) and [pinned server source](https://raw.githubusercontent.com/charmbracelet/crush/v0.98.1/internal/cmd/server.go): isolated binary and loopback catalog API.

The JSON report records download URLs and measured digests. Separate vendor signature verification was not performed; SHA-256 verification is the integrity claim here.

## Isolation, advisories and limits

All native catalogs and install/update controls ran in disposable homes, configuration roots and workspaces, using an environment allowlist. AGY's provider control used a clearly synthetic key and a loopback dead endpoint. No real model-provider credentials were supplied, no login was performed, and no model prompt was sent. Native hooks were parsed/registered; direct push-gate and SessionStart fixtures executed under Linux. Authenticated interactive host execution and every skill's model activation are not claimed.

**Network isolation was not enforced.** The attempted bubblewrap network namespace failed with `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. That failure is retained in the evidence. Public package/vendor downloads were intentional; disposable configuration and credential isolation do not prove the absence of all network traffic.

Codex emitted nonblocking PATH-helper warnings for temporary homes. Its catalog and upgrade assertions passed; this report adds no PATH-helper or arbitrary shell-sandbox execution claim. Unsupported coverage is recorded rather than converted into an inferred pass.

## Reproduction and release disposition

Read the ZIP's `transfer-inventory.json`, verify each member digest, then inspect `grey-product/`, `tkt-product/`, `grey-native/`, `tkt-native/` and the six `*-probe.json` reports. `probes/adaptation.json` records the original and Linux probe hashes plus path/executable replacements. All assertions from the reviewed probes were retained; macOS sandbox wrappers were removed with the explicit network limit above. The additional tkt CLI probes and their reports are also preserved.

Use the frozen commits and archive hashes when reproducing; replace absolute server paths in the recorded source for another owned workspace. Never point cleanup/deploy controls at personal skill roots. New source behavior or candidate identities require new artifacts and affected evidence.

This report clears Linux ticket 78 only. Windows 77, final audit 70, the staging review carrier and all publication decisions remain separate. No release tag, registry/GitHub release, stable ref or public directory entry was created.
