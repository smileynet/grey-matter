> Preserved research evidence from 2026-10-23. Scratch output names below describe historical probe artifacts; reproduce the commands rather than depending on those temporary files. This report is not a release sign-off.

# Claude Code conformance: ticket 65

Audited 2026-10-23. Coverage: both repositories' Claude plugin manifests,
marketplaces, skill catalogs/frontmatter, invocation declarations, native discovery,
and tracked-file isolation. No installs, authentication, or model calls performed.

## Artifacts and evidence

- [L1:verified] grey-matter source: `4e06a3cfa77cc27fffb761dbecccf373510329f1`, clean
  `git status --short`; `.claude-plugin/plugin.json` version `0.1.0`.
- [L1:verified] tkt source: `603f740944adaad8784a3389b633689944a35dda`, clean
  `git status --short`; `.claude-plugin/plugin.json` version `0.4.0`.
- [L1:verified] `claude --version` → `2.1.223 (Claude Code)`.
- `claude plugin validate <repo>` → exit 0, marketplace validation passed for both.
- `claude plugin validate <repo>/.claude-plugin/plugin.json` → exit 0 for both;
  grey-matter warns that root `CLAUDE.md` does not load as plugin context; tkt clean.
- `claude plugin validate --strict <repo>/.claude-plugin/plugin.json` →
  grey-matter exit 1 solely for that warning; tkt exit 0, validation passed.
- `node scripts/check-invocation-policy.mjs` → 44 skills, 20 user-invoked;
  frontmatter, Codex sidecar policies, and README groups agree.
- `claude --plugin-dir <grey-matter> --plugin-dir <tkt> plugin details grey-matter`
  → 44 skills; zero agents, hooks, MCP and LSP servers.

Isolation used `git archive HEAD` for each exact revision, extracted under
`/var/folders/fw/z0mm4znn647d9n5_nvtjyqtm0000gn/T/claude-conformance-lqzpp9xn/`.
Each process ran from the temporary parent with its own fresh `CLAUDE_CONFIG_DIR`,
and `ANTHROPIC_API_KEY`/`CLAUDE_CODE_OAUTH_TOKEN` removed from the environment.
The explicit archives and fresh config isolate plugin inputs and registrations.
No `HOME` variable was overridden, so exclusion of every other user-root skill
scan was not proven. This is config/archive isolation, not full home isolation.

Evidence: isolated `claude plugin validate <archive>/.claude-plugin/plugin.json`
→ same exit 0 results and warning as above. Isolated
`claude --plugin-dir <archive> plugin details <name>` → grey-matter 44 skills,
tkt 4 skills (`tkt-core`, `tkt-orient`, `tkt-reconcile`, `tkt-work`), both
`@inline`, both zero agents/hooks/MCP/LSP. This verifies inventory discovery,
not an authenticated session or marketplace dependency installation.

## Primary sources actually read

All retrieved from official Claude Code documentation on 2026-10-23. No page
publication date was exposed; retrieval date is not a publication date.

