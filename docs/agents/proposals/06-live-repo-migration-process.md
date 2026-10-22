# Proposal 06: migrating live repos one at a time (herdr-coordinated)

**Status:** proposal for review (2026-10-22). **Scope:** the 8 "adopt now" repos from the
portfolio survey, in rank order. Evidence: three independent reviews in
[research/migration-process/](../research/migration-process/) (herdr protocol, sequencing and
safety, handoff and orient continuity).

## Order: split the cutover

The machine cutover (ticket 52) is split into an additive phase and a destructive phase. That way
the first migrations don't pull skills out from under agents that are working right now.

- **Phase A (before repo 1, additive).**
  - Snapshot, then run `install-skills.mjs --root ~/.kiro/skills` without `--force`. Expect 5
    refusals where names collide with crew skills. orient and the other grey-matter skills land.
  - Install the global AGENTS.md where it isn't foreign.
  - No live session changes. Kiro loads its skill catalog when a session starts, and steering
    already in context stays.
- **Repo 1: multimodal-enablement.** It has no live agent, so it proves the loop with no pause risk.
- **Phase B (destructive), only when `herdr agent list` shows no `working` agent.**
  - Uninstall crew-research by manifest, re-install grey-matter (the colliding names land now),
    install the codex rules file, and freeze crew init.
  - If working agents never settle, keep going in the Phase A state; never force Phase B.
  - Afterwards, tell the human which idle panes hold stale catalogs and should be restarted.
- **Repos 2–8** in rank order. Before the first codex repo (bounty-board), probe which `handoff`
  codex resolves when two installs share a name.

Gap while in Phase A: fresh agents still resolve `handoff` and `grill-with-docs` to crew's
versions, and crew grill writes `.memory/CONTEXT.md`. Adoption adds this line to each adopted
AGENTS.md: "The glossary is `GLOSSARY.md`; never create `.memory/`."

## The per-repo loop

1. **Detect.**
   - List panes whose `cwd` or `foreground_cwd` is the repo or a subdirectory, including its
     worktrees: agent kind, state, focus. Record each agent's session id so it can be resumed.
   - Re-detect before every step, because states change in minutes.
   - **Human gate A:** show the table and get the go-ahead to pause and retire each agent. A
     `focused` pane gets explicit consent, since the human may be in it.
2. **Preconditions.** Clean tree; after `git fetch`, not behind or diverged; agent `idle`/`done`
   or absent; baseline recorded (build/test, link check, `tkt validate`).
3. **Pause.** Prompt only an `idle`/`done` agent. `agent prompt` refuses only `blocked`, so it
   would type into a working turn.
   - `working`: `agent wait --timeout`, then re-check. Never send ctrl-c.
   - `blocked` / `unknown`: read the dialog or state and show it to the human. Never answer it.
   - The pause prompt asks for: stop at a safe point; commit and push finished work; commit
     unfinished work as `wip(<scope>): ...` (never stash, reset, or discard); write
     `.scratch/HANDOFF.md` with root-relative paths and a `<!-- handoff-complete -->` last line;
     keep the tkt claim; then reply `PAUSE_OK head=<sha> dirty=<yes|no> ticket=<id|none>`.
   - The codex variant may return the handoff between `HANDOFF-BEGIN`/`HANDOFF-END` lines if its
     sandbox blocks writes.
   - **Confirm:** the reply matches the regex, the file exists with the sentinel, `head` matches
     git, and the tree is clean. On a stall, read the output; never resend.
4. **Migrate.** adopt-project Steps 1–6 with its gate. Use a fixed gate template: relocation map,
   AGENTS.md size before and after, glossary verdicts, finding count. Push the adoption, evidence,
   and tkt commits. Remove crew-skill copies a repo keeps in its own `.kiro/skills/` (workspace
   skills shadow global ones); classify the repo's other skills by role.
