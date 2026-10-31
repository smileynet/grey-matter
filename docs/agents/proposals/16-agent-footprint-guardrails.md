# Proposal 16: footprint guardrails while agents work

**Status:** proposed 2026-10-30. Draft written from the system-health disk review; not yet filed in grey-matter.

**Scope:** `global/AGENTS.md`; `skills/meta/repository-artifact-hygiene` (a new "While you work" section and one read-only script); one line each in `orient` and in the `conformance-audit` agent-guidance class. No new skill.

**Builds on:** ticket 97 (done 2026-10-29, commit `20be9d9`). Its "At ticket close" rule decides what happens to an artifact when its ticket closes. This proposal covers the time before close, where the disk filled up.

## Recommendation

1. **Three always-on lines** in `global/AGENTS.md` (625 B; the file is 1,173 B of a 3,072 B budget). They are the only part every harness reads without invoking a skill.
2. **A "While you work" section** in `repository-artifact-hygiene`, next to "At ticket close", plus a description trigger so the skill loads when a task is about to create something large.
3. **A read-only `scripts/inspect-footprint.mjs`** in that skill. It gives the facts both sections need: size, owning ticket and its status, citations in tracked files, hard links, open files, bytes identical to tracked content, and a keep list for cited sub-paths.
4. **Two conformance checks** for adopted repos: test-runner temp retention, and `.scratch` paths cited from tracked manifests.
5. **One `orient` line:** free space and the largest uncommitted footprint at session start.

Extending the owner keeps ticket 97's decision (one skill owns the rule, the others point at it). A separate `footprint` skill would split one lifecycle across two files and add index churn (bucket README, `compass`, the meta roster) for about 40 lines of text. Revisit if the owner skill passes the sprawl threshold in `writing-for-agents`.

## What 97 covers and what it leaves open

| Situation seen on this Mac | Covered by 97's close rule? |
|---|---|
| Ticket closes with 20 attempt folders left behind | Yes, at close |
| The same ticket reaches 22 GiB of scratch before it closes | **No**: the close rule runs once, at the end |
| A test run copies a 1.1 GiB tracked archive into every checkout | **No**: nothing says to reference instead of copy |
| A test runner keeps three whole runs of 2 to 7 GiB each | **No**: runner settings are not mentioned |
| An agent not working a ticket (an ad-hoc Codex or Kiro session) leaves downloads, installers, staged updates | **No**: the rule is reached only through `implement`, `implement-spec` and `wrap-session` |
| Tracked manifests cite `.scratch` paths, so removal needs a keep list | Partly: the grey-matter docs check flags new citations, but the folders cleaned today alone had 86 existing cited paths in adopted repos |
| Deciding what an agent may delete unasked | Partly: "same authorization as any other deletion" |

## Evidence, 2026-10-23 to 2026-10-30, one Mac

The system-health disk-review session reported the measurements below from disposable local reports: the recent-files report and removal final list, both dated 2026-10-30. They are untracked in system-health and not preserved in this checkout, so these historical measurements are reported context rather than independently reproducible evidence; implementation acceptance requires the tracked fixtures below.

- 166.1 GiB of new files in 7 days; 69.0 GiB of it in code folders.
- Free space fell from 20 GiB to 6.6 GiB, and on Oct 30 at 06:45 to 0.18 GiB, while agent sessions kept writing. It recovered only because the Trash was emptied. About 55 GiB was moved to the Trash in the last two rounds (28.7 GiB, then 26.2 GiB).
- tagalog-helper `.scratch` grew from 12 GB to 38 GB in two days. One ticket (170) made 22.3 GiB in 20 folders; its largest folder held 8.1 GiB while tracked documents cited 5.4 MiB inside it.
- One 1.1 GiB evidence archive existed in at least six places at once (the tracked copy, the LFS store, three scratch folders, a test checkout).
- A single pytest run left 6.9 GiB. Default pytest keeps the last three runs whatever their outcome; the retention settings exist in the installed pytest 9.1.1 (`tmp_path_retention_policy`, `tmp_path_retention_count`) and the repo sets neither.
- Hash comparison showed 826 of 844 MiB in one scratch folder was byte-identical to tracked files.
- Ticket 170 closed on Oct 30, a day after the close rule landed. Whether that session had the updated skill installed is unverified.

Mistakes the checks caught, which the inspector should make impossible to repeat:

