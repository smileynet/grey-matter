#!/usr/bin/env node
// check-shapes.mjs — the line-craft skill's standalone, zero-dependency shape check. Reads a shape
// catalog (format: ../references/CATALOG.md) and reports each match per line of a prose file.
//
//   node check-shapes.mjs <prose-file> [--catalog <catalog.json>] [--json]
//   node check-shapes.mjs --self-test [--catalog <catalog.json>]
//
// --catalog defaults to the starter (../references/shapes.json). --self-test proves the catalog:
// every checked shape's `bad` example trips its own ruleId, and every `clean` trips nothing.
// Exit: 1 on any `fail` finding (or any self-test failure), 2 on a usage error, else 0.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const STARTER = join(dirname(fileURLToPath(import.meta.url)), "..", "references", "shapes.json");

export function loadShapes(file = STARTER) {
  return JSON.parse(readFileSync(file, "utf-8")).shapes;
}

export function findShapes(prose, shapes) {
  const findings = [];
  const checked = shapes.filter((s) => s.pattern).map((s) =>
    ({ ...s, re: new RegExp(s.pattern, (s.flags || "").includes("g") ? s.flags : `${s.flags || ""}g`) }));
  prose.split(/\r?\n/).forEach((line, i) => {
    for (const s of checked) for (const m of line.matchAll(s.re))
      findings.push({ line: i + 1, ruleId: s.ruleId, severity: s.severity, move: s.move,
        match: (m[1] || m[0]).trim(), message: s.message, fixHint: s.fixHint });
  });
  return findings;
}

export function selfTest(shapes) {
  const problems = [];
  for (const s of shapes) {
    if (!s.examples?.length) problems.push(`${s.ruleId}: no examples`);
    for (const ex of s.examples || []) {
      if (s.pattern && !findShapes(ex.bad, shapes).some((f) => f.ruleId === s.ruleId))
        problems.push(`${s.ruleId}: bad example does not trip its own rule: ${ex.bad}`);
      const hits = findShapes(ex.clean, shapes);
      if (hits.length) problems.push(`${s.ruleId}: clean example trips ${hits.map((h) => h.ruleId).join(", ")}: ${ex.clean}`);
    }
  }
  return problems;
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"));
if (isMain) {
  const argv = process.argv.slice(2);
  const ci = argv.indexOf("--catalog");
  const shapes = loadShapes(ci >= 0 ? argv[ci + 1] : undefined);
  if (argv.includes("--self-test")) {
    const problems = selfTest(shapes);
    console.log(problems.length ? problems.map((p) => `FAIL ${p}`).join("\n") : `self-test: ${shapes.length} shape(s) OK`);
    process.exit(problems.length ? 1 : 0);
  }
  const file = argv.find((a, i) => !a.startsWith("--") && (ci < 0 || i !== ci + 1));
  if (!file) { console.error("usage: check-shapes.mjs <prose-file> [--catalog <json>] [--json] | --self-test [--catalog <json>]"); process.exit(2); }
  const findings = findShapes(readFileSync(file, "utf-8"), shapes);
  if (argv.includes("--json")) console.log(JSON.stringify(findings, null, 2));
  else {
    console.log(`${file}: ${findings.length} shape(s)`);
    for (const f of findings) console.log(`  [${f.severity}] line ${f.line} ${f.ruleId}: "${f.match}"\n      move: ${f.move} (${f.fixHint})`);
  }
  process.exitCode = findings.some((f) => f.severity === "fail") ? 1 : 0;
}
