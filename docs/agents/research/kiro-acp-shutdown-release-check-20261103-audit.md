# Independent audit: Kiro ACP shutdown release recheck (2026-11-03)

## Scope and provenance

Audited the Nov 3 release-check section in [the findings](kiro-acp-shutdown-20261102.md) and its [receipt](evidence/kiro-acp-shutdown-release-check-20261103.json) in the correct checkout, `D:\code\grey-matter`. Their SHA-256 values are respectively `DBBA0A7D547AA555EC57F0BCCEC99B72FC3E8DD68C02F8FB62625FD0E799C532` and `A8CB845B2ACE8EB41570A2487015EC0534DCB24C5B95C6B5EADE3E48B81ABDC4`.

The audit independently re-fetched official sources on 2026-11-03. Direct read-only PowerShell fetches of the [Windows installer script](https://cli.kiro.dev/install.ps1) and [stable latest manifest](https://prod.download.cli.kiro.dev/stable/latest/manifest.json) returned HTTP 200. SHA-256 of fetched content: installer `2AF3E4BB56F4FCCE9244FE2F395805A5CF383CE683774664BCB444417EAE1D3E`; manifest `CAD42AC65C616B9D9F25804141BEFEA8AA54E95F3CCD6BA2BC419519D50D3419`. The installer script selects the stable latest manifest and Windows x64 MSI; the manifest version field is `2.37.1`. The installer was not executed and no artifact was downloaded.

## Per-claim verdicts

| Claim | Verdict | Audit note |
|---|---|---|
| Installed CLI reports 2.37.1 and its executable/package metadata hashes are as recorded. | weak (for this auditor) | The receipt records exact values, but I did not inspect local installed binaries or package metadata. These are producer observations, not independently reproduced here. |
| Current official stable manifest is still CLI 2.37.1, and installer source points at that manifest. | supported | Fresh first-party source fetches and byte hashes above. Installer script is source wiring, not installation evidence. |
| Official CLI changelog tops out at 2.37.0 and contains no applicable shutdown fix. | supported, bounded | Fresh [CLI changelog](https://kiro.dev/changelog/cli/) says Oct 30, 2026 / 2.37.0 is the latest visible CLI entry and lists agent-upgrade/ACP-sign-in changes plus unrelated fixes. It does not list an EOF shutdown fix; silence cannot prove none exists elsewhere. |
| V3 migration documentation still has no V3 equivalent for V2 terminate and no new applicable shutdown sequence. | supported, bounded | Fresh [ACP V3 migration guide](https://kiro.dev/docs/cli/v3/acp-migration/) lines 523–554 maps `_kiro.dev/session/terminate` to no current V3 equivalent and says `session/cancel` is for stopping an active turn. No process teardown remedy appears in the guide. |
| GitHub releases page has no published releases. | supported as a page observation | Fresh [repository releases page](https://github.com/kirodotdev/Kiro/releases) says there are no releases. It is not the authoritative CLI stable feed. |
| Issue #6050 is not a verified fix for this Windows V3 behavior. | supported | The [open issue](https://github.com/kirodotdev/Kiro/issues/6050) describes macOS arm64, Kiro 1.26.1, SIGTERM orphaning; it is materially different from the Windows 2.37.1/KAS 0.66.70 EOF timeout. |
| Versioned stable feed could not be freshly fetched through the web reader; cached feed was not substituted. | supported as reported | Fresh open attempt to `https://prod.download.cli.kiro.dev/stable/2.37.1/feed.json` returned an internal retrieval error. No cached feed was inspected. |
| No qualifying newer supported stable bundle or applicable documented fix was found in checked sources. | supported, bounded | Manifest, changelog, migration guide and releases page align. Does not rule out private/preview builds, separate KAS release channels, unlisted fixes or undocumented behavior. |
| Prior runtime failure remains current; a retest was unnecessary. | weak as a new runtime claim; decision supported conditionally | This release audit did not run Kiro, ACP, a model prompt or inspect sessions. The producer receipt says installed CLI/KAS match the previously tested versions and correctly records `not_run`; the older runtime evidence remains the Nov 2 report, not a result of this audit. |

## Verdict

**Trust: 0.91 (high for the bounded release/documentation recheck; not a runtime qualification).** No qualifying candidate appeared in the checked official stable feed or lifecycle documentation. The conditional retest prerequisite was therefore not met; not rerunning is consistent with the stated request and receipt. Keep the claim scoped to checked sources. The receipt appropriately records that private/preview releases and a separate supported KAS upgrade were not exhaustively established, and that this is not fresh runtime reproduction.

## Findings for producer

- No substantive citation mismatch found. The direct manifest confirms 2.37.1; the current migration guide supports the terminate/cancel claim; current CLI changelog and GitHub release page support their bounded observations.
- Retain the explicit limits: no separate KAS upgrade path established, no exhaustive private/preview search, and no runtime retest. Do not describe this audit as fresh proof that the installed pair still fails.
- Prior runtime hashes/versions are producer-observed receipt facts; this independent audit verified the release decision sources only.
