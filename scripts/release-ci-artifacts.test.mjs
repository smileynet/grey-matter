import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { inspectCiArchive, readCiStage, githubActionsReadApi } from "./release-ci-artifacts.mjs";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
function zip(entries) {
  const local = [], central = []; let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name), bytes = Buffer.from(entry.bytes), header = Buffer.alloc(30), directory = Buffer.alloc(46);
    let crc = 0xffffffff; for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); } crc = (crc ^ 0xffffffff) >>> 0;
    header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4); header.writeUInt32LE(crc, 14); header.writeUInt32LE(bytes.length, 18); header.writeUInt32LE(entry.size ?? bytes.length, 22); header.writeUInt16LE(name.length, 26);
    directory.writeUInt32LE(0x02014b50); directory.writeUInt16LE(0x314, 4); directory.writeUInt16LE(20, 6); directory.writeUInt32LE(crc, 16); directory.writeUInt32LE(bytes.length, 20); directory.writeUInt32LE(entry.size ?? bytes.length, 24); directory.writeUInt16LE(name.length, 28); directory.writeUInt32LE(entry.attributes ?? 0, 38); directory.writeUInt32LE(offset, 42);
    local.push(header, name, bytes); central.push(directory, name); offset += header.length + name.length + bytes.length;
  }
  const end = Buffer.alloc(22), directory = Buffer.concat(central); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}
function fixture(mutate = () => {}) {
  const assets = [{ name: "tkt-0.5.0.crate", bytes: Buffer.from("sealed crate") }, { name: "tkt-linux.tar.gz", bytes: Buffer.from("sealed executable") }];
  const record = { schema: 1, status: "pass", product: "tkt", version: "0.5.0", candidateSha: "a".repeat(40), repository: "example/tkt", runId: "12", runAttempt: "2", workflow: ".github/workflows/release.yml", publicationPerformed: false, files: assets.map((file) => ({ name: file.name, size: file.bytes.length, sha256: hash(file.bytes) })) };
  const entries = assets; mutate({ record, entries });
  const sealed = Buffer.from(JSON.stringify(record)); entries.push({ name: "tkt-stage.json", bytes: sealed }); const bytes = zip(entries);
  const expected = { repository: "example/tkt", repositoryId: 11, workflowId: 9, runId: 12, runAttempt: 2, artifactId: 15, sealJobId: 17, candidateSha: "a".repeat(40), version: "0.5.0", zipSize: bytes.length, zipSha256: hash(bytes), sealSha256: hash(sealed) };
  const run = { id: 12, run_attempt: 2, head_sha: expected.candidateSha, repository: { id: 11, full_name: "example/tkt" }, head_repository: { id: 11 }, workflow_id: 9, path: ".github/workflows/release.yml", event: "workflow_dispatch", status: "completed", conclusion: "success" };
  const artifact = { id: 15, name: "tkt-sealed-stage-12-2", size_in_bytes: bytes.length, digest: `sha256:${expected.zipSha256}`, expired: false, expires_at: "2099-01-01T00:00:00Z", workflow_run: { id: 12, head_sha: expected.candidateSha, repository_id: 11, head_repository_id: 11 } };
  const state = { run, artifact, jobs: [{ id: 17, name: "seal-stage", run_id: 12, status: "completed", conclusion: "success" }], downloads: 0 };
  const api = { run: async () => structuredClone(state.run), attempt: async () => structuredClone(state.run), jobs: async () => structuredClone(state.jobs), artifacts: async () => [structuredClone(state.artifact)], artifact: async () => structuredClone(state.artifact), jobLog: async () => `Artifact tkt-sealed-stage-12-2 successfully finalized. Artifact ID 15\nSHA256 digest of uploaded artifact is ${expected.zipSha256}`, download: async () => { state.downloads++; return bytes; } };
  return { expected, bytes, record, state, api, read: () => readCiStage({ expected, api }) };
}
test("reviewed CI ZIP verifies exact file bytes without extraction or rebuild", async () => {
  const f = fixture(), result = await inspectCiArchive(f.bytes, f.expected);
  assert.equal(result.assets.length, 2); assert.equal(result.record.version, "0.5.0");
  assert.equal(result.assets[0].bytes.toString(), "sealed crate");
  const bad = Buffer.from(f.bytes); bad[0] ^= 1; await assert.rejects(inspectCiArchive(bad, f.expected), /reviewed seal/);
});
test("CI ZIP refuses unsafe paths, duplicate names, symlinks and size abuse", async () => {
  for (const mutate of [
    ({ entries }) => entries.push({ name: "../escape", bytes: "x" }),
    ({ entries }) => entries.push({ name: "a\\escape", bytes: "x" }),
    ({ entries }) => entries.push({ name: "tkt-linux.tar.gz", bytes: "duplicate" }),
    ({ entries }) => entries.push({ name: "TKT-LINUX.TAR.GZ", bytes: "case collision" }),
    ({ entries }) => entries.push({ name: "symlink", bytes: "target", attributes: (0o120777 << 16) >>> 0 }),
    ({ entries }) => entries.push({ name: "huge", bytes: "x", size: 129 * 1024 * 1024 }),
  ]) { const f = fixture(mutate); await assert.rejects(inspectCiArchive(f.bytes, f.expected)); }
});
test("CI ZIP refuses changed, extra or missing files and wrong execution records", async () => {
  for (const mutate of [
    ({ entries }) => { entries[0].bytes = "changed crate"; },
    ({ entries }) => entries.push({ name: "extra.txt", bytes: "unreviewed" }),
    ({ entries }) => entries.shift(),
    ({ record, entries }) => { entries.shift(); record.files.shift(); },
    ({ record }) => { record.runAttempt = "1"; },
    ({ record }) => { record.candidateSha = "b".repeat(40); },
  ]) { const f = fixture(mutate); await assert.rejects(inspectCiArchive(f.bytes, f.expected)); }
});
test("CI provenance binds latest successful attempt, upload ID/digest and repeated observations", async () => {
  const f = fixture(), result = await f.read(); assert.equal(result.provenance.artifactId, 15); assert.equal(f.state.downloads, 1);
  const changed = fixture(), download = changed.api.download;
  changed.api.download = async () => { const bytes = await download(); changed.state.run.run_attempt++; return bytes; };
  await assert.rejects(changed.read, /run\/attempt/); assert.equal(changed.state.downloads, 1);
});
test("CI provenance refuses uncertain metadata and logs before downloading bytes", async () => {
  for (const mutate of [
    (f) => { f.state.artifact.expired = true; },
    (f) => { f.state.artifact.expires_at = "2000-01-01"; },
    (f) => { f.state.artifact.workflow_run.repository_id = 99; },
    (f) => { f.state.run.conclusion = "failure"; },
    (f) => { f.state.jobs[0].id++; },
    (f) => { f.api.artifacts = async () => [f.state.artifact, { ...f.state.artifact, id: 99 }]; },
    (f) => { f.api.jobLog = async () => "missing upload receipt"; },
  ]) { const f = fixture(); mutate(f); await assert.rejects(f.read); assert.equal(f.state.downloads, 0); }
});
test("Actions adapter makes typed read-only requests and paginates exact collections", () => {
  const calls = [], api = githubActionsReadApi({ run(args, binary) { calls.push(args); assert.equal(args[args.indexOf("--method") + 1], "GET"); return { status: 0, stdout: binary ? Buffer.from("ZIP") : args.at(-1).includes("jobs?") ? '[{"jobs":[{"id":1}]},{"jobs":[{"id":2}]}]' : '{}' }; } });
  assert.deepEqual(api.jobs("example/tkt", 12, 2), [{ id: 1 }, { id: 2 }]); assert.ok(calls[0].includes("--paginate"));
  assert.equal(api.download("example/tkt", 15).toString(), "ZIP");
  assert.throws(() => api.download("bad/repo/extra", 15), /repository/);
  assert.throws(() => api.artifact("example/tkt", "15"), /object ID/);
});

