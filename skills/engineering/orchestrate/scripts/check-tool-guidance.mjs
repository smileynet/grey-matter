import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const reference = resolve(root, "skills/engineering/orchestrate/references/tool-scripts.md");
const begin = "<!-- tool-script-inventory:begin -->";
const end = "<!-- tool-script-inventory:end -->";
const candidate = /\.(?:mjs|cjs|js|py|ps1|psm1|sh|bash)$/i;
const operators = new Set([
  ".githooks/pre-push", "docs/agents/research/examples/cargo-credential-checksum.mjs", "docs/agents/research/examples/cargo-local-transport.mjs", "docs/agents/research/examples/cargo-private-mount.py", "scripts/build-agy-plugin.mjs", "scripts/build-orchestration-dashboard.mjs", "scripts/check-docs-consistency.mjs", "scripts/check-gates-coverage.mjs", "scripts/check-guidance.mjs", "scripts/check-home-path.mjs", "scripts/check-invocation-policy.mjs", "scripts/check-plugin-manifest.mjs", "scripts/check-provider-fallback.mjs", "scripts/check-skill-syntax.mjs", "scripts/deploy.mjs", "scripts/gate.mjs", "scripts/grade-model-tier-research-t169.mjs", "scripts/install-agents-md.mjs", "scripts/install-skills.mjs", "scripts/install-skills.ps1", "scripts/install-skills.sh", "scripts/probe-agent-shell.mjs", "scripts/probe-claude-validation.mjs", "scripts/probe-codex-shared.mjs", "scripts/probe-critic-model.mjs", "scripts/probe-invocation-policy.mjs", "scripts/release-artifacts.mjs", "scripts/release-native.mjs", "scripts/release-product.mjs", "scripts/release-publication.mjs", "scripts/release-verify.mjs", "scripts/release.mjs", "scripts/spike-model-effort-t171.mjs", "scripts/spike-model-eval.mjs", "scripts/spike-model-task-tier-t170.mjs", "scripts/spike-model-tier-implementation-t167.mjs", "scripts/spike-model-tier-research-t169.mjs", "scripts/spike-model-tier-review-t168.mjs", "scripts/spike-orchestrate-fixture.mjs", "scripts/sync-release-tools.mjs", "scripts/uninstall-crew-research.mjs", "scripts/verify-tkt-usage.mjs", "skills/engineering/orchestrate/scripts/check-tool-guidance.mjs", "skills/meta/adopt-project/scripts/relocate-knowledge.mjs", "skills/meta/adopt-project/scripts/survey-repos.mjs", "skills/meta/harness-changelog/scripts/harness-versions.mjs", "skills/meta/release/references/release.sh", "skills/meta/repository-artifact-hygiene/scripts/inspect-artifacts.mjs", "skills/meta/repository-artifact-hygiene/scripts/inspect-footprint.mjs", "skills/productivity/delivery-dashboard/scripts/check-dashboard.mjs", "skills/productivity/delivery-dashboard/scripts/review-receipt.mjs", "skills/productivity/delivery-dashboard/scripts/snapshot-tickets.mjs", "skills/productivity/line-craft/scripts/check-shapes.mjs"
]);

function trackedScripts() {
  const tracked = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean);
  return tracked.filter((path) => path.startsWith("scripts/") || path.startsWith("tools/") || /\/scripts\//.test(path) || isShebang(path))
    .filter((path) => candidate.test(path) || isShebang(path)).sort();
}

function isShebang(path) {
  try { return readFileSync(resolve(root, path), "utf8").split(/\r?\n/, 1)[0].startsWith("#!"); }
  catch { return false; }
}

function rows(markdown) {
  const body = markdown.split(begin)[1]?.split(end)[0];
  if (body === undefined) throw new Error("inventory markers are missing");
  return body.split(/\r?\n/).flatMap((line) => {
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    const match = /^`([^`]+)`$/.exec(cells[0] ?? "");
    return match && ["operator", "module", "test", "fixture/template"].includes(cells[1])
      ? [{ path: match[1], role: cells[1], reason: cells[2] ?? "", guidance: cells[3] ?? "" }] : [];
  });
}

export function audit(markdown, actual) {
  const inventory = rows(markdown);
  const guidance = markdown.split("## Complete tracked script classification")[0] ?? "";
  const errors = [], known = new Set(inventory.map((entry) => entry.path));
  if (known.size !== inventory.length) errors.push("duplicate path in tool-script inventory");
  for (const path of actual) if (!known.has(path)) errors.push(`unclassified tracked script: ${path}`);
  for (const entry of inventory) {
    if (!actual.includes(entry.path)) errors.push(`stale inventory path: ${entry.path}`);
    if (!entry.reason || /^(todo|unclassified)$/i.test(entry.reason)) errors.push(`missing classification reason: ${entry.path}`);
    const href = /\]\(([^)]+)\)/.exec(entry.guidance)?.[1];
    if (entry.role === "operator" && (!href || !href.startsWith("tool-scripts.md#") || !guidance.includes("## Operator usage guidance") || !guidance.includes(`\`${entry.path}\``))) errors.push(`operator guidance link missing or stale: ${entry.path}`);
  }
  return errors;
}

function main() {
  const markdown = readFileSync(reference, "utf8"), inventory = rows(markdown), actual = trackedScripts();
  if (process.argv.includes("--refresh") || process.argv.includes("--rebuild")) {
    const existing = new Set(inventory.map((entry) => entry.path));
    const additions = actual.filter((path) => process.argv.includes("--rebuild") || !existing.has(path)).map((path) => {
      return `| \`${path}\` | unclassified | TODO assign role and reason after reading the source; do not execute to classify. | |`;
    });
    if (process.argv.includes("--rebuild")) writeFileSync(reference, markdown.replace(new RegExp(`${begin}[\\s\\S]*?${end}`), `${begin}\n${additions.join("\n")}\n${end}`));
    else if (additions.length) writeFileSync(reference, markdown.replace(end, `${additions.join("\n")}\n${end}`));
    console.log(`${process.argv.includes("--rebuild") ? "Rebuilt" : "Added"} ${additions.length} inventory rows; review every role and reason before checking.`);
    return;
  }
  if (process.argv.includes("--classify")) {
    const updated = rows(markdown).map((entry) => {
      if (!operators.has(entry.path)) return `| \`${entry.path}\` | ${entry.role} | ${entry.reason} | ${entry.guidance} |`;
      return `| \`${entry.path}\` | operator | Runs a maintained repository task; this entrypoint's exact contract and boundary are described in the operator table above. | [operator guidance](tool-scripts.md#operator-usage-guidance) |`;
    });
    writeFileSync(reference, markdown.replace(new RegExp(`${begin}[\\s\\S]*?${end}`), `${begin}\n${updated.join("\n")}\n${end}`));
    console.log(`Classified ${operators.size} operator paths; review table links and scope.`);
    return;
  }
  const errors = audit(markdown, actual);
  if (errors.length) { console.error(errors.map((error) => `FAIL ${error}`).join("\n")); process.exitCode = 1; return; }
  const counts = Object.groupBy(inventory, (entry) => entry.role);
  console.log(`PASS tool-script inventory: ${inventory.length} classified paths (${Object.entries(counts).map(([role, entries]) => `${role} ${entries.length}`).join(", ")}); ${actual.length} tracked paths found (extensions and shebangs).`);
}

main();
