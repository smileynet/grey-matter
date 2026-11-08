#!/usr/bin/env node
// Regression tests for the Kimi plugin package. The public seam is the build CLI;
// all packages and staging directories are disposable and no plugin is registered.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUILDER = join(ROOT, "scripts", "build-kimi-plugin.mjs");
const PACK_VERSION = JSON.parse(readFileSync(join(ROOT, ".claude-plugin", "plugin.json"), "utf8")).version;
const SKILL_COUNT = readdirSync(join(ROOT, "skills"), { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name === "SKILL.md").length;

function sandbox() {
  return mkdtempSync(join(tmpdir(), "gm-kimi-"));
}

function run(out) {
  try {
    return { status: 0, stdout: execFileSync(process.execPath, [BUILDER, "--out", out], { encoding: "utf8" }) };
  } catch (error) {
    return { status: error.status ?? 1, stdout: (error.stdout || "") + (error.stderr || "") };
  }
}

test("kimi: build writes a self-contained skill-only plugin with every skill and linked resource", () => {
  const home = sandbox();
  try {
    const out = join(home, "plugin");
    const result = run(out);
    assert.equal(result.status, 0, result.stdout);
    const manifest = JSON.parse(readFileSync(join(out, "kimi.plugin.json"), "utf8"));
    assert.equal(manifest.name, "grey-matter");
    assert.equal(manifest.version, PACK_VERSION);
    assert.equal(manifest.license, "MIT AND Apache-2.0");
    assert.equal(manifest.skills, "./skills/");
    assert.equal(manifest.interface.displayName, "Grey Matter");
    assert.equal(manifest.mcp, undefined);
    assert.equal(manifest.hooks, undefined);

    const names = readdirSync(join(out, "skills"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith(".")).map((entry) => entry.name);
    assert.equal(names.length, SKILL_COUNT);
    assert.equal(new Set(names).size, SKILL_COUNT);
    for (const name of names) assert.ok(existsSync(join(out, "skills", name, "SKILL.md")), `${name}/SKILL.md`);

    const wrap = join(out, "skills", "wrap-session");
    assert.ok(existsSync(join(wrap, "../.resources-grey-matter/docs/agents/doc-conventions.md")), "linked resource is packaged");
    assert.ok(existsSync(join(out, "skills/.resources-grey-matter/LICENSES/Apache-2.0.txt")), "Apache license is packaged");
    assert.ok(existsSync(join(out, "locales/zh-CN.json")), "localized interface copy is packaged");
    assert.ok(readFileSync(join(out, "icon.png")).equals(readFileSync(join(ROOT, ".kimi-plugin/icon.png"))), "catalog icon is packaged byte-for-byte");
    assert.equal(existsSync(join(out, "AGENTS.md")), false, "root guidance must not become active plugin rules");
    assert.ok(existsSync(join(out, "skills/.resources-grey-matter/AGENTS.md")), "root guidance remains inert reference material");
    assert.equal(existsSync(join(out, "skills/.installed-by-grey-matter.json")), false, "installer ownership state is not shipped");
  } finally { rmSync(home, { recursive: true, force: true }); }
});

test("kimi: an unchanged rebuild preserves output and a later build repairs drift", () => {
  const home = sandbox();
  try {
    const out = join(home, "plugin");
    assert.equal(run(out).status, 0);
    const manifest = join(out, "kimi.plugin.json"), skill = join(out, "skills/orient/SKILL.md");
    const before = [lstatSync(manifest).mtimeMs, lstatSync(skill).mtimeMs];
    const repeat = run(out);
    assert.equal(repeat.status, 0, repeat.stdout);
    assert.match(repeat.stdout, /up to date/);
    assert.deepEqual([lstatSync(manifest).mtimeMs, lstatSync(skill).mtimeMs], before);

    writeFileSync(skill, "stale\n");
    writeFileSync(join(out, "stale.txt"), "from an older build\n");
    assert.equal(run(out).status, 0);
    assert.match(readFileSync(skill, "utf8"), /name: orient/);
    assert.equal(existsSync(join(out, "stale.txt")), false);
  } finally { rmSync(home, { recursive: true, force: true }); }
});

test("kimi: package preserves deliberate workflows and Kimi authorization boundaries", () => {
  const home = sandbox();
  try {
    const out = join(home, "plugin");
    const result = run(out);
    assert.equal(result.status, 0, result.stdout);
    const userInvoked = readdirSync(join(ROOT, "skills"), { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name === "SKILL.md")
      .map((entry) => join(entry.parentPath ?? entry.path, entry.name))
      .filter((file) => /^disable-model-invocation:\s*true\s*$/m.test(readFileSync(file, "utf8")))
      .map((file) => basename(dirname(file))).sort();
    const commands = readdirSync(join(out, "commands")).map((file) => file.replace(/\.md$/, "")).sort();
    assert.deepEqual(commands, userInvoked);
    assert.ok(!commands.includes("tdd"), "model-invoked skills do not need a user-only command shim");
    for (const name of commands) {
      const command = readFileSync(join(out, "commands", `${name}.md`), "utf8");
      assert.match(command, new RegExp(`name: ${name}(\\r?\\n)`));
      assert.match(command, /\$ARGUMENTS/);
    }

    const manifest = JSON.parse(readFileSync(join(out, "kimi.plugin.json"), "utf8"));
    assert.match(manifest.skillInstructions, /tkt --version/);
    assert.match(manifest.skillInstructions, /tkt-core/);
    const orchestrate = readFileSync(join(out, "skills/orchestrate/SKILL.md"), "utf8");
    assert.match(orchestrate, /harness-kimi\.md/);
    const kimi = readFileSync(join(out, "skills/orchestrate/references/harness-kimi.md"), "utf8");
    assert.match(kimi, /sequential/i);
    assert.match(kimi, /explicitly/i);
    assert.match(readFileSync(join(out, "skills/research/SKILL.md"), "utf8"), /On Kimi, research in-session/);
    assert.match(readFileSync(join(out, "skills/research-audit/SKILL.md"), "utf8"), /On Kimi, do not substitute a self-audit/);
  } finally { rmSync(home, { recursive: true, force: true }); }
});
