# Final release candidate audit — 2026-10-29

**Go for staging grey-matter 0.2.0 and tkt 0.5.0 from the re-prepared candidates below.**
No tag, GitHub release, registry publication, stable promotion or plugin-directory
submission was performed. This audit supersedes the [2026-10-24 audit](final-release-audit-20261024.md)
for these versions; that audit and its frozen review branch remain the record of the
earlier candidates. It does not authorize publication.

## Why these candidates replace the 10-24 pair

On 2026-10-28 the user chose to prepare grey-matter 0.2.0 again from main rather than
publish `e071b7b`, which main had passed by 91 commits (no `data-modeling`,
`repository-artifact-hygiene` or later work). Neither version was ever published, so the
approved versions stand ([release contract](../release-contract.md)). The first grey
re-candidate `1efb247` failed the Windows product gate on two artifact-hygiene tests
(ticket 99, fixed in `a4db04a`) and is superseded. grey-matter's deploy engine had
changed since tkt `2b6ff17` vendored it, so the user approved preparing tkt 0.5.0 again
from tkt main, with all open tickets in both repos deferred.

## Exact candidates

| Product | Source | Candidate | Branch |
| --- | --- | --- | --- |
| grey-matter 0.2.0 | `a4db04a95ed4779849fd380613cd58564ee16daf` | `05792a71c7e936b3ed26a623933bbfa224d7b93c` | `codex/release-grey-matter-0.2.0-a4db04a9` |
| tkt 0.5.0 | `c4d2ad5469f19a0be5e4ff91566f7163b6a87b43` | `a827bb6f264ad2ef73157fd8c0a471cb78e634fe` | `codex/release-tkt-0.5.0-c4d2ad54` |

Both were prepared with `release.mjs prepare --execute` from clean sources (tkt from a
fresh clone, because the working checkout holds another tool's untracked state). Both
candidates vendor the same deploy engine (`deploy.mjs` SHA-256 `5520d008…`).

| Archive | SHA-256 |
| --- | --- |
| grey-matter-0.2.0-codex.tar.gz | `c572795a255efd51f1add3efc220dac1b72bbc911d292665672ca36378d2f22c` |
| grey-matter-0.2.0-claude.tar.gz | `79ec922ebcf8fa2879554b76eb6c1d32caa76f253e7fb7490aca8ea0a7879fdf` |
| grey-matter-0.2.0-agy.tar.gz | `3eb739ea80b4781123b0b6cb2a779763077bfa73ae653cac7e3c3e30be933921` |
| tkt-0.5.0-codex.tar.gz | `c9744e2dc222027574f0aea17b4173939fe9456662b35c2b2992de0482022c62` |
| tkt-0.5.0-claude.tar.gz | `7a37c301d9e2cbff4fdb0da0e6bf0920beedd6fe0d280bd244931f71c0e4cf0a` |
| tkt-0.5.0-agy.tar.gz | `e1a3399f2494c0bfe7f92c38a49c36231e8befaa89b333c61860696fce5b722c` |

## Evidence

[L1:verified] [Cross-platform summary](evidence/release-validation-20261029.json), built
from the result files themselves, with one raw archive per platform:

| Platform | Product and native gates | Harness probes |
| --- | --- | --- |
| Linux, randomserver x86_64 | Pass for both; all 16 grey check groups; Codex, Claude and agy loading | Codex, Claude, agy, Kiro, bare/OpenCode and Crush pass ([archive](evidence/linux-evidence-20261029.zip)) |
| Windows, SharkTank x64 | Pass for both; Codex, Claude and agy loading | Codex previous-release upgrade passes: 53 skills, foreign skill kept, repeat identical ([archive](evidence/windows-evidence-20261029.zip)) |
| macOS, SpaceJam arm64 (26.6.2) | Pass for both under a loopback-only sandbox | All six probe groups pass ([archive](evidence/mac-evidence-20261029.zip)) |

Every report names the exact candidate SHA. The probes are the reviewed 10-24 probes,
retargeted to these candidates with assertions unchanged except the expected catalog
size, which rises from 51 to 53 (48 grey-matter skills, four tkt skills, one foreign
sentinel). Each archive includes the probe sources and the exact edits.

[L1:verified] tkt CI: build-only stage run
[40822712451](https://github.com/smileynet/tkt/actions/runs/40822712451) on the exact
candidate. `readCiStage` checked run, attempt, seal job, artifact identity and upload log,
then all 16 sealed assets including the crate ([provenance](evidence/tkt-candidate-stage-a827bb6-20261029.json)).
The CI x86_64 Linux binary reports `tkt 0.5.0 (a827bb6)`. Run against it, the
CLI-surface check finds every one of 386 tkt invocations in 42 skill and guidance files
valid across 21 commands. The only exceptions are the two flags `migration-assist.md`
already marks as planned. The tag-context check scopes and restores context correctly.

## Plugin contracts

No manifest, marketplace, hook or legal file changed in grey-matter between `e071b7b`
and `05792a7`. The changes are skill content and two new skills. tkt's only contract-file
change is the `plugin.json` description string. The 10-24 primary-source reviews
([Codex](final-plugin-codex-20261024.md), [Claude](final-plugin-claude-20261024.md),
[Antigravity](final-plugin-agy-20261024.md)) therefore still describe these contracts.
The native validators and catalog probes above re-ran against the new archive bytes on
all three platforms.

## Findings and disposition

| Finding | Disposition |
| --- | --- |
| Artifact-hygiene tests failed on Windows (newline filename, path separators) | Fixed in `a4db04a` (ticket 99, closed with evidence); candidate re-prepared. |
| tkt's vendored deploy engine lagged grey-matter's | tkt re-prepared from tkt main; both candidates now carry the same engine. |
| tkt clone line endings broke tests on Windows | Test-setup error. The clone uses `core.autocrlf=false`, as on 10-24; not a product defect. |
| Installed Kiro 2.35.1 refuses an unauthenticated session | Vendor change. The credential-free probe used the notarized official Kiro 2.34.0 build, the version pinned on Linux. Future runs need that pin or a credentialed variant. |
| Main moved past the candidates after preparation | grey `bca9a2a` and tkt `752b14c` make `deploy check` stricter for maintainers; tkt `dd559e5` adds a catalog icon. None changes installed behaviour. They stay unreleased and are not in these candidates. |

## Scope

Included: everything on grey main at `a4db04a` and tkt main at `c4d2ad5`, as listed in
each release-note draft. Deferred by the user's 2026-10-28 instruction: every open ticket
in both repos. For grey-matter these are 82, 83, 85, 87, 88, 89, 90, 92, 94, 95, 97 and 98;
tkt has none open. None is a release blocker: each is later improvement or
machine-specific cleanup, and none changes what these archives install. crates.io
still reports tkt 0.5.0 absent (HTTP 404 on 2026-10-29). Absence is not a reservation,
so publication must check again.

## Limits

Staging readiness only. Catalog checks show skills load; they do not prove every model
activation or authenticated interactive hooks. Network isolation was enforced on macOS
only. Windows and Linux used disposable homes and an environment allowlist. Measured
clients: Codex 0.147.0 (Windows), 0.164.0 (macOS), 0.165.0 (Linux); Claude 2.1.310–2.1.311;
Antigravity 1.4.6; Kiro 2.34.0; OpenCode 1.18.21; Crush 0.98.1. Other versions need their
own check.

## Decision

**Go for staging.** No unresolved release defect remains in the measured scope and no
platform waiver was used. The review carrier must bind both identities, the six
archives, both note drafts, tkt's CI identity, annotated-tag records and six receipts per
product, and must pass its own `verify.mjs` at the review commit.
