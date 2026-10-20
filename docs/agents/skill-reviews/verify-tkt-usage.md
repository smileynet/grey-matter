# verify-tkt-usage

- Bucket: meta. Invocation: user-invoked (`disable-model-invocation: true`).
- Verdict: **new** (grey-matter original).

## What it is

A maintenance validator: scan every grey-matter skill (and `tkt-conventions.md`) for
inlined tkt commands and check each against the **live `tkt capabilities` manifest**,
catching drift when tkt renames/removes/re-types a command or flag.

## Why it exists (the boundary it enforces)

The user's clarified rule: **inlining tkt commands/core functions in our skills is fine**;
the wrap-don't-copy rule applies only where tkt ships a *skill* (e.g. `reconcile-tickets`
wraps the `tkt` skill). The cost of allowing inlined commands is **staleness** when tkt
evolves. Rather than ban inlining (the earlier over-scoped ticket 24), the control is a
validator that keeps the inlined usage honest against live tkt.

## Design

- **Grounded in `tkt capabilities -o json`** - tkt's machine-readable manifest (every
  command + effects + a JSON Schema of inputs). The check is **mechanical**: a flag not in
  the schema is a fact, not a judgement, which is the right shape for a validator.
- **Reads broadly**: `skills/**/SKILL.md`, skill `references/*` (incl. scripts), and
  `docs/agents/tkt-conventions.md`, the places that inline the command surface.
- **Present-and-report by default**, optional file-as-tickets (dedupe-first) when the user
  wants drift tracked, matching code-review / retro discipline.
- **Degrades**: if `tkt capabilities` is absent (older tkt), that's the first finding; fall
  back to `tkt <cmd> --help`.
- **CI-script follow-up noted** (the diff is deterministic over JSON) but out of scope,
  this is the on-demand audit; a committed CI check can come later (wizard-style pinned
  script).

## Cross-skill dependencies

Validates the tkt usage in implement, implement-spec, wayfinder, triage, to-tickets,
code-review, retro, reconcile-tickets, release, and `tkt-conventions.md`. Complements
`reconcile-tickets` (which wraps the tkt *skill*): this one keeps the inlined *commands*
valid. Meta bucket.

## Web-app bias

None. Command-surface validation is domain-neutral. No lens.
