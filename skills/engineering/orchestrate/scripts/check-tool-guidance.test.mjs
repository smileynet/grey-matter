import assert from "node:assert/strict";
import test from "node:test";
import { audit } from "./check-tool-guidance.mjs";

const markdown = `## Operator usage guidance
<!-- tool-script-inventory:begin -->
| \`scripts/run.mjs\` | operator | Runs a scoped task. | [usage](tool-scripts.md#operator-usage-guidance) |
| \`scripts/lib.mjs\` | module | Imported helper, not a CLI. | |
<!-- tool-script-inventory:end -->`;

test("accepts complete classifications and reachable operator guidance", () => {
  assert.deepEqual(audit(markdown, ["scripts/run.mjs", "scripts/lib.mjs"]), []);
});

test("rejects newly tracked unclassified paths", () => {
  assert.deepEqual(audit(markdown, ["scripts/run.mjs", "scripts/lib.mjs", "tools/new.mjs"]), [
    "unclassified tracked script: tools/new.mjs",
  ]);
});

test("rejects stale paths, missing reasons and dead operator guidance", () => {
  const broken = markdown.replace("Runs a scoped task.", "TODO").replace("tool-scripts.md#operator-usage-guidance", "missing.md");
  assert.deepEqual(audit(broken, ["scripts/run.mjs"]), [
    "missing classification reason: scripts/run.mjs",
    "operator guidance link missing or stale: scripts/run.mjs",
    "stale inventory path: scripts/lib.mjs",
  ]);
});
