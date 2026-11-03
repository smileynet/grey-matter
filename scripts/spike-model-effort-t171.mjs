import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir, homedir } from "node:os";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TASK_DIR = join(ROOT, "scripts", "fixtures", "model-effort-t171");
const PROTOCOL = join(ROOT, "docs", "agents", "research", "model-effort-t171-protocol.md");
const PRIVATE_DIR = join(ROOT, ".scratch", "t171", "preparation");
const TASK_HASHES = Object.freeze({
  diagnosis: "5d0e9c2d6b33c98e4a563182878303048c79bc65cb6a2ae2a2ee777ed2c5fdaa",
  design: "c0899593028456328b791f6fb40ec3498b0d39faae1fdbb0394c8e910e489b20",
});
const PROTOCOL_SHA256 = "835285b373d0db92d78fe58c1f331a06b1ed54c3877fad893f03f399a021fe7c";
const TASK_IDS = Object.freeze(["diagnosis", "design"]);
const EFFORTS = Object.freeze(["low", "medium", "high", "xhigh", "max"]);
const PROVIDERS = Object.freeze(["claude", "codex", "kiro"]);
const RUNNABLE_PROVIDERS = Object.freeze(["claude", "codex"]);
const BLOCKED_PROVIDER = "google";
const TIMEOUT_MS = 120_000;
const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;
const CLAUDE_CALL_CEILING_USD = "0.10";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const hashFile = (path) => sha256(readFileSync(path));
const canonical = (value) => `${JSON.stringify(value)}\n`;

const MODELS = Object.freeze({
  claude: "claude-opus-5-5",
  codex: "gpt-6.1-sol",
  kiro: "qwen3-coder-next",
});

const EXECUTABLES = Object.freeze({
  claude: () => join(homedir(), ".local", "bin", "claude.exe"),
  codex: () => "D:/tools/bun-install/global/node_modules/@openai/codex-win32-x64/vendor/x86_64-pc-windows-msvc/bin/codex.exe",
  kiro: () => join(process.env.LOCALAPPDATA ?? "", "Kiro-Cli", "kiro-cli.exe"),
});

const PINNED = Object.freeze({
  claude: "e896a9d8da519353a49bf69ca4a695ba7e09067752687c675b3969041e632d52",
  codex: "9d563ee4e0441ff9d59d612013e0460ddf8e5709735c2d9f6b98b7ef8ca4eb42",
  kiro: "f4a6c31a88822b7b67d5c795df87f1465b34c6a4acbba01e9a0158ab0ff4c66c",
});

function readTask(taskId) {
  if (!TASK_IDS.includes(taskId)) throw new Error(`Unknown fixture ${taskId}`);
  const bytes = readFileSync(join(TASK_DIR, `${taskId}.json`));
  if (sha256(bytes) !== TASK_HASHES[taskId]) throw new Error(`Frozen fixture changed: ${taskId}`);
  const task = JSON.parse(bytes.toString("utf8"));
  if (task.schemaVersion !== 1 || task.id !== taskId || typeof task.prompt !== "string" || !task.files || Object.values(task.files).some((value) => typeof value !== "string")) {
    throw new Error(`Malformed fixture: ${taskId}`);
  }
  return { ...task, sha256: TASK_HASHES[taskId] };
}

function buildPrompt(task) {
  return [
    "Read only the synthetic source files below and answer the task.",
    "Do not call tools, run commands, change settings, access the network, or rely on unstated facts.",
    "Return exactly one JSON object with the task's requested fields, without a Markdown fence.",
    "If the stated requirements conflict, identify the conflict instead of inventing an unstated guarantee.",
    "",
    task.prompt,
    "",
    ...Object.entries(task.files).flatMap(([path, text]) => [`--- FILE: ${path} ---`, text]),
  ].join("\n");
}

