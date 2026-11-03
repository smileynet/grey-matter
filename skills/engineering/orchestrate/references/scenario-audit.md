# Outcome trace scenario audit

Use this read-only audit before parent settlement when a deterministic outcome trace is
available. The orchestrator must create the expected-identity file independently from the
trace and retain it with the recorded dispatch contract:

```powershell
node skills/engineering/orchestrate/scripts/audit-outcome-trace.mjs .scratch\parent-expected-identity.json .scratch\outcome-trace.json
```

Record the checkout and candidate from Git, and the trace digest from its exact bytes, before
writing that parent-owned expected file:

```powershell
git rev-parse --show-toplevel
git rev-parse HEAD
(Get-FileHash -LiteralPath .scratch\outcome-trace.json -Algorithm SHA256).Hash.ToLowerInvariant()
```

The expected JSON has exactly these fields:

```json
{
  "version": 1,
  "root": "<absolute registered repository root>",
  "candidateCommit": "<full current HEAD SHA>",
  "traceSha256": "<SHA-256 of exact trace bytes>",
  "maxAgentSlots": 4,
  "criticReserve": 1
}
```

The audit verifies that the current Git root and HEAD match those parent-owned values, that
the trace hash matches, and that each trace evidence path is a regular non-symlink file below
the repository root with the declared SHA-256. It accepts no commands or unknown JSON fields.
Its result contains the root, candidate, checked evidence hashes, event count and a compact
summary of the recorded frontier, stop, monitor and publication states. It performs no writes,
ticket operations, sends, retries, network/native calls, publication, or cleanup.
Expected identity and trace files are limited to 1 MiB each; each referenced evidence file is
limited to 32 MiB. Run from the intended Git checkout so the observed root and current HEAD
can be compared to the parent-owned identity.

The trace is JSON with version 1, the same `candidateCommit`, `evidence: [{path, sha256}]`,
and an ordered `events` array. Each event includes `evidence: ["path/from/top-level/evidence"]`;
every reference must match a file whose actual bytes pass the declared hash. The first event
is `contract: {type, revision, scope, evidence}`. The remaining strict event shapes are:

- `batch-complete: {type, batch, evidence}` and `frontier: {type, items:[{ticket,state,inScope}], evidence}`;
- `scope-revised: {type, revision, included, evidence}` and
  `scope-cancelled: {type, ticket, revision, evidence}`; cancellation advances revision;
- `dispatch: {type, ticket, revision, workers, critics, criticsReserved, evidence}`;
- `review: {type, candidateCommit, revision, verdict, evidence}` (`PASS` or `BLOCK`), then
  `accept` and `integrate` records with the same `candidateCommit`, current `revision` and
  `evidence`;
- `completion-replay: {type, id, result, contentHash, recordsBefore, recordsAfter, evidence}`;
- `monitor: {type, confirmed, state, action, evidence}`; a state without confirmation is reported as
  unknown, and recreation is rejected;
- `usage-limit: {type, limit, reset, fallback:"off", evidence}`, `checkpoint: {type, candidateCommit, evidence}`, and
  `stop: {type, reason, evidence}`;
- `publication: {type, candidateCommit, result, evidence}` (`failed`, `published`, or
  `not-attempted`); and
- `outcome: {type, work, verification, cleanup, delivery, evidence}`, using the separate states in the
  outcome contract.

The expected resource values are supplied outside the trace: `maxAgentSlots` is the observed
live slot cap including the parent conductor, and `criticReserve` is the required reserved
critic count. For each dispatch event, `workers` is the total active worker count at admission,
`critics` is the active critic count and `criticsReserved` is the total simultaneous reserved
critic capacity; active critics must fit inside the reservation, and `1 + workers +
criticsReserved` must fit the cap (the `1` counts the parent).

The auditor rejects an unreconciled batch, completion claims that hide open/blocked in-scope
work, dispatch under stale scope or after cancellation/usage stop, capacity overruns or
unreserved critic capacity (reserved critics count against the resource cap), acceptance without a PASS for the exact candidate, integration
without acceptance, changed/duplicated replay claims, monitor recreation, and delivery claims
that conflict with publication failure. Once failure is recorded, a later not-attempted value
cannot erase it. A blocked frontier remains incomplete. A clarification
advances the scope revision before later admissions. Usage-limit traces require the exact
observed limit/reset, an explicit `fallback:"off"`, checkpoint and terminal stop.

Each frontier must list every current-scope ticket exactly once with `inScope:true`; duplicates,
missing IDs and false scope flags fail. A delivered outcome requires every current-scope ticket
to be `done`, the expected candidate integrated under the current revision, and passing
verification. Scope changes invalidate earlier review/acceptance/integration bindings. A new
review, including a `BLOCK`, invalidates earlier acceptance and integration for that candidate
and revision; a later PASS needs a fresh acceptance and integration.

The output is a consistency check of parent-supplied observations. Trace events, owner names,
review verdicts, monitor confirmations, and check-result contents are attestations; file hashes
prove only byte identity. The audit does not establish that a person or native harness performed
the event, that a reviewer was independent, that a claimed check actually ran, or that a native
goal/wakeup persisted. Do not construct a trace after the fact and present it as live behavior.
Use actual helper receipts where available: #204 dispatch preflight, #205 publication preflight,
and the #208 session-message spool. #208 replay can be verified from the persisted spool record;
`replay-unchanged` itself does not retry native delivery. This fixture does not qualify native
adapters or expand current security holds.

Run the deterministic scenario fixtures and the underlying mechanical regression suites with:

```powershell
node --test skills/engineering/orchestrate/scripts/scenario-recovery.test.mjs
node --test skills/engineering/orchestrate/scripts/preflight-dispatch.test.mjs
node --test skills/engineering/orchestrate/scripts/session-messages.test.mjs
node --test skills/productivity/delivery-dashboard/scripts/preflight-publication.test.mjs
```

The tests use owned temporary Git repositories, session roots and sidecar packets; they remove
only those test-created artifacts. The existing project fixture `scripts/spike-orchestrate-fixture.mjs`
is intentionally not modified. Deterministic coverage is not a model-tier benchmark or a
native persistence/delivery qualification. The parent-owned bounded live delivery session and
the separate #179 native canary remain distinct evidence.
