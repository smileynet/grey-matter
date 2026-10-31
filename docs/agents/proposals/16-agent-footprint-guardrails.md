# Proposal 16: footprint guardrails while agents work

**Status:** proposed 2026-10-30; decisions settled 2026-10-31 (see [Decisions](#decisions)); implementation is ticket 110.

**Scope:** `global/AGENTS.md`; `skills/meta/repository-artifact-hygiene` (a new "While you work" section, a per-OS command reference and one read-only script); one line each in `orient` and in the `conformance-audit` agent-guidance class. No new skill.

**Builds on:** ticket 97 (done 2026-10-29, commit `20be9d9`). Its "At ticket close" rule decides what happens to an artifact when its ticket closes. This proposal covers the time before close, where the disk filled up.

## Recommendation

1. **Three always-on lines** in `global/AGENTS.md`, worded the same for every OS (the file is 1,325 B of a 3,072 B budget on 2026-10-31). They are the only part every harness reads without invoking a skill, so they carry the trigger.
2. **A "While you work" section** in `repository-artifact-hygiene`, next to "At ticket close", plus a description trigger on the kinds of action that grow the disk, and a per-OS command reference it points at.
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
- Footprint: before a build, test run, simulator, download, clone or copy of tracked files, check free space and reference large files instead of copying them. Measure the first attempt; past 500 MiB, follow repository-artifact-hygiene ("While you work").
- Before you finish, promote, keep or delete what you made, as in repository-artifact-hygiene ("At ticket close"). Delete to the OS trash, and list what you did not make, with its size, instead of deleting it.
- Free space under 20 GiB (under WSL, the lower of the distro and its Windows drive): stop adding data and tell the user.
```

Each line has one trigger: before a disk-growing action, before finishing, low free space. The first line triggers on the kind of action because an agent knows the action before it runs but not its size; the size is measured once the first attempt exists. The lines name no command, because one block installs on every OS and a literal command fails somewhere (on the Linux host `df` is a shell alias for `duf`, and no `trash` command is installed).

### P2. "While you work" in `repository-artifact-hygiene`

```markdown
## While you work

Check before you create and prune as you go. The close-out is the second chance.

1. **Measure.** Before a build, test run, simulator, download, clone or copy of tracked files,
   check free space; stop and tell the user under 20 GiB. Measure the first attempt's size; the
   rules below apply past 500 MiB. This host's commands: `references/footprint-by-os.md`.
2. **Reference, don't copy.** Point tests and tools at a large tracked file by path, hard link,
   `git worktree` or shared clone, and skip LFS smudging in test clones and worktrees
   (`GIT_LFS_SKIP_SMUDGE=1`): linked worktrees share the LFS store, but each checks out its own
   full copy of every LFS file. One copy of the same bytes per ticket.
3. **Bound history as it grows.** When attempt N+1 of a kind lands, delete attempts older than the
   latest three that are neither failed nor cited. Name attempts `t<ticket>-<kind>-<n>`.
4. **Let test runners clean up.** Set retention so a passing run leaves nothing
   (pytest: `tmp_path_retention_policy = "failed"`, which removes a run's directory only when
   every test passed and `--basetemp` was not given; older runs are still trimmed to the count).
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

`check-guidance.mjs` must pass with the new block, and `check-repo.mjs` must stay green.

### P7. Test-environment ladder (added 2026-10-31)

The costliest footprints in the evidence came from test environments (a 6.9 GiB pytest run,
simulators, copies of tracked archives per checkout). The cheapest fix is to not climb to an
expensive environment for a question a cheaper one answers. No skill says this today:
`implement` assumes one cheap "full suite", `implement-spec` runs it after every merge, `tdd`
names no runner cost, and `game-native-design` lists engine test kinds without their cost. None of
the agent prior art read ranks environments either. Research, all 2026-10-31:
[test tiers and cadence](../research/test-tiers-and-cadence-20261031.md),
[simulator vs device](../research/simulator-vs-device-testing-20261031.md),
[agent prior art](../research/agent-test-tiering-prior-art-20261031.md).

**Rule.** Answer each question in the leftmost tier that can observe it. Climb only when that tier
cannot. When a right-hand tier catches a bug, add a test in a left-hand tier. Report the tier a
claim was verified at, and tiers not run as "not run" (an outcome class, not a pass).

Tiers are sized by the resources a test uses, after Google's small/medium/large (prior art);
grey-matter adds the browser, simulator and device rungs from Android's testing-strategy table
(prior art), which maps layer to environment and cadence.

| Tier | Cost | What only this tier catches | Default cadence |
|---|---|---|---|
| 0. Static: types, lint, format, parse/import | seconds, no runtime | ill-typed code, banned patterns, broken links, config syntax | every slice |
| 1. Unit / in-process logic: seeded sim step, golden output | ms per test | logic and edge cases; regressions pinned from higher tiers | every slice, affected tests |
| 2. Integration / headless: real filesystem, DB, subprocess, `godot --headless`, Unreal with NullRHI | seconds per test | seam and contract errors, fakes that drift, save/load, config wiring | affected set before commit; full set before merge |
| 3. Rendered: real browser engine, engine scene with display and input | seconds to tens of seconds; flake-prone | layout, real DOM and event timing, injected input (gdUnit4 refuses input headless) | affected critical flows before merge |
| 4. Simulator / emulator | tens of seconds to minutes, boot cost, 1.4 to 1.9 GiB per Android image | OS integration, lifecycle, permissions, platform APIs across versions | smoke before merge when platform code changed; matrix before release |
| 5. Live device | minutes, scarce hardware or farm fees, often a human | real GPU, performance and memory, input feel and frame pacing, sensors, install and store builds | before release; on demand when no lower tier reproduces |

What only a device answers, from the research: iOS Simulator runs Metal on the Mac's GPU and shows
no memory pressure or out-of-memory kills; Android Macrobenchmark refuses to measure on an emulator;
jsdom does no layout at all (values read as zero); Playwright's WebKit is not Safari. Performance,
input feel, iOS camera/motion/thermal and install paths end on a device. A headless simulation
step (fixed timestep, seeded randomness) is tier 1 or 2 and replaces much of what would otherwise
need tiers 4 and 5.

**Every time vs before merge.** A check stays in the every-slice loop when it is fast (tiers 0
and 1 for affected code within about a minute), deterministic and local. It moves to before
commit, merge or release when it is slow, flaky (Google's 2017 data: 25.5% of Android emulator
tests flaky, against 1.65% overall), costly or needs fidelity a lower tier lacks. Move it back
once it is made deterministic. Device tests only nightly is the anti-pattern Android names.

**Footprint link.** Tiers 3 to 5 are the expensive ones on disk; they follow P2. One addition the
research suggests: keep a booted simulator or emulator across a ticket's slices and shut it down
at close, as a Keep with lifecycle scope, instead of booting one per slice.

**Proposed placement** (decision 8): a new agent reference `docs/agents/test-environment-ladder.md`
holding the table and rule, reached from:

- `tdd`: one line, the red-green loop runs at the lowest tier that observes the seam;
- `implement`: after each slice tiers 0 to 1; before commit up to tier 2 (or the project's declared
  commit gate); tier 3 and above only when the ticket's outcome lives there, otherwise reported
  "not run";
- `implement-spec`: per-merge gate at tiers 0 to 2; tier 3 and above once on the integration branch
  before review and before close;
- `game-native-design` engine references: each Testing row tagged with its tier;
- `init-project` and `conformance-audit`: a project's `AGENTS.md` lists its test commands by tier
  (at least single test, commit gate, slow tier), without which the ladder cannot run.

Not verified: real run times of the Godot and Unreal tiers on these hosts; Xcode DerivedData,
simulator runtime and `xcresult` sizes (need a Mac); console certification rules (under NDA).

## Not proposed

- A cleanup daemon, scheduled deletion or disk quotas enforced by a harness. Detection and a rule at the point of creation come first.
- New hooks in phase 1. Hook surfaces differ by harness; a session-start hook could replace P5 where one exists.
- Any inspector mode that deletes. Removal needs the user's authorization for exact targets, and the inspector's output is that list.
- Per-OS wording in the always-on lines. Commands per OS live in the skill's `references/footprint-by-os.md` (decision 7).

## Acceptance before implementation is called complete

1. Fixture repo with seeded families: over-cap ticket, cited and uncited folders, hard-linked file, open file, epoch-dated files. The inspector goes red on the seeded problems and green once clean; the slim keep list equals the seeded citations.
2. A fixture where a new citation appears between listing and removal produces a "keep list changed" result, not a deletion.
3. `node scripts/install-agents-md.mjs` dry run shows only the new lines in the managed block; `node scripts/check-guidance.mjs` passes; the block stays under the budget.
4. `writing-for-agents` review of the new section (pointer wording, one trigger per branch, positive phrasing).
5. `node scripts/check-repo.mjs` passes; indexes (`compass`, bucket README, roster) unchanged because no skill is added.
6. A seeded pytest project flagged by P4 and fixed by the one-line setting.

## Decisions

Settled with the user 2026-10-31.

1. **Owner: `repository-artifact-hygiene`**, no new skill. The global line and the skill description trigger on the kind of action (build, test run, simulator, download, clone, copy of tracked files); size is measured after the first attempt, never predicted, because an agent knows what it is about to run but not how much it will write. A separate skill would trigger no better: descriptions match task wording, not bytes. Revisit if the skill passes about 200 lines.
2. **Numbers: fixed and absolute.** 500 MiB measured per attempt, keep the latest 3 attempts, 20 GiB free-space floor, optional 5 GiB per-ticket cap; inspector flags override them per host. No scaling with disk size: the next action needs the same absolute headroom on any disk (one pytest run left 6.9 GiB). Under WSL the floor is checked on the lower of the distro's free space and its Windows drive's, because the distro reports the virtual disk's size. On Windows a file larger than the Recycle Bin's cap is listed for the user, never deleted, because the bin deletes it permanently.
3. **Always-on cost: three lines** in `global/AGENTS.md`, worded the same for every OS; the file stays under the 3,072 B budget.
4. **Hashing: `--dedupe` stays opt-in.**
5. **`orient` line now:** free space, and the three largest uncommitted footprints when free space is under 40 GiB.
6. **P4 scope: pytest retention only** (plus `.scratch` citations in tracked manifests); no other runner has evidence yet.
7. **OS-specific guidance (added 2026-10-31).** The skill gains `references/footprint-by-os.md`: free space, folder size, recoverable delete, open files, hard links, copy-on-write caveats and cache-prune commands for macOS, Linux, Windows and WSL, each command marked as observed or docs-only. The Windows part points at `docs/agents/windows-powershell-gotchas.md` instead of repeating it. The inspector probes per OS and reports a missing probe as partial coverage.

8. **Test-environment ladder (P7): in ticket 110.** A `docs/agents/test-environment-ladder.md`
   reference pointed at from `tdd`, `implement`, `implement-spec`, `game-native-design`,
   `init-project` and `conformance-audit`, built in ticket 110 with the footprint guardrails (user
   decision; a separate ticket was offered).

## Files to touch

`global/AGENTS.md`; `skills/meta/repository-artifact-hygiene/SKILL.md`, `references/footprint-by-os.md` and `scripts/inspect-footprint.mjs` with its test; `skills/meta/orient/SKILL.md`; the agent-guidance class in `skills/meta/conformance-audit`; `docs/agents/harnesses.md` (budget figure only); a ticket (draft in `ticket-draft.md`).

## Prior art and fact checks (2026-10-30)

Checked against primary sources where reachable; blog and package-doc items are marked.

**Confirmed**
- pytest `tmp_path_retention_policy` defaults to `all` and `tmp_path_retention_count` to 3 (read from `src/_pytest/tmpdir.py` on main). `failed` deletes a passing test's directory and the whole base directory when every test passed; `none` forces count 0. P2 rule 4 and P4 stand as written.
- uv `link-mode` defaults to `clone` on macOS and Linux, `hardlink` on Windows (docs.astral.sh settings reference). Sizes of uv environments are an upper bound on APFS; `uv cache prune` is the supported cleanup, not deleting cache files by hand.
- `GIT_LFS_SKIP_SMUDGE` and `lfs.storage` exist in git-lfs-config; `lfs.fetchinclude`/`fetchexclude` leave pointers unreplaced. P2 rule 2 stands.
- APFS: Finder "on disk" ignores clone savings (Eclectic Light, 2026-09-05). Keep the "upper bound" wording in the inspector.

**Settled 2026-10-31 on the Linux host** ([footprint commands by OS](../research/footprint-commands-by-os-20261031.md))
- Linked worktrees share the LFS store: `git lfs env` reports the same `LocalMediaDir=<main>/.git/lfs/objects` in the main checkout and a linked worktree (git-lfs 3.7.1). Each worktree still smudges its own full copy of every LFS file; `GIT_LFS_SKIP_SMUDGE=1 git worktree add` leaves pointers. P2 rule 2 now says so.
- Agent shells load the user's profile, where `df` and `du` can be aliases (`duf`, `dust` here); `du -sk` failed. Commands in guidance and the inspector call `command df -Pk` and `command du -sk`, or the binaries directly.
- `gio trash` refuses paths under `/tmp` (system internal mount) and works under `$HOME`; `trash-put` is not installed here. Recoverable delete on Linux is "where the trash supports it", and the per-OS reference says so.
- `cargo clean` removes the whole workspace target directory, and with a shared `CARGO_TARGET_DIR` every project's output; "per project" was wrong. `go clean -cache`, `uv cache prune` and `npm cache verify` behaved as described against temp caches.
- macOS ships `/usr/bin/trash` from macOS 15 only (secondary sources). Windows: the .NET `SendToRecycleBin` route with `OnlyErrorDialogs` sets "Yes to All", so a file over the bin's cap is likely deleted permanently without a prompt (inferred from source; not run on Windows). Decision 2's "list, never delete" rule covers it.

**Still docs-only or unverified:** `xcrun simctl delete unavailable` and the Xcode DerivedData location (secondary sources; need a Mac); the Windows Recycle Bin cap behaviour (no Microsoft page found).

**Prior art: `aibris` (Go CLI, package docs; unverified in use) and a Mac cleanup guide (mole.fit blog)**
- Same shape as ours: scan, group by project/category/age, ask, dry-run, ask again, execute. Our inspector plus `trash` is the same loop with the user as the gate.
- Worth borrowing: protect **active worktrees** and treat only orphaned ones as candidates; a **24-hour idle floor** for agent state (we used 15 minutes of quiet; consider 24 h for agent session stores such as Kiro history); logs removed only on an explicit flag; use each tool's own cleanup command (`go clean -cache`, `uv cache prune`) before deleting directories.
- Their measurements match ours: Rust `target/` 24 GB, `.next`, `node_modules/.cache`, `dist`. Our evidence has no JS or Rust case yet, so P4's "other runners" question (decision 6) has weak support; keep pytest-only until a second case appears.

**Changes to the recommendations**
1. P3 gains an **active worktree** check (skip a worktree whose branch is checked out or has uncommitted changes); tagalog-helper keeps worktrees under `.claude/worktrees/`, so this is a real path.
2. P3's quiet floor becomes a flag: 15 minutes by default, 24 hours for agent state stores.
3. P2 adds a seventh rule: prefer the tool's own prune command to hand deletion for caches (`uv cache prune`, `go clean -cache`, `cargo clean` for a workspace that does not share its target directory, `xcrun simctl delete unavailable`). The per-OS reference marks each as observed or docs-only.
4. Decision 6 recommendation: pytest only.
5. No hook-based or daemon approach found in prior art that beats rule-at-creation plus inspector; "Not proposed" stands.
