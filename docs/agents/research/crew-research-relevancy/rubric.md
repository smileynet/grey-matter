# Skill relevancy rubric (crew-research → grey-matter migration)

Context: crew-research skills were written for last-gen agents (2025-era models with weak
self-verification, flaky subagents, small contexts). grey-matter targets current/next-gen models
(Claude Opus/Sonnet 4.5+ / 5-class, GPT-5-class Codex) on three harnesses: **kiro-cli, Claude Code,
Codex**. Default bias: **DROP**. A skill must earn its place.

Source of each skill: `~/code/crew-research/atomics/skills/<name>/SKILL.md` (+ its `references/`).
grey-matter skills to compare against: `~/code/grey-matter/skills/*/*/SKILL.md`
(read `skills/meta/compass/SKILL.md` first for the map).

For each skill, answer:

1. **What it actually does** (1-2 sentences, from reading it — not the description).
2. **Model-obsolete?** Does a current frontier model already do this unprompted / well, so the
   skill mostly restates good default behavior? Flag anything compensating for old-model weakness
   (e.g. "subagents fail ~50%", "always restate objectives", over-prescriptive checklists).
3. **Harness-native?** Do kiro-cli, Claude Code, or Codex already provide this as a built-in
   (e.g. Claude Code `/review`, `/security-review`, subagents, hooks; Codex `/review`; kiro-cli
   image support, agent configs)? Web-search the harness docs if unsure; cite URL.
4. **Covered by grey-matter?** Name the grey-matter skill that already covers it, if any.
5. **Residual unique value**: the specific knowledge a strong model would NOT have without it
   (local/environment facts, team-specific conventions, non-obvious gotchas, tool contracts).
6. **Verdict**, exactly one of:
   - `DROP` — no residual value, or too situational for a global set.
   - `FOLD` — small residual nugget; name the grey-matter skill/reference it should go into and
     quote the nugget (≤ 5 lines).
   - `PROPOSE` — high residual value warranting a new grey-matter skill; say why and sketch scope
     (≤ 5 bullets). Use sparingly.
   - `PROJECT` — valuable only in specific repos; drop globally, keep project-level.
7. **Confidence**: high / medium / low, with one line why.

Output format: one `## <skill-name>` section per skill with the 7 fields, then a final
`## Summary` table: skill | verdict | one-line reason. Be terse. Cite sources with URLs where you
make harness/model claims, labeled [L1..L6].
