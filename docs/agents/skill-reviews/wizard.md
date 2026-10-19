# wizard

- Bucket: engineering. Invocation: **model-invoked** (no `disable-model-invocation`).
- Verdict: **adapt**: keep the engine + fixed-library discipline; generalise the
  write-target as a **sink**; harden the two residual risks; ship proven sinks, ticket the
  game sinks.

## What it is

A skill that *generates* an interactive bash script to walk a **human** through a manual
procedure the agent can't do (mint API keys on a dashboard, set CI secrets, a one-off
migration). Ships a fixed `template.sh` library (stage stepper, cross-platform URL open
incl. WSL, hidden secret entry, idempotent `.env` upserts, `gh secret`/`gh variable`
writes, re-run resumability, closing summary). Hard rule: the agent authors only the
per-stage steps below the `STAGES` marker, never the library. Verified statically
(`bash -n`/`shellcheck`), never run by the agent. Ephemeral by default.

## What it does for the user

Turns a tedious, re-explain-every-time manual setup into a deterministic, idempotent,
re-runnable script the human drives once, so the agent offloads the human-gated steps to a
harness instead of narrating dashboard clicks turn by turn.

## Prior art (agent-filtered)

A coherent recombination of real patterns: **interactive setup wizard/installer** (the
stepper + confirm + hidden input), **semi-automated runbook / runbook-as-code** (Rundeck,
AWS SSM, runme.dev), **HITL handoff / AFK-vs-HITL** (hand the human a script, leave the
loop), **template method** (fixed skeleton, narrow extension point) applied to codegen,
**config-management idempotency** (Ansible-style upserts), and the **secret-zero /
bootstrapping** gap IaC deliberately doesn't own.

Well-grounded decisions to keep: fixing the UX/security library so the agent can't regress
idempotency/masking/quoting; static verification over execution (right for a
browser-opening, secret-writing artifact); ephemeral-by-default secret hygiene. Because the
dangerous machinery lives in the fixed library, residual risk concentrates in the two
things the library can't protect:

1. **Hallucinated dashboard click-paths/URLs** (highest): the agent generates stage content
   from stale training data for live third-party UIs. Mitigated by landmark-not-clickpath
   stages + per-stage human confirmation as the correctness check.
2. **Agent running the script itself** instead of handing it off (a known agent default).
3. (Secondary) hand-editing the fixed library; non-idempotent hand-rolled writes in a
   stage; committing a filled `.env`/wizard.

## Decision

**Adapt**, all within the existing architecture (none touch the agent's authoring surface):

1. **Generalise the write-target as a "sink".** A captured value lands in a sink via a
   library helper that owns quoting/idempotency/masking; stages never hand-roll a write.
   `.env` + `gh secret`/`gh variable` are the proven sinks shipped now. Other project types
   (a game's `export_presets.cfg`, a keystore path) need other sinks, framed as the
   pluggable layer and **ticketed** (ticket 15) to add + test against a real Godot project
   rather than shipping unverified bash. This is the apps/games split at the sink layer.
2. **Promote the two residual risks to hard rules** at the top of the skill: *hand it to
   the human, never run it yourself*, and *describe landmarks, never invent click-paths or
   deep-link URLs you can't confirm*. Upstream had both as asides; they are the #1 and #2
   failures, so they lead.
3. **Library-integrity guard** in step 4: confirm everything above the `STAGES` marker is
   byte-identical to `template.sh` (diff/hash), alongside `bash -n`/`shellcheck`. (This is a
   verification *step the agent runs*, not a docs-page compliance claim, so it's
   appropriate here even though a human docs page shouldn't carry it.)
4. **Repointing**: ephemeral wizards -> `.scratch/`; repeatable ones -> `scripts/` + README
   link; `.gitignore` the filled wizard and `.env` (secret hygiene); AGENTS.md-primary.
   Kept model-invokable. `template.sh` copied **verbatim** (the WSL handling, idempotent
   upserts, and secret masking are the hard-won parts); new sinks are added later, not a
   rewrite.

Kept: the fixed-library + author-only-stages split, static-verify-not-run, ephemeral
default, the read-the-repo-first scoping, and the whole `template.sh` library.

## Follow-up

- Backlog ticket **15**: add + test the game sinks (`write_cfg` for Godot
  `export_presets.cfg`, keystore-path capture) against a real Godot project, then drop the
  "not in the library yet" caveat.

## Cross-skill dependencies

Standalone generator; not a ticket flow (though game-setup procedures it walks pair with
the storefront/signing work a game project needs). The game-sink framing aligns with
`game-native-design` / the game lens. Ephemeral output follows the `.scratch/` convention;
secret hygiene follows the gitignore rules.

## Web-app bias

The vocabulary (`.env`, `gh secret`, Stripe-style dashboards) is web/SaaS-shaped, but the
engine (a cross-platform HITL harness that opens a dashboard, captures a value, upserts it
to a sink) is domain-neutral. Addressed by generalising the sink layer and ticketing the
game sinks, rather than a bare lens pointer, since the *sink target* is the biased part,
not the engine.
