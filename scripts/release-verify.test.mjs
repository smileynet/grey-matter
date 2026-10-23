import { readStagedCandidate } from "./release-staging.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, join, relative } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { buildArtifacts } from "./release-artifacts.mjs";
import { verifyCandidate, requireMatchingIdentity, readCandidateEvidence } from "./release-verify.mjs";
const scripts = dirname(fileURLToPath(import.meta.url));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const put = (path, bytes) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, bytes); };
function tree(dir) {
  const files = {};
  const walk = (at) => { for (const item of readdirSync(at, { withFileTypes: true })) { const file = join(at, item.name); if (item.isDirectory()) walk(file); else if (item.isFile()) files[relative(dir, file)] = hash(readFileSync(file)); } };
  walk(dir); return files;
}
async function fixture(fn, check = 'console.log("fixture gate passed");') {
  const temp = mkdtempSync(join(tmpdir(), "candidate verify ")), repo = join(temp, "repo"), artifacts = join(temp, "artifacts"), out = join(temp, "evidence");
  const git = (...args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: "pipe" }).trim();
  try {
    mkdirSync(repo); git("init", "-b", "main"); git("config", "user.name", "Fixture"); git("config", "user.email", "fixture@example.invalid"); git("config", "core.autocrlf", "false");
    const manifest = { name: "grey-matter", version: "0.1.0", description: "Fixture", skills: ["./skills"], metadata: { deploy: { legalFiles: ["LICENSE"] } } };
    put(join(repo, ".claude-plugin/plugin.json"), JSON.stringify(manifest)); put(join(repo, ".codex-plugin/plugin.json"), '{"name":"grey-matter","version":"0.1.0","skills":"./skills/"}');
    put(join(repo, ".claude-plugin/marketplace.json"), '{"name":"grey-matter","plugins":[{"name":"grey-matter","source":"./"}]}');
    put(join(repo, "skills/example/SKILL.md"), "---\nname: example\ndescription: Candidate fixture\n---\nFixture.\n"); put(join(repo, "LICENSE"), "Fixture notice\n");
    cpSync(join(scripts, "deploy.mjs"), join(repo, "scripts/deploy.mjs")); put(join(repo, "scripts/check-repo.mjs"), check);
    const commit = () => { git("add", "."); git("-c", `core.hooksPath=${join(temp, "no hooks")}`, "commit", "-m", "Fixture"); return git("rev-parse", "HEAD"); };
    const sha = commit(); buildArtifacts({ repo, ref: sha, out: artifacts });
    await fn({ temp, repo, artifacts, out, sha, git, commit, run: (extra = {}) => verifyCandidate({ repo, sha, artifacts, out, ...extra }) });
  } finally { rmSync(temp, { recursive: true, force: true }); }
}
test("different product, version or commit cannot share verification evidence", () => {
  const product = { product: "tkt", version: "0.4.0", candidateSha: "a".repeat(40) }, metadata = { name: "tkt", version: "0.4.0", candidateSha: "a".repeat(40) }; requireMatchingIdentity(product, metadata);
  for (const extra of [{ name: "grey-matter" }, { version: "0.5.0" }, { candidateSha: "b".repeat(40) }]) assert.throws(() => requireMatchingIdentity(product, { ...metadata, ...extra }), /different commit/);
});
test("default and explicit CLI dry-run preserve repository, artifacts and output bytes", () => fixture(async ({ temp, repo, artifacts, out, sha, run }) => {
  const before = tree(temp), result = await run(); assert.equal(result.mode, "dry-run"); assert.equal(result.publishable, false); assert.deepEqual(result.phases, { product: "not-run", native: "not-run" });
  const cli = spawnSync(process.execPath, [join(scripts, "release.mjs"), "verify", "--repo", repo, "--sha", sha, "--artifacts", artifacts, "--out", out, "--dry-run"], { encoding: "utf8" });
  assert.equal(cli.status, 0, cli.stderr); assert.equal(JSON.parse(cli.stdout).mode, "dry-run"); assert.deepEqual(tree(temp), before);
}));
test("new checkout commit cannot reuse the old sealed bundle identity", () => fixture(async ({ repo, commit, run, out }) => {
  put(join(repo, "extra.txt"), "new source\n"); const sha = commit(); await assert.rejects(run({ sha, execute: true }), /different commit/); assert.equal(existsSync(out), false);
}));
test("failed product gate records failure and never launches native validation", () => fixture(async ({ run, out }) => {
  const result = await run({ execute: true, codex: "must-not-be-run" }); assert.equal(result.status, "fail"); assert.deepEqual(result.phases, { product: "fail", native: "not-run" }); assert.equal(existsSync(join(out, "native")), false); assert.equal(JSON.parse(readFileSync(join(out, "verification.json"))).status, "fail");
}, 'console.error("seeded failed product"); process.exit(7);'));
test("failed native gate preserves product proof and blocks verified status", () => fixture(async ({ run, out, temp }) => {
  const result = await run({ execute: true, codex: join(temp, "missing-codex") }); assert.equal(result.status, "fail"); assert.deepEqual(result.phases, { product: "pass", native: "fail" }); assert.equal(result.publishable, false);
  for (const evidence of [result.productEvidence, result.nativeEvidence]) assert.equal(hash(readFileSync(join(out, evidence.file))), evidence.sha256);
  assert.ok(result.pending.includes("final-audit")); await assert.rejects(run({ execute: true }), /new directory/);
}));
test("changed artifacts during the product gate cannot acquire native or overall success", () => fixture(async ({ run, artifacts, out }) => {
  const previous = process.env.RELEASE_FIXTURE_ASSET;
  try {
    const metadata = JSON.parse(readFileSync(join(artifacts, "release-metadata.json"))); process.env.RELEASE_FIXTURE_ASSET = join(artifacts, metadata.assets[0].name);
    const result = await run({ execute: true }); assert.equal(result.status, "fail"); assert.match(result.errors[0], /stale or corrupted/); assert.equal(result.phases.native, "not-run"); assert.equal(existsSync(join(out, "native")), false);
  } finally { if (previous === undefined) delete process.env.RELEASE_FIXTURE_ASSET; else process.env.RELEASE_FIXTURE_ASSET = previous; }
}, 'import {writeFileSync} from "node:fs"; writeFileSync(process.env.RELEASE_FIXTURE_ASSET, "changed");'));
test("foreign output and checkout/artifact aliases are refused without overwrite", () => fixture(async ({ run, out, temp, repo, artifacts }) => {
  mkdirSync(out); put(join(out, "foreign"), "keep"); await assert.rejects(run({ execute: true }), /new directory/); assert.equal(readFileSync(join(out, "foreign"), "utf8"), "keep");
  for (const [name, root] of [["source", repo], ["assets", artifacts]]) { const alias = join(temp, name); symlinkSync(root, alias, process.platform === "win32" ? "junction" : "dir"); await assert.rejects(run({ execute: true, out: join(alias, "evidence") }), /outside/); assert.equal(existsSync(join(root, "evidence")), false); }
}));
test("interrupted orchestration records unfinished gates and refuses stale output reuse", () => fixture(async ({ run, out }) => {
  const result = await run({ execute: true, progress: () => { throw new Error("interrupted fixture"); } }); assert.equal(result.status, "fail"); assert.deepEqual(result.phases, { product: "not-run", native: "not-run" }); assert.equal(JSON.parse(readFileSync(join(out, "verification.json"))).status, "fail"); await assert.rejects(run({ execute: true }), /new directory/);
}));

