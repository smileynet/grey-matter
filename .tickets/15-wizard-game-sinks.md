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

TBD

## Acceptance criteria

- [ ] TBD
