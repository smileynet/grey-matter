---
id: "256"
title: "Projects can add their own tab to the status dashboard without editing the renderer"
status: open
blocked_by: []
priority: medium
---
## Intent

User decision (2026-11-04, roblox-resiliency dashboard): "Add a custom-tab hook to the template" instead of keeping a project-local fifth tab. The contract says template changes go back into the template so every dashboard behaves alike.

## What to build

Given a project that needs an extra panel (for example a generated "Resiliency model" view), when it declares the tab in `gm-config` and supplies its own JSON data block and renderer script, then the shared template adds the tab button and panel, includes it in routing and arrow-key navigation, and the checker still loads the page's own script and passes, without the project editing the renderer.

## Context

- Template: `skills/productivity/delivery-dashboard/assets/dashboard-template.html` (fixed `TABS = ["overview", "history", "decisions", "plan"]`).
- Checker: `skills/productivity/delivery-dashboard/scripts/check-dashboard.mjs` runs the LAST bare `<script>` block in a VM; a project's extra script must not be bare or it breaks the check (seen in roblox-resiliency: "document is not defined").
- Current workaround to replace: roblox-resiliency `docs/status.html` (tab inserted by string edit; `scripts/build_dashboard.py` injects a `gm-model` block).
- Found during the same work: `snapshot-tickets.mjs` and `check-dashboard.mjs` exit 0 and print nothing when run through a symlinked path (`/home/...` -> `/local/home/...`), because the `import.meta.url` vs `argv[1]` comparison fails. Worth its own ticket.

## Acceptance criteria

- [ ] A `gm-config.tabs` entry (id, label) adds a tab button and an empty panel with a documented mount element
- [ ] Deep links and arrow keys reach the custom tab
- [ ] The checker passes a fixture page that declares one custom tab with its own script
- [ ] The contract documents the hook and the rule that custom content renders as text
- [ ] The browser gate test covers the custom tab at phone and laptop width
