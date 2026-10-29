#!/usr/bin/env node
// Tests for install-agents-md.mjs: size budget + ownership safety. Every test uses throwaway
// --target files under the OS temp dir; no real harness file is touched.
//
// Run: node --test scripts/install-agents-md.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { BUDGET_BYTES, OWNER_MARK, SOURCE } from "./install-agents-md.mjs";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "install-agents-md.mjs");
const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });

function withDir(fn) {
  const d = mkdtempSync(join(tmpdir(), "gm-agentsmd-"));
  try { fn(d); } finally { rmSync(d, { recursive: true, force: true }); }
}

test("source global/AGENTS.md is within the always-on size budget", () => {
  assert.ok(Buffer.byteLength(readFileSync(SOURCE, "utf8")) <= BUDGET_BYTES);
});

test("install creates nested targets with the owner mark; reinstall is a no-op", () => {
  withDir((d) => {
    const t = join(d, "a", "AGENTS.md");
    assert.equal(run("--target", t).status, 0);
    assert.ok(readFileSync(t, "utf8").startsWith(OWNER_MARK));
    assert.match(run("--target", t).stdout, /current/);
  });
});

test("install refuses a foreign file without --force and leaves it untouched", () => {
  withDir((d) => {
    const t = join(d, "CLAUDE.md");
    writeFileSync(t, "my own rules\n");
    const r = run("--target", t);
    assert.notEqual(r.status, 0);
    assert.match(r.stdout, /refused/);
    assert.equal(readFileSync(t, "utf8"), "my own rules\n");
    assert.equal(run("--target", t, "--force").status, 0);
    assert.ok(readFileSync(t, "utf8").startsWith(OWNER_MARK));
  });
});

test("dry-run writes nothing", () => {
  withDir((d) => {
    const t = join(d, "AGENTS.md");
    assert.equal(run("--target", t, "--dry-run").status, 0);
    assert.ok(!existsSync(t));
  });
});

test("uninstall removes only owned files, never foreign ones", () => {
  withDir((d) => {
    const mine = join(d, "mine.md"), theirs = join(d, "theirs.md");
    run("--target", mine);
    writeFileSync(theirs, "foreign\n");
    assert.equal(run("uninstall", "--target", mine, "--target", theirs).status, 0);
    assert.ok(!existsSync(mine));
    assert.equal(readFileSync(theirs, "utf8"), "foreign\n");
    assert.match(run("list", "--target", theirs).stdout, /foreign/);
  });
});

test("the default codex target follows CODEX_HOME", () => {
  withDir((d) => {
    const home = join(d, "home"), codexHome = join(d, "custom-codex");
    mkdirSync(home); mkdirSync(codexHome);
    const r = spawnSync(process.execPath, [SCRIPT], { encoding: "utf8", env: { ...process.env, HOME: home, USERPROFILE: home, CODEX_HOME: codexHome } });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.ok(readFileSync(join(codexHome, "AGENTS.md"), "utf8").startsWith(OWNER_MARK));
    assert.equal(existsSync(join(home, ".codex", "AGENTS.md")), false);
  });
});
