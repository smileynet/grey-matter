---
id: "73"
title: "Verify plugin invocation policy and current host validation"
status: open
blocked_by: []
spec: "release-readiness"
priority: high
validation_criteria:
  - "A durable report distinguishes documented syntax, static policy, and observed runtime enforcement for all three hosts."
  - "Antigravity human-only invocation is proven or recorded as a release blocker requiring an explicit supported-scope decision."
  - "A current Claude validator checks both manifests and packaged components, with any remaining limitations linked to final audit."
tags: ["stream:tooling", "epic:release-readiness"]
---

# Verify plugin invocation policy and current host validation

## Intent source

Found during ticket 65 source-documentation audit on 2026-10-23; user requested confirmation of plugin syntax and best practices against authoritative documentation.

## What to build

Release compatibility claims distinguish manifest acceptance, catalog discovery and actual invocation enforcement. Resolve the unsupported or unverified claims before signing off the six plugin/host combinations. Do not remove human-only protections or invent a host contract to make checks pass.

## Context and sources

Read [Antigravity audit](../docs/agents/research/agy-plugin-conformance.md), [Claude audit](../docs/agents/research/claude-plugin-conformance.md), [Codex audit](../docs/agents/research/codex-plugin-conformance.md), `scripts/check-invocation-policy.mjs` and `docs/agents/harnesses.md`.

Antigravity documentation does not establish enforcement of Claude `disable-model-invocation` or Codex sidecars. Native validation alone proves neither. Claude 2.1.223 validates the root marketplace and requires an explicit separate plugin manifest check; the [current CLI reference](https://code.claude.com/docs/en/plugins/cli-reference#validate-a-directory) describes broader checks in newer versions. Codex isolated install and skills/list pass, but policy activation remains unverified; six system skills also acquire an unexplained grey-matter namespace even in a tkt-only home. Reproduce that anomaly separately before blaming manifests or reporting a client issue. No external message is authorized by this ticket.

Use [Claude invocation rules](https://code.claude.com/docs/en/skills#control-who-invokes-a-skill), [OpenAI skill metadata](https://learn.chatgpt.com/docs/build-skills#optional-metadata), and [Antigravity skills](https://www.antigravity.google/docs/skills/) as primary sources. Record exact versions, dates, isolated configuration, artifact revisions and outputs. Ticket 69 owns the broader install/upgrade suite. Any required model/credential test must have explicit bounded scope and preserve isolation.

## Acceptance criteria

- [ ] A durable report distinguishes documented syntax, static policy, and observed runtime enforcement for all three hosts.
- [ ] Antigravity human-only invocation is proven or recorded as a release blocker requiring an explicit supported-scope decision.
- [ ] A current Claude validator checks both manifests and packaged components, with any remaining limitations linked to final audit.

An unresolved policy gap remains a blocker; merely documenting it does not authorize ticket 70 to waive it.
