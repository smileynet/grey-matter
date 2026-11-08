---
id: "271"
title: "Register and validate the grey-matter plugin in Kimi"
status: in_progress
blocked_by: ["270"]
validation_criteria:
  - "The validated plugin is registered from its maintained source package and its personal-market registration is read back successfully."
  - "A live installed-plugin probe verifies skill discovery, linked-resource loading, and user/model invocation behavior, with any owner-only installation step explicitly completed."
  - "Harness, distribution, release, and README documentation describe Kimi installation, update, prerequisites, validation, and the current skill count accurately."
  - "The applicable pre-merge gate passes and remaining unrun native or platform checks are reported honestly."
tags: ["triage:ready-for-agent", "kind:enhancement", "stream:tooling"]
---
## What to build

An owner can register the Kimi package in the personal market, install it through the client, and use documented install and update guidance. Live probes establish discovery, resource loading, and invocation behavior in Kimi; distribution documentation and the README reflect the supported workflow and current skill count.

## Acceptance criteria

- [ ] The validated plugin is registered from its maintained source package and its personal-market registration is read back successfully.
- [ ] A live installed-plugin probe verifies skill discovery, linked-resource loading, and user/model invocation behavior, with any owner-only installation step explicitly completed.
- [ ] Harness, distribution, release, and README documentation describe Kimi installation, update, prerequisites, validation, and the current skill count accurately.
- [ ] The applicable pre-merge gate passes and remaining unrun native or platform checks are reported honestly.