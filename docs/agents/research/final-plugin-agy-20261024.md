> Independent review snapshot of the predecessor BEC/AF candidate pair. Current replacement identities and the exact contract-byte comparison are in [the final candidate audit](final-release-audit-20261024.md). Historical hashes below are preserved rather than relabeled as fresh review.

# Final frozen-candidate Antigravity audit — 2026-10-24

Coverage: ✅ both sealed AGY archives inspected; ✅ fresh native strict validation; ✅ exact-candidate catalog, policy metadata and update/enable evidence checked; ⚠️ published policy documentation and cross-platform/runtime execution limits below. Staging conformance only; no publication approval.

| Product | Frozen source / version | Archive SHA-256 | Root plugin.json SHA-256 | Result |
| --- | --- | --- | --- | --- |
| grey-matter | bec5afee9f4f070ef898ac309d45d5061a5be7b5 / 0.2.0 | 22b85d1807790f0045ec43ed432ccaf64b2cffd26caef91a2c2572c6fe50c13d | dd5b03073c79da7851c66b1c484c0fcaec2f883acf78ddc21f2e68238d381ed4 | Native pass: 46 skills, 252 files; one dangling historical evidence link, advisory with closure qualification below. |
| tkt | af4703d7b737a772eb45fb7e601ce3ec6b9b9735 / 0.5.0 | 391a5a2182237c1e558fc9adcd67914aeaf3ff6b068c28b132ea42d08cbb52ff | 5e3eb23fa028a692a719ef2202be868fff8d799d55147f2179bf155185084527 | Native pass: four skills, 43 files; no missing scanned Markdown targets. |

Archive paths are exactly the two AGY assets under the artifact directories in `final-audit-input.json`; directory names are not candidate SHA authorities. Hashes above were freshly recomputed from archive bytes and manifest bytes inside each archive.

## Primary sources read today

