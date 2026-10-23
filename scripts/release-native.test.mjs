import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { buildArtifacts } from "./release-artifacts.mjs";
import { verifyNative, isolatedEnvironment, requireNativeSuccess, requireExactNames } from "./release-native.mjs";
const good = () => ({ status: "pass", seed: { detected: true }, readmeControl: { detected: true }, runs: Array.from({ length: 3 }, () => ({ exit: 0, result: { success: true, directory: { findings: [] } } })) });
test("exact-name gate rejects missing, extra and duplicated skills despite equal totals", () => {
  requireExactNames(["b", "a"], ["a", "b"]);
  for (const names of [["a"], ["a", "c"], ["a", "a"], ["a", "b", "b"]]) assert.throws(() => requireExactNames(names, ["a", "b"]), /native skill names/);
});
for (const defect of ["missing-control", "readme-control", "missing-run", "exit", "success", "blocker", "incomplete", "failure"]) test(`native Claude gate rejects ${defect}`, () => {
  const result = good();
  if (defect === "missing-control") result.seed.detected = false;
  if (defect === "readme-control") result.readmeControl.detected = false;
  if (defect === "missing-run") result.runs.pop();
  if (defect === "exit") result.runs[0].exit = 1;
  if (defect === "success") result.runs[0].result.success = false;
  if (defect === "blocker") result.runs[0].result.directory.findings.push({ blocking: true, code: "README_MISSING" });
  if (defect === "incomplete") result.runs[0].result.directory.incomplete = true;
  if (defect === "failure") result.runs[0].result.directory.failure = "scan capped";
  assert.throws(() => requireNativeSuccess(result), /seeded controls/); requireNativeSuccess(good());
});
test("native environment excludes inherited credentials, Git context and user config", () => {
  const keys = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GEMINI_API_KEY", "GIT_INDEX_FILE", "CODEX_HOME", "CLAUDE_CONFIG_DIR", "XDG_CONFIG_HOME"], saved = keys.map((key) => [key, process.env[key]]);
  try {
    for (const key of keys) process.env[key] = "must-not-inherit";
    const env = isolatedEnvironment(join(tmpdir(), "new private home"));
    for (const key of keys) assert.notEqual(env[key], "must-not-inherit", key);
    assert.equal(env.OPENAI_API_KEY, undefined); assert.equal(env.GIT_INDEX_FILE, undefined); assert.equal(env.HOME, env.USERPROFILE);
  } finally { for (const [key, value] of saved) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
});
async function fixture(fn) {
  const dir = mkdtempSync(join(tmpdir(), "native fixture ")), repo = join(dir, "repo"), artifacts = join(dir, "artifacts"), out = join(dir, "evidence");
  const put = (file, bytes) => { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, bytes); };
  const git = (...args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: "pipe" }).trim();
  try {
    mkdirSync(repo); git("init", "-b", "main"); git("config", "user.name", "Fixture"); git("config", "user.email", "fixture@example.invalid"); git("config", "core.autocrlf", "false");
    put(join(repo, ".claude-plugin/plugin.json"), JSON.stringify({ name: "fixture", version: "0.1.0", skills: ["./skills"], metadata: { deploy: { legalFiles: ["LICENSE"] } } }));
    put(join(repo, ".claude-plugin/marketplace.json"), '{"name":"fixture","plugins":[{"name":"fixture","source":"./"}]}');
    put(join(repo, ".codex-plugin/plugin.json"), '{"name":"fixture","version":"0.1.0","skills":"./skills/"}');
    put(join(repo, "skills/example/SKILL.md"), "---\nname: example\ndescription: A native fixture\n---\nExample workflow.\n"); put(join(repo, "LICENSE"), "Fixture license\n");
    put(join(repo, "scripts/deploy.mjs"), readFileSync(new URL("./deploy.mjs", import.meta.url)));
    git("add", "."); git("-c", `core.hooksPath=${join(dir, "no hooks")}`, "commit", "-m", "Native fixture");
    buildArtifacts({ repo, ref: git("rev-parse", "HEAD"), out: artifacts });
    await fn({ dir, artifacts, out, run: (extra = {}) => verifyNative({ artifacts, out, ...extra }) });
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
test("dry-run validates bundles without executing binaries, output or identity changes", () => fixture(async ({ artifacts, out, run }) => {
  const before = readFileSync(join(artifacts, "release-metadata.json"));
  const result = await run({ codex: "does-not-exist" }); assert.equal(result.status, "not-run"); assert.equal(existsSync(out), false); assert.deepEqual(readFileSync(join(artifacts, "release-metadata.json")), before);
}));
test("corrupt sealed asset fails before any native process or output", () => fixture(async ({ artifacts, out, run }) => {
  const metadata = JSON.parse(readFileSync(join(artifacts, "release-metadata.json"))); writeFileSync(join(artifacts, metadata.assets[0].name), "corrupt");
  await assert.rejects(run({ execute: true }), /stale or corrupted/); assert.equal(existsSync(out), false);
}));
test("missing native binary preserves failed evidence and never claims verification", () => fixture(async ({ dir, out, run }) => {
  const result = await run({ execute: true, codex: join(dir, "absent-native") }); assert.equal(result.status, "fail"); assert.equal(result.publishable, false); assert.equal(result.rows[0].status, "fail"); assert.match(result.errors[0], /native command failed/); assert.equal(JSON.parse(readFileSync(join(out, "native-evidence.json"))).status, "fail");
}));
test("foreign output is preserved and never mistaken for previous success", () => fixture(async ({ out, run }) => {
  mkdirSync(out); writeFileSync(join(out, "foreign"), "keep"); await assert.rejects(run({ execute: true }), /new directory/); assert.equal(readFileSync(join(out, "foreign"), "utf8"), "keep");
}));

test("output aliases cannot write inside sealed artifacts", () => fixture(async ({ dir, artifacts, run }) => {
  const alias = join(dir, "alias"); symlinkSync(artifacts, alias, process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(run({ execute: true, out: join(alias, "evidence") }), /outside sealed/); assert.equal(existsSync(join(artifacts, "evidence")), false);
}));
