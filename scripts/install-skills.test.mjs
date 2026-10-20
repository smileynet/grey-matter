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
