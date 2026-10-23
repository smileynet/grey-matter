#!/usr/bin/env bash
# Thin wrapper: install grey-matter skills via the Node installer.
# Requires Node. See scripts/deploy.mjs for flags.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
exec node "$DIR/deploy.mjs" "$@"
