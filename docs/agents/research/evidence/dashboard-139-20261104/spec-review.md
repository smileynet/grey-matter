# #139 independent Spec review, revision 2

Exact candidate: `ae80da8931121cf2b214d253f782f5eed9a9f230` on `codex/custom-dashboard-139`, base `f7002cc1c265a887998238689a873ad2bc028ba5`. The ticket was reread before reviewing this revision. Parent dispatch preflight reports PASS for the same nine scoped paths; result: `parent-verification.md`.

## Verdict: PASS on implementation scope; integrated acceptance evidence remains pending

The two Standards findings are addressed in the revised source and regression suite:

- CLI `--repo` without a following project root, or with another option in its place, exits with usage error 2 instead of silently running local-only validation. The new CLI regression asserts this failure.
- Template-only `role="tablist"`/`id="q"` shell checks and template script execution are skipped when a declared custom contract is used. The custom fixture uses a different shell and still passes declared-data validation. I inspected the code and the updated custom fixture/test evidence.

The earlier scope review remains valid for the full candidate: custom hook and migration guidance; template/custom valid and seeded-invalid cases; complete authoritative ticket set/facts/frontier/current body identities; strict read-only maintained-plan check; authored Plan ordering and terminal history; searchable all-entry history with overview capped at five; custom refresh adapter semantics; preserved close → sync → refresh → publication path; no auto-repair or blanket closure hook; and retention of the receipt amendments.

The revised worker records 56/56 focused tests passing with zero skips. Earlier worker records cover the 252-ticket snapshot/full comparison, zero-finding plan check and isolated native-tkt fixture matrix. The browser test remains an **infrastructure error before tests** because Playwright was unavailable; it is not a pass. Parent-owned integrated browser/UI checks, repository gates, receipts/publication evidence, and live-renderer adoption remain outstanding and must be completed before closure. The hook describes data semantics; it cannot establish actual custom DOM visibility, accessibility, or interactions.

No remaining source-scope defect found in this revised candidate. This is a review of the stated candidate and its recorded evidence, not an independent rerun of the gates or visual inspection. The previously disclosed broad embedded-dashboard search output-limit gap remains a coverage limit, not an absence claim.

Publication copy: ephemeral evidence locators replaced with durable evidence references; original retained privately.
