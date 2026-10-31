# Footprint commands by OS: fact check for proposal 16

**Date:** 2026-10-31. **Checks:** [proposal 16](../proposals/16-agent-footprint-guardrails.md).
**Host:** Ubuntu Linux (kernel 7.0), zsh, ext4 root on LVM. Trials ran in `/tmp/claude-1000/fp-trial/`,
which was then removed. Two `gio trash` trials under `~/.cache/claude-fp-trial/` were restored and removed.

**Verified how:** *observed on Linux* means the command ran on this host and the output was read.
*docs only* means a primary source with its URL. *secondary* means a non-vendor page or forum.
*inferred* means a conclusion drawn from cited docs or source code, not run.

## Findings that change the proposal

1. **Aliases break the literal commands in an agent shell.** On this host the agent's Bash tool loads the
   user's zsh profile: `df` runs `duf`, `du` runs `dust` (`du -sk` failed with `unexpected argument '-k'`),
   `cat` runs `bat`, `grep` runs `ugrep`. P1's `df -h .` and the inspector's `du` calls must use
   `command df -Pk` / `command du -sk`, or the absolute path. Observed on Linux.
2. **`gio trash` is not a universal Linux `trash`.** It refuses system-internal mounts:
   `gio trash /tmp/...` printed `Trashing on system internal mounts is not supported` (exit 1) with both
   `/usr/bin/gio` 2.80.0 and Homebrew `gio` 2.88.1. It worked under `$HOME`. Homebrew's `gio trash --list`
   failed with `trash:: Operation not supported`, because there is no gvfs backend. `trash-put` is not
   installed here (apt candidate 0.23.11.10-1, brew 0.26.9.29). Observed on Linux.
3. **The Windows "recycle" route can delete permanently with no prompt.** `FileSystem.DeleteFile(path,
   UIOption.OnlyErrorDialogs, RecycleOption.SendToRecycleBin)` sets `FOF_SILENT | FOF_NOCONFIRMATION |
   FOF_ALLOWUNDO` and leaves out `FOF_WANTNUKEWARNING` (dotnet/runtime source). `FOF_NOCONFIRMATION` means
   "Respond with Yes to All". The confirmation for a file too big to recycle would therefore be accepted,
   and the file deleted permanently. This is inferred from the source code and the Win32 docs, not run on
   Windows. Use `UIOption.AllDialogs`, or check the file size against the bin's maximum first.
4. **`cargo clean` works per workspace, not per project.** With no options it deletes the whole target
   directory. If `CARGO_TARGET_DIR` or `build.target-dir` points at a shared directory, it wipes the build
   output of every project using that directory. Docs only.
5. **Linked worktrees share the LFS store. This settles proposal 16's "Not confirmed" item.** `git lfs env`
   shows the same `LocalMediaDir` in both checkouts. Each worktree's working copy of a smudged file is a
   separate full copy, though (separate inode, link count 1). `GIT_LFS_SKIP_SMUDGE=1 git worktree add`
   left a 131-byte pointer instead. Observed on Linux.
6. **`tmp_path_retention_policy = "failed"` does not clean up after itself fully.** It removes the current
   run's base directory only when every test passed, and only when `--basetemp` was not given.
   `tmp_path_factory.mktemp` directories survive a run that has any failure. Older `pytest-N` directories
   are still trimmed by count (keep 3), not by policy. Observed and read in the source.
7. **macOS `/usr/bin/trash` first shipped in macOS 15 (Sequoia), not 14** (secondary sources; see item 3).
   P1's `trash` is only built in on macOS 15 and later. Check with `command -v trash` first, because
   Homebrew's `trash` formula can shadow the system one.

## 1. Free space of the filesystem holding a path

