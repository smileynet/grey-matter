import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectCiArchive, readCiStage, githubActionsReadApi } from "./release-ci-artifacts.mjs";
import { ciFixture as fixture } from "./release-ci-fixtures.mjs";
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