test("Actions log and ZIP reads explicitly capture raw bytes without terminal filtering", () => {
  const api = githubActionsReadApi({ run(args, binary) {
    assert.ok(args.includes("--allow-escape-sequences"), "gh must allow raw captured output for logs and binary ZIPs");
    return { status: 0, stdout: binary ? Buffer.from([0x50, 0x4b, 0x1b]) : "log\u001b[0m" };
  } });
  assert.equal(api.jobLog("example/tkt", 17), "log\u001b[0m");
  assert.deepEqual(api.download("example/tkt", 15), Buffer.from([0x50, 0x4b, 0x1b]));
});

test("CI upload log IDs/digests require complete tokens and expiry must be a string", async () => {
  for (const mutation of [
    (f) => { f.api.jobLog = async () => `Artifact tkt-sealed-stage-12-2 successfully finalized. Artifact ID 150\nSHA256 digest of uploaded artifact is ${f.expected.zipSha256}`; },
    (f) => { f.api.jobLog = async () => `Artifact tkt-sealed-stage-12-2 successfully finalized. Artifact ID 15\nSHA256 digest of uploaded artifact is ${f.expected.zipSha256}00`; },
    (f) => { f.state.artifact.expires_at = 2099; },
  ]) { const f = fixture(); mutation(f); await assert.rejects(f.read); assert.equal(f.state.downloads, 0); }
});
