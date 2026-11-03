# Reproducible model-evaluation seed

The model runner now creates its fixture from checked-in bytes. It does not run
the general orchestration fixture generator or the host's `tkt init`, so dashboard
templates and installed tooling cannot silently change the comparison input.

## Observed source drift

The retained baseline's Git tree is
`c474646ea61e037fcdbc1be3d2dc6c0833f5e260` (seed commit
`7f8009961f27eb901e23674cb9af1963b49b6bf4`). Before this repair, the general
generator produced different trees on this host after project maintenance.
Earlier preflight observed `d1ae7bc7028f238f8207b2eec31f9d0ba5e1f40e`; the
current post-update generator produced `3d9286d7fb8785018f070d945ff4533a36fb3a7d`.
Comparing the current generated workspace with the retained seed shows one changed
file: host-generated `AGENTS.md`, from 3,326 bytes to 3,426 bytes. An earlier
generator run also picked up the changed delivery dashboard. These are two ways
the live generator depended on mutable checkout and CLI inputs.

## Frozen input and checks

The seed manifest at `scripts/fixtures/model-eval/seed-files.json` records the
source commit/tree, each frozen file and its SHA-256. It embeds 5,807 bytes for
the other fourteen files and points to the existing 45,998-byte dashboard
snapshot `scripts/fixtures/model-eval/seed-status.html`, SHA-256
`f2c67d3e24d057be82d19c70b95ce1eaa6fd9afaf28bd7501e86d4a82474a12f`. Together
(the 15 files total 51,805 bytes). Each asset is checked against the manifest
before writing. The JSON manifest is 8,779 bytes and contains no personal home
paths or credential assignments. The runner stages the fresh fixture and rejects unexpected files
(including ignored files), verifies the complete Git tree, and only then starts
the native CLI. A mismatch stops setup before any model call.

`node --test scripts/spike-model-eval.test.mjs` passed 15/15 tests in 3.44
seconds on Windows. Its integration case uses Node as a harmless fake Claude
executable: the generated fixture reaches the native invocation point and the
attempt is classified as an agent-process failure; it confirms the pinned tree
and verifies an unrelated staged file is rejected. No provider was invoked.

The source snapshot comes from the retained synthetic #174 fixture. It contains
the planted task tickets and project guidance; it does not contain user project
files or account credentials. Keep the 45,998-byte dashboard as benchmark input
in ordinary Git. Test-created temporary worktrees use the test file's existing
cleanup hook. Historical #174 native-run provenance remains unchanged; this fix
validates fresh fixture construction only.
