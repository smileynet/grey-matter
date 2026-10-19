# Harness behavior probes (ticket 14)

Empirical results for how skills are discovered, loaded, and filtered, replacing the
inferred [SPEC]/[LIKELY]/[VERIFY] reasoning in `docs/agents/skill-frontmatter.md` with what
was actually observed. Re-run the probe rig when a harness can be driven with real
credentials.

## The probe rig

`.scratch/harness-probe/skills/engineering/probe-skill/` (gitignored, throwaway):

- **Nested** two levels deep (`skills/engineering/probe-skill/SKILL.md`) to test nested
  discovery.
- A `references/probe.md` the SKILL.md links and instructs the agent to read (token
  `PROBE-REF-7Q2X`) to test on-demand reference loading.
- A known-unknown frontmatter key `probe-unknown-key` to test ignore-vs-reject.
- `disable-model-invocation: true` + an `agents/openai.yaml` with
  `policy.allow_implicit_invocation: false` to test user-invoked invocation control.
- A `.claude-plugin/plugin.json` enumerating the nested skill, for Claude's `--plugin-dir`.

## What was provable here, and what was not

This environment has all four CLIs installed (claude, codex, kiro-cli, opencode) but **none
authenticated**, so a live agent session (which is what actually exercises
discovery -> catalog -> activation -> reference read) could not be driven for any harness
(`claude -p ... -> "Not logged in"`). The **reference implementation** (`skills-ref`, the
agentskills standard's own library) and **static/CLI-surface checks** were runnable and are
recorded as authoritative for *the standard's* behavior; per-harness live rows are marked
untested.

## Results

### Reference implementation (`skills-ref`, the agentskills standard library) - PROVEN

Run via `uv run skills-ref` from `.references/agentskills/skills-ref`.

| Behavior | Result | Evidence |
| --- | --- | --- |
| **Nested discovery** | the leaf dir is the skill; depth is irrelevant to parsing | `read-properties`/`to-prompt` both parse `skills/engineering/probe-skill` (2 levels deep) and a real nested skill (`skills/engineering/tdd`) fine |
| **Unknown frontmatter** | **ignored, not rejected** | `read-properties` on the probe (with `probe-unknown-key`) exits **0** and returns only `name`+`description`; deliberately broken YAML exits **1**. So unknown keys are dropped, malformed YAML fails |
| **`references/` loading** | **not a library concern** | tier-3 is behavioral: the library surfaces `location` (the SKILL.md path) so the agent resolves relative links itself; `skills-ref` never reads `references/`. Confirms references are additive, loaded by the agent at runtime, not by the discovery layer |
| **Invocation control (`disable-model-invocation`)** | **not filtered by the standard library** | `to-prompt` still lists the probe in `<available_skills>` despite `disable-model-invocation: true`. Filtering is a **per-harness** responsibility (the client-impl spec tells *implementers* to hide such skills), not something the standard library does. Confirms our "invocation control is per-harness" rule |

### Claude Code - UNTESTED (not authenticated)

`claude -p --plugin-dir <probe> ...` returned "Not logged in". The CLI surface confirms the
mechanism exists: `-p/--print` (non-interactive), `--plugin-dir` (load a plugin by dir),
`/skill-name` invocation, and `--disable-slash-commands` ("Disable all skills"). A plugin's
`skills` array enumerating nested paths is the documented load path. Live discovery +
reference-read + invocation-suppression rows: **untested here**, re-run with auth.

### codex-cli 0.162.1 - UNTESTED (not authenticated / no driven session)

Installed. Our skills ship an `agents/openai.yaml` sidecar for its invocation metadata.
Not exercised live.

### kiro-cli 2.31.0 - UNTESTED

Installed. Activates skills by name via its own mechanism. Not exercised live.

### OpenCode - UNTESTED

Installed. Not exercised live.

## Our installer - PROVEN end-to-end

`scripts/install-skills.mjs` was run against the real 32-skill repo into a temp root:
flattens `skills/<bucket>/<name>/` -> `<root>/<name>/`, carries `references/` and `agents/`,
writes a manifest, is idempotent, prunes orphans, refuses to clobber foreign dirs
(`--force` overrides), and `list`/`uninstall` work. The probe tree is well-formed for the
same path. (Details in the ticket-13 resolution.)

## Conclusions fed back

- `docs/agents/skill-frontmatter.md`: the "unknown frontmatter ignored vs rejected",
  "references additive / loaded by the agent", and "invocation control per-harness" cells
  are confirmed **for the standard's reference implementation**. Per-harness runtime rows
  remain to be filled when a harness is authenticated.
- Ticket 07's narrow checks (unknown-frontmatter, nested discovery, references loading) are
  satisfied at the reference-implementation level and can close, pointing here; the
  per-harness runtime confirmation stays open under this ticket's untested rows.
