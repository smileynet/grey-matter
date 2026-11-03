# Publication preflight

Run this read-only check immediately before a separately authorized Site publication:

```text
node <delivery-dashboard-skill>/scripts/preflight-publication.mjs <parent-expected-identity.json> <publication-packet.json>
```

The orchestrator owns `parent-expected-identity.json`; do not accept it from the worker or
derive it from the packet being checked. It binds the packet bytes, repository root,
candidate commit, expected accepted receipt ID, check-attestation bytes and the list of
required check IDs:

Use the helper's bounded read-only hash command to capture the packet and attestation
hashes for that parent record:

```text
node <delivery-dashboard-skill>/scripts/preflight-publication.mjs --hash-file <publication-packet.json>
node <delivery-dashboard-skill>/scripts/preflight-publication.mjs --hash-file <check-attestation.json>
```

The hash command reads one regular file up to 1 MiB and returns its canonical path, byte
length and SHA-256. It does not establish who created the file or whether its claims are
true; the parent still records the expected values independently.

```json
{
  "version": 1,
  "root": "<absolute repository root>",
  "candidateCommit": "<full candidate commit SHA>",
  "packetSha256": "<SHA-256 of exact packet file bytes>",
  "receiptId": "<expected accepted receipt ID>",
  "checkAttestationSha256": "<SHA-256 of exact check attestation bytes>",
  "requiredChecks": ["dashboard-contract"]
}
```

The packet supplies paths and a one-to-one source/package inventory:

```json
{
  "version": 1,
  "root": "<absolute repository root>",
  "candidateCommit": "<same full candidate commit SHA>",
  "dashboard": { "manifest": "review-manifest.json", "receipt": "review-receipt.json" },
  "package": {
    "directory": "publication/site-package",
    "files": [{ "source": "site/index.html", "packaged": "index.html" }]
  },
  "checks": { "attestation": "publication/check-attestation.json" }
}
```

The check attestation is JSON with version 1, the candidate commit, and results. Every
result has an `id`, `outcome`, matching `candidateCommit`, and `output: {path, sha256}`.
Only `outcome: "pass"` is accepted. Each output file's actual bytes are hashed and compared
with the recorded SHA-256. Every ID in the parent-owned `requiredChecks` list must appear.
The output files and the attestation itself should be retained with the candidate's review
evidence.

The helper checks that the current Git HEAD matches both identities, invokes the existing
read-only `review-receipt.mjs` API to verify the accepted receipt is still current, and
requires the receipt to include every mapped source file without a metadata projection. By
default it compares every materialized package file byte-for-byte with its source blob at the
candidate commit and rejects missing or extra assets. The packet must be hash-bound by the
separately owned expected identity. Pass output reports the candidate, receipt ID, sorted
package inventory and digest, check IDs/output hashes, and `checksAreAttestations: true`. Any
mismatch exits nonzero with an error on stderr.

One deterministic transformation is supported for the current orchestration dashboard Site
payload. Set `package.transform` to exactly
`{"kind":"grey-matter-orchestration-dashboard-links"}` and map exactly
`docs/orchestration.html` to `index.html`. The committed source must be included as an
unprojected source in the review manifest. The helper computes the payload from that committed
Git blob: `gm-findings` relative source hrefs and `gm-tickets` file paths resolve against the
fixed base `https://github.com/smileynet/grey-matter/blob/main/docs/`, while existing HTTP(S)
finding links are retained; literal `href="plan.md"` links resolve to that base plus
`plan.md`. JSON blocks are serialized with `<` escaped as `\\u003c`, matching the existing
dashboard exporter. The actual materialized `index.html` bytes must equal those computed
bytes. The base, mapping, transform kind and arguments are fixed; additional fields, mappings,
or transform kinds are rejected. The parent binds the whole packet in its expected identity.

Check records are attestations, not proof that a command ran: this helper does not execute
commands or inspect output semantics. The orchestrator must retain the actual command
output and candidate binding; a claimed pass record alone is not verification. The expected
identity is an operational trust boundary, not a cryptographic signature. Only the parent
may supply it from the recorded integration/publication contract.

Package verification supports a materialized directory of exact source copies or the one
fixed dashboard link transform: up to 1,000 files, 32 MiB per file and 128 MiB total. It does
not verify ZIP/archive metadata, other transformed build outputs, remote Site state or what a
publisher later uploads. Run this check immediately before
publication and ensure the publisher consumes the reported directory/digest. It performs no
Site calls, network operations, credential handling, publishing or authorization. Keep the
existing Site audience and credential route; inspect actual deployment output to establish
delivery. Local files created for checks remain subject to the repository artifact lifecycle.

Regression fixtures:

```text
node --test <delivery-dashboard-skill>/scripts/preflight-publication.test.mjs
```
