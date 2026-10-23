#!/usr/bin/env bash
# release.test.sh — isolated tests for the hardened release.sh (ticket 28).
#
# Runs entirely in a throwaway temp dir with a LOCAL bare repo as "origin" and a
# FAKE `gh` on PATH. It never contacts GitHub or the production remote.
#
# Covers:
#   1. normal path: only the release tag is pushed (not unrelated local tags)
#   2. normal path: temp notes file is cleaned up; changelog promoted correctly
#   3. failure path: a failing `gh` leaves the pushed tag, cleans the temp file,
#      and prints recovery instructions, exiting nonzero
#   4. portability: no `sed -i` remains in the script
#
# Run:  bash skills/meta/release/references/release.test.sh
# Exit 0 = all pass.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RELEASE_SH="$SCRIPT_DIR/release.sh"
PASS=0
FAIL=0

ok()   { echo "  ok   - $1"; PASS=$((PASS+1)); }
bad()  { echo "  FAIL - $1"; FAIL=$((FAIL+1)); }

# --- Static check: no `sed -i` (non-portable) remains -------------------------
# Match actual command usage at the start of a pipeline/line, not prose mentions
# in comments (the script explains why it avoids `sed -i`).
if grep -nE '^[[:space:]]*sed[[:space:]]+-i' "$RELEASE_SH" >/dev/null; then
  bad "release.sh still contains a non-portable 'sed -i'"
else
  ok "release.sh has no 'sed -i' command (portable in-place edits)"
fi

# --- Build an isolated sandbox: work repo + bare 'origin' + fake gh ------------
SANDBOX="$(mktemp -d)"
trap 'rm -rf "$SANDBOX"' EXIT

ORIGIN="$SANDBOX/origin.git"
WORK="$SANDBOX/work"
GHBIN="$SANDBOX/bin"
mkdir -p "$GHBIN"

git init --quiet --bare "$ORIGIN"
git init --quiet "$WORK"
cd "$WORK"
git config user.email test@example.com
git config user.name "Release Test"
git config commit.gpgsign false
git config tag.gpgsign false
git config tag.forceSignAnnotated false
git remote add origin "$ORIGIN"

cat > CHANGELOG.md <<'EOF'
# Changelog

## [Unreleased]

### Added
- A shiny new thing users can do.

## [0.1.0] - 2026-01-01

### Added
- Initial release.
EOF
mkdir -p .claude-plugin
cat > .claude-plugin/plugin.json <<'EOF'
{
  "name": "demo",
  "version": "0.1.0",
  "dependencies": [{ "name": "dep", "version": "^9.0.0" }]
}
EOF
mkdir -p .codex-plugin
cp .claude-plugin/plugin.json .codex-plugin/plugin.json
git add CHANGELOG.md .claude-plugin/plugin.json .codex-plugin/plugin.json
git commit --quiet -m "init"
git branch -M main
git push --quiet origin main 2>/dev/null

# Seed the first release tag so 0.2.0 is strictly greater.
git tag -a v0.1.0 -m "0.1.0"
# An UNRELATED local tag that must NOT be pushed by the release.
git tag unrelated-local-tag
git push --quiet origin v0.1.0 2>/dev/null

# Fake gh: behavior controlled by $FAKE_GH_MODE (ok|fail).
cat > "$GHBIN/gh" <<'EOF'
#!/usr/bin/env bash
if [[ "${FAKE_GH_MODE:-ok}" == "fail" ]]; then
  echo "fake gh: simulated API failure" >&2
  exit 1
fi
echo "fake gh: created release (simulated)"
exit 0
EOF
chmod +x "$GHBIN/gh"
export PATH="$GHBIN:$PATH"

# =============================================================================
# Test A — normal path
# =============================================================================
FAKE_GH_MODE=ok bash "$RELEASE_SH" 0.2.0 >/dev/null 2>&1
rc=$?
if [[ $rc -eq 0 ]]; then ok "normal run exits 0"; else bad "normal run exit $rc"; fi

# Only v0.2.0 (and the pre-existing v0.1.0) on origin — NOT unrelated-local-tag.
pushed_tags="$(git ls-remote --tags origin | sed 's#.*refs/tags/##;s/\^{}//' | sort -u)"
if echo "$pushed_tags" | grep -qx "v0.2.0"; then ok "release tag v0.2.0 pushed"; else bad "v0.2.0 not pushed"; fi
if echo "$pushed_tags" | grep -qx "unrelated-local-tag"; then
  bad "unrelated-local-tag leaked to origin (--tags regression)"
else
  ok "unrelated local tag was NOT pushed"
fi

# Changelog promoted: a dated [0.2.0] section exists and [Unreleased] is now empty-ish.
if grep -qE '^## \[0\.2\.0\] - ' CHANGELOG.md; then ok "changelog promoted to dated [0.2.0]"; else bad "changelog not promoted"; fi

# Plugin manifest bumped in the release commit; the dependency's range is untouched.
if git show v0.2.0:.claude-plugin/plugin.json | grep -q '"version": "0.2.0"'; then ok "plugin.json version bumped in the release commit"; else bad "plugin.json version not bumped"; fi
if git show v0.2.0:.claude-plugin/plugin.json | grep -q '"\^9.0.0"'; then ok "dependency version range left alone"; else bad "dependency version range was rewritten"; fi

if git show v0.2.0:.codex-plugin/plugin.json | grep -q '"version": "0.2.0"'; then ok "Codex plugin version bumped in release commit"; else bad "Codex plugin version not bumped"; fi

# No stray temp files left in the work tree.
if ls "$WORK"/tmp.* >/dev/null 2>&1; then bad "temp file left behind in work dir"; else ok "no temp notes file left behind"; fi

# =============================================================================
# Test B — failure path (gh fails)
# =============================================================================
# Fresh [Unreleased] content so the gate passes for the next version.
cat > CHANGELOG.md <<'EOF'
# Changelog

## [Unreleased]

### Fixed
- Another user-visible fix.

## [0.2.0] - 2026-01-02

### Added
- A shiny new thing users can do.

## [0.1.0] - 2026-01-01

### Added
- Initial release.
EOF
git add CHANGELOG.md
git commit --quiet -m "chore: unreleased entries for 0.3.0"
git push --quiet origin main 2>/dev/null

out="$(FAKE_GH_MODE=fail bash "$RELEASE_SH" 0.3.0 2>&1)"
rc=$?
if [[ $rc -ne 0 ]]; then ok "gh failure makes release exit nonzero"; else bad "gh failure did not fail the release"; fi
if echo "$out" | grep -q "gh release create failed"; then ok "failure path prints a recovery message"; else bad "no recovery message on gh failure"; fi
if echo "$out" | grep -q "undo the tag"; then ok "recovery message includes tag-undo instructions"; else bad "recovery message missing undo instructions"; fi

# The tag was still pushed (the tag is the durable artifact).
pushed_tags="$(git ls-remote --tags origin | sed 's#.*refs/tags/##;s/\^{}//' | sort -u)"
if echo "$pushed_tags" | grep -qx "v0.3.0"; then ok "tag v0.3.0 pushed despite gh failure (recoverable)"; else bad "tag v0.3.0 not pushed on gh failure"; fi

# Temp file cleaned even on the failure path (trap on EXIT).
if ls "$WORK"/tmp.* >/dev/null 2>&1; then bad "temp notes file left behind after gh failure"; else ok "temp notes file cleaned up on failure (trap EXIT)"; fi

# =============================================================================
echo ""
echo "release.test.sh: $PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]]