test("conflicting execution modes are rejected before state changes", () => fixture(async ({ run, out }) => {
  await assert.rejects(run({ execute: true, dryRun: true }), /cannot combine/); assert.equal(existsSync(out), false);
}));

function evidenceFixture({ artifacts, out, sha }) {
  const metadata = JSON.parse(readFileSync(join(artifacts, "release-metadata.json")));
  const identity = { schema: 1, status: "pass", publishable: false, product: metadata.name, version: metadata.version, candidateSha: sha };
  const log = "fixture executed gate\n";
  put(join(out, "product/1-product.log"), log);
  const product = { ...identity, mode: "product-evidence", checks: [{ exit: 0, signal: null, error: null, log: "1-product.log", sha256: hash(log) }] };
  const native = { ...identity, mode: "native-evidence", rows: metadata.assets.map((asset) => ({ host: asset.host, asset: asset.name, assetSha256: asset.sha256, status: "pass", nativeVersion: "fixture 1", checks: [{ exit: 0 }] })) };
  const index = { ...identity, mode: "candidate-verification", metadataSha256: hash(readFileSync(join(artifacts, "release-metadata.json"))), phases: { product: "pass", native: "pass" }, pending: ["scope", "compatibility", "upgrade", "platform-approval", "final-audit", "staging"] };
  const save = () => {
    for (const [name, report] of [["product", product], ["native", native]]) {
      const file = `${name}/${name}-evidence.json`, bytes = JSON.stringify(report);
      put(join(out, file), bytes); index[`${name}Evidence`] = { file, sha256: hash(bytes) };
    }
    const bytes = JSON.stringify(index); put(join(out, "verification.json"), bytes); return hash(bytes);
  };
  return { product, native, index, save, read: () => readCandidateEvidence({ artifacts, evidence: out, verificationSha256: save() }) };
}

