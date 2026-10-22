# Proposal 05: adopt-project revisions from the first pilot

**Ticket:** 51 (pilot), 53 (applied). **Status:** accepted and applied 2026-10-22: R1–R9 are in
`skills/meta/adopt-project/` (body + `references/relocation.md`, `references/repo-hygiene.md`,
`scripts/relocate-knowledge.mjs`) and `skills/meta/conformance-audit/`. **Pilot:** decksmith, 2026-10-22, decksmith
commits `519cb08` (adoption), `daf070e` (evidence), and `8668829` plus the next commit (board).

The pilot ran adopt-project end to end on a mature repo whose incumbent layer was crew-research
shaped: committed `.memory/`, a 10 KB AGENTS.md, and its own skills and steering, with tkt
already in place. Each revision below is stated as the **general rule**. The decksmith case
appears only as the evidence for it. The bar for inclusion: would this have gone wrong on a
different repo too?

## R1. The polarity gate classifies agent artifacts by role, not by presence

**Finding.** Step 1 counts "existing skills" as incumbent agent layer, which makes them a target
for subsume-and-replace. In the pilot, the skills and steering were the repo's **product**: a task
copies them into user projects. Restructuring them to grey-matter's layout (buckets, compass,
sidecars) would have broken the product's installer.

**Revision (Step 1, Polarity).** Classify each agent artifact before setting polarity:
- **Agent layer.** Instructions for agents working *on this repo* (AGENTS.md, CLAUDE.md, a
  tracker, `.kiro/`, committed agent notes). Subsumed.
- **Shipped artifacts.** Skills, steering, or prompt packs the repo distributes. Signals: an
  install or copy task, packaging metadata, or docs telling users to install them. Audited
  against the **open standard** (agentskills frontmatter, links that resolve where installed),
  never restructured into grey-matter's distribution layout.
When unsure, ask at the gate.

## R2. Relocating committed knowledge is a first-class step, with tooling

**Finding.** The largest single change was moving a dot-prefixed committed knowledge dir to
grey-matter paths: 707 references, links whose depth changed, links between moved files, code
docstrings, and closed tickets. adopt-project has no step for it. Its only hint is "decisions →
ADRs". A naive prefix rewrite would have broken relative links and falsified recorded evidence.

**Revision (new sub-step in Step 3, subsume-semantics).** When a committed knowledge dir has a
dot prefix (it breaks the dot-prefix rule), relocate it:
1. Map old to new paths. The default map for the common incumbent layout: glossary →
   `GLOSSARY.md`; `adr/` → `docs/adr/`; specs, research, and proposals → `docs/agents/<topic>/`.
   Anything else goes to `docs/agents/` by judgment, shown at the gate.
2. **Rewrite links by location, not by string.** Resolve each relative link against the file's
   old location, map it, and re-relativize it from the file's new location. Rewrite repo-rooted
   mentions by prefix.
3. **Never rewrite recorded evidence** (captured JSON, logs, transcripts). It is a record of what
   was observed. Leftover mentions are listed for the human to review, not rewritten blindly.
4. Verify with a **before/after baseline**: the link check and the test suite both pass before,
   and the same checks pass after.

**Tooling.** The pilot's scripts became `skills/meta/adopt-project/scripts/relocate-knowledge.mjs`
(it lives in the skill folder so it installs with the skill), with fixtures in
`scripts/relocate-knowledge.test.mjs` wired into `check-repo.mjs`. Rerun on decksmith's
pre-adoption commit, it reproduces the pilot's result byte for byte (139/139 files). The fixtures must include a depth change, a
link between two moved files, an evidence file left untouched, and a link inside a code span
that must be skipped. 67 repos under `~/code` share this layout, so this script is what makes
batch adoption tractable.

## R3. Migrated glossary terms get a verdict; only inferred terms are staged

**Finding.** Stage-then-write is written for *inferred* terms. Incumbent terms were written by a
human and migrate as-is, but the code cross-check still found stale and contradicted ones.

**Revision (Step 2).** Migrated terms carry a code cross-check verdict (confirmed / stale /
contradicted, with file:line) to the gate. Inferred terms are staged as now. A characterized
contradiction becomes a **board ticket** (Step 4), not a glossary edit.

## R4. AGENTS.md is reshaped by its purpose, losslessly

**Finding.** The incumbent AGENTS.md mixed two audiences: developers of the repo, and consumers
of its shipped guidance, which never sees AGENTS.md. It also copied the environment (a task
table that had drifted, a skills list restating descriptions). conformance-audit flags this as
needs-judgment but offers no method.

