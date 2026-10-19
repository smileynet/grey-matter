# release (+ changelog, readme)

- Bucket: meta. Invocation: user-invoked (`disable-model-invocation: true`).
- Verdict: **new** (grey-matter originals, no upstream origin). A three-skill release set.

## What they are

A set to support the project's own release process:

- **changelog**: maintain `CHANGELOG.md` (Keep a Changelog) with **user-facing,
  benefit-oriented** entries drawn from commits + closed tkt tickets since the last tag.
- **readme**: keep `README.md` honest and current (identity, install/usage commands,
  feature list, links, status) against the real repo.
- **release**: the single orchestrator command. Composes `changelog` and `readme`, decides
  the semver bump (versioning reference), then runs the pinned mechanical tail
  (`references/release.sh`) that gates and executes tag/push/GitHub-publish.

## What they do for the user

One command (`release`) ships a correct, well-documented release, with the judgement
(changelog voice, README accuracy, version bump) owned by skills and the fragile mechanics
(gates, tag, push, `gh release`) pinned in a script. Each judgement piece is also invokable
alone.

## Prior art

Modeled on **crew-research** (`D:\code\crew-research`), which proved the pattern:

- CHANGELOG in **Keep a Changelog** format with user-facing entries ("Deploys no longer
  delete skills from other sources", not "fix: scope prune"). This voice is the single
  sharpest lesson, carried into `changelog`.
- A gated **`release.sh`** (clean tree, semver > last tag, `[Unreleased]` non-empty ->
  promote changelog, commit, annotated tag, push, `gh release create` with notes extracted
  from that version's section, `--dry-run`). Adapted near-verbatim into
  `release/references/release.sh`, generalised off `mise` to a plain `bash` invocation
  (grey-matter has no `mise.toml`; consistent with `install-skills.mjs`).

## Decision

**New, three skills + a versioning reference.** Design choices:

- **Judgement in skills, mechanics in a script.** The release flow is mostly judgement
  (what's a user-facing entry, is the README honest, which bump) with a fragile mechanical
  tail. Skills own the judgement; `release.sh` pins the gates + tag/push/publish so an
  agent can't skip a gate or fumble quoting (same discipline as `wizard`'s fixed library).
- **release is the orchestrator** (user's requirement): it calls `changelog` and `readme`
  via the Skill tool as steps 1-2, in addition to its own version + mechanics work, and
  each is independently invokable. Composition pattern, like `implement-spec` calling `tdd`
  / `code-review`.
- **versioning is a `references/` doc**, not a standalone skill, it's a decision rule the
  `release` skill consults, including the pre-1.0 convention (breaking changes bump MINOR
  while `0.y.z`; reserve `1.0.0` for the deliberate stability call).
- **changelog pulls from commits + closed tkt tickets** (resolutions are "what was done",
  the best raw material), translated to user-facing entries.
- **Plain `bash references/release.sh`**, no `mise`; requires `git` + `gh`; Windows via Git
  Bash/WSL.

## Cross-skill dependencies

`release` calls `changelog` and `readme` (Skill tool) and reads `references/versioning.md`.
`changelog` reads closed tkt tickets (`tkt query`) + `git log`. All three are meta-bucket,
beside `compass`/`curate-docs`/`cheat-sheet`/`review-skill`/`init-project`. Output follows
`docs/agents/report-format.md`. Does not deploy skills (that's `install-skills.mjs`).

## Web-app bias

None. Release process is domain-neutral. No lens.
