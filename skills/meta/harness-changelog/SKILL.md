---
name: harness-changelog
description: "Detect harness upgrades (Claude Code, Codex, kiro-cli, Kiro Crew, agy, Crush, OpenCode, and their desktop apps) against a hashed baseline, read what changed, and propose what grey-matter should adapt. Use after a harness updates, when a harness behaves differently than its reference says, before relying on a flag or feature, or as a periodic audit. Trigger: harness changelog, new harness version, did the CLI change, harness upgrade, check harness versions, review new features."
---

# Harness Changelog

Harnesses update themselves silently. Kiro Crew moved 0.9.0 to 0.11.1 in the middle of a spike, and kiro-cli moved 2.34 to 2.37 without anyone noticing. This skill turns that drift into a reviewed list of changes and proposed edits. It never applies an edit without review.

## The baseline

- **Manifest:** [`docs/agents/harness-surfaces/versions.json`](../../../docs/agents/harness-surfaces/versions.json). Per harness and surface, it records:
  - how to read the version: `bin` candidates, optional `args` and `versionArgs`, or a `versionFile` for GUI apps with no CLI;
  - which help outputs to hash (`help`, one argument list per subcommand);
  - where the changelog lives (`changelog`);
  - which reference file describes it (`reference`);
  - the last reviewed state (`recorded`: version, date, hashes).
- **Reference files:** [`docs/agents/harness-surfaces/`](../../../docs/agents/harness-surfaces/README.md). These hold the per-surface grammar, the feature matrix and every flag. A help hash is defined in the README's version stamp; the script also normalizes the home path and Windows SIDs, so hashes don't differ per account.

## Process

1. **Detect.** It needs no network:
   ```bash
   node skills/meta/harness-changelog/scripts/harness-versions.mjs          # human-readable
   node skills/meta/harness-changelog/scripts/harness-versions.mjs --json   # for parsing
   ```
   Each harness reports one of these statuses:
   - `unchanged`;
   - `moved` (old and new version, plus each subcommand whose help changed);
   - `new`;
   - `missing`;
   - `error`.

   Exit 0 means nothing moved, 1 means something moved or is new or missing, and 2 means a probe failed. A warning that says `printed nothing` is a failed read, not a version. Stop here if everything is `unchanged`.
2. **Fetch what changed**, for each moved harness, from its own source in `changelog`, covering every entry between the recorded and the current version:
   - a bundled file (Kiro Crew's `CHANGELOG.md`);
   - a command (`agy changelog`);
   - a release page (WebFetch).

   Then diff the help: rerun `<bin> <subcommand> --help` for each changed key and compare it with the reference file's CLI section.
3. **Classify each change** into one of:
   - **New capability:** a new flag, subcommand, setting, tool or surface.
   - **Changed behaviour or default:** for example a default that flipped, a renamed flag, or a value that now fails.
   - **Removed or deprecated.**
   - **Security or permission relevant:** approvals, sandboxing, network, credentials.

   Mark each one observed (help diff, a run) or documented (changelog only), as the [evidence marks](../../../docs/agents/harness-surfaces/README.md#evidence-marks) define.
4. **Map each change to what it affects in this repo.** Grep for the flag, setting or feature name in:
   - the harness's reference file under `docs/agents/harness-surfaces/`;
   - [`docs/agents/harnesses.md`](../../../docs/agents/harnesses.md), for deploy and test commands;
   - [`docs/agents/research/harness-orchestration-primitives.md`](../../../docs/agents/research/harness-orchestration-primitives.md) and the experimental-features notes;
   - skill `references/`, scripts under `scripts/`, and open tickets (`tkt query`).
5. **Report and propose.** Write a table per moved harness: change | class | evidence | affected files | proposal. A proposal is one of these:
   - an edit;
   - a new ticket (dedupe with `tkt query` first);
   - "no action".

   Lead with security-relevant changes and anything that breaks a documented command. Ask before editing.
6. **Update the baseline, only after review.** Refresh the reference file's versions table and CLI section for each moved harness, then record the new state:
   ```bash
   node skills/meta/harness-changelog/scripts/harness-versions.mjs --update [--only id,id]
   ```
   Commit the manifest with the reference edits, so the next run diffs against reviewed state.

## Adding a harness or surface

Add an entry to the manifest:
- **CLI:** `bin` candidates, `help` keys for the subcommands an agent uses, `changelog` and `reference`.
- **GUI:** `versionFile` (`path` + `field`), or a `bin` + `versionArgs` that prints the version, such as `Get-AppxPackage` for an MSIX app.

Run `--update --only <id>`, and add a reference file following the [README template](../../../docs/agents/harness-surfaces/README.md#file-template).

## It's working if

- An unchanged machine reports all `unchanged` and exits 0.
- After an upgrade, the report names the harness, the old and new versions, and the subcommands whose help changed, before a skill fails on a stale flag.
- Every moved harness ends with its reference file, `harnesses.md` and the manifest current, or with a ticket that says why not.
