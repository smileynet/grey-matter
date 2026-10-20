#!/usr/bin/env bash
# Thin wrapper: install the grey-matter pre-push hook via the Node installer.
# Requires Node. See scripts/install-hooks.mjs for commands (install | list | uninstall).
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
exec node "$DIR/install-hooks.mjs" "$@"
