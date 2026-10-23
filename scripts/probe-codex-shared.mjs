#!/usr/bin/env node
// Verify shared-root discovery using a disposable home and the native app-server protocol.
// Usage: node scripts/probe-codex-shared.mjs (requires codex; never invokes a model).
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { createInterface } from "node:readline";

const home = mkdtempSync(join(tmpdir(), "codex-shared-probe-"));
let child;
let timer;
try {
  const skill = join(home, ".agents", "skills", "shared-root-probe");
  mkdirSync(skill, { recursive: true });
  writeFileSync(join(skill, "SKILL.md"), "---\nname: shared-root-probe\ndescription: Probe shared-root skill discovery.\n---\nReturn the probe marker.\n");
  mkdirSync(join(home, ".codex"));
  const project = join(home, "project");
  mkdirSync(project);
  const version = execFileSync("codex", ["--version"], { encoding: "utf8" }).trim();
  child = spawn("codex", ["app-server"], {
    cwd: project,
    env: { ...process.env, HOME: home, USERPROFILE: home, CODEX_HOME: join(home, ".codex"), XDG_CONFIG_HOME: join(home, ".config") },
    stdio: ["pipe", "pipe", "pipe"],
  });
  let diagnostics = "";
  child.stderr.on("data", (chunk) => { diagnostics = (diagnostics + chunk).slice(-8192); });
  const pending = new Map();
  const lines = createInterface({ input: child.stdout });
  lines.on("line", (line) => {
    const message = JSON.parse(line);
    if (pending.has(message.id)) { pending.get(message.id).resolve(message); pending.delete(message.id); }
  });
  const fail = (error) => { for (const p of pending.values()) p.reject(error); pending.clear(); };
  child.on("error", fail);
  child.on("exit", (code) => fail(new Error(`app-server exited ${code}: ${diagnostics}`)));
  timer = setTimeout(() => { fail(new Error("app-server discovery timed out")); child.kill(); }, 30000);
  const rpc = (id, method, params) => new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    child.stdin.write(JSON.stringify({ id, method, params }) + "\n");
  });
  const init = await rpc(1, "initialize", { clientInfo: { name: "shared-root-probe", version: "1.0.0" } });
  if (init.error) throw new Error(JSON.stringify(init.error));
  child.stdin.write(JSON.stringify({ method: "initialized" }) + "\n");
  const result = await rpc(2, "skills/list", { cwds: [project], forceReload: true });
  if (result.error) throw new Error(JSON.stringify(result.error));
  const errors = result.result.data.flatMap((d) => d.errors);
  const found = result.result.data.flatMap((d) => d.skills).filter((s) => s.name.split(":").at(-1) === "shared-root-probe" && realpathSync(s.path) === realpathSync(join(skill, "SKILL.md")));
  const pass = !errors.length && found.length === 1;
  console.log(JSON.stringify({ status: pass ? "pass" : "fail", metrics: { sharedRootSkills: found.length, catalogErrors: errors.length }, version, protocol: "initialize → initialized → skills/list", isolated: true, observedSkillNames: result.result.data.flatMap((d) => d.skills).map((s) => s.name), errors }, null, 2));
  if (!pass) process.exitCode = 1;
} catch (error) {
  console.error(JSON.stringify({ status: "error", metrics: {}, errors: [error.message] }));
  process.exitCode = 2;
} finally {
  clearTimeout(timer);
  child?.kill();
  rmSync(home, { recursive: true, force: true });
}
