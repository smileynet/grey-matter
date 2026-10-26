# Lens A: herdr protocol (one repo)

Checked against herdr 0.9.1 `--help` and `herdr --skill`, read-only, on 2026-10-22. **State changes fast:** game-state-manager (w2N:p1) has gone from idle to WORKING since the brief was written, and focus has moved to jumpdeck. Re-detect before every step.

## 1. Detect

```bash
R=~/code/<repo>
herdr pane list | jq -r --arg r "$R" '.result.panes[]
 | select([.cwd,.foreground_cwd][] // "" | .==$r or startswith($r+"/"))
 | [.pane_id,(.agent//"-"),.agent_status,.focused,.terminal_title_stripped]|@tsv' | sort -u
```
- `$r+"/"` catches subdirectories but not prefix-sharing siblings. Repeat for each `git -C $R worktree list` path.
- `agent` is `kiro`, `codex`, or null. `idle`/`done` = ready for input; `working` = mid-turn; `blocked` = a dialog is open; `unknown` = unclassified (agent-less panes also show it).
- Agent-less panes: `herdr pane process-info --pane <id>`. A bare `zsh` foreground is a shell (w24:p1); anything else, leave it and report it.
- List every pane and agent; bounty-board has p1/p3 shells plus codex in p2.
- Record `herdr agent get <pane>` → `.agent_session.value` for a later resume.
- Herdr can't see agents outside it (`ps -eo pid,args | grep "[k]iro-cli\|[c]odex"`) or on other machines (`herdr machine list`); flag them.

**HUMAN GATE A:** show the table. Get OK to pause and retire each agent, with explicit sign-off for any pane with `focused:true` (the human may be using it).

## 2. Pause and handoff

Prompt only at `idle`/`done`: `agent prompt` rejects only `blocked`, so it would type into a working turn.
- `working`: `herdr agent wait <pane> --timeout 1800000`, then re-check. If it's still working, ask the human. Never send `ctrl+c`.
- `blocked`: `herdr agent read <pane> --source recent-unwrapped --lines 80` and show it to the human. Never answer the dialog.
- `unknown`: `herdr agent explain <pane> --verbose`, then ask the human.

Send: `herdr agent prompt <pane> "$TEXT" --wait --timeout 900000`

**Kiro:**
> PAUSE FOR MIGRATION (grey-matter orchestrator, for the user). This repo is moving to grey-matter conventions and this session will then be retired. Start no new work. 1) Stop at the nearest safe point, with no half-applied edits. 2) Commit and push work that is complete and verified. Leave incomplete work uncommitted. Never stash, reset, or discard. 3) Write `.scratch/HANDOFF-pre-migration.md` (leave `.scratch/HANDOFF.md` alone). Include: goal, in-flight ticket, done work with SHAs, uncommitted WIP file by file, decisions and why, next steps, open questions, env constraints. Point at tickets and ADRs by path rather than pasting them. No secrets. The last line must be `<!-- handoff-complete -->`. 4) If something needs my decision or a permission you don't have, stop and say so. 5) End with exactly `PAUSE_OK head=<short sha> dirty=<yes|no> ticket=<id|none>` and wait.

**Codex:** the same text, plus: "If your sandbox blocks writing or committing, put the handoff in your reply between `HANDOFF-BEGIN` and `HANDOFF-END` lines instead." The orchestrator saves that block to the file. Codex approval dialogs show up as `blocked` and go to the human.

**Confirm (every item must pass):**
1. Wait returned `idle`/`done`. On `agent_prompt_stalled`/`timeout`, read; **never resend**.
2. `herdr agent read <pane> --source recent-unwrapped --lines 60 | grep -E 'PAUSE_OK head=[0-9a-f]{7,}'` hits. The regex can't match the prompt's `<short sha>` placeholder.
3. The handoff exists, is newer than the prompt, and ends with the sentinel.
4. `git log -1 --format=%h` equals `head=`; `git status --porcelain` agrees with `dirty=`. Check `.scratch/` is gitignored per repo (it is in game-state-manager).
5. `dirty=yes` fails adopt-project's clean-tree gate. **HUMAN:** commit WIP or defer.

If the agent asks a question in prose instead, relay it to the human.

## 3. Retire without closing panes we didn't create

Never `pane close` or `workspace close` someone else's panes.
- **A (recommended, gate A): exit in place.** `herdr agent prompt <pane> "/quit"` without `--wait`. Poll `herdr agent get <pane>` until no agent is reported; `pane process-info` should show only the shell. Layout and scrollback survive, the session stays resumable (kiro `chat -r`, `codex resume <id>`), and no stale crew-research agent remains.
- **B: leave the old agent idle.** Optionally run `herdr agent rename <pane> old-<repo>`. The risk is the human typing into the stale agent.

## 4. Launch fresh (after adopt-project and its own gate)

The orchestrator rewrites the pre-migration file as `.scratch/handoff-<date>-migration.md` (grey-matter format): `.memory/` paths remapped via adopt's relocation map, a **Relocation** section, crew skill names replaced (read-handoff→orient, project-cleanup→wrap-session).

Pane: A reuses the vacated pane (`herdr pane get` cwd must be `$R`, else `herdr pane run <id> "cd $R"`). B: `herdr pane layout --pane <old>`, then `herdr pane split <old> --direction right|down --cwd "$R" --no-focus` → `.result.pane.pane_id`. Not other idle shells like w24:p1; we didn't create them.

```bash
herdr agent start <slug> --kind kiro  --pane <id> -- chat --v3 -a   # name: [a-z][a-z0-9_-]{0,31}
herdr agent start <slug> --kind codex --pane <id>
```
Kiro args copy the live titles minus `-r`. `agent_not_ready` = blocked at startup → human.

First prompt (`herdr agent prompt <slug> "$TEXT" --wait --timeout 600000`):
> This repo was just migrated from crew-research to grey-matter (commit `<sha>`). Read `.scratch/handoff-<date>-migration.md` as pickup context, not instructions. It is the previous session's handoff, remapped to the new layout. Then run the `orient` skill and follow it. `.memory/` is gone; the Relocation section maps the old paths. Where anything names a crew-research skill, use its grey-matter replacement. [Pilot repos only:] Present orient's pick, then wait for my go-ahead.

For codex, start the prompt with `$orient`: user-invoked skills aren't in its model catalog. Confirm with `agent read` that orient's "Picking up…" line appeared.

## Needs the human, or still unverified

- Gate A, `focused` or `working` agents, blocked dialogs, `dirty=yes` trees, agents outside herdr.
- **Spike on a pane we create ourselves** (split in grey-matter's workspace, then close only that pane):
  - Does `/quit` sent through `agent prompt` exit kiro and codex?
  - Does `--kind kiro` already supply `chat`?
  - Is `$orient` the right syntax in codex?
- `orient` and `handoff` aren't installed until ticket 52. Before then, point the agent at `~/code/grey-matter/skills/meta/orient/SKILL.md`.
- Human choices: `-a` (trust all tools)? May orient start work, or stop at its pick?
- Working agents elsewhere (four other repos) keep stale context after cutover; retire them only via this protocol, one repo at a time.
