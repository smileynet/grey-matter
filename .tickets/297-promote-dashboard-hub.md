---
id: "297"
title: "Promote serve-hub.mjs into delivery-dashboard with hub.json URL discovery"
status: done
blocked_by: []
priority: medium
tags: ["stream:tooling"]
---

# Promote serve-hub.mjs into delivery-dashboard with hub.json URL discovery

## What to build

Follow-up from spike #296 (`docs/agents/research/dashboard-lan-hub-spike-20261125.md`) and owner decisions (`hub-promotion`: Option A; `hub-bind-mode`: Option B):

1. Promote `skills/productivity/delivery-dashboard/scripts/serve-hub.mjs` with `~/.config/grey-matter/hub.json` discovery (`readHubConfig`, `resolveProjectUrls`, and read-only `--url <dir-or-slug> [--hash <fragment>] [--config <file>]` CLI lookup).
2. Add `skills/productivity/delivery-dashboard/references/hub-serving.md` documenting the `hub.json` schema, CLI usage, `systemd --user` + Tailscale Serve setup, and bind-mode tradeoffs (`0.0.0.0` for Tailscale HTTPS + LAN/mDNS fallback vs `127.0.0.1` Tailscale-only).
3. Wire `hub.json` URL discovery into `skills/productivity/delivery-dashboard/SKILL.md`, `docs/agents/report-format.md`, and `skills/engineering/orchestrate/references/tool-scripts.md`.
4. Provision `~/.config/grey-matter/hub.json` on `monolith` keeping `--host 0.0.0.0` (Tailscale HTTPS + LAN + mDNS).

## Acceptance criteria

- [x] `serve-hub.mjs --url <repo-or-slug> [--hash <fragment>]` resolves `baseUrl`, `lanUrl`, and `mdnsUrl` from `hub.json` without binding a port, and degrades cleanly when unconfigured.
- [x] `serve-hub.test.mjs` covers URL resolution, `--url` CLI output, missing config degradation, and existing allowlist/security guarantees.
- [x] `delivery-dashboard/SKILL.md`, `references/hub-serving.md`, `docs/agents/report-format.md`, and `tool-scripts.md` document `hub.json` URL discovery and pass doc-links / invocation / skill-syntax / pre-push / pre-merge gates.
- [x] `~/.config/grey-matter/hub.json` is configured on `monolith` with `--host 0.0.0.0` preserved, and `serve-hub.mjs --url . --hash decisions` prints working Tailscale HTTPS + LAN + mDNS links.

## Resolution (2026-11-25)

done: promoted serve-hub.mjs into delivery-dashboard with ~/.config/grey-matter/hub.json URL discovery (--url/--hash), added references/hub-serving.md, wired report-format.md + SKILL.md + tool-scripts.md, and configured monolith hub.json with --host 0.0.0.0 preserved