- My first citation pass said two folders had no existing cited files; a recheck with a stricter pattern found cited paths in both. Citations must be matched by exact sub-path, with the folder name only as a lead.
- App "last used" times were useless after my own scan read every binary. Never infer disuse from access time.
- Allocated sizes overstate when APFS clones share blocks (Chrome's signing copy, `uv` environments); report them as an upper bound.

## Parts

### P1. Global rule (always on, all harnesses)

```markdown
- Footprint: keep what you leave on disk small. Before one action creates over 500 MiB (builds, test runs, simulators, downloads, copies of tracked files), check `df -h .` and link or reference instead of copying. Keep the latest three attempts of anything you generate, delete older ones as you go, and name them for their ticket.
- Before you finish, promote, keep or delete what you made, as in repository-artifact-hygiene ("At ticket close"). Use a recoverable delete (`trash`, not `rm`), and list what you did not make with its size instead of deleting it.
- Free space under 20 GiB: stop adding data and tell the user.
```

Each line has one trigger: before a large action, before finishing, low free space. The 500 MiB and 20 GiB numbers are decisions for you (see below).

### P2. "While you work" in `repository-artifact-hygiene`

```markdown
## While you work

Check before you create and prune as you go. The close-out is the second chance.

1. **Measure the ask.** Before an action that will write over 500 MiB, check free space
   (`df -h <path>`); stop and tell the user under 20 GiB.
2. **Reference, don't copy.** Point tests and tools at a large tracked file by path, hard link,
   `git worktree` or shared clone, and skip LFS smudging in test clones
   (`GIT_LFS_SKIP_SMUDGE=1`). One copy of the same bytes per ticket.
3. **Bound history as it grows.** When attempt N+1 of a kind lands, delete attempts older than the
   latest three that are neither failed nor cited. Name attempts `t<ticket>-<kind>-<n>`.
4. **Let test runners clean up.** Set retention so a passing run leaves nothing
   (pytest: `tmp_path_retention_policy = "failed"`).
5. **Own what you made.** Delete your own attempts at close without asking. For anything older or
   made by someone else, run the inspector, list the result and wait for authorization.
6. **Cite small.** Cite a tracked copy; when a `.scratch` path must be cited, cite one small file
   (a `report.json`), so close can keep it and drop the rest.
```

Description addition (one trigger per branch): "Use when a task will create build output, test runs, simulators, downloads or copies of tracked files over about 500 MiB, or when closing a ticket or session."

### P3. `scripts/inspect-footprint.mjs` (read-only, Node 22+, no dependencies)

```text
node <skill-dir>/scripts/inspect-footprint.mjs --repo <root> [--ticket N] [--since <time>] [--dedupe]
```

For each uncommitted family (`.scratch/*`, build output, worktrees, outside work folders named in a ticket) it reports:

- allocated size and newest write (epoch-dated files ignored);
- owning ticket from the name, and that ticket's status from `tkt query`;
- tracked files citing it, matched by exact sub-path, with the outermost existing cited paths as a **keep list** and their size;
- hard-linked files, open files (`lsof`), and running builds that touch it;
- with `--dedupe`, bytes identical (sha256, size-prefiltered) to tracked files and the LFS store;
- a suggested outcome per family: delete, keep with scope, or slim (keep the cited paths, trash the rest).

Exit 0 reports; 1 means a stated limit is exceeded (a ticket over its cap, free space under the floor); 2 means inspection failed. Partial coverage is reported, never presented as complete. A companion `--slim` execution mode is not proposed: removal stays with the user's authorization and `trash`.

**Prototype context:** system-health used disposable Python/macOS scripts for keep-list and recheck logic, reporting 30 real items without a wrong removal. The `removal-final` script and session scratchpad scripts `code_candidates.py` and `do_ready.py` are untracked there and not preserved here; they are not a durable implementation dependency. Implement the contract above with tracked fixtures; Linux needs its own `lsof`/`du` verification.

### P4. Conformance checks for adopted repos (`conformance-audit`)

- A Python repo with pytest and no `tmp_path_retention_policy` is flagged, with the one-line fix.
- Tracked JSON or Markdown that cites `.scratch/` paths is flagged, with the keep list from the inspector as the migration aid. grey-matter's own docs check already does this for its tree.

### P5. `orient` line

At session start print free space and, when under 40 GiB, the three largest uncommitted footprints in the repo. This is the cue that makes P1's third line fire before the disk is full.

### P6. Deployment

| Piece | How it reaches harnesses |
|---|---|
| P1 | `node scripts/install-agents-md.mjs`: kiro-cli `~/.kiro/steering/AGENTS.md`, codex `~/.codex/AGENTS.md` (honors `CODEX_HOME`), Claude Code `~/.claude/CLAUDE.md`, OpenCode `~/.config/opencode/AGENTS.md`. agy and Crush have no verified user-level path and keep the project `AGENTS.md`. |
| P2, P3 | Edits to an existing skill, so `deploy.mjs` and the Claude/Codex plugins carry them with the next sync. No new roster entry. |
| P4, P5 | Edits to `conformance-audit` and `orient`, same path. |

`check-guidance.mjs` must pass with the new block (1,798 B of 3,072 B), and `check-repo.mjs` must stay green.

## Not proposed

- A cleanup daemon, scheduled deletion or disk quotas enforced by a harness. Detection and a rule at the point of creation come first.
- New hooks in phase 1. Hook surfaces differ by harness; a session-start hook could replace P5 where one exists.
- Any inspector mode that deletes. Removal needs the user's authorization for exact targets, and the inspector's output is that list.
- Per-OS wording beyond `trash` and `df`; Linux and Windows hosts follow the same rules with their own tools.

## Acceptance before implementation is called complete

1. Fixture repo with seeded families: over-cap ticket, cited and uncited folders, hard-linked file, open file, epoch-dated files. The inspector goes red on the seeded problems and green once clean; the slim keep list equals the seeded citations.
2. A fixture where a new citation appears between listing and removal produces a "keep list changed" result, not a deletion.
3. `node scripts/install-agents-md.mjs` dry run shows only the new lines in the managed block; `node scripts/check-guidance.mjs` passes; the block stays under the budget.
4. `writing-for-agents` review of the new section (pointer wording, one trigger per branch, positive phrasing).
5. `node scripts/check-repo.mjs` passes; indexes (`compass`, bucket README, roster) unchanged because no skill is added.
6. A seeded pytest project flagged by P4 and fixed by the one-line setting.

## Decisions for you

1. **Owner.** Extend `repository-artifact-hygiene` (recommended) or create a separate `footprint` skill.
2. **Numbers.** 500 MiB per action, three attempts, 20 GiB free-space floor, optional 5 GiB per-ticket cap. These come from this Mac (460 GiB disk); they could scale with the disk size instead.
3. **Always-on cost.** 625 B in every harness's global file, against 1,274 B of headroom.
4. **Hashing.** Keep `--dedupe` opt-in (it read about 3 GiB in this session) or make it the default for folders under a size limit.
5. **`orient` line** now, or wait for a hook.
6. **P4 scope.** Pytest retention only, or also other runners (Jest, `cargo`, Xcode DerivedData, `xcresult` retention).

## Files to touch

`global/AGENTS.md`; `skills/meta/repository-artifact-hygiene/SKILL.md` and `scripts/inspect-footprint.mjs` with its test; `skills/meta/orient/SKILL.md`; the agent-guidance class in `skills/meta/conformance-audit`; `docs/agents/harnesses.md` (budget figure only); a ticket (draft in `ticket-draft.md`).

## Prior art and fact checks (2026-10-30)

Checked against primary sources where reachable; blog and package-doc items are marked.

**Confirmed**
- pytest `tmp_path_retention_policy` defaults to `all` and `tmp_path_retention_count` to 3 (read from `src/_pytest/tmpdir.py` on main). `failed` deletes a passing test's directory and the whole base directory when every test passed; `none` forces count 0. P2 rule 4 and P4 stand as written.
- uv `link-mode` defaults to `clone` on macOS and Linux, `hardlink` on Windows (docs.astral.sh settings reference). Sizes of uv environments are an upper bound on APFS; `uv cache prune` is the supported cleanup, not deleting cache files by hand.
- `GIT_LFS_SKIP_SMUDGE` and `lfs.storage` exist in git-lfs-config; `lfs.fetchinclude`/`fetchexclude` leave pointers unreplaced. P2 rule 2 stands.
- APFS: Finder "on disk" ignores clone savings (Eclectic Light, 2026-09-05). Keep the "upper bound" wording in the inspector.

**Not confirmed**
- Whether linked worktrees share `.git/lfs/objects` with the main checkout. `git lfs env` in tagalog-helper shows `LocalMediaDir=<repo>/.git/lfs/objects`; a linked worktree was not checked. P2 rule 2 should say "check `git lfs env` in the worktree" until it is.

**Prior art: `aibris` (Go CLI, package docs; unverified in use) and a Mac cleanup guide (mole.fit blog)**
- Same shape as ours: scan, group by project/category/age, ask, dry-run, ask again, execute. Our inspector plus `trash` is the same loop with the user as the gate.
- Worth borrowing: protect **active worktrees** and treat only orphaned ones as candidates; a **24-hour idle floor** for agent state (we used 15 minutes of quiet; consider 24 h for agent session stores such as Kiro history); logs removed only on an explicit flag; use each tool's own cleanup command (`go clean -cache`, `uv cache prune`) before deleting directories.
- Their measurements match ours: Rust `target/` 24 GB, `.next`, `node_modules/.cache`, `dist`. Our evidence has no JS or Rust case yet, so P4's "other runners" question (decision 6) has weak support; keep pytest-only until a second case appears.

**Changes to the recommendations**
1. P3 gains an **active worktree** check (skip a worktree whose branch is checked out or has uncommitted changes); tagalog-helper keeps worktrees under `.claude/worktrees/`, so this is a real path.
2. P3's quiet floor becomes a flag: 15 minutes by default, 24 hours for agent state stores.
3. P2 adds a sixth-to-seventh rule: prefer the tool's own prune command to hand deletion for caches (`uv cache prune`, `go clean -cache`, `cargo clean` per project, `xcrun simctl delete unavailable`). The last two commands were not verified here.
4. Decision 6 recommendation: pytest only.
5. No hook-based or daemon approach found in prior art that beats rule-at-creation plus inspector; "Not proposed" stands.
