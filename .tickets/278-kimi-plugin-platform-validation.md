---
id: "278"
title: "Validate Grey Matter Kimi installation beyond macOS"
status: open
blocked_by: []
validation_criteria:
  - "test -s docs/agents/research/kimi-plugin-platform-validation.md"
  - "node --test scripts/kimi-plugin.test.mjs"
tags: ["tooling"]
---
# Intent source

Sam requested follow-up tickets for remaining Kimi plugin limitations on 2026-11-08. Closed ticket 271 verified live installation only on macOS.

# What to learn and deliver

Install and exercise the maintained Grey Matter Kimi package on at least one real non-macOS client, preferably Windows. Verify native validation, registration, owner installation, skill discovery, linked-resource loading, user-only invocation boundaries, and the separately installed tkt/Git prerequisites.

Record the exact client OS and package identity in `docs/agents/research/kimi-plugin-platform-validation.md`. Leave untested operating systems explicitly unverified rather than claiming cross-platform support.

# Out of scope

Fixing platform defects before reproducing them, release publication, and substituting static package inspection for a real client installation.

## Acceptance criteria

- [ ] A real non-macOS installation loads a model-invoked skill and its linked reference from the packaged bytes.
- [ ] A user-only workflow remains unavailable to autonomous model invocation and available to the owner.
- [ ] Evidence names every tested and untested platform.
- [ ] Package tests pass in the applicable maintained environment.
