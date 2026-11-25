# Spike Findings: Mobile Decision Submission via Tailscale Serve Inbox (Ticket #298)

Date: 2026-11-25
Host tested: `monolith` (Linux, `systemd --user`, Tailscale `v1.104.7` Serve HTTPS proxy to `127.0.0.1:8765`, `--host 0.0.0.0` LAN fallback retained)
Implementation: [serve-hub.mjs](../../../skills/productivity/delivery-dashboard/scripts/serve-hub.mjs) · [serve-hub.test.mjs](../../../skills/productivity/delivery-dashboard/scripts/serve-hub.test.mjs)

## Verdict

**Adopt and promote Option A** (owner decision submitted live via the mobile inbox itself at `2026-11-25T21:10:17Z`):

- Keep hub-injected **Send to hub inbox** + iOS **Share** (`navigator.share`) on authenticated Tailscale Serve HTTPS requests only.
- Leave `dashboard-template.html` untouched (zero renderer migration; offline `file://` and plain LAN HTTP stay strictly unchanged and read-only).
- Add inbox pickup (`serve-hub.mjs --inbox [slug] [--clear]`) to `delivery-dashboard` guidance.
- Keep `allowedUsers` configurable in `~/.config/grey-matter/hub.json` so hosts can pin inbox writes to specific Tailscale user logins.

## Observed Evidence

### 1. Live Tailscale Serve proxy headers on `monolith`

Probing `GET /api/inbox/status` revealed an important Tailscale detail:

| Request path | `remoteLoopback` | `X-Forwarded-Proto` | `Tailscale-User-Login` | `writable` |
| --- | --- | --- | --- | --- |
| `https://monolith.<tailnet>.ts.net/` from **tagged `monolith` itself** | `true` | `https` | absent (tagged nodes carry no user login) | `false` |
| `https://monolith.<tailnet>.ts.net/` from **user-owned `iphone171` (iOS)** | `true` | `https` | present (+ `Tailscale-User-Name`) | `true` |
| `http://<lan-ip>:8765/` direct LAN (with or without spoofed `Tailscale-User-Login`) | `false` | `null` | ignored when non-loopback | `false` |
| `http://127.0.0.1:8765/` direct loopback without Tailscale Serve | `true` | `null` | absent | `false` |

Because `monolith` is a tagged node, requiring both loopback `remoteAddress` AND a non-empty `Tailscale-User-Login` naturally limits writes to authenticated human tailnet devices (`iphone171`, `flamingdragon`) and prevents unprivileged local processes or direct LAN hosts from posting.

### 2. Security & end-to-end verification

- **Unit + live rejections:** direct LAN `POST` with spoofed `Tailscale-User-Login` + `Origin` (`403`), direct loopback `POST` without `Tailscale-User-Login` (`403`), disallowed `allowedUsers` (`403`), cross-origin `Origin` (`403`), non-JSON `Content-Type` (`415`), unknown project slug (`404`), and >32 KiB body (`413`).
- **End-to-end iPhone submission (`20261125T211017Z-717023`):** tapping **Send to hub inbox** on `iphone171` over Tailscale HTTPS wrote formatted decision markdown atomically to `~/.local/state/grey-matter/inbox/grey-matter/` (`0o700`/`0o600`, strictly outside Git), with zero repo mutations; `serve-hub.mjs --inbox grey-matter` read it cleanly and `--clear` archived it to `processed/`.

---

## Research: Signaling a Chat Session When Mobile Answers Arrive

Can `serve-hub.mjs` automatically notify or wake a chat session when `POST /api/inbox/<slug>` lands?

### Cross-harness capability matrix (verified 2026-11-25)

| Harness | Wake an existing open interactive chat? | Start / resume a session externally? | Mechanism & limits |
| --- | --- | --- | --- |
| **Antigravity (`agy`)** | **Yes while waiting via background task** (reactive wakeup on task completion); no `SendMessage` RPC for arbitrary idle interactive chats | **Yes:** `ConversationService/CreateConversation` (new chat) or `agy --resume <id> -p "..."` | Built-in `conversations` API exposes `Create`/`List`/`Get`/`Update`/`Delete` (no append-to-existing-conversation method). However, Antigravity automatically resumes a waiting conversation when a background shell task completes — zero token/CSRF exposure needed. |
| **Codex (`codex`)** | **Yes (CLI / app-server):** `codex queue --thread <UUID> --message "..."` | **Yes:** `codex queue --thread <UUID> --resume` | Observed in local `codex queue --help`. Queues a follow-up user turn into an existing thread UUID on the local app-server (`--resume` wakes unloaded threads; delivery receipt remains an operator-verified canary per `codex-queue.md`). |
| **Claude Code (`claude`)** | **Yes:** background task wakeup (while waiting), **MCP Channels** (`notifications/claude/channel`), or `FileChanged` hook (next turn) | **Yes:** `claude --resume <id> -p "..."` or `--bg` | MCP Channels push live events directly into an active session; `FileChanged` injects `additionalContext` on the next turn. |
| **OpenCode (`opencode`)** | **Yes (with `opencode serve` / `--server`):** `opencode run --attach <url> --session <id> "..."` or HTTP session message API | **Yes:** `opencode --session <id> --prompt "..."` | Requires the background server (`OPENCODE_SERVER_PASSWORD`). |
| **Qwen Code (`qwen`)** | **Experimental:** `qwen serve` HTTP daemon / `FileChanged` hook (next turn) | **Yes:** `qwen --resume <id>` | `qwen serve` is Stage 1 experimental. |
| **DSH (`dsh`)** | Not natively for running TUI | **Yes:** `dsh tui --resume <session>` / `dsh headless "..."` | Would need a custom DSH plugin or file watcher. |
| **Kiro (`kiro-cli` / Crew)** | No external attach to interactive sessions | Parent-owned ACP child processes only | Documented in `native-notification.md`. |

### Recommended architecture (two-tier, zero credential sprawl)

1. **Tier 1 (Immediate, universal, safest): Reactive wait watcher (`serve-hub.mjs --wait <slug>`)**
   - After posting decisions to `docs/status.html`, if the owner wants hands-free pickup from mobile, the agent starts `node <skill>/scripts/serve-hub.mjs --wait <slug> [--timeout 1800]` as a background task (uses `fs.watch` on `~/.local/state/grey-matter/inbox/<slug>/`, zero polling CPU) and ends its turn.
   - The instant `iphone171` taps **Send to hub inbox**, the watcher exits `0` printing the submission JSON. In Antigravity (and harnesses with reactive background task completion), **that exact waiting chat wakes up automatically**, reads the answers, and acts on them — with zero CSRF tokens, zero session-ID guessing, and zero cross-session targeting bugs.
   - If the wait times out or the session was already closed, the submission stays safely in the inbox for manual pickup (`"pick up my dashboard answers"`).
2. **Tier 2 (Passive safety net + optional harness adapters):**
   - **Passive pickup nudge:** have `orient` (or `tkt`'s `SessionStart` hook) surface `"N unread mobile dashboard answer(s) in inbox for <slug>"` so answers submitted hours later are never forgotten in a fresh session.
   - **Optional active push for unattended sessions (separate follow-up if needed):** opt-in per-session callback registration targeting `codex queue --thread <UUID> --resume`, Claude MCP Channel, OpenCode `--attach`, or Antigravity `CreateConversation` (new chat) — always pinning `inbox.allowedUsers` in `hub.json` and framing payloads as untrusted/user-submitted data rather than raw shell directives.