- [L2:verified] [Vendor live manifest schema](https://antigravity.google/schemas/v1/plugin.json), complete JSON retrieved directly with Python urllib after web-reader failure. Saved `.scratch/final-agy-schema.json`, SHA-256 `0eea5e483af6f03fa099f32b065d2924a323f1a616ed0323cfa0b7a74ff9543c`. Required name, recognized key types, permitted metadata, optional skill paths and disabled precedence checked. Both manifests conform: name/displayName/version/description/author/keywords/repository/license; no unsupported keys, dependencies or source selectors. No deprecated source/sourcePath/source_path fields. Any version string is accepted. Neither manifest declares another plugin standard or an automatic update feed. `$schema` is optional editor assistance.
- [L4:verified] [Vendor Plugins guide](https://www.antigravity.google/docs/plugins?tab=cli), directory/manifest/component/manual installation/CLI sections. Root manifest and flat skill directories match. Local directories and GitHub install sources are documented; named marketplace support is official-only. Embedded schema is narrower than live schema; global paths conflict within vendor guidance (`config/plugins` versus `antigravity-cli/plugins`). These are documentation inconsistencies; native evidence below supports the actual format/path. No vendor deprecation warning against this format was found in these sections. App-managed automatic updates do not establish an update channel for these local packages.
- [L4:verified] [Vendor Skills guide](https://www.antigravity.google/docs/skills/), anatomy/frontmatter/progressive loading/CLI locations/slash conversion. Optional scripts/resources and skill names/descriptions are supported. This page omits disable-model-invocation and does not establish Codex sidecar semantics. Absence is not proof of rejection: observed AGY behavior is separately recorded below.

No publication date is inferred from retrieval. No public implementation source was substituted for the vendor schema and measured CLI.

## Observable evidence

[L1:verified] Fresh archive extraction into disposable temporary directories, disposable HOME/XDG_CONFIG_HOME and cwd; `agy --version` → 1.4.6. `agy plugin validate <extracted-root> --strict --json` → exit 0 for both, findings [], skills 46/four, all other native component counts zero, agentPluginsSpec false. No installs, model prompts, credentials or user state were used by this audit. Scratch files are the only persistent writes.

[L1:verified] Read exact-candidate `docs/agents/research/evidence/plugin-compatibility-catalogs-20261024.json`, Antigravity record (1.4.6), including executable probe source and results. Its candidate/archive hashes match this audit. Catalogs contain precisely `grey-matter:<leaf>` and `tkt:tkt-core`, `tkt:tkt-orient`, `tkt:tkt-reconcile`, `tkt:tkt-work`; no bucket namespace is introduced. Installed bytes matched all 252/43 sealed files. Synthetic older versions exercise added/modified/removed skills; disable removes catalog entries; enable restores; repeated installation preserves payload; foreign plugin survives. The probe reports zero model turns. This audit did not repeat installation because its scope excludes installs. Prior releases had no AGY plugin: these are synthetic upgrade controls, not historical plugin migration proof. Remote marketplace refresh and automatic version ordering remain unverified.

[L1:verified] Compared every sealed SKILL.md policy flag with exact-candidate catalog: all 20 grey-matter human-only flags correspond to model_invocable false; all other skills, including all four tkt skills, report true. No mismatches. `plugin-invocation-policy.md` and its referenced historical three-case evidence describe 1.4.5/1.4.6 context exclusion, explicit human expansion and removed-policy control; this audit relies on that earlier controlled observation for activation semantics and does not rerun a model-context probe. Metadata visibility alone is not enforcement proof. Future versions require renewed policy evidence because the vendor page omits this field.

[L1:verified] Scanned actual archived Markdown local links after excluding fenced examples, fragment/network targets and the literal `link` example. The repaired wrap-session links resolve into packaged docs and .references/README.md; tkt has no missing scanned targets. Packaged resources, licenses and tools are present as archive bytes; no helper script was executed. Arbitrary prose commands/dynamic paths and script execution are not certified by this scan.

## Findings and release disposition

No AGY manifest, namespace, version, catalog, enable/disable or update-replacement blocker was found for the measured macOS CLI 1.4.6 scope.

**Advisory — grey-matter historical provenance link:** archived `docs/agents/research/claude-current-validation.md` links to absent `evidence/claude-validation-20261023.json`. This is a real broken transitive report link, reachable from packaged conformance research, rather than an executable or host-discovery dependency. Include the retained JSON or remove/repair the stale citation in a successor candidate. It does not invalidate native AGY loading, but an acceptance criterion promising *every packaged local Markdown link resolves* must remain failed until repaired; do not claim complete resource closure for this archive.

**Advisory — vendor contract gaps:** retain version-pinned observed policy evidence; do not advertise universal AGY human-only enforcement, automatic local-plugin updates, exact remote Git SHA selectors, third-party marketplace registration or native dependency resolution without further evidence. Codex YAML files are ordinary packaged resources here, not native AGY sidecars (native sidecars count zero).

Windows/Linux native AGY behavior, standalone IDE/App loading and cross-surface sync, actual historical plugin upgrades, remote installs, arbitrary skill/helper execution, and fully general dynamic resource closure remain outside verified scope. The tkt package explicitly requires its CLI on PATH; the plugin is not a bundled CLI installer.

Evidence: fresh strict native validators → 46/four skills, findings []; sealed archive policy/catalog comparison → zero mismatches; archive Markdown target scan → one historical provenance miss for grey-matter and zero for tkt; `git diff --stat` → empty at audit time. Existing agy-plugin-conformance.md was read as historical evidence, not authority.

Exact provenance: `/Users/sambiggins/code/grey-matter/.scratch/candidates/grey-matter-0.2.0-9e8a047/artifacts/grey-matter-0.2.0-agy.tar.gz`, root `plugin.json`; dangling citation is `docs/agents/research/claude-current-validation.md:108` (line verified from sealed member). The scan covered every Markdown member, including all transitive research reports; this was the only missing concrete local Markdown target after stated example exclusions. Corresponding tkt archive: `/Users/sambiggins/code/grey-matter/.scratch/candidates/tkt-0.5.0-468684d/artifacts/tkt-0.5.0-agy.tar.gz`, root `plugin.json`.
