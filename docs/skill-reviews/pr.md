# pr

- Bucket: engineering. Invocation: model-invoked.
- Verdict: **adapt** (agent-author guards; add repo-PR-history research; keep the credit).

## What it is

A template + a catalog of visual forms for the PR body: **Summary** (smallest visual
that makes the point: pseudocode / call tree / component tree / file tree / Mermaid /
diff / code block), **Evidence** (before/after; screenshots, test output), **Merge
Danger** (one-way/two-way door + blast radius). Credited to Dex Horthy / HumanLayer's
`show-me` skill (CREDITS.md + frontmatter `metadata.credits`).

## What it does for the user

Produces a PR a human can review fast and trust. The agent is the author; a human
reviews.

## Prior art (agent-filtered)

Research against Google/GitHub PR guidance, PR-latency and PR-acceptance studies, and
agent-PR studies. The structure is well-grounded; the adaptations all come from the
agent-author filter:

- **Execution-grounded evidence is the standout.** A 23k-agent-PR study found the #1
  failure (45%) is "descriptions claim unimplemented changes," and high-inconsistency
  PRs had 51% lower acceptance and 3.5x slower merges. "Show the exact test that fails
  then passes" counters this, but only if evidence is captured, not composed.
- **Brevity** is empirically tied to faster first review response; but brevity must not
  drop the why (Google warns against context-free short descriptions).
- **Merge Danger** (reversibility + blast radius) is legitimate risk communication and
  more valuable for agent PRs because reviewers under-scrutinise agent code.
- **"Pick the smallest visual" is a human judgement call the agent does worst**: it
  mis-selects change type and can emit confidently-wrong diagrams. Needs a guard.
- **Screenshots "S-tier" is a human-author habit** an agent often can't execute (no
  running UI); reframe as conditional.
- **Matching repo PR conventions improves fit/acceptance** (PR-acceptance research);
  non-conformance is a common rejection reason.

## Decision

**Adapt.** Changes, all agent-author guards or repoints, structure otherwise kept:

1. **Evidence captured from a real run, never composed** (anti-fabrication; counters
   the #1 documented agent-PR failure). Inline in the core (a gotcha, per the Agent
   Skills standard: keep gotchas where the agent reads them before the situation).
2. **Prefer one grounded visual; never emit a diagram not derivable from the diff.**
   Sharpened the existing "don't overwhelm" guard.
3. **Screenshots conditional** on being capturable; for a game, a clip or deterministic
   replay is the behavioural-proof equivalent; else execution evidence is the ceiling.
4. **Merge Danger surfaces candidate risks for the human**, not a final verdict.
5. **Brevity = signal density, keep the why.**
6. **Repo-PR-history research** added as a disclosed reference,
   `references/repo-pr-conventions.md` (the four signals, `gh` recipe, sampling,
   guardrails, solo-repo fallback), loaded when the repo has PR history. Conditional +
   bulky, so it lives in `references/` per the standard, not the core.

Preserved: the visual catalog verbatim, the two-section structure, and the **Dex
Horthy / HumanLayer credit** (CREDITS.md + frontmatter).

## Cross-skill dependencies

Reads `GLOSSARY.md`. Pairs with `code-review` (both reason about a diff). No tracker
coupling. For a game, "evidence" aligns with `game-native-design` (replay as proof).

## Web-app bias

Light. Visual catalog and evidence tiers are domain-neutral; the one game touch (clip/
replay as behavioural proof) is a half-line, not a rubric split.

## Structural note (from the Agent Skills standard)

Used the standard's `references/` subdirectory for the disclosed file (not a bare
sibling), with a trigger-tagged pointer ("when the repo has existing PRs, read ..."),
and kept the evidence/merge-danger gotchas inline. This is the first skill authored
after mining the standard; the convention applies going forward.
