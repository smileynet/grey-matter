import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { reconcileGithubRelease } from "./release-publish.mjs";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
function fixture(product = "grey-matter") {
  const sha = "a".repeat(40);
  const assets = ["codex.tgz", "claude.tgz"].map((name) => {
    const bytes = Buffer.from(name);
    return { name, bytes, size: bytes.length, sha256: hash(bytes) };
  });
  const candidate = { repository: `example/${product}`, product, version: "0.2.0", candidateSha: sha, title: "v0.2.0", notes: "Reviewed notes.\n", assets, gates: { status: "pass", product, version: "0.2.0", candidateSha: sha, pending: [] } };
  const state = { tag: { sha, annotated: true }, releases: [], assets: [], immutableEnabled: true };
  const writes = [], reads = [];
  const release = () => ({ id: 10, tag_name: "v0.2.0", name: candidate.title, body: candidate.notes, draft: true, immutable: false, html_url: "https://example.invalid/release/10" });
  const uploaded = (asset) => ({ id: state.assets.length + 1, name: asset.name, size: asset.size, digest: `sha256:${asset.sha256}`, state: "uploaded" });
  const api = {
    async tag(repo, tag) { reads.push([repo, tag]); return state.tag; },
    async releases(repo) { reads.push([repo]); return structuredClone(state.releases); },
    async assets(repo, id) { reads.push([repo, id]); return structuredClone(state.assets); },
    async immutableEnabled(repo) { reads.push([repo]); return state.immutableEnabled; },
    async createDraft(repo, identity) { writes.push(["create", repo, identity.tag]); state.releases.push(release()); },
    async upload(repo, id, asset) { writes.push(["upload", repo, id, asset.name]); state.assets.push({ id: state.assets.length + 1, name: asset.name, size: asset.bytes.byteLength, digest: `sha256:${hash(asset.bytes)}`, state: "uploaded" }); },
    async publish(repo, id) { writes.push(["publish", repo, id]); state.releases[0].draft = false; state.releases[0].immutable = true; },
  };
  const publisher = product === "tkt" ? "cargo-dist" : "local";
  return { candidate, state, api, writes, reads, release, uploaded, run: (extra = {}) => reconcileGithubRelease({ candidate, api, publisher, ...extra }) };
}

test("dry-run discovers the draft but creates, uploads and publishes nothing", async () => {
  const f = fixture(), before = structuredClone(f.state);
  const result = await f.run();
  assert.equal(result.mode, "dry-run"); assert.equal(result.phase, "missing");
  assert.deepEqual(f.writes, []); assert.deepEqual(f.state, before);
});

test("truthy configuration strings cannot turn inspection into publication", async () => {
  for (const execute of ["false", "true", 1, null]) {
    const f = fixture(); await assert.rejects(f.run({ execute }), /execution mode/);
    assert.deepEqual(f.reads, []); assert.deepEqual(f.writes, []);
  }
});

test("one publisher stages missing bytes, publishes once and resumes without writes", async () => {
  for (const product of ["grey-matter", "tkt"]) {
    const f = fixture(product);
    const result = await f.run({ execute: true });
    assert.equal(result.phase, "published"); assert.equal(result.immutable, true);
    assert.deepEqual(f.writes.map((x) => x[0]), ["create", "upload", "upload", "publish"]);
    const count = f.writes.length; await f.run({ execute: true }); assert.equal(f.writes.length, count);
    assert.ok(f.reads.every(([repo]) => repo === f.candidate.repository));
  }
});

test("local tkt publisher and unresolved candidate gates fail before API access", async () => {
  const tkt = fixture("tkt");
  await assert.rejects(tkt.run({ execute: true, publisher: "local" }), /sole publisher/);
  assert.deepEqual(tkt.reads, []); assert.deepEqual(tkt.writes, []);
  for (const gates of [{ status: "fail" }, { candidateSha: "b".repeat(40) }, { product: "tkt" }, { version: "0.3.0" }, { pending: ["staging"] }]) {
    const f = fixture(); Object.assign(f.candidate.gates, gates);
    await assert.rejects(f.run({ execute: true }), /candidate gates/);
    assert.deepEqual(f.reads, []); assert.deepEqual(f.writes, []);
  }
});

test("matching partial drafts upload only missing assets", async () => {
  const f = fixture(); f.state.releases.push(f.release()); f.state.assets.push(f.uploaded(f.candidate.assets[0]));
  await f.run({ execute: true });
  assert.deepEqual(f.writes.map((x) => x[0]), ["upload", "publish"]);
  assert.equal(f.writes[0][3], "claude.tgz");
});

test("assets completed by the assigned publisher between inspections are not uploaded again", async () => {
  const f = fixture(), upload = f.api.upload;
  f.api.upload = async (...args) => {
    await upload(...args);
    f.state.assets.push(f.uploaded(f.candidate.assets[1]));
  };
  await f.run({ execute: true });
  assert.equal(f.writes.filter(([action]) => action === "upload").length, 1);
});

