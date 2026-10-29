### Added
- Tickets can allow or exclude named agents independently of tags and machine capabilities. Identify invocations with `--agent` or `TKT_AGENT`; discovery and claims share the policy, with `claim --force` as an explicit override.
- Codex and Antigravity plugin packaging supplies the four ticket workflows: `tkt-core`, `tkt-orient`, `tkt-work` and `tkt-reconcile`. Install the tkt CLI separately.
- `audit.resolution_baseline_id` can grandfather historical resolution-quality findings while keeping acceptance-criteria and evidence checks active.
- Release maintenance can prepare and verify approved candidates without publication, then use a separately authorized reviewed CI publisher with per-channel recovery.
- Claude Code sessions show the launch project's ticket frontier and work in progress when tkt is on PATH. Requires Claude 2.1.310+ and Node 22+.
- tkt is installable as a Claude Code plugin: `/plugin marketplace add smileynet/tkt`, then
  `/plugin install tkt@tkt`

### Changed
- Claiming, closing, and editing ticket status keep existing default plan rows current in the same commit. Plan repair also adds missing tickets.
- **Breaking:** compiling tkt now requires Rust 1.85.0 or newer. Update Rust with
  `rustup update stable`, or use a pre-built binary.
- `node tools/deploy.mjs` selects roots so installed Claude/Codex plugins count as the skill copy and refreshes local plugins. Audits identify unowned skill directories and duplicate loading across configured packs. The bash wrapper remains an alternative entry point; no extra deploy step is needed.

### Fixed
- Workflow skills use supported tag-context queries and preserve the previous scope during temporary filtering.
- Upgrades from v0.4.0 can preview and remove old skill symlinks before installing the four workflow skills, while preserving unrelated files and source checkouts.
- Local Claude plugin audits use the active checkout rather than stale cache folders. Failed or foreign source checks preserve existing skill copies during deployment.
- Plugin archives retain their referenced runtime resources and license notices when extracted away from the source checkout.
- Packaged binaries report their own source identity, and published crates exclude scratch, plugin packages and maintainer files.
