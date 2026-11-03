---
id: "188"
title: "Diagnose: Codex CLI tool execution fails because code-mode host is missing"
status: done
blocked_by: ["162"]
validation_criteria:
  - "The missing-host failure is reproduced or marked obsolete on the installed CLI, with executable identity and exact failing path sanitized."
  - "A supported install or session-scoped configuration remedy is verified with one harmless shell command, or the unsupported scope is recorded without silently bypassing the failure."
  - "Fixtures and changed settings have recorded disposition and required checks pass."
tags: ["stream:orchestration", "kind:bug"]
---

# Diagnose: Codex CLI tool execution fails because code-mode host is missing

## What to build

Diagnose the installed Codex 0.166.0 tool-launch failure observed in #162.
Three `codex exec`/`exec resume` processes emitted an error item saying the
code-mode host executable beside the current CLI could not be found. The
read-only `git status --short` request then reported BLOCKED (OS error 2), while
the conversation's question/follow-up JSON still worked. This is an
infrastructure failure before the approval path, not a sandbox denial.

Intent source: [#162 driver findings](../docs/agents/research/harness-experimental-features-20261101.md#ticket-162-headless-driver-probes-2026-11-02)
and its sanitized receipt. Read the CLI's current local help/install metadata
and official documentation before selecting a remedy; a different installed
host may exist elsewhere, so the observed failed path does not prove the host
is absent from the machine. Verify executable identity and package ownership.
Use an owned fixture and one harmless command to verify the supported remedy.
Do not install or copy a guessed companion binary, edit global configuration,
or disguise the failed tool channel as a successful approval test.

This blocks a real Codex tool-execution lane only when that lane requires the
affected installation. #174 may still report it as unavailable while comparing
runner alternatives; do not add a blanket blocker to unrelated harness probes.

Related ownership: #121 in the test-verification stream owns the critic probe's
Windows shim/package-launch resolution and version diagnostics. Reuse that
result where applicable; do not duplicate its source changes or interfere with
its active work. This ticket owns the distinct companion-host/tool-execution
failure after the CLI has already started. The shared install history may be
relevant evidence, but a copied executable is not yet a proven cause here.

## Acceptance criteria

- [x] The missing-host failure is reproduced or marked obsolete on the installed CLI, with executable identity and exact failing path sanitized.
- [x] A supported install or session-scoped configuration remedy is verified with one harmless shell command, or the unsupported scope is recorded without silently bypassing the failure.
- [x] Fixtures and changed settings have recorded disposition and required checks pass.

## Resolution (2026-11-03)

done: isolated missing sibling host to PATH-selected layout and verified same-version full-package invocation for one harmless command; recorded supported-scope limits and cleanup

### Verification
1. ✓ The missing-host failure is reproduced or marked obsolete on the installed CLI, with executable identity and exact failing path sanitized. — "PATH Bun Codex0.166hash9D563...EB42 reproduced missing sibling host; identical installed optional-platform package executable bytes had sibling signedhost. Exact native controlled transcripts and package ownership in report/receipt; independentcritic0.92high accepted."
2. ✓ A supported install or session-scoped configuration remedy is verified with one harmless shell command, or the unsupported scope is recorded without silently bypassing the failure. — "Session-scoped absolute invocation of same-version package-owned executable ran exact read-only fixture Git status with native shell exit0/emptyoutput. No copy/install/globalconfig change. Internal vendor path is not documented stablelauncher; durable repair, broader tools, writes/approvals unverified. Appalpha case separated."
3. ✓ Fixtures and changed settings have recorded disposition and required checks pass. — "Raw5JSONLs9606B/ownedfixture98400B recycled andabsent; installedbinaries/settings untouched. Parent pre-merge syntax fixtures and pre-push doc-links/home-path pass after correcting private-artifact citation. Diff scope only report/receipt/audit."
