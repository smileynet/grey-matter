#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const KEY_PATH = join(ROOT, ".scratch", "t169", "answer-key.json");
const KEY_HASH = "429bf76172338d0f52963d3ac2c14fba3f701defaae42e444997a1096c04efae";
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");

function loadKey() {
  const bytes = readFileSync(KEY_PATH);
  if (sha256(bytes) !== KEY_HASH) throw new Error("Held-out answer key changed");
  return JSON.parse(bytes.toString("utf8"));
}

export function gradeResponse(task, response, key = loadKey()) {
  if (typeof response !== "string" || !response.trim()) throw new Error("Final response must be non-empty text");
  if (task === "callers") {
    const expected = new Set(key.callers);
    const paths = [...response.matchAll(/\bsrc\/(?:[\w-]+\/)*[\w-]+\.(?:js|mjs)\b/g)];
    const mentioned = new Set(paths.filter(match => {
      const context = response.slice(Math.max(0, match.index - 100), match.index + match[0].length + 120);
      return /\b(call(?:s|ed|ing)?|invoke(?:s|d)?|reach(?:es|ed)?|import(?:s|ed)?|use(?:s|d)?|dynamic(?:ally)?|alias)\b/i.test(context);
    }).map(match => match[0]));
    const missing = [...expected].filter(path => !mentioned.has(path));
    const invented = [...mentioned].filter(path => !expected.has(path));
    return { pass: missing.length === 0 && invented.length === 0, recall: (expected.size - missing.length) / expected.size, precision: mentioned.size ? (mentioned.size - invented.length) / mentioned.size : 0, missing, invented };
  }
  if (task === "module-summary") {
    const facts = [
      /retentionDays/i.test(response) && /(?:preced|override|takes priority|wins|first)/i.test(response) && /\b0\b/.test(response),
      /managed/i.test(response) && /90\s*days?/i.test(response),
      /(?:other|non-managed|unmanaged|otherwise)/i.test(response) && /30\s*days?/i.test(response),
      /owner/i.test(response) && /delet/i.test(response),
      /locked/i.test(response) && /(?:cannot|can't|not|unable|false|blocks?)/i.test(response) && /delet/i.test(response),
    ];
    const unsupportedChecks = [
      /\bclamp(?:ed|s)?\b/i,
      /\bmissing settings? (?:is|are) (?:an? )?error\b/i,
      /\badmins? (?:can|may) delete\b/i,
      /\blocked records? (?:can|may) be deleted\b/i,
      /\bowners? (?:can|may) delete locked records?\b/i,
    ];
    const unsupported = key.moduleSummary.unsupportedClaims.filter((_, index) => unsupportedChecks[index].test(response));
    return { pass: facts.filter(Boolean).length >= 4 && unsupported.length === 0, factCount: facts.filter(Boolean).length, factTotal: facts.length, unsupported };
  }
  if (task === "cited-answer") {
    const semantic = /\b12\s*days?\b/i.test(response) && /(?:explicit|setting|retentionDays)/i.test(response);
    const cited = /docs\/policy\.md/i.test(response) && /record retention/i.test(response);
    return { pass: semantic && cited, semantic, cited, citationPath: cited ? key.citedAnswer.source : null, citationHeading: cited ? key.citedAnswer.heading : null };
  }
  throw new Error(`Unknown research task: ${task}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const [, , task, responsePath, scorePath] = process.argv;
    if (!task || !responsePath || !scorePath) throw new Error("Usage: node scripts/grade-model-tier-research-t169.mjs TASK RESPONSE.txt SCORE.json");
    const response = readFileSync(responsePath, "utf8");
    const score = gradeResponse(task, response);
    const receipt = { schemaVersion: 1, task, keySha256: KEY_HASH, responseSha256: sha256(Buffer.from(response)), score };
    writeFileSync(scorePath, `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
    process.stdout.write(`${JSON.stringify({ task, score: score.pass ? "pass" : "fail", receipt: scorePath })}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