test("bound evidence checks index, child reports and logs without granting publication", () => fixture(async (f) => {
  const proof = evidenceFixture(f), verificationSha256 = proof.save();
  const result = readCandidateEvidence({ artifacts: f.artifacts, evidence: f.out, verificationSha256 });
  assert.equal(result.product, "grey-matter");
  assert.equal(result.productEvidence.mode, "product-evidence");
  assert.equal(result.nativeEvidence.mode, "native-evidence");
  assert.equal(result.publishable, false); assert.ok(result.pending.includes("final-audit"));
  put(join(f.out, "product/1-product.log"), "changed bytes");
  assert.throws(() => readCandidateEvidence({ artifacts: f.artifacts, evidence: f.out, verificationSha256 }), /changed/);
}));

test("bound evidence refuses changed index, cleared gates and cross-identity reports", () => fixture(async (f) => {
  const proof = evidenceFixture(f), anchor = proof.save();
  proof.index.pending = []; proof.save();
  assert.throws(() => readCandidateEvidence({ artifacts: f.artifacts, evidence: f.out, verificationSha256: anchor }), /changed/);
  assert.throws(() => proof.read(), /cannot waive/);
  proof.index.pending = ["scope", "compatibility", "upgrade", "platform-approval", "final-audit", "staging"];
  proof.product.candidateSha = "b".repeat(40);
  assert.throws(() => proof.read(), /different commit/);
}));

test("bound evidence refuses incomplete native rows and failed product commands", () => fixture(async (f) => {
  const proof = evidenceFixture(f);
  proof.native.rows.pop(); assert.throws(() => proof.read(), /omitted/);
  proof.native.rows.push(proof.native.rows[0]); assert.throws(() => proof.read(), /missing, duplicate/);
  const other = evidenceFixture(f); other.product.checks[0].exit = 7;
  assert.throws(() => other.read(), /product command failed/);
}));

test("bound evidence rejects report path traversal and symlinked product logs", () => fixture(async (f) => {
  const proof = evidenceFixture(f); proof.save();
  proof.index.productEvidence.file = "../product-evidence.json";
  const bytes = JSON.stringify(proof.index); put(join(f.out, "verification.json"), bytes);
  assert.throws(() => readCandidateEvidence({ artifacts: f.artifacts, evidence: f.out, verificationSha256: hash(bytes) }), /report location/);
  const other = evidenceFixture(f), verificationSha256 = other.save();
  const outside = join(f.temp, "outside.log"); put(outside, "fixture executed gate\n");
  const log = join(f.out, "product/1-product.log"); rmSync(log);
  // Directory junctions work without Windows symlink privileges and still exercise escape detection.
  if (process.platform === "win32") {
    rmSync(join(f.out, "product"), { recursive: true });
    mkdirSync(join(f.temp, "external-product"));
    put(join(f.temp, "external-product/product-evidence.json"), JSON.stringify(other.product));
    put(join(f.temp, "external-product/1-product.log"), "fixture executed gate\n");
    symlinkSync(join(f.temp, "external-product"), join(f.out, "product"), "junction");
  } else symlinkSync(outside, log);
  assert.throws(() => readCandidateEvidence({ artifacts: f.artifacts, evidence: f.out, verificationSha256 }), /escaped/);
}));

