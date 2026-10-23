#!/usr/bin/env node
// Regression tests for deploy.mjs (proposal 08): the foreign-skill safety contract
// (ticket 26), the plugin dual-deploy guards (tickets 62, 210), and root selection.
//
// Run: node --test scripts/deploy.test.mjs
//
// These tests NEVER touch a real harness skill root. Each test builds an
// isolated throwaway root under the OS temp dir, runs the installer against it
// with --root, and asserts on the filesystem + manifest. The installer is
// driven as a subprocess (its functions aren't exported), which is exactly the
// surface a user hits.

import { createHash } from "node:crypto";
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, symlinkSync,
  readdirSync, chmodSync, cpSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const INSTALLER = join(HERE, "deploy.mjs");
const MANIFEST_NAME = ".installed-by-grey-matter.json";

let root;

function runInstaller(args) {
  // Returns { stdout, status }. Never throws on nonzero exit — we assert on it.
  try {
    const stdout = execFileSync("node", [INSTALLER, ...args], {
      encoding: "utf8",
    });
    return { stdout, status: 0 };
  } catch (e) {
    return { stdout: (e.stdout || "") + (e.stderr || ""), status: e.status ?? 1 };
  }
}

function readManifest() {
  const p = join(root, MANIFEST_NAME);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}

// A foreign skill the installer does NOT own: a same-named directory a user
// installed from elsewhere. We use a name that collides with a real grey-matter
// skill so the installer's installOne() will try to write it.
const FOREIGN_NAME = "orient";
const FOREIGN_SENTINEL = "FOREIGN - installed by someone else, must not be touched\n";

function seedForeignSkill() {
  const dest = join(root, FOREIGN_NAME);
  mkdirSync(dest, { recursive: true });
  writeFileSync(join(dest, "SKILL.md"), FOREIGN_SENTINEL);
}

function foreignIntact() {
  const p = join(root, FOREIGN_NAME, "SKILL.md");
  return existsSync(p) && readFileSync(p, "utf8") === FOREIGN_SENTINEL;
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "gm-installer-test-"));
});

after(() => {
  // beforeEach makes a fresh root each test; clean up the last one.
  if (root && existsSync(root)) rmSync(root, { recursive: true, force: true });
});

test("refused foreign destination is absent from the written manifest (AC1)", () => {
  seedForeignSkill();
  const r = runInstaller(["install", "--root", root]);
  assert.equal(r.status, 0, "install should not hard-fail on a refused foreign dir");

  const manifest = readManifest();
  assert.ok(manifest, "a manifest should be written");
  assert.ok(
    !manifest.installed.includes(FOREIGN_NAME),
    `refused "${FOREIGN_NAME}" must NOT be recorded as owned, got: ${JSON.stringify(manifest.installed)}`,
  );
});

test("repeat install then uninstall leave a refused foreign dir byte-for-byte intact (AC2)", () => {
  seedForeignSkill();
  runInstaller(["install", "--root", root]); // 1st: refuses foreign
  assert.ok(foreignIntact(), "foreign dir intact after first install");

  runInstaller(["install", "--root", root]); // 2nd: must still refuse, not adopt+clobber
  assert.ok(foreignIntact(), "foreign dir intact after second install");

  runInstaller(["uninstall", "--root", root]); // must not remove a dir it never owned
  assert.ok(foreignIntact(), "foreign dir intact after uninstall");
});

test("forced replacement is the only path that replaces a foreign dir (AC3)", () => {
  seedForeignSkill();
  runInstaller(["install", "--root", root]);
  assert.ok(foreignIntact(), "without --force, foreign dir is preserved");

  const r = runInstaller(["install", "--force", "--root", root]);
  assert.equal(r.status, 0);
  assert.ok(!foreignIntact(), "with --force, the foreign dir is replaced by ours");
  // And now it IS owned, so uninstall should remove it.
  const manifest = readManifest();
  assert.ok(manifest.installed.includes(FOREIGN_NAME), "forced skill is now owned");
});

test("a clean install into an empty root owns what it installed and uninstall removes only those (AC4 happy path)", () => {
  // No foreign seed. Install, then uninstall, and confirm the root is left clean
  // of our skills but the manifest accounting is correct throughout.
  const r1 = runInstaller(["install", "--root", root]);
  assert.equal(r1.status, 0);
  const manifest = readManifest();
  assert.ok(manifest.installed.length > 0, "installed something");
  assert.ok(manifest.installed.includes("orient"), "orient is among installed");
  // Every recorded skill exists on disk.
  for (const name of manifest.installed) {
    assert.ok(existsSync(join(root, name, "SKILL.md")), `${name} present on disk`);
  }

  const r2 = runInstaller(["uninstall", "--root", root]);
  assert.equal(r2.status, 0);
  assert.ok(!existsSync(join(root, MANIFEST_NAME)), "manifest removed on uninstall");
  assert.ok(!existsSync(join(root, "orient")), "owned skill removed on uninstall");
});

