#!/usr/bin/env node
// check-gates-coverage.mjs — every scripts/check-*.mjs and scripts/*.test.mjs is run by a check
// in scripts/gates.json, or listed under "not_gated" with the reason, so a new check or test
// file is never silently left out of every stage (the orphan guard from ticket 34).
//
// Run:  node scripts/check-gates-coverage.mjs
// Exit: 0 = every file is covered; 1 = a file is in neither list, or "not_gated" names a gated file.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(SCRIPTS, "gates.json"), "utf8"));
const gated = new Set(manifest.checks.flatMap((c) => c.run).filter((a) => a.startsWith("scripts/")).map((a) => a.slice("scripts/".length)));
const notGated = manifest.not_gated ?? {};

const problems = [];
for (const file of readdirSync(SCRIPTS)) {
  if (!(file.endsWith(".test.mjs") || (file.startsWith("check-") && file.endsWith(".mjs")))) continue;
  if (gated.has(file) && notGated[`scripts/${file}`]) problems.push(`scripts/${file} is both gated and listed in "not_gated"`);
  else if (!gated.has(file) && !notGated[`scripts/${file}`]) problems.push(`scripts/${file} is run by no check in scripts/gates.json`);
}
for (const [file, reason] of Object.entries(notGated)) if (typeof reason !== "string" || !reason) problems.push(`"not_gated" entry ${file} needs a reason`);

if (problems.length) {
  console.error(`${problems.join("\n")}\nAdd each file to a check's "run", or to "not_gated" with the reason it runs elsewhere.`);
  process.exit(1);
}
console.log(`gates coverage: ${gated.size} script(s) gated, ${Object.keys(notGated).length} not gated with a reason`);
