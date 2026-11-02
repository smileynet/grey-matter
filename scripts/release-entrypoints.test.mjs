import { test } from "node:test";
import assert from "node:assert/strict";
import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { releaseFiles, syncReleaseTools } from "./sync-release-tools.mjs";
const scripts = dirname(fileURLToPath(import.meta.url)), repo = dirname(scripts), wrapper = join(repo, "skills/meta/release/references/release.sh");
const put = (file, text) => { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, text); };
// On Windows, PATH's bash can be WSL's, which cannot open Windows paths; use the one Git ships.
function posixBash() {
  if (process.platform !== "win32") return "bash";
  const exec = spawnSync("git", ["--exec-path"], { encoding: "utf8" }).stdout?.trim();
  const bash = exec && resolve(exec, "../../../bin/bash.exe");
  return bash && existsSync(bash) ? bash : null;
}
const bash = posixBash(), noBash = bash ? false : "Git for Windows' bash.exe not found";
for (const path of ["skills/meta/release/references/release.sh", "skills/release/references/release.sh", "tools/release.sh"]) test(`wrapper finds shared tools and preserves arguments from ${path}`, { skip: noBash }, () => {
  const temp = mkdtempSync(join(tmpdir(), "release wrapper "));
  try {
    const entry = join(temp, path), dir = path === "tools/release.sh" ? "tools" : "scripts";
    mkdirSync(dirname(entry), { recursive: true }); cpSync(wrapper, entry);
    for (const name of ["release.mjs", "release-product.mjs", "release-native.mjs", "release-verify.mjs"]) put(join(temp, dir, name), 'console.log(JSON.stringify(process.argv.slice(2)));');
    for (const [mode, prefix] of [["prepare", ["prepare"]], ["verify", []], ["verify-product", []], ["verify-native", []]]) {
      const result = spawnSync(bash, [entry, mode, "--out", "path with spaces", "--execute"], { cwd: tmpdir(), encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr); assert.deepEqual(JSON.parse(result.stdout), [...prefix, "--out", "path with spaces", "--execute"]);
    }
  } finally { rmSync(temp, { recursive: true, force: true }); }
});
test("legacy version and publishing modes stop before any release operation", { skip: noBash }, () => {
  for (const args of [[], ["0.2.0"], ["patch", "--execute"], ["publish"], ["resume"]]) {
    const result = spawnSync(bash, [wrapper, ...args], { encoding: "utf8" }); assert.equal(result.status, 2, result.stderr); assert.match(result.stderr, /legacy publication is disabled/);
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
function deployerFixture(fn) {
  const scratch = join(dirname(repo), ".scratch"); mkdirSync(scratch, { recursive: true });
  const temp = mkdtempSync(join(scratch, "deployer vendor ")), target = join(temp, "tkt"), origin = join(temp, "origin.git"), hooks = join(temp, "empty-hooks");
  try {
    mkdirSync(hooks);
    spawnSync("git", ["init", "--bare", origin], { stdio: "ignore" });
    spawnSync("git", ["init", target], { stdio: "ignore" });
    const git = (...args) => {
      const result = spawnSync("git", ["-C", target, ...args], { encoding: "utf8", windowsHide: true });
      assert.equal(result.status, 0, result.stderr);
      return result.stdout.trim();
    };
    git("checkout", "-b", "main");
    git("config", "user.name", "Fixture"); git("config", "user.email", "fixture@example.invalid");
    put(join(target, "tools/deploy.mjs"), "stale vendor\n");
    git("add", "tools/deploy.mjs"); git("commit", "--no-verify", "-m", "Old deployer");
    git("remote", "add", "origin", origin);
    const pushed = spawnSync("git", ["-C", target, "-c", `core.hooksPath=${hooks}`, "push", "--set-upstream", "origin", "main"], { encoding: "utf8", windowsHide: true });
    assert.equal(pushed.status, 0, pushed.stderr);
    const source = join(temp, "grey-matter"); mkdirSync(source); mkdirSync(join(source, "scripts"));
    copyFileSync(join(repo, "scripts/deploy.mjs"), join(source, "scripts/deploy.mjs"));
    const cli = readFileSync(join(repo, "scripts/sync-release-tools.mjs"), "utf8").replace('from "./release-version.mjs"', 'from "./release-version-fixture.mjs"');
    put(join(source, "scripts/sync-release-tools.mjs"), cli);
    put(join(source, "scripts/release-version-fixture.mjs"), "export class ReleaseError extends Error {}\n");
    const packs = JSON.parse(readFileSync(join(repo, "skill-packs.json"), "utf8"));
    packs.packs.find((pack) => pack.name === "tkt").path = "../tkt";
    put(join(source, "skill-packs.json"), JSON.stringify(packs));
    const run = (...args) => {
      try {
        return spawnSync(process.execPath, [join(source, "scripts/sync-release-tools.mjs"), "--target", target, "--deployer", ...args], { encoding: "utf8", windowsHide: true });
      } catch (error) { return { status: 1, stdout: "", stderr: JSON.stringify({ errors: [error.message] }) }; }
    };
    fn({ temp, target, git, run, source });
  } finally { rmSync(temp, { recursive: true, force: true }); }
}
test("deployer command repairs a clean stale vendor and refuses later local edits", () => deployerFixture(({ target, git, run }) => {
  const check = run(); assert.equal(check.status, 1, check.stdout + check.stderr);
  assert.match(JSON.parse(check.stdout).findings[0], /deployer content differs/);
  const repair = run("--write"); assert.equal(repair.status, 0, repair.stdout + repair.stderr);
  assert.deepEqual(readFileSync(join(target, "tools/deploy.mjs")), readFileSync(join(repo, "scripts/deploy.mjs")));
  const manifestPath = join(target, "tools/deployer-vendor.json"), manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.owner, "smileynet/grey-matter-deployer");
  assert.equal(manifest.source, "https://github.com/smileynet/grey-matter");
  assert.equal(run("--write").status, 0, "the documented repair command is idempotent");

  git("add", "tools/deploy.mjs", "tools/deployer-vendor.json"); git("commit", "--no-verify", "-m", "Sync deployer");
  const pushed = spawnSync("git", ["-C", target, "-c", `core.hooksPath=${join(dirname(target), "empty-hooks")}`, "push"], { encoding: "utf8", windowsHide: true });
  assert.equal(pushed.status, 0, pushed.stderr);
  put(join(target, "tools/deploy.mjs"), "local edit\n");
  const local = run("--write"); assert.equal(local.status, 1, local.stdout + local.stderr);
  assert.match(JSON.parse(local.stderr).errors[0], /refusing to overwrite foreign or locally modified deployer/);
  assert.equal(readFileSync(join(target, "tools/deploy.mjs"), "utf8"), "local edit\n");
}));
test("documented deployer command repairs the stale registered vendor", () => deployerFixture(({ target, source, run }) => {
  const repair = run("--write"); assert.equal(repair.status, 0, repair.stdout + repair.stderr);
  assert.deepEqual(readFileSync(join(target, "tools/deploy.mjs")), readFileSync(join(source, "scripts/deploy.mjs")));
  assert.equal(JSON.parse(readFileSync(join(target, "tools/deployer-vendor.json"), "utf8")).source, "https://github.com/smileynet/grey-matter");
}));
test("deployer repair refuses foreign owner/source manifests and unregistered checkout", () => deployerFixture(({ target, run, source }) => {
  put(join(target, "tools/deployer-vendor.json"), JSON.stringify({ schema: 1, owner: "another-project", file: "tools/deploy.mjs", sha256: "0".repeat(64) }));
  const foreign = run("--write"); assert.equal(foreign.status, 1, foreign.stdout + foreign.stderr);
  assert.match(JSON.parse(foreign.stderr).errors[0], /foreign or incompatible deployer vendor manifest/);
  assert.equal(readFileSync(join(target, "tools/deploy.mjs"), "utf8"), "stale vendor\n");
  put(join(target, "tools/deployer-vendor.json"), JSON.stringify({ schema: 1, owner: "smileynet/grey-matter-deployer", source: "https://example.invalid/other", file: "tools/deploy.mjs", sha256: "0".repeat(64) }));
  const foreignSource = run("--write"); assert.equal(foreignSource.status, 1, foreignSource.stdout + foreignSource.stderr);
  assert.match(JSON.parse(foreignSource.stderr).errors[0], /foreign or incompatible deployer vendor manifest/);
  assert.equal(readFileSync(join(target, "tools/deploy.mjs"), "utf8"), "stale vendor\n");
  rmSync(join(target, "tools/deployer-vendor.json"));
  put(join(source, "skill-packs.json"), JSON.stringify({ packs: [] }));
  assert.throws(() => syncReleaseTools({ target, source, deployer: true, write: true }), /registered tkt checkout/);
  assert.equal(readFileSync(join(target, "tools/deploy.mjs"), "utf8"), "stale vendor\n");
}));
test("deployer repair refuses a checkout behind its fetched upstream", () => deployerFixture(({ target, run, git }) => {
  const upstream = spawnSync("git", ["-C", target, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false", "commit", "--allow-empty", "--no-verify", "-m", "Upstream update"], { encoding: "utf8", windowsHide: true });
  assert.equal(upstream.status, 0, upstream.stderr);
  const pushed = spawnSync("git", ["-C", target, "-c", `core.hooksPath=${join(dirname(target), "empty-hooks")}`, "push"], { encoding: "utf8", windowsHide: true });
  assert.equal(pushed.status, 0, pushed.stderr);
  git("reset", "--hard", "HEAD~1");
  const behind = run("--write"); assert.equal(behind.status, 1, behind.stdout + behind.stderr);
  assert.match(JSON.parse(behind.stderr).errors[0], /0 commit\(s\) ahead and 1 behind/);
  assert.equal(readFileSync(join(target, "tools/deploy.mjs"), "utf8"), "stale vendor\n");
}));
test("deployer repair refuses divergence and preserves its local commit and vendor edit", () => deployerFixture(({ target, run, git }) => {
  git("checkout", "-b", "local-work");
  git("branch", "--set-upstream-to", "origin/main", "local-work");
  put(join(target, "tools/deploy.mjs"), "local deployer bytes\n");
  const localCommit = spawnSync("git", ["-C", target, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false", "add", "tools/deploy.mjs"], { encoding: "utf8", windowsHide: true });
  assert.equal(localCommit.status, 0, localCommit.stderr);
  const commit = spawnSync("git", ["-C", target, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false", "commit", "-m", "Local deployer work"], { encoding: "utf8", windowsHide: true });
  assert.equal(commit.status, 0, commit.stderr);
  const localHead = git("rev-parse", "HEAD");
  git("checkout", "main");
  const upstream = spawnSync("git", ["-C", target, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false", "commit", "--allow-empty", "-m", "Upstream update"], { encoding: "utf8", windowsHide: true });
  assert.equal(upstream.status, 0, upstream.stderr);
  const upstreamCommit = git("rev-parse", "HEAD");
  const pushed = spawnSync("git", ["-C", target, "-c", `core.hooksPath=${join(dirname(target), "empty-hooks")}`, "push", "origin", "HEAD:main", "--force"], { encoding: "utf8", windowsHide: true });
  assert.equal(pushed.status, 0, pushed.stderr);
  git("checkout", "local-work");
  git("reset", "--hard", localHead);
  const divergent = run("--write"); assert.equal(divergent.status, 1, divergent.stdout + divergent.stderr);
  assert.match(JSON.parse(divergent.stderr).errors[0], /1 commit\(s\) ahead and 1 behind/);
  assert.equal(git("rev-parse", "HEAD"), localHead);
  assert.notEqual(git("rev-parse", "HEAD"), upstreamCommit);
  assert.equal(readFileSync(join(target, "tools/deploy.mjs"), "utf8"), "local deployer bytes\r\n");
}));
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