test("an unrelated foreign dir (no name collision) is never touched (AC2 corollary)", () => {
  const bystander = join(root, "someone-elses-skill");
  mkdirSync(bystander, { recursive: true });
  writeFileSync(join(bystander, "SKILL.md"), "bystander\n");

  runInstaller(["install", "--root", root]);
  runInstaller(["uninstall", "--root", root]);

  assert.ok(
    existsSync(join(bystander, "SKILL.md")),
    "an unrelated foreign dir must survive install+uninstall",
  );
});

// --- Dual-deploy guard: a Claude plugin install means no copies where Claude reads ---
// Each case uses its own temp tree: a fake plugins dir (CLAUDE_CODE_PLUGIN_CACHE_DIR)
// holding installed_plugins.json, and temp roots named like real harness roots.
function dualSandbox({ plugin }) {
  const base = mkdtempSync(join(tmpdir(), "gm-dual-"));
  const plugins = join(base, "plugins");
  mkdirSync(plugins, { recursive: true });
  const ids = plugin ? { [plugin]: [{ scope: "user", version: "0.1.0" }] } : {};
  writeFileSync(join(plugins, "installed_plugins.json"), JSON.stringify({ version: 2, plugins: ids }));
  return { base, env: { ...process.env, CLAUDE_CODE_PLUGIN_CACHE_DIR: plugins, CODEX_HOME: base } };
}

function runWithEnv(args, env) {
  try {
    return { stdout: execFileSync("node", [INSTALLER, ...args], { encoding: "utf8", env }), status: 0 };
  } catch (e) {
    return { stdout: (e.stdout || "") + (e.stderr || ""), status: e.status ?? 1 };
  }
}

