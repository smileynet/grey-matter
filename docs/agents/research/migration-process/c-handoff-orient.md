# Lens C: handoff and orient continuity

Sources: both handoff skills, read-handoff, orient, adopt-project + relocation script, proposal
04, harnesses.md, the `.gitignore`/`.scratch/` of 4 fresh repos, herdr help (read-only).

## Facts that shape the design

- The relocation script rewrites **tracked files only** (`git ls-files`). In three of the
  surveyed repos, `.scratch/` is ignored, so their handoff is not
  rewritten. bounty-board **tracks** `.scratch/HANDOFF.md` (`!.scratch/HANDOFF.md`), so writing
  one dirties the tree. It has to be committed before adoption, and the script will then rewrite
  it inside the adoption commit.
- Orient reads "the latest `.scratch/` handoff". There is no fixed filename, and these
  `.scratch/` dirs also hold logs, proposals, and venvs. Orient does **not** read a glossary.
  The only path to `GLOSSARY.md` is the reshaped AGENTS.md or the handoff itself.
- Crew read-handoff reads `.scratch/HANDOFF.md` plus `.memory/CONTEXT.md`, `docs/plan.md`, and
  `recall prime`. It waits for a "Proceed?" before acting. Orient is biased to action: it
  resumes the live `in_progress` thread or the top `tkt ready` ticket, and it treats the handoff
  as context, not as instructions.
- Both write to `.scratch/`. The crew format (`base_commit`, `in_flight_ticket`, Focus/
  In-Flight/Fog/Constraints/Pointers) is a superset orient can consume.
- orient is user-invoked (`disable-model-invocation`). codex filters user-invoked skills out of
  its model catalog, so a codex agent (bounty-board) must be told the skill explicitly.

## (1) Pausing agent: where and what

The orchestrator sends this message to the old agent. Do not send it while the agent is
`blocked`.

> Pause at a safe point. Run the `handoff` skill. Write it to `.scratch/HANDOFF.md`. Commit any
> WIP as `wip(<scope>): ...` (no stash: the next agent can't see a stash) so the tree is clean.
> Leave your tkt claim in place. Set `in_flight_ticket` to the claimed id. Promote durable
> findings now (glossary terms, ADRs) and commit them. Cite repo paths in full from the repo
> root (e.g. `.memory/adr/0003-x.md`), not as bare names. Do not run `recall add`. Then stop and
> report the handoff path and HEAD.

Required content: the crew sections, plus a one-line **Next step** and a **Do-not-redo** list
of dead ends. Full root-relative paths are what make the mechanical rewrite in (2) work.
Promoting into `.memory/` is fine, because relocation carries those files. In bounty-board the
committed HANDOFF.md gets rewritten by the adoption itself.

Gate before adoption: `git status --porcelain` is empty, and `tkt query --status in_progress`
matches `in_flight_ticket`.

## (2) The modification step (after the adoption commit, before the launch)

1. Preserve the original: `cp .scratch/HANDOFF.md .scratch/handoff-pre-adoption-<date>.md`.
2. Rewrite paths with the **same map the adoption ran with**, using the script's exported
   function so links and mentions resolve exactly as they do in the repo:
   `node -e "import('<gm>/skills/meta/adopt-project/scripts/relocate-knowledge.mjs').then(m=>{const fs=require('fs');const f='.scratch/HANDOFF.md';fs.writeFileSync(f,m.rewriteRooted(fs.readFileSync(f,'utf8'),m.DEFAULT_MAP))})"`.
   Pass any `--map` extras as pairs. Then grep for `.memory/`. A leftover must be zero, or it
   falls under convention wording you fix by hand.
3. Prepend an **Adoption preamble**:
   - `Adopted to grey-matter at <sha> (<date>); handoff written at <old base_commit>.`
   - New homes: `GLOSSARY.md` (was `.memory/CONTEXT.md`), `docs/adr/`, `docs/agents/specs|research/`,
     and the audit reports at `docs/agents/research/adoption-<date>/`.
   - Migration-finding tickets: the ids/titles, tagged `migration-finding`, backlog and
     unconfirmed. Say "not your next step unless the board says so", so the agent doesn't divert.
   - Renamed skills: read-handoff->orient, project-cleanup->wrap-session,
     plan-ticket-sync->reconcile-tickets, cheatsheet->cheat-sheet, release-protocol->release,
     feedback-loop-debugging->diagnosing-bugs, testing-guide->tdd,
     architecture-deepening->improve-codebase-architecture, guidance-sync->retro,
     research-methodology->research, plan-prereqs->wayfinder. Retired: recall,
     `tkt sync-plan`/`docs/plan.md` (grey-matter is plan-less).
4. Rewrite any skill names in the body by the same table. Bump `base_commit` to the adoption
   sha, so the git log is only the adoption plus whatever follows it.
5. Check that `.scratch/HANDOFF.md` is the newest file in `.scratch/` (`ls -t | head -1`), so
   orient's "latest" picks it. In bounty-board, commit the modified file. In the others it stays
   untracked.

## (3) Fresh agent: first prompt and verification

Precondition: the grey-matter skills are installed (ticket 52, or at minimum `orient` and
`handoff` in the harness root). Otherwise the crew steering still advertises `read-handoff`.
Launch with `herdr agent start <name> --kind <kiro|codex> --pane <new pane we create>`, then
`herdr agent prompt <target> "<text>" --wait --until idle --until blocked`. Don't reuse the
focused pane w2N:p1. Create a new one.

Prompt:

> Run the `orient` skill (its SKILL.md is in your skills root: `~/.kiro/skills/orient/` or
> `~/.codex/skills/orient/`). The pickup handoff is `.scratch/HANDOFF.md`; read its Adoption
> preamble first. This repo was just adopted to grey-matter: the glossary is `GLOSSARY.md`,
> decisions are in `docs/adr/`. Before starting work, state in one line each: the glossary file,
> the ADR dir, and your pick (ticket + skill). Then proceed as orient says.

The skill-path hint covers the codex catalog filter. The extra one-liner gives the orchestrator
a checkable signal, because orient's normal output is two lines and never mentions the glossary.

Verify with `herdr pane read <pane>`:
- The pick equals the `in_progress` ticket (if its commits advance) or the first `tkt ready`
  row. Check this against the board, not against the handoff prose. A migration-finding ticket
  chosen as the pick is wrong unless it really is top of the frontier.
- It names `GLOSSARY.md` and `docs/adr/`.
- It contains no matches for
  `read-handoff|project-cleanup|\.memory/|recall|sync-plan|docs/plan\.md|plan-ticket-sync|cheatsheet`.
- It did not stop to ask "Proceed?" on a clean board (that is a crew-style regression), unless
  it flagged a stale claim, which is correct orient behavior.

One failed check gets one corrective prompt naming it; a second failure goes to the human.

## Risks

- init-project could drop bounty-board's `!.scratch/HANDOFF.md`; check the adoption diff.
- Releasing the old identity's stale claim is the human's call. Kiro `/orient` support is
  unverified; the prompt doesn't depend on it.
