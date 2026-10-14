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
| Kiro | (verify locally; likely ignores the Claude field) | - |

So a user-invoked skill sets **both** `disable-model-invocation: true` in `SKILL.md`
*and* `policy.allow_implicit_invocation: false` in `agents/openai.yaml`, kept in sync
(user-invoked in both or neither). This is the inherited `invocation.md` convention and
it is correct; it is the one deliberate deviation from the strict six-field allowlist.

Known wart: the strict agentskills validator and Claude Code's own linter warn on
`disable-model-invocation` as a non-standard key. The runtime honors it; accept the
warning. Codex and Kiro ignore the key at runtime (no error expected; verify locally).

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

## To verify against the locally-installed CLIs (sparse docs)

Open backlog check: whether kiro-cli 2.31.0 and codex-cli 0.162.1 **ignore vs reject**
unknown `SKILL.md` frontmatter keys, and whether kiro-cli honors
`disable-model-invocation`. Drop a probe skill with a known-unknown key into each
harness's skills dir and watch for warn-vs-reject. Until confirmed, keep frontmatter to
the safe core plus the deliberate invocation fields.
