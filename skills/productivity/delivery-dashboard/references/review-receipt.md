# Review the source that will ship

Use a review receipt when a project requires critic acceptance of UI work. It binds the review to declared source files, actual capture bytes and viewport identities. It supplements visual inspection; it neither inspects a screen nor authenticates a reviewer.

## Before closure

1. Settle the implementation, run the affected checks and capture the actual rendering at supported laptop/phone sizes. Inspect the important path, labels and clipping, not merely whether the DOM contains every item. Label synthetic, mocked and live evidence honestly.
2. Declare the rendering-input scope and captures in a manifest. The reviewer confirms that the scope includes the inputs that matter. The helper traverses declared directories and detects membership changes; it does not discover imports or a build graph. Keep the manifest and receipt outside source directories that would include the receipt itself.
3. Create a pending snapshot using [the receipt helper](../scripts/review-receipt.mjs). Give the critic its returned snapshot ID, manifest, source and captures. Acceptance must name that ID and describe what was inspected.
4. Record acceptance only while the source, manifest and captures still match that snapshot. Check it immediately before closing the ticket and before publishing that implementation. A changed rendering input requires affected checks, fresh captures and renewed review; create another receipt rather than overwriting the earlier one.

A checker pass establishes byte identity and the recorded attestation. Whether the interface communicates clearly remains a critic judgement. A viewport in the manifest is reported capture context, not proof that a browser used it.

## Reconcile before renewing review

After upstream or ticket reconciliation, run `inspect` against each affected view's
existing manifest and receipt before recapturing. It compares the existing receipt's
source/capture inventory with current bytes and reports added, removed and changed
paths, plus manifest scope changes. It writes nothing and creates no new identity.

`reusable: true` means the receipt is accepted for its exact current inputs and
captures. Reuse that acceptance; unrelated files outside its declared scope do not
require another review. `reusable: false` exits nonzero: use its changed paths to
choose affected checks, fresh captures and a new exact-snapshot review. Missing or
unreadable inputs remain errors, not unchanged evidence. Pending acceptance cannot
be reused even when no bytes changed.

Declare independently reviewable views in separate manifests and receipts. A
changed input invalidates every receipt that includes it; a shared stylesheet can
invalidate several views. Independence is a scope-review judgement, never inferred
from filenames. Do not trim a manifest after a change to preserve acceptance.
Required publication checks still validate every receipt and source they depend on.
Inspection does not discover undeclared dependencies, validate whole-board freshness,
inspect the rendering, renew acceptance or authorize publication.

## Record what the evidence says

The receipt binds declared source and capture bytes to one snapshot. In the review note,
record each material check compactly with its observer, surface, scenario, outcome and
limits. Distinguish `tool observed`, `person reported`, `blocked`, `unavailable` and
`unvalidated`; source/metadata checks do not establish rendered behavior, and a human
report is not a tool observation. Do not infer a pass from a blocked action or absent
telemetry, and do not try another route to bypass a blocked protocol.

| Scenario fixture | Record | Claim boundary |
| --- | --- | --- |
| Direct file navigation is blocked by the permitted browser protocol | `artifact: <receipt snapshot ID>; observer: tool; surface: browser; scenario: open the local output; outcome: blocked; limits: navigation denied, no alternate route attempted` | The opening check is blocked; file-opening behavior is unknown. |
| Resource timing telemetry is unavailable | `artifact: <receipt snapshot ID>; observer: tool; surface: browser performance panel; scenario: read resource timing; outcome: unavailable; limits: timing API not exposed` | No timing result or performance pass is established. |
| A person confirms the file opens and functions | `artifact: <receipt snapshot ID>; observer: person (identify); surface: local file viewer; scenario: open and use the output; outcome: reported working; limits: agent did not observe the interaction` | This is a human functionality report, not tool-verified behavior; learning effectiveness remains unvalidated. |

Keep the note within the accepted snapshot's review record. If the human report or other
check must remain independently traceable, include its durable record in the declared
source scope so the receipt digest covers it. Retain limits even when another check
resolves the user's immediate question.

If no permitted capture exists, record the blocked or unavailable check in the ticket or
report and leave explicitly required critic acceptance pending. Do not create a receipt with fabricated
captures or treat a human report as the missing tool observation.

## Evidence limits and required acceptance

An unavailable observation limits the claim; it does not by itself create an owner task or
approval gate. Required acceptance comes from the project or ticket contract. Preserve
those requirements when evidence is missing, and keep ordinary feedback preferences separate.

