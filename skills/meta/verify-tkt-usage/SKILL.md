---
name: verify-tkt-usage
description: "Validate every tkt command this repo's skills reference against the live tkt capabilities manifest, catching drift when tkt renames, removes, or re-types a command or flag. Use after a tkt upgrade, or when auditing whether the skills still match the installed tkt."
disable-model-invocation: true
---

# Verify tkt Usage

grey-matter skills are allowed to inline tkt **commands** (`tkt new`, `tkt close --check-all`,
`tkt ready`, ...), the wrap-don't-copy rule applies to tkt's *skills*, not its command
surface. The cost of inlining is **drift**: when tkt renames a subcommand, drops a flag, or
changes an enum, the inlined usage silently goes wrong. This skill is the staleness control:
it checks every tkt command the skills reference against the **live** tkt, so drift is
caught deliberately, not discovered mid-task.

## The source of truth

`tkt capabilities -o json` is tkt's machine-readable feature manifest: every command with a
description, its effects, and a **JSON Schema of its inputs** (flag names, enums, required
fields). Validate against *that* (and the installed `tkt --version`), never against memory
of how tkt used to work.

```bash
tkt --version
tkt capabilities -o json   # commands{} with inputSchema{} per command
```

## Process

1. **Load the live surface.** Run `tkt capabilities -o json` and parse it into: the set of
   command names, and per command, the set of valid flag/property names (with enums and
   required fields).

2. **Collect the repo's tkt usage.** Grep the skills and the tkt conventions doc for tkt
   invocations, the places that inline the command surface:
   - `skills/**/SKILL.md` and any skill `references/*` (including `release.sh`-style
     scripts),
   - `docs/agents/tkt-conventions.md`.
   Pull each `tkt <subcommand> ...` invocation and the flags it uses (`--check-all`,
   `--vc`, `--blocked-by`, `--tags`, `--priority`, `--status`, `--resolution`,
   `--evidence`, `-o json`, ...). Note prose that *names* a command/flag too, but weight
   actual invocations higher than descriptive mentions.

3. **Diff usage against the manifest.** For each referenced command:
   - **Command missing** from `capabilities` -> renamed or removed upstream. Flag it, name
     the current nearest command if there is one.
   - **Flag not in the command's inputSchema** -> renamed, dropped, or moved. Flag it with
     the schema's current flags for that command.
   - **Enum value no longer valid** (e.g. a `priority` or `status` value that changed) ->
     flag it with the current allowed set.
   - **Required field we never pass** -> flag as a latent failure.
   Anything that matches the manifest is fine, say so briefly; don't list every clean hit.

4. **Report, most-severe-first.** Present a table: skill/file -> command -> the drift ->
   the current correct form from the manifest. A removed command or wrong required field is
   a blocker; a renamed optional flag is a should-fix.

5. **Optionally file findings as tickets.** By default, present the report and stop. If the
   user wants the drift tracked, file each actionable finding as a tkt ticket with the
   file, the stale usage, and the corrected form as context. **Dedupe first** (`tkt
   query`): extend an existing drift ticket rather than file a near-duplicate.

## Notes

- This is a **mechanical** check: the manifest is authoritative and machine-readable, so a
  finding is a fact, not a judgement call. The only judgement is prose-mention vs real
  invocation, treat a described-but-not-invoked command loosely.
- Run it **after a tkt upgrade** (the moment drift appears) and as a periodic audit. It
  reads only; it changes no skill, it reports.
- If `tkt capabilities` itself is missing (an older tkt), that is the first finding, the
  installed tkt predates the manifest; fall back to `tkt <cmd> --help` per command, and
  note the degraded check.
- A future hardening is a committed script that runs this diff in CI (the manifest is JSON;
  the diff is deterministic). Out of scope here; this skill is the on-demand audit.

## It's working if

- Every tkt command and flag the skills inline exists in the live `tkt capabilities`.
- After a tkt upgrade, running this surfaces exactly what changed, before a skill fails on
  it mid-task.
- Clean runs are quiet; only drift is reported.