5. **Modify the handoff.**
   - Copy the original to `.scratch/handoff-pre-adoption-<date>.md`.
   - Rewrite `.scratch/HANDOFF.md` paths with `rewriteRooted` and the same map the adoption used.
     `.scratch/` is untracked, so the adoption itself didn't touch it.
   - Prepend an adoption preamble: the adoption sha; the new homes (`GLOSSARY.md`, `docs/adr/`,
     the audit reports); the migration-finding ticket ids, "not your next step unless the board
     says so"; and the table of renamed skills.
   - Bump `base_commit`, and make sure `HANDOFF.md` is the newest file in `.scratch/` so orient
     picks it.
6. **Retire the old agent.** Exit it in place (`/quit`) so the layout survives and the session
   stays resumable. If that fails, leave it idle and rename it `old-<repo>`. Never close a pane
   we didn't create.
7. **Launch fresh.**
   - Use the vacated pane, or `pane split --no-focus` beside it. Then
     `agent start <repo> --kind kiro|codex`.
   - First prompt: run `orient` (codex: by name with its SKILL.md path, since user-invoked skills
     are hidden from its catalog); read `.scratch/HANDOFF.md` as context, not instructions; state
     one line each for the glossary file, the ADR dir, and the pick (ticket and skill).
   - For the first repos, stop at the pick and wait for go-ahead.
8. **Verify.**
   - The pick equals the `in_progress` or top `tkt ready` ticket on the board.
   - The agent names `GLOSSARY.md` and `docs/adr/`.
   - No retired names appear: `read-handoff|project-cleanup|recall|sync-plan|\.memory/`.
   - It doesn't ask "Proceed?" on a clean board.
   - One failed check gets one corrective prompt; a second failure goes to the human.

**Stop conditions** park the repo and move to the next one:
- the tree is dirty or diverged
- an agent is `working`, `blocked`, or `unknown` past its timeout
- the human declines, or rejects the gate
- tests or links regress against the baseline
- a push won't rebase cleanly
- orient fails twice

**Done** means:
- all commits are pushed and the baseline is unchanged
- `git ls-files .memory` is empty and the survey shows no stale skill refs
- `tkt ready` is non-empty, and the new agent's orient names a real pick

**Rollback** for one repo: revert its commit range and push (no force-push), restore the original
handoff, and relaunch.

## Pre-flight spike (on a pane we create, closed afterwards)

Confirm three unverified mechanics before repo 2:
- `/quit` sent through `agent prompt` exits kiro and codex.
- Whether `--kind kiro` already supplies `chat`.
- How codex invokes a user-invoked skill.

## Human decisions

1. Approve this process (and the Phase A/B split).
2. New agents run with `-a` (trust all tools), matching the current panes?
3. The `wip(...)` commit rule for unfinished work, instead of leaving the tree dirty (which would
   park the repo).
4. Pacing: 2–3 repos per sitting, and a check-in after 3 gates are approved without edits.

## Run log

**Phase A (2026-10-22):** snapshot `~/.local/share/grey-matter/phaseA-snapshot-20261022T145130Z.tar.gz`;
38 grey-matter skills installed into `~/.kiro/skills` (5 refused as crew collisions); global
AGENTS.md installed for kiro and Claude.

**Repo 1, multimodal-enablement (no live agent):** adopted in `9b67fff` (plus evidence and 7
migration-finding tickets 025-031). Baseline held: 0 broken links, both self-tests pass,
`slides:audience` / `slides:verify` findings identical to pre-adoption HEAD. New workspace `w2V`;
fresh kiro agent oriented to 021 (top of `tkt ready`), checked, given the go-ahead.

Spike results from the launch:
- `herdr agent start <name> --kind kiro --pane <id> -- chat --v3 -a` is correct; `chat` is not doubled.
- The first prompt sent right after `agent start` reported ready was not delivered (empty input
  box, no turn). Always confirm delivery by reading the pane; resend only when the input box is
  empty and no turn ran. `--until idle --until done --until blocked` returned cleanly.
