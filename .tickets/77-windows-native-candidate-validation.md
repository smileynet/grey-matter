---
id: "77"
title: "Validate native release candidates on Windows"
status: in_progress
blocked_by: ["69"]
spec: "release-readiness"
priority: high
validation_criteria:
  - "The exact candidate identities, archive SHA-256 values, native OS/architecture and client versions are recorded in committed evidence."
  - "Both plugin packages load with expected namespaces and exactly-once catalogs in every applicable native harness; unavailable clients are explicit blockers or approved exclusions."
  - "Native install, upgrade, repeated deploy, enable/disable and foreign-content preservation controls have command/output evidence."
  - "Applicable product, syntax, resource, invocation-policy and hook checks pass; unsupported checks are not counted as executed."
  - "A cited platform report and machine-readable evidence are committed, linked to ticket 70 and contain no publication or real user-state mutation."
tags: ["stream:tooling"]
requires: [windows]
---

# Validate native release candidates on Windows

## Intent source

User request, 2026-10-24: “Create tickets for windows and linux validation, I will run them on their respective machines.” Run this ticket on the user's native Windows machine. It addresses the native-vendor coverage gap found by [final audit 70](70-pre-release-audit.md); hosted product/fixture success does not close that gap.

## What to build

Given the two frozen release candidates, native Windows clients discover each managed skill once, retain foreign content through install/update controls, and produce an auditable platform report. A missing client or unsupported native platform remains an explicit failed/unavailable row until ticket 70 accepts the evidence or the user approves a supported-scope exclusion. Do not replace native validation with WSL, a different OS, schema-only checks or the existing CI logs.

## Read first

1. [Final candidate audit](../docs/agents/research/final-release-audit-20261024.md): candidate identities, six package rows, primary vendor source links and known limits.
2. [Candidate evidence](../docs/agents/research/evidence/final-candidate-audit-20261024.json): product/native reports and exact sealed archive hashes.
3. [Compatibility evidence](../docs/agents/research/evidence/plugin-compatibility-catalogs-20261024.json) and [Claude session evidence](../docs/agents/research/evidence/claude-upgrade-session-catalog-20261024.json): complete probe source text and assertion coverage. Adapt the embedded sources to this OS; their macOS sandbox commands, executable paths and temporary paths are not portable commands.
4. [Artifact construction](../docs/agents/release-artifacts.md), [distribution maintenance](../docs/agents/distribution-maintenance.md), and `scripts/release-native.mjs`: supported commands and isolation boundaries.

## Frozen inputs

| Product | Version / exact candidate | Remote candidate branch |
| --- | --- | --- |
| grey-matter | 0.2.0 / `e071b7b03d02025dc1af6c3ff2c4f8369f777587` | `codex/release-grey-matter-0.2.0-d9978415` |
| tkt | 0.5.0 / `2b6ff173993c9fe413c40287fb1cb3f0a9879ca1` | `codex/release-tkt-0.5.0-df4b652a` |

Use dedicated detached worktrees at these commits. Do not re-run version preparation or use a newer `main` as the candidate. If audit 70 selects replacements, update both platform tickets and bind new evidence before continuing. Durable inputs are the pushed commits and committed evidence, not another machine's ignored working files.

## Runbook

