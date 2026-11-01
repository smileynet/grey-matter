# Version sources by OS

How [`harness-versions.mjs`](../scripts/harness-versions.mjs) reads a version when a harness has no usable `--version`. These are mostly GUI apps, whose version lives in a package database, a version resource or an Electron bundle. Every source here is offline and needs no elevation. Gathered 2026-11-01: **L** means verified on this Windows 11 machine, **D** means from the cited docs and not run.

## Manifest shape

An entry with `versionSources` tries each source in order, skips those whose `os` doesn't match `process.platform` (`win32`, `darwin`, `linux`), and takes the first that yields a version. An entry-level `os` skips the whole entry elsewhere. A four-part Windows version (`2.28.2.0`) is normalized to three parts.

```json
{ "id": "kiro-crew-desktop", "surface": "GUI", "versionSources": [
  { "os": ["win32"], "source": "file-version", "path": "%LOCALAPPDATA%/Programs/KiroCrew/KiroCrew.exe" },
  { "os": ["win32"], "source": "asar", "path": "%LOCALAPPDATA%/Programs/KiroCrew/resources/app.asar" },
  { "os": ["darwin"], "source": "plist", "path": "/Applications/KiroCrew.app/Contents/Info.plist" }
] }
```

| `source` | Reads | Fields |
|---|---|---|
| `json-file` | A JSON file | `path`, `field` (dotted, default `version`) |
| `asar` | `package.json` inside an Electron `app.asar`, without extracting it | `path`, `inner` (default `package.json`), `field` |
| `file-version` | A Windows exe's version resource, through PowerShell | `path`, `field` (`FileVersion` default, or `ProductVersion`) |
| `appx` | An MSIX package version, through `Get-AppxPackage` | `name` |
| `plist` | A macOS `Info.plist` key, through `PlistBuddy` | `path`, `key` (default `CFBundleShortVersionString`) |
| `command` | Any command's output, first version-shaped token | `argv` |

## Windows (L)

| App | Best source | Cross-check | Notes |
|---|---|---|---|
| Antigravity 2.0 app | `file-version` on `Antigravity.exe` → 2.28.2 | `asar`; the HKCU uninstall key's `DisplayVersion` | |
| Kiro Crew desktop | `file-version` on `KiroCrew.exe` → 0.11.1 | `asar` (`kirocrew-desktop` 0.11.1) | **winget reported 0.9.0** from a stale cache entry |
| Claude desktop | `appx` `Claude` → 4.4212.0.0 | the asar inside `WindowsApps\Claude_*` | |
| Codex app | `appx` `OpenAI.Codex` → 26.1027.3384.0 | The asar says `26.1027.30824`, a different build number | The MSIX version is the authority recorded |
| Kiro IDE | `json-file` `resources/app/product.json` `version` → 1.3.11 | exe, registry, winget agree | winget also shows `Available 1.4.62` |
| Antigravity IDE | `json-file` `product.json` **`ideVersion`** → 2.5.5 | exe, registry | `version` there is the VS Code base (1.107.0), not the IDE |

Not used:
- **winget** (`winget list --name …`): it was stale for Kiro Crew, matched both Antigravity apps for one id, and found the Codex app only under `OpenAI.ChatGPT`. It's useful for "is an update available", never as the installed version.
- **Electron's `resources/app-update.yml`**: it holds only the update feed (`provider`, `url`), with no version.
- The uninstall registry keys (`HKCU:`/`HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*`, `DisplayVersion`) were correct here and could become a `registry` source if an app ever lacks the others.

## macOS (D)

| Method | Command | Output | Source |
|---|---|---|---|
| Info.plist | `/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' /Applications/X.app/Contents/Info.plist` (or `defaults read …/Info.plist CFBundleShortVersionString`) | Bare version; `CFBundleVersion` is the build number | [Apple: CFBundleShortVersionString](https://developer.apple.com/documentation/bundleresources/information-property-list/cfbundleshortversionstring), `man PlistBuddy` |
| Spotlight | `mdls -raw -name kMDItemVersion /Applications/X.app` | Bare version; needs indexing | `man mdls` |
| Homebrew cask | `brew list --cask --versions <cask>` | `<cask> <version>`; cask installs only | [brew manpage](https://docs.brew.sh/Manpage) |
| pkgutil | `pkgutil --pkg-info <pkg-id>` | a `version:` line; `.pkg` installs only | `man pkgutil` |
| system_profiler | `system_profiler SPApplicationsDataType -json` | JSON per app; slow | `man system_profiler` |
| Electron | `asar` on `X.app/Contents/Resources/app.asar` | JSON | same format as Windows |

The manifest's `darwin` `plist` sources assume apps in `/Applications` under their product names. They are unverified until run on a Mac.

## Linux (D)

| Method | Command | Output | Source |
|---|---|---|---|
| dpkg | `dpkg-query -W -f='${Version}' <pkg>` | `1.2.3-1` | [dpkg-query](https://manpages.debian.org/dpkg-query) |
| rpm | `rpm -q --qf '%{VERSION}' <pkg>` | `1.2.3` | [rpm.org](https://rpm.org/docs/) |
| Flatpak | `flatpak info <app-id>` | a `Version:` line | [flatpak command reference](https://docs.flatpak.org/en/latest/flatpak-command-reference.html) |
| Snap | `snap list <name>` | a table with a Version column | [snap list](https://snapcraft.io/docs/snap-list) |
| AppImage | `--appimage-extract`, then the `.desktop` file's `X-AppImage-Version` | key=value. It writes `squashfs-root` into the current directory, so run it in a scratch folder. Whether `--appimage-version` prints the app's or the runtime's version is unverified | [AppImage docs](https://docs.appimage.org/user-guide/run-appimages.html) |
| Electron tarball | `asar` on `resources/app.asar`, or `resources/app/package.json` | JSON | |

Each fits the `command` source (`argv`), or `json-file`/`asar` for files.

## Package managers for CLIs (L)

Use these only when a CLI's own `--version` fails, and **only after checking that PATH resolves into that manager's directory**. Here bun held a stale `@anthropic-ai/claude-code@2.1.118`, while the `claude` on PATH was the native 2.1.316.

| Manager | Command |
|---|---|
| bun | `bun pm ls -g` |
| npm | `npm ls -g --depth=0 --json` |
| uv | `uv tool list` |
| winget | `winget list --id <id>` (stale; see above) |
| mise | `mise ls --json` (runtimes only here) |
| Homebrew (D) | `brew list --versions <formula>` |

The `codex`, `kiro-cli` and `agy` executables carry no Windows version resource, so `file-version` can't replace their `--version`.