**Revision (Step 3, both polarities).** Decide AGENTS.md's audience first (who actually loads
it). Then reshape it to its job: standing rules, non-derivable gotchas, and navigation pointers.
- Delete content the environment already answers (`mise tasks`, `ls skills/`, `--help`) and
  content that has a canonical home elsewhere.
- **Lossless rule:** before deleting a line, confirm its canonical home holds it. If no home
  holds it, keep it or move it to one.
- Show the before/after size at the gate. Pilot: 10.2 KB went to 5.5 KB, including the tkt block.

## R5. Repo hygiene belongs in survey and plumbing

**Finding.** Three gaps a newcomer would trip on, none of them covered by the skill: binary
assets with no LFS configuration, a customer-named working artifact tracked in a repo meant for
cloning, and a rehydration index without clone commands.

**Revision (Step 1 detects, Step 5 wires, Step 6 gates):**
- **Git LFS.**
  - Detect tracked binaries (by extension and size).
  - If any exist, or the repo is asset-heavy, add `.gitattributes` LFS rules for binary types.
    Keep diffable source (SVG, JSON, YAML) as plain text.
  - Run `git lfs install --local`. Without its pre-push hook, pointers push with no objects.
  - Renormalize the **current tree only**. Rewriting history needs an explicit ask.
  - Verify with a fresh clone and an AGENTS.md gotcha.
- **Sensitive or out-of-place tracked content.** Customer or person-named artifacts, personal
  material, large generated outputs: surface them at the gate. Untracking is in scope. Purging
  history is a separate HITL decision, because it needs a force-push.
- **Rehydration index completeness.**
  - Every `.references/` entry needs a clone command.
  - Mark non-git local material as non-rehydratable.
  - Gotcha: `git -C <dir> remote get-url` walks up to the *parent* repo when `<dir>` has no
    `.git`, so a local folder looks like a clone of the repo itself. Test for `<dir>/.git`.

## R6. Seeding from findings when the tracker is already healthy

**Finding.** With tkt already in place, Step 4 has no backlog to migrate. The real backlog is the
Step 2 contradictions and the Step 3 judgment findings (40 items in the pilot).

**Revision (Step 4).**
- Migrating an existing backlog stays the core job. Audit findings are filed **as migration
  findings**, not as ready work: they come from an outside audit and may misread the design.
  - Title prefix `Review migration finding:` and tag `migration-finding`.
  - A banner: who filed it, `Confirmation status: unconfirmed`, and "reproduce each point,
    then confirm, reject, or re-scope it before changing code; never act on the diagnosis or
    the remedy on authority."
  - The first acceptance criterion is that review step. Rejecting every point is a valid close.
  - Suggested remedies are labeled as suggestions; the owner decides the fix.
  - One line in the target's AGENTS.md says what the tag means, so the project's own agent
    knows to review first.
- Group findings **one ticket per decision**, not one per finding (40 items became 10).
- Default to backlog.
- Commit the audit reports into the repo (`docs/agents/research/adoption-<date>/`) so tickets
  cite durable evidence, not `.scratch/`.
- If the repo keeps a plan table that tkt reconciles, add rows so `sync-plan` stays green.

## R7. Commit shape matches what tkt does

"Land the whole adoption as one commit" conflicts with `tkt new`/`batch`, which commit and push
on their own. Revise to: **one reviewable adoption commit** (all reconcile and plumbing), then
the evidence commit, then the board-seeding tkt commits. All of them are reverted together.

## R8. Harness-portable survey wording

Step 1 names a tree-sitter `code` tool that most harnesses lack. Revise to: "use a symbol-map
tool if the harness has one; otherwise `git ls-files` plus targeted grep, and state what wasn't
examined."

## R9. conformance-audit: skip grey-matter-internal rules on foreign repos

Bucket READMEs, `compass`, and `agents/openai.yaml` sidecars are grey-matter's own distribution
rules. On a foreign repo they produce needs-judgment noise. Report them as **N/A** unless the repo
distributes skills *through grey-matter*. Its link check must also skip fenced and inline code,
because the pilot found 10 false positives in Marp syntax examples.

## Not proposed (pilot-specific)

The deck-specific findings (locator exit codes, product path topology, steering fileMatch) are
filed in decksmith as tickets 73–82. They are not adopt-project rules.

## Side finding (tkt)

`tkt init --dry-run` created `.tickets/.gitignore`, so its dry-run has a write side effect.
Report it upstream to tkt.