test("remote tag, duplicate drafts, notes, titles and foreign assets fail closed", async () => {
  const cases = [
    [(f) => { f.state.tag.sha = "b".repeat(40); }, /remote tag/],
    [(f) => { f.state.tag.annotated = false; }, /annotated/],
    [(f) => { f.state.releases.push(f.release(), f.release()); }, /multiple/],
    [(f) => { f.state.releases.push({ ...f.release(), body: "different" }); }, /notes or title/],
    [(f) => { f.state.releases.push({ ...f.release(), name: "different" }); }, /notes or title/],
    [(f) => { f.state.releases.push(f.release()); f.state.assets.push({ ...f.uploaded(f.candidate.assets[0]), name: "foreign" }); }, /unexpected asset/],
  ];
  for (const [seed, expected] of cases) {
    const f = fixture(); seed(f); await assert.rejects(f.run({ execute: true }), expected); assert.deepEqual(f.writes, []);
  }
});

test("incomplete, duplicate, changed or digest-less assets are never clobbered", async () => {
  for (const seed of [
    (asset) => [{ ...asset, state: "starter" }],
    (asset) => [{ ...asset, size: 0 }],
    (asset) => [{ ...asset, digest: "sha256:" + "b".repeat(64) }],
    (asset) => [{ ...asset, digest: null }],
    (asset) => [asset, asset],
  ]) {
    const f = fixture(); f.state.releases.push(f.release()); f.state.assets = seed(f.uploaded(f.candidate.assets[0]));
    await assert.rejects(f.run({ execute: true }), /asset/); assert.deepEqual(f.writes, []);
  }
});

for (const method of ["createDraft", "upload", "publish"]) test(`observed success after ${method} timeout is resumed without repeating it`, async () => {
  const f = fixture(), original = f.api[method];
  f.api[method] = async (...args) => { await original(...args); throw new Error("transport timeout"); };
  assert.equal((await f.run({ execute: true })).phase, "published");
  assert.equal(f.writes.filter(([action]) => action === ({ createDraft: "create", upload: "upload", publish: "publish" })[method]).length, method === "upload" ? 2 : 1);
});

test("a failed upload retains a resumable draft; retry never repeats completed uploads", async () => {
  const f = fixture(), original = f.api.upload;
  f.api.upload = async (...args) => { if (args[2].name === "claude.tgz") throw new Error("offline"); await original(...args); };
  await assert.rejects(f.run({ execute: true }), /not observed/);
  assert.equal(f.state.releases[0].draft, true); assert.equal(f.state.assets.length, 1);
  f.api.upload = original; await f.run({ execute: true });
  assert.equal(f.writes.filter(([action, , , name]) => action === "upload" && name === "codex.tgz").length, 1);
});

test("immutable settings and published state are independently checked", async () => {
  const f = fixture(); f.state.immutableEnabled = false;
  await assert.rejects(f.run({ execute: true }), /immutability/); assert.deepEqual(f.writes, []);
  f.state.releases.push({ ...f.release(), draft: false });
  f.state.assets = f.candidate.assets.map(f.uploaded);
  await assert.rejects(f.run({ execute: true }), /immutable/); assert.deepEqual(f.writes, []);
});

test("tag movement or release replacement during upload blocks publication", async () => {
  for (const change of [(f) => { f.state.tag.sha = "b".repeat(40); }, (f) => { f.state.releases[0].id = 99; }]) {
    const f = fixture(), upload = f.api.upload;
    f.api.upload = async (...args) => { await upload(...args); change(f); };
    await assert.rejects(f.run({ execute: true }), /remote tag|release ID/);
    assert.equal(f.writes.some(([action]) => action === "publish"), false);
  }
});

test("bad local bytes or duplicate asset names fail before API access", async () => {
  for (const change of [(f) => { f.candidate.assets[0].bytes = Buffer.from("changed"); }, (f) => { f.candidate.assets.push(f.candidate.assets[0]); }]) {
    const f = fixture(); change(f); await assert.rejects(f.run({ execute: true }), /asset/); assert.deepEqual(f.reads, []);
  }
});

test("persisted release IDs cannot silently disappear or resolve to replacements", async () => {
  for (const seed of [(f) => { f.candidate.releaseId = 10; }, (f) => { f.candidate.releaseId = 99; f.state.releases.push(f.release()); }]) {
    const f = fixture(); seed(f); await assert.rejects(f.run({ execute: true }), /release ID/); assert.deepEqual(f.writes, []);
  }
});

test("successful API responses without observed progress stop instead of looping", async () => {
  for (const method of ["createDraft", "upload", "publish"]) {
    const f = fixture(); f.api[method] = async () => {};
    await assert.rejects(f.run({ execute: true }), /not observed/);
    assert.equal(f.state.releases[0]?.draft ?? true, true);
  }
});

test("a draft cannot claim immutable published state", async () => {
  const f = fixture(); f.state.releases.push({ ...f.release(), immutable: true });
  await assert.rejects(f.run({ execute: true }), /state is invalid/); assert.deepEqual(f.writes, []);
});
