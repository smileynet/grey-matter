# Repo hygiene during adoption

Detected in Step 1, wired in Step 5, decided at the Step 6 gate.

## Artifact storage

Use [repository-artifact-hygiene](../../repository-artifact-hygiene/SKILL.md) for
classification and storage/recovery assessment during Step 1. Inspect a committed
tree for adoption; staged candidates alone may be empty. Bring its concrete plan
to the existing adoption gate and apply only the authorized storage changes in
Step 5. Binary presence is a review signal, not an automatic LFS recommendation.

When the approved plan selects LFS, preserve existing/foreign hooks while
installing its upload hook, convert only the selected current paths, and document
the client's retrieval setup. Adoption does not rewrite existing history. Use the
classification workflow's empty-cache current/historical hash and build checks;
upload progress or one file's MIME type alone is insufficient recovery evidence.

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
