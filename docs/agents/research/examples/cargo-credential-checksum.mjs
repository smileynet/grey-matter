#!/usr/bin/env node
// Exercise the real Cargo credential seam against a disposable localhost registry.
// Usage: node docs/agents/research/examples/cargo-credential-checksum.mjs
// Requires Cargo 1.99.1, rustc and Git; retains dummy-token evidence, never forwards uploads.
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const provider = fileURLToPath(new URL("../../../../scripts/release-cargo-credentials.mjs", import.meta.url));
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const rustString = (value) => {
  let hashes = "#";
  while (value.includes('"' + hashes)) hashes += "#";
  return `r${hashes}"${value}"${hashes}`;
};
async function main() {
  const providerSha256 = digest(readFileSync(provider));
  const root = mkdtempSync(join(tmpdir(), "Cargo checksum provider's probe "));
  const source = join(root, "source"), home = join(root, "cargo-home"), target = join(root, "target");
  for (const directory of [join(source, "src"), home, join(root, "home")]) mkdirSync(directory, { recursive: true });
  const calls = [], uploads = [];
  const server = createServer(async (request, response) => {
    calls.push({ method: request.method, path: request.url });
    if (request.method === "GET" && request.url === "/index/config.json") {
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({ api: `http://127.0.0.1:${server.address().port}`, dl: `http://127.0.0.1:${server.address().port}/download` }));
      return;
    }
    if (request.method === "PUT" && request.url === "/api/v1/crates/new") {
      const chunks = [];
      let received = 0;
      for await (const chunk of request) {
        received += chunk.length;
        if (received > 2 * 1024 * 1024) { request.destroy(); return; }
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks);
      const metadataEnd = body.length >= 8 ? 4 + body.readUInt32LE(0) : -1;
      if (metadataEnd < 4 || metadataEnd > body.length - 4 || metadataEnd + 4 + body.readUInt32LE(metadataEnd) !== body.length) {
        response.statusCode = 400; response.end("invalid capture envelope"); return;
      }
      const bytes = body.subarray(metadataEnd + 4);
      uploads.push({ sha256: digest(bytes), size: bytes.length, dummyAuthorizationMatched: request.headers.authorization === "local-probe-only" });
      writeFileSync(join(root, `upload-${uploads.length}.crate`), bytes);
      response.statusCode = 400;
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({ errors: [{ detail: "Local capture deliberately refused; nothing forwarded" }] }));
      return;
    }
    response.statusCode = 404; response.end("not found");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const index = `sparse+http://127.0.0.1:${server.address().port}/index/`;
  const policyPath = join(root, "sealed-policy.json");
  const launcher = join(root, process.platform === "win32" ? "provider-launcher.exe" : "provider-launcher");
  const clean = Object.fromEntries(["PATH", "SystemRoot", "WINDIR", "COMSPEC", "PATHEXT", "TMP", "TEMP", "RUSTUP_TOOLCHAIN"].filter((key) => process.env[key] !== undefined).map((key) => [key, process.env[key]]));
  const env = { ...clean, HOME: join(root, "home"), USERPROFILE: join(root, "home"), RUSTUP_HOME: process.env.RUSTUP_HOME ?? join(homedir(), ".rustup"), CARGO_HOME: home, CARGO_HTTP_PROXY: "", NO_PROXY: "127.0.0.1", RELEASE_CARGO_POLICY: policyPath, RELEASE_CARGO_TOKEN: "local-probe-only", GIT_CONFIG_GLOBAL: join(root, "empty-gitconfig"), GIT_CONFIG_NOSYSTEM: "1", GIT_NO_REPLACE_OBJECTS: "1" };
  writeFileSync(env.GIT_CONFIG_GLOBAL, "");
  writeFileSync(join(home, "config.toml"), `[registries.probe]\nindex = ${JSON.stringify(index)}\ncredential-provider = ${JSON.stringify([launcher])}\n`);
  // Cargo puts configured arguments in request JSON, so Node needs a native prefix launcher.
  writeFileSync(join(root, "provider_launcher.rs"), `
fn main() {
    let status = std::process::Command::new(${rustString(process.execPath)})
        .arg(${rustString(provider)})
        .args(std::env::args_os().skip(1))
        .status().expect("cannot launch fixture provider");
    std::process::exit(status.code().unwrap_or(1));
}
`);
  writeFileSync(join(source, "Cargo.toml"), '[package]\nname="tkt-checksum-fixture"\nversion="0.0.1"\nedition="2021"\npublish=["probe"]\ninclude=["/src/**","/Cargo.toml","/Cargo.lock"]\n');
  writeFileSync(join(source, "src/main.rs"), "fn main() {}\n");
  const policy = { name: "tkt-checksum-fixture", version: "0.0.1", sha256: "0".repeat(64), index };
  const setPolicy = (value) => writeFileSync(policyPath, JSON.stringify(value));
  setPolicy(policy);
  const command = (binary, args) => new Promise((resolve, reject) => {
    const child = spawn(binary, args, { cwd: source, env, stdio: ["ignore", "pipe", "pipe"], timeout: 30000 });
    let stdout = "", stderr = "";
    child.stdout.on("data", (data) => { stdout += data; });
    child.stderr.on("data", (data) => { stderr += data; });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
  const checked = async (binary, args) => {
    const result = await command(binary, args);
    if (result.code !== 0) throw new Error(`${binary} fixture command failed: ${result.stderr}`);
    return result;
  };
  try {
    const version = (await checked("cargo", ["--version"])).stdout.trim();
    if (!version.startsWith("cargo 1.99.1 ")) throw new Error("this source-audited probe requires Cargo 1.99.1");
    await checked("rustc", [join(root, "provider_launcher.rs"), "-o", launcher]);
    await checked("git", ["init"]);
    await checked("cargo", ["generate-lockfile", "--offline"]);
    await checked("git", ["add", "."]);
    await checked("git", ["-c", "user.name=Probe", "-c", "user.email=probe@example.invalid", "-c", `core.hooksPath=${join(root, "no-hooks")}`, "commit", "-m", "Fixture"]);
    await checked("cargo", ["package", "--registry", "probe", "--locked", "--no-verify", "--target-dir", target]);
    const sealed = readFileSync(join(target, "package/tkt-checksum-fixture-0.0.1.crate"));
    policy.sha256 = digest(sealed);
    writeFileSync(join(root, "sealed.crate"), sealed);
    const cases = [];
    const capture = async (name, changedPolicy, extra = []) => {
      setPolicy(changedPolicy);
      const before = uploads.length;
      const result = await command("cargo", ["publish", "--registry", "probe", "--locked", "--no-verify", "--target-dir", target, ...extra]);
      const captured = uploads.slice(before);
      const row = { name, cargoExit: result.code, puts: captured.length, matchesSeal: captured.length === 1 ? captured[0].sha256 === policy.sha256 : null, stderr: result.stderr };
      cases.push(row);
      writeFileSync(join(root, "cases.json"), JSON.stringify(cases, null, 2) + "\n");
      return row;
    };
    const exact = await capture("matching-seal", policy);
    if (exact.cargoExit !== 101 || exact.puts !== 1 || exact.matchesSeal !== true) throw new Error(`exact credential authorization did not capture the sealed bytes: ${exact.stderr}`);
    for (const [name, changedPolicy, diagnostic] of [
      ["wrong-checksum", { ...policy, sha256: "a".repeat(64) }, "checksum differs"],
      ["wrong-name", { ...policy, name: "different-fixture" }, "identity or checksum differs"],
      ["wrong-version", { ...policy, version: "0.0.2" }, "identity or checksum differs"],
      ["wrong-registry", { ...policy, index: index + "other/" }, "registry differs"],
    ]) {
      const row = await capture(name, changedPolicy);
      if (row.cargoExit !== 101 || row.puts !== 0 || !row.stderr.includes(diagnostic)) throw new Error(`credential refusal failed for ${name}`);
    }
    writeFileSync(join(source, "src/main.rs"), 'fn main() { println!("changed"); }\n');
    const mutated = await capture("changed-source-checksum-refusal", policy, ["--allow-dirty"]);
    if (mutated.cargoExit !== 101 || mutated.puts !== 0 || !mutated.stderr.includes("checksum differs")) throw new Error("changed package bypassed the checksum gate");
    // Deliberately bypass the provider to prove why the production wrapper must forbid --token.
    const bypass = await capture("cli-token-bypass-negative-control", policy, ["--allow-dirty", "--token", "local-probe-only"]);
    if (bypass.cargoExit !== 101 || bypass.puts !== 1 || bypass.matchesSeal !== false) throw new Error("CLI-token bypass control did not expose the documented boundary");
    if (!uploads.every((upload) => upload.dummyAuthorizationMatched)) throw new Error("capture did not use the isolated dummy credential");
    if (digest(readFileSync(provider)) !== providerSha256) throw new Error("provider source changed during the probe");
    const record = { status: "pass", cargoVersion: version, nodeVersion: process.version, platform: { os: process.platform, arch: process.arch }, providerSha256, launcherSourceSha256: digest(readFileSync(join(root, "provider_launcher.rs"))), launcherBinarySha256: digest(readFileSync(launcher)), root, index, sealedSha256: policy.sha256, cases, uploads, calls, realRegistryPublication: false, limits: ["Dependency-free localhost fixture, dummy credential only; no production upload adapter", "No OS egress filter; isolated Cargo config and fixture publish allowlist select only the loopback registry", "Provider alone cannot stop CLI-token bypass; the production wrapper must prohibit overrides", "No immutable source/output-inode boundary implemented or tested by this probe"] };
    writeFileSync(join(root, "result.json"), JSON.stringify(record, null, 2) + "\n");
    console.log(JSON.stringify(record, null, 2));
  } finally { await new Promise((resolve) => server.close(resolve)); }
}
main().catch((error) => { console.error(JSON.stringify({ status: "error", errors: [error.message] })); process.exitCode = 2; });
