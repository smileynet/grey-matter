---
id: "193"
title: "Diagnose: agy regex Ask rule does not override identical Allow rule"
status: in_progress
blocked_by: ["158"]
validation_criteria:
  - "Reproduce the exact Ask/Allow overlap and literal/broad Ask controls against the recorded native command and current CLI build."
  - "Explain the effective rule matching or document an upstream issue with sanitized evidence and a qualified supported mitigation."
  - "No global permission edits; disposable files recycled and applicable checks evidenced."
tags: ["stream:orchestration", "type:research"]
---

# Diagnose: agy regex Ask rule does not override identical Allow rule

## What to build

Intent source: discovered while executing #158 on 2026-11-02. Reporter: Codex;
confirmed twice by live native command events, pending diagnosis. Follow up the
matching/precedence discrepancy without widening the #158 permissions spike.

On Windows agy 1.4.12 (binary SHA-256 and all native events in
`docs/agents/research/evidence/agy-permissions-20261102.json`), session-only
settings with `toolPermission: request-review`, `agentMode: accept-edits`, and
both `permissions.allow` and `permissions.ask` equal to
`["command(regex:^git --version$)"]` ran `git --version`. The native tool reported
exit 0 and actual Git version output. A fresh repeat did the same. This disagrees
with the documented Ask-over-Allow precedence for the intended identical match.

Controls on the same build/model/account: the same Allow with literal Ask
`command(git --version)` or broad Ask `command(*)` was automatically denied
headless. The same regex in Deny blocked the command with a native matching-deny
error. No user approved any prompt; global CLI/shared settings and hooks hashes
were unchanged. Do not infer from the Ask-only case alone that its regex matched:
the unconfigured fallback also asks.

Inspect how rules are parsed and combined across session, project and shared
scopes and how Windows `command`/`unsandboxed` targets are matched. The effective
rule-list probe produced only a model refusal, despite `list_permissions` being
advertised in init; no native rule enumeration happened. That leaves the cause
unknown. A supported fix or upstream report needs exact current-build evidence.
Do not silently patch the installed binary, change global permissions, or assume
an account type from the native error's `unsandboxed` wording.

Until explained, do not depend on regex Ask overrides of a matching Allow.
The specific literal/broad Ask and regex Deny controls worked; this is bounded
experimental evidence, not a claim of general shell confinement. #157 can test
workflows using independently checked allow/deny controls; this ticket does not
block the whole workflow spike. Native histories for the two failures and four
controls are retained only until this diagnosis closes, as listed in the receipt.

## Acceptance criteria

- [ ] Reproduce the exact Ask/Allow overlap and literal/broad Ask controls against the recorded native command and current CLI build.
- [ ] Explain the effective rule matching or document an upstream issue with sanitized evidence and a qualified supported mitigation.
- [ ] No global permission edits; disposable files recycled and applicable checks evidenced.
