import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as tar from "tar";
import { buildArtifacts, verifyArtifacts } from "./release-artifacts.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const git = (repo, ...args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const put = (path, text) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text); };

function fixture(fn) {
  const dir = mkdtempSync(join(tmpdir(), "release-artifact-test-"));
  const repo = join(dir, "repo"), out = join(dir, "out");
  mkdirSync(repo);
  git(repo, "init", "-b", "main");
  git(repo, "config", "user.name", "Release Fixture");
  git(repo, "config", "user.email", "release@example.invalid");
  git(repo, "config", "core.autocrlf", "false");
  git(repo, "config", "core.hooksPath", join(repo, ".git/hooks"));
  const pack = { name: "example", version: "0.2.0", description: "Fixture", skills: ["./skills"], metadata: { deploy: { legalFiles: ["LICENSE", "NOTICE"], skillLicenseFiles: ["LICENSE"], runtimeFiles: ["scripts/command.mjs"] } } };
  put(join(repo, ".claude-plugin/plugin.json"), JSON.stringify(pack));
  put(join(repo, ".claude-plugin/marketplace.json"), JSON.stringify({ name: "example", plugins: [{ name: "example", source: "./" }] }));
  put(join(repo, ".codex-plugin/plugin.json"), JSON.stringify({ name: "example", version: "0.2.0", skills: "./skills/" }));
  put(join(repo, "skills/example/SKILL.md"), "---\nname: example\ndescription: Fixture skill\n---\n[Guide](../../docs/guide.md)\n");
  put(join(repo, "skills/example/LICENSE"), "retained standalone MIT notice\n");
  put(join(repo, "docs/guide.md"), "[Runner](../scripts/run.mjs)\n");
  put(join(repo, "scripts/run.mjs"), "#!/usr/bin/env node\nconsole.log('fixture');\n");
  chmodSync(join(repo, "scripts/run.mjs"), 0o755);
  put(join(repo, "scripts/command.mjs"), "// Required by command syntax, without a Markdown link.\n");
  put(join(repo, "LICENSE"), "retained root MIT notice\n");
  put(join(repo, "NOTICE"), "retained attribution\n");
  cpSync(join(here, "deploy.mjs"), join(repo, "scripts/deploy.mjs"));
  for (const file of [".tickets/01.md", ".scratch/result.txt", "target/debug/log", "node_modules/private.txt", ".env", "unrelated.txt"]) put(join(repo, file), "development only\n");
  const commit = () => { git(repo, "add", "-A"); git(repo, "commit", "--no-verify", "-m", "Fixture inputs"); return git(repo, "rev-parse", "HEAD"); };
  const ref = commit();
  try { fn({ dir, repo, out, ref, commit, build: (extra = {}) => buildArtifacts({ repo, ref: git(repo, "rev-parse", "HEAD"), out, ...extra }) }); }
  finally { rmSync(dir, { recursive: true, force: true }); }
}

