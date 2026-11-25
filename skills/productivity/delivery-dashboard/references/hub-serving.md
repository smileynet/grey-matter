# Multi-Project Dashboard Hub (`serve-hub.mjs`)

Run one read-only HTTP daemon per machine to serve every `<project>/docs/status.html` under your workspace roots over private HTTPS (Tailscale Serve) and/or LAN, with zero per-project port juggling and zero restarts on edits.

## Host config (`~/.config/grey-matter/hub.json`)

Agents read `~/.config/grey-matter/hub.json` (override with `GM_HUB_CONFIG` or `--config`) to print direct clickable links when handing back a dashboard or decision page:

```json
{
  "baseUrl": "https://<host>.<tailnet>.ts.net",
  "lanUrl": "http://<lan-ip>:8765",
  "mdnsUrl": "http://<host>.local:8765",
  "roots": ["~/code"],
  "host": "0.0.0.0",
  "port": 8765,
  "inbox": {
    "enabled": true,
    "dir": "~/.local/state/grey-matter/inbox",
    "allowedUsers": []
  }
}
```

- `baseUrl`: primary HTTPS URL (Tailscale Serve gives Secure Context so 1-click **Copy answers for chat** works via `navigator.clipboard`).
- `lanUrl` / `mdnsUrl`: optional local LAN HTTP fallbacks when `--host 0.0.0.0` is enabled.
- `roots` / `registry`: optional defaults when starting `serve-hub.mjs` without `--root` / `--registry`.
- `inbox`: optional Tailscale-authenticated mobile decision inbox (`enabled: true`). Set `allowedUsers` to one or more Tailscale logins to restrict who on the tailnet can submit; leave `[]` to allow any authenticated user on your private tailnet.

## URL discovery & inbox pickup (no server started)

```bash
node <delivery-dashboard-skill>/scripts/serve-hub.mjs --url . --hash decisions
node <delivery-dashboard-skill>/scripts/serve-hub.mjs --inbox [dir-or-slug]
node <delivery-dashboard-skill>/scripts/serve-hub.mjs --inbox <dir-or-slug> --clear
node <delivery-dashboard-skill>/scripts/serve-hub.mjs --wait <dir-or-slug> [--timeout 1800]
```

- `--url`: exits `0` with `{ "configured": true, "slug": "...", "hub": { ... }, "urls": { ... } }` when `hub.json` defines at least one base URL; exits `1` with `{ "configured": false }` otherwise (fall back to opening the local file or giving its `file://` link per [report-format.md](../../../../docs/agents/report-format.md#html-rules)).
- `--inbox [dir-or-slug]`: read-only JSON listing of pending mobile submissions saved outside Git in `~/.local/state/grey-matter/inbox/<slug>/` (accepts `.`, a repo path, or a bare slug).
- `--inbox <dir-or-slug> --clear`: archives processed submissions (and `latest.md`) into `<inboxDir>/<slug>/processed/` after the agent applies them.
- `--wait <dir-or-slug> [--timeout 1800]`: watches `<inboxDir>/<slug>/` with `fs.watch` (returns immediately if an unread submission is already present), prints `{ "ok": true, "timedOut": false, "slug": "...", "items": [...] }` and exits `0` the instant a mobile submission arrives, or exits `124` on timeout. Start it as a background task after posting decisions so reactive harnesses (Antigravity, Claude Code) wake automatically when you tap **Send to hub inbox** on mobile.

## Serving contract & security boundary

```bash
node <delivery-dashboard-skill>/scripts/serve-hub.mjs [--root DIR]... [--registry FILE] [--host 127.0.0.1] [--port 8765] [--config FILE]
```

- **Read-only by default (`GET`/`HEAD`):** `POST`, `PUT`, `DELETE`, and other methods return `405` unless `inbox.enabled` is `true` for `POST /api/inbox/<slug>`.
- **Tailscale-only inbox write gate (even on `--host 0.0.0.0`):** `POST /api/inbox/<slug>` requires a loopback socket (`127.0.0.1` / `::1`, blocking direct LAN clients even with forged headers), a non-empty `Tailscale-User-Login` header (optionally pinned via `inbox.allowedUsers`), `Content-Type: application/json`, same-origin `Origin` matching `baseUrl`, a valid discovered `slug`, and a 32 KiB body cap. Submissions write atomically outside Git (`0o700`/`0o600`) and never mutate `.tickets/`, `docs/status.html`, or repo files.
- **Progressive mobile UI:** on authenticated Tailscale Serve requests only, the hub injects `/_hub/inbox.js` in-flight to add **Send to hub inbox** (and **Share** when `navigator.share` exists) beside **Copy answers for chat**. Plain LAN HTTP and offline `file://` dashboards remain untouched.
- **Strict per-project allowlist:** serves only `docs/status.html` and relative `href`/`src` assets referenced inside its `gm-config`, `gm-entries`, or `gm-tickets` blocks. Returns `404` for `.git`, `.env`, `.env.*`, `.scratch`, `.references`, unlinked files, traversal (`../`), and symlink escapes.
- **No host path leaks & zero-restart freshness:** `/api/projects.json` exposes slugs, route URLs, and summary counts (never host filesystem paths). Every response sends `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.
- **Bind mode:** use `--host 127.0.0.1` for Tailscale Serve HTTPS-only access, or `--host 0.0.0.0` when you also want plain LAN / mDNS (`<host>.local`) reachability.

## Linux `systemd --user` + Tailscale Serve recipe

1. Create `~/.config/systemd/user/gm-dashboard-hub.service`:
   ```ini
   [Unit]
   Description=grey-matter Multi-Project Delivery Dashboard Hub
   After=network-online.target

   [Service]
   Type=simple
   ExecStart=/usr/bin/env node <grey-matter-checkout>/skills/productivity/delivery-dashboard/scripts/serve-hub.mjs --root <code-dir> --host 0.0.0.0 --port 8765
   Restart=always
   RestartSec=2
   NoNewPrivileges=true

   [Install]
   WantedBy=default.target
   ```
   *(If Node comes from `mise`/NVM, set `Environment=PATH=...` or point `ExecStart` at the shim/binary.)*
2. Enable and start:
   ```bash
   systemctl --user daemon-reload
   systemctl --user enable --now gm-dashboard-hub.service
   ```
3. Publish private Tailscale HTTPS (one-time operator grant on Linux):
   ```bash
   sudo tailscale set --operator=$USER
   tailscale serve --bg 8765
   ```
4. Write `~/.config/grey-matter/hub.json` with your `baseUrl` (and optional `lanUrl` / `mdnsUrl`).
