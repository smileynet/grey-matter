import { publishStaged } from "./release-publication.mjs";
import { publicationFailure } from "./release-publish.mjs";
import { ciFixture } from "./release-ci-fixtures.mjs";
import { readStagedCandidate, readStagedTktCandidate } from "./release-staging.mjs";
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
async function fixture(fn, check = 'console.log("fixture gate passed");', product = "grey-matter") {
  const temp = mkdtempSync(join(tmpdir(), "candidate verify ")), repo = join(temp, "repo"), artifacts = join(temp, "artifacts"), out = join(temp, "evidence");
  const git = (...args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: "pipe" }).trim();
  try {
    mkdirSync(repo); git("init", "-b", "main"); git("config", "user.name", "Fixture"); git("config", "user.email", "fixture@example.invalid"); git("config", "core.autocrlf", "false");
    const manifest = { name: product, version: "0.1.0", description: "Fixture", skills: ["./skills"], metadata: { deploy: { legalFiles: ["LICENSE"] } } };
    put(join(repo, ".claude-plugin/plugin.json"), JSON.stringify(manifest)); put(join(repo, ".codex-plugin/plugin.json"), JSON.stringify({name: product, version: "0.1.0", skills: "./skills/"}));
    put(join(repo, ".claude-plugin/marketplace.json"), JSON.stringify({name: product, plugins: [{name: product, source: "./"}]}));
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
test("changed artifacts during the product gate cannot acquire native or overall success", () => fixture(async ({ run, out }) => {
  const result = await run({ execute: true }); assert.equal(result.status, "fail"); assert.match(result.errors[0], /stale or corrupted/); assert.equal(result.phases.native, "not-run"); assert.equal(existsSync(join(out, "native")), false);
}, 'import {readFileSync, writeFileSync} from "node:fs"; const metadata = JSON.parse(readFileSync("../artifacts/release-metadata.json")); writeFileSync("../artifacts/" + metadata.assets[0].name, "changed");'));
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
  const product = JSON.parse(readFileSync(join(f.artifacts, "release-metadata.json"))).name;
  const identity = { product, version: "0.1.0", candidateSha: f.sha };
  const entry = { ...identity, repository: `example/${product}`, metadataSha256: hash(readFileSync(join(f.artifacts, "release-metadata.json"))), verificationSha256, gates: {} };
  const reports = {};
  for (const gate of proof.index.pending) reports[gate] = { schema: 1, kind: "release-gate", ...identity, gate, status: "pass", blockers: [], summary: "Synthetic staging fixture only", evidence: ["Synthetic fixture; not actual release approval"] };
  const notes = "Reviewed fixture notes\n";
  put(join(f.repo, "staging/notes.md"), notes); entry.notes = { file: "staging/notes.md", sha256: hash(notes) };
  const index = { schema: 1, kind: "release-staging", status: "staged", entries: [entry, { product: product === "tkt" ? "grey-matter" : "tkt", version: "0.5.0", candidateSha: "b".repeat(40), repository: "example/other" }] };
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

function publicationFixture(f) {
  const stage = stagingFixture(f), reviewSha = stage.save();
  f.git("-c", `core.hooksPath=${join(f.temp, "no hooks")}`, "checkout", "-b", "codex/release-grey-matter-0.1.0-fixture", f.sha);
  f.git("-c", "tag.gpgsign=false", "tag", "-a", "v0.1.0", "-m", "fixture", f.sha);
  const tagObject = f.git("rev-parse", "v0.1.0");
  f.git("remote", "add", "origin", "https://github.com/example/grey-matter.git");
  const options = { mode: "publish", repo: f.repo, reviewRepo: f.repo, reviewSha, index: "staging/index.json", product: "grey-matter", artifacts: f.artifacts, evidence: f.out, tagObject, state: join(f.temp, "publication.json") };
  const candidate = stage.read(reviewSha), state = { release: null, assets: [] }, writes = [];
  const api = {
    tag: () => ({ sha: f.sha, annotated: true, objectSha: tagObject }),
    releases: () => state.release ? [{ ...state.release }] : [],
    assets: () => state.assets,
    immutableEnabled: () => true,
    createDraft: () => { writes.push("create"); state.release = { id: 17, tag_name: "v0.1.0", name: candidate.title, body: candidate.notes, draft: true, immutable: false, html_url: "https://example.invalid/release" }; },
    upload: (_, id, asset) => { writes.push(`upload:${asset.name}`); state.assets.push({ name: asset.name, size: asset.bytes.length, digest: `sha256:${hash(asset.bytes)}`, state: "uploaded" }); },
    publish: () => { writes.push("publish"); state.release.draft = false; state.release.immutable = true; },
  };
  const services = { api, prepareMain: () => ({ status: "pass", candidateSha: f.sha, developmentSha: f.sha }), pushCandidate: () => { writes.push("refs"); return { complete: true }; }, promoteStable: () => { writes.push("stable"); return { complete: true }; } };
  return { stage, options, state, writes, services, run: (extra = {}) => publishStaged({ ...options, ...extra }, services) };
}

test("publication command: default planning leaves files, refs and fake APIs unchanged", () => fixture(async (f) => {
  const pub = publicationFixture(f), before = tree(f.temp);
  const plan = await pub.run(); assert.equal(plan.mode, "dry-run"); assert.deepEqual(pub.writes, []);
  assert.deepEqual(tree(f.temp), before); assert.equal(existsSync(pub.options.state), false);
}));

test("publication command: interruption persists the release ID and resumes without another release", () => fixture(async (f) => {
  const pub = publicationFixture(f), promote = pub.services.promoteStable;
  pub.services.promoteStable = () => { throw new Error("seeded stable rejection"); };
  await assert.rejects(pub.run({ execute: true }), /stable rejection/);
  const interrupted = JSON.parse(readFileSync(pub.options.state));
  assert.equal(interrupted.releaseId, 17); assert.equal(interrupted.phase, "interrupted");
  assert.equal(pub.writes.filter((item) => item === "create").length, 1);
  pub.services.promoteStable = promote;
  const result = await pub.run({ mode: "resume", execute: true }); assert.equal(result.status, "pass");
  assert.equal(pub.writes.filter((item) => item === "create").length, 1);
  assert.equal(pub.writes.filter((item) => item === "publish").length, 1);
  const finished = JSON.parse(readFileSync(pub.options.state)); assert.equal(finished.phase, "complete"); assert.equal(finished.error, undefined);
}));

test("publication command: immutable publication resumes stable despite later development conflicts", () => fixture(async (f) => {
  const pub = publicationFixture(f), promote = pub.services.promoteStable;
  pub.services.promoteStable = () => { throw Error("seeded stable rejection"); };
  await assert.rejects(pub.run({ execute: true }), /stable rejection/);
  pub.services.promoteStable = promote;
  pub.services.prepareMain = () => { throw Error("later main conflicts"); };
  pub.services.pushCandidate = () => { throw Error("candidate refs must remain untouched"); };
  const result = await pub.run({ mode: "resume", execute: true });
  assert.equal(result.status, "pass");
  for (const event of ["refs", "create", "publish", "stable"]) assert.equal(pub.writes.filter(value => value === event).length, 1, event);
}));

test("publication command: failure JSON retains identity and last observed channels", () => fixture(async (f) => {
  const pub = publicationFixture(f);
  pub.services.promoteStable = () => { throw Error("seeded stable loss", { cause: { token: "private-fixture-credential" } }); };
  await assert.rejects(pub.run({ execute: true }), error => {
    const json = JSON.stringify(publicationFailure(error)), report = JSON.parse(json).publication;
    assert.equal(report.candidateSha, f.sha); assert.equal(report.reviewSha, pub.options.reviewSha);
    assert.equal(report.github.phase, "published"); assert.equal(report.github.immutable, true);
    assert.equal(report.github.url, "https://example.invalid/release");
    assert.equal(report.registry.phase, "not-applicable"); assert.equal(report.stable.phase, "unconfirmed");
    assert.doesNotMatch(json, /private-fixture-credential|"bytes"|"cause"/);
    return true;
  });
}));

test("publication command: changed remote or foreign recovery state blocks all writes", () => fixture(async (f) => {
  const pub = publicationFixture(f);
  f.git("remote", "set-url", "origin", "https://github.com/other/repo.git");
  await assert.rejects(pub.run({ execute: true }), /differs/); assert.deepEqual(pub.writes, []);
  f.git("remote", "set-url", "origin", "https://github.com/example/grey-matter.git");
  put(pub.options.state, "foreign bytes");
  await assert.rejects(pub.run({ execute: true }), /recovery state/); assert.equal(readFileSync(pub.options.state, "utf8"), "foreign bytes");
  assert.deepEqual(pub.writes, []);
}));

test("publication command: disabled immutability or an existing lock permits no remote writes", () => fixture(async (f) => {
  const pub = publicationFixture(f); pub.services.api.immutableEnabled = () => false;
  await assert.rejects(pub.run({ execute: true }), /immutability/); assert.deepEqual(pub.writes, []);
  assert.equal(existsSync(`${pub.options.state}.lock`), false);
  pub.services.api.immutableEnabled = () => true;
  put(`${pub.options.state}.lock`, "foreign lock");
  await assert.rejects(pub.run({ mode: "resume", execute: true }), /locked/);
  assert.equal(readFileSync(`${pub.options.state}.lock`, "utf8"), "foreign lock"); assert.deepEqual(pub.writes, []);
}));

test("publication command: a replacement release cannot inherit interrupted state", () => fixture(async (f) => {
  const pub = publicationFixture(f); pub.services.promoteStable = () => { throw new Error("stop before stable"); };
  await assert.rejects(pub.run({ execute: true }), /before stable/);
  const before = [...pub.writes]; pub.state.release.id = 18;
  await assert.rejects(pub.run({ mode: "resume", execute: true }), /release ID changed/);
  assert.deepEqual(pub.writes.filter((item) => item !== "refs"), before.filter((item) => item !== "refs"));
  assert.equal(JSON.parse(readFileSync(pub.options.state)).releaseId, 17);
}));

test("publication CLI: parsed default mode plans from a foreign cwd without writes", () => fixture(async (f) => {
  const pub = publicationFixture(f), args = [join(scripts, "release-publication.mjs"), "publish"];
  for (const [key, value] of Object.entries(pub.options)) {
    if (key !== "mode") args.push(`--${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`, value);
  }
  const before = tree(f.temp), result = spawnSync(process.execPath, args, { cwd: f.temp, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr); assert.equal(JSON.parse(result.stdout).mode, "dry-run");
  assert.deepEqual(tree(f.temp), before);
}));

test("publication command: local tkt publication refuses before repository or API access", async () => {
  await assert.rejects(publishStaged({ mode: "publish", product: "tkt", execute: true }), /cargo-dist CI/);
});

test("publication command: development must pass before release refs or GitHub writes", () => fixture(async (f) => {
  const pub = publicationFixture(f); pub.services.prepareMain = () => { throw new Error("development gate failed"); };
  await assert.rejects(pub.run({ execute: true }), /development gate failed/); assert.deepEqual(pub.writes, []);
  pub.services.prepareMain = () => ({ status: "pass", candidateSha: "b".repeat(40), developmentSha: f.sha });
  await assert.rejects(pub.run({ mode: "resume", execute: true }), /not verified/); assert.deepEqual(pub.writes, []);
  const integrationSha = "c".repeat(40);
  pub.services.prepareMain = () => ({ status: "pass", candidateSha: f.sha, developmentSha: integrationSha });
  pub.services.pushCandidate = (input) => { assert.equal(input.developmentSha, integrationSha); assert.equal(input.candidateSha, f.sha); pub.writes.push("refs"); return { complete: true }; };
  const result = await pub.run({ mode: "resume", execute: true }); assert.equal(result.development.developmentSha, integrationSha);
  assert.equal(JSON.parse(readFileSync(pub.options.state)).development.developmentSha, integrationSha);
}));

test("tkt staging joins pinned plugin and CI bytes, retaining the original stage record", () => fixture(async (f) => {
  const stage = stagingFixture(f), ci = ciFixture(() => {}, { candidateSha: f.sha, version: "0.1.0" });
  const identity = JSON.stringify(ci.expected);
  put(join(f.repo, "staging/ci.json"), identity);
  stage.entry.ci = { file: "staging/ci.json", sha256: hash(identity) };
  const reviewSha = stage.save();
  const options = { reviewRepo: f.repo, reviewSha, indexFile: "staging/index.json", artifacts: f.artifacts, evidence: f.out, api: ci.api };
  const result = await readStagedTktCandidate(options);
  assert.equal(result.assets.length, 8);
  const seal = result.assets.find((asset) => asset.name === "tkt-stage.json");
  assert.equal(hash(seal.bytes), ci.expected.sealSha256);
  assert.equal(seal.bytes.toString(), JSON.stringify(ci.record));
  assert.equal(result.ciStage.artifactId, ci.expected.artifactId);
  put(join(f.repo, "staging/ci.json"), JSON.stringify({ ...ci.expected, artifactId: 99 }));
  assert.equal((await readStagedTktCandidate(options)).ciStage.artifactId, ci.expected.artifactId);
  const changed = f.commit();
  await assert.rejects(readStagedTktCandidate({ ...options, reviewSha: changed }), /digest differs/);
  for (const delta of [{ version: "0.2.0" }, { candidateSha: "b".repeat(40) }, { repository: "example/foreign" }]) {
    const wrong = JSON.stringify({ ...ci.expected, ...delta });
    put(join(f.repo, "staging/ci.json"), wrong); stage.entry.ci.sha256 = hash(wrong);
    await assert.rejects(readStagedTktCandidate({ ...options, reviewSha: stage.save() }), /different commit|repository differs/);
  }
  const collision = ciFixture(({ entries, record }) => {
    entries[1].name = result.assets[0].name.toUpperCase(); record.files[1].name = entries[1].name;
  }, { candidateSha: f.sha, version: "0.1.0" });
  const collidingIdentity = JSON.stringify(collision.expected);
  put(join(f.repo, "staging/ci.json"), collidingIdentity); stage.entry.ci.sha256 = hash(collidingIdentity);
  await assert.rejects(readStagedTktCandidate({ ...options, api: collision.api, reviewSha: stage.save() }), /colliding names/);
  delete stage.entry.ci;
  await assert.rejects(readStagedTktCandidate({ ...options, reviewSha: stage.save() }), /reviewed CI identity digest/);
}, undefined, "tkt"));

async function tktCiFixture(f, mutate = () => {}) {
  const { publishTktCi } = await import("./release-tkt-ci.mjs");
  const stage = stagingFixture(f), ci = ciFixture(() => {}, { version: "0.1.0", candidateSha: f.sha });
  put(join(f.repo, "staging/ci.json"), JSON.stringify(ci.expected));
  stage.entry.ci = { file: "staging/ci.json", sha256: hash(JSON.stringify(ci.expected)) };
  const branch = "refs/heads/codex/release-tkt-0.1.0-fixture";
  const record = `object ${f.sha}\ntype commit\ntag v0.1.0\ntagger Fixture <fixture@example.invalid> 1792713600 +0000\n\nReviewed tag\n`;
  const tagObject = createHash("sha1").update(`tag ${Buffer.byteLength(record)}\0`).update(record).digest("hex");
  put(join(f.repo, "staging/tag.txt"), record);
  stage.entry.publication = { workflowSha: f.sha, workflowId: 21, branch, tag: { file: "staging/tag.txt", objectSha: tagObject } };
  mutate({ stage, ci });
  const reviewSha = stage.save();
  f.git("checkout", "--detach", f.sha); f.git("remote", "add", "origin", "https://github.com/example/tkt.git");
  const options = { repo: f.repo, reviewRepo: f.repo, reviewSha, index: "staging/index.json", artifacts: f.artifacts, evidence: f.out, developmentOut: join(f.temp, "development"), cargo: "/usr/bin/cargo", rustc: "/usr/bin/rustc", getToken: async () => { events.push("credential"); return "dummy"; }, context: { event: "workflow_dispatch", repository: "example/tkt", sha: f.sha, ref: branch, workflowRef: `example/tkt/.github/workflows/publish.yml@${branch}`, runId: 30, attempt: 1 } };
  const events = [], state = { release: null, assets: [], registry: { phase: "missing", name: "tkt", version: "0.1.0" } };
  const actions = { ...ci.api, run: async (repo, id) => id === 30 ? { id: 30, run_attempt: 1, head_sha: f.sha, event: "workflow_dispatch", workflow_id: 21, path: ".github/workflows/publish.yml", status: "in_progress", repository: { full_name: "example/tkt", id: 11 }, head_repository: { id: 11 } } : ci.api.run(repo, id) };
  const api = {
    immutableEnabled: async () => true,
    tag: async () => ({ sha: f.sha, annotated: true, objectSha: tagObject }),
    releases: async () => state.release ? [structuredClone(state.release)] : [],
    assets: async () => structuredClone(state.assets),
    createDraft: async (_, input) => { events.push("draft"); state.release = { id: 17, tag_name: input.tag, name: input.title, body: input.notes, draft: true, immutable: false }; },
    upload: async (_, id, input) => { events.push(`upload:${input.name}`); const asset = { id: state.assets.length + 1, name: input.name, state: "uploaded", size: input.bytes.length, digest: `sha256:${hash(input.bytes)}` }; state.assets.push(asset); return structuredClone(asset); },
    publish: async () => { events.push("publish"); state.release.draft = false; state.release.immutable = true; },
  };
  const services = { actions, api, registry: { inspect: async () => structuredClone(state.registry) },
    prepareMain: async () => { events.push("development"); return { status: "pass", candidateSha: f.sha, developmentSha: f.sha }; },
    pushCandidate: async (input) => { events.push("refs"); assert.equal(input.tagObject, tagObject); assert.equal(f.git("cat-file", "-t", tagObject), "tag"); return { status: "pass", complete: true }; },
    prepareUpload: async (input) => { events.push("prepare"); assert.equal(input.candidateSha, f.sha); return { publish: async () => { assert.ok(state.assets.some((asset) => asset.name === "tkt-registry-intent.json")); await input.getToken(); events.push("cargo"); state.registry = { phase: "published", name: "tkt", version: "0.1.0", sha256: input.crate.sha256, yanked: false }; }, close: async () => { events.push("close"); } }; },
    promoteStable: async ({ candidate, publisher }) => { assert.equal(publisher, "cargo-dist"); assert.equal(state.release.immutable, true); assert.ok(candidate.assets.some((asset) => asset.name === "tkt-registry-intent.json")); events.push("stable"); return { status: "pass", complete: true, sha: f.sha }; },
  };
  return { options, services, state, events, ci, run: (extra = {}) => publishTktCi({ ...options, ...extra }, services) };
}

test("tkt CI entry: dry-run validates reviewed build bytes without credentials or ref changes", () => fixture(async (f) => {
  const ci = await tktCiFixture(f), before = tree(f.temp), result = await ci.run();
  assert.equal(result.mode, "dry-run"); assert.equal(result.assetNames.length, 8); assert.deepEqual(ci.events, []); assert.deepEqual(tree(f.temp), before);
}, undefined, "tkt"));

test("tkt CI entry: reviewed tag, build bytes, intent and delayed transport are connected", () => fixture(async (f) => {
  const ci = await tktCiFixture(f), result = await ci.run({ execute: true });
  assert.equal(result.status, "pass"); assert.equal(result.stable.sha, f.sha); assert.equal(result.ciStage.runId, 12);
  assert.deepEqual(ci.events.slice(0, 3), ["development", "refs", "prepare"]);
  assert.ok(ci.events.indexOf("credential") > ci.events.indexOf("upload:tkt-registry-intent.json"));
  assert.deepEqual(ci.events.slice(-4), ["cargo", "publish", "stable", "close"]);
  await ci.run({ execute: true }); assert.equal(ci.events.filter((event) => event === "cargo").length, 1); assert.equal(ci.events.filter((event) => event === "prepare").length, 1);
}, undefined, "tkt"));

test("tkt CI entry: foreign/stale dispatches and disabled immutability never reach ref writes", () => fixture(async (f) => {
  const ci = await tktCiFixture(f);
  for (const context of [{ ...ci.options.context, event: "push" }, { ...ci.options.context, sha: "f".repeat(40) }, { ...ci.options.context, ref: "refs/heads/main" }, { ...ci.options.context, attempt: 2 }]) await assert.rejects(ci.run({ execute: true, context }), /dispatch|workflow identity/);
  ci.services.api.immutableEnabled = async () => false; await assert.rejects(ci.run({ execute: true }), /immutability/);
  assert.deepEqual(ci.events, []);
}, undefined, "tkt"));

test("tkt CI entry: altered reviewed tag is refused", () => fixture(async (f) => {
  await assert.rejects(tktCiFixture(f, ({ stage }) => { stage.entry.publication.tag.objectSha = "f".repeat(40); }).then((ci) => ci.run()), /tag record differs/);
}, undefined, "tkt"));

test("tkt CI entry: failed candidate push cannot create drafts or prepare credentials", () => fixture(async (f) => {
  const ci = await tktCiFixture(f); ci.services.pushCandidate = async () => ({ status: "pass", complete: false });
  await assert.rejects(ci.run({ execute: true }), /candidate refs/); assert.deepEqual(ci.events, ["development"]);
}, undefined, "tkt"));

test("tkt CI entry: failed stable resumes observed registry without preparing another upload", () => fixture(async (f) => {
  const ci = await tktCiFixture(f), promote = ci.services.promoteStable;
  ci.services.promoteStable = async () => { throw Error("seeded stable loss"); };
  await assert.rejects(ci.run({ execute: true }), /stable loss/); assert.equal(ci.events.at(-1), "close");
  ci.services.promoteStable = promote; await ci.run({ execute: true });
  assert.equal(ci.events.filter((event) => event === "cargo").length, 1); assert.equal(ci.events.filter((event) => event === "publish").length, 1);
}, undefined, "tkt"));

test("tkt CI entry: published candidate resumes stable without development or candidate ref writes", () => fixture(async (f) => {
  const ci = await tktCiFixture(f), promote = ci.services.promoteStable;
  ci.services.promoteStable = async () => { throw Error("seeded stable loss"); };
  await assert.rejects(ci.run({ execute: true }), /stable loss/);
  assert.equal(ci.state.release.immutable, true); assert.equal(ci.state.registry.phase, "published");
  ci.services.promoteStable = promote;
  ci.services.prepareMain = async () => { throw Error("later main conflicts"); };
  ci.services.pushCandidate = async () => { throw Error("candidate refs must remain untouched"); };
  const result = await ci.run({ execute: true });
  assert.equal(result.status, "pass"); assert.equal(result.stable.sha, f.sha);
  for (const event of ["development", "refs", "cargo", "publish", "stable"]) assert.equal(ci.events.filter(value => value === event).length, 1, event);
}, undefined, "tkt"));

test("tkt CI entry: stable recovery refuses a missing registry observation before development", () => fixture(async (f) => {
  const ci = await tktCiFixture(f);
  ci.services.promoteStable = async () => { throw Error("seeded stable loss"); };
  await assert.rejects(ci.run({ execute: true }), /stable loss/);
  ci.state.registry = { phase: "missing", name: "tkt", version: "0.1.0" };
  ci.services.prepareMain = async () => { throw Error("must not prepare development"); };
  await assert.rejects(ci.run({ execute: true }), /lacks confirmed matching registry/);
  assert.equal(ci.events.filter(value => value === "cargo").length, 1);
}, undefined, "tkt"));

test("tkt CI entry: failure JSON retains published channels and uncertain stable", () => fixture(async (f) => {
  const ci = await tktCiFixture(f);
  ci.services.promoteStable = async () => { throw Error("seeded stable loss", { cause: { token: "private-fixture-credential" } }); };
  await assert.rejects(ci.run({ execute: true }), error => {
    const json = JSON.stringify(publicationFailure(error)), report = JSON.parse(json).publication;
    assert.equal(report.candidateSha, f.sha); assert.equal(report.reviewSha, ci.options.reviewSha);
    assert.equal(report.github.phase, "published"); assert.equal(report.github.immutable, true);
    assert.equal(report.registry.phase, "published"); assert.equal(report.registry.url, "https://crates.io/crates/tkt/0.1.0");
    assert.equal(report.stable.phase, "unconfirmed"); assert.match(report.stable.url, /example\/tkt\/tree\/stable$/);
    assert.doesNotMatch(json, /private-fixture-credential|"bytes"|"cause"/);
    return true;
  });
}, undefined, "tkt"));

test("publication command: stable recovery rechecks complete remote assets", () => fixture(async (f) => {
  const pub = publicationFixture(f);
  pub.services.promoteStable = () => { throw Error("seeded stable rejection"); };
  await assert.rejects(pub.run({ execute: true }), /stable rejection/);
  pub.state.assets.pop();
  pub.services.prepareMain = () => { throw Error("must not prepare development"); };
  await assert.rejects(pub.run({ mode: "resume", execute: true }), /missing assets/);
  assert.equal(pub.writes.filter(value => value === "refs").length, 1);
}));

test("tkt CI entry: missing publication binding fails closed", () => fixture(async (f) => {
  const ci = await tktCiFixture(f, ({ stage }) => { delete stage.entry.publication; });
  await assert.rejects(ci.run({ execute: true }), /lacks the reviewed publication binding/); assert.deepEqual(ci.events, []);
}, undefined, "tkt"));

test("tkt CI entry: dispatch identity is rechecked after development work", () => fixture(async (f) => {
  const ci = await tktCiFixture(f), prepare = ci.services.prepareMain, run = ci.services.actions.run;
  ci.services.prepareMain = async (...args) => { const result = await prepare(...args); ci.services.actions.run = async (...input) => ({ ...await run(...input), status: "completed" }); return result; };
  await assert.rejects(ci.run({ execute: true }), /workflow identity/); assert.deepEqual(ci.events, ["development"]);
}, undefined, "tkt"));
