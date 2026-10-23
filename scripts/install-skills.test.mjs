#!/usr/bin/env node
// Regression tests for install-skills.mjs — the installer's foreign-skill
// safety contract (ticket 26).
//
// Run: node --test scripts/install-skills.test.mjs
//
// These tests NEVER touch a real harness skill root. Each test builds an
// isolated throwaway root under the OS temp dir, runs the installer against it
// with --root, and asserts on the filesystem + manifest. The installer is
// driven as a subprocess (its functions aren't exported), which is exactly the
// surface a user hits.

import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync,
  readdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const INSTALLER = join(HERE, "install-skills.mjs");
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
