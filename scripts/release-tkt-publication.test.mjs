import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { tktRegistryIntent, reconcileTktPublication } from "./release-tkt-publication.mjs";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
function fixture() {
  const bytes = Buffer.from("sealed source crate"), crate = { name: "tkt", version: "0.5.0", bytes, sha256: hash(bytes) };
  const asset = (name, bytes) => ({ name, bytes, size: bytes.length, sha256: hash(bytes) });
  const candidate = { product: "tkt", version: crate.version, candidateSha: "a".repeat(40), tagObject: "b".repeat(40), repository: "example/tkt", title: "v0.5.0", notes: "Reviewed release notes", assets: [asset("tkt-0.5.0.crate", bytes), asset("plugin.tar.gz", Buffer.from("plugin"))], gates: { product: "tkt", version: crate.version, candidateSha: "a".repeat(40), status: "pass", pending: [] } };
  const events = [], state = { release: null, assets: [], registry: { phase: "missing", name: "tkt", version: crate.version }, stable: null, nextAsset: 100, stableReads: 0 };
  const remoteAsset = (local) => ({ id: state.nextAsset++, name: local.name, size: local.bytes.length, digest: `sha256:${hash(local.bytes)}`, state: "uploaded" });
  const api = {
    tag: async () => ({ sha: candidate.candidateSha, objectSha: candidate.tagObject, annotated: true }),
    releases: async () => state.release ? [structuredClone(state.release)] : [],
    assets: async () => structuredClone(state.assets),
    immutableEnabled: async () => true,
    createDraft: async (_, input) => { events.push("draft"); state.release = { id: 9, tag_name: input.tag, name: input.title, body: input.notes, draft: true, immutable: false, html_url: "https://github.com/example/tkt/releases/tag/v0.5.0" }; },
    upload: async (_, id, input) => { assert.equal(id, 9); assert.ok(!state.assets.some((item) => item.name === input.name)); events.push(`upload:${input.name}`); const result = remoteAsset(input); state.assets.push(result); return structuredClone(result); },
    publish: async () => { assert.equal(state.registry.phase, "published", "GitHub cannot publish before the exact registry checksum is observed"); events.push("publish"); state.release.draft = false; state.release.immutable = true; },
  };
  const registry = { inspect: async () => structuredClone(state.registry) };
  const options = { candidate, crate, api, registry,
    prepareUpload: async () => { events.push("prepare"); return {
      publish: async (sealed) => { assert.equal(sealed.sha256, crate.sha256); assert.ok(state.assets.some((item) => item.name === "tkt-registry-intent.json")); events.push("cargo"); state.registry = { phase: "published", name: "tkt", version: crate.version, sha256: crate.sha256, yanked: false }; },
      close: async () => { events.push("close"); },
    }; },
    promoteStable: async (full) => { assert.equal(state.registry.phase, "published"); assert.equal(state.release.immutable, true); assert.ok(full.assets.some((item) => item.name === "tkt-registry-intent.json")); state.stableReads++; if (state.stable !== full.candidateSha) events.push("stable"); state.stable = full.candidateSha; return { status: "pass", complete: true, sha: state.stable }; },
  };
  const seed = (intent = true, published = false) => { state.release = { id: 9, tag_name: "v0.5.0", name: candidate.title, body: candidate.notes, draft: !published, immutable: published }; state.assets = candidate.assets.map(remoteAsset); if (intent) state.assets.push(remoteAsset(tktRegistryIntent({ candidate, crate }))); };
  return { candidate, crate, api, registry, events, state, options, remoteAsset, seed, run: (extra = {}) => reconcileTktPublication({ ...options, ...extra }) };
}
test("registry intent bytes are deterministic and bind only the sealed product identity", () => {
  const f = fixture(), first = tktRegistryIntent(f), second = tktRegistryIntent({ ...f, candidate: { ...f.candidate, releaseId: 99, reviewSha: "c".repeat(40) } });
  assert.deepEqual(first, second); assert.equal(JSON.parse(first.bytes).uploadMayHaveBeenAttempted, true);
  assert.notEqual(tktRegistryIntent({ ...f, candidate: { ...f.candidate, candidateSha: "d".repeat(40) } }).sha256, first.sha256);
  assert.throws(() => tktRegistryIntent({ ...f, crate: { ...f.crate, sha256: "f".repeat(64) } }), /sealed tkt crate/);
});
test("tkt publication plans all channels without preparation or mutations", async () => {
  const f = fixture(), result = await f.run(); assert.equal(result.mode, "dry-run"); assert.equal(result.intent, "missing"); assert.deepEqual(f.events, []);
  await assert.rejects(f.run({ execute: "true" }), /boolean/); assert.deepEqual(f.events, []);
});
test("initial publication stages ordinary bytes, intent, Cargo, GitHub and stable in order", async () => {
  const f = fixture(), result = await f.run({ execute: true }); assert.equal(result.stable.sha, f.candidate.candidateSha);
  assert.deepEqual(f.events, ["prepare", "draft", "upload:tkt-0.5.0.crate", "upload:plugin.tar.gz", "upload:tkt-registry-intent.json", "cargo", "publish", "stable", "close"]);
  const count = f.events.length; await f.run({ execute: true }); assert.equal(f.events.length, count); assert.equal(f.state.stableReads, 2);
});
test("partial ordinary draft resumes without replacing assets or creating a second release", async () => {
  const f = fixture(); f.seed(false); f.state.assets.pop(); await f.run({ execute: true });
  assert.ok(!f.events.includes("draft")); assert.ok(!f.events.includes("upload:tkt-0.5.0.crate")); assert.ok(f.events.includes("upload:plugin.tar.gz"));
});
test("preexisting registry intent requires explicit retry while the index remains missing", async () => {
  const f = fixture(); f.seed(); await assert.rejects(f.run({ execute: true }), /prior registry intent/); assert.deepEqual(f.events, []);
  await f.run({ execute: true, retryUnconfirmed: true }); assert.equal(f.events.filter((event) => event === "cargo").length, 1); assert.ok(!f.events.includes("upload:tkt-registry-intent.json"));
});
test("lost receipt upload response consumes initial permission even when readback matches", async () => {
  const f = fixture(), upload = f.api.upload;
  f.api.upload = async (...args) => { const result = await upload(...args); if (args[2].name === "tkt-registry-intent.json") throw Error("response lost"); return result; };
  await assert.rejects(f.run({ execute: true }), /outcome is uncertain/); assert.ok(!f.events.includes("cargo")); assert.equal(f.events.at(-1), "close");
  await assert.rejects(f.run({ execute: true }), /prior registry intent/); assert.ok(!f.events.includes("cargo"));
});
test("unconfirmed receipt creation response or changed receipt ID cannot authorize Cargo", async () => {
  for (const change of [(value) => undefined, (value) => ({ ...value, id: value.id + 1 }), (value) => ({ ...value, state: "starter" })]) {
    const f = fixture(), upload = f.api.upload;
    f.api.upload = async (...args) => { const value = await upload(...args); return args[2].name === "tkt-registry-intent.json" ? change(value) : value; };
    await assert.rejects(f.run({ execute: true }), /intent/); assert.ok(!f.events.includes("cargo")); assert.equal(f.events.at(-1), "close");
  }
});
test("another publisher's new receipt is never mistaken for initial attempt ownership", async () => {
  const f = fixture(), prepare = f.options.prepareUpload; f.seed(false);
  f.options.prepareUpload = async (...args) => { const transport = await prepare(...args); f.state.assets.push(f.remoteAsset(tktRegistryIntent(f))); return transport; };
  await assert.rejects(f.run({ execute: true }), /unexpected asset|another publisher/); assert.ok(!f.events.includes("cargo")); assert.equal(f.events.at(-1), "close");
});
test("Cargo response loss after registry commit is reconciled without a duplicate upload", async () => {
  const f = fixture(), prepare = f.options.prepareUpload;
  f.options.prepareUpload = async (...args) => { const transport = await prepare(...args), publish = transport.publish; transport.publish = async (...args) => { await publish(...args); throw Error("response lost"); }; return transport; };
  await f.run({ execute: true }); await f.run({ execute: true }); assert.equal(f.events.filter((event) => event === "cargo").length, 1);
});
test("unobserved Cargo attempt leaves a draft and receipt; later matching index resumes", async () => {
  const f = fixture(), prepare = f.options.prepareUpload;
  f.options.prepareUpload = async (...args) => { const transport = await prepare(...args); transport.publish = async () => { f.events.push("cargo"); throw Error("upload failed or response lost"); }; return transport; };
  await assert.rejects(f.run({ execute: true }), /not observed/); assert.equal(f.state.release.draft, true); assert.equal(f.state.stable, null);
  await assert.rejects(f.run({ execute: true }), /prior registry intent/);
  f.state.registry = { phase: "published", name: "tkt", version: f.crate.version, sha256: f.crate.sha256, yanked: false };
  await f.run({ execute: true }); assert.equal(f.events.filter((event) => event === "cargo").length, 1); assert.equal(f.state.release.immutable, true);
});
test("transport and immutable-policy failures occur before any publication writes", async () => {
  for (const mutate of [
    (f) => { f.options.prepareUpload = async () => { throw Error("preflight failed"); }; },
    (f) => { f.options.prepareUpload = undefined; },
    (f) => { f.options.prepareUpload = async () => ({ publish() {} }); },
    (f) => { f.api.immutableEnabled = async () => false; },
    (f) => { f.options.promoteStable = undefined; },
  ]) { const f = fixture(); mutate(f); await assert.rejects(f.run({ execute: true })); assert.deepEqual(f.events, []); }
});
test("GitHub response loss and failed stable promotion resume without repeating Cargo", async () => {
  const f = fixture(), publish = f.api.publish;
  f.api.publish = async (...args) => { await publish(...args); throw Error("publish response lost"); };
  const promote = f.options.promoteStable; f.options.promoteStable = async () => { throw Error("stable rejected"); };
  await assert.rejects(f.run({ execute: true }), /stable rejected/); assert.equal(f.state.release.immutable, true); assert.equal(f.events.at(-1), "close");
  f.options.promoteStable = promote; await f.run({ execute: true }); assert.equal(f.events.filter((event) => event === "cargo").length, 1); assert.equal(f.events.filter((event) => event === "publish").length, 1);
});
test("wrong crate, yanked versions and invalid reviewed gates never reach preparation", async () => {
  for (const mutate of [
    (f) => { f.candidate.assets[0].sha256 = "c".repeat(64); },
    (f) => { f.state.registry = { phase: "published", name: "tkt", version: f.crate.version, sha256: f.crate.sha256, yanked: true }; },
    (f) => { f.candidate.gates.pending.push("audit"); },
  ]) { const f = fixture(); mutate(f); await assert.rejects(f.run({ execute: true })); assert.deepEqual(f.events, []); }
});

test("post-stable observation must still confirm both published channels", async () => {
  const f = fixture(), promote = f.options.promoteStable;
  f.options.promoteStable = async (...args) => { const result = await promote(...args); f.state.registry = { phase: "missing", name: "tkt", version: f.crate.version }; return result; };
  await assert.rejects(f.run({ execute: true }), /publication changed after stable/);
  assert.equal(f.events.at(-1), "close");
});
