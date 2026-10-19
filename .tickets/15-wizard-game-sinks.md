---
id: "15"
title: "Add and test wizard sinks for game projects (export_presets.cfg, keystore path)"
status: backlog
blocked_by: []
priority: low
validation_criteria:
  - "template.sh gains a cfg-file sink helper (idempotent, quoted INI/cfg upsert) for Godot export_presets.cfg / project.godot, added above the STAGES marker so wizards get it for free"
  - "A file-path/keystore capture helper exists for values that are paths to generated artifacts (e.g. an Android keystore), not inline secrets"
  - "Both new sinks tested against a real Godot project (bash -n + shellcheck + a real run writing a cfg and capturing a path), not just authored blind"
  - "wizard SKILL.md Sinks section lists the new sinks as proven, dropping the 'not in the library yet' caveat"
tags: ["type:enhancement", "stream:game-lens"]
---

# Add and test wizard sinks for game projects (export_presets.cfg, keystore path)

## What to build

Extend the wizard `template.sh` library with **sinks for game projects**, so a wizard can
write captured values into game-config targets, not just `.env` and GitHub secrets.

Context: `wizard`'s SKILL.md generalises the write-target as a **sink** (a library helper
that owns quoting/idempotency/masking), and ships the proven `.env` + `gh secret`/`gh
variable` sinks. The game sinks were deliberately deferred (ticket authored against the
current, tested library rather than shipping unverified bash) because they need a real
Godot project to exercise. The `gh secret` sink already transfers to game CI
(`BUTLER_API_KEY`, `STEAM_*`, base64 signing certs, Apple creds); what's missing is the
non-`.env` local targets.

### Sinks to add (above the STAGES marker, so every wizard inherits them)

- **cfg-file upsert** (`write_cfg` or similar): idempotent, quoted upsert into an
  INI/cfg-style file for Godot's `export_presets.cfg` / `project.godot`. Must handle
  sections (`[preset.0]`) and re-runs without clobbering unrelated keys, the same
  idempotency bar `write_env` meets for dotenv.
- **file-path / keystore capture**: a helper for values that are *paths to generated
  artifacts* (e.g. an Android upload keystore, a Developer ID cert) rather than inline
  secrets, capturing and validating the path, recording where it lives, without echoing
  the artifact.

### Why test-against-real-project is a criterion

INI/cfg idempotent upserts in bash are easy to get subtly wrong (section scoping,
quoting, trailing state). Per the repo's verify-before-done bar, these ship only after
`bash -n` + `shellcheck` + a real run against a Godot project that writes a preset key
and captures a keystore path, not authored blind.

Pairs with the game storefront/signing procedures a game wizard would walk (Steamworks +
`steamcmd`, itch.io + `butler`, Apple notarization, Android keystore + Play Console).

## Acceptance criteria

- [ ] `template.sh` gains a cfg-file sink helper (idempotent, quoted INI/cfg upsert) for Godot `export_presets.cfg` / `project.godot`, above the STAGES marker
- [ ] A file-path/keystore capture helper exists for path-to-artifact values, not inline secrets
- [ ] Both new sinks tested against a real Godot project (`bash -n` + `shellcheck` + a real run writing a cfg and capturing a path)
- [ ] wizard SKILL.md Sinks section lists the new sinks as proven, dropping the "not in the library yet" caveat
