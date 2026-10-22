# Migration process: sequencing and safety (lens B)

## Evidence

- [L4] kiro.dev/docs/skills.md: names and descriptions load at startup, bodies load on activation, and references load only when the instructions point to them. Skills are "discovered … when you start a new chat session". Workspace skills beat global ones.
- [L1] Steering is injected into context at session start (research/kiro-steering-empirical.md). Whether compaction re-reads it from disk is unverified.
- [L1] `install-skills.mjs` refuses any foreign dest unless `--force` is given, and leaves refusals out of its manifest. Its roots are `~/.kiro`, `~/.codex`, `~/.claude` and `~/.agents` skills. The 5 collisions sit in `~/.kiro/skills` and `~/.agents/skills` only.
- [L1] `herdr agent start` needs the pane at a shell prompt. `agent prompt` rejects blocked agents.

**What a running session loses at cutover (inferred).** Its steering stays in context, but its skill catalog is a stale snapshot:
- Invoking a deleted crew skill fails, and a skill in use loses its references and scripts.
- Newly installed skills stay invisible until restart.
- Codex is likely the same. It is unprobed.

So sessions don't crash. They degrade on their next crew-skill call, usually `handoff` or `read-handoff`.

## (1) Order: split the cutover

**Phase A, additive (now)**
1. Snapshot.
2. Run `install-skills.mjs` without `--force`. Expect 5 refusals per crew root, and check the manifest. orient, compass and the rest land. Live sessions are untouched.
3. Install the global AGENTS.md wherever it is not foreign. It will refuse `~/.codex/AGENTS.md`.
4. The orchestrator runs adopt-project and relocate from the **grey-matter repo paths**, which avoids the collisions.

Known gap in Phase A: fresh agents still resolve `handoff` and `grill-with-docs` to the crew versions, and crew grill writes `.memory/CONTEXT.md`. Add a line to each adopted AGENTS.md: "glossary is GLOSSARY.md; never create .memory/".

**Repo 1: multimodal-enablement (no agent).** It proves the loop with no live-agent risk.

**Phase B, destructive (after repo 1)**
- Precondition: `herdr agent list` shows no `working` agent.
- Let the 4 working agents finish, unprompted, because they are outside the migration scope. Use `agent wait --until idle --until done --timeout`, then re-check.
- Then run the uninstall dry-run, `--apply`, the re-install (the collisions now land), and freeze crew init.
- Tell the human that idle panes elsewhere hold stale catalogs and should be restarted when convenient.
- If the working agents don't settle, continue in the Phase A state. Don't force Phase B.

**Repos 2–8** follow in rank order.

## (2) Per-repo loop

**Preconditions**
- `git status --porcelain` is empty.
- After `git fetch`, the branch is not behind or diverged.
- The workspace has no agent, or its agent is `idle`/`done`.
- The baseline (build/test, link check, `tkt validate --brief`) is recorded. A failing baseline is recorded as-is.

**Pause**
1. Unfocused agent: prompt "stop before new work; commit+push finished work; run handoff; reply with the path", then wait with a timeout.
2. Focused pane: ask the human first.
3. Re-check that the tree is clean.

**Migrate.** adopt-project Steps 1–6 with its gate. Push the adoption, evidence and tkt commits.

**Modified handoff**
- Copy `.scratch/HANDOFF.md` to `.scratch/handoff-<date>-post-adoption.md`, keeping the original.
- Rewrite `.memory/` paths to GLOSSARY.md and `docs/adr/`.
- Prepend "adopted at <sha>; `migration-finding` tickets are unconfirmed; run orient".

**Launch**
- Reuse a pane only if its agent has exited to a shell. Otherwise use `pane split --current --no-focus`.
- Then `agent start --kind kiro|codex`.
- Invoke orient explicitly (`/orient`, or by name in codex). It is not model-invocable.
- Never close the old pane.

**Stop conditions** (park the repo and move on; never stash, never answer dialogs):
- dirty or diverged tree
- agent `working`, `blocked` or `unknown`
- handoff timeout
- human declines
- gate rejected
- test or link regression against the baseline
- a push that doesn't rebase cleanly
- orient fails

**Done**
- Commits pushed.
- Baseline identical.
- `git ls-files .memory` is empty.
- survey-repos shows no dead-skill references.
- `tkt ready` is non-empty.
- `herdr agent read` shows orient naming a real pick.

**Rollback**
- Revert the commit range and push. No force-push.
- Restore the original handoff.
- Relaunch with crew `read-handoff` (before Phase B) or orient plus the `.memory/` shim (after it).
- This is independent of machine rollback, which is the snapshot restore.

## (3) Risks

- **Focused pane (game-state-manager).** Assume the human is in it. Get consent before prompting, launch into a new unfocused pane, and leave the old pane to the human.
- **Codex vs kiro**
  - In Phase A, grey-matter `handoff` lands in `~/.codex/skills` while crew `handoff` stays in `~/.agents/skills`. If codex scans both, it has a duplicate name with **unverified** precedence.
  - Probe that before repo 4, or limit Phase A to `--root ~/.kiro/skills`.
  - `~/.codex/AGENTS.md` stays crew's until Phase B.
- **bounty-board**
  - Its `.kiro/skills` holds crew copies (handoff, read-handoff, grill-with-docs). Workspace priority means they shadow grey-matter **even after Phase B**, so remove them in the adoption commit.
  - Classify its other skills (ops-scripts, cdk-deploy, …) and `cdk-pipeline.md` steering by role (R1), and don't delete them.
  - Its codex agent ignores `.kiro/skills`.
- **Gate fatigue**
  - That's 8 gates plus pause consents.
  - Use a fixed gate template (relocation map, AGENTS.md size before and after, glossary verdicts, findings count).
  - Do 2–3 repos per sitting and never merge gates.
  - After 3 approvals with no edits, ask whether to slow down.
- **Concurrent pushes.** tkt auto-pushes interleave. Rebase and retry.
