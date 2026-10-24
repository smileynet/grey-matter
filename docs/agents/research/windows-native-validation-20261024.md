# Windows native candidate validation — 2026-10-24

**Historical partial report; Windows validation now passes in the [completion report](windows-native-validation-completion-20261024.md).** The findings below describe the initial run before the user authorized live duplicate cleanup. SSH execution used `uosmi@sharktank` on Windows 11 Pro 10.0.26300 x64. No publication or coverage exclusion is granted.

[Structured evidence](evidence/windows-native-validation-20261024.json) contains the reports, tool hashes, source research and limitations. The [raw evidence ZIP](evidence/windows-native-validation-20261024.zip) retains 54 files, including executed probe/launcher sources, product logs and per-member hashes. Its SHA-256 is `d8a4db0010dfd9a258c7b93c2d79cb1e06a543cdfe4819a33f36797d310284b3`; all 53 manifested member hashes and both product-log hashes were checked after transfer.

## Frozen inputs and checkout update

| Product | Version | Exact candidate | Updated source checkout |
| --- | --- | --- | --- |
| grey-matter | 0.2.0 | `e071b7b03d02025dc1af6c3ff2c4f8369f777587` | `D:\code\grey-matter` → `dfe3b05a9d91ca1299dbf3b815c289f7d3ec17c8` |
| tkt | 0.5.0 | `2b6ff173993c9fe413c40287fb1cb3f0a9879ca1` | `D:\code\tkt` → `df4b652aa16e98fceda1fc58ec226691c11bbc0d` |

GitHub credential prompting failed over SSH. Both clean source checkouts were fast-forwarded from transferred Git bundles containing the verified commits; no remote settings were changed. Detached candidate worktrees preserved Git bytes with `core.autocrlf=false`. All four checkouts were clean after testing. Original sealed archives were transferred and their six hashes matched the [candidate audit](final-release-audit-20261024.md); no artifacts were rebuilt.

## Observed results

| Check | Result and scope |
| --- | --- |
| grey product gate | Pass: `node scripts/check-repo.mjs --require-tools`, all 12 groups. Two Unix-specific Node cases explicitly skipped. |
| tkt product gate | Pass: `mise run check`; 36 Node passes, one relative-symlink skip, fmt, Clippy and 295 Windows Rust tests. |
| Six native package rows | Pass: both packs in Codex 0.147.0, Claude 2.1.310 and AGY 1.4.6. Exact installed bytes, skill names, seeded validation and policy metadata checked. Final commands exit 0, including cleanup. |
| Claude upgrade/session | Pass: actual previous tagged bare installs, dependency-first plugin installation, 50 managed commands → zero disabled → the same 50 restored; one hook per pack; repeated deploy and foreign preservation. |
| AGY upgrade | Pass: synthetic old plugin controls add, modify and retire skills; disable/enable, repeated bytes and foreign sentinel. All 253 grey / 43 tkt installed files match. Zero model turns. |
| Bare deployment/OpenCode 1.18.21 | Pass: three roots each contain 50 managed skills plus one foreign sentinel. Dry runs change nothing; repeated payload hashes match. OpenCode's native catalog has exactly those 51 names. |
| Kiro 2.34.0 ACP | Pass with `KIRO_HOME`: exactly the 51 owned fixture skills; no model request or credential input. |
| Crush 0.98.1 server | Pass: native local HTTP workspace/catalog contains the same 51 project skills, with no configured providers or model requests. |
| Codex upgrade/state controls | Fixture-scoped pass: 51 owned skills, cache repair, disabled bare fallback, re-enable, junction separation and foreign preservation. **Partial overall:** 48 external skills from the real Windows profile also appear; they were recorded and excluded only from fixture assertions. |
| tkt SessionStart fixtures | Pass: four native Windows cases, including missing project/CLI, partial-query failure and native argument preservation. |
| Actual CI Windows tkt binary | `tkt 0.5.0 (2b6ff17)` from the reviewed build-only stage. Twenty-one commands, 381 references, 42 files, two explicitly planned migration-template exceptions and zero unsupported current flags. Context filtering/restoration passes. |

[L1:verified] Product reports bind their exact candidate SHA, command, exit, platform and log digest. Native reports bind all six archive hashes. The raw ZIP includes the exact Windows-adapted probes and the machine's executable hashes; no macOS/Linux path assumptions are counted as Windows execution.

