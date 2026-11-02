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
   "Respond with Yes to All". A bounded Windows Sandbox probe now observed the result with a 1 MiB
   per-volume setting: a 512 KiB control entered the Bin; a 2 MiB source disappeared while C: Bin count
   and size remained unchanged. This is evidence for that isolated setting only. Use `UIOption.AllDialogs`,
   or check the actual bin maximum and list files that may exceed it.
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

- The Windows cap behavior was observed only in a disposable Sandbox; no claim is made about the host
  user's current Bin setting or all filesystem variants.
- The macOS `trash` version boundary rests on secondary reports, with no Apple primary source; check
  `man trash` on a 15.x host.
- No official Microsoft page found for the Recycle Bin size-limit behaviour.
- Whether `fsutil hardlink list` needs elevation; whether `df -Pk /mnt/c` from WSL matches `Get-Volume C`.

## Windows host follow-up (2026-11-02)

**Host:** Windows 11 Pro 10.0.26300, PowerShell 7.6.9, Node v22.22.3, D: NTFS. The
measurements below used the private D: worktree and an owned, ignored 512-byte hard-link fixture;
they do not describe other filesystems or cloud allocation. No provider/model calls were involved.

| Claim | Command and observed output | Outcome and limit |
|---|---|---|
| Volume free space matches the inspector | `Get-Volume -FilePath (Get-Location).Path` → `SizeRemaining 100243001344`; `node skills/meta/repository-artifact-hygiene/scripts/inspect-footprint.mjs --repo . --floor 0B --quiet 0m` → exit 0, `status: review`, `freeSpace.free 100243001344`, 13 families, 0 findings | Pass, exact byte match (delta 0) on D: NTFS at 2026-11-02. A later summary read `free 93.4 GiB`; free space is time-sensitive. The report remains `review` because candidate families existed. |
| PowerShell directory-size row and hard-link double count | `$probeRoot` named the owned fixture directory; `Get-ChildItem $probeRoot -Recurse -File -Force | Measure-Object Length -Sum` → `Count 2`, `Sum 1024`; fixture held one 512-byte file and one hard link. `fsutil hardlink list $source` listed both paths. | Pass for logical length and hard-link listing on this NTFS host; no ReFS/Dev Drive block-clone claim. Own fixture was sent to the OS Recycle Bin using `FileSystem.DeleteDirectory(..., AllDialogs, SendToRecycleBin)`; its Bin contents were not enumerated. |
| Footprint fixture and open-file coverage | `node --test scripts/inspect-footprint.test.mjs` → 7 passed, 0 failed, 0 skipped. Diagnostic: `open-file detection unavailable on this host; asserted incomplete coverage instead`. | Pass for the fixture suite; Windows result explicitly has `openFiles: unavailable`, `coverage.complete: false`; no open-file detection claim. `handle.exe` was not found on PATH. |
| Real-repository summary | `node skills/meta/repository-artifact-hygiene/scripts/inspect-footprint.mjs --repo . --summary --floor 0B --quiet 0m` → exit 0, `free 93.4 GiB (floor 0.0 MiB)` | No limit finding; the JSON report had `status: review` because candidate families existed, and incomplete open-file coverage. Summary output is not a clean/pass classification. |
| `fsutil fsinfo volumeinfo D:` | Command returned `Error 5: Access is denied.` | Infrastructure/privilege limit: volume metadata from this command was not observed without elevation. `Get-Volume -FilePath` did work. |
| `handle.exe` availability | `Get-Command handle.exe -ErrorAction SilentlyContinue` returned no command. | Not installed/on PATH; the inspector correctly reports open-file coverage unavailable rather than treating the set as empty. |
| Recycle Bin operation below/over cap and cap value | Hidden `WindowsSandbox.exe` launch of an owned `.wsb` mapped only one disposable fixture folder read/write; guest ran `powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File C:\t132\run.ps1`. The script set only the Sandbox user's C: `MaxCapacity` value to 1 MiB, then used `FileSystem.DeleteFile(..., OnlyErrorDialogs, SendToRecycleBin)` and `SHQueryRecycleBinW(C:\)` before and after. | Windows 11 Enterprise build 26100, interactive `WDAGUtilityAccount`: empty Bin baseline (0 items/0 bytes); 512 KiB control disappeared from source and appeared in Bin (1 item/524,288 bytes); 2 MiB fixture disappeared from source while Bin remained at 1 item/524,288 bytes. Observed over-cap source removal without a new Bin entry, consistent with permanent deletion for this call. The guest's previous capacity value was 6137 and read back as 1 after the change. Network and clipboard were disabled, guest memory capped at 2048 MiB, and the guest ran its own shutdown. No host Bin setting or content was read or changed. Report: [Windows Sandbox Bin-cap evidence](evidence/footprint-win-bin-cap-20261102.json). |
| OneDrive online-only placeholder (#192 metadata-only observation) | One owner-approved exact file queried once as alias A; [sanitized evidence](evidence/onedrive-placeholder-192-20261102.json). | Its current metadata identified a regular local file, not a Cloud Files placeholder: logical EOF 11,745,765 B, allocated size 11,747,328 B, CF state `NO_STATES`. The exact-file inspector reported 11,747,328 B, exit 0/status `review`, with open-file coverage unavailable. Before/after metadata and timestamps matched. No content read, hash, copy, hydration or provider-state mutation; provider contact was not instrumented. This does not establish online-only behavior or close the prerequisite in [ticket 192](../../../.tickets/192-footprint-onedrive-placeholder.md). |

The October 31 failure is not reproduced on the current Windows host: all seven current fixture
tests pass. The over-cap Bin result above applies to the disposable Sandbox only. The alias-A
OneDrive file's current metadata was observed, but its online-only placeholder behavior remains
unverified.

## WSL host-volume follow-up (#133, 2026-11-02)

**Scope:** WSL 2.6.3, kernel 6.6.87.2-1 on Windows 11. The test distro was an owned WSL2
import named `GreyMatter-Footprint-133`, stored on E: at
`E:\WSL\grey-matter-t133-disposable`. Existing Ubuntu and Podman distros stayed stopped;
`podman-machine-default` remained the default. No global WSL setting or existing distro was changed.

The test rootfs came from the official [Alpine 3.24.3 x86_64 minirootfs](https://dl-cdn.alpinelinux.org/alpine/v3.24/releases/x86_64/alpine-minirootfs-3.24.3-x86_64.tar.gz)
(3,704,080 bytes; SHA-256 `f8e1cafba9b1b283b5d30d06f9885c8d2bc161ffe9083ade8e2e157813a53407`, matching its
official `.sha256` sidecar). Node came from the [official Node v22.23.4 archive](https://nodejs.org/dist/v22.23.4/node-v22.23.4-linux-x64-musl.tar.gz)
(59,432,087 bytes; SHA-256 `63189402eaa222aabf51b4983e512592131cd2d4a9efc3ad9bf291fe74e3e4de`, matching
the official [release archive](https://nodejs.org/en/download/archive/v22.23.4)). Alpine's minimal
rootfs initially lacked `libstdc++.so.6` and `libgcc_s.so.1`; installing its `libgcc` and
`libstdc++` packages (30 packages, 23.3 MiB total) in the owned distro made Node run. This was
environment setup, not a product failure. The Node archive extracted to 207.7 MiB. A shared Git
clone of the private worker source was checked out in the distro (about 10.9 MiB of tracked files;
252 KiB Git metadata sharing the main object store); the existing Windows `node_modules` tree was
referenced by symlink rather than copied. The distro VHD measured 79,691,776 bytes after import,
348,127,232 after runtime/setup, 381,681,664 after focused tests, and 448,790,528 after gate work.

| Claim | Command and observed output | Outcome and limit |
|---|---|---|
| The inspector selects the actual Windows volume holding this distro | Before the fix, WSL `df -Pk /` exposed about 1.025 TB of virtual free space; the inspector reported `151,043,506,176` bytes from assumed C:, while the exact registry `BasePath\ext4.vhdx` resolved to E: with `96,183,488,512` bytes free. The red regression assertion compared those values. | Confirmed bug: C: was not the distro's backing volume. The inspector now resolves the exact registered distro name through HKCU Lxss, finds its `BasePath\ext4.vhdx`, and queries that file's volume. On the same E:-backed run it reported the lower `96,183,488,512`-byte value. |
| WSL interop PATH | First focused run with a sanitized Linux-only `PATH` produced 7 passed and 2 failed: `spawnSync powershell.exe ENOENT` in the real-host and clean-repository cases. | Environment setup failure: that shell omitted WSL's Windows interop directories. Rerunning with `/mnt/c/Windows/System32/WindowsPowerShell/v1.0` and `/mnt/c/Windows/System32` in `PATH` passed the final 9/9 suite; no product changes were made for the first failure. |
| Unavailable or malformed host lookup is safe | WSL `node --test scripts/inspect-footprint.test.mjs` at source commit `60518e72` → 9 passed, 0 failed, 0 skipped. Injected responses covered a valid arbitrary R: volume, missing/duplicate registry matches, absent VHD, failed host query, null/empty/numeric capacity fields, zero total, malformed/empty volume identity, and missing distro name. | Pass. Incomplete lookup leaves the host entry absent, marks coverage incomplete and status `review`, and summary explicitly says the Windows backing volume is unavailable and the floor is unverified. The real WSL test verifies the registered drive identity, returned numeric host entry, and minimum of inspector entries; the fixture proves exact input/output values deterministically. |
| Native Linux pre-merge gate | `node scripts/gate.mjs pre-merge` in Alpine/Node 22.23.4 at `60518e72` → `1 of 19` selected; `artifact-hygiene` passed in 16.1 s. | Pass for the two committed code/test paths selected by the gate, not all 19 checks. Guidance/doc paths were validated separately with `node scripts/check-docs-consistency.mjs` and `node scripts/check-skill-syntax.mjs`, both exit 0. An earlier gate attempt failed 1 of 32 artifact-hygiene tests because the test compared a host-free-space sample from before suite execution with a later inspector reading; the owned VHD had grown by 33,554,432 bytes between those readings. The final test checks the registered volume identity and inspector's own lower-of-two entries, without comparing against a stale external sample. |
| Non-sparse unlink and host reclaim | Before the sample, VHD logical length was 433,061,888 B and E: free was 96,098,553,856 B; `fsutil sparse queryflag` reported the VHD was not sparse. Writing one 16 MiB `/dev/urandom` file increased guest Used from 250,620 to 267,004 KiB, VHD length to 466,616,320 B, and reduced E: free by 33,554,432 B. Unlink + sync restored guest Used to 250,620 KiB; after `wsl --terminate` the VHD length and E: free remained unchanged. | No immediate host reclaim on unlink or distro termination. After verifying all three distros were stopped and the default was unchanged, an idle `wsl --shutdown` returned VHD length and E: free by exactly 33,554,432 B. `fsutil sparse queryflag` still reported not sparse. This observed shutdown behavior is host/version specific. |
| Sparse VHD sample and reclaim | After the second all-stopped shutdown, `wsl --manage GreyMatter-Footprint-133 --set-sparse true --allow-unsafe` succeeded on only the disposable distro. WSL first refused without `--allow-unsafe`, warning sparse support was disabled due to possible data corruption. `fsutil sparse queryflag` then reported set. Before the sample, VHD logical length and allocated range were 433,061,888 B and E: free was 96,098,553,856 B. A 16 MiB file raised guest Used by 16,384 KiB and logical VHD length by 33,554,432 B; allocated range and E: use increased by 9,437,184 B. | After unlink + sync, guest Used returned to baseline, but the VHD did not reclaim immediately after distro termination. At the next distro launch, before trim, logical length and allocated range had returned to 433,061,888 B and E: free had recovered 9,437,184 B (4 KiB below the pre-sample reading). The already-installed `/sbin/fstrim -v /` reported `/: 1080841494528 bytes trimmed`; after trim, `fsutil file queryallocranges` showed a 65,536-byte hole and E: free increased by 65,536 B, with logical length unchanged. This is observed sparse reclaim on this host, not a universal timing guarantee. The explicit unsafe flag was used only on the disposable distro and is not routine user-distro guidance. |
| WSL sharing-lock history | Earlier `wsl --manage ... --set-sparse false` after per-distro termination returned `ERROR_SHARING_VIOLATION`; WSL advised `wsl.exe --shutdown`. | Later read-only state checks showed all three distros stopped and `podman-machine-default` remained default. An idle-host shutdown released the owned VHD lock; mode toggles then worked. Existing distros and global settings were not changed. |

The D-side working inputs totaled 63,181,213 bytes across five files: the rootfs archive and its
checksum; the Node archive and its SHASUMS file; and a 40,960-byte source bundle. The private
distro's VHD grew from 381,681,664 to 448,790,528 bytes during later Linux gate activity; E: free
space fell from 96,149,934,080 to 96,082,825,216 bytes over that interval. After sparse reclaim and
`fstrim`, current VHD logical length is 433,061,888 bytes, its allocated ranges total 432,996,352
bytes, and E: has 96,098,615,296 bytes free. Logical VHD plus D-side input sizes total 496,243,101
bytes (about 473.2 MiB); allocated VHD ranges plus input file sizes total 496,177,565 bytes. The D:
worker worktree and existing `node_modules` are separate and not included. The focused writes stayed
at 16 MiB each. Exactly two idle-VM `wsl --shutdown` calls were used after checking all distros
stopped; the second cleared the owned VHD sharing lock. After final per-distro termination,
`wsl --list --verbose` showed all three registered distros stopped and `podman-machine-default`
still default. The disposable distro is retained with sparse mode enabled for #133 review; input
files are also retained. No unregister/permanent VHD deletion or existing-distro/config change was
performed, pending root's artifact-retention decision.
