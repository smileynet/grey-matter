# Repo hygiene during adoption

Detected in Step 1, wired in Step 5, decided at the Step 6 gate.

## Git LFS

1. **Detect.** List tracked binaries by extension (`git ls-files` filtered to png/jpg/gif/webp/
   pdf/pptx/docx/fonts/zip/video/audio/engine assets) and by size. Check `.gitattributes` for
   `filter=lfs`, and `git lfs ls-files` for what is already stored there.
2. **Decide.** If binaries are tracked, or the repo is asset-heavy (game, deck, art, docs with
   screenshots), propose LFS. Keep diffable source as plain text: SVG, JSON, YAML, CSV, and
   anything a human reviews in a diff.
3. **Wire.**
   - Write `.gitattributes` rules (`*.png filter=lfs diff=lfs merge=lfs -text`, ...), with a
     comment saying clones need `git lfs install`.
   - Run `git lfs install --local`. It installs the pre-push hook; without it, pointers push
     with no objects behind them.
   - Run `git add --renormalize` on the matched paths so the **current tree** converts.
4. **Don't rewrite history.** `git lfs migrate import --everything` rewrites every commit and
   needs a force-push. It is a separate HITL decision, never part of the adoption commit.
5. **Verify.**
   - After pushing, the push output shows LFS objects uploading.
   - A fresh clone gets real files: `file <some.png>` reports image data, not ASCII text.
   - Add one AGENTS.md gotcha: run `git lfs install` once per machine, or files read as
     ~130-byte pointer stubs.

## Sensitive or out-of-place tracked content

Surface at the gate: customer-, partner-, or person-named artifacts in a repo meant for
cloning; personal material; credentials-like files; large generated outputs that should be
build artifacts.

- **In scope:** untrack (`git rm -r --cached`) and gitignore, leaving the local copy in place.
- **Out of scope:** purging history (`git filter-repo` plus a force-push). Name it as a
  follow-up the owner decides.

## `.references/` rehydration index

- Gitignore the contents, not the dir: `.references/*` then `!.references/README.md`. A plain
  `.references/` line makes the negation unreachable.
- Every entry needs its exact clone command (`git -C <dir> remote get-url origin`).
- **Gotcha:** for a folder with no `.git` of its own, `git -C <dir>` walks up to the *parent*
  repo and reports the parent's remote, so a local folder looks like a self-clone. Test for
  `<dir>/.git` first.
- Mark non-git local material as not rehydratable, and say what it is if it's sensitive.
- Repair pointers the README makes to ephemeral (`.scratch/`) or retired files.
