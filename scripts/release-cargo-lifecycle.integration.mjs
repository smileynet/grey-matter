#!/usr/bin/env node
// Kill disposable transport parents before intent and during a held localhost upload.
// Usage: PROBE_CARGO=/absolute/cargo PROBE_RUSTC=/absolute/rustc node scripts/release-cargo-lifecycle.integration.mjs
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const rows = [];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(test, timeout = 15000) {
  const end = Date.now() + timeout;
  while (!test()) { if (Date.now() > end) throw Error("lifecycle observation timed out"); await sleep(50); }
}
function processRecord(pid) {
  try { const text = readFileSync(`/proc/${pid}/stat`, "utf8"), fields = text.slice(text.lastIndexOf(")") + 2).split(/\s+/); return { pid, command: text.slice(text.indexOf("(") + 1, text.lastIndexOf(")")), state: fields[0], start: fields[19], exitCode: Number(fields[49]) }; }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}
function descendants(pid) {
  const found = [];
  function walk(parent) {
    let children;
    try { children = readFileSync(`/proc/${parent}/task/${parent}/children`, "utf8").trim(); }
    catch (error) { if (error.code === "ENOENT") return; throw error; }
    for (const child of children ? children.split(/\s+/).map(Number) : []) { const record = processRecord(child); if (record) { found.push(record); walk(child); } }
  }
  walk(pid); return found;
}
async function main() {
  assert.equal(process.platform, "linux");
  const cargo = process.env.PROBE_CARGO, rustc = process.env.PROBE_RUSTC;
  assert.ok(cargo?.startsWith("/") && rustc?.startsWith("/"));
  const root = mkdtempSync(join(tmpdir(), "release-lifecycle-")), repo = join(root, "source"), home = join(root, "home"), target = join(root, "target");
  mkdirSync(join(repo, "src"), { recursive: true }); mkdirSync(home);
  const env = { PATH: "/usr/bin:/bin", HOME: home, CARGO_HOME: home, RUSTC: rustc, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1", GIT_NO_REPLACE_OBJECTS: "1" };
  const run = (binary, args) => execFileSync(binary, args, { cwd: repo, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  writeFileSync(join(repo, "Cargo.toml"), '[package]\nname="tkt"\nversion="0.0.1"\nedition="2021"\npublish=["release-probe"]\n');
  writeFileSync(join(repo, "src/main.rs"), "fn main() {}\n");
  run(cargo, ["generate-lockfile", "--offline"]);
  run("/usr/bin/git", ["init", "-q"]); run("/usr/bin/git", ["add", "."]); run("/usr/bin/git", ["-c", "user.name=Lifecycle probe", "-c", "user.email=probe@example.invalid", "-c", "core.hooksPath=/dev/null", "commit", "-qm", "Fixture"]);
  const candidateSha = run("/usr/bin/git", ["rev-parse", "HEAD"]).trim();
  const captures = [];
  const server = createServer(async (request, response) => {
    if (request.method === "GET" && request.url === "/index/config.json") { response.end(JSON.stringify({ api: `http://127.0.0.1:${server.address().port}`, dl: `http://127.0.0.1:${server.address().port}/download` })); return; }
    if (request.method === "PUT" && request.url === "/api/v1/crates/new") {
      const chunks = []; let size = 0;
      for await (const chunk of request) { size += chunk.length; if (size > 1024 * 1024) { request.destroy(); return; } chunks.push(chunk); }
      const body = Buffer.concat(chunks), end = body.length >= 8 ? 4 + body.readUInt32LE(0) : -1;
      if (end < 4 || end > body.length - 4 || end + 4 + body.readUInt32LE(end) !== body.length) { response.statusCode = 400; response.end("bad capture envelope"); return; }
      captures.push({ sha256: hash(body.subarray(end + 4)), dummyAuthorizationMatched: request.headers.authorization === "local-probe-only" });
      // Hold the response so parent loss happens during an unconfirmed upload.
      return;
    }
    response.statusCode = 404; response.end("not found");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const probeIndex = `sparse+http://127.0.0.1:${server.address().port}/index/`;
    writeFileSync(join(home, "config.toml"), `[registries.release-probe]\nindex=${JSON.stringify(probeIndex)}\n`);
    await new Promise((resolve, reject) => {
      const child = spawn(cargo, ["package", "--registry", "release-probe", "--locked", "--no-verify", "--target-dir", target], { cwd: repo, env, stdio: ["ignore", "ignore", "pipe"], timeout: 120000 });
      let diagnostic = ""; child.stderr.on("data", (data) => { diagnostic = (diagnostic + data).slice(0, 8192); });
      child.on("error", reject); child.on("close", (code) => code === 0 ? resolve() : reject(Error(`baseline package failed: ${diagnostic}`)));
    });
    const bytes = readFileSync(join(target, "package/tkt-0.0.1.crate"));
    const config = { repo, candidateSha, crate: { name: "tkt", version: "0.0.1", bytes: bytes.toString("base64"), sha256: hash(bytes) }, cargo, rustc, probeIndex };
    const workerSource = `import {prepareCargoUpload} from ${JSON.stringify(new URL("./release-cargo-upload.mjs", import.meta.url).href)};
  const options=JSON.parse(process.argv[1]); options.crate.bytes=Buffer.from(options.crate.bytes,"base64");
  options.getToken=()=>{process.send({phase:"credential"});return "local-probe-only";};
  const transport=await prepareCargoUpload(options); process.send({phase:"prepared"});
  process.on("message",async action=>{if(action==="publish"){try{await transport.publish(options.crate);}catch{process.send({phase:"upload-ended"});}}});`;
    for (const duringUpload of [false, true]) {
      const before = new Set(readdirSync(tmpdir()).filter((name) => name.startsWith("release-cargo-"))), putsBefore = captures.length;
      const worker = spawn(process.execPath, ["--input-type=module", "-e", workerSource, JSON.stringify(config)], { env: { PATH: "/usr/bin:/bin" }, stdio: ["ignore", "ignore", "pipe", "ipc"] });
      const messages = []; let diagnostic = "", exited = false, owned = [];
      worker.stderr.on("data", (data) => { diagnostic = (diagnostic + data).slice(0, 8192); });
      worker.on("message", (row) => messages.push(row)); worker.on("close", () => { exited = true; });
      try {
        await until(() => messages.some((row) => row.phase === "prepared") || exited, 120000);
        assert.equal(exited, false, diagnostic); assert.ok(messages.some((row) => row.phase === "prepared"));
        owned = readdirSync(tmpdir()).filter((name) => name.startsWith("release-cargo-") && !before.has(name)).map((name) => join(tmpdir(), name));
        assert.equal(owned.length, 1, "one owned temporary transport tree expected");
        if (duringUpload) { worker.send("publish"); await until(() => captures.length === putsBefore + 1 && messages.some((row) => row.phase === "credential")); }
        const children = descendants(worker.pid); assert.ok(children.length >= 3);
        worker.kill("SIGKILL");
        await until(() => exited && children.every((old) => { const now = processRecord(old.pid); return !now || now.start !== old.start || now.state === "Z"; }));
        const removed = owned.every((path) => !existsSync(path));
        rows.push({ name: duringUpload ? "parent-loss-during-upload" : "parent-loss-before-intent", stoppedDescendants: children.length, temporaryDirectoriesRemoved: removed, processExits: children.map((record) => ({ before: record, after: processRecord(record.pid) })), remainingTopLevel: owned.map((path) => existsSync(path) ? readdirSync(path) : []), credentialCalls: messages.filter((row) => row.phase === "credential").length, puts: captures.length - putsBefore, uploadOutcome: duringUpload ? "unconfirmed-localhost-capture" : "not-attempted" });
        assert.equal(rows.at(-1).credentialCalls, duringUpload ? 1 : 0); assert.equal(rows.at(-1).puts, duringUpload ? 1 : 0);
        if (duringUpload) assert.deepEqual(captures.at(-1), { sha256: config.crate.sha256, dummyAuthorizationMatched: true });
        assert.equal(removed, true, "parent loss left the owned temporary transport tree behind");
      } finally {
        if (!exited) worker.kill("SIGKILL");
        for (const path of owned) rmSync(path, { recursive: true, force: true });
      }
    }
    assert.equal(rows.length, 2);
    console.log(JSON.stringify({ status: "pass", metrics: { cases: rows.length, puts: captures.length }, rows, realRegistryPublication: false }, null, 2));
  } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); rmSync(root, { recursive: true, force: true }); }
}
main().catch((error) => { console.log(JSON.stringify({ status: "fail", rows, errors: [error.message], realRegistryPublication: false }, null, 2)); process.exitCode = 1; });
