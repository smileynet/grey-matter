---
id: "65"
title: "Audit every plugin format against primary documentation"
status: in_progress
blocked_by: []
priority: high
spec: "release-readiness"
validation_criteria:
  - "A committed conformance report contains all six repository/format rows, each with primary-source section links, documentation date, exact tested artifact SHA and native validator or discovery output."
  - "The report covers names, versions, metadata/schema, marketplace source/ref/SHA paths, namespace/dependencies, skill frontmatter/sidecars/invocation policy, referenced files, hooks when present, and security/privacy requirements or explicit not-applicable reasons."
  - "Every release-blocking deviation has a linked remediation ticket and is included as a blocker of the final audit; unknown source guidance is labeled unverified rather than pass."
  - "OpenAI, Claude, Agent Skills, and applicable Agent Plugins specifications are re-read; the current vendor-published Antigravity plugin specification or shipped schema is located and cited, with unavailable guidance explicitly recorded."
  - "Native checks and isolated loading verify both repositories without credentials or files accidentally supplied by the maintainer checkout; source-versus-runtime conflicts are documented."
  - "The committed report and references pass relative-link checks; any new mechanical rule includes a seeded failing fixture proving detection."
tags: ["stream:tooling", "epic:release-readiness"]
---

# Audit every plugin format against primary documentation

## Intent source

User request on 2026-10-23: create tickets for outstanding findings, release
skills/scripts/guidance, final pre-release audit and staged artifacts; audit each plugin
against its source documentation.

## What to build

Users install plugins whose syntax, packaged behavior, and update instructions match each host's current authoritative contract. Produce a durable conformance matrix for both repositories across Codex, Claude Code, and Antigravity; inspect skills and catalogs as well as plugin manifests. Record primary-source sections actually read, documentation date, installed tool versions, local artifact paths, validator output, findings and severity. Treat supported compatibility manifests as valid; do not migrate formats just to follow a newer example.

## Context and sources

Read the [coordinated release plan](../docs/agents/proposals/09-release-readiness.md) first. It contains policy proposals,
source-of-truth rules, current findings, host documentation URLs, scope boundaries and
verification requirements. Research is committed in [GitHub release mechanics](../docs/agents/research/github-release-strategy.md)
and [plugin update semantics](../docs/agents/research/plugin-release-semantics.md). Re-verify dated
facts at execution time; links alone are not evidence of conformance.

Start with:
- `.codex-plugin/plugin.json` and `.agents/plugins/marketplace.json`
- `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`
- `scripts/deploy.mjs` (generated agy manifest/package)
- `skills/*/*/SKILL.md` and `agents/openai.yaml` sidecars
- tkt equivalents: [plugin inputs](https://github.com/smileynet/tkt/tree/main)

Implementation may span both repos. Commit/push them independently and link each
revision in evidence. Keep the coordinated dependency graph in grey-matter; link any
repo-local tkt implementation ticket rather than duplicating its scope.

## Acceptance criteria

- [ ] A committed conformance report contains all six repository/format rows, each with primary-source section links, documentation date, exact tested artifact SHA and native validator or discovery output.
- [ ] The report covers names, versions, metadata/schema, marketplace source/ref/SHA paths, namespace/dependencies, skill frontmatter/sidecars/invocation policy, referenced files, hooks when present, and security/privacy requirements or explicit not-applicable reasons.
- [ ] Every release-blocking deviation has a linked remediation ticket and is included as a blocker of the final audit; unknown source guidance is labeled unverified rather than pass.
- [ ] OpenAI, Claude, Agent Skills, and applicable Agent Plugins specifications are re-read; the current vendor-published Antigravity plugin specification or shipped schema is located and cited, with unavailable guidance explicitly recorded.
- [ ] Native checks and isolated loading verify both repositories without credentials or files accidentally supplied by the maintainer checkout; source-versus-runtime conflicts are documented.
- [ ] The committed report and references pass relative-link checks; any new mechanical rule includes a seeded failing fixture proving detection.

## Preserved first-pass research

Read the dated [Codex](../docs/agents/research/codex-plugin-conformance.md), [Claude](../docs/agents/research/claude-plugin-conformance.md), and [Antigravity](../docs/agents/research/agy-plugin-conformance.md) reports. These preserve source links, exact revisions, native results and coverage limits. They are inputs to the final matrix, not blanket conformance passes. Concrete remediation: tickets 72 and 73, both mandatory final-audit blockers.

Current evidence: [invocation policy](../docs/agents/research/plugin-invocation-policy.md) resolves the old agy unknown for 1.4.5 and tests Codex/Claude controls. [Claude 2.1.309 validation](../docs/agents/research/claude-current-validation.md) exposes a nested custom-root scanner gap. Run `node scripts/probe-claude-validation.mjs --binary <current-native-binary>` for each repo; it checks manifests, exact flat components and a seeded failing type error. Do not rely solely on root validator success.

Remaining syntax detector: current Claude accepts a malformed-YAML name seed. Add an independent standards-based YAML parser/check and a malformed-YAML failing fixture, covering frontmatter and applicable sidecars. This remains required even when native description-type controls pass. The final matrix must distinguish this gap from valid source files.
