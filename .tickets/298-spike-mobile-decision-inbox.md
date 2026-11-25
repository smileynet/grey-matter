---
id: "298"
title: "Spike: mobile-to-desktop decision submission via Tailscale Serve inbox"
status: in_progress
blocked_by: []
priority: medium
tags: ["stream:tooling"]
---

# Spike: mobile-to-desktop decision submission via Tailscale Serve inbox

## Deciding question

Can `serve-hub.mjs` safely accept 1-tap decision submissions from a mobile device over Tailscale Serve HTTPS (`POST /api/inbox/<slug>`) — even while `GET`/`HEAD` stays bound to `0.0.0.0:8765` for local LAN access — so answers chosen on iOS (`iphone171`) land directly in a non-Git host inbox (`~/.local/state/grey-matter/inbox/`) for desktop agents on `flamingdragon`/`monolith` to pick up without cross-OS clipboard friction?

## Context

Follow-up from spike #296 (`docs/agents/research/dashboard-lan-hub-spike-20261125.md`) and #297. On iOS + Windows/Linux setups, there is no Universal Clipboard across devices, so 1-click Copy on mobile still leaves answers stranded on the phone unless bounced through another app.

## What to probe (bounded spike)

1. **Observe real Tailscale Serve headers on `monolith`:** verify live what `req.socket.remoteAddress`, `Tailscale-User-Login`, `Tailscale-User-Name`, `X-Forwarded-Proto`, and `Origin` look like when a request arrives via `https://monolith.taileb70f7.ts.net/` vs. direct LAN `http://192.168.0.168:8765/`.
2. **Test multi-layer write gate while keeping `0.0.0.0` read-only LAN:**
   - Reject any `POST` whose `req.socket.remoteAddress` is not loopback (`127.0.0.1` / `::1` / `::ffff:127.0.0.1`) — blocks all direct LAN clients even with forged headers.
   - Require `Tailscale-User-Login` (optionally allowlisted in `~/.config/grey-matter/hub.json`), same-origin `Origin` matching `hub.json.baseUrl`, `Content-Type: application/json`, strict size cap (e.g., 32 KiB), and a valid discovered project `slug`.
   - Write sanitized markdown answers strictly outside Git (`~/.local/state/grey-matter/inbox/<slug>/<timestamp>.md` + `latest.md`); never mutate `.tickets/`, `docs/status.html`, or repo files.
3. **Compare UI delivery options (canonical renderer impact):**
   - Option 1: Hub-side progressive enhancement (or `GET /api/inbox/status` capability check) adding a **Send to monolith inbox** button + optional mobile **Share** (`navigator.share`) without breaking offline `file://` dashboards or requiring per-project template forks.
   - Verify end-to-end from `iphone171`: submit answers on phone → confirm inbox file written on `monolith` → confirm agent can read/acknowledge inbox in chat.
4. **Record verdict & promotion plan** (including security findings, inbox lifecycle/cleanup, and whether any template change needs its own renderer ticket).

## Out of scope

- No automatic mutation of `.tickets/*.md`, `docs/status.html`, or Git commits from HTTP requests (human-in-the-loop chat pickup remains authoritative).
- No unauthenticated LAN `POST` access.

## Acceptance criteria

- [ ] Live Tailscale Serve proxy headers (`remoteAddress`, `Tailscale-User-Login`, `X-Forwarded-Proto`) observed and recorded on `monolith`.
- [ ] Unit + live security tests prove direct LAN `POST` (`192.168.0.168:8765`), spoofed `Tailscale-User-Login`, cross-origin `Origin`, unknown slugs, and oversized bodies are rejected (`403`/`404`/`405`/`413`).
- [ ] Valid Tailscale HTTPS submission from `iphone171` writes formatted decision markdown to `~/.local/state/grey-matter/inbox/<slug>/` without touching repo files.
- [ ] Spike findings and integration verdict recorded (including whether to also add `navigator.share` and how agents read/clear the inbox).
