import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  fstatSync,
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
const PROTOCOL_SHA256 = "65260b7b6466dab98a0496619d8b1734bcb7f2e52bcf0364943f1382200d34c0";
const TASK_IDS = Object.freeze(["diagnosis", "design"]);
const EFFORTS = Object.freeze(["low", "medium", "high", "xhigh", "max"]);
const PROVIDERS = Object.freeze(["claude", "codex", "kiro"]);
const RUNNABLE_PROVIDERS = Object.freeze(["claude", "codex"]);
const BLOCKED_PROVIDER = "google";
const TIMEOUT_MS = 120_000;
const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;
const MAX_PLAN_BYTES = 16 * 1024 * 1024;
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
const PINNED_CODEX_HOST_SHA256 = "977c1f01c9efac0bfe1b9032717c95f92e1c965c8441a8dacbfe824c5c79a527";

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

function validatePrivateInputHashes(privateInputHashes) {
  if (!privateInputHashes || !/^[a-f0-9]{64}$/.test(privateInputHashes.answerKeySha256 ?? "") || !/^[a-f0-9]{64}$/.test(privateInputHashes.rubricSha256 ?? "")) throw new Error("Private answer-key and rubric hashes must be explicitly supplied");
  return { answerKeySha256: privateInputHashes.answerKeySha256, rubricSha256: privateInputHashes.rubricSha256 };
}

function hashPrivateInputFiles() {
  return {
    answerKeySha256: hashFile(join(PRIVATE_DIR, "answer-key.json")),
    rubricSha256: hashFile(join(PRIVATE_DIR, "grading-rubric.json")),
  };
}

function makePlan({ privateRoot: privateRootArg, tempRoot: tempRootArg, privateInputHashes, tasks = TASK_IDS, providers = RUNNABLE_PROVIDERS, efforts = EFFORTS } = {}) {
  if (!Array.isArray(tasks) || tasks.some((task) => !TASK_IDS.includes(task)) || new Set(tasks).size !== tasks.length) throw new Error("Task set must contain unique frozen fixture IDs");
  if (!Array.isArray(providers) || new Set(providers).size !== providers.length) throw new Error("Provider set must be unique");
  if (!Array.isArray(efforts) || efforts.some((effort) => !EFFORTS.includes(effort)) || new Set(efforts).size !== efforts.length) throw new Error("Effort set must contain unique advertised levels");
  const privateRoot = resolve(privateRootArg ?? PRIVATE_DIR);
  mkdirSync(privateRoot, { recursive: true });
  const privateRootStat = lstatSync(privateRoot);
  if (!privateRootStat.isDirectory() || privateRootStat.isSymbolicLink()) throw new Error("Private evidence root is not a real directory");
  const privateInputs = validatePrivateInputHashes(privateInputHashes);
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
    privateInputHashes: privateInputs,
    held: profileList().filter((cell) => cell.state === "held-model-effort-unverified"),
    blocked: profileList().filter((cell) => cell.provider === BLOCKED_PROVIDER),
    limits: { timeoutMs: TIMEOUT_MS, claudePerCallUsd: CLAUDE_CALL_CEILING_USD, claudeAggregateUsd: "1.00", retries: 0 },
  };
  return { ...body, planSha256: sha256(Buffer.from(canonical(body), "utf8")) };
}

function hashPreparedPlan(plan) {
  const { planSha256: _, ...body } = plan;
  return sha256(Buffer.from(canonical(body), "utf8"));
}

function assertKeys(value, keys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join("\n") !== [...keys].sort().join("\n")) throw new Error(`${label} has an invalid shape`);
}