function buildArgv(provider, effort, prompt, cwd) {
  if (!PROVIDERS.includes(provider)) throw new Error(`Provider is not enabled: ${provider}`);
  if (!EFFORTS.includes(effort)) throw new Error(`Unsupported effort label: ${effort}`);
  if (!isAbsolute(cwd)) throw new Error("Cell cwd must be absolute");
  const model = MODELS[provider];
  if (!model) throw new Error(`No model selected for ${provider}`);
  if (provider === "claude") return [
    "--print", "--safe-mode", "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}',
    "--tools", "", "--disallowedTools", "mcp__*", "--no-session-persistence",
    "--output-format", "json", "--permission-mode", "plan", "--max-budget-usd",
    CLAUDE_CALL_CEILING_USD, "--model", model, "--effort", effort, prompt,
  ];
  if (provider === "codex") return [
    "exec", "--ephemeral", "--ignore-user-config", "--cd", cwd,
    "--skip-git-repo-check", "--sandbox", "read-only", "--json", "--model", model,
    "-c", `model_reasoning_effort="${effort}"`, prompt,
  ];
  return [
    "chat", "--no-interactive", "--agent-engine", "v2", "--trust-tools=",
    "--output-format", "stream-json", "--model", model, "--effort", effort, prompt,
  ];
}

function isEmptyRealDirectory(path, allowedRoot) {
  const rootReal = realpathSync(allowedRoot);
  const targetReal = realpathSync(path);
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) return false;
  if (targetReal !== rootReal && !targetReal.startsWith(`${rootReal}${sep}`)) return false;
  return readdirSync(path).length === 0;
}

function directoryIdentity(path, allowedRoot) {
  const rootReal = realpathSync(allowedRoot);
  const targetReal = realpathSync(path);
  const stat = lstatSync(path, { bigint: true });
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("Cell cwd is not a real directory");
  if (targetReal !== rootReal && !targetReal.startsWith(`${rootReal}${sep}`)) throw new Error("Cell cwd escaped its temporary root");
  if (stat.ino === 0n || stat.birthtimeNs === 0n) throw new Error("Filesystem does not expose a stable cell directory identity");
  return {
    realPath: targetReal,
    device: stat.dev.toString(),
    fileId: stat.ino.toString(),
    birthtimeNs: stat.birthtimeNs.toString(),
  };
}

function hasSameDirectoryIdentity(path, allowedRoot, expected) {
  try {
    return JSON.stringify(directoryIdentity(path, allowedRoot)) === JSON.stringify(expected);
  } catch {
    return false;
  }
}

function profileList() {
  return [
    ...RUNNABLE_PROVIDERS.flatMap((provider) => TASK_IDS.flatMap((taskId) => EFFORTS.map((effort) => ({
      cellId: `T171-${provider}-${taskId}-${effort}`,
      provider,
      taskId,
      effort,
      model: MODELS[provider],
      repeat: 1,
      state: "planned",
    })))),
    ...TASK_IDS.flatMap((taskId) => EFFORTS.map((effort) => ({
      cellId: `T171-kiro-${taskId}-${effort}`,
      provider: "kiro",
      taskId,
      effort,
      model: MODELS.kiro,
      repeat: 0,
      state: "held-model-effort-unverified",
    }))),
    ...TASK_IDS.flatMap((taskId) => EFFORTS.map((effort) => ({
      cellId: `T171-google-${taskId}-${effort}`,
      provider: BLOCKED_PROVIDER,
      taskId,
      effort,
      model: null,
      repeat: 0,
      state: "security-blocked-no-command",
    }))),
  ];
}

