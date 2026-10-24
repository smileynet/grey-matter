import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { cargoUploadPolicy, validateCargoUploadManifest, prepareCargoUpload } from "./release-cargo-upload.mjs";

function fixture() {
  const bytes = Buffer.from("independent reviewed crate");
  const crate = { name: "tkt", version: "0.5.0", bytes, sha256: createHash("sha256").update(bytes).digest("hex") };
  return { repo: resolve("candidate"), candidateSha: "a".repeat(40), crate, cargo: resolve("runtime/cargo"), rustc: resolve("runtime/rustc"), getToken: () => { throw Error("preflight must not read a credential"); } };
}

test("snapshot preserves empty Git directories, directory modes and safe symlinks", { skip: process.platform === "win32" }, () => {
  const result = spawnSync("python3", ["-B", fileURLToPath(new URL("./release-cargo-transport.test.py", import.meta.url))], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { status: "pass", metrics: { tests: 3 }, errors: [] });
});

test("transport policy binds reviewed bytes and defaults to the sole crates.io registry", () => {
  const options = fixture(), policy = cargoUploadPolicy(options);
  assert.equal(policy.sha256, options.crate.sha256);
  assert.equal(policy.size, options.crate.bytes.length);
  assert.equal(policy.index, "https://github.com/rust-lang/crates.io-index");
  assert.equal(policy.registry, "crates-io");
  assert.equal(Object.hasOwn(policy, "getToken"), false);
  assert.equal(Object.hasOwn(policy, "token"), false);
});

test("token, config, dirty-source and invocation overrides cannot enter preparation", () => {
  for (const override of [{ token: "must-not-appear" }, { args: ["--token", "must-not-appear"] }, { config: "foreign" }, { allowDirty: true }, { env: { CARGO_REGISTRY_TOKEN: "foreign" } }]) {
    assert.throws(() => cargoUploadPolicy({ ...fixture(), ...override }), /overrides are forbidden/);
  }
  for (const override of [{ candidateSha: "--output=untrusted" }, { repo: "relative" }, { cargo: "cargo" }, { rustc: "rustc" }, { getToken: "token" }]) assert.throws(() => cargoUploadPolicy({ ...fixture(), ...override }), /absolute paths/);
  const changed = fixture(); changed.crate.bytes[0] ^= 1;
  assert.throws(() => cargoUploadPolicy(changed), /changed sealed/);
});

test("only the fixed localhost probe form is accepted as a registry override", () => {
  assert.equal(cargoUploadPolicy({ ...fixture(), probeIndex: "sparse+http://127.0.0.1:12345/index/" }).registry, "release-probe");
  for (const probeIndex of ["sparse+https://example.invalid/index/", "sparse+http://localhost:1234/index/", "sparse+http://127.0.0.1:70000/index/", "sparse+http://127.0.0.1:1234/index/?token=x", "sparse+http://user@127.0.0.1:1234/index/", "sparse+http://127.0.0.1:0/index/"]) assert.throws(() => cargoUploadPolicy({ ...fixture(), probeIndex }), /localhost/);
});

test("manifest gate rejects external inputs while accepting tkt's registry-only dependency model", () => {
  const policy = cargoUploadPolicy(fixture());
  const valid = { package: { name: "tkt", version: "0.5.0", readme: "README.md" }, dependencies: { clap: { version: "4", features: ["derive"] }, anyhow: "1" }, workspace: { metadata: { dist: {} } } };
  assert.doesNotThrow(() => validateCargoUploadManifest(valid, policy));
  for (const manifest of [
    { ...valid, package: { ...valid.package, version: "0.4.0" } },
    { ...valid, package: { ...valid.package, readme: "../outside.md" } },
    { ...valid, package: { ...valid.package, build: "/outside.rs" } },
    { ...valid, patch: { "crates-io": {} } },
    { ...valid, workspace: { members: ["../outside"] } },
    ...["path", "git", "registry", "workspace"].map((key) => ({ ...valid, dependencies: { item: { version: "1", [key]: "outside" } } })),
    { ...valid, target: { "cfg(unix)": { "build-dependencies": { item: { path: "../outside" } } } } },
  ]) assert.throws(() => validateCargoUploadManifest(manifest, policy), /differs|inside|unsupported|lockfile/);
});

test("unsupported hosts refuse before reading credentials or starting a child", { skip: process.platform === "linux" }, async () => {
  await assert.rejects(prepareCargoUpload(fixture()), /Linux namespace/);
});

test("Linux entry rejects option injection before even reading the candidate", { skip: process.platform !== "linux" }, async () => {
  await assert.rejects(prepareCargoUpload({ ...fixture(), args: ["--token", "foreign"] }), /overrides are forbidden/);
  await assert.rejects(prepareCargoUpload({ ...fixture(), candidateSha: "--output=foreign" }), /absolute paths/);
});
