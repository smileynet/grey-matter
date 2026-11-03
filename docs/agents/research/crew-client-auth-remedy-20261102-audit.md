# Independent audit: Kiro Crew Windows client-auth remedy

**Audited commit:** `9058a48a5fe89aac5f13369eeb8a087b9b74286b`
**Parent:** `569e6662fcaf40cc81605ca30a7048d38e84beb0`
**Overall verdict:** Accept, with the limits below.
**Trust:** High for the observed Windows routing and credential-unavailable path; moderate for using the Crew bundle as the operational remedy because Crew's live vault delivery was not exercised.

## Per-claim audit

| Claim | Verdict | Basis and limit |
|---|---|---|
| Kiro CLI V3 defaults access-token handling to the CLI login; client ownership requires the `client` auth option and a client callback. | Supported | Kiro's [ACP client migration guide](https://kiro.dev/docs/cli/v3/acp-migration/) states the default and the client-owned callback requirement. The report also records matching local CLI help for version 2.37.1. |
| Crew 0.11.1's Windows relay builder omits the auth option for `host_auth=True`, while its CLI-owned branch explicitly selects CLI auth. | Supported | The report records installed source hashes and the emitted argv. The promoted [#186 auth ownership receipt](evidence/kas-auth-ownership-20261102.json) records the same Crew source hashes, the selected CLI hash, and the native omitted/client/CLI comparison. This verifies the installed build under review; hashes alone do not make the installed source independently re-fetchable. |
| The Crew-staged KAS bundle is a supported scoped Crew-owned route using `--auth=acp-callback` and the `agent.kas_bundle=true` configuration. | Supported | The report cites installed Crew resolver/launcher source and installed command help, including the enable/restart sequence. The evidence identifies the pinned bundle/runtime. This is an installation-specific route; the audit did not independently exercise a Crew restart or configuration change. |
| The bundle route emitted eight access-token requests and the controlled credential-unavailable response caused the prompt to fail with `-32000`. | Supported | The retained private probe runner and receipt record the callback count, method, error response, prompt error, and process exit. The probe exercised the staged engine directly, not Crew's gateway or vault callback. |
| The bundle probe had zero tool events. | Unsupported as an observation; corrected | The original receipt said `0`, but the runner did not count tool events. Commit `9058a48` changes this to `"not measured"`. The corrected claim is supported by inspection of the runner and receipt. |
| CLI-owned auth succeeded independently of the bundle probe. | Supported, historical evidence | The promoted #186 receipt records an explicit `--auth-method cli` prompt returning `AUTH_OK`, with zero client token callbacks, on the same CLI executable hash. This was a prior run, not a fresh run for #190; the report says so and makes no identity comparison. |
| No real Crew vault delivery, refresh, or identity match was proved. | Supported | Both the report and receipt explicitly mark these untested. The negative probe supplied no credentials and recorded no callback parameters, token, or account identifier. |

## Exact-commit review and revision

I reviewed `9058a48a5fe89aac5f13369eeb8a087b9b74286b` against parent `569e6662fcaf40cc81605ca30a7048d38e84beb0`. The only change is the receipt field `bundle_negative_probe.tool_events`, corrected from `0` to `"not measured"`. The retained probe did not instrument tool-event counting, so this correction removes an unsupported assertion without changing the reported callback or prompt observations. I accepted the exact corrected commit.

The earlier review required this correction before acceptance. On the corrected commit, I found the Windows route, negative-auth result, CLI-owned comparison, configuration remedy, and stated caveats consistent with their evidence. CLI-owned success remains the historical #186 run tied to the same executable hash; KAS bundle failure is the fresh #190 negative-path probe.

## Scope, privacy, and cleanup

- The proposed remedy is limited to the observed Windows Crew 0.11.1 / CLI 2.37.1 installation. POSIX routing, other releases, standalone bundles, and real Crew vault delivery remain unverified.
- The report records no account switch, login/logout, global credential change, Crew configuration change, or shared gateway restart. It makes no assertion that Crew and CLI identities match.
- The probe's controlled callback returned only a fixed credential-unavailable error. Its runner records callback methods and counts, request outcomes, stderr byte count, and process exit; it does not print or persist callback payloads, tokens, prompt output, stdout, or raw stderr.
- The 12,456-byte private runtime profile was recycled after process exit, and its original path was verified absent. After the reviewer granted cleanup clearance, the worker recycled `.scratch/t190-kas-bundle-probe.py` and `.scratch/t190-source-inspect.py` (7,110 bytes total); both original paths were verified absent.

## Overall assessment

The corrected report is fit to support the ticket's scoped finding: the omitted flag routes to CLI-owned auth, and Crew's installed KAS bundle offers a separate, Crew-owned callback route whose credential-unavailable behavior was exercised. It does not establish successful real-vault delivery, identity equivalence, or portability beyond the tested Windows installation. Those are stated as limits rather than implied outcomes.
