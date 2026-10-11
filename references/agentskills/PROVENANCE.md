# Vendored reference: Agent Skills standard

Source: https://github.com/agentskills/agentskills (the repo behind
https://agentskills.io). The open standard for packaging agent skills as a
`SKILL.md` + bundled resources, originally from Anthropic.

- Pinned commit: `69ef37e9424c0a7ea9dd2293b559e43ec8176379`
- Vendored: 2026-10-10
- Vendored as plain files (nested `.git` stripped) so it commits into grey-matter
  as a read-only reference, not a submodule.
- Pruned on vendor: the repo's own build tooling (`.claude/`, `package.json`,
  `.gitignore`, its `AGENTS.md`/`CLAUDE.md`). Kept: `docs/` (the spec + guides),
  `skills-ref/` (example skills), `README.md`, `CONTRIBUTING.md`, `LICENSE`.

Why it's here: the canonical reference for the SKILL.md format and the
progressive-disclosure model our authored skills follow. See the upstream
`LICENSE` for terms.

To refresh: re-clone upstream, re-apply the same prune, bump the pin above.
