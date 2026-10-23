import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync, spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { prepare } from "./release.mjs";
import { inspectVersions } from "./release-version.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const git = (repo, ...args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: "pipe", env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } }).trim();
const put = (path, text) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text); };
function treeBytes(dir) {
  const result = {};
  const walk = (at) => { for (const entry of readdirSync(at, { withFileTypes: true })) {
    const file = join(at, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile()) result[relative(dir, file)] = createHash("sha256").update(readFileSync(file)).digest("hex");
  } };
  walk(dir); return result;
}

async function fixture(fn, cargo = false) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "release prepare "))), repo = join(dir, "repo"), out = join(dir, "output"), home = join(dir, "home");
  const saved = Object.fromEntries(["HOME", "USERPROFILE", "XDG_CONFIG_HOME", "GIT_CONFIG_NOSYSTEM"].map((key) => [key, process.env[key]]));
  Object.assign(process.env, { HOME: home, USERPROFILE: home, XDG_CONFIG_HOME: join(home, ".config"), GIT_CONFIG_NOSYSTEM: "1" });
  try {
    mkdirSync(repo); mkdirSync(home);
    git(repo, "init", "-b", "main");
    git(repo, "config", "user.name", "Prepare Fixture"); git(repo, "config", "user.email", "fixture@example.invalid");
    git(repo, "config", "core.autocrlf", "false"); git(repo, "config", "core.hooksPath", join(repo, ".git/hooks"));
    const manifest = { name: "example", version: "0.1.0", description: "A fixture plugin", skills: ["./skills"], metadata: { deploy: { legalFiles: ["LICENSE"] } } };
    put(join(repo, ".claude-plugin/plugin.json"), JSON.stringify(manifest, null, 2) + "\n");
    put(join(repo, ".claude-plugin/marketplace.json"), '{"name":"example","plugins":[{"name":"example","source":"./"}]}\n');
    put(join(repo, ".codex-plugin/plugin.json"), '{"name":"example","version":"0.1.0","skills":"./skills/"}\n');
    put(join(repo, "skills/example/SKILL.md"), "---\nname: example\ndescription: Prepare fixture\n---\nFixture workflow.\n");
    put(join(repo, "LICENSE"), "Fixture license\n");
    put(join(repo, "README.md"), "Fixture documentation. ".repeat(50) + "\n");
    put(join(repo, "CHANGELOG.md"), "# Changelog\n\n## [Unreleased]\n\n### Added\n- A complete workflow.\n\n## [0.1.0] - 2026-10-01\n\n- Initial version.\n\n[Unreleased]: https://example.invalid/compare/v0.1.0...HEAD\n[0.1.0]: https://example.invalid/releases/tag/v0.1.0\n");
    cpSync(join(here, "deploy.mjs"), join(repo, "scripts/deploy.mjs"), { recursive: true });
    if (cargo) {
      put(join(repo, "Cargo.toml"), '# retained comment\n[package]\nname = "example"\nversion = "0.1.0" # root version\n\n[dependencies]\nother = { version = "7.0.0" }\n');
      put(join(repo, "Cargo.lock"), 'version = 4\n\n[[package]]\nname = "example"\nversion = "0.1.0"\n\n[[package]]\nname = "example"\nversion = "7.0.0"\nsource = "registry+https://example.invalid"\n');
      put(join(repo, "plugin.json"), '{"name":"example","version":"0.1.0"}\n');
    }
    git(repo, "add", "-A"); git(repo, "commit", "--no-verify", "-m", "Fixture source"); git(repo, "tag", "v0.1.0");
    const sourceSha = git(repo, "rev-parse", "HEAD");
    const options = { repo, out, version: "0.2.0", date: "2026-10-23" };
    await fn({ dir, repo, out, home, sourceSha, options, run: (extra = {}) => prepare({ ...options, ...extra }) });
  } finally {
    for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    rmSync(dir, { recursive: true, force: true });
  }
}

test("default and explicit CLI dry-run leave source, Git bytes, remote and harness home unchanged", () => fixture(({ dir, repo, home, out, options, run }) => {
  const remote = join(dir, "remote.git"); git(repo, "clone", "--bare", repo, remote); git(repo, "remote", "add", "origin", remote);
  put(join(home, ".codex/config.toml"), "original harness config\n");
  const before = { repo: treeBytes(repo), home: treeBytes(home), remote: treeBytes(remote) };
  assert.equal(run().mode, "dry-run");
  const cli = spawnSync(process.execPath, [join(here, "release.mjs"), "prepare", "--repo", repo, "--version", options.version, "--out", out, "--date", options.date, "--dry-run"], { encoding: "utf8" });
  assert.equal(cli.status, 0, cli.stderr); assert.equal(JSON.parse(cli.stdout).publishable, false);
  assert.deepEqual({ repo: treeBytes(repo), home: treeBytes(home), remote: treeBytes(remote) }, before);
  assert.equal(existsSync(out), false);
}));

