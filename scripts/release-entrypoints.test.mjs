import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { releaseFiles, syncReleaseTools } from "./sync-release-tools.mjs";
const scripts = dirname(fileURLToPath(import.meta.url)), repo = dirname(scripts), wrapper = join(repo, "skills/meta/release/references/release.sh");
const put = (file, text) => { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, text); };
for (const path of ["skills/meta/release/references/release.sh", "skills/release/references/release.sh", "tools/release.sh"]) test(`wrapper finds shared tools and preserves arguments from ${path}`, () => {
  const temp = mkdtempSync(join(tmpdir(), "release wrapper "));
  try {
    const entry = join(temp, path), dir = path === "tools/release.sh" ? "tools" : "scripts";
    mkdirSync(dirname(entry), { recursive: true }); cpSync(wrapper, entry);
    for (const name of ["release.mjs", "release-product.mjs", "release-native.mjs", "release-verify.mjs"]) put(join(temp, dir, name), 'console.log(JSON.stringify(process.argv.slice(2)));');
    for (const [mode, prefix] of [["prepare", ["prepare"]], ["verify", []], ["verify-product", []], ["verify-native", []]]) {
      const result = spawnSync("bash", [entry, mode, "--out", "path with spaces", "--execute"], { cwd: tmpdir(), encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr); assert.deepEqual(JSON.parse(result.stdout), [...prefix, "--out", "path with spaces", "--execute"]);
    }
  } finally { rmSync(temp, { recursive: true, force: true }); }
});
test("legacy version and publishing modes stop before any release operation", () => {
  for (const args of [[], ["0.2.0"], ["patch", "--execute"], ["publish"], ["resume"]]) {
    const result = spawnSync("bash", [wrapper, ...args], { encoding: "utf8" }); assert.equal(result.status, 2, result.stderr); assert.match(result.stderr, /legacy publication is disabled/);
  }
});
function vendorFixture(fn) {
  const temp = mkdtempSync(join(tmpdir(), "release vendor ")), source = join(temp, "source"), target = join(temp, "target");
  try {
    for (const name of releaseFiles) put(join(source, "scripts", name), `// ${name}\n`);
    put(join(source, "LICENSE"), "Fixture MIT notice\n");
    for (const dir of [source, target]) put(join(dir, "package.json"), '{"private":true,"devDependencies":{"yaml":"2.9.1"}}');
    fn({ source, target, run: (extra = {}) => syncReleaseTools({ source, target, ...extra }) });
  } finally { rmSync(temp, { recursive: true, force: true }); }
}
test("vendor default is read-only; explicit sync/check replay the same reviewed inventory", () => vendorFixture(({ source, target, run }) => {
  const before = readdirSync(target); assert.equal(run().status, "fail"); assert.deepEqual(readdirSync(target), before);
  assert.equal(run({ write: true }).status, "pass"); const first = readFileSync(join(target, "tools/release-vendor.json")); assert.equal(run().status, "pass"); run({ write: true }); assert.deepEqual(readFileSync(join(target, "tools/release-vendor.json")), first);
  put(join(source, "scripts/release.mjs"), "// canonical update\n"); assert.equal(run().status, "fail"); run({ write: true }); assert.equal(run().status, "pass");
}));
test("foreign or locally modified vendor files are preserved, with no partial sync", () => vendorFixture(({ target, run }) => {
  put(join(target, "tools/release-native.mjs"), "foreign\n"); assert.throws(() => run({ write: true }), /foreign or locally modified/); assert.equal(existsSync(join(target, "tools/release.mjs")), false); assert.equal(readFileSync(join(target, "tools/release-native.mjs"), "utf8"), "foreign\n");
  rmSync(join(target, "tools/release-native.mjs")); run({ write: true }); put(join(target, "tools/release.mjs"), "local edit\n"); assert.throws(() => run({ write: true }), /foreign or locally modified/); assert.equal(readFileSync(join(target, "tools/release.mjs"), "utf8"), "local edit\n");
}));
test("foreign ownership and mismatched maintainer dependencies block sync", () => vendorFixture(({ target, run }) => {
  put(join(target, "tools/release-vendor.json"), '{"schema":1,"owner":"someone else","files":{}}'); assert.throws(() => run({ write: true }), /foreign or incompatible/);
  rmSync(join(target, "tools/release-vendor.json")); put(join(target, "package.json"), '{"private":true,"devDependencies":{"yaml":"1.0.0"}}'); assert.throws(() => run({ write: true }), /maintainer dependencies differ/); assert.equal(existsSync(join(target, "tools/release.mjs")), false);
}));
test("runtime manifest contains every shared release module and dependency lock", () => {
  const files = JSON.parse(readFileSync(join(repo, ".claude-plugin/plugin.json"))).metadata.deploy.runtimeFiles;
  for (const file of [...releaseFiles.map((name) => `scripts/${name}`), "scripts/deploy.mjs", "package.json", "package-lock.json"]) assert.ok(files.includes(file), file);
});
