#!/usr/bin/env bash
set -euo pipefail

# release.sh - the pinned mechanical tail of a grey-matter release.
#
# The `release` skill does the JUDGEMENT first (changelog entries via the changelog
# skill, README drift via the readme skill, the version bump via references/versioning.md)
# and only then runs this script, which does the EXACT, must-not-be-fumbled steps:
# gate, promote the changelog, commit, tag, push, create the GitHub release.
#
# Usage:  bash release.sh <version> [--dry-run]
# Example: bash release.sh 0.2.0
#          bash release.sh 0.2.0 --dry-run
#
# Run it from the repo root (or anywhere inside the repo). Requires: git, gh.
#
# Gates (all must pass or it aborts without touching anything):
#   - working tree clean (ignoring .scratch/)
#   - version is valid semver and strictly greater than the last v* tag
#   - CHANGELOG.md exists and has entries under [Unreleased]

REPO_ROOT="$(git rev-parse --show-toplevel)"
CHANGELOG="$REPO_ROOT/CHANGELOG.md"

VERSION=""
DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    -*) echo "Unknown flag: $arg" >&2; exit 1 ;;
    *) VERSION="$arg" ;;
  esac
done

if [[ -z "$VERSION" ]]; then
  echo "Usage: bash release.sh <version> [--dry-run]" >&2
  exit 1
fi
VERSION="${VERSION#v}"

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "x invalid semver: $VERSION (expected X.Y.Z)" >&2
  exit 1
fi

# version > last tag
LAST_TAG=$(git -C "$REPO_ROOT" tag -l 'v*' --sort=-v:refname | head -1)
if [[ -n "$LAST_TAG" ]]; then
  LAST_VERSION="${LAST_TAG#v}"
  HIGHER=$(printf '%s\n%s\n' "$LAST_VERSION" "$VERSION" | sort -V | tail -1)
  if [[ "$HIGHER" == "$LAST_VERSION" && "$VERSION" != "$LAST_VERSION" ]]; then
    echo "x version $VERSION is not greater than current $LAST_TAG" >&2
    exit 1
  fi
  if [[ "$VERSION" == "$LAST_VERSION" ]]; then
    echo "x version $VERSION equals current $LAST_TAG" >&2
    exit 1
  fi
fi

# working tree clean (ignoring .scratch/)
if [[ -n "$(git -C "$REPO_ROOT" status --porcelain -- ':!.scratch')" ]]; then
  echo "x working tree not clean (ignoring .scratch/):" >&2
  git -C "$REPO_ROOT" status --short -- ':!.scratch' >&2
  exit 1
fi

# CHANGELOG has [Unreleased] content
if [[ ! -f "$CHANGELOG" ]]; then
  echo "x CHANGELOG.md not found at $CHANGELOG (run the changelog skill first)" >&2
  exit 1
fi
UNRELEASED=$(sed -n '/^## \[Unreleased\]/,/^## \[/{/^## \[/!p;}' "$CHANGELOG" | grep -v '^$' || true)
if [[ -z "$UNRELEASED" ]]; then
  echo "x no entries under [Unreleased] in CHANGELOG.md (run the changelog skill first)" >&2
  exit 1
fi

TODAY=$(date +%Y-%m-%d)
TAG="v$VERSION"
# A Claude Code plugin caches by its manifest version, so the release keeps it in step.
PLUGIN_MANIFEST="$REPO_ROOT/.claude-plugin/plugin.json"

echo ""
echo "Release: $TAG ($TODAY)   previous: ${LAST_TAG:-none}"
echo "Unreleased entries:"
echo "$UNRELEASED" | head -20

if [[ "$DRY_RUN" == true ]]; then
  echo ""
  echo "DRY RUN - would:"
  echo "  1. promote [Unreleased] -> [$VERSION] - $TODAY in CHANGELOG.md"
  [[ -f "$PLUGIN_MANIFEST" ]] && echo "  1b. set \"version\": \"$VERSION\" in .claude-plugin/plugin.json"
  echo "  2. git commit -m 'release: $TAG'"
  echo "  3. git tag -a $TAG"
  echo "  4. git push origin HEAD, then push only tag $TAG (not other local tags)"
  echo "  5. gh release create $TAG with notes from the changelog section"
  exit 0
