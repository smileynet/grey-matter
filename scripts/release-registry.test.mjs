import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cratesIoTkt, reconcileTktCrate } from "./release-registry.mjs";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const row = (extra = {}) => ({ name: "tkt", vers: "0.4.0", cksum: "a".repeat(64), yanked: false, ...extra });
function index(body, status = 200) {
  const calls = [];
  const api = cratesIoTkt({ request: async (...args) => { calls.push(args); return { status, text: async () => body }; } });
  return { api, calls };
}
function fixture() {
  const bytes = Buffer.from("sealed synthetic crate"), crate = { name: "tkt", version: "0.5.0", bytes, sha256: hash(bytes) };
  let state = { phase: "missing", name: "tkt", version: crate.version };
  const writes = [], observations = [];
  const registry = { inspect: async () => state, publish: async () => { writes.push(crate.sha256); state = { ...state, phase: "published", sha256: crate.sha256, yanked: false }; } };
  return { crate, registry, writes, observations, set: (value) => { state = value; }, run: (extra = {}) => reconcileTktCrate({ crate, registry, observe: (value) => observations.push(value), ...extra }) };
}

test("sparse registry: exact versions, explicit missing version and uncached read-only request", async () => {
  const f = index(JSON.stringify(row()) + "\n");
  assert.equal((await f.api.inspect("0.4.0")).sha256, "a".repeat(64));
  assert.equal((await f.api.inspect("0.5.0")).phase, "missing");
  assert.equal(f.calls[0][0], "https://index.crates.io/3/t/tkt");
  assert.equal(f.calls[0][1].cache, "no-store"); assert.equal(f.calls[0][1].redirect, "error");
});

test("sparse registry: failures and malformed, duplicate or colliding versions never become absence", async () => {
  for (const [body, status] of [["", 404], ["unavailable", 503], ["", 200], ["not JSON", 200], [JSON.stringify(row({ name: "other" })), 200], [JSON.stringify(row({ yanked: "false" })), 200], [JSON.stringify(row()) + "\n" + JSON.stringify(row()), 200], [JSON.stringify(row({ vers: "0.5.0+metadata" })), 200]]) await assert.rejects(index(body, status).api.inspect("0.5.0"));
});

test("registry reconciliation: planning never publishes and completed publication replays without writes", async () => {
  const f = fixture(); assert.equal((await f.run()).phase, "missing"); assert.deepEqual(f.writes, []);
  assert.equal((await f.run({ execute: true })).phase, "published");
  assert.equal((await f.run({ execute: true })).phase, "published"); assert.equal(f.writes.length, 1);
  assert.ok(f.observations.some((state) => state.phase === "publication-attempted"));
});

test("registry reconciliation: timeout after upload is observed without publishing twice", async () => {
  const f = fixture(), publish = f.registry.publish;
  f.registry.publish = async () => { await publish(); throw new Error("lost response"); };
  assert.equal((await f.run({ execute: true })).phase, "published"); assert.equal(f.writes.length, 1);
});

test("registry reconciliation: unknown attempts require an explicit retry and keep the same bytes", async () => {
  const f = fixture(); f.registry.publish = async () => { f.writes.push("attempt"); throw new Error("unconfirmed upload"); };
  await assert.rejects(f.run({ execute: true }), /not observed/);
  await assert.rejects(f.run({ execute: true, previouslyAttempted: true }), /explicitly retrying/);
  assert.equal(f.writes.length, 1);
  await assert.rejects(f.run({ execute: true, previouslyAttempted: true, retryUnconfirmed: true }), /not observed/);
  assert.equal(f.writes.length, 2);
});

test("registry reconciliation: wrong bytes, changed checksums and yanked versions refuse publication", async () => {
  const f = fixture();
  await assert.rejects(f.run({ crate: { ...f.crate, bytes: Buffer.from("changed") }, execute: true }), /changed sealed/);
  for (const extra of [{ sha256: "b".repeat(64), yanked: false }, { sha256: f.crate.sha256, yanked: true }]) {
    f.set({ phase: "published", name: "tkt", version: "0.5.0", ...extra });
    await assert.rejects(f.run({ execute: true }), /differs or is yanked/);
  }
  assert.deepEqual(f.writes, []);
});