test("three bundles retain resources/notices/modes, exclude unrelated files, and verify after source removal", () => fixture(({ repo, out, build }) => {
  const metadata = build();
  assert.equal(metadata.assets.length, 3);
  assert.equal(metadata.skills, 1);
  assert.equal(metadata.verification.native, "not-run");
  for (const asset of metadata.assets) {
    for (const file of ["README.md", "LICENSE", "NOTICE", "skills/example/LICENSE", "docs/guide.md", "scripts/run.mjs", "scripts/command.mjs"]) assert.ok(asset.files[file], file);
    for (const file of Object.keys(asset.files)) assert.doesNotMatch(file, /\.tickets|\.scratch|node_modules|target|\.env|unrelated\.txt|\.git\//);
    if (process.platform !== "win32") assert.equal(asset.files["scripts/run.mjs"].executable, 0o111);
  }
  rmSync(repo, { recursive: true });
  assert.equal(verifyArtifacts(out).candidateSha, metadata.candidateSha);
}));

test("build uses committed bytes and repeats without changing output or git state", () => fixture(({ repo, out, build }) => {
  const before = git(repo, "show-ref");
  const first = build();
  const bytes = Object.fromEntries(readdirSync(out).map((name) => [name, hash(readFileSync(join(out, name)))]));
  put(join(repo, "skills/example/SKILL.md"), "uncommitted invalid frontmatter\n");
  assert.deepEqual(build(), first);
  assert.deepEqual(Object.fromEntries(readdirSync(out).map((name) => [name, hash(readFileSync(join(out, name)))])), bytes);
  assert.equal(git(repo, "show-ref"), before);
}));

for (const [name, mutate, expected] of [
  ["mismatched version", ({ repo }) => put(join(repo, ".codex-plugin/plugin.json"), '{"name":"example","version":"9.0.0"}'), /source version mismatch/],
  ["missing resource", ({ repo }) => rmSync(join(repo, "docs/guide.md")), /package resource missing/],
  ["missing notice", ({ repo }) => rmSync(join(repo, "NOTICE")), /required legal artifact/],
  ["malformed YAML", ({ repo }) => put(join(repo, "skills/example/SKILL.md"), "---\nname: example\ndescription: invalid: colon\n---\n"), /skill validation failed/],
  ["declared credential file", ({ repo }) => { const p = join(repo, ".claude-plugin/plugin.json"), value = JSON.parse(readFileSync(p)); value.metadata.deploy.runtimeFiles.push(".env"); put(p, JSON.stringify(value)); }, /excluded development\/credential path/],
]) test(`rejects ${name} before installing output`, () => fixture((context) => {
  mutate(context); context.commit();
  assert.throws(() => context.build(), expected);
  assert.equal(existsSync(context.out), false);
}));

test("changed committed source cannot replace an existing artifact identity", () => fixture(({ repo, out, commit, build }) => {
  const original = build();
  put(join(repo, "scripts/run.mjs"), "console.log('changed');\n"); commit();
  assert.throws(() => build(), /existing output belongs to different/);
  assert.equal(verifyArtifacts(out).candidateSha, original.candidateSha);
}));

for (const state of ["matching", "wrong-authority", "stale-lock"]) test(`Cargo authority and lock: ${state}`, () => fixture(({ repo, commit, build }) => {
  put(join(repo, "Cargo.toml"), '[package]\nname = "example"\nversion = "0.2.0"\nedition = "2021"\n');
  put(join(repo, "src/main.rs"), "fn main() {}\n");
  put(join(repo, "Cargo.lock"), 'version = 4\n[[package]]\nname = "example"\nversion = "0.2.0"\n');
  if (state !== "matching") put(join(repo, "Cargo.toml"), '[package]\nname = "example"\nversion = "0.3.0"\nedition = "2021"\n');
  if (state === "wrong-authority") put(join(repo, "Cargo.lock"), 'version = 4\n[[package]]\nname = "example"\nversion = "0.3.0"\n');
  if (state === "stale-lock") {
    for (const file of [".claude-plugin/plugin.json", ".codex-plugin/plugin.json"]) {
      const path = join(repo, file), value = JSON.parse(readFileSync(path)); value.version = "0.3.0"; put(path, JSON.stringify(value));
    }
  }
  commit();
  if (state === "matching") assert.equal(build().version, "0.2.0");
  else assert.throws(() => build(), state === "wrong-authority" ? /Cargo authority differs/ : /Cargo.lock root package version differs/);
}));

test("source symlinks are rejected before extraction or output writes", { skip: process.platform === "win32" }, () => fixture(({ repo, out, commit, build }) => {
  symlinkSync("../../outside", join(repo, "skills/example/escape")); commit();
  assert.throws(() => build(), /unsupported archive entry/);
  assert.equal(existsSync(out), false);
}));

for (const [name, mutate, expected] of [
  ["corrupted asset", (out, metadata) => writeFileSync(join(out, metadata.assets[0].name), "bad bytes"), /stale or corrupted asset/],
  ["missing asset", (out, metadata) => rmSync(join(out, metadata.assets[0].name)), /missing artifact file/],
  ["unexpected output", (out) => put(join(out, "extra.txt"), "unrelated"), /unexpected release output/],
  ["wrong index", (out) => put(join(out, "SHA256SUMS"), "stale"), /checksum index differs/],
]) test(`verify rejects ${name}`, () => fixture(({ out, build }) => {
  const metadata = build(); mutate(out, metadata);
  assert.throws(() => verifyArtifacts(out), expected);
}));

test("CLI validation failures use structured fail/exit 1", () => fixture(({ out }) => {
  const result = spawnSync(process.execPath, [join(here, "release-artifacts.mjs"), "verify", "--out", out], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stderr).status, "fail");
}));

for (const change of ["extra", "missing", "version", "dangling", "short-readme"]) test(`verify rejects resealed archive with ${change} defect`, () => fixture(({ dir, out, build }) => {
  const metadata = build(), asset = metadata.assets.find((item) => item.host === "agy");
  const tree = join(dir, "tamper"); mkdirSync(tree);
  tar.extract({ file: join(out, asset.name), cwd: tree, sync: true, chmod: true });
  if (change === "extra") put(join(tree, "extra.txt"), "unlisted");
  if (change === "missing") rmSync(join(tree, "docs/guide.md"));
  if (change === "version") { const path = join(tree, "plugin.json"), value = JSON.parse(readFileSync(path)); value.version = "8.0.0"; put(path, JSON.stringify(value)); asset.files["plugin.json"].sha256 = hash(readFileSync(path)); }
  if (change === "dangling") { const path = join(tree, "docs/guide.md"); put(path, "[Missing](missing.md)\n"); asset.files["docs/guide.md"].sha256 = hash(readFileSync(path)); }
  if (change === "short-readme") { const path = join(tree, "README.md"); put(path, "too short\n"); asset.files["README.md"].sha256 = hash(readFileSync(path)); }
  const files = change === "extra" ? [...Object.keys(asset.files), "extra.txt"] : Object.keys(asset.files).filter((path) => existsSync(join(tree, path)));
  tar.create({ cwd: tree, file: join(out, asset.name), gzip: true, sync: true, portable: true, noMtime: true }, files);
  asset.sha256 = hash(readFileSync(join(out, asset.name)));
  put(join(out, "release-metadata.json"), JSON.stringify(metadata, null, 2) + "\n");
  assert.throws(() => verifyArtifacts(out), /unexpected archive entry|missing expected|wrong agy bundle|package resource missing|incomplete agy plugin README/);
}));