test("plugin installed: a .claude/skills root is skipped and nothing is copied", () => {
  const { base, env } = dualSandbox({ plugin: "grey-matter@grey-matter" });
  try {
    const claudeRoot = join(base, ".claude", "skills");
    const r = runWithEnv(["--root", claudeRoot], env);
    assert.equal(r.status, 0, r.stdout);
    assert.match(r.stdout, /skipped: Claude plugin grey-matter@grey-matter is installed/);
    assert.ok(!existsSync(join(claudeRoot, "orient")), "no skill copied into a root Claude reads");
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test("plugin installed: earlier copies are removed, a foreign dir is left alone", () => {
  const { base, env } = dualSandbox({ plugin: null });
  const claudeRoot = join(base, ".claude", "skills");
  try {
    assert.equal(runWithEnv(["--root", claudeRoot], env).status, 0); // copies, no plugin yet
    assert.ok(existsSync(join(claudeRoot, "orient")), "precondition: copy installed");
    mkdirSync(join(claudeRoot, "someone-elses"), { recursive: true });
    writeFileSync(join(env.CLAUDE_CODE_PLUGIN_CACHE_DIR, "installed_plugins.json"),
      JSON.stringify({ version: 2, plugins: { "grey-matter@grey-matter": [{}] } }));
    const r = runWithEnv(["--root", claudeRoot], env);
    assert.equal(r.status, 0, r.stdout);
    assert.ok(!existsSync(join(claudeRoot, "orient")), "our earlier copy removed");
    assert.ok(!existsSync(join(claudeRoot, MANIFEST_NAME)), "our manifest removed");
    assert.ok(existsSync(join(claudeRoot, "someone-elses")), "foreign dir untouched");
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test("plugin installed: a project .agents/skills root is skipped too", () => {
  const { base, env } = dualSandbox({ plugin: "grey-matter@grey-matter" });
  try {
    const projectRoot = join(base, "proj", ".agents", "skills");
    const r = runWithEnv(["--root", projectRoot], env);
    assert.match(r.stdout, /skipped: Claude plugin/);
    assert.ok(!existsSync(join(projectRoot, "orient")));
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test("plugin installed: roots Claude doesn't read still install; --allow-dual overrides", () => {
  const { base, env } = dualSandbox({ plugin: "grey-matter@grey-matter" });
  try {
    const kiroRoot = join(base, ".kiro", "skills");
    assert.equal(runWithEnv(["--root", kiroRoot], env).status, 0);
    assert.ok(existsSync(join(kiroRoot, "orient")), "non-Claude root unaffected by the guard");
    const claudeRoot = join(base, ".claude", "skills");
    assert.equal(runWithEnv(["--root", claudeRoot, "--allow-dual"], env).status, 0);
    assert.ok(existsSync(join(claudeRoot, "orient")), "--allow-dual copies anyway");
  } finally { rmSync(base, { recursive: true, force: true }); }
});


test("Codex plugin removes owned copies, preserves foreign skills, and honors disable/override", () => {
  const { base, env } = dualSandbox({ plugin: null });
  try {
    const root = join(base, ".codex", "skills");
    const config = join(base, "config.toml");
    assert.equal(runWithEnv(["--root", root], env).status, 0);
    mkdirSync(join(root, "foreign"));
    writeFileSync(config, '[plugins."grey-matter@grey-matter"]\nenabled = true\n');
    const skipped = runWithEnv(["--root", root], env);
    assert.equal(skipped.status, 0, skipped.stdout);
    assert.match(skipped.stdout, /skipped: Codex plugin/);
    assert.ok(!existsSync(join(root, "orient")));
    assert.ok(existsSync(join(root, "foreign")));
    assert.equal(runWithEnv(["--root", root, "--allow-dual"], env).status, 0);
    assert.ok(existsSync(join(root, "orient")));
    writeFileSync(config, '[plugins."grey-matter@grey-matter"]\nenabled = false\n');
    assert.equal(runWithEnv(["--root", root], env).status, 0);
    assert.ok(existsSync(join(root, "orient")));
    writeFileSync(config, '[plugins."grey-matter@grey-matter"]\nenabled = true\n');
    const shared = join(base, ".agents", "skills");
    assert.match(runWithEnv(["--root", shared], env).stdout, /skipped: Codex plugin/);
  } finally { rmSync(base, { recursive: true, force: true }); }
});

// --- Root selection with no --root: a fake HOME holding the harness dirs -----------------
// HOME (and USERPROFILE) point at a temp tree, so the real harness roots are never read or
// written. Plugin state comes from the fake ~/.claude/plugins and ~/.codex/config.toml.
function homeSandbox({ harnesses = [], claude = false, codex = false } = {}) {
  const home = mkdtempSync(join(tmpdir(), "gm-home-"));
  const dirs = { kiro: ".kiro", codex: ".codex", claude: ".claude", opencode: join(".config", "opencode") };
  for (const h of harnesses) mkdirSync(join(home, dirs[h]), { recursive: true });
  if (claude) {
    mkdirSync(join(home, ".claude", "plugins"), { recursive: true });
    writeFileSync(join(home, ".claude", "plugins", "installed_plugins.json"),
      JSON.stringify({ version: 2, plugins: { "grey-matter@grey-matter": [{}] } }));
  }
  if (codex) {
    mkdirSync(join(home, ".codex"), { recursive: true });
    writeFileSync(join(home, ".codex", "config.toml"), '[plugins."grey-matter@grey-matter"]\nenabled = true\n');
  }
  if (codex) {
  const cached = join(home, ".codex", "plugins", "cache", "grey-matter", "grey-matter", "0.1.0");
  mkdirSync(join(cached, ".codex-plugin"), { recursive: true });
  cpSync(join(HERE, "..", "skills"), join(cached, "skills"), { recursive: true });
  cpSync(join(HERE, "..", ".codex-plugin", "plugin.json"), join(cached, ".codex-plugin", "plugin.json"));
  }
  // A fake CLI keeps plugin refresh tests offline and away from the real Codex cache.
  const bin = join(home, "bin");
  mkdirSync(bin);
  const cli = join(bin, "codex");
  writeFileSync(cli, `#!${process.execPath}
const fs = require("node:fs");
const path = require("node:path");
const home = process.env.HOME;
const pack = process.env.TEST_PACK;
const args = process.argv.slice(2);
fs.appendFileSync(path.join(home, "codex-calls.jsonl"), JSON.stringify(args) + "\\n");
if (args[1] === "list") {
  console.log(process.env.TEST_PLUGIN_LIST || JSON.stringify({installed: [{pluginId: "grey-matter@grey-matter", name: "grey-matter", marketplaceName: "grey-matter", version: "0.1.0", enabled: true, source: {source: "local", path: process.env.TEST_PLUGIN_SOURCE || pack}}]}));
} else {
  if (process.env.TEST_REFRESH_FAIL) process.exit(1);
  const dest = path.join(home, "plugin-cache");
  fs.rmSync(dest, {recursive: true, force: true});
  fs.cpSync(path.join(pack, "skills"), dest, {recursive: true});
  console.log(JSON.stringify({installedPath: dest}));
}
`);
  chmodSync(cli, 0o755);
  const env = { ...process.env, HOME: home, USERPROFILE: home, PATH: bin + ":" + dirname(process.execPath), TEST_PACK: dirname(HERE) };
  delete env.CODEX_HOME;
  delete env.CLAUDE_CODE_PLUGIN_CACHE_DIR;
  return { home, env, has: (rel) => existsSync(join(home, rel, "orient", "SKILL.md")) };
}

test("default roots: each harness gets one copy; OpenCode is served by ~/.claude/skills", () => {
  const sb = homeSandbox({ harnesses: ["kiro", "codex", "claude", "opencode"] });
  try {
    const r = runWithEnv(["--no-agy"], sb.env);
    assert.equal(r.status, 0, r.stdout);
    assert.ok(sb.has(".kiro/skills") && sb.has(".codex/skills") && sb.has(".claude/skills"));
    assert.ok(!sb.has(".agents/skills"), "no shared copy: Codex and OpenCode would see it twice");
    assert.ok(!sb.has(".config/opencode/skills"), "OpenCode already reads ~/.claude/skills");
  } finally { rmSync(sb.home, { recursive: true, force: true }); }
});

test("default roots: plugins count as the copy, and stale copies are taken back", () => {
  const sb = homeSandbox({ harnesses: ["kiro", "codex", "claude", "opencode"] });
  try {
    // An earlier install, the old way: a copy in the shared root, plus a foreign dir there.
    assert.equal(runWithEnv(["--root", join(sb.home, ".agents", "skills")], sb.env).status, 0);
    mkdirSync(join(sb.home, ".agents", "skills", "someone-elses"));
    assert.equal(runWithEnv(["--no-agy"], sb.env).status, 0);
    assert.ok(!sb.has(".agents/skills"), "shared copy removed once each harness has its own");

    const withPlugins = homeSandbox({ harnesses: ["kiro", "opencode"], claude: true, codex: true });
    try {
      const r = runWithEnv(["--no-agy"], withPlugins.env);
      assert.equal(r.status, 0, r.stdout);
      assert.match(r.stdout, /claude\s+<- Claude plugin grey-matter@grey-matter/);
      assert.ok(!withPlugins.has(".claude/skills") && !withPlugins.has(".codex/skills"));
      assert.ok(withPlugins.has(".config/opencode/skills"), "OpenCode falls back to its own root");
      assert.ok(withPlugins.has(".kiro/skills"));
    } finally { rmSync(withPlugins.home, { recursive: true, force: true }); }
    assert.ok(existsSync(join(sb.home, ".agents", "skills", "someone-elses")), "foreign dir untouched");
  } finally { rmSync(sb.home, { recursive: true, force: true }); }
});

test("default roots: prefer the own root on an equal-cost shared-root choice", () => {
  // Both Codex roots are verified; its own root wins the deterministic tie.
  const sb = homeSandbox({ harnesses: ["codex"] });
  try {
    assert.equal(runWithEnv(["--no-agy"], sb.env).status, 0);
    assert.ok(sb.has(".codex/skills") && !sb.has(".agents/skills"));
  } finally { rmSync(sb.home, { recursive: true, force: true }); }
});

test("default roots: no known harness falls back to the shared ~/.agents/skills", () => {
  const sb = homeSandbox();
  try {
    assert.equal(runWithEnv(["--no-agy"], sb.env).status, 0);
    assert.ok(sb.has(".agents/skills"));
  } finally { rmSync(sb.home, { recursive: true, force: true }); }
});

test("agy: with ~/.gemini present and no agy CLI, the plugin is packaged and copied", () => {
  const sb = homeSandbox({ harnesses: ["kiro"] });
  try {
    mkdirSync(join(sb.home, ".gemini", "config", "plugins"), { recursive: true });
    const out = join(sb.home, "agy-out");
    const r = runWithEnv(["agy", "install", "--out", out], sb.env);
    assert.equal(r.status, 0, r.stdout);
    const dest = join(sb.home, ".gemini", "config", "plugins", "grey-matter");
    assert.equal(JSON.parse(readFileSync(join(dest, "plugin.json"), "utf8")).name, "grey-matter");
    assert.ok(existsSync(join(dest, "skills", "orient", "SKILL.md")));
    const wrap = join(dest, "skills", "wrap-session");
    for (const path of ["../../docs/agents/doc-conventions.md", "../../docs/agents/maintenance-skills.md", "../../.references/README.md"]) {
      assert.ok(existsSync(join(wrap, path)), `packaged wrap-session resource: ${path}`);
    }
    assert.match(readFileSync(join(wrap, "SKILL.md"), "utf8"), /\]\(\.\.\/\.\.\/docs\/agents\/doc-conventions\.md\)/);
    assert.ok(existsSync(join(dest, "docs", "agents", "report-format.md")), "transitive documentation link is included");
  } finally { rmSync(sb.home, { recursive: true, force: true }); }
});

test("agy: missing resources fail before replacing the last package; repaired links build in isolation", () => {
  const sb = homeSandbox();
  try {
    const pack = join(sb.home, "source");
    const skill = join(pack, "skills", "bucket", "example");
    mkdirSync(skill, { recursive: true });
    mkdirSync(join(pack, ".claude-plugin"));
    writeFileSync(join(pack, ".claude-plugin", "plugin.json"), JSON.stringify({ name: "example", version: "1.0.0", skills: ["./skills/bucket"] }));
    writeFileSync(join(skill, "SKILL.md"), "---\nname: example\ndescription: Resource fixture\n---\n[Guide](../../../guide.md)\n`[Example](missing-inline.md)`\n```md\n[Example](missing-fenced.md)\n```\n");
    const out = join(sb.home, "package");
    mkdirSync(out);
    writeFileSync(join(out, "previous.txt"), "last good package");
    const args = ["agy", "build", "--pack", pack, "--out", out];
    const failed = runWithEnv(args, sb.env);
    assert.notEqual(failed.status, 0);
    assert.match(failed.stdout, /package resource missing: guide.md/);
    assert.equal(readFileSync(join(out, "previous.txt"), "utf8"), "last good package");
    writeFileSync(join(pack, "guide.md"), "[Details](details.md)\n[Skill](skills/bucket/example/SKILL.md)\n");
    writeFileSync(join(pack, "details.md"), "Resource detail\n");
    assert.equal(runWithEnv(args, sb.env).status, 0);
    rmSync(pack, { recursive: true });
    assert.match(readFileSync(join(out, "skills", "example", "SKILL.md"), "utf8"), /\[Guide\]\(\.\.\/\.\.\/guide\.md\)/);
    assert.match(readFileSync(join(out, "skills", "example", "SKILL.md"), "utf8"), /`\[Example\]\(missing-inline\.md\)`/);
    assert.equal(readFileSync(join(out, "details.md"), "utf8"), "Resource detail\n");
    assert.match(readFileSync(join(out, "guide.md"), "utf8"), /\[Skill\]\(skills\/example\/SKILL\.md\)/);
    assert.equal(JSON.parse(readFileSync(join(out, "plugin.json"), "utf8")).skills, undefined);
    assert.ok(!existsSync(join(out, "previous.txt")));
  } finally { rmSync(sb.home, { recursive: true, force: true }); }
});

test("audit: reports unowned dirs and a skill a harness sees twice", () => {
  const sb = homeSandbox({ harnesses: ["opencode"] });
  try {
    for (const r of [join(".config", "opencode", "skills"), join(".agents", "skills")]) {
      mkdirSync(join(sb.home, r, "stray"), { recursive: true });
    }
    const r = runWithEnv(["audit"], sb.env);
    assert.match(r.stdout, /unowned: stray/);
    assert.match(r.stdout, /opencode sees 1 skill\(s\) twice: stray/);
    assert.equal(runWithEnv(["audit", "--strict"], sb.env).status, 1);
  } finally { rmSync(sb.home, { recursive: true, force: true }); }
});

test("lint: metadata.deploy.forbidRefs blocks a skill naming one outside the pack", () => {
  const pack = mkdtempSync(join(tmpdir(), "gm-pack-"));
  try {
    mkdirSync(join(pack, ".claude-plugin"));
    writeFileSync(join(pack, ".claude-plugin", "plugin.json"),
      JSON.stringify({ name: "demo", version: "1.0.0", metadata: { deploy: { forbidRefs: ["wrap-session"] } } }));
    mkdirSync(join(pack, "skills", "demo-core"), { recursive: true });
    writeFileSync(join(pack, "skills", "demo-core", "SKILL.md"), "---\nname: demo-core\n---\nThen run wrap-session.\n");
    const r = runInstaller(["--pack", pack, "--root", root]);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /references skills outside the pack: wrap-session/);
  } finally { rmSync(pack, { recursive: true, force: true }); }
});

test("default roots: separate a plugin root symlink and preserve both harnesses' foreign skills", () => {
  const sb = homeSandbox({ harnesses: ["kiro", "codex"], codex: true });
  try {
    const kiro = join(sb.home, ".kiro", "skills");
    mkdirSync(join(kiro, "foreign"), { recursive: true });
    writeFileSync(join(kiro, "foreign", "SKILL.md"), "foreign sentinel");
    symlinkSync(kiro, join(sb.home, ".codex", "skills"), process.platform === "win32" ? "junction" : "dir");
    const r = runWithEnv(["--no-agy"], sb.env);
    assert.equal(r.status, 0, r.stdout);
    assert.match(r.stdout, /separating codex skill root/);
    assert.ok(sb.has(".kiro/skills"));
    assert.ok(!sb.has(".codex/skills"));
    assert.equal(readFileSync(join(sb.home, ".codex", "skills", "foreign", "SKILL.md"), "utf8"), "foreign sentinel");
    assert.equal(readFileSync(join(kiro, "foreign", "SKILL.md"), "utf8"), "foreign sentinel");
    const repeat = runWithEnv(["--no-agy"], sb.env);
    assert.equal(repeat.status, 0, repeat.stdout);
    assert.doesNotMatch(repeat.stdout, /separating codex skill root/);
  } finally { rmSync(sb.home, { recursive: true, force: true }); }
});

test("Codex: default deploy refreshes the installed plugin once; dry-run and explicit roots do not", () => {
  const sb = homeSandbox({ harnesses: ["codex"], codex: true });
  try {
    assert.equal(runWithEnv(["--no-agy", "--dry-run"], sb.env).status, 0);
    const log = join(sb.home, "codex-calls.jsonl");
    assert.ok(!existsSync(log));
    const r = runWithEnv(["--no-agy"], sb.env);
    assert.equal(r.status, 0, r.stdout);
    assert.ok(!sb.has(".codex/skills"));
    assert.equal(readFileSync(join(sb.home, "plugin-cache", "meta", "sync", "SKILL.md"), "utf8"),
      readFileSync(join(HERE, "..", "skills", "meta", "sync", "SKILL.md"), "utf8"));
    const calls = readFileSync(log, "utf8").trim().split("\n").map(JSON.parse);
    assert.equal(calls.filter((c) => c[1] === "add").length, 1);
    assert.equal(runWithEnv(["--root", join(sb.home, ".codex", "skills")], sb.env).status, 0);
    assert.equal(readFileSync(log, "utf8").trim().split("\n").length, 2);
  } finally { rmSync(sb.home, { recursive: true, force: true }); }
});

test("Codex: a failed refresh or different marketplace source preserves existing copies", () => {
  const sb = homeSandbox({ harnesses: ["codex"] });
  try {
    assert.equal(runWithEnv(["--no-agy"], sb.env).status, 0);
    writeFileSync(join(sb.home, ".codex", "config.toml"), '[plugins."grey-matter@grey-matter"]\nenabled = true\n');
    const failed = runWithEnv(["--no-agy"], { ...sb.env, TEST_REFRESH_FAIL: "1" });
    assert.notEqual(failed.status, 0);
    assert.ok(sb.has(".codex/skills"));
    const wrong = runWithEnv(["--no-agy"], { ...sb.env, TEST_PLUGIN_SOURCE: sb.home });
    assert.notEqual(wrong.status, 0);
    assert.match(wrong.stdout, /must use this checkout/);
    assert.ok(sb.has(".codex/skills"));
  } finally { rmSync(sb.home, { recursive: true, force: true }); }
});

test("audit: includes Codex plugin coverage when reporting bare duplicates", () => {
  const sb = homeSandbox({ harnesses: ["codex"], codex: true });
  try {
    assert.equal(runWithEnv(["--root", join(sb.home, ".codex", "skills"), "--allow-dual"], sb.env).status, 0);
    const r = runWithEnv(["audit"], sb.env);
    assert.match(r.stdout, /codex sees 44 skill\(s\) twice/);
  } finally { rmSync(sb.home, { recursive: true, force: true }); }
});


test("audit: enumerate multiple cached Codex plugins and detect actual source mismatches", () => {
  const sb = homeSandbox({ harnesses: ["codex"], codex: true });
  try {
    const cache = join(sb.home, ".codex", "plugins", "cache");
    rmSync(join(cache, "grey-matter", "grey-matter", "0.1.0", "skills", "meta", "sync"), { recursive: true });
    const at = join(cache, "team", "extra", "1.0.0");
    mkdirSync(join(at, ".codex-plugin"), { recursive: true });
    writeFileSync(join(at, ".codex-plugin", "plugin.json"), JSON.stringify({ name: "extra", skills: "./skills" }));
    mkdirSync(join(at, "skills", "nested", "orient"), { recursive: true });
    writeFileSync(join(at, "skills", "nested", "orient", "SKILL.md"), "---\nname: orient\n---\nExample");
    const installed = [
      { pluginId: "grey-matter@grey-matter", name: "grey-matter", marketplaceName: "grey-matter", version: "0.1.0", enabled: true },
      { pluginId: "extra@team", name: "extra", marketplaceName: "team", version: "1.0.0", enabled: true },
    ];
    const r = runWithEnv(["audit", "--json"], { ...sb.env, TEST_PLUGIN_LIST: JSON.stringify({ installed }) });
    assert.equal(r.status, 0, r.stdout);
    const data = JSON.parse(r.stdout);
    assert.equal(data.metrics.plugins, 2);
    assert.equal(data.inventory.find((p) => p.id === "grey-matter@grey-matter").skills.length, 43);
    assert.ok(data.findings.some((s) => s.includes("source mismatch") && s.includes("sync")));
    assert.ok(data.findings.some((s) => s.includes("codex sees 1 skill(s) twice: orient")));
    rmSync(at, { recursive: true });
    const missing = runWithEnv(["audit", "--json", "--strict"], { ...sb.env, TEST_PLUGIN_LIST: JSON.stringify({ installed }) });
    assert.equal(missing.status, 1);
    assert.ok(JSON.parse(missing.stdout).findings.some((s) => s.includes("installed manifest missing")));
  } finally { rmSync(sb.home, { recursive: true, force: true }); }
});

test("portfolio: reject cross-pack name collisions and vendored drift before writing", () => {
  const sb = homeSandbox();
  try {
    const other = join(sb.home, "other");
    mkdirSync(join(other, ".claude-plugin"), { recursive: true });
    writeFileSync(join(other, ".claude-plugin", "plugin.json"), JSON.stringify({ name: "other", version: "1.0.0" }));
    mkdirSync(join(other, "skills", "orient"), { recursive: true });
    writeFileSync(join(other, "skills", "orient", "SKILL.md"), "---\nname: orient\n---\nOther pack");
    writeFileSync(join(other, "deploy.mjs"), "old vendor copy");
    const portfolio = join(sb.home, "packs.json");
    writeFileSync(portfolio, JSON.stringify({ packs: [
      { name: "grey-matter", path: dirname(HERE) }, { name: "other", path: other, engine: "deploy.mjs" },
    ] }));
    const r = runWithEnv(["--portfolio", portfolio, "--no-agy"], sb.env);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /cross-pack collision: orient/);
    assert.match(r.stdout, /vendored deployer drift/);
    assert.ok(!sb.has(".agents/skills"));
  } finally { rmSync(sb.home, { recursive: true, force: true }); }
});

test("Codex: verified shared root supplies coverage without a redundant own copy", () => {
  const sb = homeSandbox({ harnesses: ["codex"] });
  try {
    const shared = join(sb.home, ".agents", "skills");
    assert.equal(runWithEnv(["--root", shared], sb.env).status, 0);
    const audited = runWithEnv(["audit", "--json"], sb.env);
    assert.equal(audited.status, 0, audited.stdout);
    assert.ok(!JSON.parse(audited.stdout).findings.some((s) => s.includes("codex sees")));
    assert.ok(sb.has(".agents/skills"));
  } finally { rmSync(sb.home, { recursive: true, force: true }); }
});


test("portfolio: deploy each registered active pack once without scanning other siblings", () => {
  const sb = homeSandbox();
  try {
    const other = join(sb.home, "other");
    mkdirSync(join(other, ".claude-plugin"), { recursive: true });
    writeFileSync(join(other, ".claude-plugin", "plugin.json"), JSON.stringify({ name: "other", version: "1.0.0" }));
    mkdirSync(join(other, "skills", "other-core"), { recursive: true });
    writeFileSync(join(other, "skills", "other-core", "SKILL.md"), "---\nname: other-core\n---\nOther pack");
    const portfolio = join(sb.home, "packs.json");
    writeFileSync(portfolio, JSON.stringify({ packs: [
      { name: "grey-matter", path: dirname(HERE) }, { name: "other", path: other },
      { name: "absent-optional", path: join(sb.home, "uncloned"), optional: true },
    ] }));
    const result = runWithEnv(["--portfolio", portfolio, "--no-agy"], sb.env);
    assert.equal(result.status, 0, result.stdout);
    assert.ok(sb.has(".agents/skills"));
    assert.ok(existsSync(join(sb.home, ".agents", "skills", "other-core", "SKILL.md")));
    assert.equal((result.stdout.match(/installed 44 skills/g) ?? []).length, 1);
    assert.equal((result.stdout.match(/installed 1 skills/g) ?? []).length, 1);
    assert.equal(runWithEnv(["--portfolio", portfolio, "--no-agy"], sb.env).status, 0);
  } finally { rmSync(sb.home, { recursive: true, force: true }); }
});


test("audit: retained legacy content stays unowned and changed bytes need review", () => {
  const sb = homeSandbox();
  try {
    const shared = join(sb.home, ".agents", "skills", "legacy");
    mkdirSync(shared, { recursive: true });
    const text = "---\nname: legacy\n---\nUser managed";
    writeFileSync(join(shared, "SKILL.md"), text);
    const treeSha256 = createHash("sha256").update("SKILL.md\0").update(text).update("\0").digest("hex");
    const inventory = join(sb.home, "legacy.json");
    writeFileSync(inventory, JSON.stringify({ root: "~/.agents/skills", entries: [{ name: "legacy", disposition: "keep-user-managed", treeSha256 }] }));
    const portfolio = join(sb.home, "packs.json");
    writeFileSync(portfolio, JSON.stringify({ packs: [{ name: "grey-matter", path: dirname(HERE) }], legacyInventory: "legacy.json" }));
    const r = runWithEnv(["audit", "--json", "--strict", "--portfolio", portfolio], sb.env);
    assert.equal(r.status, 0, r.stdout);
    assert.ok(JSON.parse(r.stdout).notices.some((n) => n.includes("1 retained user-managed")));
    assert.ok(!existsSync(join(shared, "..", MANIFEST_NAME)));
    writeFileSync(join(shared, "SKILL.md"), text + " changed");
    const changed = runWithEnv(["audit", "--json", "--strict", "--portfolio", portfolio], sb.env);
    assert.equal(changed.status, 1);
    assert.ok(JSON.parse(changed.stdout).findings.some((n) => n.includes("unowned: legacy")));
  } finally { rmSync(sb.home, { recursive: true, force: true }); }
});


test("legal artifacts: bundles and bare skills retain notices, and missing or empty requirements block replacement", () => {
  const sb = homeSandbox();
  try {
    const pack = join(sb.home, "source");
    const skill = join(pack, "skills", "example");
    mkdirSync(skill, { recursive: true });
    mkdirSync(join(pack, ".claude-plugin"));
    writeFileSync(join(pack, ".claude-plugin", "plugin.json"), JSON.stringify({
      name: "example", version: "1.0.0", license: "MIT AND Apache-2.0",
      metadata: { deploy: { legalFiles: ["LICENSE", "NOTICE"], skillLicenseFiles: ["LICENSE"] } },
    }));
    writeFileSync(join(skill, "SKILL.md"), "---\nname: example\ndescription: License fixture\n---\n");
    const required = [join(pack, "LICENSE"), join(pack, "NOTICE"), join(skill, "LICENSE")];
    for (const file of required) writeFileSync(file, "retained copyright and license\n");
    const out = join(sb.home, "package");
    const args = ["agy", "build", "--pack", pack, "--out", out];
    assert.equal(runWithEnv(args, sb.env).status, 0);
    for (const path of ["LICENSE", "NOTICE", "skills/example/LICENSE"]) {
      assert.equal(readFileSync(join(out, path), "utf8"), "retained copyright and license\n");
    }
    for (const file of required) {
      for (const state of ["missing", "empty"]) {
        if (state === "missing") rmSync(file); else writeFileSync(file, "");
        const result = runWithEnv(args, sb.env);
        assert.notEqual(result.status, 0);
        assert.match(result.stdout, /required legal artifact/);
        const check = runWithEnv(["check", "--pack", pack], sb.env);
        assert.notEqual(check.status, 0);
        assert.match(check.stdout, /required legal artifact/);
        assert.equal(readFileSync(join(out, "NOTICE"), "utf8"), "retained copyright and license\n");
        writeFileSync(file, "retained copyright and license\n");
      }
    }
    const bare = join(sb.home, "bare");
    assert.equal(runWithEnv(["install", "--pack", pack, "--root", bare, "--no-agy"], sb.env).status, 0);
    assert.equal(readFileSync(join(bare, "example", "LICENSE"), "utf8"), "retained copyright and license\n");
  } finally { rmSync(sb.home, { recursive: true, force: true }); }
});
