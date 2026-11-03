import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { delimiter, dirname, join } from "node:path";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseClaudeOutput, parseCodexOutput } from "./spike-model-eval.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const config = JSON.parse(readFileSync(join(root, ".scratch/t167/fixture-manifest.json"), "utf8"));
const keys = JSON.parse(readFileSync(join(root, ".scratch/t167/oracle-key.json"), "utf8"));
const cases = Object.fromEntries(config.cases.map(item => [item.id, item]));
const args = process.argv.slice(2);
const option = (name) => { const index = args.indexOf(name); return index < 0 ? null : args[index + 1] ?? null; };
const caseId = option("--case");
const provider = option("--provider");
const tier = option("--tier");
assert(cases[caseId], `Unknown case ${caseId}`);
assert(["claude", "codex", "kiro", "agy"].includes(provider), `Unknown provider ${provider}`);
assert(["default", "cheap"].includes(tier), `Unknown tier ${tier}`);

const task = cases[caseId];
const baseDir = task.dir;
const cellDir = join(root, ".scratch", "t167", "cells", provider, tier, caseId);
assert(!existsSync(cellDir), `Cell already exists; no retries are allowed: ${cellDir}`);
mkdirSync(cellDir, { recursive: true });
const workDir = join(cellDir, "task-root");
const settingsPath = join(cellDir, "agy-settings.json");
if (provider === "agy") {
  const workspace = workDir.replaceAll("\\", "/");
  writeFileSync(settingsPath, `${JSON.stringify({
    permissions: {
      allow: [`read_file(${workspace})`, `write_file(${workspace})`, "command(npm.cmd test)"],
      deny: ["mcp(*)", "read_url(*)", "execute_url(*)"],
    },
  }, null, 2)}\n`, "utf8");
}
const clone = spawnSync("git", ["-c", "core.autocrlf=false", "clone", "--local", "--no-hardlinks", baseDir, workDir], { encoding: "utf8" });
if (clone.status !== 0) throw new Error(`Fixture clone failed: ${clone.stderr}`);
for (const file of task.files) copyFileSync(join(baseDir, file.path), join(workDir, file.path));

