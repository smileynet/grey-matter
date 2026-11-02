#!/usr/bin/env node
// Check or update tkt's owned copies of the shared release implementation.
// Usage: node scripts/sync-release-tools.mjs --target REPO [--write] [--deployer]
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ReleaseError } from "./release-version.mjs";
export const releaseFiles = ["release.mjs", "release-artifacts.mjs", "release-version.mjs", "release-git.mjs", "release-product.mjs", "release-native.mjs", "release-verify.mjs", "release-publish.mjs", "release-github.mjs", "release-staging.mjs", "release-publication.mjs", "release-registry.mjs", "release-tkt-publication.mjs", "release-tkt-ci.mjs", "release-cargo-credentials.mjs", "release-cargo-upload.mjs", "release-cargo-transport.py", "release-development.mjs", "release-ci-artifacts.mjs", "check-skill-syntax.mjs", "probe-claude-validation.mjs"];
const here = dirname(fileURLToPath(import.meta.url)), hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const encode = (value) => JSON.stringify(value, null, 2) + "\n";
function atomic(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`; writeFileSync(temporary, bytes, { flag: "wx" }); renameSync(temporary, path);
}
function git(target, args) {
  const result = spawnSync("git", ["-C", target, ...args], { encoding: "utf8", windowsHide: true });
  if (result.error || result.status !== 0) throw new ReleaseError(`cannot verify deployer target Git state (${args[0]}): ${result.error?.message ?? result.stderr.trim()}`);
  return result.stdout.trim();
}
function checkDeployerWriteBoundary(target, source) {
  const root = resolve(git(target, ["rev-parse", "--show-toplevel"]));
  if (root !== target) throw new ReleaseError(`deployer target must be a Git checkout root: ${target}`);
  const packs = JSON.parse(readFileSync(join(source, "skill-packs.json"), "utf8"));
  const registered = packs.packs.find((pack) => pack.name === "tkt" && pack.engine === "tools/deploy.mjs");
  if (!registered || resolve(source, registered.path) !== target) throw new ReleaseError("deployer target is not the registered tkt checkout from skill-packs.json");
  if (git(target, ["status", "--porcelain", "--", "tools/deploy.mjs", "tools/deployer-vendor.json"])) throw new ReleaseError("refusing to overwrite local or foreign deployer edits; inspect and commit or discard them first");
  try { git(target, ["ls-files", "--error-unmatch", "--", "tools/deploy.mjs"]); }
  catch { throw new ReleaseError("refusing to overwrite an untracked deployer; confirm its ownership first"); }
  const upstream = git(target, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"]);
  const [ahead, behind] = git(target, ["rev-list", "--left-right", "--count", `HEAD...${upstream}`]).split(/\s+/).map(Number);
  if (ahead || behind) throw new ReleaseError(`deployer target is ${ahead} commit(s) ahead and ${behind} behind its fetched upstream; compare vendor files and resolve with the owner before repair`);
}
function syncDeployer({ target, source, write }) {
  const path = join(target, "tools/deploy.mjs"), manifestPath = join(target, "tools/deployer-vendor.json");
  const bytes = readFileSync(join(source, "scripts/deploy.mjs"));
  const expected = { schema: 1, owner: "smileynet/grey-matter-deployer", source: "https://github.com/smileynet/grey-matter", file: "tools/deploy.mjs", sha256: hash(bytes) };
  const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : null;
  if (previous && (previous.schema !== 1 || previous.owner !== expected.owner || previous.source !== expected.source || previous.file !== expected.file || !/^[a-f0-9]{64}$/.test(previous.sha256))) throw new ReleaseError("foreign or incompatible deployer vendor manifest");
  const actual = existsSync(path) ? readFileSync(path) : null;
  if (previous && (!actual || previous.sha256 !== hash(actual))) throw new ReleaseError("refusing to overwrite foreign or locally modified deployer");
  if (actual?.equals(bytes) && encode(previous) === encode(expected)) return { status: "pass", mode: write ? "sync" : "check", metrics: { files: 1 }, findings: [] };
  const findings = [];
  if (!actual || !actual.equals(bytes)) findings.push("deployer content differs or missing: tools/deploy.mjs");
  if (encode(previous) !== encode(expected)) findings.push("deployer ownership/hash inventory differs or missing");
  if (write) {
    checkDeployerWriteBoundary(target, source);
    atomic(path, bytes);
    atomic(manifestPath, encode(expected));
  }
  return { status: write || !findings.length ? "pass" : "fail", mode: write ? "sync" : "check", metrics: { files: 1 }, findings: write ? [] : findings };
}
export function syncReleaseTools({ target, source = resolve(here, ".."), write = false, deployer = false }) {
  target = resolve(target); source = resolve(source);
  if (deployer) return syncDeployer({ target, source, write });
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
    while (args.length) { const key = args.shift(); if (key === "--write") options.write = true; else if (key === "--deployer") options.deployer = true; else if (key === "--target" && args.length) options.target = args.shift(); else throw new ReleaseError(`unknown/incomplete option: ${key}`); }
    if (!options.target) throw new ReleaseError("usage: --target REPO [--write] [--deployer]");
    const result = syncReleaseTools(options); console.log(encode(result)); process.exitCode = result.status === "pass" ? 0 : 1;
  } catch (error) { console.error(encode({ status: "fail", errors: [error.message] })); process.exitCode = 1; }
}
