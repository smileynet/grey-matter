# Ticket 186 auth-owner routing audit

**Audited section:** [Kiro Crew orchestration, Ticket 186](./kirocrew-orchestration.md#ticket-186-auth-owner-routing-2026-11-02)

**Receipt:** [sanitized auth ownership evidence](evidence/kas-auth-ownership-20261102.json)
**Overall verdict:** supported, trust **0.95**. The routing conclusion is well-supported for the identified Windows builds. Successful CLI-authenticated output is distinct from a tested Crew-vault token delivery, which remains unverified.

## Claim verdicts

| Claim | Verdict | Evidence and boundary |
|---|---|---|
| Installed Crew's host-auth builder omits the owner flag; the Windows sibling resolver returns no substitute, and its executable resolver selected the tested CLI binary. | **Supported** | Installed Crew 0.11.1 source (`kas.py`, `kas_transport.py`, `kiro_cli.py`, `client_spawn_env.py`) agrees with the builder and resolver outcomes/hash in the receipt. This establishes the emitted command and selected executable on this host, not a general property of other platforms or installations. |
| On Kiro CLI 2.37.1, omitted auth routes like explicit CLI ownership; explicit `client` forwards token callbacks. | **Supported** | The current [first-party ACP migration guide](https://kiro.dev/docs/cli/v3/acp-migration/) says V3 handles access-token requests with CLI login by default and requires `--auth-method=client` for client handling. In the three native runs, explicit `client` delivered callbacks to the controller, while explicit `cli` and the omitted-flag command delivered none. The tested executable hash and version are recorded in the receipt. |
| The two successful prompt arms returned exactly `AUTH_OK`. | **Supported** | The receipt records successful `end_turn` prompt responses and seven assistant bytes. Independent inspection of only the permitted private session message files found exact assistant payload content `AUTH_OK` in both arms; the flawed per-chunk marker check was discarded. This supports model output in those two CLI-owned runs, not Crew-owned credential delivery. |
| Explicit-client negative authentication is a routing pass and an expected negative-auth control, not a successful authentication test. | **Supported** | Nine callback requests reached the host; the host returned only a fixed credential-unavailable error; `session/prompt` failed with `-32000`, with no assistant output. The receipt says no token was supplied or captured. |
| All arms exited with the known EOF teardown error, separate from prompt/auth routing; no probe timeout occurred. | **Supported** | Receipt records exit 1 and EOF teardown for all three, no controller timeout, and prompt-level outcomes independently. The producer correctly labels teardown as infrastructure failure rather than treating the two completed prompts as auth failures. Settlement evidence is summarized there; this audit did not repeat process probes. |
| Crew-vault token delivery/refresh, credential identity, POSIX behavior, bundle behavior, and signed-out CLI behavior remain unverified. | **Supported** | These are explicit evidence limits in the receipt and section. Nothing in the observed CLI-owned prompt results establishes them. |

## Trust and findings

The decisive claims use primary evidence: current first-party CLI documentation, installed Crew source, a version/hash-identified native executable, native ACP outcomes, and exact persisted assistant payloads. The receipt is sanitized and contains no token values, account identifiers, or private filesystem paths. The captured hashes and outcome metadata are sufficient for this scoped audit; the private probe material is intentionally not reproduced here.

No unsupported or weak claims found in the new section. Keep the wording that distinguishes callback routing from real Crew-vault delivery; the former is demonstrated, the latter is not. Exit code 1 should continue to be reported as the EOF teardown issue, not collapsed into the prompt result. Audit scope was limited to the new Ticket 186 section, its linked receipt, the cited official ACP page, installed source, and the specifically permitted assistant payloads.
