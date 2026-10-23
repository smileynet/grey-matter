# Thin wrapper: install grey-matter skills via the Node installer.
# Requires Node. See scripts/deploy.mjs for flags.
$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
node (Join-Path $dir "deploy.mjs") @args
