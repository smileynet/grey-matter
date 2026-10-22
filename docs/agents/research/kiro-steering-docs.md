# Kiro: Steering Files vs AGENTS.md (CLI V3 / kiro-cli)

_Client: kiro-cli (CLI V3). Sources: official kiro.dev docs, fetched 2026-10. Authority: L4 (official docs)._

## Summary

In current (V3-era) Kiro, "steering" is the primary mechanism for persistent agent
instructions: markdown files in `.kiro/steering/` (workspace) or `~/.kiro/steering/`
(global), whose loading is controlled by an `inclusion` frontmatter mode (`always`,
`fileMatch`, `manual`, `auto`) — and Kiro CLI V3 supports all four, where V1/V2 only
partially did. AGENTS.md is natively supported as a complementary standard: treated as
steering, discovered automatically at the workspace root, in `~/.kiro/steering/`, and in
subdirectories, but it does NOT support inclusion modes and is always included. There is no
documented deprecation of steering and no official guidance to prefer AGENTS.md over it.

## 1. Steering file — definition, location, loading

- Workspace `.kiro/steering/`, global `~/.kiro/steering/`.
- Foundation files (`product.md`, `tech.md`, `structure.md`) are "included in every
  interaction by default."
- Four inclusion modes via YAML frontmatter: `always` (default), `fileMatch` +
  `fileMatchPattern`, `manual` (`#name` / slash command), `auto` + `name`/`description`
  (skill-like relevance matching).
- **V3 note (verbatim):** "Kiro CLI V3 supports all four inclusion modes... In V1/V2, files
  marked `always` load automatically. Files marked `fileMatch` or `manual` are excluded from
  automatic loading."
- Custom agents: steering is NOT auto-included — must be added via the agent's `resources`
  field, e.g. `"resources": ["file://.kiro/steering/**/*.md"]`.

## 2. AGENTS.md treatment (verbatim)

> "Kiro supports providing steering directives via the AGENTS.md standard... however,
> AGENTS.md files do not support inclusion modes and are always included."

> "You can add AGENTS.md files to the global steering file location (`~/.kiro/steering/`), or
> to the root folder of your workspace, and they will get picked up by Kiro automatically."

> "AGENTS.md files are also discovered in subdirectories throughout your workspace... each is
> loaded as steering context alongside your other steering files."

Effectively an `inclusion: always` steering file following the open AGENTS.md standard.

## 3. Deprecation / preference?

None found. No statement deprecating steering, no guidance preferring AGENTS.md. AGENTS.md is
documented as a subsection of the Steering page. The only V2→V3 change is capability
EXPANSION (all four inclusion modes). Steering is NOT legacy per the docs.

## 4. Precedence / conflict

- configuration.md: "Steering | All scopes merged (not overridden)."
- steering.md: "In case of conflicting instructions between global and workspace steering,
  Kiro will prioritize the workspace steering instructions."
- AGENTS.md: loaded as merged steering context, always-included; behaves like an
  `inclusion: always` steering file in the merge.

## Verdict (docs)

Steering is NOT legacy in V3-era Kiro per the official docs; it is actively expanded, and
AGENTS.md is a complementary always-on steering variant. **However**, see the empirical file
(`kiro-steering-empirical.md`): on this host (kiro-cli 2.33.1, agent-engine v3), steering is
loaded by the agent config's `resources` glob (`file://.kiro/steering/**/*.md`) with NO
`inclusion:` frontmatter present on any file, so in practice every steering file loads
always-on regardless of mode. The docs describe a richer capability than the deployed config
uses.

## Sources
- https://kiro.dev/docs/steering.md
- https://kiro.dev/docs/configuration.md
- https://kiro.dev/docs/cli/v3.md
