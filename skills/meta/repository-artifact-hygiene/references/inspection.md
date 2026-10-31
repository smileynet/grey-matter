# Inspection and explicit project policy

The skill body owns the workflow. This reference describes its read-only helper;
it supplies evidence for classification, not automatic artifact roles.

- [Commands](#commands)
- [Output and failures](#output-and-failures)
- [Optional policy](#optional-policy-version-1)
- [Authority and limitations](#authority-and-limitations)

## Commands

Run with Node 22+ and Git supporting `--no-lazy-fetch`; older Git fails before
inspection rather than silently ignoring that protection. Use locally available
Git storage, not cloud-only Git objects. Substitute the installed skill directory
and explicit repo root:

```text
node <skill-dir>/scripts/inspect-artifacts.mjs --repo <repo>
node <skill-dir>/scripts/inspect-artifacts.mjs --repo <repo> --ref HEAD
node <skill-dir>/scripts/inspect-artifacts.mjs --repo <repo> --ref HEAD --history
node <skill-dir>/scripts/inspect-artifacts.mjs --repo <repo> --policy policy.json
```

`--repo` must be a Git worktree root, not a plain folder inside another repo.
No untracked/ignored content, submodule contents or LFS payload is traversed.
Symlink content is the stored Git target text, never the target file.
Policy is an explicit local JSON input, resolved relative to `--repo`; no policy
file is required or discovered automatically.

| Flag | Meaning |
| --- | --- |
| `--ref REV` | Inspect a frozen committed tree instead of staged candidates. |
| `--history` | Inspect reachable local-ref history with explicit coverage limits; never fetch. |
| `--max-commits N` | History commit bound, default 1,000. Hitting it conservatively marks history incomplete. |
| `--max-objects N` | History metadata/object bound, default 10,000. |
| `--max-blob-bytes N` | Per-body read bound, default 33,554,432. |
| `--max-content-bytes N` | Shared unique-content read budget across tree/history, default 67,108,864. |
| `--warn-bytes N` | Optional ordinary blob-size warning; never a blocking threshold. |
| `--policy FILE` | Evaluate explicitly approved rules against selected paths in the inspected state. |

Deleted paths are listed without reading removed bodies. A staged manifest
deletion, rename or replacement by a non-regular file also selects its unchanged
policy dependents; `selection: policy-dependent` and `policyDependentPaths` disclose
that scope expansion. Full tree/index metadata determines manifest presence,
even when a retained manifest is not itself a staged candidate.
History metrics are independent of current candidates; adding them double-counts
reachable content. Logical blob bytes are uncompressed, not Git pack sizes.

## Output and failures

JSON contains `status`, `scope`, `coverage`, `metrics`, `files`, `findings`, `errors`
and optional `history`. Warnings can accompany `status: pass` and exit 0.
Explicit unsuppressed policy violations produce `fail`/1. Invalid input, malformed
pointers, missing objects and unverified policy content produce `error`/2.

`metadataComplete` and `contentComplete` have different meanings. Byte budgets
can leave bodies uninspected while metadata is complete; that is not evidence
of no embedded content. A rule that needs unread content cannot pass by omission.
The helper records concurrent index/HEAD changes and reports candidate races as
errors. A frozen ref remains the selected tree even when another branch advances.

`uniqueLfsDeclaredBytes` deduplicates SHA-256 payload declarations within the
selected scope. It does not read LFS objects, measure remote historical retention,
or prove payload availability. `embeddedCharacters` counts base64 characters,
not decoded file allocation. Files retain `role: requires project evidence`.

## Optional policy version 1

After explicit project approval, a small policy can express deterministic limits:

```json
{
  "version": 1,
  "rules": [
    {
      "id": "review-evidence",
      "paths": ["docs/evidence/**/*.html"],
      "maxBlobBytes": 1048576,
      "maxEmbeddedCharacters": 0,
      "requireManifest": "docs/evidence/manifest.json"
    }
  ],
  "exceptions": [
    {
      "rule": "review-evidence",
      "path": "docs/evidence/offline-demo.html",
      "reason": "Approved self-contained milestone deliverable"
    }
  ]
}
```

The example sizes are not defaults. `paths` are repository-relative globs: `*`
matches within a segment, `**` crosses directories and `?` matches one non-slash
character. `**/` can match zero directories. Other characters are literal.
Exceptions require an existing rule, an exact path and a nonempty reason; they
are included in findings rather than silently hidden. Unknown fields and invalid
rules fail inspection. `maxBlobBytes` measures the actual Git blob, so an LFS
pointer is its small pointer blob, not its declared payload. `requireManifest`
checks a regular file's presence in Git, not digest correctness or a remote object's availability.
Verify manifest versions, hashes, access and retention separately in the workflow.

## Authority and limitations

[Git's command contract](https://git-scm.com/docs/git) documents no-lazy-fetch and
optional-lock protection. [cat-file](https://git-scm.com/docs/git-cat-file)
documents object lengths, batch metadata and missing-object responses. Read
2026-10-25. The helper disables repository-local caller context and config
injection, optional locks, lazy fetching, fsmonitor and external diff/textconv;
it runs only Git metadata/blob reads. History enumeration has command output/time
limits as well as the declared commit/object bounds; exceeding them is an error.

## Footprint inspector

`scripts/inspect-footprint.mjs` measures what sits on disk uncommitted, for the
"While you work" and "At ticket close" rules. It reads files, Git metadata and the
open-file table; it never deletes, stages or fetches.

```text
node <skill-dir>/scripts/inspect-footprint.mjs --repo PATH [--path DIR]... [--ticket N]
  [--quiet 15m | --agent-state] [--floor 20GiB] [--cap 5GiB] [--dedupe]
  [--recheck PRIOR.json] [--summary [--top-under 40GiB]]
```

| Flag | Effect |
|---|---|
| `--path DIR` | add a family outside the repo (a release work folder, an agent state store) |
| `--ticket N` | only families whose name carries ticket N (`t110-…`, `ticket-110`, `110-…`) |
| `--quiet 15m` | skip a family written within this window; `--agent-state` sets 24h for session stores |
| `--floor` / `--cap` | free-space floor (default 20GiB) and optional per-ticket total; breaking one exits 1 |
| `--dedupe` | sha256 files whose size matches a tracked file, plus the LFS store; reports identical bytes. Opt-in: it reads every candidate file |
| `--recheck PRIOR.json` | compare keep lists with a saved run; a changed one on a delete/slim family becomes "keep list changed" and exits 1 |
| `--summary` | one line: free space, and the three largest families when free space is under `--top-under` (40GiB) |

Output is JSON: `status` (`pass`, `review` when candidates exist, `fail` when a limit
breaks), `freeSpace` (under WSL, the lower of the distro and `/mnt/c`), `coverage`,
`findings`, `families` sorted by size, and `conformance` (pytest retention, tracked
`.scratch` citations). Sizes are allocated bytes, an upper bound on copy-on-write
filesystems; a hard-linked file counts once. Files dated before 2000 are counted but
ignored for the newest write. A citation counts only by exact sub-path; a bare mention
of the folder is a `lead`, which makes the outcome `ask`, never `delete`. Exit 0 reports,
1 means a limit broke or a keep list changed, 2 means input or inspection failed.

Coverage is partial, and says so, where a probe is missing: open files come from
`/proc` on Linux (other users' processes only as root), `lsof` elsewhere, and are
unavailable on Windows without Sysinternals `handle.exe`.
