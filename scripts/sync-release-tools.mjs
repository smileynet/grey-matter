#!/usr/bin/env node
// Check or update tkt's owned copies of the shared release implementation.
// Usage: node scripts/sync-release-tools.mjs --target REPO [--write]
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ReleaseError } from "./release-version.mjs";
export const releaseFiles = ["release.mjs", "release-artifacts.mjs", "release-version.mjs", "release-git.mjs", "release-product.mjs", "release-native.mjs", "release-verify.mjs", "release-publish.mjs", "release-github.mjs", "release-staging.mjs", "release-publication.mjs", "release-registry.mjs", "check-skill-syntax.mjs", "probe-claude-validation.mjs"];
const here = dirname(fileURLToPath(import.meta.url)), hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const encode = (value) => JSON.stringify(value, null, 2) + "\n";
function atomic(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`; writeFileSync(temporary, bytes, { flag: "wx" }); renameSync(temporary, path);
}
export function syncReleaseTools({ target, source = resolve(here, ".."), write = false }) {
  target = resolve(target); source = resolve(source);
  const manifest = join(target, "tools/release-vendor.json");
  const previous = existsSync(manifest) ? JSON.parse(readFileSync(manifest, "utf8")) : null;
  const inputs = new Map(releaseFiles.map((name) => [`tools/${name}`, readFileSync(join(source, "scripts", name))]));
  inputs.set("tools/LICENSE-grey-matter.txt", readFileSync(join(source, "LICENSE")));
  if (previous && (previous.schema !== 1 || previous.owner !== "smileynet/grey-matter-release-tools" || !previous.files || Object.keys(previous.files).some((file) => !inputs.has(file)))) throw new ReleaseError("foreign or incompatible release vendor manifest");
  const dependencies = JSON.parse(readFileSync(join(source, "package.json"))).devDependencies;
  const targetPackage = JSON.parse(readFileSync(join(target, "package.json")));
  if (!targetPackage.private || encode(targetPackage.devDependencies) !== encode(dependencies)) throw new ReleaseError("target maintainer dependencies differ; update its private package/lock before syncing");
  const expected = { schema: 1, dependencies, owner: "smileynet/grey-matter-release-tools", source: "https://github.com/smileynet/grey-matter", sourceTree: "per-file SHA-256 values identify the canonical source bytes", files: Object.fromEntries([...inputs].map(([file, bytes]) => [file, hash(bytes)])) };
  const findings = [];
  for (const [file, bytes] of inputs) {
    const path = join(target, file), actual = existsSync(path) ? hash(readFileSync(path)) : null;
    if (actual !== hash(bytes)) {
      findings.push(`vendor content differs or missing: ${file}`);
      if (write && actual && previous?.files[file] !== actual) throw new ReleaseError(`refusing to overwrite foreign or locally modified release tool: ${file}`);
    }
  }
  if (encode(previous) !== encode(expected)) findings.push("vendor ownership/hash inventory differs or missing");
  if (write) {
    for (const [file, bytes] of inputs) atomic(join(target, file), bytes);
    atomic(manifest, encode(expected));
  }
  return { status: write || !findings.length ? "pass" : "fail", mode: write ? "sync" : "check", metrics: { files: inputs.size }, findings: write ? [] : findings };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2), options = {};
    while (args.length) { const key = args.shift(); if (key === "--write") options.write = true; else if (key === "--target" && args.length) options.target = args.shift(); else throw new ReleaseError(`unknown/incomplete option: ${key}`); }
    if (!options.target) throw new ReleaseError("usage: --target REPO [--write]");
    const result = syncReleaseTools(options); console.log(encode(result)); process.exitCode = result.status === "pass" ? 0 : 1;
  } catch (error) { console.error(encode({ status: "fail", errors: [error.message] })); process.exitCode = 1; }
}
