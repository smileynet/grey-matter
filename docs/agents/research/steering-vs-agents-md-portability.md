# Steering files vs. AGENTS.md — cross-harness portability tradeoff

Research for grey-matter: a skills repo that must work unchanged across **kiro-cli,
Codex, Claude Code, agy, Crush, and OpenCode**. It currently has no steering; it relies
on `SKILL.md` skills + `AGENTS.md`.

Research date: 2026. Source authority labeled per the Source Authority hierarchy
(L1 = observable artifact, L4 = authoritative reference / official docs, L6 = community).
Per-harness detail lives in the sibling files in this directory
(`harness-*.md`); this document synthesizes and recommends.

---

## Summary

**The current setup is already the correct one.** `AGENTS.md` is an open standard
(agentskills.io's sibling, stewarded by the Linux Foundation's Agentic AI Foundation)
read natively by **every** harness on the list — including Kiro. `.kiro/steering/` is a
**Kiro-specific directory + schema**; no other harness on the list reads it "for free,"
so adopting it would *reduce* portability, not add anything. Kiro itself ingests
`AGENTS.md` through its own steering pipeline, so authoring `AGENTS.md` buys you Kiro
steering behavior *and* cross-tool portability from one file.

The two open standards cleanly divide the labor and grey-matter already uses both
correctly:

- **`AGENTS.md`** — always-on behavioral rules / project guidance (costs tokens every
  turn). Read natively by all six harnesses.
- **`SKILL.md` skills** — on-demand capability via progressive disclosure (only
  name+description always in context; body loads on activation). Supported by all six.

**Recommendation: keep steering out of grey-matter.** Put always-on guardrails in
`AGENTS.md`, keep procedural/workflow knowledge in skills, and do not introduce
`.kiro/steering/`. One caveat worth acting on: `AGENTS.md` is always-in-context, so it
must stay lean — anything procedural or situational belongs in an on-demand skill.

---

## Q1. Which harnesses read AGENTS.md natively? Which read .kiro/steering/?

**AGENTS.md is the agents.md / Agentic-AI-Foundation open standard** (originated by OpenAI
Codex, Amp, Google Jules, Cursor, Factory; now under the Linux Foundation). [L4 —
agents.md] All six target harnesses read it natively:

| Harness | Reads `AGENTS.md` natively? | Reads `.kiro/steering/`? | Notes |
|---|---|---|---|
| **kiro-cli / Kiro** | ✅ Yes — ingested through the steering pipeline | ✅ Yes (it owns the format) | AGENTS.md in workspace root or `~/.kiro/steering/` is auto-loaded "alongside your other steering files" (CLI 2.18, CLI 2.10, IDE 0.5 changelogs) [L4] |
| **Codex (OpenAI)** | ✅ Yes — read before any work; layered global→repo→dir merge | ❌ No | `~/.codex/AGENTS.md` global + `AGENTS.override.md`; closest-to-cwd wins [L4 — developers.openai.com/codex] |
| **Claude Code** | ✅ Yes — native since v2.1.277 (no symlink/import needed) | ❌ No | Default `claude-md-or-agents-md`: reads AGENTS.md when no CLAUDE.md is present; CLAUDE.md wins when both exist [L4 — code.claude.com/docs/en/memory] |
| **agy (Google Antigravity CLI)** | ✅ Yes — documented rules file ("must read and adhere to") | ❌ No | Official Google codelabs on AGENTS.md + skills [L4 — codelabs.developers.google.com] |
| **Crush (Charm)** | ✅ Yes — reads CLAUDE/GEMINI/AGENTS.md project context files | ❌ No | Also has `crushrc` Bash startup config (configures the agent, not prose rules) [L4 — charm repo AGENTS.md; L3 — issue #1050] |
| **OpenCode** | ✅ Yes — first-class rules file; `/init` generates it | ❌ No | Global (`~/.config/opencode/`) + project, merged [L4 — opencode.ai/docs/rules] |

**`.kiro/steering/` is read by exactly one harness on the list: Kiro.** The one known
non-Kiro reader anywhere is **Cline**, which deliberately implemented Kiro's steering
format (inclusion modes included) [L5 — Cline Discussion #10223] — but Cline is not on
grey-matter's target list, and no other harness reads the path "for free."

**Answer:** All six read `AGENTS.md` natively. Only Kiro reads `.kiro/steering/`.

---

## Q2. Is .kiro/steering/ portable to non-Kiro harnesses at all, or Kiro-only?

**Effectively Kiro-only.** Two layers to separate [L4/L5/L6 — harness-kiro-steering.md]:

- **The directory path + `inclusion:` front-matter schema** (`always` / `fileMatch` /
  `manual`) are a **proprietary Kiro convention**, not an open standard like `AGENTS.md`.
  No harness reads `.kiro/steering/*.md` automatically unless it specifically implements
  support.
- **The file contents are plain markdown.** The *rules inside* are usable by any agent
  pointed at them, and one third-party tool (Cline, not on the list) chose to implement
  the format. But "a non-Kiro tool reads it only if it was coded to" is the opposite of
  portable-by-default.

So `.kiro/steering/` is **not portable** in the way grey-matter needs. Adopting it would
create a Kiro-only surface that the other five harnesses ignore — strictly worse than the
current `AGENTS.md`-based setup. Kiro loses nothing by grey-matter staying on `AGENTS.md`,
because **Kiro treats `AGENTS.md` as a steering source through the same pipeline** (it's
grouped with steering + skills as a default inherited resource governed by
`chat.disableInheritingDefaultResources`) [L4].

---

## Q3. Where should always-on behavioral rules live — AGENTS.md, skills, or steering?

**AGENTS.md, for a harness-agnostic tool.** This is where the two open standards draw their
line:

- **agents.md (the AGENTS.md standard)** frames the file as "a README for agents" — a
  single predictable, always-loaded place for project context, conventions, build/test
  commands, and "anything you'd tell a new teammate," including "security considerations"
  and "security gotchas." It is plain markdown, no required fields; **the agent reads it to
  guide work on the project.** [L4 — agents.md]
- **agentskills.io (the Agent Skills standard)** is explicit that skills are **loaded on
  demand via progressive disclosure**: at startup only each skill's name+description
  (~100 tokens) is in context; the full `SKILL.md` body (recommended < 5000 tokens) loads
  only "when a task matches a skill's description," and bundled resources load only when
  required. "Full instructions load only when a task calls for them, so agents can keep
  many skills on hand with only a small context footprint." [L4 — agentskills.io +
  specification]

That division is the answer directly:

| Instruction type | Home | Why |
|---|---|---|
| **Always-on behavioral guardrails** ("verify before claiming done", "cite sources", "private-by-default binds") | **AGENTS.md** | Must apply every turn regardless of task; only the always-loaded file guarantees that. Skills can't — they're dormant until their description matches. |
| **Procedural / workflow knowledge** ("how to cut a release", "how to run the test harness", "ADR authoring steps") | **Skill** | Task-specific; wasteful to carry every turn; progressive disclosure is designed for exactly this. |
| **Steering** | **Not for a portable tool** | Only Kiro reads it; AGENTS.md covers the same always-on role across all six. |

**The standards agree on the split:** AGENTS.md = always-on context the agent should
always honor; skills = model-invoked capability pulled in on match. A guardrail that must
hold on *every* task cannot be a skill, because a skill that isn't activated contributes
nothing but its description. Guardrails belong in AGENTS.md (or, Kiro-only, an
`inclusion: always` steering file — which AGENTS.md already is, portably).

Note that Claude Code's own `/doctor` actively recommends migrating *procedural* content
*out* of the always-loaded file into on-demand skills [L4 — harness-claude-code.md] — i.e.
keep the always-on file to genuine always-on rules, push procedures to skills. That is the
same guidance as Q4.

---

## Q4. Always-on AGENTS.md (token cost every turn) vs on-demand skill — what goes where?

The binding constraint, stated by the standard itself: **the SKILL.md body loads only on
activation; AGENTS.md is in context every turn.** [L4 — agentskills.io] So the decision
rule is about *frequency of relevance vs. token cost*:

**Put in AGENTS.md (always-on) only if ALL hold:**
- It must influence behavior on essentially *every* task (a guardrail, an invariant, a
  cross-cutting convention), AND
- It is short enough that paying for it every turn is justified, AND
- It cannot wait to be "activated" — by the time a skill's trigger matched, the rule would
  already have been needed.

Examples that belong in AGENTS.md: "verify before claiming done," "cite sources with
authority levels," "commit after each logical unit," "private-by-default network binds,"
project vocabulary pointers, build/test entry points.

**Put in an on-demand skill if ANY holds:**
- It is procedural (a multi-step *how-to*) rather than a standing rule, OR
- It is only relevant to a specific task type (release, ADR authoring, a particular
  review workflow), OR
- It is long (reference material, templates, scripts) — carrying it every turn is pure
  token waste.

The spec's own sizing guidance reinforces this: keep each `SKILL.md` under ~500 lines /
< 5000 tokens, and push detail into `references/` that load only when needed [L4 —
agentskills.io/specification]. By symmetry, **AGENTS.md should be the smallest file that
captures the always-true rules** — every line in it is a per-turn tax. The failure mode to
avoid is an AGENTS.md that has swelled with procedures; those should be skills (this is
precisely what Claude Code's `/doctor` flags). agents.md supports *nested* AGENTS.md files
per subproject so each stays scoped [L4 — agents.md], but for grey-matter the lever is
"procedure → skill," not more AGENTS.md files.

---

## Recommendation for grey-matter (harness-agnostic skills repo)

1. **Do not add `.kiro/steering/`.** It is read only by Kiro; the other five harnesses
   ignore it. It would create a Kiro-only surface and divergence from the "one source every
   harness reads" principle grey-matter already follows (`CLAUDE.md` → `AGENTS.md`
   pointer). Kiro ingests `AGENTS.md` as steering anyway, so nothing is lost. [L4]

2. **Keep always-on guardrails in `AGENTS.md`.** "Verify before claiming done," "cite
   sources," and similar cross-cutting invariants must hold every turn — only the
   always-loaded file guarantees that, and all six harnesses load it natively. This is what
   the AGENTS.md standard is for. [L4]

3. **Keep procedural/workflow knowledge in `SKILL.md` skills.** Progressive disclosure
   means long how-tos cost almost nothing until invoked. grey-matter's existing skills
   model is correct and portable across all six. [L4]

4. **Audit AGENTS.md for weight.** Because it is taxed every turn across every harness,
   keep it to standing rules + pointers. Any procedure or situational how-to that has crept
   in should move to a skill (the Claude Code `/doctor` migration pattern). Use skill
   `references/` for bulk detail so even activated skills stay light. [L4]

5. **Target the shared skill conventions in the installer.** OpenCode and agy both read
   `.agents/skills/`; Codex reads repo `.agents/skills` + `~/.agents/skills`; Claude Code
   reads `.claude/skills/` (and OpenCode also reads `.claude/skills/`); Crush accepts an
   arbitrary `skill-path`. Favoring `.agents/skills/` + `AGENTS.md` maximizes
   read-it-for-free coverage. (grey-matter's installer already flattens into known harness
   roots — this just confirms the roots.) [L4 — harness-opencode-crush-agy.md,
   harness-codex.md]

**Net:** the current architecture (SKILL.md skills + AGENTS.md, no steering) is already the
portable-correct design. The only action items are keeping AGENTS.md lean and standardizing
install paths — not adopting steering.

---

## Sources (with authority labels)

### Standards (L4)
- [L4] AGENTS.md open standard — https://agents.md/ — "README for agents," always-on
  project context; ecosystem (OpenAI Codex, Amp, Jules, Cursor, Factory); Linux Foundation
  / Agentic AI Foundation stewardship; nested-file precedence. Fetched 2026.
- [L4] Agent Skills overview — https://agentskills.io/ — SKILL.md folder format;
  three-stage progressive disclosure (discovery → activation → execution); cross-product
  reuse. Fetched 2026.
- [L4] Agent Skills specification — https://agentskills.io/specification — frontmatter
  fields (name, description, license, compatibility, metadata, allowed-tools); token
  budgets (~100 / < 5000); references/ on-demand loading; < 500-line guidance. Fetched 2026.

### Per-harness (detail in sibling files)
- [L4] Kiro steering + AGENTS.md — kiro.dev changelogs IDE 0.5, CLI 2.18, CLI 2.10;
  kiro.dev/docs/steering, /docs/crew/capabilities/steering. See
  `harness-kiro-steering.md`. (Inclusion modes always/fileMatch/manual; AGENTS.md ingested
  as steering.)
- [L5] Cline Discussion #10223 — a non-Kiro tool implementing Kiro steering format
  (only known third-party reader; not a grey-matter target). See `harness-kiro-steering.md`.
- [L4] Codex AGENTS.md + skills — developers.openai.com/codex/guides/agents-md,
  /codex/skills/create-skill; learn.chatgpt.com/docs/build-skills. See `harness-codex.md`.
- [L4] Claude Code memory + skills — code.claude.com/docs/en/memory,
  code.claude.com/docs/en/skills (AGENTS.md native since v2.1.277; Agent Skills open
  standard). See `harness-claude-code.md`.
- [L4] OpenCode rules + skills — opencode.ai/docs/rules, docs on Agent Skills. See
  `harness-opencode-crush-agy.md`.
- [L4] Crush — github.com/charmbracelet/crush/blob/main/AGENTS.md; next-docs.charm.land
  configuration (skill-path). [L3] crush issue #1050 (project context files). See
  `harness-opencode-crush-agy.md`.
- [L4] agy / Google Antigravity CLI — codelabs.developers.google.com (AGENTS.md + skills).
  [L5] narenvadapalli.com Antigravity rules+skills. See `harness-opencode-crush-agy.md`.

### Flagged / superseded
- [L6, UNRELIABLE] Claim "OpenCode evolved into Crush" (codingbuddy adapter) — inaccurate;
  distinct projects. Not relied upon.
- [L6, STALE] Claim "Codex lacks file-based skill discovery" (claude-skills-library) —
  superseded by L4 official Codex skills docs.

### Evidence strength
- Q1 (who reads what): **strong** — all six harnesses confirmed by official docs (L4).
- Q2 (steering portability): **strong** — Kiro-owned convention (L4); sole third-party
  reader (Cline) is off-list.
- Q3/Q4 (always-on vs on-demand split): **strong** — stated directly by both open
  standards (L4), corroborated by Claude Code's `/doctor` migration guidance.
