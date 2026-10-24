import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { git } from "./release-git.mjs";
import { prepareDevelopment } from "./release-development.mjs";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "release development ")); t.after(() => rmSync(root, { recursive: true, force: true }));
  const repo = join(root, "source"), remotePath = join(root, "remote.git"), out = join(root, "integration");
  git(root, ["init", "--bare", remotePath]); git(root, ["init", "-b", "main", repo]);
  git(repo, ["config", "user.name", "Fixture"]); git(repo, ["config", "user.email", "fixture@example.invalid"]);
  git(repo, ["config", "commit.gpgsign", "false"]); git(repo, ["config", "core.autocrlf", "false"]); git(repo, ["remote", "add", "origin", remotePath]);
  const commit = (message) => { git(repo, ["add", "."]); git(repo, ["commit", "-m", message]); return git(repo, ["rev-parse", "HEAD"]).trim(); };
  const setVersion = (version) => { for (const file of [".claude-plugin/plugin.json", ".codex-plugin/plugin.json"]) writeFileSync(join(repo, file), JSON.stringify({ name: "grey-matter", version })); };
  for (const dir of [".claude-plugin", ".codex-plugin", "scripts"]) mkdirSync(join(repo, dir));
  writeFileSync(join(repo, "package.json"), '{"name":"fixture","version":"0.0.0","private":true}');
  writeFileSync(join(repo, "package-lock.json"), '{"name":"fixture","version":"0.0.0","lockfileVersion":3,"packages":{"":{"name":"fixture","version":"0.0.0"}}}');
  writeFileSync(join(repo, ".gitignore"), "node_modules/\n");
  writeFileSync(join(repo, "scripts/check-repo.mjs"), 'console.log("full integration gate ran");\n');
  setVersion("0.1.0"); const base = commit("Base"); git(repo, ["push", "origin", "main"]);
  git(repo, ["checkout", "-b", "candidate"]); setVersion("0.2.0"); const candidateSha = commit("Candidate");
  const options = { repo, remote: "origin", candidateSha, product: "grey-matter", version: "0.2.0", out };
  const run = (extra = {}) => prepareDevelopment({ ...options, ...extra });
  return { root, repo, remotePath, out, base, candidateSha, commit, setVersion, options, run };
}

test("development preparation: default creates no files, refs or remote changes", (t) => {
  const f = fixture(t), refs = git(f.repo, ["show-ref"]), remote = git(f.repo, ["ls-remote", "origin"]);
  assert.equal(f.run().mode, "dry-run"); assert.equal(existsSync(f.out), false);
  assert.equal(git(f.repo, ["show-ref"]), refs); assert.equal(git(f.repo, ["ls-remote", "origin"]), remote);
});
test("development preparation: fast-forward uses exact candidate and records a full gate", (t) => {
  const f = fixture(t), result = f.run({ execute: true });
  assert.equal(result.developmentSha, f.candidateSha); assert.equal(result.mainSha, f.base);
  const report = JSON.parse(readFileSync(join(result.evidence, "product-evidence.json")));
  assert.equal(report.status, "pass"); assert.equal(report.candidateSha, f.candidateSha);
  assert.match(readFileSync(join(result.evidence, "1-product.log"), "utf8"), /full integration gate ran/);
  assert.equal(git(f.repo, ["rev-parse", "HEAD"]).trim(), f.candidateSha);
  assert.match(git(f.repo, ["ls-remote", "origin", "refs/heads/main"]), new RegExp(`^${f.base}`));
  assert.equal(git(f.repo, ["tag", "--list"]).trim(), "");
});
test("development preparation: disjoint merge preserves candidate and reuses the same merge on retry", (t) => {
  const f = fixture(t); git(f.repo, ["checkout", "main"]);
  writeFileSync(join(f.repo, "development-only"), "Keep this\n"); const main = f.commit("Development"); git(f.repo, ["push", "origin", "main"]); git(f.repo, ["checkout", "candidate"]);
  const result = f.run({ execute: true }); assert.notEqual(result.developmentSha, f.candidateSha);
  assert.deepEqual(git(f.repo, ["show", "-s", "--format=%P", result.developmentSha]).trim().split(" "), [main, f.candidateSha]);
  assert.equal(git(f.repo, ["show", `${result.developmentSha}:development-only`]), "Keep this\n");
  assert.equal(f.run({ execute: true }).developmentSha, result.developmentSha);
  assert.equal(git(f.repo, ["rev-parse", "HEAD"]).trim(), f.candidateSha);
});
test("development preparation: changed remote main is integrated and checked again", (t) => {
  const f = fixture(t), first = f.run({ execute: true });
  git(f.repo, ["checkout", "main"]); writeFileSync(join(f.repo, "later"), "Next\n"); const later = f.commit("Later main"); git(f.repo, ["push", "origin", "main"]); git(f.repo, ["checkout", "candidate"]);
  const next = f.run({ execute: true }); assert.equal(next.mainSha, later); assert.notEqual(next.developmentSha, first.developmentSha); assert.notEqual(next.evidence, first.evidence);
});
test("development preparation: merge conflicts leave all public refs unchanged", (t) => {
  const f = fixture(t); git(f.repo, ["checkout", "main"]); f.setVersion("0.3.0"); f.commit("Competing version"); git(f.repo, ["push", "origin", "main"]); git(f.repo, ["checkout", "candidate"]);
  const before = git(f.repo, ["ls-remote", "origin"]);
  assert.throws(() => f.run({ execute: true }), /merge conflicts/);
  assert.equal(git(f.repo, ["ls-remote", "origin"]), before); assert.equal(git(f.repo, ["status", "--porcelain"]), "");
});
test("development preparation: failed gate never imports an unchecked merge", (t) => {
  const f = fixture(t); git(f.repo, ["checkout", "main"]); writeFileSync(join(f.repo, "scripts/check-repo.mjs"), "process.exit(1);\n"); f.commit("Fail gate"); git(f.repo, ["push", "origin", "main"]); git(f.repo, ["checkout", "candidate"]);
  assert.throws(() => f.run({ execute: true }), /product gate failed/);
  const state = JSON.parse(readFileSync(join(f.out, "development.json")));
  assert.throws(() => git(f.repo, ["cat-file", "-t", state.developmentSha]), /failed/);
});
test("development preparation: foreign output and modified owned checkout are preserved", (t) => {
  const f = fixture(t); mkdirSync(f.out); writeFileSync(join(f.out, "foreign"), "Keep");
  assert.throws(() => f.run({ execute: true }), /foreign/); assert.equal(readFileSync(join(f.out, "foreign"), "utf8"), "Keep");
  rmSync(f.out, { recursive: true }); f.run({ execute: true }); writeFileSync(join(f.out, "worktree", "foreign"), "Keep");
  assert.throws(() => f.run({ execute: true }), /checkout changed/); assert.equal(readFileSync(join(f.out, "worktree", "foreign"), "utf8"), "Keep");
});

