# Footprint commands by OS

Commands for "While you work". Tags: **observed** (run on Linux 2026-10-31), **docs** (vendor
documentation), **secondary** (non-vendor source), **inferred** (from docs or source, not run).
Sources and output: [footprint commands research](../../../../docs/agents/research/footprint-commands-by-os-20261031.md).

Agent shells load the user's profile, where `df`, `du` and `cat` can be aliases (`duf`, `dust`,
`bat` on the Linux host). Call `command df`, `command du`, or the inspector, which runs neither.

## Linux

| Need | Command | Tag |
|---|---|---|
| Free space | `command df -Pk <path>` (Available column, KiB) | observed |
| Folder size | `command du -sk <dir>`: allocated, a hard-linked inode counted once | observed |
| Copy-on-write | btrfs and XFS reflinks share extents, so `du` is an upper bound; ext4 has none | docs |
| Recoverable delete | `gio trash <path>` under `$HOME` (restore: `gio trash --restore trash:///<name>`). It refuses `/tmp` and other system mounts; `trash-put` (trash-cli) where installed. With neither, list the path for the user | observed |
| Open files | `lsof -w +D <dir>` (slow on big trees); the inspector reads `/proc` | observed |
| Hard links | `stat -c %h <file>` | observed |

## macOS

| Need | Command | Tag |
|---|---|---|
| Free space | `command df -Pk <path>` | docs |
| Folder size | `command du -sk <dir>`; APFS clones share blocks, so sizes are an upper bound and deleting one clone may free nothing | docs, secondary |
| Recoverable delete | `/usr/bin/trash <path>` on macOS 15 and later; check `command -v trash` first, since Homebrew's `trash` can shadow it. On macOS 14, list the path | secondary |
| Open files | `lsof -w +D <dir>` | docs |
| Hard links | `stat -f %l <file>` | docs |
| Simulators | `xcrun simctl list devices unavailable`, then `xcrun simctl delete unavailable`, as the user, never sudo | secondary |
| Xcode build output | `~/Library/Developer/Xcode/DerivedData/<Project>-<hash>`, unless moved in Xcode Locations or by `xcodebuild -derivedDataPath` | secondary |

## Windows (PowerShell)

Read [windows-powershell-gotchas](../../../../docs/agents/windows-powershell-gotchas.md) for quoting
and command separators.

| Need | Command | Tag |
|---|---|---|
| Free space | `(Get-Volume -FilePath <path>).SizeRemaining` | docs |
| Folder size | `Get-ChildItem <dir> -Recurse -File -Force \| Measure-Object Length -Sum`: logical bytes, every hard link counted again, slow on big trees. ReFS and Dev Drive block cloning share clusters, so it is an upper bound | docs |
| Recoverable delete | No built-in command; `Remove-Item` deletes permanently. `Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($p, 'AllDialogs', 'SendToRecycleBin')` (`DeleteDirectory` for folders). `OnlyErrorDialogs` answers "Yes to All", so a file over the bin's cap is deleted permanently: list those files instead | docs, inferred |
| Recycle Bin cap | Set per drive, about 5% by default; a larger file cannot be recycled | secondary |
| OneDrive folders | An online-only placeholder reports its full size but uses almost no disk; deleting it deletes it in the cloud on every device. Inspect, never delete, inside OneDrive | docs |
| Open files | Sysinternals `handle.exe <fragment>`: a separate download that needs admin. Without it, report open files as unchecked | docs |
| Hard links | `fsutil hardlink list <file>` | docs |

## WSL 2

| Need | Command | Tag |
|---|---|---|
| Free space | The lower of `command df -Pk <path>` and the Windows volume containing this distro's registered `ext4.vhdx`. The inspector matches exact `WSL_DISTRO_NAME` under HKCU Lxss, resolves `BasePath\ext4.vhdx`, and queries its volume; it does not assume C: or `/mnt/c`. If identity or volume lookup is missing/ambiguous, report host space unavailable and the floor unverified. The distro's own `df` reports virtual VHD capacity, not host free space | observed in WSL + Microsoft docs |
| Reclaiming space | Unlinking a file restores guest `df` availability; this alone does not prove Windows host-space reclaim. Microsoft documents automatic growth and sparse-VHD shrink (`wsl --manage <distro> --set-sparse true`, WSL 2.0.0+) and says `.wslconfig sparseVhd=true` applies to newly created VHDs. Host reclaim with and without sparse mode was not verified in this run: toggling only the owned test distro returned `ERROR_SHARING_VIOLATION`, and no global `wsl --shutdown` was run. Keep the host-reclaim result unresolved until measured in an isolated owned distro | observed guest unlink; Microsoft docs; host reclaim unverified |
| Everything else | Linux rows above | |

## Tool caches (all OSes)

Prefer the tool's own prune to deleting its folders by hand.

| Tool | Command | Tag |
|---|---|---|
| pytest | `tmp_path_retention_policy = "failed"`: a passing run leaves nothing; older runs are still trimmed to `tmp_path_retention_count` (3). Runs live in `<temp>/pytest-of-<user>/` (`%TEMP%` on Windows), outside the repo. `--basetemp` turns retention off | observed |
| cargo | `cargo clean` removes the whole workspace target directory, and with a shared `CARGO_TARGET_DIR` every project's output; `-n` previews, `-p <pkg>` narrows | observed, docs |
| go | `go clean -cache` (build cache); `-testcache`, `-modcache` for the others | observed |
| uv | `uv cache prune` | observed |
| npm | `npm cache verify` (garbage-collects); `npm cache clean` needs `--force` | observed |
| git-lfs | Linked worktrees share `.git/lfs/objects`, but each checks out its own full copy; `GIT_LFS_SKIP_SMUDGE=1 git worktree add …` leaves pointers. A separate clone has its own store unless `lfs.storage` points at a shared one | observed |
