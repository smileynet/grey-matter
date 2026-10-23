# Versioning: picking the bump

Semantic versioning (`MAJOR.MINOR.PATCH`), with the pre-1.0 caveat that matters for a
young project.

## The decision

Look at the `[Unreleased]` changelog section (what actually changed for users) and pick:

- **MAJOR** (`x.0.0`): a breaking change, something users relied on now behaves
  differently or is gone. Removed capability, changed command/flag/output contract,
  changed file layout a consumer depended on.
- **MINOR** (`0.x.0`): new capability, backward-compatible. New skill, new flag, new
  supported target. Maps to changelog **Added** (and compatible **Changed**).
- **PATCH** (`0.0.x`): a fix or small correction with no new capability and no break.
  Maps to changelog **Fixed** and internal **Changed**.

After 1.0, the highest applicable bump wins: any break -> MAJOR; else any Added
-> MINOR; else PATCH. Before 1.0, apply the policy below instead.

## Pre-1.0 (the `0.y.z` phase)

While the project is `0.y.z` it is explicitly unstable, SemVer allows anything to change.
The practical convention this project uses pre-1.0:

- **Breaking changes bump MINOR**, not MAJOR (stay in `0.y.z`; don't jump to `1.0.0`
  until the project is declared stable). `0.1.0 -> 0.2.0` is fine for a breaking change
  during `0.x`.
- **Compatible fixes and small skill/guidance corrections bump PATCH**
  (`0.1.0 -> 0.1.1`). New capability, new distribution targets and substantial
  batches bump MINOR (`0.1.0 -> 0.2.0`).
- Reserve **`1.0.0`** for the deliberate "this is stable, the interface is now a promise"
  decision, not an automatic consequence of a breaking change.

## Rules

- The new version must be **valid semver and strictly greater** than the last `v*` tag
  (`release` enforces this).
- Tags are `vX.Y.Z`; the changelog section is `[X.Y.Z]` (no `v`).
- When unsure between two bumps, state the reasoning and let the user confirm, the bump
  is a judgement call the release skill surfaces, not a silent choice.

Behavior-changing skills and guidance count as product changes. A skills-only tkt
release still bumps tkt; the [release contract](../../../../docs/agents/release-contract.md)
defines authorities and derived surfaces. Engine vendor versions are separate.
