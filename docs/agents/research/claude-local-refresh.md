# Claude local development refresh

Research date: 2026-10-23. ✅ Official documentation/changelog and installed CLI help inspected. ⚠️ Runtime override not exercised in the initial research. The implementation follow-up below records the later client update and direct-source observations.

## Current conclusion

On 2.1.310, verify the enabled plugin's exact `readFromFolder` binding and audit
that folder. The initial 2.1.223 investigation identified the session override
below; its runtime behavior was not tested.

## Initial investigation: session override

The supported command form for a session-scoped source override is:

```sh
claude --debug --plugin-dir /Users/sambiggins/code/grey-matter
```

[L4:verified] Official development docs support `--plugin-dir` for loading a source directory for one session without installation/settings writes. Subsequent source edits load through `/reload-plugins`, or a fresh session. Supporting quote: “nothing is written to your settings for it.” [Create plugins](https://code.claude.com/docs/en/plugins/create#load-a-plugin-for-one-session)

[L4:verified] A same-manifest-name session plugin replaces the installed marketplace copy, unless managed settings lock the name. It loads in place; the installed marketplace registry row can still appear enabled. The debug log identifies the override. Supporting quote: `Plugin "<name>" from --plugin-dir overrides installed version`. [Plugin loading](https://code.claude.com/docs/en/plugins/loading#name-conflicts)

[L1:verified] This checkout’s manifest name is `grey-matter` and version is `0.1.0`; its root also contains the marketplace manifest. Pass the actual root above: it has `.claude-plugin/plugin.json` and the declared skill directories, so this is a plugin root rather than merely a marketplace container.

[L4:verified] The official changelog dates same-name local-dev override support to **2.1.74**, before the installed 2.1.223. Supporting quote: “local dev copies now override installed marketplace plugins with the same name”. It also records a **2.1.289** fix for stale local-folder marketplace copies in `plugin list`, `plugin eval`, and `plugin update`. [Official changelog](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)

[L1:verified] `claude --version` returned **2.1.223**. `claude --help` lists `--plugin-dir <path>`; `claude plugin update --help` exposes scope and help only, with no force/refresh-same-version switch.

## Limits

- This loads current development files for a new session; it does not repair the existing 0.1.0 cache or retrofit a running session started without the flag. Omitting the flag next launch restores the ordinary installed copy.
- Current docs say local-folder marketplace plugins load in place without version bumps. A stale cache alone does not establish which source an older client loads; verify its active source rather than projecting the current contract backward. No supported same-version **cache replacement** command was found for 2.1.223 under the stated constraints.
- `CLAUDE_CODE_PLUGIN_DIRS` is documented only from 2.1.280; it is not an alternative on 2.1.223. [Create plugins](https://code.claude.com/docs/en/plugins/create#load-plugins-from-an-environment-variable)
- Managed settings can prevent the override. Plugin dependencies remain separate installed plugins; this changes only grey-matter’s source origin. It creates no second installation.

## Smallest reversible verification

1. Start the command above in a terminal, without sending an agent prompt.
2. Inspect the debug log for the documented override line and the source root path; inspect `/plugin` component details or command completion for a newly added source skill absent from the cached 0.1.0 copy. Merely seeing the existing marketplace row is insufficient.
3. Exit the session. Start normally without `--plugin-dir` to confirm the installed copy remains available.

For the initial 2.1.223 fallback, use a fresh flagged session; verify `/reload-plugins` before relying on current reload semantics. No release version bump or registry surgery is needed.

Initial 2.1.223 evidence: `claude --version` → 2.1.223; `claude --help` → explicit plugin-dir support; `claude plugin update --help` → no force refresh option; official current docs and changelog read. At that stage, runtime override loading had not been exercised. The follow-up below verifies 2.1.310 source selection through CLI output; fresh-session model context remains unverified.

## Implementation follow-up

[L1:verified] The supported `claude update` command upgraded the installed client
from 2.1.223 to 2.1.310. Plugin versions remain grey-matter 0.1.0 and tkt 0.4.0;
no release version or marketplace registration was edited.

[L1:verified] The new client's `claude plugin list --json` returns `readFromFolder`
pointing at each registered local checkout, alongside the older `installPath`
cache. Both rows are enabled and report matching `folderVersion`. Running
`claude plugin update grey-matter@grey-matter` now explicitly says the plugin is
read from its folder and edits take effect at the next session or `/reload-plugins`.
The 44-skill cache remains historical; auditing that path as the active copy is
incorrect for this client. No direct cache writes or duplicate installations ran.

Implementation for ticket 75 should verify the enabled CLI row and exact real
`readFromFolder` binding before pruning bare copies, and use that active path in
audit. A legacy client without this field must not be treated as verified live
folder loading. Fixtures need old/stale cache vs current source, foreign binding,
missing/failed CLI, and replay without a second install/update call. A fresh chat
still needs to reload context; this observation is CLI source-selection evidence,
not a model-context capture for the new skill.