function makePlan({ privateRoot: privateRootArg, tempRoot: tempRootArg, tasks = TASK_IDS, providers = RUNNABLE_PROVIDERS, efforts = EFFORTS } = {}) {
  if (!Array.isArray(tasks) || tasks.some((task) => !TASK_IDS.includes(task)) || new Set(tasks).size !== tasks.length) throw new Error("Task set must contain unique frozen fixture IDs");
  if (!Array.isArray(providers) || new Set(providers).size !== providers.length) throw new Error("Provider set must be unique");
  if (!Array.isArray(efforts) || efforts.some((effort) => !EFFORTS.includes(effort)) || new Set(efforts).size !== efforts.length) throw new Error("Effort set must contain unique advertised levels");
  const privateRoot = resolve(privateRootArg ?? PRIVATE_DIR);
  mkdirSync(privateRoot, { recursive: true });
  const privateRootStat = lstatSync(privateRoot);
  if (!privateRootStat.isDirectory() || privateRootStat.isSymbolicLink()) throw new Error("Private evidence root is not a real directory");
  const tempRoot = resolve(tempRootArg ?? mkdtempSync(join(tmpdir(), "gm-effort-t171-")));
  const tempStat = lstatSync(tempRoot);
  if (!tempStat.isDirectory() || tempStat.isSymbolicLink()) throw new Error("Temporary work root is not a real directory");
  const tempBaseReal = realpathSync(tmpdir());
  const tempRootReal = realpathSync(tempRoot);
  if (!tempRootReal.startsWith(`${tempBaseReal}${sep}`)) throw new Error("Temporary work root must be under the operating system temp directory");
  if (readdirSync(tempRoot).length !== 0) throw new Error("Temporary work root must be empty before cell directories are created");
  const rows = [];
  for (const provider of providers) {
    if (!RUNNABLE_PROVIDERS.includes(provider)) throw new Error(`Provider is not cleared for this frozen sweep: ${provider}`);
    for (const taskId of tasks) {
      const task = readTask(taskId);
      const prompt = buildPrompt(task);
      for (const effort of efforts) {
        if (!EFFORTS.includes(effort)) throw new Error(`Effort not permitted: ${effort}`);
        const cellId = `T171-${provider}-${taskId}-${effort}`;
        const cwd = mkdtempSync(join(tempRoot, `cell-${randomUUID()}-`));
        if (!isEmptyRealDirectory(cwd, tempRoot)) throw new Error(`Cell cwd failed emptiness/bounds check: ${cellId}`);
        const cwdIdentity = directoryIdentity(cwd, tempRoot);
        const executable = EXECUTABLES[provider]();
        rows.push({
          cellId,
          provider,
          taskId,
          effort,
          requestedModel: MODELS[provider],
          taskSha256: task.sha256,
          promptSha256: sha256(Buffer.from(prompt, "utf8")),
          executable,
          executableSha256: PINNED[provider],
          cwd,
          cwdIdentity,
          argv: buildArgv(provider, effort, prompt, cwd),
          timeoutMs: TIMEOUT_MS,
          maxBufferBytes: MAX_OUTPUT_BYTES,
          repeat: 1,
        });
      }
    }
  }
  const body = {
    schemaVersion: 1,
    ticket: 171,
    protocolSha256: hashFile(PROTOCOL),
    controllerSha256: hashFile(fileURLToPath(import.meta.url)),
    privateRoot,
    tempRoot,
    cellCount: rows.length,
    cells: rows,
    privateInputHashes: {
      answerKeySha256: hashFile(join(PRIVATE_DIR, "answer-key.json")),
      rubricSha256: hashFile(join(PRIVATE_DIR, "grading-rubric.json")),
    },
    held: profileList().filter((cell) => cell.state === "held-model-effort-unverified"),
    blocked: profileList().filter((cell) => cell.provider === BLOCKED_PROVIDER),
    limits: { timeoutMs: TIMEOUT_MS, claudePerCallUsd: CLAUDE_CALL_CEILING_USD, claudeAggregateUsd: "1.00", retries: 0 },
  };
  return { ...body, planSha256: sha256(Buffer.from(canonical(body), "utf8")) };
}