| Scenario | Disposition |
| --- | --- |
| A routine board/content refresh keeps the renderer unchanged; browser access is blocked and the owner gives feedback during use. | Run applicable source/data checks, record the rendering limit and preserve the preference. No unsolicited owner-review ask or new completion gate. No rendered pass is claimed. |
| A UI ticket explicitly requires phone captures and critic acceptance, but the permitted capture surface is unavailable. | Keep that acceptance unresolved on its owner; record the missing evidence. Do not waive the criterion, fabricate a receipt or turn a human report into tool observation. |
| A dashboard review ask has been answered with feedback during normal use, then entries are regenerated. | Preserve the answered state and answer; keep it out of pending asks. The unknown rendering result stays a limitation, not a reopened task. |

## Declare the scope

Paths are relative to one explicit repository root. Files and directories are supported; globs, escaping paths and symlink traversal are rejected. Captures remain in the project rather than being copied into the receipt.

```json
{
  "version": 1,
  "subject": "Ticket 17 editor review",
  "sources": ["src", "styles", ".tickets/17-editor.md", "docs/status.html"],
  "metadata": [
    {"path": ".tickets/17-editor.md", "kind": "ticket-lifecycle", "reason": "Closure state and resolution bookkeeping"},
    {"path": "docs/status.html", "kind": "ticket-snapshot", "reason": "Only generated ticket lifecycle data may change after closure"}
  ],
  "captures": [
    {"path": "docs/evidence/editor-laptop.png", "viewport": {"width": 1280, "height": 800}},
    {"path": "docs/evidence/editor-phone.png", "viewport": {"width": 390, "height": 900}}
  ]
}
```

The two fixed metadata projections are deliberately narrow:

- `ticket-lifecycle` is restricted to `.tickets/*.md`. It normalizes the frontmatter status, acceptance-criteria checkbox marks and the conventionally headed final Resolution section. Requirement text, dependencies, titles and other sections remain reviewed source.
  Cancelled is a known status, but Cancellation prose remains reviewed source;
  appending or changing it requires a new receipt rather than a broader exclusion.
- `ticket-snapshot` supports a JSON ticket snapshot or exactly one HTML `gm-tickets` JSON script block. It normalizes generated time, frontier and ticket statuses. Ticket IDs, membership, titles, dependencies and the rest of the HTML remain reviewed source. It never excludes embedded JavaScript, CSS or the `gm-entries` delivery content.

Each projection needs an explicit path and reason inside the declared source scope. The manifest's own bytes are bound to the receipt: adding or expanding a projection invalidates previous acceptance. There is no arbitrary exclude-file, exclude-directory or replacement-regex option.

Closing bookkeeping can therefore preserve implementation acceptance. New visible delivery content or a changed renderer is not automatically bookkeeping: review the affected final dashboard view as well. Scope separate implementation and delivery receipts when they have different rendering inputs.

## Commands

Use Node22+; replace the helper path with this skill's actual directory. These commands operate locally and use no service or network.

```text
node <skill>/scripts/review-receipt.mjs create <repo-root> review-manifest.json review-receipt.json
node <skill>/scripts/review-receipt.mjs accept <repo-root> review-manifest.json review-receipt.json --expected-id <inspected-snapshot-id> --reviewer <critic-identity> --note <inspection-result>
node <skill>/scripts/review-receipt.mjs check <repo-root> review-manifest.json review-receipt.json
node <skill>/scripts/review-receipt.mjs inspect <repo-root> review-manifest.json review-receipt.json
```

`create` writes a pending receipt, not approval. `accept` requires the exact inspected ID and verifies that its scope/source/captures still match. `check` is read-only and requires acceptance for that current snapshot; it exits nonzero on drift or missing acceptance. Successful output names the snapshot ID, source digest, review outcome and file/capture counts. Receipts include relative paths, normalized source digests, capture digests, declared viewports and reviewer identity/note/time.

Retain the small manifest, accepted receipt and useful captures as durable evidence. Treat the reviewer fields as an attestation rather than a signature or authorization to publish. Follow the project's artifact policy when removing temporary attempts.

`inspect` reports the existing `id`, computed `currentId`, `reusable`, `scopeChanged`,
`reason` and per-path `changes.source`/`changes.captures`. It exits zero only for
current accepted evidence. Other states return structured diagnostics and exit one;
invalid/unreadable evidence returns an error. Continue to use `check` for strict
acceptance and the publication preflight for the packaged source.
