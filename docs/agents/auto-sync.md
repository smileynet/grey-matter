# Periodic Auto-Sync (`auto-sync.mjs`)

`scripts/auto-sync.mjs` runs on a 12-hour OS timer (`systemd --user` on Linux, `launchd` on macOS, Task Scheduler on Windows) to keep `tkt`, `grey-matter`, installed `tkt` binaries, deployed skills/plugins, and any opt-in third-party packs current without LLM tokens or sandbox limits.

## Cadence and Scheduler

```sh
node scripts/auto-sync.mjs schedule install --hours 12   # install & start 12h timer
node scripts/auto-sync.mjs schedule status               # inspect timer state
node scripts/auto-sync.mjs schedule uninstall            # remove timer
node scripts/auto-sync.mjs run [--dry-run]               # run one sync pass now
node scripts/auto-sync.mjs status                        # show last run, notices, packs
node scripts/auto-sync.mjs ack [--pack <name>]           # silence seen/error notices
```

On Linux, `schedule install` writes `~/.config/systemd/user/agent-sync.{service,timer}` with `OnBootSec=2min`, `OnUnitActiveSec=12h`, `RandomizedDelaySec=5min`, `Persistent=true`, and an explicit `PATH` including `$HOME/.local/share/mise/shims`, `$HOME/.local/bin`, and `$HOME/.cargo/bin`.

## Dirty-to-Branch & Git Update Policy

For each pack (defaulting to `tkt` first, then `grey-matter`, then any registered drop-in packs):

1. **Busy check:** if `.git/index.lock` or an active merge/rebase/cherry-pick exists, skip and mark `busy`.
2. **Fetch:** `git fetch --quiet <remote>` with `GIT_TERMINAL_PROMPT=0` and a 30s timeout.
3. **Dirty working tree (`dirtyPolicy: "shelve-to-branch"`, default):**
   - Creates `auto-sync/wip-<YYYYMMDD-HHMMSS>` from `HEAD`, stages everything (`git add -A`), and commits with `-c commit.gpgsign=false --no-verify`.
   - Verifies the working tree is clean and `refs/heads/auto-sync/wip-...` resolves **before** touching the target branch.
   - Checks out `<branch>` aligned to `<remote>/<branch>` (`git checkout -B <branch> <remote>/<branch>`).
4. **Clean working tree:**
   - Behind only -> `git pull --ff-only`.
   - Diverged -> preserves local commits at `auto-sync/local-<branch>-<YYYYMMDD-HHMMSS>` before aligning `<branch>` to `<remote>/<branch>`.
   - Strictly ahead (clean, nothing new upstream) -> `held-local-ahead` (unpushed commits preserved).
   - Non-target branch or detached HEAD -> preserves unreachable/ahead commits in `auto-sync/*` and switches to `<branch>`.

## Inclusive Drop-In Extensibility (`packs.d/` + `notices/`)

External repos and plugins are not auto-synced unless opted in. Other packs can plug into the same 12-hour runner and `SessionStart` notification bus in two ways:

1. **Register with the shared runner** via `node scripts/auto-sync.mjs register --name <pack> --repo /abs/path --deploy-type deploy-mjs|command|none`, or drop a manifest at `$XDG_CONFIG_HOME/agent-sync/packs.d/<pack>.json` (`$AGENT_SYNC_CONFIG_DIR/packs.d/`):

   ```json
   {
     "schemaVersion": 1,
     "name": "my-pack",
     "repo": "/abs/path/to/my-pack",
     "branch": "main",
     "remote": "origin",
     "order": 50,
     "dirtyPolicy": "shelve-to-branch",
     "deploy": { "type": "deploy-mjs", "argv": [] }
   }
   ```

   Built-in `tkt` (`order: 10`) and `grey-matter` (`order: 20`) come from `skill-packs.json`. Drop-in packs run afterward in `(order, name)` order and are isolated so one pack's failure never blocks another.

2. **Publish to the shared notice bus directly** (even if the other pack uses its own updater): write `$XDG_STATE_HOME/agent-sync/notices/<pack>.json` (`$AGENT_SYNC_STATE_DIR/notices/`):

   ```json
   {
     "schemaVersion": 1,
     "pack": "my-pack",
     "id": "unique-notice-id",
     "timestamp": "2026-11-25T12:00:00Z",
     "severity": "info",
     "summary": "one-line summary",
     "details": [],
     "shelvedBranch": null,
     "reloadRecommended": true
   }
   ```

## SessionStart Notifications

`grey-matter` ships self-contained `SessionStart` hooks that read `$AGENT_SYNC_STATE_DIR/notices/*.json` (default `~/.local/state/agent-sync/notices/`) and inject a concise summary once per harness (`seen.json`), staying silent when nothing new occurred (`severity: "error"` repeats until resolved or acknowledged via `auto-sync.mjs ack`):

- **Claude Code / ZCode / Qwen Code:** `.claude-plugin/claude-hooks.json` -> `.claude-plugin/hooks/session-start.mjs`
- **Antigravity (`agy`):** `.claude-plugin/agy-hooks.json` -> `.claude-plugin/hooks/agy-session-start.mjs`
- **DeepSeek Harness (`dsh`):** `.claude-plugin/hooks/dsh-session-start.mjs` (skips `source === "resume"` for KV-cache hygiene)

Omitted from Codex and Kimi bundles (which carry no hooks).
