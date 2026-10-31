# Review the source that will ship

Use a review receipt when a project requires critic acceptance of UI work. It binds the review to declared source files, actual capture bytes and viewport identities. It supplements visual inspection; it neither inspects a screen nor authenticates a reviewer.

## Before closure

1. Settle the implementation, run the affected checks and capture the actual rendering at supported laptop/phone sizes. Inspect the important path, labels and clipping, not merely whether the DOM contains every item. Label synthetic, mocked and live evidence honestly.
2. Declare the rendering-input scope and captures in a manifest. The reviewer confirms that the scope includes the inputs that matter. The helper traverses declared directories and detects membership changes; it does not discover imports or a build graph. Keep the manifest and receipt outside source directories that would include the receipt itself.
3. Create a pending snapshot using [the receipt helper](../scripts/review-receipt.mjs). Give the critic its returned snapshot ID, manifest, source and captures. Acceptance must name that ID and describe what was inspected.
4. Record acceptance only while the source, manifest and captures still match that snapshot. Check it immediately before closing the ticket and before publishing that implementation. A changed rendering input requires affected checks, fresh captures and renewed review; create another receipt rather than overwriting the earlier one.

A checker pass establishes byte identity and the recorded attestation. Whether the interface communicates clearly remains a critic judgement. A viewport in the manifest is reported capture context, not proof that a browser used it.

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
- `ticket-snapshot` supports a JSON ticket snapshot or exactly one HTML `gm-tickets` JSON script block. It normalizes generated time, frontier and ticket statuses. Ticket IDs, membership, titles, dependencies and the rest of the HTML remain reviewed source. It never excludes embedded JavaScript, CSS or the `gm-entries` delivery content.

Each projection needs an explicit path and reason inside the declared source scope. The manifest's own bytes are bound to the receipt: adding or expanding a projection invalidates previous acceptance. There is no arbitrary exclude-file, exclude-directory or replacement-regex option.

Closing bookkeeping can therefore preserve implementation acceptance. New visible delivery content or a changed renderer is not automatically bookkeeping: review the affected final dashboard view as well. Scope separate implementation and delivery receipts when they have different rendering inputs.

## Commands

Use Node22+; replace the helper path with this skill's actual directory. These commands operate locally and use no service or network.

```text
node <skill>/scripts/review-receipt.mjs create <repo-root> review-manifest.json review-receipt.json
node <skill>/scripts/review-receipt.mjs accept <repo-root> review-manifest.json review-receipt.json --expected-id <inspected-snapshot-id> --reviewer <critic-identity> --note <inspection-result>
node <skill>/scripts/review-receipt.mjs check <repo-root> review-manifest.json review-receipt.json
```

`create` writes a pending receipt, not approval. `accept` requires the exact inspected ID and verifies that its scope/source/captures still match. `check` is read-only and requires acceptance for that current snapshot; it exits nonzero on drift or missing acceptance. Successful output names the snapshot ID, source digest, review outcome and file/capture counts. Receipts include relative paths, normalized source digests, capture digests, declared viewports and reviewer identity/note/time.

Retain the small manifest, accepted receipt and useful captures as durable evidence. Treat the reviewer fields as an attestation rather than a signature or authorization to publish. Follow the project's artifact policy when removing temporary attempts.