function stagingFixture(f) {
  const proof = evidenceFixture(f), verificationSha256 = proof.save();
  const identity = { product: "grey-matter", version: "0.1.0", candidateSha: f.sha };
  const entry = { ...identity, repository: "example/grey-matter", metadataSha256: hash(readFileSync(join(f.artifacts, "release-metadata.json"))), verificationSha256, gates: {} };
  const reports = {};
  for (const gate of proof.index.pending) reports[gate] = { schema: 1, kind: "release-gate", ...identity, gate, status: "pass", blockers: [], summary: "Synthetic staging fixture only", evidence: ["Synthetic fixture; not actual release approval"] };
  const notes = "Reviewed fixture notes\n";
  put(join(f.repo, "staging/notes.md"), notes); entry.notes = { file: "staging/notes.md", sha256: hash(notes) };
  const index = { schema: 1, kind: "release-staging", status: "staged", entries: [entry, { product: "tkt", version: "0.5.0", candidateSha: "b".repeat(40), repository: "example/tkt" }] };
  function save() {
    for (const [gate, report] of Object.entries(reports)) {
      const file = `staging/${gate}.json`, bytes = JSON.stringify(report); put(join(f.repo, file), bytes); entry.gates[gate] = { file, sha256: hash(bytes) };
    }
    put(join(f.repo, "staging/index.json"), JSON.stringify(index));
    return f.commit();
  }
  const read = (reviewSha, extra = {}) => readStagedCandidate({ reviewRepo: f.repo, reviewSha, indexFile: "staging/index.json", product: "grey-matter", artifacts: f.artifacts, evidence: f.out, ...extra });
  return { entry, reports, index, save, read };
}

test("staging reader binds a committed index, six receipts, notes and complete assets", () => fixture(async (f) => {
  const stage = stagingFixture(f), sha = stage.save(), result = stage.read(sha);
  assert.equal(result.product, "grey-matter"); assert.equal(result.candidateSha, f.sha);
  assert.deepEqual(result.gates.pending, []); assert.equal(result.staging.reviewSha, sha);
  assert.equal(result.assets.length, 5); assert.ok(result.assets.some((a) => a.name === "SHA256SUMS"));
  put(join(f.repo, "staging/notes.md"), "Unreviewed changes");
  assert.equal(stage.read(sha).notes, "Reviewed fixture notes\n");
}));

test("staging reader rejects blocked, mismatched or missing gate receipts", () => fixture(async (f) => {
  const stage = stagingFixture(f);
  stage.reports.scope.blockers = ["unapproved scope"]; assert.throws(() => stage.read(stage.save()), /scope evidence/);
  stage.reports.scope.blockers = []; stage.reports.upgrade.candidateSha = "b".repeat(40);
  assert.throws(() => stage.read(stage.save()), /different commit/);
  stage.reports.upgrade.candidateSha = f.sha;
  const sha = stage.save(); delete stage.entry.gates.compatibility;
  put(join(f.repo, "staging/index.json"), JSON.stringify(stage.index)); const missing = f.commit();
  assert.throws(() => stage.read(missing), /missing or unknown gates/);
  assert.equal(stage.read(sha).gates.status, "pass");
}));

test("staging reader refuses changed artifacts and unpinned review identities", () => fixture(async (f) => {
  const stage = stagingFixture(f), sha = stage.save();
  assert.throws(() => stage.read("HEAD"), /explicit reviewed commit/);
  stage.entry.metadataSha256 = "0".repeat(64);
  assert.throws(() => stage.read(stage.save()), /metadata changed/);
  assert.equal(stage.read(sha).version, "0.1.0");
}));

test("staging reader ignores local Git replacements of the pinned review commit", () => fixture(async (f) => {
  const stage = stagingFixture(f), reviewed = stage.save();
  const changed = "Unreviewed replacement notes\n";
  put(join(f.repo, "staging/notes.md"), changed); stage.entry.notes.sha256 = hash(changed);
  const replacement = stage.save(); f.git("replace", reviewed, replacement);
  assert.equal(stage.read(reviewed).notes, "Reviewed fixture notes\n");
}));

test("staging reader requires receipt digests and rejects committed symlink blobs", () => fixture(async (f) => {
  const stage = stagingFixture(f); stage.save();
  delete stage.entry.gates.scope.sha256;
  put(join(f.repo, "staging/index.json"), JSON.stringify(stage.index));
  assert.throws(() => stage.read(f.commit()), /requires a digest/);
  stage.save();
  const blob = f.git("rev-parse", "HEAD:staging/notes.md");
  f.git("update-index", "--cacheinfo", "120000", blob, "staging/notes.md");
  f.git("-c", `core.hooksPath=${join(f.temp, "no hooks")}`, "commit", "-m", "seed symlink notes blob");
  assert.throws(() => stage.read(f.git("rev-parse", "HEAD")), /committed regular file/);
}));