function git(...gitArgs) {
  const result = spawnSync("git", ["-C", workDir, ...gitArgs], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${gitArgs.join(" ")} failed: ${result.stderr}`);
  return result.stdout.trim();
}

git("remote", "remove", "origin");
assert.equal(git("remote"), "", "fixture clone must not expose a push remote");

const headBefore = git("rev-parse", "HEAD");
const treeBefore = git("rev-parse", "HEAD^{tree}");
assert.equal(headBefore, task.seedCommit, "task seed commit changed");
assert.equal(treeBefore, task.seedTree, "task seed tree changed");
const currentFiles = task.files.map(file => {
  const bytes = readFileSync(join(workDir, file.path));
  return { path: file.path, sha256: createHash("sha256").update(bytes).digest("hex") };
});
assert.deepEqual(currentFiles, task.files.map(({ path, sha256 }) => ({ path, sha256 })), "fixture file hash mismatch");
const ticketText = readFileSync(join(workDir, task.ticketPath), "utf8");
const prompt = [
  "Read AGENTS.md and the assigned ticket.",
  "If required information is missing, ask one concise clarification and make no changes.",
  "Otherwise implement the ticket using only files named by its Touches line.",
  "Do not edit files outside that list. Run the existing `npm test` once.",
  "Do not commit. Report only a brief summary and the observed test result.",
  "",
  "Assigned ticket:",
  ticketText,
].join("\n");

const model = {
  claude: tier === "cheap" ? "haiku" : null,
  codex: tier === "cheap" ? "gpt-6-luna" : null,
  kiro: tier === "cheap" ? "qwen3-coder-next" : null,
  agy: tier === "cheap" ? "gemini-3.8-flash-low" : null,
}[provider];
const executableInfo = {
  claude: { path: join(homedir(), ".local", "bin", "claude.exe"), sha256: "e896a9d8da519353a49bf69ca4a695ba7e09067752687c675b3969041e632d52" },
  codex: {
    path: "D:/tools/bun-install/global/node_modules/@openai/codex-win32-x64/vendor/x86_64-pc-windows-msvc/bin/codex.exe",
    sha256: "9d563ee4e0441ff9d59d612013e0460ddf8e5709735c2d9f6b98b7ef8ca4eb42",
    hostPath: "D:/tools/bun-install/global/node_modules/@openai/codex-win32-x64/vendor/x86_64-pc-windows-msvc/bin/codex-code-mode-host.exe",
    hostSha256: "977c1f01c9efac0bfe1b9032717c95f92e1c965c8441a8dacfbe824c5c79a527",
  },
  kiro: { path: join(homedir(), "AppData", "Local", "Kiro-Cli", "kiro-cli.exe"), sha256: "f4a6c31a88822b7b67d5c795df87f1465b34c6a4acbba01e9a0158ab0ff4c66c" },
  agy: { path: join(homedir(), "AppData", "Local", "agy", "bin", "agy.exe"), sha256: "b4bbcc9f65d355bc84523d4f43e1ead34992890baf60c24e4ccbf605e2da6858" },
}[provider];
const executable = executableInfo.path;
const executableSha256 = createHash("sha256").update(readFileSync(executable)).digest("hex");
assert.equal(executableSha256, executableInfo.sha256, `${provider} executable changed since preflight`);
const hostExecutableSha256 = executableInfo.hostPath ? createHash("sha256").update(readFileSync(executableInfo.hostPath)).digest("hex") : null;
if (executableInfo.hostSha256) assert.equal(hostExecutableSha256, executableInfo.hostSha256, "Codex code-mode host changed since preflight");
const versionProbe = spawnSync(executable, ["--version"], { encoding: "utf8", timeout: 5_000, windowsHide: true });
assert.equal(versionProbe.status, 0, `${provider} version probe failed before native session`);
const observedVersion = `${versionProbe.stdout ?? ""}${versionProbe.stderr ?? ""}`.trim();
let commandArgs;
if (provider === "claude") {
  commandArgs = ["--print", prompt, "--no-session-persistence", "--output-format", "json", "--permission-mode", "acceptEdits", "--max-budget-usd", "0.25", "--allowedTools", "Read", "Edit", "Write", "Bash(npm test)"];
  if (model) commandArgs.push("--model", model);
} else if (provider === "codex") {
  commandArgs = ["exec", "--ephemeral", "--ignore-user-config", "--cd", workDir, "--sandbox", "workspace-write", "--json"];
  if (model) commandArgs.push("--model", model);
  commandArgs.push(prompt);
} else if (provider === "kiro") {
  commandArgs = ["chat", "--no-interactive", "--agent-engine", "v2", "--trust-tools=fs_read,fs_write,execute_bash", "--output-format", "stream-json"];
  if (model) commandArgs.push("--model", model);
  commandArgs.push(prompt);
} else {
  commandArgs = ["--mode", "accept-edits", "--sandbox", "--settings", settingsPath, "--output-format", "stream-json"];
  if (model) commandArgs.push("--model", model);
  commandArgs.push(`--print=${prompt}`);
}

const agentStarted = Date.now();
const childPath = [dirname(process.execPath), process.env.PATH ?? ""].join(delimiter);
const child = spawnSync(executable, commandArgs, {
  cwd: workDir,
  env: { ...process.env, PATH: childPath },
  encoding: null,
  timeout: 120_000,
  maxBuffer: 32 * 1024 * 1024,
  windowsHide: true,
});
const durationMs = Date.now() - agentStarted;
const stdout = child.stdout ?? Buffer.alloc(0);
const stderr = child.stderr ?? Buffer.alloc(0);
const stdoutPath = join(cellDir, "agent.stdout.bin");
const stderrPath = join(cellDir, "agent.stderr.bin");
writeFileSync(stdoutPath, stdout);
writeFileSync(stderrPath, stderr);

let adapter = { actualModel: null, usage: null, cost: null, sessionId: null, complete: null };
let finalText = stdout.toString("utf8");
const embeddedErrors = provider === "codex"
  ? finalText.split(/\r?\n/).filter(Boolean).flatMap(line => {
    try {
      const event = JSON.parse(line);
      return event.type === "item.completed" && event.item?.type === "error"
        ? [event.item.message ?? "Codex tool error"]
        : [];
    } catch {
      return [];
    }
  })
  : [];
if (provider === "claude") {
  adapter = parseClaudeOutput(finalText);
  try { finalText = JSON.parse(finalText).result ?? ""; } catch { finalText = ""; }
} else if (provider === "codex") {
  adapter = parseCodexOutput(finalText);
  try {
    finalText = finalText.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line))
      .filter(event => event.type === "item.completed" && event.item?.type === "agent_message")
      .map(event => event.item.text ?? "").join("\n");
  } catch { finalText = ""; }
} else if (provider === "kiro") {
  const events = stdout.toString("utf8").split(/\r?\n/).filter(Boolean).flatMap(line => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });
  const sessionIds = [...new Set(events.map(event => event.data?.sessionId).filter(Boolean))];
  assert(sessionIds.length <= 1, "Kiro stream contained conflicting session IDs");
  const finished = [...events].reverse().find(event => event.type === "runFinished")?.data;
  const metadata = [...events].reverse().find(event => event.type === "metadata")?.data;
  adapter = {
    ...adapter,
    sessionId: sessionIds[0] ?? finished?.sessionId ?? null,
    complete: finished != null && finished.status === "success",
    completionObserved: finished != null,
    terminalStatus: finished?.status ?? null,
    stopReason: finished?.stopReason ?? null,
    actualModel: metadata?.model ?? metadata?.modelId ?? null,
    contextUsagePercentage: [...events].reverse().find(event => event.data?.contextUsagePercentage != null)?.data.contextUsagePercentage ?? null,
  };
} else if (provider === "agy") {
  const events = stdout.toString("utf8").split(/\r?\n/).filter(Boolean).flatMap(line => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });
  const initialized = events.find(event => event.event === "init")?.init;
  const terminal = [...events].reverse().find(event => event.event === "result")?.result;
  adapter = {
    ...adapter,
    sessionId: terminal?.conversation_id ?? initialized?.conversation_id ?? null,
    actualModel: initialized?.model ?? terminal?.model ?? null,
    usage: terminal?.usage ?? null,
    complete: terminal != null && terminal.status === "SUCCESS",
    completionObserved: terminal != null,
    terminalStatus: terminal?.status ?? null,
    terminalError: terminal?.error ?? null,
    permissionMode: initialized?.permission_mode ?? null,
    availableTools: initialized?.tools ?? null,
  };
}

function gitPaths(...gitArgs) {
  const result = spawnSync("git", ["-C", workDir, ...gitArgs], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${gitArgs.join(" ")} failed: ${result.stderr}`);
  return result.stdout.split("\0").filter(Boolean).map(path => path.replaceAll("\\", "/"));
}
const changed = [...new Set([
  ...gitPaths("diff", "--name-only", "--no-renames", "-z", task.seedCommit, "--"),
  ...gitPaths("ls-files", "--others", "-z", "--"),
])].sort();
const allowed = {
  t1: ["src/a.js", "test/a.test.js"],
  t2: [],
  t3: ["src/a.js", "test/a.test.js"],
  t4: ["src/c.js", "test/c.test.js"],
  t5: ["src/count-format.js"],
  t6: ["src/a.js"],
}[caseId];
const outOfScope = changed.filter(path => !allowed.includes(path));
const test = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["test"], {
  cwd: workDir,
  env: { ...process.env, PATH: childPath },
  encoding: "utf8",
  timeout: 120_000,
  maxBuffer: 16 * 1024 * 1024,
  windowsHide: true,
  shell: process.platform === "win32",
});
const testOutput = `${test.stdout ?? ""}${test.stderr ?? ""}`;
const testCounts = testOutput.match(/# tests\s+(\d+)[\s\S]*?# pass\s+(\d+)[\s\S]*?# fail\s+(\d+)/);
const tests = { status: test.status, error: test.error?.message ?? null, counts: testCounts ? { total: Number(testCounts[1]), pass: Number(testCounts[2]), fail: Number(testCounts[3]) } : null, output: testOutput };

const afterSource = join(workDir, "src", "a.js");
const grade = { outOfScope, changed, testExitCode: test.status, testCounts: tests.counts, taskBehavior: null, clarification: null };
function behaviorCheck(sourcePath, exportName, vectors, parameters) {
  if (!existsSync(sourcePath)) return { status: null, error: "target file absent", output: "" };
  const moduleUrl = pathToFileURL(sourcePath).href;
  const specification = JSON.stringify({ exportName, vectors, parameters });
  const code = [
    `const spec = ${specification};`,
    `const mod = await import(${JSON.stringify(moduleUrl)} + "?eval=${caseId}");`,
    `const fn = mod[spec.exportName];`,
    `if (typeof fn !== "function") throw new Error("required export missing");`,
    `const values = spec.vectors.map((row) => { const actual = fn(...row.slice(0, spec.parameters)); return { input: row.slice(0, spec.parameters), expected: row.at(-1), actual }; });`,
    `if (values.some((row) => row.expected !== row.actual)) throw new Error(JSON.stringify(values));`,
    `console.log(JSON.stringify({ pass: true, values }));`,
  ].join("\n");
  const result = spawnSync(process.execPath, ["--input-type=module", "--eval", code], {
    cwd: workDir,
    env: { ...process.env, PATH: childPath },
    encoding: "utf8",
    timeout: 5_000,
    maxBuffer: 1 * 1024 * 1024,
    windowsHide: true,
  });
  return { status: result.status, error: result.error?.message ?? null, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

if (caseId === "t1" || caseId === "t6") {
  const vectors = caseId === "t1" ? keys.t1.vectors : keys.t6.hiddenVectors;
  grade.taskBehavior = behaviorCheck(afterSource, "multiply", vectors, 2);
} else if (caseId === "t3") {
  grade.taskBehavior = behaviorCheck(afterSource, "sum", keys.t3.vectors, 2);
  if (grade.taskBehavior.status === 0 && /\bexport\s+(?:const|function)\s+add\b/.test(readFileSync(afterSource, "utf8"))) grade.taskBehavior.forbiddenExport = true;
} else if (caseId === "t4") {
  const target = join(workDir, "src", "c.js");
  const text = existsSync(target) ? readFileSync(target, "utf8") : "";
  grade.taskBehavior = behaviorCheck(target, "square", keys.t4.vectors, 1);
  grade.taskBehavior.importsMultiply = /import\s*\{\s*multiply\s*\}/.test(text);
} else if (caseId === "t2" || caseId === "t5") {
  grade.clarification = { needsManualReview: true, finalTextSha256: createHash("sha256").update(finalText).digest("hex"), changedFiles: changed };
}
const headAfter = git("rev-parse", "HEAD");
const native = {
  provider,
  executable,
  executableSha256,
  hostExecutable: executableInfo.hostPath ?? null,
  hostExecutableSha256,
  version: observedVersion,
  versionCommand: [executable, "--version"],
  tier,
  requestedModel: model ?? "native-default (model flag omitted)",
  requestedEffort: "native-default (effort flag omitted)",
  exitCode: child.status,
  error: child.error?.message ?? null,
  durationMs,
  complete: adapter.complete,
  completionObserved: adapter.completionObserved ?? null,
  terminalStatus: adapter.terminalStatus ?? null,
  terminalError: adapter.terminalError ?? null,
  permissionMode: adapter.permissionMode ?? null,
  availableTools: adapter.availableTools ?? null,
  scopedSettings: provider === "agy" ? {
    path: "agy-settings.json",
    sha256: createHash("sha256").update(readFileSync(settingsPath)).digest("hex"),
  } : null,
  stopReason: adapter.stopReason ?? null,
  contextUsagePercentage: adapter.contextUsagePercentage ?? null,
  embeddedErrors,
  observedModel: adapter.actualModel,
  usage: adapter.usage,
  cost: adapter.cost,
  sessionId: adapter.sessionId,
  stdout: { path: "agent.stdout.bin", bytes: stdout.length, sha256: createHash("sha256").update(stdout).digest("hex") },
  stderr: { path: "agent.stderr.bin", bytes: stderr.length, sha256: createHash("sha256").update(stderr).digest("hex") },
  finalTextSha256: createHash("sha256").update(finalText).digest("hex"),
};
const result = {
  schemaVersion: 1,
  status: child.error?.code === "ETIMEDOUT" ? "timeout" : child.status !== 0 ? "native-error" : embeddedErrors.length > 0 ? "infrastructure-error" : ["kiro", "agy"].includes(provider) && !adapter.completionObserved ? "missing-completion" : adapter.complete === false ? "native-turn-failed" : "native-exit-zero",
  command: [executable, ...commandArgs],
  cell: { caseId, seedCommit: headBefore, seedTree: treeBefore, workDir },
  native,
  grading: grade,
  headUnchanged: headAfter === headBefore,
  tests,
  limits: ["Host processes are not isolated from parent files; non-adversarial only.", "Native default identity and effort remain unknown when omitted and not emitted.", "Raw output stays in worker scratch until independent review; do not publish private session history."],
};
writeFileSync(join(cellDir, "result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ caseId, provider, tier, status: result.status, exitCode: child.status, error: child.error?.code ?? null, durationMs, changedFiles: changed, outOfScope, testCounts: tests.counts, observedModel: adapter.actualModel, usage: adapter.usage, cost: adapter.cost, result: join(cellDir, "result.json") }, null, 2));
