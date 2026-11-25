# Spike Findings: Multi-Project LAN Dashboard Hub (Ticket #296)

Date: 2026-11-25
Host tested: `monolith` (Linux, `systemd --user` with `Linger=yes`, `avahi-daemon` active, Tailscale `v1.104.7`)
Candidate implementation: [serve-hub.mjs](../../../skills/productivity/delivery-dashboard/scripts/serve-hub.mjs) · [serve-hub.test.mjs](../../../skills/productivity/delivery-dashboard/scripts/serve-hub.test.mjs)

## Verdict

**Adopt and promote `serve-hub.mjs` as the permanent multi-project hub**, with `systemd --user` lifecycle and Tailscale Serve HTTPS transport (plus optional LAN/mDNS fallback).

- **4 of 5 acceptance criteria verified** on `monolith` (discovery, security boundaries, `systemd --user` restart + zero-restart freshness, and recorded findings/integration plan).
- **1 acceptance criterion remains pending owner action:** `tailscale serve --bg 8765` requires a one-time operator grant (`sudo tailscale set --operator=$USER`) on `monolith`, after which a second tailnet device (`flamingdragon` / `iphone171`) can verify 1-click **Copy answers for chat** over HTTPS Secure Context.

## Observed Evidence

### 1. Multi-project discovery & zero-restart freshness

- Scanning `--root ~/code` (depth 1) discovered all three repositories containing `docs/status.html`: `catalyst-borrowed-time`, `grey-matter`, and `tkt`.
- `/api/projects.json` reports live `openDecisions`, `openAsks`, `inProgress`, `ready`, and `totalTickets` counts sorted by attention-needed first.
- During the live probe we spotted and fixed a leak where `/api/projects.json` serialized each project's host filesystem `root`; it now exposes only `slug`, `name`, `url` (`/<slug>/docs/status.html`), and summary counts (covered by `serve-hub.test.mjs`).
- Updating `docs/status.html` via `snapshot-tickets.mjs` and adding a new repo with `docs/status.html` both appear on the next request without restarting the daemon (`Cache-Control: no-store`).

### 2. Security boundary matrix (unit tests + live LAN `192.168.0.168:8765`)

| Request | Result | Notes |
| --- | --- | --- |
| `GET /` | `200` | Dark-mode `#0a1120` hub index, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff` |
| `GET /grey-matter` | `302` | Redirects to `/grey-matter/docs/status.html` |
| `GET /<slug>/docs/status.html` (all 3 repos) | `200` | Allowlisted entry page |
| `GET /alpha/docs/shots/demo.svg` (linked in `gm-entries`) | `200` | Allowlisted relative asset |
| `GET /grey-matter/.git/config` | `404` | Blocked |
| `GET /grey-matter/.env` | `404` | Blocked |
| `GET /grey-matter/README.md` | `404` | Unlinked file blocked |
| `GET /grey-matter/docs/../README.md` and `..%2f` | `404` | Path traversal blocked |
| `GET /alpha/docs/escape.txt` (symlink outside root) | `404` | Realpath escape blocked |
| `POST /grey-matter/docs/status.html`, `PUT /`, `DELETE` | `405` | Read-only (`Allow: GET, HEAD`) |

### 3. Daemon lifecycle & transport on `monolith`

- User unit `~/.config/systemd/user/gm-dashboard-hub.service` (`Restart=always`, `NoNewPrivileges=true`, ~21 MB RSS) enabled cleanly (`default.target.wants`), started immediately, and survived `systemctl --user restart gm-dashboard-hub.service` with immediate `200` responses.
- Because `loginctl show-user "$USER" -p Linger` is already `Linger=yes`, the hub survives logout and reboot without a logged-in GUI session.
- **mDNS LAN fallback:** `http://monolith.local:8765/` returned `200` over local `avahi-daemon`.
- **Tailscale Serve HTTPS finding:** running `tailscale serve --bg 8765` unprivileged exited `1`:
  > `sending serve config: Access denied: serve config denied`
  > `Use 'sudo tailscale serve --bg 8765'.`
  > `To not require root, use 'sudo tailscale set --operator=$USER' once.`
  Once the machine owner runs:
  ```bash
  sudo tailscale set --operator=$USER
  tailscale serve --bg 8765
  ```
  Tailscale terminates trusted HTTPS at `https://monolith.taileb70f7.ts.net/` (persisted across reboots), at which point the systemd unit can also be tightened from `--host 0.0.0.0` to `--host 127.0.0.1` if LAN HTTP fallback is no longer wanted.

## Follow-up Integration Plan (once Criterion 4 is confirmed)

1. **Promote `serve-hub.mjs` in `delivery-dashboard` and `docs/agents/report-format.md`:** document `~/.config/grey-matter/hub.json` (`{ "baseUrl": "https://<host>.<tailnet>.ts.net" }`) so any agent updating a project's `docs/status.html` prints a direct clickable hub URL (`<baseUrl>/<slug>/docs/status.html#decisions`) instead of starting throwaway per-session servers.
2. **Retire ad-hoc per-repo server usage:** keep `tkt/tools/serve-dashboard.mjs` only for single-repo local dev/tests or point it to `serve-hub.mjs` once consumers migrate.
3. **Add a 1-step setup wizard (`wizard` skill or `delivery-dashboard` reference):** generate the `systemd --user` unit (Linux) / `launchd` plist (macOS) / Task Scheduler snippet (Windows) plus the one-time `tailscale set --operator` + `tailscale serve --bg 8765` prompt for new boxes.