| Command | OS | Verified how | Result | Source |
|---|---|---|---|---|
| `command df -Pk <path>` | Linux | observed on Linux | POSIX columns, 1024-blocks; `Available` = 31826092 KiB for `/tmp/claude-1000/...` (ext4 `/`). Bare `df` ran `duf` and printed `bat` output | coreutils `df` |
| `df -Pk <path>` | macOS | docs only | `-P` POSIX output, `-k` 1024-byte blocks; the same parser works | [POSIX df](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/df.html) |
| `Get-Volume -FilePath <path>` → `SizeRemaining` | Windows | docs only | Takes a file path directly; the example shows `SizeRemaining 23.61 GB`. `Get-PSDrive C` (`Free`) works only by drive letter | [Get-Volume](https://learn.microsoft.com/en-us/powershell/module/storage/get-volume) |
| `df -h /` inside the distro | WSL 2 | docs only | Reports the **VHD**: Size is the allocated maximum (default 1 TB since WSL 0.58.0), "even if the amount of disk space on your actual Windows device is less than that" | [WSL disk space](https://learn.microsoft.com/en-us/windows/wsl/disk-space) |
| `wsl.exe --system -d <distro> df -h /mnt/wslg/distro` | WSL 2 | docs only | Microsoft's documented VHD check; it still reports VHD space, not host space | same |
| Host free space from WSL: `powershell.exe -NoProfile -c "(Get-Volume C).SizeRemaining"` or `df -Pk /mnt/c` | WSL 2 | inferred | Host space has to be read from the Windows volume that holds `ext4.vhdx`. `/mnt/c` is DrvFs, the Windows drive | [wsl-config automount](https://learn.microsoft.com/en-us/windows/wsl/wsl-config) |
| ext4.vhdx growth | WSL 2 | docs only | "WSL 2 automatically resizes these VHD files to meet storage needs"; the cap is `defaultVhdSize` (1 TB) | [disk-space](https://learn.microsoft.com/en-us/windows/wsl/disk-space), [wsl-config](https://learn.microsoft.com/en-us/windows/wsl/wsl-config) |
| ext4.vhdx shrink | WSL 2 | docs only | Not automatic unless sparse. The Sept 2023 post: VHDs "grow in size as you use them"; with sparse on they "will automatically shrink in size too" | [WSL Sept 2023 update](https://devblogs.microsoft.com/commandline/windows-subsystem-for-linux-september-2023-update/) |
| `wsl --manage <distro> --set-sparse true` | WSL 2 | docs only | Makes an existing distro's disk sparse (added in WSL 2.0.0). `.wslconfig [experimental] sparseVhd=true` affects only **newly created** VHDs. Not listed on the current basic-commands page | same; [wsl-config](https://learn.microsoft.com/en-us/windows/wsl/wsl-config) |
| `wsl --shutdown` then `Optimize-VHD -Path ...\ext4.vhdx -Mode Full` (or diskpart `compact vdisk`) | Windows host | secondary | Manual compaction. Optimize-VHD refuses sparse disks, so set sparse false first | [MS Q&A 1526083](https://learn.microsoft.com/en-za/answers/questions/1526083/in-wsl2-with-sparse-vhd-the-storage-usage-does-not) |

## 2. Folder size and copy-on-write caveats

| Command | OS | Verified how | Result | Source |
|---|---|---|---|---|
| `command du -sk <dir>` | Linux | observed on Linux | 3,000,000 B + 1,000 B files: allocated 2940 KiB, `--apparent-size` 2931. With a hard link added: `du -sk` 2940 (each inode counted once), `du -skl` 5872 | coreutils `du` |
| `du -sk <dir>` | macOS | docs only | Same flags; BSD `du` also counts a hard-linked inode once | BSD du(1) |
| `Get-ChildItem <dir> -Recurse -File -Force \| Measure-Object Length -Sum` | Windows | docs only | Sums **logical** length. Without `-Force` it skips hidden and system files. It counts every hard link again and counts OneDrive online-only placeholders at full logical size (inferred) | [Get-ChildItem -Force](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management/get-childitem) |
| `cp --reflink=always a b` | Linux ext4 | observed on Linux | `failed to clone ... Operation not supported` (this host is ext4: no reflinks) | coreutils `cp` |
| btrfs / XFS reflinks | Linux | docs only | `cp --reflink` shares extents. `du` counts each file in full, so sizes are an upper bound | [coreutils cp](https://www.gnu.org/software/coreutils/manual/html_node/cp-invocation.html) |
| APFS clones (`cp -c`, Finder copy) | macOS | secondary | Clones share blocks. Per-file sizes and `du` overstate; deleting one clone may free nothing. Apple's page did not render for the fetcher. The proposal's Eclectic Light citation stands | proposal 16 citation |
| ReFS / Dev Drive block cloning | Windows | docs only | "multiple files can share the same logical clusters"; allocate-on-write. Native in Windows copy since Win 11 24H2 / Server 2025. Dev Drive is ReFS, minimum 50 GB | [Block cloning](https://learn.microsoft.com/en-us/windows-server/storage/refs/block-cloning), [Dev Drive](https://learn.microsoft.com/en-us/windows/dev-drive/) |

Conclusion: report sizes as an upper bound on APFS, btrfs, XFS and ReFS, as the proposal already says. On
ext4 and NTFS, `du`/allocated size is accurate apart from hard links.

## 3. Recoverable delete

| Command | OS | Verified how | Result | Source |
|---|---|---|---|---|
| `/usr/bin/trash [-v] [-s\|--stopOnError] FILE...` | macOS 15+ | secondary | Built in. Sonoma VMs (14.6.1, 14.8) **lack** it; the Tahoe man page says "added in Sequoia". Finder's "Put Back" may not work for items trashed this way | [mjtsai 2025-08-26](https://mjtsai.com/blog/2025/08/26/the-trash-command/), [ss64](https://ss64.com/mac/trash.html) |
| `gio trash <path>` / `gio trash --restore trash:///<name>` | Linux | observed on Linux | Under `$HOME`: exit 0, `.trashinfo` written, restore worked. Under `/tmp`: exit 1, "Trashing on system internal mounts is not supported". Homebrew gio `--list` failed (no gvfs) | GLib `gio help trash` |
| `trash-put` (trash-cli) | Linux | observed (absence) | Not installed; packaged for apt 0.23.11.10-1 and brew 0.26.9.29 | `apt-cache policy`, `brew info` |
| No built-in recycle CLI | Windows | docs only | Neither PowerShell nor cmd has a recycle command; `Remove-Item` deletes permanently | [FileSystem.DeleteFile](https://learn.microsoft.com/en-us/dotnet/api/microsoft.visualbasic.fileio.filesystem.deletefile) |
| `Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($p,'OnlyErrorDialogs','SendToRecycleBin')` (`DeleteDirectory` for folders) | Windows | docs + source | Default `recycle` is `DeletePermanently`. `showUI`/`recycle` are "not supported in applications that are not user interactive, such as Windows Services". `OnlyErrorDialogs` adds `FOF_NOCONFIRMATION` and no `FOF_WANTNUKEWARNING` | [DeleteFile](https://learn.microsoft.com/en-us/dotnet/api/microsoft.visualbasic.fileio.filesystem.deletefile), [FileSystem.vb](https://github.com/dotnet/runtime/blob/main/src/libraries/Microsoft.VisualBasic.Core/src/Microsoft/VisualBasic/FileIO/FileSystem.vb) |
| `FOF_NOCONFIRMATION` / `FOF_WANTNUKEWARNING` | Windows | docs only | "Respond with Yes to All for any dialog box" / "Send a warning if a file is being permanently destroyed ... rather than recycled". Also: a non-full path is never recycled | [SHFILEOPSTRUCT](https://learn.microsoft.com/en-us/windows/win32/api/shellapi/ns-shellapi-shfileopstructa) |
| Per-drive Recycle Bin maximum | Windows | secondary | Set per drive (default about 5%). A file larger than the maximum gets "This file is too big to recycle", which asks to delete permanently. A per-drive "Don't move files to the Recycle Bin" option deletes immediately. No Microsoft page found (KB 2750319 returns 404) | [elevenforum](https://www.elevenforum.com/t/change-maximum-size-for-recycle-bin-in-windows-11.5109/), [dopus](https://resource.dopus.com/t/prompt-on-delete-this-file-is-too-big-to-recycle/52037) |
| OneDrive Files On-Demand | Windows | docs only | "Online-only files don't take up space on your computer." "When you delete an online-only file from your device, you delete it from your OneDrive on all devices and online." Cloud recycle bin keeps 30 days (personal) or 93 days (work/school). A locally available file "also appears in your device recycle bin" | [Files On-Demand](https://support.microsoft.com/en-us/office/save-disk-space-with-onedrive-files-on-demand-for-windows-0e6860d3-d9f3-4971-b321-7092438fb38e) |

Implications: a recoverable delete needs a per-OS probe (`command -v trash`, `gio`, `trash-put`; on
Windows a size check against the bin maximum). A path under `/tmp` cannot go to the Linux trash at all.
Inside a OneDrive folder, deleting removes the file from the cloud, and the size the inspector reports is
not disk use.

## 4. Open files and hard-link counts

| Command | OS | Verified how | Result | Source |
|---|---|---|---|---|
| `lsof -w -- <file>` / `lsof -w +D <dir>` | Linux | observed on Linux | Found the test process (`sleep ... 0r REG ... /sz/b`). Without `-w` it printed about 80 `can't stat()` warnings for docker overlay/nsfs mounts and "Output information may be incomplete". `+D` recurses and is slow on big trees | lsof(8) |
| `lsof` | macOS | docs only | Same tool, ships with macOS | lsof(8) |
| `handle.exe <name-fragment>` (Sysinternals) | Windows | docs only | Separate download, not built in. "You must have administrative privilege to run Handle." Case-insensitive fragment match. Resource Monitor is the GUI alternative | [Handle](https://learn.microsoft.com/en-us/sysinternals/downloads/handle) |
| `stat -c %h <file>` | Linux | observed on Linux | `2` after `ln`, `1` before | coreutils stat |
| `stat -f %l <file>` | macOS | docs only | "`l` Number of hard links to file (st_nlink)" | [stat(1)](https://keith.github.io/xcode-man-pages/stat.1.html) |
| `fsutil hardlink list <file>` | Windows | docs only | Lists the hard links (paths, not a count). Docs state no admin requirement; unverified | [fsutil hardlink](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/fsutil-hardlink) |

## 5. Tool cleanup commands

| Command | OS | Verified how | Result | Source |
|---|---|---|---|---|
| `cargo clean` (cargo 1.94.1) | all | observed on Linux | `Removed 21 files, 1.1MiB total`; `target/` gone. "With no options, `cargo clean` will delete the entire target directory", which defaults to `target` in the **workspace** root or `CARGO_TARGET_DIR`. `-n/--dry-run`, `-p`, `--release`, `--profile` are available | [cargo-clean](https://doc.rust-lang.org/cargo/commands/cargo-clean.html) |
| `go clean -cache` (go 1.26.2) | all | observed on Linux (with `GOCACHE` pointed at the temp dir) | "remove the entire go build cache"; 18 MB cache left only `README`, `trim.txt`. `-modcache` removes the module download cache; `-testcache` expires test results. Real `GOCACHE` here is `~/.cache/go-build` | `go help clean` |
| `uv cache prune` (uv 0.11.7) | all | observed on Linux (help + temp run) | "Prune all unreachable objects from the cache"; `--ci` slims for CI; `--force` ignores in-use checks. Real cache: `~/.cache/uv`. `uv` is a lazy shell function here | `uv cache prune --help` |
| `npm cache verify` (npm 11.9.0) | all | observed on Linux (`--cache` temp dir) | "Verify the contents of the cache folder, garbage collecting any unneeded data, and verifying the integrity". `npm cache clean` needs `--force` | `npm help cache` |
| `xcrun simctl delete unavailable` | macOS | secondary | `delete <device>... \| unavailable \| all`; `unavailable` = devices the current Xcode SDK no longer supports. Run as the user, not with sudo (simulators are per-user). Preview with `xcrun simctl list devices unavailable` | [node-simctl](https://classic.yarnpkg.com/en/package/node-simctl), [Apple forums](https://origin-devforums.apple.com/forums/thread/837906) |
| Xcode DerivedData | macOS | secondary | Default `~/Library/Developer/Xcode/DerivedData/<Project>-<hash>`. Overridable via Xcode Locations (`IDECustomDerivedDataLocation`) or `xcodebuild -derivedDataPath` | [Kinda Code](https://www.kindacode.com/article/xcode-change-derived-data-and-archives-directories) |
| pytest `tmp_path_retention_count` / `tmp_path_retention_policy` (pytest 9.1.1) | all | observed on Linux + source | Defaults `"3"` / `"all"` (`_pytest/tmpdir.py` L258-272). Five passing runs left `pytest-2,3,4` plus `pytest-current`. With `policy = failed` a passing run left no new directory (L307-333). `none` sets keep=0 (L211). `--basetemp` disables both the base removal and retention, and is "cleared blindly before each test run" | [pytest tmp_path](https://docs.pytest.org/en/stable/how-to/tmp_path.html) |
| pytest base temp location | all | observed on Linux + docs | `{temproot}/pytest-of-{user}/pytest-{num}/`; temproot = `PYTEST_DEBUG_TEMPROOT` or `tempfile.gettempdir()`. Observed under `$TMPDIR`. gettempdir order: `TMPDIR`, `TEMP`, `TMP`, then Windows `%USERPROFILE%\AppData\Local\Temp`... or `/tmp`, `/var/tmp`, `/usr/tmp`. On macOS `TMPDIR` is a per-user `/var/folders/.../T/` (not checked here) | [tempfile](https://docs.python.org/3/library/tempfile.html) |

## 6. git-lfs and linked worktrees (git-lfs 3.7.1, observed on Linux)

Scratch repo: `git lfs track "*.bin"`, a 200,000-byte random `big.bin`, commit, `git worktree add ../lfswt`.

| Field | Main checkout | Linked worktree |
|---|---|---|
| `LocalWorkingDir` | `.../lfsrepo` | `.../lfswt` |
| `LocalGitDir` | `.../lfsrepo/.git` | `.../lfsrepo/.git/worktrees/lfswt` |
| `LocalGitStorageDir` | `.../lfsrepo/.git` | `.../lfsrepo/.git` |
| `LocalMediaDir` | `.../lfsrepo/.git/lfs/objects` | `.../lfsrepo/.git/lfs/objects` (same) |
| `TempDir` | `.../lfsrepo/.git/lfs/tmp` | `.../lfsrepo/.git/lfs/tmp` (same) |

- Only one object file existed (`.git/lfs/objects/97/ba/97ba5578...`), with no `lfs` directory under
  `.git/worktrees/`. **Linked worktrees share the LFS object store.**
- The working-tree files are separate full copies: main `big.bin` inode 5785446, worktree inode 5785486,
  object inode 5785450, all with link count 1. So N worktrees of a 1.1 GiB LFS file cost 1 store copy plus
  N checkout copies, unless smudging is skipped.
- `GIT_LFS_SKIP_SMUDGE=1 git worktree add ../lfswt3 -b wt3` produced a 131-byte pointer file
  (`version https://git-lfs.github.com/spec/v1` / `oid sha256:97ba55...`). This confirms P2 rule 2 for
  worktrees as well as clones.
- A separate `git clone` (not a worktree) gets its own `.git/lfs/objects` unless `lfs.storage` points at a
  shared directory. That follows from the per-clone `LocalGitStorageDir`; a clone was not tested.

## Still unknown

- Windows behaviour of item 3 (permanent delete with `OnlyErrorDialogs`) is inferred from source code and
  docs; it needs a Windows run with a file larger than a small bin maximum.
- The macOS `trash` version boundary rests on secondary reports, with no Apple primary source; check
  `man trash` on a 15.x host.
- No official Microsoft page found for the Recycle Bin size-limit behaviour.
- Whether `fsutil hardlink list` needs elevation; whether `df -Pk /mnt/c` from WSL matches `Get-Volume C`.
