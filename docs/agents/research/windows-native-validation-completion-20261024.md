# Windows validation completion and SharkTank catalog cleanup

**Windows validation passes for both frozen candidates.** User-authorized cleanup removed the live duplicates that had prevented a complete Codex catalog assertion. No coverage exclusion, release publication or staging approval was used.

The [structured completion evidence](evidence/windows-native-validation-completion-20261024.json) joins fresh checks to the unchanged [initial Windows evidence](windows-native-validation-20261024.md). The [new raw ZIP](evidence/windows-native-validation-completion-20261024.zip) contains 44 files, including executed sources, backup manifests, catalogs, deployment receipts and product/native reports. SHA-256: `667f668b3c7f63c1d4e7a50ce2790c65fd91fe808c87c6568b5eaf2a51cb0159`. All 43 manifested members and both product-log hashes were verified after transfer.

## Live cleanup

[L1:verified] The initial native Codex catalog contained 48 duplicate names, each pointing to both `.agents/skills` and `.codex/skills`. The deployer also found 48 duplicates visible to OpenCode through `.agents/skills` and `.claude/skills`. Ownership manifests identify all those grey-matter/tkt copies. All 48 duplicated SKILL.md hashes and all 125 payload file hashes match across the four original roots.

Before mutation, 192 managed skill directories across four roots were backed up to `D:\code\sharktank-cleanup-20261024\managed-skills-before.zip`; its SHA-256 is `d92793b1066f0c0688ae839653ef1b9739d277c78d42b023cd8a803addabb197`. Backup manifests and archive hashes are in the evidence; rollback payloads remain on SharkTank. Dry runs left every managed file unchanged. Each pack's canonical deployer then ran once for this cleanup, without `--force`.

The deployers removed 48 redundant shared-root directories and updated the retained roots to 46 grey-matter plus four tkt skills. The two previously missing grey-matter skills, `spike-options` and `delivery-dashboard`, are now installed. AGY's expected two plugins were installed through the same deployment. Live source versions remain 0.1.0/0.4.0; the frozen 0.2.0/0.5.0 candidates were tested separately, without publishing them.

| Live root | Managed skills after cleanup | Readers |
| --- | --- | --- |
| `~/.codex/skills` | 50 | Codex |
| `~/.claude/skills` | 50 | Claude, OpenCode, Crush |
| `~/.kiro/skills` | 50 | Kiro |
| `~/.agents/skills` | 0 | Redundant managed copies removed |
| `~/.gemini/config/plugins` | 46 + 4 | AGY plugins |

[L1:verified] All 244 unowned, non-vendor-cache files retained their SHA-256 values or link targets. Codex's vendor-managed `.system` cache refreshed during native client use: 32 entries differ from the initial snapshot. That cache is recorded separately, not included in the user-content preservation claim. Remaining deployer findings name unique unowned directories; there are no duplicate findings or audit errors. Unowned directories were not deleted or adopted by the installers.

## Native catalogs after cleanup

| Harness | Managed skills | Native evidence |
| --- | --- | --- |
| Codex 0.147.0 | 50, once each | Full live app-server catalog: 65 total entries, no duplicate names; system and other installed skills retained. |
| Claude 2.1.310 | 50, once each | Initialization control response: 108 command metadata entries, no duplicate names; no user prompt. |
| OpenCode 1.18.21 | 50, once each | `debug skill --pure`: 63 unique skills. |
| Kiro 2.34.0 | 50, once each | ACP session metadata: 51 unique skills, including the existing `cpu-perf-bench`. |
| Crush 0.98.1 | 50, once each | Native local server: 61 unique user skills plus three system skills. |
| AGY 1.4.6 | 50, once each | Native enabled-plugin inventory lists exactly the two packs. Every installed payload file matches a disposable shadow that loads 50 managed skills plus five builtins, with zero model turns. |

The live AGY print-mode catalog requested OAuth login, which was not completed. Its enabled-plugin inventory is credential-free; the byte-identical shadow uses disposable Gemini settings and a dummy key/loopback endpoint. No personal provider/authentication settings were changed. This distinguishes observed native inventory and payload loading from an authenticated live session.

Crush's first live probe incorrectly retained the fixture's `CRUSH_SKILLS_DIR` override, hiding normal global roots. The [pinned implementation](https://github.com/charmbracelet/crush/blob/v0.98.1/internal/config/load.go#L1365-L1392) confirms that this variable replaces the global list. Removing that test override restored default user-root discovery. The final catalog includes all 50 managed skills once. Two pre-existing, unowned Claude files (`app-setup` and `agentcraft-guide`) do not appear in Crush's catalog; their bytes remain unchanged. This cleanup does not claim to make every foreign skill portable across harnesses.

## Frozen candidate verification

The candidates remain grey-matter `e071b7b03d02025dc1af6c3ff2c4f8369f777587` and tkt `2b6ff173993c9fe413c40287fb1cb3f0a9879ca1`. Original archive hashes match; no candidate or artifact was rebuilt. Both source checkouts and both detached candidate worktrees were clean when evidence was collected.

- Fresh grey product gate: all 12 groups pass; its two intentional Unix-specific Node skips remain explicit.
- Fresh tkt product gate: 36 Node passes, one intentional skip, formatting, Clippy and 295 Windows Rust tests pass.
- Fresh canonical native helpers: all six package rows pass, including cleanup, using the pinned updater-disabling AGY launcher.
- Complete Codex candidate probe: all non-system discovery is exactly 50 namespaced managed skills plus the owned foreign sentinel. Repeated catalogs, same-version cache repair, disabled bare fallback, re-enable, junction separation and foreign preservation pass. No external user skills are filtered out. Terminal exit is 0.

The earlier Windows Claude/AGY upgrade groups, Kiro/OpenCode/Crush fixture catalogs, four tkt SessionStart fixtures, push-gate fixtures and actual CI Windows CLI/context proofs remain bound to the same unchanged inputs. Their raw evidence is retained, rather than relabeled as fresh executions. Old Git Bash tkt copies still require the documented byte-reviewed manual migration path.

Network isolation was not enforced. Initialization/catalog controls supplied no real credentials or model prompts. The initial report's user-metadata exposure remains historical evidence; this follow-up explicitly authorizes and records live user-state cleanup. Windows ticket 77 is closed with these limits (commit `67cdaac`). Final audit 70 and staging 71 remain separate gates; neither is granted here.
