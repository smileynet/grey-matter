#!/usr/bin/env node
// Capture native host policy at a loopback endpoint; no model or real credentials are used.
// Usage: node scripts/probe-invocation-policy.mjs codex|claude|agy (macOS, requires sandbox-exec).
import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir, platform } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const host = process.argv[2];
if (!["codex", "claude", "agy"].includes(host) || platform() !== "darwin") {
  console.error(JSON.stringify({ status: "error", metrics: {}, errors: ["usage: probe-invocation-policy.mjs codex|claude|agy; macOS network sandbox required"] }));
  process.exit(2);
}
const home = mkdtempSync(join(tmpdir(), `${host}-policy-`));
const captures = [];
const server = createServer((request, response) => {
  let body = "";
  request.on("data", (chunk) => { body += chunk; });
  request.on("end", () => {
    captures.push({ path: request.url, body });
    // A terminal rejection exposes constructed context without permitting tool execution.
    response.writeHead(400, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: { code: 400, message: "local policy capture complete", status: "INVALID_ARGUMENT", type: "invalid_request_error" } }));
  });
});
const put = (path, text) => {
  const parts = path.split("/");
  parts.pop();
  mkdirSync(join(home, ...parts), { recursive: true });
  writeFileSync(join(home, path), text);
};
const profile = '(version 1)(allow default)(deny network*)(allow network-outbound (remote ip "localhost:*"))(allow network-inbound (local ip "localhost:*"))';
const env = { PATH: process.env.PATH, HOME: home, USERPROFILE: home, CODEX_HOME: join(home, ".codex"), XDG_CONFIG_HOME: join(home, ".config") };
const project = join(home, "project");
mkdirSync(project);
let child;
const run = (args) => new Promise((resolve, reject) => {
  child = spawn("/usr/bin/sandbox-exec", ["-p", profile, host, ...args], { cwd: project, env, stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "", stderr = "";
  const timer = setTimeout(() => { child.kill(); reject(new Error(`${host} policy probe timed out`)); }, 25000);
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  child.on("error", (error) => { clearTimeout(timer); reject(error); });
  child.on("close", (code) => { clearTimeout(timer); resolve({ code, stdout, stderr }); });
});
try {
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const versionResult = await run(["--version"]);
  if (versionResult.code !== 0) throw new Error(`host version unavailable: ${versionResult.stderr}`);
  const version = versionResult.stdout.trim();
  const root = host === "agy" ? ".gemini/config/plugins/policy-probe/skills" : "plugin/skills";
  for (const [name, human] of [["probe-open", false], ["probe-human", true]]) {
    put(`${root}/${name}/SKILL.md`, `---\nname: ${name}\ndescription: Unique ${name} policy catalog marker.\n${host === "codex" ? "" : `disable-model-invocation: ${human}\n`}---\nBODY_MARKER_${name}\n`);
    if (host === "codex") put(`${root}/${name}/agents/openai.yaml`, `policy:\n  allow_implicit_invocation: ${!human}\n`);
  }
  if (host === "agy") {
    put(".gemini/config/plugins/policy-probe/plugin.json", '{"name":"policy-probe","version":"1.0.0"}');
    put(".gemini/antigravity-cli/settings.json", '{"modelProvider":"gemini"}');
    env.GEMINI_API_KEY = "policy-probe-dummy-not-a-real-key";
    env.GOOGLE_GEMINI_BASE_URL = base;
  } else if (host === "claude") {
    put("plugin/.claude-plugin/plugin.json", '{"name":"policy-probe","version":"1.0.0"}');
    env.CLAUDE_CONFIG_DIR = join(home, ".claude");
    env.ANTHROPIC_API_KEY = "policy-probe-dummy-not-a-real-key";
    env.ANTHROPIC_BASE_URL = base;
    env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = "1";
    env.DISABLE_UPDATES = "1";
  } else {
    put(".codex/config.toml", `model = "probe"\nmodel_provider = "capture"\n[model_providers.capture]\nname = "Local capture"\nbase_url = "${base}/v1"\nwire_api = "responses"\nrequires_openai_auth = false\nsupports_websockets = false\nrequest_max_retries = 0\nstream_max_retries = 0\n`);
    put("plugin/.codex-plugin/plugin.json", '{"name":"policy-probe","version":"1.0.0","description":"Isolated invocation policy controls","skills":"./skills/"}');
    put("plugin/.agents/plugins/marketplace.json", JSON.stringify({ name: "policy-probe", plugins: [{ name: "policy-probe", source: { source: "local", path: "./" }, policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" } }] }));
    for (const args of [["plugin", "marketplace", "add", join(home, "plugin"), "--json"], ["plugin", "add", "policy-probe@policy-probe", "--json"]]) {
      const result = await run(args);
      if (result.code !== 0) throw new Error(`isolated Codex plugin install failed: ${result.stderr}`);
    }
  }
  const cases = [];
  const invocationArgs = (prompt) => host === "agy" ? ["--print-timeout", "15s", "--output-format", "json", "--print", prompt]
    : host === "claude" ? ["--plugin-dir", join(home, "plugin"), "--output-format", "json", "--print", prompt]
    : ["exec", "--skip-git-repo-check", "--sandbox", "read-only", "--json", prompt];
  const prompts = ["Describe the available workflows.", host === "codex" ? "$policy-probe:probe-human" : "/policy-probe:probe-human"];
  for (const [index, prompt] of prompts.entries()) {
    const before = captures.length;
    const result = await run(invocationArgs(prompt));
    const requests = captures.slice(before);
    const bodies = requests.map((r) => r.body).join("\n");
    const openCatalog = bodies.includes("Unique probe-open");
    const humanCatalog = bodies.includes("Unique probe-human");
    const humanBody = bodies.includes("BODY_MARKER_probe-human");
    const pass = requests.length > 0 && openCatalog && (index === 0 ? !humanCatalog && !humanBody : humanBody);
    cases.push({ case: index === 0 ? "implicit-context" : "explicit-human-expansion", pass, requests: requests.length, paths: requests.map((r) => r.path), cliExit: result.code, openCatalog, humanCatalog, humanBody });
  }
  let catalog;
  if (host === "agy") {
    const result = await run(["--output-format", "json", "--print", "/skills"]);
    if (result.code !== 0) throw new Error(`read-only catalog failed: ${result.stderr}`);
    catalog = JSON.parse(result.stdout).command.data.skills.filter((s) => s.plugin === "policy-probe").map((s) => ({ name: s.name, modelInvocable: s.model_invocable }));
    if (catalog.length !== 2 || !catalog.some((s) => s.name.endsWith(":probe-human") && s.modelInvocable === false) || !catalog.some((s) => s.name.endsWith(":probe-open") && s.modelInvocable === true)) throw new Error("catalog policy controls did not match");
  }
  // Remove the policy to prove the earlier omission was caused by the gate itself.
  put(`${root}/probe-human/SKILL.md`, "---\nname: probe-human\ndescription: Unique probe-human policy catalog marker.\n---\nBODY_MARKER_probe-human\n");
  if (host === "codex") {
    put(`${root}/probe-human/agents/openai.yaml`, "policy:\n  allow_implicit_invocation: true\n");
    const refresh = await run(["plugin", "add", "policy-probe@policy-probe", "--json"]);
    if (refresh.code !== 0) throw new Error(`isolated Codex policy refresh failed: ${refresh.stderr}`);
  }
  const before = captures.length;
  const control = await run(invocationArgs("Describe the available workflows."));
  const requests = captures.slice(before);
  const humanCatalog = requests.some((r) => r.body.includes("Unique probe-human"));
  cases.push({ case: "removed-policy-control", pass: humanCatalog, requests: requests.length, cliExit: control.code, humanCatalog });
  const pass = cases.every((c) => c.pass);
  const probeSha256 = createHash("sha256").update(readFileSync(new URL(import.meta.url))).digest("hex");
  console.log(JSON.stringify({ status: pass ? "pass" : "fail", metrics: { cases: cases.length, passed: cases.filter((c) => c.pass).length }, host, version, probeSha256, isolated: true, network: "loopback-only macOS sandbox", modelCalls: 0, cases, catalog, errors: pass ? [] : ["native policy context or explicit expansion did not match"] }, null, 2));
  if (!pass) process.exitCode = 1;
} catch (error) {
  console.error(JSON.stringify({ status: "error", metrics: {}, errors: [error.message] }));
  process.exitCode = 2;
} finally {
  child?.kill();
  await new Promise((resolve) => server.close(resolve));
  rmSync(home, { recursive: true, force: true });
}
