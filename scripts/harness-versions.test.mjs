#!/usr/bin/env node
// Tests for skills/meta/harness-changelog/scripts/harness-versions.mjs. Each test builds a fake
// harness (a node script that prints a version and per-subcommand help from a JSON file) and a
// throwaway manifest; no real harness is run.
//
// Run: node --test scripts/harness-versions.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compare, expand, helpHash, main, normalize } from "../skills/meta/harness-changelog/scripts/harness-versions.mjs";

const FAKE = `
const out = JSON.parse(require("fs").readFileSync(process.env.FAKE_OUT, "utf8"));
const key = process.argv.slice(2).join(" ");
if (key === "--version") { console.log(out.version); process.exit(0); }
if (!(key in out.help)) { process.exit(3); }
(out.stderr ? process.stderr : process.stdout).write(out.help[key]);
`;

function sandbox(t, out) {
  const dir = mkdtempSync(join(tmpdir(), "gm-hv-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const fake = join(dir, "fake.cjs"), outFile = join(dir, "out.json"), manifest = join(dir, "versions.json");
  writeFileSync(fake, FAKE);
  const write = (o) => writeFileSync(outFile, JSON.stringify(o));
  write(out);
  writeFileSync(manifest, JSON.stringify({ schema: 1, harnesses: [
    { id: "fake", surface: "CLI", bin: [process.execPath], args: [fake], help: [["--help"], ["run", "--help"]] },
  ] }));
  const logs = [];
  const run = (...argv) => main(["--manifest", manifest, ...argv], { env: { ...process.env, FAKE_OUT: outFile }, home: "C:\\Users\\someone", today: "2026-11-01", log: (l) => logs.push(l) });
  return { run, write, logs, manifest };
}

const base = { version: "1.0.0", help: { "--help": "usage: fake [run]\n", "run --help": "usage: fake run [--x]\n" } };

test("a new harness is reported, recorded by --update, then unchanged", (t) => {
  const s = sandbox(t, base);
  assert.equal(s.run(), 1);
  assert.match(s.logs.at(-1), /^new\s+fake \(CLI\) 1\.0\.0/);
  assert.equal(s.run("--update"), 1);
  const rec = JSON.parse(readFileSync(s.manifest, "utf8")).harnesses[0].recorded;
  assert.equal(rec.version, "1.0.0");
  assert.equal(rec.date, "2026-11-01");
  assert.deepEqual(Object.keys(rec.hashes).sort(), ["--help", "run --help"]);
  assert.equal(s.run(), 0);
  assert.match(s.logs.at(-1), /^unchanged fake/);
});

test("a changed subcommand's help is named even when the version is the same", (t) => {
  const s = sandbox(t, base);
  s.run("--update");
  s.write({ ...base, help: { ...base.help, "run --help": "usage: fake run [--x] [--y]\n" } });
  assert.equal(s.run(), 1);
  assert.match(s.logs.at(-1), /^moved\s+fake \(CLI\) 1\.0\.0 -> 1\.0\.0; help changed: run --help$/);
});

test("a version bump is reported with from and to", (t) => {
  const s = sandbox(t, base);
  s.run("--update");
  s.write({ ...base, version: "fake 1.1.0 (build 7)" });
  assert.equal(s.run("--json"), 1);
  const [r] = JSON.parse(s.logs.at(-1)).results;
  assert.equal(r.status, "moved");
  assert.equal(r.from, "1.0.0");
  assert.equal(r.to, "1.1.0");
  assert.deepEqual(r.changedHelp, []);
});

test("help printed on stderr is hashed like stdout", (t) => {
  const s = sandbox(t, base);
  s.run("--update");
  s.write({ ...base, stderr: true });
  assert.equal(s.run(), 0);
});

test("a help command that prints nothing is a probe error, not a version", (t) => {
  const s = sandbox(t, { ...base, help: { "--help": "usage\n", "run --help": "" } });
  assert.equal(s.run(), 1);
  assert.match(s.logs.at(-1), /warning: run --help: printed nothing/);
});

test("a missing binary is reported as missing", (t) => {
  const s = sandbox(t, base);
  const m = JSON.parse(readFileSync(s.manifest, "utf8"));
  m.harnesses[0].bin = [join(tmpdir(), "no-such-harness.exe")];
  writeFileSync(s.manifest, JSON.stringify(m));
  assert.equal(s.run(), 1);
  assert.match(s.logs.at(-1), /^missing\s+fake/);
});

test("per-user paths and SIDs do not change the hash", () => {
  const a = "pipe \\\\.\\pipe\\crush-S-1-5-21-111-222-333-1001 under C:\\Users\\alice\\.crush\n";
  const b = "pipe \\\\.\\pipe\\crush-S-1-5-21-444-555-666-1002 under C:\\Users\\bob\\.crush\n";
  assert.equal(helpHash(a, "C:\\Users\\alice"), helpHash(b, "C:\\Users\\bob"));
  assert.equal(normalize("a\r\nb\r\n"), "a\nb\n");
});

test("expand resolves %VAR% and ~", () => {
  assert.equal(expand("%LOCALAPPDATA%/x", { LOCALAPPDATA: "C:/L" }), "C:/L/x");
  assert.equal(expand("~/x", { USERPROFILE: "C:/U" }), "C:/U/x");
  assert.equal(expand("%NOPE%/x", {}), "%NOPE%/x");
});

test("compare treats a removed help key as a change", () => {
  const r = compare({ version: "1", hashes: { a: "1", b: "2" } }, { version: "1", hashes: { a: "1" } });
  assert.equal(r.status, "moved");
  assert.deepEqual(r.changedHelp, ["b"]);
});
