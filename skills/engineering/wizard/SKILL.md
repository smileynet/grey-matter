---
name: wizard
description: Generate an interactive bash wizard that walks a human through steps only they can perform. Use when provisioning infrastructure, setting up credentials or CI secrets, walking an unfamiliar third-party dashboard, or running a one-off migration or cutover. Don't invoke this for steps the agent can perform itself.
---

# Wizard

A **wizard** is a bash script that walks a human, step by step, through a manual procedure that's tedious to do by hand and tedious to re-explain to an AI every time. It opens each URL, says exactly what to click and copy, captures the values, writes them where they belong, confirms at every stage, and shows how many stages are left. It might configure third-party services, set CI secrets, run a one-off migration, or move the project from one state to another.

The delightful UX is already solved by [template.sh](template.sh): stage-by-stage progress, confirmation gates, cross-platform URL opening (including WSL), hidden secret entry, idempotent writes to a **sink**, and a closing summary. **Your job is only to scope the procedure and author its stages.** The library above the `STAGES` marker is identical in every wizard; that consistency is the point.

## Two hard rules

1. **Hand it to the human. Never run it yourself.** The wizard opens browsers and blocks on human input; running it in an agent/CI context is useless (no one to click) and dangerous (it can write partial or empty secrets). You author and statically verify it, then tell the human to run it. You do not execute it.
2. **Describe landmarks, never invent click-paths.** You generate the stage content from training data that is stale for live third-party UIs, which rename buttons and move settings constantly. Write stages as goals and landmarks ("open your API keys page; create a secret key") anchored to an entry URL, not a brittle pixel-level click sequence, and never invent a deep-link URL you can't confirm. Where you don't know the current UI or exact command, say so and ask the user or check the docs. The per-stage human confirmation is the correctness check for what you couldn't verify.

## Sinks: where captured values land

A captured value is written to a **sink** by a library helper, never by hand-rolled stage code (the helper owns quoting, idempotency, and secret masking). The proven sinks today:

- **`.env` file** (`write_env`): idempotent upsert, 0600, for local dev config.
- **GitHub Actions secret** (`set_secret`) and **variable** (`set_var`) via `gh`: for CI.

A value can go to more than one sink (a secret often lands in both `.env` and CI). Some stages are pure actions with no captured value.

Other project types need other sinks (a game's `export_presets.cfg`, a signing keystore path). Those are not in the library yet; if a wizard needs one, say so rather than hand-rolling a write in a stage, and track it (there is a ticket to add and test cfg/keystore sinks against a real project).

## Process

### 1. Scope the procedure

Work out every manual step the human must take and every value captured along the way. Read the repo first, don't ask cold:

- For setup: `.env`, `.env.example`, `.env.*`, `README`, `docker-compose*`, framework config, and `.github/workflows/*` (every `secrets.*` / `vars.*` reference is a value the wizard must produce).
- For a migration or transition: the current state, the target state, and the irreversible actions between them.

Then show the user the ordered list of stages and the values each produces, and confirm: they may add, drop, or reorder.

**Done when:** every stage is named in order, and for each captured value you know (a) where the human gets it, (b) which sink it's written to (`.env`, a CI secret, both, or none; some stages are pure actions), and (c) whether it's secret (hidden entry) or public.

### 2. Map each stage's journey

For each stage, write the precise path a human follows as landmarks, not pixels (rule 2): which URL to open, what to accomplish there, where a value is shown, which variable it fills. E.g. "open the dashboard's API keys page, reveal the test secret key, copy it". Where you don't know the current UI or the exact command, say so and ask the user or check the docs; never invent steps that may not exist.

**Done when:** every stage traces to concrete instructions a stranger could follow.

### 3. Author the wizard

Copy `template.sh` to the target path (ephemeral wizards go to `.scratch/`; a repeatable one to `scripts/`). Replace the example stage with one `stage` per step, in dependency order. Use the library helpers: `stage`, `say`/`step`, `open_url`, `ask`/`ask_secret`, `write_env`, `set_secret`/`set_var`, `pause`/`confirm`. Set `TOTAL_STAGES` to the number of stages you wrote.

Hold the bar the template sets: open the URL before asking for its value, use `ask_secret` for anything secret, write every persisted value through its **sink helper** (never a hand-rolled `echo >>`, which breaks idempotency, quoting, and masking), `set_secret` only the values CI actually needs, and `confirm` before any irreversible action. Each `stage` clears the screen, so keep a stage to one focused task. **Never touch the library above the marker.**

### 4. Verify and hand off

- `bash -n <script>`; run `shellcheck` if available.
- **Confirm the library is unmodified**: everything above the `STAGES` marker must be byte-identical to `template.sh` (`diff` the region, or compare a hash). A hand-edited library silently breaks idempotency or secret masking.
- `chmod +x <script>`.
- **Don't run it** (rule 1). Trace it statically instead: every value from step 1 is captured and lands in the sink step 1 named, and every `set_secret` name exactly matches a `secrets.*` reference in CI.
- **Secret hygiene**: ensure the filled script and `.env` are gitignored; never commit a wizard that has captured real values.
- Tell the user how to run it. If it's a repeatable setup path, commit the (unfilled) wizard to `scripts/` and link it from the README so the next person runs the script instead of asking an AI.