function validateParentAuthorization(plan, cell, authorization) {
  if (!authorization || authorization.schemaVersion !== 1 || authorization.nativeLeaseReleased !== true) throw new Error("Missing explicit parent native-lease release");
  if (authorization.protocolSha256 !== plan.protocolSha256 || authorization.controllerSha256 !== plan.controllerSha256 || authorization.planSha256 !== plan.planSha256) throw new Error("Parent authorization does not bind this exact protocol, controller and prepared plan");
  if (!Array.isArray(authorization.cells) || !authorization.cells.includes(cell.cellId)) throw new Error("Cell not included in parent authorization");
  if (typeof authorization.criticCommit !== "string" || !/^[a-f0-9]{40,64}$/i.test(authorization.criticCommit)) throw new Error("Missing accepted critic commit");
  if (typeof authorization.leaseId !== "string" || !authorization.leaseId) throw new Error("Missing measurement lease ID");
}

function hashPreparedPlan(plan) {
  const { planSha256: _, ...body } = plan;
  return sha256(Buffer.from(canonical(body), "utf8"));
}

function childEnvironment(provider, effort) {
  const allowed = ["PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "LOCALAPPDATA", "APPDATA", "USERPROFILE", "HOMEDRIVE", "HOMEPATH", "COMSPEC", "PATHEXT"];
  const env = Object.fromEntries(allowed.filter((key) => process.env[key] !== undefined).map((key) => [key, process.env[key]]));
  if (provider === "claude") env.CLAUDE_CODE_EFFORT_LEVEL = effort;
  return env;
}

function readNativeOutput(provider, stdout, exitCode, error) {
  const text = Buffer.from(stdout ?? "").toString("utf8");
  const rawEvents = [];
  let parseFailures = 0;
  if (provider === "claude") {
    try { rawEvents.push(JSON.parse(text)); } catch { parseFailures++; }
  } else {
    for (const line of text.split(/\r?\n/).filter(Boolean)) {
      try { rawEvents.push(JSON.parse(line)); } catch { parseFailures++; }
    }
  }
  let finalText = "";
  let actualModel = null;
  let actualEffort = null;
  let usage = null;
  let cost = null;
  let terminalError = null;
  let usageLimit = false;
  let complete = false;
  for (const event of rawEvents) {
    actualModel ??= event.model ?? event.model_id ?? event.modelId ?? event.info?.model ?? null;
    actualEffort ??= event.effort ?? event.effortLevel ?? event.effort_level ?? event.info?.effort ?? null;
    usage ??= event.usage ?? event.modelUsage ?? event.context_usage ?? null;
    cost ??= event.total_cost_usd ?? event.cost ?? null;
    if (event.is_error === true || event.type === "error" || event.error || event.item?.type === "error") terminalError ??= event.error ?? event.message ?? event.item?.message ?? "native error event";
    if (typeof event.result === "string") { finalText = event.result; complete = event.is_error !== true; }
    for (const item of event.output ?? event.items ?? []) {
      if (item.type === "message" && item.role === "assistant") {
        for (const block of item.content ?? []) if (block.type === "output_text" || block.type === "text") finalText += block.text ?? "";
      }
    }
    const item = event.item ?? event.data ?? event;
    if (/rate.?limit|usage limit|quota exhausted|credits exhausted/i.test(`${event.type ?? ""} ${event.error ?? ""} ${event.message ?? ""}`)) usageLimit = true;
    if (["agent_message", "agent_message_chunk", "assistant_response"].includes(item.type) || ["assistant", "assistant_message"].includes(item.role)) {
      const chunk = item.content ?? item.text ?? item.message;
      if (typeof chunk === "string") finalText += chunk;
      else if (Array.isArray(chunk)) finalText += chunk.filter((part) => part.type === "text" || part.type === "output_text").map((part) => part.text ?? "").join("");
    }
    if (["turn.completed", "result", "session.completed", "message_stop"].includes(event.type) || event.subtype === "success") complete = true;
  }
  const status = usageLimit ? "usage-limit" : error?.code === "ETIMEDOUT" ? "timeout" : error ? "process-error" : exitCode !== 0 ? "native-error" : terminalError ? "embedded-infrastructure-error" : parseFailures && rawEvents.length === 0 ? "malformed-output" : !complete ? "missing-terminal-completion" : !finalText.trim() ? "empty-final-text" : "complete";
  return { status, complete: status === "complete", finalText, actualModel, actualEffort, usage, cost, terminalError, parseFailures, usageLimit };
}

function runPreparedCell({ plan, cellId, authorization, spawn = spawnSync }) {
  if (hashPreparedPlan(plan) !== plan.planSha256) throw new Error("Prepared plan changed after authorization");
  if (plan.controllerSha256 !== hashFile(fileURLToPath(import.meta.url)) || plan.protocolSha256 !== PROTOCOL_SHA256) throw new Error("Controller or protocol changed after authorization");
  if (plan.privateInputHashes.answerKeySha256 !== hashFile(join(PRIVATE_DIR, "answer-key.json")) || plan.privateInputHashes.rubricSha256 !== hashFile(join(PRIVATE_DIR, "grading-rubric.json"))) throw new Error("Private grading inputs changed after authorization");
  const cell = plan.cells.find((item) => item.cellId === cellId);
  if (!cell) throw new Error(`Cell not found in prepared plan: ${cellId}`);
  validateParentAuthorization(plan, cell, authorization);
  if (!isEmptyRealDirectory(cell.cwd, plan.tempRoot) || !hasSameDirectoryIdentity(cell.cwd, plan.tempRoot, cell.cwdIdentity)) throw new Error("The authorized working directory changed identity or is no longer empty");
  if (!existsSync(cell.executable) || hashFile(cell.executable) !== cell.executableSha256) throw new Error("Pinned provider executable changed since protocol review");
  if (cell.provider === "codex") {
    const sibling = join(dirname(cell.executable), "codex-code-mode-host.exe");
    const expected = "977c1f01c9efac0bfe1b9032717c95f92e1c965c8441a8dacfbe824c5c79a527";
    if (!existsSync(sibling) || hashFile(sibling) !== expected) throw new Error("Pinned Codex host changed since protocol review");
  }
  const privateEvidenceRoot = join(plan.privateRoot, "evidence");
  mkdirSync(privateEvidenceRoot, { recursive: true });
  const lockPath = join(privateEvidenceRoot, "native-lease.lock");
  const evidenceStat = lstatSync(privateEvidenceRoot);
  if (!evidenceStat.isDirectory() || evidenceStat.isSymbolicLink()) throw new Error("Private evidence root is not a real directory");
  const lockFd = openSync(lockPath, "wx");
  const cellRoot = join(privateEvidenceRoot, cell.cellId);
  try {
    mkdirSync(cellRoot);
    const reservation = join(cellRoot, "started.json");
    const reservationFd = openSync(reservation, "wx");
    writeFileSync(reservationFd, canonical({ cellId, planSha256: plan.planSha256, authorizationLeaseId: authorization.leaseId }));
    closeSync(reservationFd);
    const childEnv = childEnvironment(cell.provider, cell.effort);
    const startedAt = Date.now();
    if (!isEmptyRealDirectory(cell.cwd, plan.tempRoot) || !hasSameDirectoryIdentity(cell.cwd, plan.tempRoot, cell.cwdIdentity)) throw new Error("The authorized working directory changed identity or is no longer empty");
    const result = spawn(cell.executable, cell.argv, {
      cwd: cell.cwd,
      env: childEnv,
      encoding: null,
      timeout: cell.timeoutMs,
      maxBuffer: cell.maxBufferBytes,
      windowsHide: true,
      shell: false,
    });
    const elapsedMs = Date.now() - startedAt;
    const stdout = Buffer.from(result.stdout ?? "");
    const stderr = Buffer.from(result.stderr ?? "");
    const outcome = readNativeOutput(cell.provider, stdout, result.status, result.error);
    writeFileSync(join(cellRoot, "agent.stdout.bin"), stdout, { flag: "wx" });
    writeFileSync(join(cellRoot, "agent.stderr.bin"), stderr, { flag: "wx" });
    writeFileSync(join(cellRoot, "final-response.txt"), outcome.finalText, { flag: "wx" });
    const receipt = {
    schemaVersion: 1,
    cellId,
    taskId: cell.taskId,
    requestedModel: cell.requestedModel,
    requestedEffort: cell.effort,
    actualModel: outcome.actualModel,
    actualModelUnreported: outcome.actualModel === null,
    modelMatch: outcome.actualModel === null ? null : outcome.actualModel === cell.requestedModel,
    actualEffort: outcome.actualEffort,
    actualEffortUnreported: outcome.actualEffort === null,
    effortMatch: outcome.actualEffort === null ? null : outcome.actualEffort === cell.effort,
    nativeStatus: outcome.status,
    completionObserved: outcome.complete,
    nativeExitCode: result.status,
    processError: result.error?.message ?? null,
    elapsedMs,
    timeoutMs: cell.timeoutMs,
    usage: outcome.usage,
    providerReportedCost: outcome.cost,
    terminalError: outcome.terminalError,
    outputParseFailures: outcome.parseFailures,
    stdout: { file: "agent.stdout.bin", bytes: stdout.length, sha256: sha256(stdout) },
    stderr: { file: "agent.stderr.bin", bytes: stderr.length, sha256: sha256(stderr) },
    finalResponseSha256: sha256(Buffer.from(outcome.finalText, "utf8")),
    authorization: { planSha256: plan.planSha256, controllerSha256: plan.controllerSha256, protocolSha256: plan.protocolSha256, criticCommit: authorization.criticCommit, leaseId: authorization.leaseId },
    };
    writeFileSync(join(cellRoot, "receipt.json"), canonical(receipt), { flag: "wx" });
    return receipt;
  } finally {
    closeSync(lockFd);
    rmSync(lockPath, { force: true });
  }
}

function prepare(options = {}) {
  const plan = makePlan(options);
  const outputPath = join(options.manifestDir ?? PRIVATE_DIR, "prepared-plan.json");
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, canonical(plan), { flag: "wx" });
  return { planPath: outputPath, planSha256: plan.planSha256, controllerSha256: plan.controllerSha256, protocolSha256: plan.protocolSha256, cells: plan.cellCount, heldKiro: plan.held.length, blockedGoogle: plan.blocked.length };
}

function cli(argv) {
  if (argv[0] === "plan") {
    process.stdout.write(`${JSON.stringify({ protocolSha256: hashFile(PROTOCOL), controllerSha256: hashFile(fileURLToPath(import.meta.url)), cells: profileList() }, null, 2)}\n`);
    return;
  }
  if (argv[0] === "prepare") {
    const result = prepare();
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  if (argv[0] === "run") {
    throw new Error("Run authorization is disabled until the parent installs a reviewed authorization receipt and explicitly releases the native lease");
  }
  throw new Error("Usage: node scripts/spike-model-effort-t171.mjs plan|prepare|run");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { cli(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}

export {
  BLOCKED_PROVIDER,
  EFFORTS,
  MAX_OUTPUT_BYTES,
  MODELS,
  RUNNABLE_PROVIDERS,
  PROTOCOL_SHA256,
  TASK_HASHES,
  TASK_IDS,
  TIMEOUT_MS,
  buildArgv,
  buildPrompt,
  childEnvironment,
  directoryIdentity,
  hasSameDirectoryIdentity,
  hashPreparedPlan,
  makePlan,
  profileList,
  readNativeOutput,
  readTask,
  runPreparedCell,
  validateParentAuthorization,
};
