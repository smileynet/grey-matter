import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { credentialReply } from "./release-cargo-credentials.mjs";

const policy = { name: "tkt", version: "0.5.0", sha256: "a".repeat(64), index: "sparse+https://index.crates.io/" };
const request = { v: 1, kind: "get", operation: "publish", name: "tkt", vers: "0.5.0", cksum: policy.sha256, registry: { "index-url": policy.index }, args: [] };
const token = "fixture-token-must-not-appear-in-errors";
const script = fileURLToPath(new URL("./release-cargo-credentials.mjs", import.meta.url));

test("publish credentials bind the exact seal and cannot be cached across operations", () => {
  assert.deepEqual(credentialReply(request, policy, token), { Ok: { kind: "get", token, cache: "never", operation_independent: false } });
  assert.deepEqual(credentialReply({ v: 1, kind: "get", operation: "read", registry: request.registry, args: [] }, policy, token), { Ok: { kind: "get", token, cache: "never", operation_independent: false } });
});

test("identity, registry, protocol and override mismatches are fatal without disclosing credentials", () => {
  for (const changed of [null, { ...request, name: "other" }, { ...request, vers: "0.6.0" }, { ...request, cksum: "b".repeat(64) }, { ...request, registry: { "index-url": "sparse+https://other.invalid/" } }, { ...request, args: ["--token", token] }, { ...request, kind: "login", token }, { ...request, operation: "owners" }, { ...request, v: 2 }]) {
    const result = credentialReply(changed, policy, token);
    assert.equal(result.Err?.kind, "other");
    assert.doesNotMatch(JSON.stringify(result), new RegExp(token));
    assert.equal(result.Ok, undefined);
  }
});

test("invalid seal policies and missing credentials cannot authorize a request", () => {
  for (const changed of [null, { ...policy, sha256: "bad" }, { ...policy, version: "00.5.0" }, { ...policy, version: ["0.5.0"] }, { ...policy, sha256: [policy.sha256] }, { ...policy, index: "sparse+https://user:secret@index.crates.io/" }]) assert.equal(credentialReply(request, changed, token).Err?.kind, "other");
  assert.equal(credentialReply(request, policy, "").Err?.kind, "other");
});

async function protocol(input, { args = ["--cargo-plugin"], invalidPolicy = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "Cargo provider's policy "));
  const path = join(root, "sealed identity.json");
  writeFileSync(path, invalidPolicy ? "broken policy" : JSON.stringify(policy));
  let child;
  try {
    return await new Promise((resolve, reject) => {
      child = spawn(process.execPath, [script, ...args], { env: { ...process.env, RELEASE_CARGO_POLICY: path, RELEASE_CARGO_TOKEN: token }, stdio: ["pipe", "pipe", "pipe"] });
      let stdout = "", stderr = "";
      const timer = setTimeout(() => { child.kill(); reject(new Error("provider waited for stdin EOF instead of a request line")); }, 3000);
      child.stdout.on("data", (data) => { stdout += data; });
      child.stderr.on("data", (data) => { stderr += data; });
      child.stdin.on("error", (error) => { if (error.code !== "EPIPE") reject(error); });
      child.on("error", (error) => { clearTimeout(timer); reject(error); });
      child.on("close", (code) => { clearTimeout(timer); resolve({ code, stdout, stderr }); });
      child.stdin.write(input + "\n");
    });
  } finally { if (child?.exitCode === null) child.kill(); rmSync(root, { recursive: true, force: true }); }
}

test("CLI answers Cargo's line protocol before stdin closes", async () => {
  const result = await protocol(JSON.stringify(request));
  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual(result.stdout.trim().split("\n").map(JSON.parse), [{ v: [1] }, credentialReply(request, policy, token)]);
  assert.equal(result.stderr, "");
});

test("CLI malformed JSON and policy failures return fatal protocol errors with no secret echo", async () => {
  for (const result of [await protocol(`not-json-${token}`), await protocol("x".repeat(65537) + token), await protocol(JSON.stringify(request), { invalidPolicy: true })]) {
    const replies = result.stdout.trim().split("\n").map(JSON.parse);
    assert.deepEqual(replies[0], { v: [1] });
    assert.equal(replies[1].Err?.kind, "other");
    assert.doesNotMatch(result.stdout + result.stderr, new RegExp(token));
  }
});

test("CLI refuses token flags and extra arguments", async () => {
  const result = await protocol(JSON.stringify(request), { args: ["--cargo-plugin", "--token", token] });
  assert.equal(result.code, 2);
  assert.equal(result.stdout, "");
  assert.doesNotMatch(result.stderr, new RegExp(token));
});
