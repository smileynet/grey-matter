# Skill frontmatter: the all-up schema

grey-matter skills target three harnesses (Claude Code, Codex, Kiro/kiro-cli) and
should stay clean against the Agent Skills open-standard validator. This is the schema
to author against, and the rule for what belongs in `metadata`.

## The safe core

Every `SKILL.md` carries only:

- **`name`** (required): max 64 chars, lowercase alphanumeric + hyphens, and **must
  match the skill's folder name**.
- **`description`** (required): max 1024 chars. Model-facing for a model-invoked skill
  (rich "Use when..." triggers), human-facing one-liner for a user-invoked one.

These two are read by all three harnesses and are the only fields the strict standard
validator requires. Default to just these.

## Allowed-but-inert standard fields

The standard also allows `license`, `compatibility`, and `metadata`. Other harnesses
*ignore* them (they are not rejected). Use only when there is a real reason; they drive
nothing.

## Invocation control is per-harness (not one portable field)

There is **no single portable frontmatter field** for "user-invoked only." The field
each harness reads differs, and a strict validator rejects the Claude one:

| Harness | How user-invoked is expressed | Where |
| --- | --- | --- |
| Claude Code | `disable-model-invocation: true` | `SKILL.md` frontmatter |
| Codex | `policy.allow_implicit_invocation: false` | sidecar `agents/openai.yaml` |
| Kiro | ignores the Claude field (verified: unknown key ignored, skill still loaded) | - |

So a user-invoked skill sets **both** `disable-model-invocation: true` in `SKILL.md`
*and* `policy.allow_implicit_invocation: false` in `agents/openai.yaml`, kept in sync
(user-invoked in both or neither). This is the inherited `invocation.md` convention and
it is correct; it is the one deliberate deviation from the strict six-field allowlist.

**A skill another skill calls must be model-invoked.** Claude Code refuses a Skill-tool
call to a `disable-model-invocation: true` skill even from inside a skill the user
started, and tells the agent not to replicate it by other means. So when an orchestrator
(`wrap-session`, `release`, `sync`, `adopt-project`) says "call the Skill tool with `x`",
`x` must be model-invoked; only the orchestrator itself stays user-invoked. Verified live
2026-10-22 (`wrap-session` -> `reconcile-tickets` was refused); enforced by Check 3 of
`scripts/check-invocation-policy.mjs`.

Known wart: the strict agentskills validator and Claude Code's own linter warn on
`disable-model-invocation` as a non-standard key. The runtime honors it; accept the
warning. Codex and Kiro ignore the key at runtime (verified live on kiro-cli — the skill
loaded and ran with an unknown key present; see `research/harness-behavior-probes.md`).

## metadata: inert data only

`metadata` is a sanctioned free-form field, but **no harness reads it to function**. It
is inert storage. Therefore:

- **Belongs**: credits/attribution, provenance (source repo/commit), a version or
  changeset tag, a docs-page slug. Prefer short **string** values (the standard frames
  metadata as a string map; deeply nested objects are outside its letter even where a
  parser tolerates them). Attribution *prose* lives in a `CREDITS.md` sibling; metadata
  carries at most a one-line pointer to it.
- **Does not belong**: anything a harness must read to do its job, invocation policy,
  tool grants (`allowed-tools`), model selection, hooks, or argument hints. Those are
  real frontmatter fields or sidecars (above), never buried in metadata, because
  nothing acts on metadata.
- **Also not**: large content, or anything that duplicates the body.

## Claude-only extensions (use sparingly, know the cost)

Claude Code also reads `allowed-tools`, `argument-hint`, `user-invocable`, `model`,
`context`, `agent`, `hooks`. All are rejected by the strict validator and ignored by
Codex/Kiro. Use only when a skill genuinely needs the Claude behavior, and know it is
non-portable.

## Skill structure: nesting and reference files (portability)

Two layout facts matter for cross-harness portability. The Agent Skills standard defines
a skill *directory* (`SKILL.md` + optional `references/`, `scripts/`, `assets/`) but is
**silent on how a client discovers skills on disk or how deep it recurses**, so both of
these are per-harness/per-distribution concerns, not spec guarantees.

### Nested skill folders (`skills/<category>/<name>/`)

grey-matter nests every skill under a category (`skills/engineering/<name>/`,
`skills/productivity/<name>/`). This is portable **only when discovery is explicit**:

- A **manifest that enumerates paths** (a Claude Code plugin's `plugin.json` `skills:`
  array listing `./skills/engineering/<name>`, at any depth) finds nested skills fine.
  This is how upstream ships, and the layout we inherited.
- A **flat one-level auto-scan** (treating each immediate child of a skills root as a
  skill) does **not** recurse into category folders: it would see `engineering/`, find no
  `SKILL.md`, and skip the real skill one level deeper.
- The `name` field matches the skill's **immediate parent directory** (`implement/` ->
  `name: implement`), regardless of nesting depth. Nesting never breaks the name rule; it
  only risks discovery.

Consequence: if grey-matter is distributed as a plugin, its manifest must list every
skill's nested path and stay in sync (a stale manifest = a silently unloaded skill). If a
target harness only flat-scans, the layout must be flattened or projected by a build step.
Distribution is an open decision (see the tracking ticket).

### Reference files must be additive, not load-bearing

`references/` on-demand loading is native on Claude Code; elsewhere it **degrades to
behavioral**: wherever the `SKILL.md` body is in context and the agent has a file-read
tool, it can open `references/foo.md` by relative path, because that is just reading a
file. The failure mode is tier-1/2 (the skill never being discovered), not the file being
unreachable. So the portable rule is:

- **SKILL.md must be self-sufficient for correct behavior.** Never make correctness depend
  on a reference file that a harness might not surface.
- **`references/` is additive progressive disclosure**: the skill still functions if a
  reference is never opened. Keep references **one hop** from SKILL.md, with relative paths
  from the skill root.
- **Link reference files explicitly in the body** ("read `references/godot.md` when the
  engine is Godot"); don't rely on a harness auto-scanning `references/`/`scripts/`/
  `assets/` by directory name.
- **Scripts**: assume an explicit "run this" instruction plus a shell tool; don't assume
  auto-execution.



## Harness behavior: verified live (ticket 14)

The questions this schema used to hedge are now **resolved by live probes** across six
harnesses (kiro-cli, codex, Claude Code, agy, Crush, OpenCode) plus the standard's
reference library. Full results and per-harness evidence are in
[`research/harness-behavior-probes.md`](./research/harness-behavior-probes.md). The
load-bearing findings:

- **Unknown frontmatter is ignored, not rejected** — a skill with an unknown key loads and
  runs (kiro-cli live + reference lib; only malformed YAML fails).
- **Nesting is irrelevant to parsing** — the leaf dir is the skill; discovery depth is a
  per-harness scanner concern. Harnesses install flat (confirmed on Claude Code).
- **`references/` are agent-loaded at runtime** — proven live on kiro-cli and Claude Code
  (the agent followed the relative link and returned the token).
- **Invocation control is honored at the harness layer** — proven isolated on codex: the
  user-invoked probe (`allow_implicit_invocation: false`) was absent from the model catalog
  while the model-invokable variant was listed. Filtering is per-harness (agy and Claude
  Code list user-invoked skills in the catalog; codex filters them), which is exactly why
  invocation control is expressed per-harness above rather than as one portable field.
- **Scan roots are per-harness** at the user level (`~/.kiro/skills`, `~/.codex/skills`,
  `~/.claude/skills`), while the project-level `.agents/skills/` is shared by agy, Crush,
  and OpenCode. The installer's default-roots list accounts for this.
