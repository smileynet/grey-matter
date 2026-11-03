import assert from "node:assert/strict";
import test from "node:test";
import { audit } from "./check-tool-guidance.mjs";

const inventory = `## Operator usage guidance
### Usage
| \`scripts/run.mjs\` | [owner](tool-scripts.md#usage) | \`node scripts/run.mjs --flag\`; read-only and reports status. |
<!-- tool-script-inventory:begin -->
| \`scripts/run.mjs\` | operator | Maintained task entrypoint. | [operator guidance](tool-scripts.md#usage) |
| \`scripts/lib.mjs\` | module | Imported helper, not a CLI. | |
<!-- tool-script-inventory:end -->`;

test("accepts complete classifications and a linked command contract", () => {
  assert.deepEqual(audit(inventory, ["scripts/run.mjs", "scripts/lib.mjs"]), []);
});

test("rejects newly discovered extension and extensionless candidates", () => {
  assert.deepEqual(audit(inventory, ["scripts/run.mjs", "scripts/lib.mjs", "tools/new.mjs", ".githooks/new-hook"]), [
    "unclassified tracked script: tools/new.mjs",
    "unclassified tracked script: .githooks/new-hook",
  ]);
});

test("rejects stale paths, missing reasons and broken guidance anchors", () => {
  const broken = inventory.replace("Maintained task entrypoint.", "TODO").replace("tool-scripts.md#usage", "tool-scripts.md#missing");
  assert.deepEqual(audit(broken, ["scripts/run.mjs"]), [
    "missing classification reason: scripts/run.mjs",
    "operator entry contract missing/stale (detail-link): scripts/run.mjs",
    "stale inventory path: scripts/lib.mjs",
  ]);
});

test("rejects an operator row missing mutation and result fields", () => {
  const broken = inventory.replace("read-only and reports status.", "runs it.");
  assert.deepEqual(audit(broken, ["scripts/run.mjs", "scripts/lib.mjs"]), [
    "operator entry contract missing/stale (boundary, outcome): scripts/run.mjs",
  ]);
});
