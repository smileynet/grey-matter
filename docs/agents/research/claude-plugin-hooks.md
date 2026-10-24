# Claude-only plugin hooks

Checked 2026-10-23 against official documentation, installed Claude 2.1.310 and
AGY 1.4.6. Tickets: grey-matter 63 and [tkt 210](https://github.com/smileynet/tkt/blob/main/.tickets/210-claude-plugin-followups.md).

## Supported contract

Both hooks target Claude 2.1.310+ and Node 22+. This is the tested support baseline;
older clients have not been verified. They use exec-form Node commands with separate
path arguments, avoiding shell quoting for spaces and apostrophes. Files remain
inside `.claude-plugin/`; neither hook installs global settings.

### Push gate

The PreToolUse matcher covers Bash and PowerShell. For recognizable `git push`
commands, grey-matter runs `scripts/check-repo.mjs` under `CLAUDE_PROJECT_DIR`, with
that launch project as the child cwd. A missing checker means no-op. Checker
failure, crash or a 900-second child timeout produces blocking exit 2 with available
checker diagnostics. The hook has a 960-second outer timeout and `onFailure: block`.
The margin accommodates the observed nine-minute Windows full gate; a shorter
four-minute limit would reject a legitimate slow check.

Detection is best effort. It does not interpret arbitrary shell syntax, aliases or
wrappers. A redirected push such as `git -C other push` still checks the launch
project. Keep the Git pre-push hook to check the repository actually being pushed.
This hook supplements that gate; it cannot replace it.

[L4:verified] Claude sends stdin JSON with event, tool name, command and cwd. The
launch root comes from `CLAUDE_PROJECT_DIR`; cwd may differ. PreToolUse exit 2 blocks,
whereas exit 1 normally permits the operation. `onFailure: block` requires 2.1.295+.
The documented default command timeout is 600 seconds; this hook sets explicit
limits and does not use async. A Bash-only matcher misses native PowerShell tool
calls. Sources: [hook inputs and exit codes](https://code.claude.com/docs/en/hooks),
[plugin environment and quoting](https://code.claude.com/docs/en/plugins/manifest-reference).

### Session context

At each SessionStart event, tkt checks for `.tickets/` under the launch project and
for an executable `tkt` on PATH. Missing either means no-op. It runs `tkt ready --json`
and `tkt query --status in_progress`, capturing both before emitting plain stdout
context. Either query failing discards both outputs and reports a non-blocking
hook error. Each query has a five-second timeout; the hook has a 15-second limit.

The hook refreshes on startup, resume, clear, compact and fork. No persistent
session marker suppresses later ticket changes. An empty in-progress result is
shown as None, as is an empty frontier. JSON Lines avoid the human ready command's
in-progress footer, so WIP appears once. It does not install or update the CLI.

[L4:verified] Successful SessionStart stdout enters context. SessionStart cannot
block. Plugin hooks cannot use skill-frontmatter-only `once`; supporting all event
sources deliberately refreshes context. Sources: [SessionStart contract](https://code.claude.com/docs/en/hooks),
[plugin paths](https://code.claude.com/docs/en/plugins/manifest-reference).

## Host isolation and release closure

`metadata.deploy.claudeFiles` declares the private hook config and executable
resources. Every path must be a regular file under `.claude-plugin/`; the manifest's
hook config must appear in the list. Private files cannot enter the shared
skill/runtime closure, including through Markdown links. Only the Claude archive
contains them. Its hook path is explicit, never a conventional root hook file.

The Codex archive removes the Claude manifest's hook declaration and private-file
metadata. Both source Codex manifests explicitly select `hooks: []`, so the shared
local checkout also selects no Codex hooks. AGY's independently generated manifest
contains no hooks and its archive receives no private config or handler.

[L4:verified] Codex can discover `hooks/hooks.json` by default and supplies
Claude-compatible plugin environment variables. An explicit OpenAI hook setting
replaces default discovery; legacy packages can declare it directly in
`.codex-plugin/plugin.json`. Hook trust is separate from installation. Current public
directory submission excludes lifecycle hooks, so removing these from Codex archives
also preserves that distribution path. Sources: [OpenAI plugin packaging](https://developers.openai.com/plugins/build/plugins),
[submission requirements](https://developers.openai.com/plugins/deploy/submission).

[L4:inferred] Official documentation does not fully specify precedence among
simultaneous legacy Claude and Codex manifests. The archive therefore removes the
foreign declaration instead of relying on that precedence. The local checkout uses
an explicit Codex compatibility setting. Neither assertion relies on hook trust as
proof of packaging isolation.

[L1:verified] AGY 1.4.6's native validator discovered zero hooks in an isolated
fixture with nested Claude config and its own root manifest. Adding a root AGY
`hooks.json` positive control changed the count to one; both validations returned
no findings. AGY's vendor manifest schema has no hooks property. Sources:
[plugin layout](https://www.antigravity.google/docs/plugins?tab=cli),
[AGY lifecycle hooks](https://www.antigravity.google/docs/hooks/),
[vendor manifest schema](https://antigravity.google/schemas/v1/plugin.json).

## Verification and remaining evidence

- [L1:verified] Four direct push-handler fixtures cover project cwd, Bash/PowerShell,
  blocking diagnostics, malformed input, checker crash and unrelated repositories.
- [L1:verified] Three direct session-handler fixtures cover ordered frontier/WIP
  queries, launch cwd, missing guards and discarding partial output on failure.
- [L1:verified] The release-artifact fixture verifies private-file inclusion only in
  Claude, absence of conventional hook roots, and removal of the Claude declaration
  from the Codex archive. Other archive fixtures verify retained resources and hashes.
- [L1:verified] `claude --plugin-dir ../tkt --plugin-dir . plugin details grey-matter`
  reports one PreToolUse hook. The analogous tkt inventory reports one SessionStart
  hook. Plugin-manifest validation returns success. Native inventory is component
  discovery, not evidence of a model session executing a hook.

Direct tests ran on macOS. Windows execution, actual model-session context delivery,
and timeout expiry have not yet been observed. Keep those limits visible in final
candidate/platform evidence. Source-directory validation also reports the existing
CLAUDE.md context warning and an optional missing listing icon; record their final
artifact disposition during audit rather than treating manifest success as a claim
that every directory advisory is absent. Validate each extracted plugin, not just
its marketplace. [Native validation contract](https://code.claude.com/docs/en/plugins/cli-reference).