for (const cargo of [false, true]) test(`draft ${cargo ? "Cargo" : "skill"} preparation updates all surfaces once and replays the same identity`, () => fixture(({ repo, out, sourceSha, run }) => {
  const first = run({ execute: true });
  assert.equal(first.mode, "draft"); assert.equal(first.publishable, false);
  const inspected = inspectVersions((file) => readFileSync(join(first.worktree, file), "utf8"), (file) => existsSync(join(first.worktree, file)));
  assert.equal(inspected.version, "0.2.0");
  assert.equal(git(repo, "rev-parse", "HEAD"), sourceSha);
  assert.equal(git(first.worktree, "show", "-s", "--format=%P", "HEAD"), sourceSha);
  assert.equal(git(first.worktree, "status", "--porcelain"), "");
  const changelog = readFileSync(join(first.worktree, "CHANGELOG.md"), "utf8");
  assert.match(changelog, /## \[Unreleased\]\n\n## \[0.2.0\] - 2026-10-23/);
  assert.match(changelog, /\[0.2.0\]: https:\/\/example.invalid\/compare\/v0.1.0\.\.\.v0.2.0/);
  if (cargo) {
    assert.match(readFileSync(join(first.worktree, "Cargo.toml"), "utf8"), /version = "0.2.0" # root version/);
    assert.match(readFileSync(join(first.worktree, "Cargo.toml"), "utf8"), /other = \{ version = "7.0.0" \}/);
    assert.match(readFileSync(join(first.worktree, "Cargo.lock"), "utf8"), /version = "7.0.0"/);
  }
  const refs = git(repo, "show-ref"), artifacts = treeBytes(join(out, "artifacts"));
  assert.equal(run({ execute: true }).candidateSha, first.candidateSha);
  assert.equal(git(repo, "show-ref"), refs); assert.deepEqual(treeBytes(join(out, "artifacts")), artifacts);
  assert.equal(git(repo, "tag", "--list"), "v0.1.0");
  assert.deepEqual(first.validation, { product: "not-run", native: "not-run", scope: "not-reviewed", platforms: [] });
}, cargo));

for (const phase of ["worktree", "file-intent", "file-written", "file-promoted", "file", "versioned", "committed", "draft"]) test(`resume after interrupted ${phase} reuses one version and one commit`, () => fixture(({ repo, sourceSha, run }) => {
  assert.throws(() => run({ execute: true, progress: (at) => { if (at === phase) throw new Error("fixture interruption"); } }), /fixture interruption/);
  const result = run({ execute: true });
  assert.equal(git(result.worktree, "rev-list", "--count", `${sourceSha}..HEAD`), "1");
  assert.equal(git(repo, "rev-parse", "HEAD"), sourceSha);
  assert.equal(run({ execute: true }).candidateSha, result.candidateSha);
}));

test("a terminated CLI process resumes from its owned worktree without a second commit", () => fixture(async ({ repo, out, sourceSha, options, run }) => {
  const child = spawn(process.execPath, [join(here, "release.mjs"), "prepare", "--repo", repo, "--version", options.version, "--out", out, "--date", options.date, "--execute"], { stdio: ["ignore", "ignore", "pipe"] });
  let stopped = false, output = "";
  child.stderr.on("data", (bytes) => { output += bytes; if (!stopped && output.includes("prepare: worktree")) { stopped = true; child.kill("SIGTERM"); } });
  const termination = await new Promise((resolve, reject) => { child.on("error", reject); child.on("close", (code, signal) => resolve({ code, signal })); });
  assert.equal(stopped, true, output);
  assert.ok(termination.signal === "SIGTERM" || (process.platform === "win32" && termination.code !== 0), JSON.stringify(termination));
  const result = run({ execute: true });
  assert.equal(git(result.worktree, "rev-list", "--count", `${sourceSha}..HEAD`), "1");
}));

for (const detached of [false, true]) test(`existing ${detached ? "detached" : "branch"} app-managed worktree preserves its source checkout`, () => fixture(({ dir, repo, sourceSha, run }) => {
  const worktree = join(dir, "managed"); git(repo, "worktree", "add", ...(detached ? ["--detach"] : ["-b", "codex/managed-fixture"]), worktree, sourceSha);
  const result = run({ execute: true, worktree });
  assert.equal(result.worktree, realpathSync.native(worktree)); assert.equal(git(repo, "rev-parse", "HEAD"), sourceSha);
}));

test("foreign output and unrelated candidate changes are preserved and refused", () => fixture(({ out, run }) => {
  put(join(out, "foreign.txt"), "keep this\n");
  assert.throws(() => run({ execute: true }), /without preparation ownership/);
  assert.equal(readFileSync(join(out, "foreign.txt"), "utf8"), "keep this\n");
  rmSync(out, { recursive: true });
  const result = run({ execute: true });
  put(join(result.worktree, "unrelated.txt"), "user work\n");
  assert.throws(() => run({ execute: true }), /uncommitted changes/);
  assert.equal(readFileSync(join(result.worktree, "unrelated.txt"), "utf8"), "user work\n");
}));

test("resume rejects different version/date/notes and a moved candidate history", () => fixture(({ out, run }) => {
  const result = run({ execute: true });
  assert.throws(() => run({ execute: true, version: "0.3.0" }), /different repository or version/);
  assert.throws(() => run({ execute: true, date: "2026-10-24" }), /identity differs/);
  put(join(out, "release-notes.md"), "tampered notes\n");
  assert.throws(() => run({ execute: true }), /release notes differ/);
  git(result.worktree, "commit", "--allow-empty", "--no-verify", "-m", "Unrelated commit");
  assert.throws(() => run({ execute: true }), /history diverged/);
}));

for (const version of ["0.1.0", "0.0.9", "00.2.0", "1.0", "0.2.0-rc.1"]) test(`invalid or non-increasing version ${version} creates no output`, () => fixture(({ out, run }) => {
  assert.throws(() => run({ execute: true, version }), /version/); assert.equal(existsSync(out), false);
}));

test("newer local release tag and dirty source block preparation", () => fixture(({ repo, out, run }) => {
  git(repo, "tag", "v0.3.0"); assert.throws(() => run({ execute: true }), /existing release tag/);
  git(repo, "tag", "-d", "v0.3.0"); put(join(repo, "dirty.txt"), "untracked\n");
  assert.throws(() => run({ execute: true }), /must be clean/); assert.equal(existsSync(out), false);
}));

test("ambient Git index cannot redirect preparation into user state", () => fixture(({ dir, run }) => {
  const external = join(dir, "external-index"); put(external, "leave unchanged\n");
  const saved = process.env.GIT_INDEX_FILE; process.env.GIT_INDEX_FILE = external;
  try { assert.equal(run({ execute: true }).mode, "draft"); assert.equal(readFileSync(external, "utf8"), "leave unchanged\n"); }
  finally { if (saved === undefined) delete process.env.GIT_INDEX_FILE; else process.env.GIT_INDEX_FILE = saved; }
}));

test("freshly fetched upstream advancement blocks draft creation even without branch tracking", () => fixture(({ dir, repo, out, run }) => {
  const remote = join(dir, "remote.git"), writer = join(dir, "writer");
  git(repo, "clone", "--bare", repo, remote); git(repo, "remote", "add", "origin", remote);
  git(repo, "clone", remote, writer);
  git(writer, "config", "user.name", "Remote Fixture"); git(writer, "config", "user.email", "remote@example.invalid");
  put(join(writer, "upstream.txt"), "new source\n");
  git(writer, "add", "upstream.txt"); git(writer, "commit", "--no-verify", "-m", "Remote advancement"); git(writer, "push", "origin", "HEAD:main");
  const before = git(remote, "show-ref");
  assert.throws(() => run({ execute: true }), /fetched upstream/);
  assert.equal(existsSync(out), false); assert.equal(git(remote, "show-ref"), before);
}));

test("corrupted draft assets stop resume without moving the candidate or replacing bytes", () => fixture(({ out, run }) => {
  const first = run({ execute: true });
  const metadata = JSON.parse(readFileSync(join(out, "artifacts/release-metadata.json")));
  const asset = join(out, "artifacts", metadata.assets[0].name); put(asset, "corrupted\n");
  assert.throws(() => run({ execute: true }), /stale or corrupted asset/);
  assert.equal(git(first.worktree, "rev-parse", "HEAD"), first.candidateSha);
  assert.equal(readFileSync(asset, "utf8"), "corrupted\n");
}));

test("source checkout and a symlink/junction alias cannot be used as the candidate", () => fixture(({ dir, repo, out, sourceSha, run }) => {
  const alias = join(dir, "alias"); symlinkSync(repo, alias, process.platform === "win32" ? "junction" : "dir");
  for (const worktree of [repo, alias]) assert.throws(() => run({ execute: true, worktree }), /worktree or release identity/);
  assert.equal(git(repo, "rev-parse", "HEAD"), sourceSha); assert.equal(existsSync(out), false);
}));

test("owned partial staging files recover while similarly named user files remain untouched", () => fixture(({ out, run }) => {
  assert.throws(() => run({ execute: true, progress: (phase) => { if (phase === "file-written") throw new Error("fixture interruption"); } }), /fixture interruption/);
  const state = JSON.parse(readFileSync(join(out, "prepare-state.json")));
  const pending = join(state.worktree, state.pendingFile.temp); put(pending, "partial bytes\n");
  const foreign = join(state.worktree, "user.release-00000000-0000-0000-0000-000000000000.tmp"); put(foreign, "user bytes\n");
  assert.throws(() => run({ execute: true }), /unrelated or untracked/);
  assert.equal(existsSync(pending), false); assert.equal(readFileSync(foreign, "utf8"), "user bytes\n");
  rmSync(foreign); assert.equal(run({ execute: true }).mode, "draft");
}));