test("development preparation: already-contained candidate cannot hide a regressed version", (t) => {
  const f = fixture(t); f.setVersion("0.1.0"); const regressed = f.commit("Regressed authorities"); git(f.repo, ["push", "origin", `${regressed}:refs/heads/main`]); git(f.repo, ["checkout", "--detach", f.candidateSha]);
  assert.throws(() => f.run({ execute: true }), /regresses the released version/);
  assert.equal(git(f.repo, ["ls-remote", "origin", "refs/heads/main"]).trim().split(/\s+/)[0], regressed);
});

test("development preparation: npm bootstrap ignores inherited user configuration", (t) => {
  const f = fixture(t), poisoned = join(f.root, "npm-userconfig-directory"), previous = process.env.NPM_CONFIG_USERCONFIG;
  mkdirSync(poisoned); process.env.NPM_CONFIG_USERCONFIG = poisoned;
  try { assert.equal(f.run({ execute: true }).status, "pass"); }
  finally { if (previous === undefined) delete process.env.NPM_CONFIG_USERCONFIG; else process.env.NPM_CONFIG_USERCONFIG = previous; }
});

test("development preparation: interruption before checkout reuses the recorded integration", (t) => {
  const f = fixture(t); git(f.repo, ["checkout", "main"]); writeFileSync(join(f.repo, "later"), "Later\n"); f.commit("Main change"); git(f.repo, ["push", "origin", "main"]); git(f.repo, ["checkout", "candidate"]);
  const first = f.run({ execute: true }), receipt = join(f.out, "development.json"), state = JSON.parse(readFileSync(receipt));
  state.phase = "checking"; writeFileSync(receipt, JSON.stringify(state)); git(join(f.out, "worktree"), ["checkout", "--detach", state.checkoutFrom]);
  assert.equal(f.run({ execute: true }).developmentSha, first.developmentSha);
});
test("development preparation: existing newer release tags block an older integration", (t) => {
  const f = fixture(t); git(f.repo, ["-c", "tag.gpgsign=false", "tag", "-a", "v0.3.0", "-m", "Other release"]);
  assert.throws(() => f.run({ execute: true }), /behind an existing release tag/);
  assert.equal(git(f.repo, ["ls-remote", "origin", "refs/tags/v0.3.0"]).trim(), "");
});
test("development preparation: candidate-local output and aliases cannot receive integration files", (t) => {
  const f = fixture(t), local = join(f.repo, "integration"), alias = join(f.root, "source-alias");
  assert.throws(() => f.run({ execute: true, out: local }), /outside the candidate/); assert.equal(existsSync(local), false);
  symlinkSync(f.repo, alias, process.platform === "win32" ? "junction" : "dir");
  assert.throws(() => f.run({ execute: true, out: join(alias, "integration") }), /outside the candidate/); assert.equal(existsSync(local), false);
});

test("development preparation: ambient Git configuration cannot redirect the checkout", (t) => {
  const f = fixture(t), keys = ["GIT_CONFIG_COUNT", "GIT_CONFIG_KEY_0", "GIT_CONFIG_VALUE_0"], previous = keys.map((key) => process.env[key]);
  const foreign = join(f.root, "foreign-root"); mkdirSync(foreign);
  Object.assign(process.env, { GIT_CONFIG_COUNT: "1", GIT_CONFIG_KEY_0: "core.worktree", GIT_CONFIG_VALUE_0: foreign });
  try { assert.equal(f.run({ execute: true }).developmentSha, f.candidateSha); }
  finally { for (const [index, key] of keys.entries()) { if (previous[index] === undefined) delete process.env[key]; else process.env[key] = previous[index]; } }
});
