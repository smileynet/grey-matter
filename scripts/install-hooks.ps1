# Thin wrapper: install the grey-matter pre-push hook via the Node installer.
# Requires Node. See scripts/install-hooks.mjs for commands (install | list | uninstall).
$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
node (Join-Path $dir "install-hooks.mjs") @args
