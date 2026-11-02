# Kiro Crew ticket-state validation

Ticket 95; 2026-11-01, America/Los_Angeles. Guidance commit `9263741`.
[Native transition receipts](evidence/kirocrew-ticket-state-20261101.json) preserve
the independently read gateway tags and ledger fields.

## Method and observations

The installed Kiro Crew 0.11.1 backend ran an isolated loopback gateway using
`gateway --test-mode --no-tunnel --no-crons` with a disposable data home. The
normal gateway was not listening. No existing chat, global configuration, trust
mode or tag policy was modified. The backend reported installed kiro-cli 2.37.1.

A local Git/tkt fixture had one ticket and no remote, with tkt pushes disabled.
The controller ran actual tracker operations; the owning Kiro Crew chat read the
shared harness reference and invoked native tools to mirror the verified results.
It was instructed to perform no shell, source or permission changes.

| Verified source state | Native tool effects independently read back | Outcome |
|---|---|---|
| `tkt claim 1` succeeded | `implementation` tag; ledger goal identifies ticket 1, phase `implementation`, next `Verify marker.txt`, ticket path in artifacts | pass |
| Parent waits for human marker acceptance | `review` tag; ledger phase `review`, next `Await marker acceptance` | pass |
| Marker asserted, committed in `444ffdb`, then `tkt close 1 --check-all` succeeded | `done` tag; ledger phase `done`, next `No remaining action`, same ticket artifact | pass |

Verification used read-only `GET /api/chat/slots` and `GET /api/session-ledger`
for the controller-created chat. Assertions checked all three state tags, ledger
phases, ticket identity/path and nonempty next actions. All passed. The fixture
close checked its sole acceptance criterion; there was no application build.

The first restricted custom profile exposed neither state tool. The agent read
the reference, skipped both unavailable calls and accurately reported no applied
state. An unrelated skill-disclosure request was rejected once; no approval mode
was widened. Reloading the restricted profile did not expose the tools. The
positive case selected the installed `kirocrew` role in this disposable chat,
with requested model `claude-haiku-4.5`. Its native core server mounted and both
tool calls applied without pending approvals. This establishes the live absent-
tool guard and the configured native-tool path, not a claim that the custom MCP
profile mounted successfully.

## Static checks and review

- **Pass:** `node scripts/check-docs-consistency.mjs`: all 50 skill routes and
  relative links resolve, with no new scratch citations.
- **Pass:** `node scripts/check-skill-syntax.mjs`: 50 skills/37 sidecars, no errors.
- **Pass:** `node scripts/check-invocation-policy.mjs`: 20 user-invoked skills;
  no invocation policies changed.
- **Pass:** `node scripts/gate.mjs pre-merge --base 6dd1df825e52e5d77008f19c9c0ec12939012219 --include skill-syntax-fixtures`:
  the selected syntax-fixture check passed (10 fixtures).
- **Pass:** `node scripts/gate.mjs pre-push`: all five selected checks passed:
  plugin manifest, syntax, invocation, documentation links and home-path screen.
  The normal push repeated those checks.
- **Pass:** fresh independent Standards and Spec reviews of `9263741` found no
  confirmed issue. Shared instructions stay in a harness reference; the portable
  skills contain only conditional pointers.
- **Pass:** staged artifact inspection covered four text files, 16,670 logical
  blob bytes, with complete coverage and no findings.

## Footprint and cleanup

The isolated gateway automatically downloaded `qwen3-embedding-0.6b.gguf`
(639,150,592 bytes). The probe measured about 643 MB total, crossing the 500 MiB
threshold; the artifact-hygiene footprint inspector was run. It reported an active
ticket/quiet-floor skip and unavailable open-file coverage, not deletion approval.
The artifacts were all created for this probe; no peer data was selected.

The small report above was promoted before cleanup. Native `stop --port <port>`
requested graceful shutdown; the gateway exited 0 and its port no longer listened.
The owned probe tree, including model, fixture, private startup credentials and
helper files, was moved to the Windows Recycle Bin after final verification:
643,243,374 bytes. The D: Recycle Bin had a 97,433 MiB cap and permanent deletion
disabled; the resolved target and absence of an active listener were checked.
The existing generated AGY bundle remains shared deployment output, not probe
scratch. Free space stayed above 94 GiB on D: and 132 GiB on C:.

Limits: this is a real native-tool integration probe plus static pointer checks,
not a full source-editing orient/implement run. It did not exercise a human-only
tag refusal, ledger persistence across gateway restart, or a half-present tool
pair. Those branches are documented from the tool schemas/handlers; they are not
reported as live passes here.