fi

# 1. promote [Unreleased] -> dated version section (leave a fresh empty [Unreleased])
# Portable in-place edit: write to a temp file and move it back. BSD/macOS `sed -i`
# requires a backup-suffix argument and GNU `sed -i` does not, so `sed -i` is not
# portable; the temp-file+mv pattern behaves identically everywhere.
CHANGELOG_TMP=$(mktemp)
# awk, not sed: a "\n" in a sed replacement is GNU-only (BSD sed writes a literal "n").
awk -v v="$VERSION" -v d="$TODAY" '{ print } !done && /^## \[Unreleased\]/ { print ""; print "## [" v "] - " d; done=1 }' \
  "$CHANGELOG" > "$CHANGELOG_TMP"
# collapse any run of blank lines left by the insertion down to a single blank line
sed '/^$/N;/^\n$/D' "$CHANGELOG_TMP" > "$CHANGELOG"
rm -f "$CHANGELOG_TMP"

# 1b. bump the Claude Code plugin manifest's version, when the repo has one. Only the
# first "version" key is the plugin's own (a later one would sit inside a dependency).
if [[ -f "$PLUGIN_MANIFEST" ]]; then
  MANIFEST_TMP=$(mktemp)
  awk -v v="$VERSION" '!done && /"version"[[:space:]]*:/ { sub(/"version"[[:space:]]*:[[:space:]]*"[^"]*"/, "\"version\": \"" v "\""); done=1 } { print }' \
    "$PLUGIN_MANIFEST" > "$MANIFEST_TMP"
  mv "$MANIFEST_TMP" "$PLUGIN_MANIFEST"
  git -C "$REPO_ROOT" add "$PLUGIN_MANIFEST"
fi

# 2. commit
git -C "$REPO_ROOT" add "$CHANGELOG"
git -C "$REPO_ROOT" commit -m "release: $TAG"

# 3. annotated tag
git -C "$REPO_ROOT" tag -a "$TAG" -m "Release $TAG"

# 4. push commit + ONLY this release tag (never `--tags`, which would publish every
# unrelated local tag).
git -C "$REPO_ROOT" push origin HEAD
git -C "$REPO_ROOT" push origin "refs/tags/$TAG"

# 5. GitHub release with notes extracted from this version's changelog section.
# The temp notes file is always cleaned up (trap on EXIT), even if gh fails. A gh
# failure leaves the pushed tag in place (the tag IS the release; the GitHub release
# is a retryable presentation layer) and prints exact recovery steps rather than
# exiting silently.
NOTES_FILE=$(mktemp)
trap 'rm -f "$NOTES_FILE"' EXIT
sed -n "/^## \[$VERSION\]/,/^## \[/{/^## \[$VERSION\]/d;/^## \[/d;p;}" "$CHANGELOG" > "$NOTES_FILE"
REMOTE_REPO="$(git -C "$REPO_ROOT" remote get-url origin | sed 's/\.git$//')"
if ! gh release create "$TAG" --title "$TAG" --notes-file "$NOTES_FILE" --repo "$REMOTE_REPO"; then
  echo "" >&2
  echo "x gh release create failed. The tag $TAG is already committed and pushed." >&2
  echo "  The repository state is intact; only the GitHub release is missing. Recover by either:" >&2
  echo "    - retry the release:   gh release create $TAG --title $TAG --notes-file <(git -C \"$REPO_ROOT\" show $TAG:CHANGELOG.md) --repo $REMOTE_REPO" >&2
  echo "    - or undo the tag:     git -C \"$REPO_ROOT\" push origin :refs/tags/$TAG && git -C \"$REPO_ROOT\" tag -d $TAG" >&2
  exit 1
fi

echo ""
echo "released $TAG  (gh release view $TAG)"
