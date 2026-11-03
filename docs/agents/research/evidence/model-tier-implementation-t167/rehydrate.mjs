import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(here, "fixture-manifest.json"), "utf8"));
const args = process.argv.slice(2);
const value = name => { const index = args.indexOf(name); return index < 0 ? null : args[index + 1] ?? null; };
const caseId = value("--case");
const destination = value("--dest");
assert(manifest.cases.some(item => item.id === caseId), "Use a frozen case id: t1 through t6");
assert(destination, "Provide a new destination with --dest");
const targetRoot = resolve(destination);
assert(!existsSync(targetRoot), "Destination must not already exist");
const fixture = manifest.cases.find(item => item.id === caseId);
const sourceRoot = join(here, "fixtures", caseId);
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
mkdirSync(targetRoot, { recursive: true });
let bytesWritten = 0;
for (const file of fixture.files) {
  assert(!file.path.startsWith("/") && !file.path.split(/[\\/]/).includes(".."), `Unsafe fixture path ${file.path}`);
  const source = join(sourceRoot, file.path);
  const bytes = readFileSync(source);
  assert.equal(bytes.length, file.bytes, `Fixture length changed: ${file.path}`);
  assert.equal(sha(bytes), file.sha256, `Fixture hash changed: ${file.path}`);
  const target = resolve(targetRoot, file.path);
  assert(target.startsWith(`${targetRoot}${sep}`), `Target path escaped destination: ${file.path}`);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, bytes);
  bytesWritten += bytes.length;
}
console.log(JSON.stringify({ caseId, destination: targetRoot, files: fixture.files.length, bytesWritten, seedTree: fixture.seedTree }, null, 2));