## Isolation and operational findings

**Codex needs a separate Windows profile for the remaining full-isolation check.** The [pinned resolver](https://github.com/openai/codex/blob/rust-v0.147.0/codex-rs/ext/skills/src/host_roots.rs#L110-L129) adds `dirs::home_dir()/.agents/skills` independently of `CODEX_HOME`. The pinned `dirs` dependency uses Windows `SHGetKnownFolderPath(FOLDERID_Profile)`, ignoring HOME/USERPROFILE overrides. The [skill configuration schema](https://github.com/openai/codex/blob/rust-v0.147.0/codex-rs/config/src/skills_config.rs#L12-L35) supplies per-skill enablement, not a root replacement. [L1:verified] The native catalog exposed 48 external skills. Those directories were not changed to make tests pass. A clean account/VM or an explicit fixture-scope exclusion remains necessary; ticket 77 is not closed.

**Kiro requires `KIRO_HOME`.** Initial home-only probes exposed existing user skill metadata; ACP session creation may also have written native session metadata. No personal state was deleted or edited to force success. The [official override](https://kiro.dev/docs/reference/cli-commands/) covers global skills and session state; [2.31.0 notes](https://kiro.dev/changelog/cli/2-31/) confirm V3 support before the pinned version. [L1:verified] The final probe set it to the fixture `.kiro` directory and observed only the expected 51 skills.

**Disable AGY updates inside the actual child launcher.** The canonical helper's environment allowlist drops an ambient updater flag. Initial commands wrote passing package rows but exited 1 when cleanup hit `update.lock`; the private binary subsequently reported 1.4.7. Those runs are not terminal passes. The [documented updater control](https://www.agy.dev/docs/cli/troubleshooting/) was set by a retained, test-only native launcher before invoking restored, hash-verified 1.4.6 bytes. Both unchanged canonical helpers then exited 0. Only processes running from the owned private tool directory and three named failed-test temporary directories were cleaned up; launcher source and process receipt are retained.

**Review old Windows copies before migration.** Git Bash's v0.4.0 tkt installer created ordinary directories. The migration tool correctly refused to delete them as symlinks. Upgrade probes compared complete file lists and every file's bytes against the old tagged source before manually removing only those owned fixtures. This proves the reviewed manual path; it does not prove automatic migration of arbitrary Windows copies. The release companion guide must explain this distinction.

No OS filesystem or network sandbox is claimed. Environment allowlists, disposable application directories and initialization/catalog requests reduced exposure, but the initial Kiro/Codex metadata exposure above prevents a blanket claim that no personal state was accessed. No real credentials or model prompts were supplied. Hook fixtures and native registration pass; authenticated interactive hook execution and model activation of every skill are outside the measured scope.

## Initial reproduction and remaining gate (resolved by the completion report)

Retained Windows inputs live under `D:\code\windows-pinned-tools`, `windows-grey-artifacts`, `windows-tkt-artifacts` and the two detached candidate worktrees. Executed scripts and exact commands are in the ZIP. Invoke real executables rather than the broken mise/WinGet/Bun launchers found in the SSH PATH. Use Node 22.23.1; the tkt gate resolved Rust 1.95.0. Pin downloads using the official [Codex release](https://api.github.com/repos/openai/codex/releases/tags/rust-v0.147.0), [Claude manifest](https://downloads.claude.ai/claude-code-releases/2.1.310/manifest.json), [AGY release](https://api.github.com/repos/google-antigravity/antigravity-cli/releases/tags/1.4.6), [OpenCode release](https://api.github.com/repos/anomalyco/opencode/releases/tags/v1.18.21), [Crush release](https://api.github.com/repos/charmbracelet/crush/releases/tags/v0.98.1), and [versioned Kiro MSI](https://prod.download.cli.kiro.dev/stable/2.34.0/kiro-cli-x86_64-pc-windows-msvc.msi). The MSI was administratively extracted, not installed.

Next: repeat the Codex catalog/state probe under a clean native Windows account or VM with no existing user skills, retain the complete unfiltered catalog and verify cleanup. Alternatively, audit 70 may record an explicitly approved fixture-scope exclusion. Until then, the sequence remains **77 → 70 → 71**; no platform-approval, final-audit or staging receipt is issued.
