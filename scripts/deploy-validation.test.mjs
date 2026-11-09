import "./test-git-env.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, existsSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";

const INSTALLER = join(dirname(fileURLToPath(import.meta.url)), "deploy.mjs");
function runInstaller(args, env = {}) {
  const result = spawnSync(process.execPath, [INSTALLER, ...args], { encoding: "utf8", env: { ...process.env, DO_NOT_TRACK: "1", ...env } });
  return { status: result.status, stdout: result.stdout + result.stderr };
}

function hookPack(dir, name) {
  mkdirSync(join(dir, ".claude-plugin"), { recursive: true });
  mkdirSync(join(dir, ".githooks"));
  writeFileSync(join(dir, ".claude-plugin/plugin.json"), JSON.stringify({ name, version: "0.1.0", skills: [] }));
  writeFileSync(join(dir, ".githooks/pre-push"), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
}

function hookCheckout(t, name = "grey-matter") {
  const root = mkdtempSync(join(tmpdir(), "deploy-hooks-")), repo = join(root, "repo"), home = join(root, "home");
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(home);
  hookPack(repo, name);
  const git = (...args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: "pipe" });
  git("init", "-q");
  return { repo, git, run: (pack = repo) => runInstaller(["list", "--pack", pack], { HOME: home, USERPROFILE: home }) };
}

test("hook setup warns once for the own checkout without changing Git config", (t) => {
  const f = hookCheckout(t), config = join(f.repo, ".git/config"), before = readFileSync(config);
  const missing = f.run();
  assert.equal(missing.status, 0, missing.stdout);
  assert.equal((missing.stdout.match(/git config core\.hooksPath \.githooks/g) ?? []).length, 1);
  assert.deepEqual(readFileSync(config), before);
  for (const hooksPath of [".githooks", join(f.repo, ".githooks")]) {
    f.git("config", "core.hooksPath", hooksPath);
    const configured = readFileSync(config), result = f.run();
    assert.equal(result.status, 0, result.stdout);
    assert.doesNotMatch(result.stdout, /git config core\.hooksPath/);
    assert.deepEqual(readFileSync(config), configured);
  }
});

test("hook setup stays silent in consumer projects", (t) => {
  const result = hookCheckout(t, "consumer").run();
  assert.equal(result.status, 0, result.stdout);
  assert.doesNotMatch(result.stdout, /git config core\.hooksPath/);
});

test("hook setup stays silent for a vendored grey-matter pack", (t) => {
  const f = hookCheckout(t, "consumer"), vendored = join(f.repo, "vendor/grey-matter");
  hookPack(vendored, "grey-matter");
  const result = f.run(vendored);
  assert.equal(result.status, 0, result.stdout);
  assert.doesNotMatch(result.stdout, /git config core\.hooksPath/);
});

test("static checks retain manifest validation without invoking native validators", (t) => {
  const root = mkdtempSync(join(tmpdir(), "deploy-static-")), pack = join(root, "pack");
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(pack, ".claude-plugin"), { recursive: true });
  mkdirSync(join(pack, "skills/example"), { recursive: true });
  writeFileSync(join(pack, ".claude-plugin/plugin.json"), JSON.stringify({ name: "example", version: "1.0.0", skills: "./skills/" }));
  writeFileSync(join(pack, "skills/example/SKILL.md"), "---\nname: example\ndescription: An example fixture\n---\nExample.\n");
  const marker = join(root, "native-called"), preload = join(root, "native.mjs");
  writeFileSync(preload, `import cp from "node:child_process"; import {syncBuiltinESMExports} from "node:module"; import {writeFileSync} from "node:fs";
const original = cp.spawnSync;
cp.spawnSync = (command, ...args) => { if (command !== "claude") return original(command, ...args); writeFileSync(${JSON.stringify(marker)}, "called"); return {status: 1, stdout: "", stderr: "fake native rejection"}; };
syncBuiltinESMExports();\n`);
  const run = (...args) => spawnSync(process.execPath, ["--import", pathToFileURL(preload).href, INSTALLER, "check", "--pack", pack, ...args], { encoding: "utf8" });
  const staticResult = run("--static");
  assert.equal(staticResult.status, 0, staticResult.stdout + staticResult.stderr);
  assert.equal(existsSync(marker), false);
  const native = run();
  assert.equal(native.status, 1);
  assert.match(native.stderr, /fake native rejection/);
  assert.equal(existsSync(marker), true);
  writeFileSync(join(pack, ".claude-plugin/plugin.json"), JSON.stringify({ name: "example", version: "wrong", skills: "./skills/" }));
  assert.equal(run("--static").status, 1);
  assert.equal(run("--static", "--profile", "directory").status, 2);
});

test("static checks flag a marketplace entry whose dependencies differ from plugin.json", (t) => {
  const root = mkdtempSync(join(tmpdir(), "deploy-deps-")), pack = join(root, "pack");
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const manifest = { name: "example", version: "1.0.0", skills: "./skills/", dependencies: [{ name: "dep", marketplace: "other" }] };
  const writePack = (entry) => {
    rmSync(join(pack, ".claude-plugin"), { recursive: true, force: true });
    mkdirSync(join(pack, ".claude-plugin"), { recursive: true });
    mkdirSync(join(pack, "skills/example"), { recursive: true });
    writeFileSync(join(pack, ".claude-plugin/plugin.json"), JSON.stringify(manifest));
    writeFileSync(join(pack, ".claude-plugin/marketplace.json"), JSON.stringify({ name: "example-market", plugins: [entry] }));
    writeFileSync(join(pack, "skills/example/SKILL.md"), "---\nname: example\ndescription: An example fixture\n---\nExample.\n");
  };
  const run = () => runInstaller(["check", "--pack", pack, "--static"]);
  writePack({ name: "example", source: "./", description: "fixture" });
  const missing = run();
  assert.equal(missing.status, 1);
  assert.match(missing.stdout, /dependencies \[\] differ from plugin.json \[dep@other\]/);
  writePack({ name: "example", source: "./", description: "fixture", dependencies: [{ name: "dep", marketplace: "other" }] });
  assert.equal(run().status, 0);
  writePack({ name: "example", source: "./", description: "fixture", dependencies: ["dep@elsewhere"] });
  const wrongMarket = run();
  assert.equal(wrongMarket.status, 1);
  assert.match(wrongMarket.stdout, /dependencies \[dep@elsewhere\] differ from plugin.json \[dep@other\]/);
});
