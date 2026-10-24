#!/usr/bin/env node
// Capture prepared Cargo transports with a dummy localhost registry; never forward uploads.
// Usage: PROBE_CARGO=/absolute/cargo PROBE_RUSTC=/absolute/rustc node scripts/release-cargo-upload.integration.mjs [--tkt-repo DIR]
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, isAbsolute } from "node:path";
import { parse as parseToml } from "smol-toml";
import { prepareCargoUpload } from "./release-cargo-upload.mjs";
import { reconcileTktPublication } from "./release-tkt-publication.mjs";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function main() {
  const args = process.argv.slice(2);
  assert.ok(args.length === 0 || (args.length === 2 && args[0] === "--tkt-repo"), "usage: release-cargo-upload.integration.mjs [--tkt-repo DIR]");
  const actual = args.length ? resolve(args[1]) : null;
  const cargo = process.env.PROBE_CARGO, rustc = process.env.PROBE_RUSTC;
  assert.ok(process.platform === "linux" && cargo && rustc && isAbsolute(cargo) && isAbsolute(rustc), "Linux and explicit pinned runtime paths required");
  const root = mkdtempSync(join(tmpdir(), "Cargo adapter's integration "));
  const home = join(root, "baseline-home"); mkdirSync(home);
  const env = { PATH: "/usr/bin:/bin", HOME: home, CARGO_HOME: home, RUSTC: rustc, CARGO_HTTP_PROXY: "", NO_PROXY: "127.0.0.1", GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1", GIT_NO_REPLACE_OBJECTS: "1" };
  const captures = [], rows = [];
  let acceptUpload = false, indexRow;
  const server = createServer(async (request, response) => {
    if (request.method === "GET" && request.url === "/index/config.json") {
      response.setHeader("Content-Type", "application/json"); response.end(JSON.stringify({ api: `http://127.0.0.1:${server.address().port}`, dl: `http://127.0.0.1:${server.address().port}/download` })); return;
    }
    if (request.method === "GET" && request.url === "/index/3/t/tkt" && indexRow) {
      response.setHeader("Content-Type", "text/plain"); response.end(JSON.stringify(indexRow) + "\n"); return;
    }
    if (request.method === "PUT" && request.url === "/api/v1/crates/new") {
      let size = 0; const chunks = [];
      for await (const chunk of request) { size += chunk.length; if (size > 8 * 1024 * 1024) { request.destroy(); return; } chunks.push(chunk); }
      const body = Buffer.concat(chunks), end = body.length >= 8 ? 4 + body.readUInt32LE(0) : -1;
      if (end < 4 || end > body.length - 4 || end + 4 + body.readUInt32LE(end) !== body.length) { response.statusCode = 400; response.end("bad capture envelope"); return; }
      const bytes = body.subarray(end + 4), metadata = JSON.parse(body.subarray(4, end));
      captures.push({ sha256: hash(bytes), size: bytes.length, name: metadata.name, version: metadata.vers, readmeSha256: hash(Buffer.from(metadata.readme ?? "")), dummyAuthorizationMatched: request.headers.authorization === "local-probe-only" });
      if (acceptUpload) {
        indexRow = { name: metadata.name, vers: metadata.vers, deps: [], cksum: hash(bytes), features: {}, yanked: false };
        response.setHeader("Content-Type", "application/json"); response.end("{}"); return;
      }
      response.statusCode = 400; response.setHeader("Content-Type", "application/json"); response.end(JSON.stringify({ errors: [{ detail: "Local capture deliberately refused" }] })); return;
    }
    response.statusCode = 404; response.end("not found");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const index = `sparse+http://127.0.0.1:${server.address().port}/index/`;
  writeFileSync(join(home, "config.toml"), `[registries.release-probe]\nindex=${JSON.stringify(index)}\n`);
  const command = (binary, args, cwd) => new Promise((resolve, reject) => {
    const child = spawn(binary, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"], timeout: 180000 });
    let stdout = "", stderr = "";
    child.stdout.on("data", (data) => { stdout += data; }); child.stderr.on("data", (data) => { stderr += data; }); child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve(stdout) : reject(new Error(`fixture command failed (${binary}, ${code}): ${stderr}`)));
  });
  function git(repo, ...args) { return execFileSync("/usr/bin/git", ["--no-replace-objects", "-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", "-C", repo, ...args], { env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
  async function source(name, real = false) {
    const repo = join(root, name), target = join(root, name + "-target");
    if (real) { await command("/usr/bin/git", ["clone", "--no-local", "--no-hardlinks", "--", actual, repo], root); git(repo, "remote", "remove", "origin"); }
    else {
      mkdirSync(join(repo, "src"), { recursive: true });
      writeFileSync(join(repo, "Cargo.toml"), '[package]\nname="tkt"\nversion="0.0.1"\nedition="2021"\nreadme="README.md"\npublish=["release-probe"]\ninclude=["/src/**","/Cargo.toml","/Cargo.lock","/README.md"]\n');
      writeFileSync(join(repo, "src/main.rs"), "fn main() {}\n"); writeFileSync(join(repo, "README.md"), "Original reviewed README.\n");
      await command(cargo, ["generate-lockfile", "--offline"], repo);
      git(repo, "init", "-q"); git(repo, "add", "."); git(repo, "-c", "user.name=Probe", "-c", "user.email=probe@example.invalid", "commit", "-qm", "Fixture");
    }
    const candidateSha = git(repo, "rev-parse", "HEAD"), version = parseToml(readFileSync(join(repo, "Cargo.toml"), "utf8")).package.version;
    assert.equal(git(repo, "status", "--porcelain"), "");
    await command(cargo, ["package", "--registry", "release-probe", "--locked", "--no-verify", "--target-dir", target], repo);
    const path = join(target, `package/tkt-${version}.crate`), bytes = readFileSync(path);
    return { repo, candidateSha, target, path, readmeSha256: hash(readFileSync(join(repo, "README.md"))), crate: { name: "tkt", version, bytes, sha256: hash(bytes) } };
  }
  async function exercise(name, action, real = false) {
    acceptUpload = action === "coordinate"; indexRow = undefined;
    const input = await source(name, real), before = captures.length;
    let tokenCalls = 0, transport, intentConfirmed = false;
    const events = [];
    const getToken = () => { if (action === "coordinate") assert.equal(intentConfirmed, true, "credential requires confirmed durable intent"); tokenCalls++; events.push("credential"); return action === "real-token" ? "must-not-reach-local-registry" : "local-probe-only"; };
    try {
      if (action === "wrong-seal") {
        const bytes = Buffer.from("reviewed bytes deliberately differ from this candidate");
        input.crate = { ...input.crate, bytes, sha256: hash(bytes) };
      }
      const options = { repo: input.repo, candidateSha: input.candidateSha, crate: input.crate, cargo, rustc, getToken, probeIndex: index };
      if (action === "wrong-seal") {
        await assert.rejects(prepareCargoUpload(options), /package-preflight/);
        assert.equal(tokenCalls, 0); assert.equal(captures.length, before);
        rows.push({ name, result: "preflight-refused", tokenCalls, puts: 0 }); return;
      }
      transport = await prepareCargoUpload(options);
      assert.equal(tokenCalls, 0, "preflight must not request a credential"); assert.equal(captures.length, before);
      if (action === "cancel") {
        await transport.close(); await transport.close();
        await assert.rejects(transport.publish(input.crate), /closed/);
        assert.equal(tokenCalls, 0); assert.equal(captures.length, before);
        rows.push({ name, result: "closed-before-intent", tokenCalls, puts: 0 }); return;
      }
      if (action === "real-token") {
        await assert.rejects(transport.publish(input.crate), /forbidden for a probe/);
        assert.equal(tokenCalls, 1); assert.equal(captures.length, before);
        rows.push({ name, result: "real-token-refused", tokenCalls, puts: 0 }); return;
      }
      writeFileSync(join(input.repo, "src/main.rs"), 'fn main() { println!("host mutation"); }\n');
      writeFileSync(join(input.repo, "README.md"), "Host changed README after preflight.\n");
      writeFileSync(join(input.repo, ".git/HEAD"), "host changed Git identity\n"); writeFileSync(input.path, "corrupt old output");
      const old = process.env.CARGO_REGISTRY_TOKEN;
      process.env.CARGO_REGISTRY_TOKEN = "ambient-token-must-not-win";
      try {
        if (action === "coordinate") {
          let release;
          const assets = [];
          const asset = (name, bytes) => ({ name, bytes, size: bytes.length, sha256: hash(bytes) });
          const candidate = { product: "tkt", version: input.crate.version, candidateSha: input.candidateSha, tagObject: "b".repeat(40), repository: "example/tkt", title: "v" + input.crate.version, notes: "Synthetic reviewed fixture", assets: [asset(`tkt-${input.crate.version}.crate`, input.crate.bytes), asset("plugin.tar.gz", Buffer.from("synthetic plugin"))], gates: { product: "tkt", version: input.crate.version, candidateSha: input.candidateSha, status: "pass", pending: [] } };
          const api = {
            tag: async () => ({ sha: input.candidateSha, objectSha: candidate.tagObject, annotated: true }),
            releases: async () => release ? [structuredClone(release)] : [],
            assets: async () => { if (assets.some((asset) => asset.name === "tkt-registry-intent.json")) intentConfirmed = true; return structuredClone(assets); },
            immutableEnabled: async () => true,
            createDraft: async (_, value) => { events.push("draft"); release = { id: 1, tag_name: value.tag, name: value.title, body: value.notes, draft: true, immutable: false, html_url: "https://github.com/example/tkt/releases/tag/" + value.tag }; },
            upload: async (_, id, value) => { assert.equal(id, 1); const row = { id: assets.length + 10, name: value.name, size: value.bytes.length, digest: "sha256:" + hash(value.bytes), state: "uploaded" }; assets.push(row); events.push("upload:" + value.name); return structuredClone(row); },
            publish: async () => { assert.ok(indexRow); assert.equal(indexRow.cksum, input.crate.sha256); events.push("github-publish"); release.draft = false; release.immutable = true; },
          };
          const registry = { inspect: async (version) => {
            const response = await fetch(`http://127.0.0.1:${server.address().port}/index/3/t/tkt`);
            if (response.status === 404) return { phase: "missing", name: "tkt", version };
            assert.equal(response.status, 200); const row = await response.json();
            return { phase: "published", name: row.name, version: row.vers, sha256: row.cksum, yanked: row.yanked };
          } };
          const options = { candidate, crate: input.crate, api, registry, execute: true, prepareUpload: async () => { events.push("prepare"); return transport; }, promoteStable: async () => { assert.equal(release.immutable, true); events.push("stable-observed"); return { status: "pass", complete: true, sha: input.candidateSha }; } };
          const published = await reconcileTktPublication(options);
          assert.equal(published.registry.phase, "published"); assert.equal(published.github.immutable, true);
          await reconcileTktPublication(options);
          assert.equal(events.filter((event) => event === "prepare").length, 1);
          assert.ok(events.indexOf("upload:tkt-registry-intent.json") < events.indexOf("credential"));
          assert.equal(events.filter((event) => event === "github-publish").length, 1);
        } else await assert.rejects(transport.publish(input.crate), /cargo-publish/);
      }
      finally { if (old === undefined) delete process.env.CARGO_REGISTRY_TOKEN; else process.env.CARGO_REGISTRY_TOKEN = old; }
      await assert.rejects(transport.publish(input.crate), /closed|already attempted/);
      const captured = captures.slice(before);
      assert.equal(tokenCalls, 1); assert.equal(captured.length, 1);
      assert.deepEqual(captured[0], { sha256: input.crate.sha256, size: input.crate.bytes.length, name: "tkt", version: input.crate.version, readmeSha256: input.readmeSha256, dummyAuthorizationMatched: true });
      rows.push({ name, candidateSha: input.candidateSha, version: input.crate.version, evidence: transport.evidence, captured: captured[0], tokenCalls, puts: 1, expectedMockRefusal: action !== "coordinate", syntheticGithub: action === "coordinate", events });
    } finally { if (transport) await transport.close(); }
  }
  try {
    await exercise("fixture-capture", "capture");
    await exercise("fixture-cancel", "cancel");
    await exercise("fixture-wrong-seal", "wrong-seal");
    await exercise("fixture-real-token", "real-token");
    await exercise("fixture-coordinated", "coordinate");
    if (actual) await exercise("actual-tkt-coordinated", "coordinate", true);
    assert.equal(rows.length, actual ? 6 : 5);
    console.log(JSON.stringify({ status: "pass", metrics: { cases: rows.length, puts: captures.length }, errors: [], rows, realRegistryPublication: false }, null, 2));
  } finally { await new Promise((resolve) => server.close(resolve)); rmSync(root, { recursive: true, force: true }); }
}
main().catch((error) => { console.error(JSON.stringify({ status: "error", errors: [error.message] })); process.exitCode = 2; });
