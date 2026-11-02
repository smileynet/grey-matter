# Antigravity CLI permission source guide

**Checked:** 2026-11-02. Official docs were live pages opened on this date. Local CLI: `agy 1.4.12` (`C:\Users\uosmi\AppData\Local\agy\bin\agy.exe`). This records documented behavior and local CLI metadata only; no model calls or settings changes were made. CLI permissions and the older Antigravity App/previous-permissions section are distinct surfaces; findings below use the current **Antigravity CLI** section unless explicitly marked.

## Permission rules

- Rules are `action(target)` strings in the `permissions` object (`allow`, `ask`, `deny`). Precedence is **Deny > Ask > Allow**. The settings docs add that unparseable rules are ignored and the CLI combines global rules with Project and Shared scopes. A controlled probe needs to inspect or neutralize all scopes; `--settings` alone may not replace them.
- CLI command targets accept literal word-by-word prefixes, `command(regex:pattern)`, or `command(*)`. Regex is opt-in. The documented example is `command(regex:npm run (build|lint|test))`.
- For Windows PowerShell or Command Prompt, the permissions page says commands that cannot be cleanly split into words require an exact match by default; its cross-platform example uses `command(regex:git .*)` for a command and subcommands. This is a warning about matching the effective command string. It does **not** specify exactly how a particular headless tool call is wrapped/serialized on Windows. Capture the actual attempted command and compare observed matching; do not infer a `cmd.exe`/PowerShell prefix rule from the older App section.
- CLI `read_file` matches absolute or workspace-relative paths and grants recursive reads to contained files/folders. `write_file` uses the same path matching and implies read for the same target. On Windows, documented path normalization strips drive letters and converts backslashes to `/` before matching.
- In standard CLI operation, workspace reads and writes are auto-allowed. Other unconfigured actions default to Ask, subject to execution mode and `toolPermission`. A workspace write test without an explicit deny therefore does not test an ordinary unmatched Ask fallback.
- `unsandboxed(...)` applies only to Business/Enterprise accounts; other accounts ignore it and warn. Use `command(...)` when testing a regular account.

## Neutral session setup

Local `agy --help` was run read-only. It documents `--settings` as settings “for this session only, never saved” and accepts a settings JSON object inline or by file path. Prefer a temporary JSON file to avoid PowerShell/native argument escaping. The help also lists `--print`, `--output-format`, `--mode`, `--sandbox`, `--add-dir`, and `--dangerously-skip-permissions`; avoid the last flag in a permission test because it bypasses tool permission prompts.

Official settings docs identify `toolPermission` values `request-review`, `proceed-in-sandbox`, `strict`, and `always-proceed`; `strict` prompts even when an allow rule matches, while `always-proceed` still observes explicit Ask/Deny. They also identify `agentMode` and the sandbox setting. For a neutral, noninteractive baseline, explicitly set a known review-oriented tool policy and mode in the session-only settings file, then use only explicit per-session permission rules needed by each case. Do not choose `strict` when testing whether an allow rule is effective; do not choose `always-proceed` or `--dangerously-skip-permissions` when testing Ask/Deny. The account may not support `auto`, and sandbox availability is host/version dependent.

Because global, project, and shared scopes are combined, a strong baseline requires checking the active project's and shared permission state as well as global settings. Avoid editing global settings. If project/shared state cannot be isolated, state that limitation and make explicit deny/ask rules part of the probe fixture.

## Local version and changelog notes

Observed `agy --version`: `1.4.12`. The installed `agy changelog` output says 1.4.9 fixed persisted Always Allow rules for multiline commands such as `python -c`/`node -e`; 1.0.13 made Always Approve matching strict by default with explicit `regex:` opt-in; 1.0.9 hardened exact matching for PowerShell scripts, complex redirections, and unparseable strings. These are versioned change notes, not proof of current internal matching details. The 1.4.12 entries themselves concern plugin API-key behavior and streaming Markdown tables, not permission semantics. The changelog's `1.0.13` wording uses the older UI label “Always Approve”; map that cautiously to the current CLI `allow` rule.

## Probe design implications

1. Test a literal safe command prefix, then a `regex:` rule against both a matching and a near-miss command. Include a Windows command with arguments or shell syntax likely to trigger exact matching; record the full attempted command from tool output/logs. Avoid shell composition or wrappers until the simple case is established.
2. To establish precedence, use the same target in multiple lists and observe whether the action is allowed, denied, or requests review. In headless mode, an Ask action may be unavailable for interaction; distinguish a permission rejection from a successful command and do not infer the rule from exit code alone.
3. Test recursive path behavior with a narrow temporary directory and nested file. Test write-implies-read separately. Put write-deny checks on explicit targets because workspace writes are otherwise implicitly allowed.
4. Keep all settings session-only and all file targets disposable. Record CLI version, account class if known, shell, sandbox availability, mode, `toolPermission`, active permission scopes, stdout/stderr, exit status, and a side-effect marker.

## Short source snippets

Each source contributes fewer than 25 quoted words in this note.

- Permissions page, CLI sections: “Deny > Ask > Allow”; “command(regex:pattern)”; “stripping drive letters”; “auto-allowed”. [Agent permissions](https://antigravity.google/docs/permissions)
- CLI settings page: “The CLI ignores rules it can’t parse.” [Settings, CLI tab](https://antigravity.google/docs/settings?tab=cli)
- Installed `agy --help`, version 1.4.12: “for this session only, never saved”. Local observation, not a web-citable claim.

## Sources

- Google Antigravity, [Agent permissions](https://antigravity.google/docs/permissions), current CLI fine-grained permissions, supported CLI actions, cross-platform normalization and matching, default behaviors, and execution modes. Accessed 2026-11-02.
- Google Antigravity, [Settings (`tab=cli`)](https://antigravity.google/docs/settings?tab=cli), CLI safety/permissions, session overrides, and `permissions` object settings. Accessed 2026-11-02.
- Installed local `agy.exe`: `agy --version`, `agy --help`, and `agy changelog`. Observed version 1.4.12 on 2026-11-02. Changelog is bundled CLI release metadata; it does not establish server-side behavior for this account.