- [L4:verified] [Manifest fields](https://code.claude.com/docs/en/plugins/manifest-reference#fields),
  [dependencies](https://code.claude.com/docs/en/plugins/manifest-reference#dependencies),
  [unrecognized fields](https://code.claude.com/docs/en/plugins/manifest-reference#unrecognized-fields),
  and [path-only fields](https://code.claude.com/docs/en/plugins/manifest-reference#path-only-fields):
  manifest metadata and explicit skill directories are supported; `metadata` is inert.
- [L4:verified] [Marketplace file](https://code.claude.com/docs/en/plugins/marketplace-reference#marketplace-file),
  [top-level fields](https://code.claude.com/docs/en/plugins/marketplace-reference#top-level-fields),
  [plugin entries](https://code.claude.com/docs/en/plugins/marketplace-reference#plugin-entries):
  relative sources resolve from marketplace root. Unknown keys warn rather than fail.
- [L4:verified] [Dependency declarations](https://code.claude.com/docs/en/plugins/dependencies#declare-a-dependency-with-a-version-constraint),
  [cross-marketplace dependencies](https://code.claude.com/docs/en/plugins/dependencies#depend-on-a-plugin-from-another-marketplace):
  qualified dependencies and root marketplace allowlists are supported. Warning:
  unconstrained dependencies follow newer releases, potentially introducing incompatibility.
- [L4:verified] [Publication checklist](https://code.claude.com/docs/en/plugins/publish#prepare-your-plugin-for-release),
  [own marketplace](https://code.claude.com/docs/en/plugins/publish#publish-through-your-own-marketplace):
  explicit versions require a bump for remote updates; own-marketplace auto-updates
  default off. The recommended root source is `./`.
- [L4:verified] [In-place/copied plugins](https://code.claude.com/docs/en/plugins/loading#in-place-and-copied-plugins),
  [escaping paths](https://code.claude.com/docs/en/plugins/loading#paths-that-escape-the-plugin-directory):
  remote installations copy plugin-root files; local relative marketplace plugins
  load in place, without requiring a version bump for edits. External files are unavailable.
- [L4:verified] [Frontmatter](https://code.claude.com/docs/en/skills#frontmatter-reference),
  [invocation](https://code.claude.com/docs/en/skills#control-who-invokes-a-skill),
  [supporting files](https://code.claude.com/docs/en/skills#add-supporting-files):
  `disable-model-invocation` is valid in Claude Code plugins; sidecars are not Claude
  invocation policy. Unknown fields or malformed YAML can silently lose intended behavior.
- [L4:verified] [Native validation](https://code.claude.com/docs/en/plugins/cli-reference#validate-a-directory):
  validation behavior depends on version; checking both root manifests together
  requires 2.1.289, standalone component validation requires 2.1.233.
- [L4:verified] [Security capabilities](https://code.claude.com/docs/en/plugins/security#understand-what-a-plugin-can-do):
  plugins can run user-privilege code; hooks/servers run outside tool sandboxing.
  Review executable content and updates before trusting them.

## Matrix and findings

| Repository | Syntax, metadata, source and dependency result | Invocation and runtime files | Disposition |
| --- | --- | --- | --- |
| grey-matter | Kebab-case name; explicit version; author/homepage/repository/license; matching marketplace entry; `source: "./"`; no entry ref/SHA (inherits fetched marketplace revision). Three `./skills/<bucket>` paths exist. Dependency `{name:"tkt",marketplace:"tkt"}` and allowlist `["tkt"]` agree with current documented syntax. | All 44 skills discovered from tracked archive. 20 set supported `disable-model-invocation: true`; remaining 24 use default invocation. All 44 have name/description; two argument-hint fields and one metadata field are supported. Native root CLAUDE.md warning. | Compatible syntax and discovery; bounded warning and coverage gaps below. |
| tkt | Kebab-case name; explicit version; author/homepage/repository/license; matching marketplace entry; `source: "./"`; no entry ref/SHA. No plugin dependencies. Custom deploy data correctly nested under inert `metadata`. | Four skills discovered using default `skills/` scan; all name/description, two compatibility fields. No restrictive invocation frontmatter; all use default user/model invocation. CLI prerequisite explicit in plugin description. | Compatible syntax and discovery; coverage gaps below. |

No Claude component path points outside either plugin root. A Markdown-target scan
of every SKILL.md found no missing concrete file: the only apparent miss was
wayfinder's fenced `[<closed ticket title>](link)` example. Its target is template
syntax, not a runtime dependency. Backticked project commands such as
`node scripts/deploy.mjs` instruct work in a target checkout, so they are not
relative skill-file declarations. Whole-repository archives include tracked root
scripts/docs referenced by these skills. A future minimal bundle must retain them;
this audit does not certify an unbuilt reduced bundle.

- **Informational C1:** grey-matter root CLAUDE.md is ignored by plugin loading.
  It is the repository's harness pointer, not a plugin manifest component; no loss
  of a declared plugin skill. Non-blocking unless release claims it ships context.
- **Medium C2, verification limitation:** installed 2.1.223 root validation checks
  only marketplace.json when both manifests exist. The explicit plugin.json run
  closes manifest coverage, but this validator predates documented comprehensive
  component checks. Existing check-repo success alone cannot certify runtime files.
  Discovery from tracked archives provides independent catalog evidence. A current
  native validation pass remains unverified; do not report latest-validator conformance.
- **Low C3, accepted-policy risk:** grey-matter's unversioned tkt dependency can
  advance incompatibly. Current project policy explicitly chooses no version range;
  syntax is valid, no migration is required. Release compatibility tests should
  record tested tkt version (release-readiness proposal owns this).
- **No active hooks:** neither plugin declares hooks or contains default
  `hooks/hooks.json`; native inventories both report zero. Git pre-commit scripts
  are repository tooling, not auto-loaded plugin hooks. tkt's proposed SessionStart
  hook is outside current plugin artifacts. Hook schema/permissions are N/A here.
- **Privacy/security:** no plugin userConfig/secrets, network endpoints, MCP/LSP,
  monitors, or registered startup commands. Anthropic directory privacy/listing
  metadata is N/A to these self-hosted marketplaces, not a submission approval.
  Instruction bodies and bundled scripts still influence executable agent actions;
  no claim of general script security review is made.

## Explicit unverified areas

- Actual marketplace install, cross-marketplace dependency resolution, remote
  ref/SHA fetching, fresh-version upgrade/removal and cache behavior (ticket 69).
- Interactive skill invocation and policy enforcement; discovery is not execution.
- Latest Claude native schema/component validation (installed CLI is 2.1.223).
- Windows/Linux loading and path behavior; this evidence is macOS only.
- Reduced release bundles not yet produced; full tracked-root archives alone were tested.
- Full security audit, Anthropic directory submission/review, and runtime CLI
  prerequisites on an end user's machine.

Coverage: ✅ manifest/catalog/source inspection and isolated native inventory;
⚠️ full-home isolation, latest-validator/component execution/install-upgrade certification remains partial.
