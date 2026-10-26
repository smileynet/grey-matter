#!/usr/bin/env node
// Tests for probe-agent-shell.mjs. Every test uses a throwaway settings file and fake bash/brew
// binaries under the OS temp dir; no real ~/.claude file or system bash decides the outcome.
//
// Run: node --test scripts/probe-agent-shell.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "probe-agent-shell.mjs");
const unix = process.platform !== "win32";

function withDir(fn) {
  const d = mkdtempSync(join(tmpdir(), "gm-agentshell-"));
  try { fn(d); } finally { rmSync(d, { recursive: true, force: true }); }
}

function exe(path, body) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `#!/bin/sh\n${body}\n`);
  chmodSync(path, 0o755);
  return path;
}
const fakeBash = (path, major) => exe(path, `echo "GNU bash, version ${major}.2.0(1)-release"`);
const fakeBrew = (d, onRequest) =>
  exe(join(d, "brew"), `echo '${JSON.stringify({ formulae: [{ installed: [{ installed_on_request: onRequest }] }] })}'`);

function run(d, settings, extra = []) {
  const s = join(d, "settings.json");
  if (settings !== undefined) writeFileSync(s, typeof settings === "string" ? settings : JSON.stringify(settings, null, 2));
  const good = fakeBash(join(d, "good", "bash"), 5);
  const r = spawnSync(process.execPath, [SCRIPT, "--settings", s, "--platform", "linux", "--candidates", good, "--brew", join(d, "nobrew"), ...extra], { encoding: "utf8" });
  return { ...r, s, good };
}

test("unset key is a finding that names the recommended bash", { skip: !unix }, () => {
  withDir((d) => {
    const r = run(d, { model: "x" });
    assert.equal(r.status, 1);
    assert.match(r.stdout, new RegExp(`CLAUDE_CODE_SHELL is unset.*${r.good}`));
  });
});

test("--apply adds the key, keeps other keys, and then reports ok", { skip: !unix }, () => {
  withDir((d) => {
    const r = run(d, { model: "x", env: { FOO: "1" }, hooks: { a: 1 } }, ["--apply"]);
    assert.equal(r.status, 0, r.stdout);
    const cfg = JSON.parse(readFileSync(r.s, "utf8"));
    assert.deepEqual(cfg, { model: "x", env: { FOO: "1", CLAUDE_CODE_SHELL: r.good }, hooks: { a: 1 } });
    assert.match(r.stdout, /applied[\s\S]*ok/);
  });
});

test("without --apply the settings file is never written", { skip: !unix }, () => {
  withDir((d) => {
    const before = '{ "model": "x" }';
    const r = run(d, before);
    assert.equal(readFileSync(r.s, "utf8"), before);
  });
});

test("a configured modern bash is ok", { skip: !unix }, () => {
  withDir((d) => {
    const b = fakeBash(join(d, "mine", "bash"), 5);
    assert.equal(run(d, { env: { CLAUDE_CODE_SHELL: b } }).status, 0);
  });
});

test("bash 3, a non-bash, a missing path and a Cellar path are each findings", { skip: !unix }, () => {
  withDir((d) => {
    const old = fakeBash(join(d, "old", "bash"), 3);
    const zsh = exe(join(d, "zsh"), 'echo "zsh 5.9"');
    const cellar = fakeBash(join(d, "Cellar", "bash", "5.3.15", "bin", "bash"), 5);
    for (const [value, msg] of [[old, /is bash 3/], [zsh, /not an executable bash/], [join(d, "missing"), /not an executable bash/], [cellar, /versioned Cellar path/]]) {
      const r = run(d, { env: { CLAUDE_CODE_SHELL: value } });
      assert.equal(r.status, 1, value);
      assert.match(r.stdout, msg);
    }
  });
});

test("invalid JSON is reported and left untouched, even with --apply", { skip: !unix }, () => {
  withDir((d) => {
    const r = run(d, "{ not json", ["--apply"]);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /not valid JSON/);
    assert.equal(readFileSync(r.s, "utf8"), "{ not json");
  });
});

test("darwin: Homebrew bash installed only as a dependency is a finding", { skip: !unix }, () => {
  withDir((d) => {
    const real = fakeBash(join(d, "Cellar", "bash", "5.3.20", "bin", "bash"), 5);
    const link = join(d, "bin", "bash");
    mkdirSync(dirname(link), { recursive: true });
    symlinkSync(real, link);
    const s = join(d, "settings.json");
    writeFileSync(s, JSON.stringify({ env: { CLAUDE_CODE_SHELL: link } }));
    const probe = (onRequest) =>
      spawnSync(process.execPath, [SCRIPT, "--settings", s, "--platform", "darwin", "--candidates", link, "--brew", fakeBrew(d, onRequest)], { encoding: "utf8" });
    const dep = probe(false);
    assert.equal(dep.status, 1);
    assert.match(dep.stdout, /brew tab --installed-on-request bash/);
    assert.equal(probe(true).status, 0);
  });
});

test("platforms without a bash baseline are not applicable", () => {
  withDir((d) => {
    const r = spawnSync(process.execPath, [SCRIPT, "--settings", join(d, "none.json"), "--platform", "win32"], { encoding: "utf8" });
    assert.equal(r.status, 0);
    assert.match(r.stdout, /n\/a/);
  });
});
