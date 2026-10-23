# Deployment inventory and provenance

Date: 2026-10-23. Scope: ticket 64, deployment portfolio and installed skill inventory.

## Registered sources and ownership

[skill-packs.json](../../../skill-packs.json) is the committed portfolio. grey-matter and
tkt are deployable packs; godot-helper and crew-research are optional inventory-only
sources. The latter are inspected for overlaps, never installed by portfolio deployment.
crew-research remains prior art, not authority for grey-matter. The `testing-guide`
source-name overlap is now reported with its owners and inventory-only scope. If two
active packs collide, deployment fails before any user root is written.

The [legacy inventory](legacy-skill-inventory.json) records all 43 unowned directories
under the shared user root: 40 skill definitions and three reference-only directories.
Disposition: retain as user-managed. Existing workflows still use these independent
skills and reference paths. Retention does not claim installer ownership. Every entry
records the measured tree digest, source lineage/revision, byte-equivalence result and
reason for retention. Changed bytes or newly unowned directories require fresh review;
strict audit accepts only unchanged, explicitly retained entries.

The earlier OpenCode cleanup is resolved: 42 identical duplicates and five stale source
shadows were archived outside scan roots; the latter were replaced by manifest-owned
source copies. The portfolio does not repeat that migration or remove legacy references.

## Evidence and reproducible checks

- [L1:verified] `node scripts/deploy.mjs audit --json --strict` returned status pass,
  inventory of 19 installed Claude/Codex plugins and four registered source packs,
  zero blocking findings, six inventory-only overlaps and 43 retained user directories.
  The count is a dated machine observation, not a constant enforced by tests.
- [L1:verified] `node scripts/probe-codex-shared.mjs` returned status pass on
  codex-cli 0.147.0: one shared-root skill, zero catalog errors. The probe creates a
  disposable home, initializes the native app server, then requests `skills/list`.
  No model is invoked and real skill roots/configuration are not read or written.
  Paths are compared by real path because macOS may return `/private/var` for `/var`.
- [L1:verified] Portfolio fixtures seed an active name collision and vendor drift,
  verify rejection before writes, deploy two registered packs exactly once, and accept
  absent optional repos. Unregistered sibling repos are never scanned.
- [L1:verified] Cache inventory fixtures seed two Codex plugins from different
  marketplaces, remove one installed skill, delete another manifest and add a duplicate
  skill. Actual cache contents expose every defect; expected source names never
  substitute for installed inventory.
- [L1:verified] Retention fixtures leave a legacy skill unowned, accept the recorded
  bytes and fail after mutation. Normal installs continue refusing foreign directories.

Run `node --test scripts/deploy.test.mjs`, `node scripts/check-repo.mjs`, and in tkt
`mise run check`. Native shared-root discovery is an explicit optional probe requiring
Codex; it is not part of offline `check-repo`. For a registered portfolio deployment:
`node scripts/deploy.mjs --portfolio skill-packs.json`. For inventory only:
`node scripts/deploy.mjs audit --portfolio skill-packs.json --json --strict`.

Codex plugin selection comes from `codex plugin list --json`; the audit reads each
enabled plugin's actual versioned cache manifest and recursive skill definitions.
Missing metadata/manifests and source-name mismatches are findings. Cache discovery is
not evidence that a model honored invocation policy or that every runtime script works;
plugin conformance and release install/upgrade testing own those separate checks.