function readCanonicalJsonFile(path, allowedRoot, label) {
  if (!isAbsolute(path)) throw new Error(`${label} path must be absolute`);
  const rootStat = lstatSync(allowedRoot);
  const fileStat = lstatSync(path, { bigint: true });
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink() || !fileStat.isFile() || fileStat.isSymbolicLink()) throw new Error(`${label} must be a regular file under a real private directory`);
  const rootReal = realpathSync(allowedRoot);
  const fileReal = realpathSync(path);
  if (!fileReal.startsWith(`${rootReal}${sep}`)) throw new Error(`${label} escapes its private root`);
  if (fileStat.size > BigInt(MAX_PLAN_BYTES)) throw new Error(`${label} exceeds the byte limit`);
  const fd = openSync(path, "r");
  let bytes;
  try {
    const openedStat = fstatSync(fd, { bigint: true });
    if (openedStat.dev !== fileStat.dev || openedStat.ino !== fileStat.ino || openedStat.birthtimeNs !== fileStat.birthtimeNs) throw new Error(`${label} changed while opening`);
    bytes = readFileSync(fd);
    const currentStat = lstatSync(path, { bigint: true });
    if (currentStat.dev !== openedStat.dev || currentStat.ino !== openedStat.ino || currentStat.birthtimeNs !== openedStat.birthtimeNs) throw new Error(`${label} changed while reading`);
  } finally {
    closeSync(fd);
  }
  if (bytes.length > MAX_PLAN_BYTES) throw new Error(`${label} exceeds the byte limit`);
  const text = bytes.toString("utf8");
  const value = JSON.parse(text);
  if (canonical(value) !== text) throw new Error(`${label} is not canonical JSON`);
  return { bytes, value };
}

function validatePreparedPlan(plan, privateRoot) {
  assertKeys(plan, ["schemaVersion", "ticket", "protocolSha256", "controllerSha256", "privateRoot", "tempRoot", "cellCount", "cells", "privateInputHashes", "held", "blocked", "limits", "planSha256"], "Prepared plan");
  if (plan.schemaVersion !== 1 || plan.ticket !== 171 || plan.planSha256 !== hashPreparedPlan(plan)) throw new Error("Prepared plan digest or identity is invalid");
  if (plan.protocolSha256 !== PROTOCOL_SHA256 || hashFile(PROTOCOL) !== plan.protocolSha256 || plan.controllerSha256 !== hashFile(fileURLToPath(import.meta.url))) throw new Error("Prepared plan source hashes are stale");
  validatePrivateInputHashes(plan.privateInputHashes);
  if (realpathSync(plan.privateRoot) !== realpathSync(privateRoot)) throw new Error("Prepared plan does not bind the authorization directory");
  const tempRoot = realpathSync(plan.tempRoot);
  const tempBase = realpathSync(tmpdir());
  const tempStat = lstatSync(plan.tempRoot);
  if (!tempStat.isDirectory() || tempStat.isSymbolicLink() || !tempRoot.startsWith(`${tempBase}${sep}`)) throw new Error("Prepared plan temporary root is not a real directory under the operating system temp directory");
  if (!Array.isArray(plan.cells) || plan.cellCount !== plan.cells.length || plan.cells.length !== RUNNABLE_PROVIDERS.length * TASK_IDS.length * EFFORTS.length) throw new Error("Prepared plan cell count is invalid");
  const expectedProfiles = profileList().filter((row) => row.state === "planned");
  const seenIdentities = new Set();
  const seenPaths = new Set();
  for (const [index, cell] of plan.cells.entries()) {
    const profile = expectedProfiles[index];
    assertKeys(cell, ["cellId", "provider", "taskId", "effort", "requestedModel", "taskSha256", "promptSha256", "executable", "executableSha256", "cwd", "cwdIdentity", "argv", "timeoutMs", "maxBufferBytes", "repeat"], "Prepared cell");
    if (cell.cellId !== profile.cellId || cell.provider !== profile.provider || cell.taskId !== profile.taskId || cell.effort !== profile.effort || cell.requestedModel !== profile.model || cell.repeat !== 1) throw new Error("Prepared cell differs from the frozen matrix");
    const task = readTask(cell.taskId);
    const prompt = buildPrompt(task);
    if (cell.taskSha256 !== task.sha256 || cell.promptSha256 !== sha256(Buffer.from(prompt, "utf8")) || cell.executable !== EXECUTABLES[cell.provider]() || cell.executableSha256 !== PINNED[cell.provider] || JSON.stringify(cell.argv) !== JSON.stringify(buildArgv(cell.provider, cell.effort, prompt, cell.cwd))) throw new Error("Prepared cell inputs or argv differ from the frozen protocol");
    if (!isAbsolute(cell.cwd) || cell.timeoutMs !== TIMEOUT_MS || cell.maxBufferBytes !== MAX_OUTPUT_BYTES) throw new Error("Prepared cell path or execution caps are invalid");
    assertKeys(cell.cwdIdentity, ["realPath", "device", "fileId", "birthtimeNs"], "Prepared cwd identity");
    const cwdReal = realpathSync(cell.cwd);
    const cwdStat = lstatSync(cell.cwd);
    if (!cwdStat.isDirectory() || cwdStat.isSymbolicLink() || (cwdReal !== tempRoot && !cwdReal.startsWith(`${tempRoot}${sep}`)) || cell.cwdIdentity.realPath !== cwdReal || !cell.cwdIdentity.device || !cell.cwdIdentity.fileId || cell.cwdIdentity.fileId === "0" || !cell.cwdIdentity.birthtimeNs || cell.cwdIdentity.birthtimeNs === "0") throw new Error("Prepared cwd identity or containment is invalid");
    const identityKey = `${cell.cwdIdentity.device}:${cell.cwdIdentity.fileId}:${cell.cwdIdentity.birthtimeNs}`;
    if (seenPaths.has(cell.cwd) || seenIdentities.has(identityKey)) throw new Error("Prepared working directories must have unique identities");
    seenPaths.add(cell.cwd);
    seenIdentities.add(identityKey);
  }
  if (JSON.stringify(plan.held) !== JSON.stringify(profileList().filter((row) => row.state === "held-model-effort-unverified")) || JSON.stringify(plan.blocked) !== JSON.stringify(profileList().filter((row) => row.state === "security-blocked-no-command"))) throw new Error("Prepared held or blocked matrix changed");
  const expectedLimits = { timeoutMs: TIMEOUT_MS, claudePerCallUsd: CLAUDE_CALL_CEILING_USD, claudeAggregateUsd: "1.00", retries: 0 };
  if (JSON.stringify(plan.limits) !== JSON.stringify(expectedLimits)) throw new Error("Prepared execution caps changed");
}

