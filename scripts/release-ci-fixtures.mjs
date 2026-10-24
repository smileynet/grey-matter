import { createHash } from "node:crypto";
import { readCiStage } from "./release-ci-artifacts.mjs";
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
export function ciFixture(mutate = () => {}, identity = {}) {
  const version = identity.version ?? "0.5.0", candidateSha = identity.candidateSha ?? "a".repeat(40);
  const assets = [{ name: `tkt-${version}.crate`, bytes: Buffer.from("sealed crate") }, { name: "tkt-linux.tar.gz", bytes: Buffer.from("sealed executable") }];
  const record = { schema: 1, status: "pass", product: "tkt", version, candidateSha, repository: "example/tkt", runId: "12", runAttempt: "2", workflow: ".github/workflows/release.yml", publicationPerformed: false, files: assets.map((file) => ({ name: file.name, size: file.bytes.length, sha256: hash(file.bytes) })) };
  const entries = assets; mutate({ record, entries });
  const sealed = Buffer.from(JSON.stringify(record)); entries.push({ name: "tkt-stage.json", bytes: sealed }); const bytes = zip(entries);
  const expected = { repository: "example/tkt", repositoryId: 11, workflowId: 9, runId: 12, runAttempt: 2, artifactId: 15, sealJobId: 17, candidateSha, version, zipSize: bytes.length, zipSha256: hash(bytes), sealSha256: hash(sealed) };
  const run = { id: 12, run_attempt: 2, head_sha: expected.candidateSha, repository: { id: 11, full_name: "example/tkt" }, head_repository: { id: 11 }, workflow_id: 9, path: ".github/workflows/release.yml", event: "workflow_dispatch", status: "completed", conclusion: "success" };
  const artifact = { id: 15, name: "tkt-sealed-stage-12-2", size_in_bytes: bytes.length, digest: `sha256:${expected.zipSha256}`, expired: false, expires_at: "2099-01-01T00:00:00Z", workflow_run: { id: 12, head_sha: expected.candidateSha, repository_id: 11, head_repository_id: 11 } };
  const state = { run, artifact, jobs: [{ id: 17, name: "seal-stage", run_id: 12, status: "completed", conclusion: "success" }], downloads: 0 };
  const api = { run: async () => structuredClone(state.run), attempt: async () => structuredClone(state.run), jobs: async () => structuredClone(state.jobs), artifacts: async () => [structuredClone(state.artifact)], artifact: async () => structuredClone(state.artifact), jobLog: async () => `Artifact tkt-sealed-stage-12-2 successfully finalized. Artifact ID 15\nSHA256 digest of uploaded artifact is ${expected.zipSha256}`, download: async () => { state.downloads++; return bytes; } };
  return { expected, bytes, record, state, api, read: () => readCiStage({ expected, api }) };
}
