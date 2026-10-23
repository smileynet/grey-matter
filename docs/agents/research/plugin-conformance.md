# Plugin source conformance

Audited 2026-10-23, ticket 65. **Syntax and isolated source loading are verified for
all six rows below. Release remains blocked:** tickets 60 and 66–71 retain platform, release tooling,
candidate upgrade and final staging gates. This is a source audit, not release approval.

## Exact artifacts and native results

Every row used a fresh `git archive` of the linked commit, a disposable home/config and
workspace, and a macOS network sandbox allowing loopback only. No user credentials were
inherited, no model response was generated, and no global plugin install was changed.

| Repository / format | Exact source artifact | Version | Native evidence | Result |
| --- | --- | --- | --- | --- |
| grey-matter / Codex | [9ca0c9cac53e4e7cee65f6953363737e7e153db7](https://github.com/smileynet/grey-matter/commit/9ca0c9cac53e4e7cee65f6953363737e7e153db7) | 0.1.0 | CLI 0.147.0: local marketplace + install, app-server skills/list: 44 plugin skills, zero catalog errors; every archive file matches installed cache bytes | Syntax/load pass; notice blocker 74 |
| tkt / Codex | [2c09678e6784e3428a0c19fd3ddb9428b13fa141](https://github.com/smileynet/tkt/commit/2c09678e6784e3428a0c19fd3ddb9428b13fa141) | 0.4.0 | CLI 0.147.0: same isolated flow, four plugin skills, zero catalog errors, archive/cache bytes match | Syntax/load pass; notice review 74 |
| grey-matter / Claude Code | [9ca0c9cac53e4e7cee65f6953363737e7e153db7](https://github.com/smileynet/grey-matter/commit/9ca0c9cac53e4e7cee65f6953363737e7e153db7) | 0.1.0 | CLI 2.1.309: both explicit manifests validate; exact flat components pass strict validation; inline plugin details discovers 44 skills | Syntax/load pass with bounded warnings; notice blocker 74 |
| tkt / Claude Code | [2c09678e6784e3428a0c19fd3ddb9428b13fa141](https://github.com/smileynet/tkt/commit/2c09678e6784e3428a0c19fd3ddb9428b13fa141) | 0.4.0 | CLI 2.1.309: both manifests and exact strict components pass; inline discovery finds four skills | Syntax/load pass; notice review 74 |
| grey-matter / Antigravity | [9ca0c9cac53e4e7cee65f6953363737e7e153db7](https://github.com/smileynet/grey-matter/commit/9ca0c9cac53e4e7cee65f6953363737e7e153db7) | 0.1.0 | CLI 1.4.6: generated package strict validation, isolated native install and read-only catalog: 44 exact `grey-matter:skill` names; 20 human-only flags match source; installed wrap-session resources resolve | Generated syntax/load pass; notice blocker 74 |
| tkt / Antigravity | [2c09678e6784e3428a0c19fd3ddb9428b13fa141](https://github.com/smileynet/tkt/commit/2c09678e6784e3428a0c19fd3ddb9428b13fa141) | 0.4.0 | CLI 1.4.6: generated strict validation/install/catalog: four exact `tkt:skill` names; all source policy flags match. Root Git plugin also validates non-strict; strict emits the repository AGENTS warning below | Generated pass; root syntax pass with context warning |

Machine-readable [six-row evidence](evidence/source-conformance-20261023.json) retains
commands, native output, artifact identities, names and generated tree digests. The
[tkt root-manifest check](evidence/tkt-agy-root-20261023.json) records both strict and
non-strict results. Generated agy package digests (sorted relative path + NUL + bytes + NUL):

- grey-matter: `badf1b34d2975b31f940a3a438e04b648dab3397fb5e83861d419316ae6721c4`
- tkt: `57c5a0b21ff087a941a257505e7f759b6fc4e0084600d11b5038cd22fa00570f`

## Contract coverage

**Identity, metadata and versions.** Both use stable kebab-case names, SemVer versions,
author/repository/license metadata and matching per-host identities. Codex interfaces
supply display name, short description, developer and category. `metadata.deploy` in
tkt's Claude plugin is inert pack configuration, not Agent Skills frontmatter metadata.
Generated agy metadata comes from that pack manifest. Format acceptance does not prove
license completeness: grey-matter lacks a LICENSE and its copied PR content has
additional upstream notices. Ticket 74 blocks candidate preparation and final audit.

**Sources, namespaces and dependencies.** Codex catalogs use local `./` sources relative
to marketplace root, with AVAILABLE/ON_INSTALL policy. Claude marketplaces also point
to `./` without a second version authority. These entries declare no remote ref/SHA;
the downloaded marketplace revision supplies it. Stable/tag selectors and upgrade
behavior are release gates, not facts inferred from these local installs. grey-matter's
Claude dependency is explicitly `tkt@tkt`, with a cross-marketplace allowlist; other hosts
do not inherit it. Actual remote dependency resolution remains ticket 69. tkt CLI is a
separate prerequisite. Generated agy uses default flat skill directories so buckets do
not alter command names; all installed names are asserted, not merely counted.

**Frontmatter, sidecars and invocation.** Independent YAML parsing checks 44 grey-matter
skills/34 Codex sidecars and four tkt skills. Core names, descriptions, metadata and
applicable policy field types pass. It caught and repaired an unquoted description
colon in game-native-design that native checks had missed. Nine isolated fixtures
cover malformed YAML, duplicate keys, type errors, valid quoted descriptions and host extensions.
Read [policy evidence](plugin-invocation-policy.md): paired controls, explicit human
expansion and removed-policy controls pass on Codex 0.147.0, Claude 2.1.223/2.1.309 and
agy 1.4.5/1.4.6. The agy policy field remains undocumented by its frontmatter reference;
these are version-specific runtime observations, not a promise about every host version.

**Resources and execution.** Full tracked Codex/Claude archives include their declared
skill resources. Generated agy packages flatten skill folders while projecting concrete
Markdown links and including linked documents transitively. Installed resource paths
resolve, including all three wrap-session documents. Missing resources fail before
replacing an output package. Fixtures protect code-styled link labels and leave fenced
or inline examples unchanged. Arbitrary commands/dynamic resource lookups and workflows
that execute tkt or release scripts require candidate tests 67/69; catalog discovery is
not a full workflow execution claim.

**Hooks, security and privacy.** No audited plugin declares hooks, MCP/LSP servers,
authentication services, secret configuration, startup executables or background sidecars.
Their schemas/permissions are N/A to these components. Bundled helper scripts run only
through invoked workflows and still require review/testing. ON_INSTALL is catalog policy,
not evidence of a bundled authentication service. Public-directory privacy/listing review
is N/A to the scoped Git marketplaces and remains unverified if store submission is added.
No credentials or real model endpoints were used by this audit.

## Findings and disposition

| Finding | Status / owner |
| --- | --- |
| Three dangling generated agy resource links | Repaired under 72; 1.3.1 also restores flat command namespaces after isolated installs exposed bucket prefixes. Seeded resource/namespace fixtures and installed-path checks pass. |
| Human-only activation previously unverified | Resolved for the tested versions under 73 through captured host context and explicit expansion. This is not a filesystem security boundary. |
| Native Claude scanner misses nested custom skill defects and malformed YAML | Independent parser is invariant 10 of check-repo. Current native probe checks exact flat components and proves invalid-description detection. Formal YAML parsing remains a separate mandatory candidate gate. |
| grey-matter MIT declaration lacks a root license; copied HumanLayer PR guidance lacks full applicable notice artifacts | Open release blocker 74. [Pinned source research](humanlayer-notices.md) records actual notice identity and the unknown originally copied revision. |
| Root CLAUDE.md ignored by Claude; root tkt AGENTS.md ignored by agy | Repository guidance is intentionally not registered plugin context. No release claim may advertise it as automatically loaded. agy root strict exits 1 for that warning; generated package strict passes. No rules injection is added to silence it. |
| Claude icon and current install-line advice | Nonblocking source advice; artifact polish and applicability are tracked in 71 and reviewed by 70. |
| Unconstrained tkt dependency; system-skill namespace anomaly in Codex | Preserve the current dependency policy and test actual release pairs in 69. The system-name anomaly from earlier probes is a client observation, not a reason to change valid manifests; reproduce before any external report. |
| Platforms, previous-release upgrades and stable/pinned delivery | Required remaining gates: 60, 66–70. No unavailable platform is counted as pass. |

## Primary specifications actually read

Read/retrieved 2026-10-23. Retrieval date is not a claimed publication date. Detailed
field-by-field notes and source/runtime conflicts remain in the host reports.

- OpenAI: [plugin packaging](https://developers.openai.com/plugins/build/plugins)
  (compatibility fallback, plugin structure, marketplace metadata, local sources/path rules),
  [skills](https://developers.openai.com/plugins/build/skills) (workflow boundaries/resources),
  [sidecar policy](https://learn.chatgpt.com/docs/build-skills#optional-metadata), and
  [directory guidelines](https://developers.openai.com/plugins/plugin-guidelines).
  Existing `.codex-plugin` compatibility manifests are supported; a portable-format
  migration is not required. See [Codex audit](codex-plugin-conformance.md).
- Claude: [manifest fields](https://code.claude.com/docs/en/plugins/manifest-reference#fields),
  [marketplace entries](https://code.claude.com/docs/en/plugins/marketplace-reference#plugin-entries),
  [cross-marketplace dependencies](https://code.claude.com/docs/en/plugins/dependencies#depend-on-a-plugin-from-another-marketplace),
  [skills/invocation](https://code.claude.com/docs/en/skills#control-who-invokes-a-skill),
  [loading paths](https://code.claude.com/docs/en/plugins/loading#paths-that-escape-the-plugin-directory),
  [current native validation](https://code.claude.com/docs/en/plugins/cli-reference#validate-a-directory)
  and [security capabilities](https://code.claude.com/docs/en/plugins/security#understand-what-a-plugin-can-do).
  See [Claude audit](claude-plugin-conformance.md) and [seeded current-validator evidence](claude-current-validation.md).
- Antigravity: [plugins](https://www.antigravity.google/docs/plugins?tab=cli),
  [vendor schema](https://antigravity.google/schemas/v1/plugin.json) and
  [skills](https://www.antigravity.google/docs/skills/). The schema was fetched directly;
  SHA-256 `0eea5e483af6f03fa099f32b065d2924a323f1a616ed0323cfa0b7a74ff9543c`.
  The embedded docs schema is older than the live schema; live schema/native checks
  agree on the actual generated fields. See [agy audit](agy-plugin-conformance.md).
- Shared: [Agent Skills specification](https://agentskills.io/specification)
  (frontmatter types, names, resources, progressive disclosure) applies to all skill files.
  [Agent Plugins 1.0 schema](https://agent-plugins.org/schemas/1.0.0/plugin.schema.json)
  was inspected, but these compatibility packages do not declare it; native agy reports
  `agentPluginsSpec: false`. Its canonical-schema requirement is N/A here.
- Parser: [yaml document API](https://eemeli.org/yaml/#parsing-documents) documents strict
  parsing and diagnostic arrays; pinned 2.9.1 is a maintainer dependency, not a plugin or
  deploy-engine runtime dependency.

## Repeat and advance

Create exact inputs with `git -C REPO archive SHA` into separate temporary directories.
Use fresh HOME/USERPROFILE/XDG/CODEX_HOME/CLAUDE_CONFIG_DIR for native operations and no
inherited credential variables. Commands/output and expected counts are retained in the
six-row evidence. Codex discovery uses JSON-RPC initialize, initialized, then
skills/list with the disposable workspace and forceReload=true; no turn/start is sent.
For agy, build from the archived deployer, validate, install into the disposable home,
then use read-only `/skills`; this makes no model turn.

Run `npm ci --ignore-scripts`, `node scripts/check-repo.mjs`,
`node --test scripts/skill-syntax.test.mjs` and the syntax checker with `--pack <tkt>`.
Use `scripts/probe-claude-validation.mjs` with a current isolated CLI for each Git
candidate checkout, and `scripts/probe-invocation-policy.mjs` on the tested macOS rig.
Native probes are explicit gates, separate from offline checks. Re-run all relevant
checks on candidate artifacts after version, notice or packaging changes. Ticket 70
makes the staging decision; 71 repeats gates after final artifact edits. No release
was tagged, published, promoted or submitted by this audit.

## Notice remediation verification

Ticket 74 added the missing license and attribution artifacts, accurate mixed-license
metadata, and mandatory notice checks. The [notice inventory](plugin-notice-inventory.md)
records pinned provenance and the [fresh six-row evidence](evidence/notice-conformance-20261023.json)
for grey-matter `1190b6a` / tkt `5b6c867`. All six native loading/validation rows pass;
AGY installed legal files and Codex cache files match source bytes. The matrix above
retains the original audit revisions and their historical notice findings. Remaining
candidate, platform, upgrade and release gates still apply.