function validateParentAuthorization(plan, cell, authorization, planBytesSha256) {
  assertKeys(authorization, ["schemaVersion", "nativeLeaseReleased", "protocolSha256", "controllerSha256", "planSha256", "planBytesSha256", "answerKeySha256", "rubricSha256", "limits", "cells", "criticCommit", "leaseId"], "Parent authorization");
  if (authorization.schemaVersion !== 1 || authorization.nativeLeaseReleased !== true) throw new Error("Missing explicit parent native-lease release");
  if (authorization.protocolSha256 !== plan.protocolSha256 || authorization.controllerSha256 !== plan.controllerSha256 || authorization.planSha256 !== plan.planSha256 || authorization.planBytesSha256 !== planBytesSha256) throw new Error("Parent authorization does not bind these exact source and plan bytes");
  if (authorization.answerKeySha256 !== plan.privateInputHashes.answerKeySha256 || authorization.rubricSha256 !== plan.privateInputHashes.rubricSha256) throw new Error("Parent authorization does not bind the private grading inputs");
  if (JSON.stringify(authorization.limits) !== JSON.stringify(plan.limits)) throw new Error("Parent authorization does not bind the frozen execution caps");
  const plannedCellIds = plan.cells.map((row) => row.cellId);
  if (!Array.isArray(authorization.cells) || new Set(authorization.cells).size !== authorization.cells.length || authorization.cells.some((id) => !plannedCellIds.includes(id)) || !authorization.cells.includes(cell.cellId)) throw new Error("Cell not included in parent authorization");
  if (typeof authorization.criticCommit !== "string" || !/^[a-f0-9]{40,64}$/i.test(authorization.criticCommit)) throw new Error("Missing accepted critic commit");
  if (typeof authorization.leaseId !== "string" || !authorization.leaseId) throw new Error("Missing measurement lease ID");
}

function verifyHashPinnedFile(path, expectedHash, label) {
  if (!existsSync(path) || hashFile(path) !== expectedHash) throw new Error(`${label} changed since protocol review`);
}

