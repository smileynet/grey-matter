# Current Claude native validation — ticket 73

Date: 2026-10-23. Current npm `latest` resolved to Claude Code **2.1.309**.
The regular installed CLI remains 2.1.223; no real installation or authentication
was changed. No model call, marketplace install, or external message occurred.

## Sources read

- [L4:verified] [Official npm installation](https://code.claude.com/docs/en/setup#install-with-npm), retrieved 2026-10-23: npm installs the same native binary through a platform optional dependency; Node22+ is recommended. We used a temporary local prefix and disabled scripts, then invoked the platform binary directly.
- [L4:verified] [Current validation reference](https://code.claude.com/docs/en/plugins/cli-reference#validate-a-directory), retrieved 2026-10-23: 2.1.289+ can validate co-located root manifests; component directory validation and strict/JSON output are supported. The same page documents that direct files are manifests, not arbitrary SKILL.md inputs. Unknown or missing component coverage must be observed rather than inferred from exit0.

## Acquisition and isolation

Evidence: `npm view @anthropic-ai/claude-code version dist.tarball --json`
→ version2.1.309, official scoped package registry tarball.

Reproduce acquisition with Python `tempfile.mkdtemp(prefix="claude-current-")`,
then run this argument vector (substitute that temporary path for TEMP):

```text
npm install --prefix TEMP/install --cache TEMP/npm-cache --ignore-scripts --no-audit --no-fund @anthropic-ai/claude-code@2.1.309
TEMP/install/node_modules/@anthropic-ai/claude-code-darwin-arm64/claude --version
```

Evidence: npm exit0, two packages added; platform binary prints
`2.1.309 (Claude Code)`. Binary SHA256:
`5eadc0009cdcdbc0d06e58110d7b2baf88ced6088b1c33a60a21217fe410619c`.
The install prefix and npm install cache were temporary. Initial metadata lookup
used ordinary npm configuration; no global install/update was run.

Each validator subprocess used a fresh explicit environment containing only PATH,
CLAUDE_CONFIG_DIR=TEMP/config, DISABLE_UPDATES=1, and
CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 (initial clean probes also set
XDG_CONFIG_HOME=TEMP/xdg, DISABLE_TELEMETRY=1, DISABLE_ERROR_REPORTING=1).
No credential variables were inherited. Commands ran from TEMP, not either repo.
HOME was not repurposed. These were path-explicit validator operations, not
full-home runtime/invocation probes. Real user-root loading is not claimed isolated.

Create source inputs with `git -C REPO archive SHA`, extracted through Python
`tarfile.open(fileobj=io.BytesIO(output)).extractall(ROOT, filter="data")`.

| Repo | Exact archived SHA | Source skill count |
| --- | --- | --- |
| grey-matter | fe50b6d71904d2bb8eb13232aa2ee3f99e853eae | 44 |
| tkt | 45db853e20dfa915ee92fb00fe21cff1fb2a6327 | 4 |

## Native results

For each archive ROOT, run `BINARY plugin validate TARGET --json` separately with
TARGET=ROOT, ROOT/.claude-plugin/plugin.json,
ROOT/.claude-plugin/marketplace.json, and ROOT/skills.

All eight clean commands exited0 with success=true and no manifest errors or
manifest warnings. grey-matter root/plugin runs retain the known root CLAUDE.md
warning. Both root/plugin runs emit nonblocking ICON_MISSING directory findings
and README install-line advice; neither is a syntax rejection. tkt standalone
skills validation also passed `--strict`.

**New limitation, proven with seeded defects:** the current validator does not
validate grey-matter's nested custom skill roots through its root/plugin-manifest
or root/skills invocation. Temporarily replace `description:` on
skills/meta/release/SKILL.md with `description: [seeded-invalid-array]` in the
archive only; all three invocations still exit0 and report no skill error.
The identical seed in tkt's skills/tkt-core/SKILL.md causes all three commands
to exit1 and report `description must be a string, got array` against that file.
Thus clean JSON contents=[] is not by itself evidence of omission: valid files
produce no content entries. The controlled seed establishes the custom-path gap.

To cover grey-matter components independently, copy each of the 44 skill
folders to TEMP/grey-components/skills/<name> (shutil.copytree), then run:

```text
BINARY plugin validate TEMP/grey-components/skills --strict --json
```

Evidence: seeded invalid release description exits1 with the expected field
error; restoring the original exits0 with success=true. All44 resulting
SKILL.md byte contents were compared to the source archive and matched.
This is native frontmatter validation of the exact component contents through
an accepted flat scanner shape. It does not prove that custom-root packaged
loading works; earlier native `plugin details` inventory covers that separately.

A malformed-YAML seed (`name: [unterminated...`) was also tried in each archive;
root/plugin/skills scans did not reject it. Do not use malformed YAML as a
positive seeded-validation signal. Directly passing SKILL.md exits1 with a JSON
parse error because that argument is treated as a manifest; it is not valid
component-validation evidence.

## Coverage and remaining limits

✅ Current validator acquired without touching real install/auth; both explicit
manifest types checked, tkt normal skill layout checked, and all44 grey-matter
skill contents checked natively in a verified copied flat layout.

⚠️ Native packaged grey-matter custom-root component validation has a confirmed
coverage gap in2.1.309; retaining a per-component flat validation wrapper or
another seeded detector is necessary to claim coverage. No tracked rule was
added in this research task. Current source validation plus the flattened
component probe covers the observed manifest/frontmatter checks, not complete YAML syntax or a release bundle sign-off.

Invocation enforcement, authenticated sessions, dependency installs and upgrades,
Windows/Linux, reduced release bundle completeness and full-home isolation remain
unverified here. Ticket69 owns broader installed behavior. Ticket73 must not
conflate this schema evidence with observed human-only invocation enforcement.

## Raw evidence files

These historical files were under `.scratch/research/`; the commands above reproduce their results. Summary evidence is retained in [native validation results](evidence/claude-validation-20261023.json):

- claude-current-validation-raw.json: clean eight commands and outputs.
- claude-current-seed-raw.json: malformed-YAML experiment.
- claude-current-components-raw.json: generic invalid-description fixture and strict checks.
- claude-current-description-seed-raw.json: same invalid-description seed in actual archives.
- claude-current-flat-components-raw.json: flattened44 component red/green proof.

No tracked files were modified by this subtask. All seeded source modifications
were in temporary archives and restored before the final byte comparison.

## Repeatable component gate

Run `node scripts/probe-claude-validation.mjs --binary <current-Claude-binary>` and repeat with `--pack <tkt-checkout>`. It validates both explicit manifests, copies every skill into an isolated flat scanner layout, checks exact SKILL.md bytes, runs strict component validation, and proves an invalid-description array fails. Only disposable copies are seeded. The probe rejects clients older than 2.1.289 and never installs or authenticates a CLI. This is an optional native gate, separate from offline check-repo. Candidate preparation and final audit must run it.

## Checkout scan limit and syntax gap

The first reusable probe run against the live tkt checkout reported `directory.incomplete: true`: the native advice scan hit its 20,000-entry/32-level cap while build output was present. That was not complete directory-scan evidence. The reusable gate now validates a disposable snapshot of tracked working-tree files, excluding `.git` and untracked build output, and fails any remaining incomplete scan. Components are separately copied and byte-compared. This differs from the earlier committed-revision archives and does not claim those archive tests were incomplete.

Malformed YAML remains an uncovered native-validator case: the earlier malformed-name seed was accepted. The invalid-description control proves that one frontmatter type detector works; it does not prove a full YAML parser. Ticket 65 must add an independent YAML syntax gate, and ticket 67 must retain it for candidates. Ticket 70 cannot infer syntax completeness from native exit 0.
