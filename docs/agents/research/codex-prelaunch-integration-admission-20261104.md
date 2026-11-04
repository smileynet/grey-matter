# #235 Codex prelaunch integration admission — bounded source review

**Verdict: no complete safe prelaunch admission path established within current authorization.** Source/documentation review only; no Codex process, app-server, MCP server, model call, account endpoint, or user/managed/Agy configuration was accessed or changed.

## What process-local overrides can do

Codex v0.166.0 has separate feature switches for Apps and Plugins. Per-invocation config overrides can turn these off (`features.apps=false`, `features.plugins=false`) without replacing CODEX_HOME or copying auth. These are surface-level restrictions, not a blanket disable for directly configured `mcp_servers`: v0.166.0 represents MCP servers as a separate config field, while Apps and Plugins are feature flags.

A named direct server can be disabled with `mcp_servers.<name>.enabled=false`, but this requires knowing every effective server name across applicable configuration layers. No wildcard “disable all MCP” switch was found in the pinned public v0.166.0 source/docs.

An empty-table override such as `mcp_servers={}` is not a reset. The pinned v0.166.0 merge implementation recursively merges TOML tables; an empty overlay table contributes no keys and therefore removes none of the inherited entries.

## Why the obvious inventory commands do not qualify

- `codex mcp list --json` is not metadata-only: pinned `run_list` loads the MCP manager and computes auth statuses; the implementation documents standalone list discovering auth through local HTTP. It may contact external auth endpoints. Its output can also include connection configuration.
- `codex app-server --print-startup-config` returns startup requirements/version, not the effective MCP/plugin inventory.
- Calling app-server MCP status/list after launch is too late for a prelaunch policy gate: it may initialize configured servers.

A strictly offline scan that reads only server-name keys from every effective config source, followed by named false overrides, might be a possible future procedure. However, the public interface/source reviewed here does not establish a supported metadata-only effective-config enumeration command, and current authorization excludes inspecting the held Agy configuration. Therefore that path is not established or authorized by this review.

## Practical bounded conclusion

Using only switches and sources established here, Apps/Plugins can be disabled process-locally while preserving the account auth home, but direct MCP servers cannot be proven globally disabled before startup. This is insufficient to clear #235’s zero-integration prelaunch gate. Keep the current native run held; do not infer absence from startup requirements or feature switches. A later change could add an explicitly authorized offline config-key inventory procedure with per-server overrides and managed-policy checks, or use a documented Codex-wide MCP disable/allowlist mechanism if one becomes available.

## Pinned-version sources

Implementation links are pinned to Codex `rust-v0.166.0` where possible:

- [MCP list implementation](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/cli/src/mcp_cmd.rs) — list loads effective servers and computes auth status, including local HTTP auth discovery.
- [TOML config merge](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/config/src/merge.rs) — recursive table merge; empty overlay does not clear.
- [Config override path construction](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/config/src/overrides.rs) — dotted path config overrides.
- [Core config model](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/core/src/config/mod.rs) — direct `mcp_servers` map is distinct from feature configuration.
- [Feature registry](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/features/src/lib.rs) — Apps and Plugins feature flags exist; no global direct-server disable feature was identified.
- [Startup config output](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/app-server/src/startup_config.rs) — requirements-only output.
- [OpenAI plugin packaging/server policy](https://developers.openai.com/plugins/build/plugins) — plugins may bundle MCP servers; per-plugin server settings use `plugins.<plugin>.mcp_servers.<server>`.
- [OpenAI config reference](https://learn.chatgpt.com/docs/config-file/config-reference)
- [OpenAI MCP setup](https://learn.chatgpt.com/docs/extend/mcp?surface=app)

**Version boundary:** these source observations apply to public tag `rust-v0.166.0`; they do not prove behavior of another installed build or private deployment.
