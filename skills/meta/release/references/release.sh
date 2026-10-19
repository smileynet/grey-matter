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
UNRELEASED=$(sed -n '/^## \[Unreleased\]/,/^## \[/{/^## \[/!p}' "$CHANGELOG" | grep -v '^$' || true)
if [[ -z "$UNRELEASED" ]]; then
  echo "x no entries under [Unreleased] in CHANGELOG.md (run the changelog skill first)" >&2
  exit 1
fi

TODAY=$(date +%Y-%m-%d)
TAG="v$VERSION"

echo ""
echo "Release: $TAG ($TODAY)   previous: ${LAST_TAG:-none}"
echo "Unreleased entries:"
echo "$UNRELEASED" | head -20

if [[ "$DRY_RUN" == true ]]; then
  echo ""
  echo "DRY RUN - would:"
  echo "  1. promote [Unreleased] -> [$VERSION] - $TODAY in CHANGELOG.md"
  echo "  2. git commit -m 'release: $TAG'"
  echo "  3. git tag -a $TAG"
  echo "  4. git push origin HEAD --tags"
  echo "  5. gh release create $TAG with notes from the changelog section"
  exit 0
fi

# 1. promote [Unreleased] -> dated version section (leave a fresh empty [Unreleased])
sed -i "s/^## \[Unreleased\]/## [Unreleased]\n\n## [$VERSION] - $TODAY/" "$CHANGELOG"
sed -i '/^$/N;/^\n$/d' "$CHANGELOG"

# 2. commit
git -C "$REPO_ROOT" add "$CHANGELOG"
git -C "$REPO_ROOT" commit -m "release: $TAG"

# 3. annotated tag
git -C "$REPO_ROOT" tag -a "$TAG" -m "Release $TAG"

# 4. push commit + tag
git -C "$REPO_ROOT" push origin HEAD --tags

# 5. GitHub release with notes extracted from this version's changelog section
NOTES_FILE=$(mktemp)
sed -n "/^## \[$VERSION\]/,/^## \[/{/^## \[$VERSION\]/d;/^## \[/d;p}" "$CHANGELOG" > "$NOTES_FILE"
gh release create "$TAG" --title "$TAG" --notes-file "$NOTES_FILE" \
  --repo "$(git -C "$REPO_ROOT" remote get-url origin | sed 's/\.git$//')"
rm -f "$NOTES_FILE"

echo ""
echo "released $TAG  (gh release view $TAG)"
