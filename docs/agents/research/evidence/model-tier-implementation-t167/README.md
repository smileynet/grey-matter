# Ticket 167 frozen fixtures

This directory preserves the exact six input trees used by the model-tier comparison. The task roots are synthetic grey-matter fixtures; they include the repository guidance, tickets, source files, tests, and seed-specific changes the workers saw. No model output, session transcript, private profile data, or answer key is included.

The seed tree IDs and full file-by-file SHA-256 manifest are in [`fixture-manifest.json`](fixture-manifest.json). The original temporary Git seed repositories are not part of this repository's object database, so these committed file snapshots are the durable source for rehydration. Each exported file was read from the untouched pre-call seed and checked against its frozen working-tree hash before it was written here. The scoped `.gitattributes` rule disables text conversion for `fixtures/**`, preserving the manifest's exact bytes in Git objects across platforms.

Recreate one case in a new empty directory with:

```powershell
node docs/agents/research/evidence/model-tier-implementation-t167/rehydrate.mjs --case t1 --dest "$env:TEMP\t167-t1"
```

Replace `t1` with `t2` through `t6` to select another frozen task. The script verifies each byte length and SHA-256 before copying. The fixture manifest intentionally omits private oracle values. See [`grading-rubric.md`](grading-rubric.md) for the public scoring rules and [`private-oracle-lifecycle.md`](private-oracle-lifecycle.md) for the private-key owner, hash, and retention condition.

The `T4` seed includes the exact prerequisite `multiply` implementation and test. `T5` and `T6` add only their visible ticket/test files. The hidden wrong-reason vectors remain outside these task trees.