function verifyPinnedExecutable(cell) {
  verifyHashPinnedFile(cell.executable, PINNED[cell.provider], "Pinned provider executable");
  if (cell.provider === "codex") {
    const sibling = join(dirname(cell.executable), "codex-code-mode-host.exe");
    verifyHashPinnedFile(sibling, PINNED_CODEX_HOST_SHA256, "Pinned Codex host");
  }
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

function runPreparedCell({ plan, cellId, authorization, planBytesSha256, spawn = spawnSync, verifyExecutable = verifyPinnedExecutable }) {
  validatePreparedPlan(plan, plan.privateRoot);
  if (hashPreparedPlan(plan) !== plan.planSha256) throw new Error("Prepared plan changed after authorization");
  if (plan.controllerSha256 !== hashFile(fileURLToPath(import.meta.url)) || plan.protocolSha256 !== PROTOCOL_SHA256) throw new Error("Controller or protocol changed after authorization");
  const cell = plan.cells.find((item) => item.cellId === cellId);
  if (!cell) throw new Error(`Cell not found in prepared plan: ${cellId}`);
  validateParentAuthorization(plan, cell, authorization, planBytesSha256);
  if (!isEmptyRealDirectory(cell.cwd, plan.tempRoot) || !hasSameDirectoryIdentity(cell.cwd, plan.tempRoot, cell.cwdIdentity)) throw new Error("The authorized working directory changed identity or is no longer empty");
  verifyExecutable(cell);
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

function executePersistedPlan({ planPath, authorizationPath, cellId, privateRoot = PRIVATE_DIR, spawn = spawnSync, readPrivateInputs = hashPrivateInputFiles, verifyExecutable = verifyPinnedExecutable }) {
  const { bytes: planBytes, value: plan } = readCanonicalJsonFile(planPath, privateRoot, "Prepared plan");
  const { value: authorization } = readCanonicalJsonFile(authorizationPath, privateRoot, "Parent authorization");
  validatePreparedPlan(plan, privateRoot);
  const actualPrivateInputs = validatePrivateInputHashes(readPrivateInputs());
  if (JSON.stringify(actualPrivateInputs) !== JSON.stringify(plan.privateInputHashes)) throw new Error("Private answer-key or grading rubric changed after plan preparation");
  const cell = plan.cells.find((item) => item.cellId === cellId);
  if (!cell) throw new Error(`Cell not found in persisted plan: ${cellId}`);
  const planBytesSha256 = sha256(planBytes);
  validateParentAuthorization(plan, cell, authorization, planBytesSha256);
  return runPreparedCell({ plan, cellId, authorization, planBytesSha256, spawn, verifyExecutable });
}

function prepare(options = {}) {
  const plan = makePlan({ ...options, privateInputHashes: hashPrivateInputFiles() });
  const outputPath = options.manifestPath ?? join(options.manifestDir ?? PRIVATE_DIR, `prepared-plan-${plan.controllerSha256.slice(0, 12)}.json`);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, canonical(plan), { flag: "wx" });
  return { planPath: outputPath, planSha256: plan.planSha256, controllerSha256: plan.controllerSha256, protocolSha256: plan.protocolSha256, cells: plan.cellCount, heldKiro: plan.held.length, blockedGoogle: plan.blocked.length };
}

function dispatchCli(argv, executionDependencies = {}) {
  if (argv[0] === "plan") {
    return `${JSON.stringify({ protocolSha256: hashFile(PROTOCOL), controllerSha256: hashFile(fileURLToPath(import.meta.url)), cells: profileList() }, null, 2)}\n`;
  }
  if (argv[0] === "prepare") {
    const result = prepare();
    return `${JSON.stringify(result, null, 2)}\n`;
  }
  if (argv[0] === "--execute") {
    const parsed = {};
    const keys = new Map([["--plan", "planPath"], ["--authorization", "authorizationPath"], ["--cell", "cellId"]]);
    for (let index = 1; index < argv.length; index += 2) {
      const name = argv[index];
      const value = argv[index + 1];
      const key = keys.get(name);
      if (!key || !value || value.startsWith("--") || Object.hasOwn(parsed, key)) throw new Error("Usage: node scripts/spike-model-effort-t171.mjs --execute --plan <path> --authorization <path> --cell <cellId>");
      parsed[key] = value;
    }
    if (Object.keys(parsed).length !== keys.size) throw new Error("Usage: node scripts/spike-model-effort-t171.mjs --execute --plan <path> --authorization <path> --cell <cellId>");
    return canonical(executePersistedPlan({ ...executionDependencies, ...parsed }));
  }
  throw new Error("Usage: node scripts/spike-model-effort-t171.mjs plan|prepare|--execute --plan <path> --authorization <path> --cell <cellId>");
}

function cli(argv) {
  process.stdout.write(dispatchCli(argv));
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
  PINNED_CODEX_HOST_SHA256,
  RUNNABLE_PROVIDERS,
  PROTOCOL_SHA256,
  TASK_HASHES,
  TASK_IDS,
  TIMEOUT_MS,
  buildArgv,
  buildPrompt,
  childEnvironment,
  directoryIdentity,
  dispatchCli,
  executePersistedPlan,
  hashPrivateInputFiles,
  hasSameDirectoryIdentity,
  hashPreparedPlan,
  makePlan,
  profileList,
  readNativeOutput,
  readTask,
  verifyHashPinnedFile,
};
