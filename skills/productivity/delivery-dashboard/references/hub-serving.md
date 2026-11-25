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
  "port": 8765
}
```

- `baseUrl`: primary HTTPS URL (Tailscale Serve gives Secure Context so 1-click **Copy answers for chat** works via `navigator.clipboard`).
- `lanUrl` / `mdnsUrl`: optional local LAN HTTP fallbacks when `--host 0.0.0.0` is enabled.
- `roots` / `registry`: optional defaults when starting `serve-hub.mjs` without `--root` / `--registry`.

## URL discovery (read-only, no server started)

```bash
node <delivery-dashboard-skill>/scripts/serve-hub.mjs --url . --hash decisions
```

- Exits `0` with `{ "configured": true, "slug": "...", "hub": { ... }, "urls": { ... } }` when `hub.json` defines at least one base URL.
- Exits `1` with `{ "configured": false }` when no hub is configured; fall back to opening the local file or giving its `file://` link per [report-format.md](../../../../docs/agents/report-format.md#html-rules).

## Serving contract & security boundary

```bash
node <delivery-dashboard-skill>/scripts/serve-hub.mjs [--root DIR]... [--registry FILE] [--host 127.0.0.1] [--port 8765] [--config FILE]
```

- **Read-only (`GET`/`HEAD`):** `POST`, `PUT`, `DELETE`, and other methods return `405`.
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
