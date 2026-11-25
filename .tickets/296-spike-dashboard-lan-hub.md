---
id: "296"
title: "Spike: multi-project LAN dashboard hub (serve-hub + systemd --user + Tailscale Serve)"
status: in_progress
blocked_by: []
priority: medium
---

# Spike: multi-project LAN dashboard hub (serve-hub + systemd --user + Tailscale Serve)

## Deciding question

Can one zero-dependency, allowlisted multi-project Node hub (`serve-hub.mjs`) under `systemd --user` + `tailscale serve` cleanly serve every `docs/status.html` under `~/code/*` on one permanent HTTPS URL (restoring 1-click `navigator.clipboard` across desktop/phone/tablet) without leaking repo files or needing per-project port management?

## What to build (bounded spike)

1. Build a throwaway or candidate `skills/productivity/delivery-dashboard/scripts/serve-hub.mjs` generalizing `tkt/tools/serve-dashboard.mjs`'s strict per-project `linkedFiles()` allowlist across multiple project directories (`--root ~/code` scan depth 1, or `~/.config/grey-matter/dashboards.json`):
   - `GET /`: dark-mode hub landing page (`#0a1120` palette) listing every discovered project with `docs/status.html`, sorted by open decisions / open asks first, with live counts (`openDecisions`, `openAsks`, `inProgress`, `ready`) and direct links to `/<project>/docs/status.html#decisions`, `#overview`, and `#plan`.
   - `GET /<project>/...`: serves only that project's `docs/status.html` and allowlisted relative linked assets (`Cache-Control: no-store`, read-only `GET`/`HEAD`, blocks `.git`, `.env`, `.scratch`, `.references`, and symlink escapes).
2. Test lifecycle & transport on `monolith`:
   - Wire a `systemd --user` unit (`gm-dashboard-hub.service`, `Restart=always`, `127.0.0.1:8765`).
   - Expose via `tailscale serve --bg 8765` (HTTPS over MagicDNS `https://monolith.taileb70f7.ts.net/`) and test optional `--host 0.0.0.0` mDNS fallback (`http://monolith.local:8765/`).
3. Test 1-click **Copy answers for chat** over Tailscale HTTPS from a second device (desktop/phone) to confirm Secure Context unlocks `navigator.clipboard.writeText()` end-to-end.
4. Record the verdict and integration plan (whether to promote `serve-hub.mjs` into `delivery-dashboard`, retire per-repo `tkt/tools/serve-dashboard.mjs`, and add `~/.config/grey-matter/hub.json` URL discovery to `delivery-dashboard` + `docs/agents/report-format.md`).

## Out of scope

- No unauthenticated write/POST endpoints on the hub (answers still submit through chat copy/paste).
- No third-party reverse proxy requirement (Caddy/nginx) or custom Root CA trust-store installs.

## Acceptance criteria

- [x] `serve-hub.mjs` discovers all projects under `~/code` that have `docs/status.html` (`grey-matter`, `tkt`, `catalyst-borrowed-time`) and renders live open-decision / ticket counts on `/`.
- [x] Security checks pass: traversal (`../`), `.git/config`, `.env`, and unlinked repo files return `404` for every project route; `POST`/`PUT` return `405`.
- [x] `systemd --user` unit survives restart and serves fresh edits immediately (`Cache-Control: no-store`) with zero restart when a project updates `docs/status.html` or a new repo adds one.
- [ ] Tailscale Serve HTTPS endpoint verified from a second tailnet device: page loads in dark mode and **Copy answers for chat** succeeds via `navigator.clipboard` without falling back to the manual copy box.
- [x] Spike findings and follow-up integration decision recorded before promoting to permanent tooling.

## Spike progress (2026-11-25)

Findings recorded in `docs/agents/research/dashboard-lan-hub-spike-20261125.md`. Waiting on one-time owner Tailscale operator authorization (`sudo tailscale set --operator=$USER && tailscale serve --bg 8765`) and second-device clipboard confirmation before closing.