1. Record OS build/distribution, architecture, filesystem/link support and each executable's resolved path/version. Prerequisites: Git, Node 22+, locked npm dependencies, Rust 1.85+ and mise; tkt's full maintainer gate also needs cargo-dist 0.32.0. Locate native Codex, Claude, Antigravity, Kiro, OpenCode and Crush clients. Compare current client documentation with the dated audit before adapting a changed CLI. Record unsupported/unavailable clients rather than claiming a pass.
2. Fetch the two named branches in their respective repositories. Create clean detached worktrees at the full SHAs with `git worktree add --detach <new-directory> <candidate-sha>`. Preserve Git bytes (`core.autocrlf=false` on Windows). Run `npm ci --ignore-scripts --no-audit --no-fund` in each candidate worktree. Never store output in or modify a clean candidate's tracked tree.
3. Obtain the sealed host archives and verify their hashes against the committed audit. If transferring audited bytes is impractical, reconstruct from each exact commit with the canonical artifact builder below. Compare all resulting hashes with the audit before calling them the same assets. If platform archive metadata changes the hashes, record the mismatch, compare full member bytes/modes and obtain the original sealed bytes or reconcile the difference with audit 70; do not relabel reconstructed bytes as the original artifacts.
4. Run product and native verification below, retaining stdout/stderr and structured reports. The native verifier uses disposable HOME/USERPROFILE/CODEX_HOME/CLAUDE_CONFIG_DIR and an environment allowlist. **Network isolation is not enforced by that helper on Windows/Linux.** Do not inherit user credentials/config; use an OS-appropriate control if asserting network denial, and record the actual isolation. A binary that does not honor isolation is a blocked row, not permission to use personal settings.
5. Extend native package checks with the existing embedded install/upgrade probes: both packs together, actual `v0.1.0`/`v0.4.0` bare-to-plugin migration, repeated deploy, enabled/disabled selection, removed skills, stale same-version caches, and shared-root symlink/junction cases where supported. Register/install the extracted tkt Claude marketplace/package before grey-matter. Install the tkt CLI separately. Previous tags had no AGY plugin; label synthetic plugin-upgrade controls honestly.
6. Collect actual catalogs for Codex, Claude, AGY, Kiro, OpenCode and Crush. Expect 46 grey-matter + four tkt managed skills; an owned foreign sentinel is extra and must survive. Check plugin namespaces and bare-root paths, not counts alone. Verify 20 grey-matter manual-only policies and the remaining defaults using supported host metadata and retained controlled policy evidence. Metadata is not proof of model activation. Use initialization/catalog controls without paid model turns.
7. Verify the Claude PreToolUse push gate and tkt SessionStart fixtures on this OS, including checker failure/no-op and missing CLI/project behavior. Keep hooks absent from Codex/AGY. The supported Claude hook prerequisite is 2.1.310+ with Node 22+. Where native host execution cannot be tested without credentials/model use, record fixture versus native coverage separately.
8. Commit a dated report under `docs/agents/research/` and machine-readable results under its `evidence/` subdirectory. Include commands, exits, relevant output, candidate/archive/tool hashes, isolation, per-harness pass/fail/unavailable rows, duplicate counts, foreign sentinel checks and any gaps. Redact secrets; do not replace outputs with unsupported “works” claims. Link the report into ticket 70 and update its platform matrix. Report product defects as separate actionable tickets, preserving their failing command.

Run one operation at a time from the named candidate worktree. Replace angle-bracket paths with absolute machine-local paths; output directories must be new and outside the candidate tree.

```sh
# grey-matter candidate worktree
node scripts/release-artifacts.mjs build --repo . --ref e071b7b03d02025dc1af6c3ff2c4f8369f777587 --out <grey-artifacts>
node scripts/check-repo.mjs --require-tools
node scripts/release-native.mjs --artifacts <grey-artifacts> --out <new-grey-native-evidence> --execute

# tkt candidate worktree
node tools/release-artifacts.mjs build --repo . --ref 2b6ff173993c9fe413c40287fb1cb3f0a9879ca1 --out <tkt-artifacts>
mise run check
node tools/release-native.mjs --artifacts <tkt-artifacts> --out <new-tkt-native-evidence> --execute
```

The native command is one layer, not the complete upgrade/catalog matrix. It supports `--codex`, `--claude`, and `--agy` explicit executable paths; use these for platform launcher issues. Do not add nonexistent skip flags or silently omit failed hosts.

## Boundaries and handback

Use owned temporary homes/workspaces and a foreign sentinel; never clean the real user's skill/plugin roots to make a test pass. Verify dry-run unchanged state and repeated-run payload hashes. Keep credential/network and execution limitations visible. Do not push release tags, publish crates/GitHub releases, promote stable, submit directories, or modify secrets/settings. No model turn is required.

Close with five numbered evidence entries matching the criteria. If any required native client is unavailable, leave the ticket open and link the precise blocker; ticket 70 owns a supported-scope decision. The other platform's ticket is independent and can run concurrently. This ticket's evidence does not by itself close audit 70 or authorize staging/publication.

## Acceptance criteria

- [ ] The exact candidate identities, archive SHA-256 values, native OS/architecture and client versions are recorded in committed evidence.
- [ ] Both plugin packages load with expected namespaces and exactly-once catalogs in every applicable native harness; unavailable clients are explicit blockers or approved exclusions.
- [ ] Native install, upgrade, repeated deploy, enable/disable and foreign-content preservation controls have command/output evidence.
- [ ] Applicable product, syntax, resource, invocation-policy and hook checks pass; unsupported checks are not counted as executed.
- [ ] A cited platform report and machine-readable evidence are committed, linked to ticket 70 and contain no publication or real user-state mutation.
