#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  openSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  readSync,
  readFileSync,
  statfsSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE_DIR = join(REPO, "scripts", "fixtures", "model-review", "t168");
const PROMPT_PATH = join(FIXTURE_DIR, "prompt.md");
const PROMPT_SHA256 = "4a69932852c61207346ed7d62be9f3f6755bfcd86190e1818fd734dfd6229dd6";
const FIXTURE_SHA256 = Object.freeze({
  f1: "9d5bc51d86603ee367f14a678812eddcd4255cff00d261afcc29606d120f1ef7",
  f2: "97b66442410ada20b57e91a01025d20a6f31689d33a17009e0825c8871369108",
  f3: "94a10710978c9184c9877d23099a34f292a5f0bd02c47520cbdd34c3a6f9a9eb",
  f4: "757b2d57d664759c1c8e08c0b52af6052a824f93db3e27641d4e567087981e35",
});
const PROTOCOL_NOTE_SHA256 = "8b16e3edee76cf956d0b5fd4699435ad211e0cc9eabbc4549ff5e829ea2c5944";
const TIMEOUT_MS = 120_000;
const MAX_BUFFER_BYTES = 8 * 1024 * 1024;
const MIN_FREE_BYTES = 20 * 1024 ** 3;
const PRIOR_CALLS = Object.freeze({ claude: 1, codex: 0, kiro: 0 });
const CALL_LIMITS = Object.freeze({ claude: 8, codex: 8, kiro: 8 });
const BLOCKED_GOOGLE_CELLS = 8;

export const LAUNCHERS = Object.freeze({
  claude: Object.freeze({
    executable: join(requiredEnv("USERPROFILE"), ".local", "bin", "claude.exe"),
    sha256: "e896a9d8da519353a49bf69ca4a695ba7e09067752687c675b3969041e632d52",
    version: "2.1.316 (Claude Code)",
  }),
  codex: Object.freeze({
    executable: "D:\\tools\\bun-install\\global\\node_modules\\@openai\\codex-win32-x64\\vendor\\x86_64-pc-windows-msvc\\bin\\codex.exe",
    sha256: "9d563ee4e0441ff9d59d612013e0460ddf8e5709735c2d9f6b98b7ef8ca4eb42",
    version: "codex-cli 0.166.0",
    siblingHost: "D:\\tools\\bun-install\\global\\node_modules\\@openai\\codex-win32-x64\\vendor\\x86_64-pc-windows-msvc\\bin\\codex-code-mode-host.exe",
    siblingHostSha256: "977c1f01c9efac0bfe1b9032717c95f92e1c965c8441a8dacbfe824c5c79a527",
  }),
  kiro: Object.freeze({
    executable: join(requiredEnv("LOCALAPPDATA"), "Kiro-Cli", "kiro-cli.exe"),
    sha256: "f4a6c31a88822b7b67d5c795df87f1465b34c6a4acbba01e9a0158ab0ff4c66c",
    version: "kiro-cli 2.37.1",
  }),
});

const MODELS = Object.freeze({
  claude: Object.freeze({ cheap: "haiku", default: null }),
  codex: Object.freeze({ cheap: "gpt-6-luna", default: null }),
  kiro: Object.freeze({ cheap: "qwen3-coder-next", default: null }),
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sha256File(path) {
  const fd = openSync(path, "r");
  const chunk = Buffer.alloc(1024 * 1024);
  const hash = createHash("sha256");
  try {
    let bytesRead;
    let position = 0;
    while ((bytesRead = readSync(fd, chunk, 0, chunk.length, position)) > 0) {
      hash.update(chunk.subarray(0, bytesRead));
      position += bytesRead;
    }
    return hash.digest("hex");
  } finally {
    closeSync(fd);
  }
}

function parseOptions(argv) {
  return parseArgs({
    args: argv,
    allowPositionals: false,
    strict: true,
    options: {
      help: { type: "boolean", short: "h" },
      provider: { type: "string" },
      fixture: { type: "string" },
      tier: { type: "string" },
      "cell-id": { type: "string" },
      "evidence-dir": { type: "string" },
      execute: { type: "boolean" },
      authorization: { type: "string" },
    },
  }).values;
}

function usage() {
  return `Usage:
  node scripts/spike-model-tier-review-t168.mjs --provider claude|codex|kiro \\
    --fixture f1|f2|f3|f4 --tier cheap|default --cell-id R01 [--evidence-dir PATH]

Without --execute this prints a dry-run plan and makes no provider call. Execution
also requires --authorization with matching parent lease and exact critic hashes.
Claude cheap/f1 is omitted to account for the earlier unintended assistant turn.
Google/Agy is intentionally unsupported because all eight cells are safety-blocked.
`;
}

function fail(message) {
  throw new Error(message);
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value || !isAbsolute(value)) fail(`Expected an absolute ${name} value`);
  return value;
}

export function readFixture(fixtureId) {
  const expectedHash = FIXTURE_SHA256[fixtureId];
  if (!expectedHash) fail(`Unsupported fixture: ${fixtureId}`);
  const bytes = readFileSync(join(FIXTURE_DIR, `${fixtureId}.json`));
  if (sha256(bytes) !== expectedHash) fail(`Frozen fixture changed: ${fixtureId}`);
  const fixture = JSON.parse(bytes.toString("utf8"));
  const actualKeys = Object.keys(fixture).sort();
  const allowedKeys = ["diff", "id", "schemaVersion", "ticket"];
  if (JSON.stringify(actualKeys) !== JSON.stringify(allowedKeys)) fail(`Unexpected fixture fields: ${fixtureId}`);
  if (fixture.id !== fixtureId || fixture.schemaVersion !== 1 || typeof fixture.ticket !== "string" || typeof fixture.diff !== "string") {
    fail(`Malformed fixture: ${fixtureId}`);
  }
  return { bytes, fixtureHash: expectedHash, ticket: fixture.ticket, diff: fixture.diff };
}

export function buildPrompt(ticket, diff, templateBytes = readFileSync(PROMPT_PATH)) {
  if (sha256(templateBytes) !== PROMPT_SHA256) fail("Frozen review prompt changed");
  const template = templateBytes.toString("utf8");
  if (template.split("{{ticket}}").length !== 2 || template.split("{{diff}}").length !== 2) fail("Prompt placeholders changed");
  const prompt = template.replace("{{ticket}}", ticket).replace("{{diff}}", diff);
  if (prompt.includes("{{ticket}}") || prompt.includes("{{diff}}")) fail("Unfilled prompt placeholder");
  return { prompt, templateHash: PROMPT_SHA256, promptHash: sha256(Buffer.from(prompt, "utf8")) };
}

export function buildArgv(provider, tier, prompt, workDir) {
  if (!Object.hasOwn(LAUNCHERS, provider)) fail(`Provider is not permitted: ${provider}`);
  if (!Object.hasOwn(MODELS[provider], tier)) fail(`Unsupported tier: ${tier}`);
  const args = [];
  if (provider === "claude") {
    args.push("--print", "--safe-mode", "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}', "--tools", "", "--disallowedTools", "mcp__*", "--no-session-persistence", "--output-format", "json", "--permission-mode", "plan", "--max-budget-usd", "0.10");
  } else if (provider === "codex") {
    args.push("exec", "--ephemeral", "--ignore-user-config", "--cd", workDir, "--skip-git-repo-check", "--sandbox", "read-only", "--json");
  } else {
    args.push("chat", "--no-interactive", "--agent-engine", "v2", "--trust-tools=", "--output-format", "stream-json");
  }
  const model = MODELS[provider][tier];
  if (model) args.push("--model", model);
  args.push(prompt);
  return args;
}

export function buildCellPlan({ provider, fixtureId, tier, cellId, workDir }) {
  if (!/^[A-Z][A-Z0-9]{1,5}$/.test(cellId)) fail("Cell ID must be an opaque uppercase ID");
  if (provider === "google" || provider === "agy") {
    fail(`Google/Agy is safety-blocked: ${BLOCKED_GOOGLE_CELLS} cells remain blocked; do not invoke it`);
  }
  if (provider === "claude" && fixtureId === "f1" && tier === "cheap") {
    fail("Claude cheap/f1 is omitted for budget accounting; do not replace it");
  }
  const fixture = readFixture(fixtureId);
  const rendered = buildPrompt(fixture.ticket, fixture.diff);
  const launcher = LAUNCHERS[provider];
  const argv = buildArgv(provider, tier, rendered.prompt, workDir);
  return {
    cellId,
    provider,
    tier,
    fixtureId,
    requestedModel: MODELS[provider][tier],
    requestedEffort: "native default; no effort override",
    executable: launcher.executable,
    executableSha256: launcher.sha256,
    expectedVersion: launcher.version,
    siblingHost: launcher.siblingHost ?? null,
    siblingHostSha256: launcher.siblingHostSha256 ?? null,
    cwd: workDir,
    argv,
    shell: false,
    stdin: "closed-empty",
    timeoutMs: TIMEOUT_MS,
    fixtureSha256: fixture.fixtureHash,
    promptTemplateSha256: rendered.templateHash,
    promptSha256: rendered.promptHash,
  };
}

function parseJsonLines(stdout) {
  const events = [];
  const malformedLines = [];
  for (const [index, line] of stdout.toString("utf8").split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line));
    } catch {
      malformedLines.push(index + 1);
    }
  }
  return { events, malformedLines };
}

function collectNativeErrors(value, path = "$", errors = []) {
  if (!value || typeof value !== "object") return errors;
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectNativeErrors(item, `${path}[${index}]`, errors));
    return errors;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (/error/i.test(key) && child !== null && child !== undefined && child !== false && child !== "") {
      errors.push({ path: childPath, valueType: typeof child });
    }
    collectNativeErrors(child, childPath, errors);
  }
  return errors;
}

function collectNativeErrorPayloads(value, payloads = []) {
  if (!value || typeof value !== "object") return payloads;
  if (Array.isArray(value)) {
    value.forEach((item) => collectNativeErrorPayloads(item, payloads));
    return payloads;
  }
  if (value.type === "error" || value.type === "turn.failed" || value.subtype === "error" || value.is_error === true || value.item?.type === "error" || value.item?.status === "error" || value.item?.status === "failed" || value.status === "error" || value.status === "failed") {
    payloads.push(value);
  }
  for (const [key, child] of Object.entries(value)) {
    if (/error/i.test(key) && child !== null && child !== undefined && child !== false && child !== "") payloads.push(child);
    collectNativeErrorPayloads(child, payloads);
  }
  return payloads;
}

function findModelIdentity(value) {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findModelIdentity(item);
      if (found) return found;
    }
    return null;
  }
  for (const [key, child] of Object.entries(value)) {
    if (["model", "modelId", "model_id", "modelName", "model_name", "canonicalModel"].includes(key) && typeof child === "string") return child;
    const found = findModelIdentity(child);
    if (found) return found;
  }
  return null;
}

function extractCodex(stdout) {
  const { events, malformedLines } = parseJsonLines(stdout);
  const terminal = [...events].reverse().find((event) => event.type === "turn.completed") ?? null;
  const failed = events.some((event) => event.type === "turn.failed" || event.type === "error" || event.item?.type === "error" || event.item?.status === "failed" || event.item?.status === "error");
  const errors = collectNativeErrors(events);
  const errorPayloads = collectNativeErrorPayloads(events);
  const finalMessages = events
    .filter((event) => event.type === "item.completed" && event.item?.type === "agent_message")
    .map((event) => event.item.text ?? "");
  const modelIdentity = findModelIdentity(events);
  return {
    terminal: terminal !== null,
    terminalType: terminal?.type ?? null,
    explicitFailure: failed || errorPayloads.length > 0,
    malformedLines,
    errors,
    responseText: finalMessages.join("\n"),
    sessionId: null,
    threadId: events.find((event) => event.type === "thread.started")?.thread_id ?? null,
    actualModel: modelIdentity,
    usage: terminal?.usage ?? null,
    cost: null,
    usageLimit: isUsageLimit(errorPayloads),
  };
}

function extractKiro(stdout) {
  const { events, malformedLines } = parseJsonLines(stdout);
  const terminal = [...events].reverse().find((event) => event.type === "runFinished") ?? null;
  const status = terminal?.data?.status ?? null;
  const stopReason = terminal?.data?.stopReason ?? null;
  const errors = collectNativeErrors(events);
  const errorPayloads = collectNativeErrorPayloads(events);
  const metadata = events.filter((event) => event.type === "metadata").map((event) => event.data ?? {});
  const terminalFailure = terminal !== null && status !== "success";
  const responseText = typeof terminal?.data?.finalText === "string" ? terminal.data.finalText : "";
  const sessionId = terminal?.data?.sessionId ?? events.find((event) => event.type === "runStarted")?.data?.sessionId ?? null;
  return {
    terminal: terminal !== null && status === "success" && stopReason === "end_turn",
    terminalType: terminal?.type ?? null,
    terminalStatus: status,
    stopReason,
    explicitFailure: terminalFailure || errorPayloads.length > 0 || events.some((event) => event.type === "error" || event.data?.status === "error"),
    malformedLines,
    errors,
    responseText,
    sessionId,
    threadId: null,
    actualModel: findModelIdentity(metadata),
    usage: metadata.filter((item) => Object.keys(item).some((key) => /usage|credit|token/i.test(key))),
    cost: null,
    usageLimit: isUsageLimit(errorPayloads),
  };
}

function extractClaude(stdout) {
  let result;
  try {
    result = JSON.parse(stdout.toString("utf8"));
  } catch {
    return { terminal: false, terminalType: null, explicitFailure: false, malformedLines: [1], errors: [], responseText: "", sessionId: null, threadId: null, actualModel: null, usage: null, cost: null, usageLimit: false };
  }
  const modelUsage = Object.values(result.modelUsage ?? {});
  const primary = modelUsage[0] ?? null;
  const errors = collectNativeErrors(result);
  const errorPayloads = collectNativeErrorPayloads(result);
  return {
    terminal: result.type === "result" && result.subtype === "success" && result.is_error !== true,
    terminalType: result.type ?? null,
    explicitFailure: result.type === "error" || result.is_error === true || result.subtype === "error" || errorPayloads.length > 0,
    malformedLines: [],
    errors,
    responseText: typeof result.result === "string" ? result.result : "",
    sessionId: result.session_id ?? null,
    threadId: null,
    actualModel: primary?.canonicalModel ?? null,
    usage: result.usage ?? null,
    cost: result.total_cost_usd == null ? null : { amountUsd: result.total_cost_usd, basis: primary?.costBasis ?? "cli-reported" },
    usageLimit: isUsageLimit(errorPayloads),
  };
}

export function isUsageLimit(value) {
  const text = JSON.stringify(value);
  return /\b(?:usage|rate|quota|credits?|budget)[\s_-]+limit[\s_-]+(?:reached|exceeded|exhausted|hit)\b|\b(?:usage|rate|quota|credits?|budget)[\s_-]+(?:exhausted|depleted|exceeded|insufficient)\b|\b(?:limit|exhausted|depleted|insufficient|exceeded|reached)[\s_-]+(?:usage|rate|quota|credits?|budget)\b|\b(?:out of|no more|insufficient)[\s_-]+(?:credits?|quota|budget)\b/i.test(text);
}

function parseReviewResponse(text) {
  if (!text.trim()) return { valid: false, reason: "empty response", findings: null };
  try {
    const response = JSON.parse(text);
    if (!response || !Array.isArray(response.findings) || typeof response.noFindings !== "boolean") {
      return { valid: false, reason: "response does not match the frozen JSON shape", findings: null };
    }
    if (response.findings.some((finding) => !finding || typeof finding.line !== "string" || !finding.line.trim() || typeof finding.impact !== "string" || !finding.impact.trim() || !["critical", "high", "medium", "low"].includes(finding.severity) || !["high", "medium", "low"].includes(finding.confidence))) {
      return { valid: false, reason: "a finding is missing a required field", findings: null };
    }
    if (response.noFindings !== (response.findings.length === 0)) return { valid: false, reason: "noFindings conflicts with findings", findings: null };
    return { valid: true, reason: null, findings: response.findings };
  } catch (error) {
    return { valid: false, reason: `invalid JSON: ${error.message}`, findings: null };
  }
}

export function classifyRun(processResult, native) {
  if (processResult.error?.code === "ETIMEDOUT") return "timeout";
  if (processResult.error) return "infrastructure-error";
  if (native.usageLimit) return "usage-limit";
  if (native.malformedLines?.length) return "infrastructure-error";
  if (native.errors?.length || native.explicitFailure) return "infrastructure-error";
  if (processResult.status !== 0) return "provider-process-failure";
  if (!native.terminal) return "missing-terminal-event";
  if (!native.responseText?.trim()) return "empty-response";
  if (/\b(?:i|we)\s+(?:cannot|can't|could not|am unable to|are unable to)\s+(?:review|analy[sz]e|inspect|assess)\b/i.test(native.responseText)) return "denied-required-action";
  const review = parseReviewResponse(native.responseText);
  return review.valid ? "completed-review" : "invalid-review-output";
}

function verifyLauncher(provider) {
  if (process.platform !== "win32") fail("This controller is frozen for the verified Windows host");
  const launcher = LAUNCHERS[provider];
  if (!launcher) fail(`Provider is not permitted: ${provider}`);
  const actualHash = sha256File(launcher.executable);
  if (actualHash !== launcher.sha256) fail(`Executable hash mismatch for ${provider}`);
  if (launcher.siblingHost) {
    const actualHostHash = sha256File(launcher.siblingHost);
    if (actualHostHash !== launcher.siblingHostSha256) fail("Codex code-mode host hash mismatch");
  }
  return launcher;
}

function ensureFreeSpace(paths) {
  const volumes = new Map();
  for (const path of paths) {
    let existing = resolve(path);
    while (!existsSync(existing)) existing = dirname(existing);
    const stats = statfsSync(existing);
    const freeBytes = stats.bavail * stats.bsize;
    volumes.set(existing, freeBytes);
    if (freeBytes < MIN_FREE_BYTES) fail(`Free space below 20 GiB at ${existing}`);
  }
  return Object.fromEntries(volumes);
}

function isWithinRepo(path) {
  const rel = relative(REPO, resolve(path));
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

function validateAuthorization(path, provider, controllerHash) {
  if (!path) fail("Execution requires an explicit parent authorization receipt");
  const auth = JSON.parse(readFileSync(path, "utf8"));
  if (auth.ticket !== 168 || auth.protocolNoteSha256 !== PROTOCOL_NOTE_SHA256 || auth.controllerSha256 !== controllerHash || auth.criticAcceptedControllerSha256 !== controllerHash || auth.parentLeaseReleased !== true || auth.allowedProviders?.includes(provider) !== true) {
    fail("Authorization does not match the accepted protocol/controller and parent lease");
  }
  return auth;
}

function countCalls(ledger, provider) {
  return (ledger.cells ?? []).filter((cell) => cell.provider === provider && cell.startedAt).length + PRIOR_CALLS[provider];
}

function reserveCell(ledgerPath, provider, fixtureId, tier, cellId) {
  const lockPath = `${ledgerPath}.lock`;
  let lockFd;
  try {
    lockFd = openSync(lockPath, "wx");
  } catch {
    fail("Measurement ledger is locked by another invocation; run cells serially");
  }
  try {
    let ledger;
    try {
      ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      ledger = { schemaVersion: 1, priorUnplannedClaudeTurns: 1, googleBlockedCells: BLOCKED_GOOGLE_CELLS, cells: [], providerStopped: [] };
    }
    if (ledger.cells.some((cell) => cell.cellId === cellId)) fail(`Cell ${cellId} already exists; retries are forbidden`);
    if (ledger.cells.some((cell) => cell.provider === provider && cell.fixtureId === fixtureId && cell.tier === tier)) fail(`Provider/fixture/tier cell already started; retries are forbidden`);
    if (ledger.providerStopped.includes(provider)) fail(`Provider ${provider} is stopped after a prior limit/error`);
    if (countCalls(ledger, provider) >= CALL_LIMITS[provider]) fail(`Call ceiling reached for ${provider}`);
    ledger.cells.push({ cellId, provider, fixtureId, tier, startedAt: new Date().toISOString(), status: "started" });
    mkdirSync(dirname(ledgerPath), { recursive: true });
    writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
    return { ledger, lockPath, lockFd };
  } catch (error) {
    if (lockFd !== undefined) closeSync(lockFd);
    rmSync(lockPath, { force: true });
    throw error;
  }
}

function updateLedger(ledgerPath, cellId, result) {
  const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
  const cell = ledger.cells.find((item) => item.cellId === cellId);
  if (!cell || cell.status !== "started") fail(`No reserved cell for ${cellId}`);
  Object.assign(cell, result);
  if (result.usageLimit || ["infrastructure-error", "provider-process-failure", "timeout", "missing-terminal-event", "empty-response", "provider-budget-exceeded"].includes(result.status)) {
    if (!ledger.providerStopped.includes(cell.provider)) ledger.providerStopped.push(cell.provider);
  }
  writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
}

function releaseLedger(reservation) {
  closeSync(reservation.lockFd);
  rmSync(reservation.lockPath, { force: true });
}

function captureBytes(directory, name, bytes) {
  const path = join(directory, name);
  writeFileSync(path, bytes);
  return { path: name, bytes: bytes.length, sha256: sha256(bytes) };
}

function validatePaths(evidenceDir, workDir) {
  if (!isAbsolute(evidenceDir) || !isAbsolute(workDir)) fail("Evidence and work directories must be absolute");
  if (isWithinRepo(workDir)) fail("Provider working directory must be outside the repository");
  if (resolve(evidenceDir) === resolve(workDir)) fail("Evidence and provider working directories must differ");
}

function makeInitialPlan(options) {
  const provider = options.provider;
  const fixtureId = options.fixture;
  const tier = options.tier;
  const cellId = options["cell-id"];
  if (!provider || !fixtureId || !tier || !cellId) fail("--provider, --fixture, --tier, and --cell-id are required");
  if (provider === "google" || provider === "agy") fail(`Google/Agy is safety-blocked: ${BLOCKED_GOOGLE_CELLS} cells remain blocked; do not invoke it`);
  if (provider === "claude" && fixtureId === "f1" && tier === "cheap") fail("Claude cheap/f1 is omitted; do not replace it");
  const launcher = verifyLauncher(provider);
  const controllerHash = sha256(readFileSync(fileURLToPath(import.meta.url)));
  const workDir = join(tmpdir(), `gm-t168-dry-run-${cellId}`);
  const evidenceDir = resolve(options["evidence-dir"] ?? join(REPO, ".scratch", "t168", "raw", cellId));
  validatePaths(evidenceDir, workDir);
  const fixture = readFixture(fixtureId);
  const rendered = buildPrompt(fixture.ticket, fixture.diff);
  const argv = buildArgv(provider, tier, rendered.prompt, workDir);
  return {
    plan: {
      schemaVersion: 1,
      controllerSha256: controllerHash,
      cellId,
      provider,
      tier,
      fixtureId,
      requestedModel: MODELS[provider][tier],
      requestedEffort: "native default; no effort override",
      executable: launcher.executable,
      executableSha256: launcher.sha256,
      expectedVersion: launcher.version,
      siblingHost: launcher.siblingHost ?? null,
      siblingHostSha256: launcher.siblingHostSha256 ?? null,
      cwd: workDir,
      argv,
      shell: false,
      stdin: "empty buffer; prompt is the final explicit argv element",
      timeoutMs: TIMEOUT_MS,
      maxBufferBytesPerStream: MAX_BUFFER_BYTES,
      fixtureSha256: fixture.fixtureHash,
      promptTemplateSha256: rendered.templateHash,
      promptSha256: rendered.promptHash,
      protocolNoteSha256: PROTOCOL_NOTE_SHA256,
      googleBlockedCells: BLOCKED_GOOGLE_CELLS,
    },
    prompt: rendered.prompt,
    workDir,
    evidenceDir,
  };
}

function execute(options, built) {
  const controllerHash = sha256(readFileSync(fileURLToPath(import.meta.url)));
  validateAuthorization(options.authorization, options.provider, controllerHash);
  const freeSpace = ensureFreeSpace([REPO, tmpdir(), dirname(built.evidenceDir)]);
  const evidenceInsideRepo = isWithinRepo(built.evidenceDir);
  const evidenceInTicketScratch = resolve(built.evidenceDir).startsWith(`${join(REPO, ".scratch", "t168")}${sep}`);
  if (evidenceInsideRepo && !evidenceInTicketScratch) {
    fail("Evidence must stay in this ticket's private scratch or another outside-repo directory");
  }
  if (existsSync(built.evidenceDir)) fail(`Evidence directory already exists; retries are forbidden: ${built.evidenceDir}`);
  const ledgerPath = join(REPO, ".scratch", "t168", "measurement-ledger.json");
  const reservation = reserveCell(ledgerPath, options.provider, options.fixture, options.tier, options["cell-id"]);

  try {
    built.workDir = mkdtempSync(join(tmpdir(), `gm-t168-${options["cell-id"]}-`));
    built.plan.cwd = built.workDir;
    built.plan.argv = buildArgv(options.provider, options.tier, built.prompt, built.workDir);
    mkdirSync(dirname(built.evidenceDir), { recursive: true });
    mkdirSync(built.evidenceDir, { recursive: false });
    const started = Date.now();
    const child = spawnSync(built.plan.executable, built.plan.argv, {
      cwd: built.workDir,
      env: process.env,
      input: Buffer.alloc(0),
      encoding: null,
      timeout: TIMEOUT_MS,
      maxBuffer: MAX_BUFFER_BYTES,
      windowsHide: true,
      shell: false,
    });
    const durationMs = Date.now() - started;
    const stdout = child.stdout ?? Buffer.alloc(0);
    const stderr = child.stderr ?? Buffer.alloc(0);
    const stdoutReceipt = captureBytes(built.evidenceDir, "stdout.bin", stdout);
    const stderrReceipt = captureBytes(built.evidenceDir, "stderr.bin", stderr);
    const native = options.provider === "claude"
      ? extractClaude(stdout)
      : options.provider === "codex"
        ? extractCodex(stdout)
        : extractKiro(stdout);
    const stderrUsageLimit = child.status !== 0 && isUsageLimit(stderr.toString("utf8"));
    if (stderrUsageLimit) native.usageLimit = true;
    const review = parseReviewResponse(native.responseText ?? "");
    let status = classifyRun(child, native);
    if (options.provider === "claude" && native.cost?.amountUsd > 0.10) status = "provider-budget-exceeded";
    const receipt = {
      schemaVersion: 1,
      ticket: 168,
      createdAt: new Date().toISOString(),
      status,
      cell: { id: options["cell-id"], provider: options.provider, tier: options.tier },
      process: { status: child.status, signal: child.signal, error: child.error?.message ?? null, errorCode: child.error?.code ?? null, durationMs },
      controller: {
        controllerSourceSha256: controllerHash,
        nodeVersion: process.version,
        executable: built.plan.executable,
        executableSha256: built.plan.executableSha256,
        expectedVersion: built.plan.expectedVersion,
        argv: built.plan.argv,
        cwd: built.workDir,
        shell: false,
        stdinBytes: 0,
        timeoutMs: TIMEOUT_MS,
        freeSpaceBytes: freeSpace,
      },
      fixture: { id: options.fixture, sha256: built.plan.fixtureSha256 },
      prompt: { templateSha256: built.plan.promptTemplateSha256, renderedSha256: built.plan.promptSha256 },
      native: {
        terminal: native.terminal,
        terminalType: native.terminalType,
        terminalStatus: native.terminalStatus ?? null,
        stopReason: native.stopReason ?? null,
        explicitFailure: native.explicitFailure,
        malformedLines: native.malformedLines,
        errors: native.errors,
        sessionId: native.sessionId,
        threadId: native.threadId,
        requestedModel: built.plan.requestedModel,
        requestedEffort: built.plan.requestedEffort,
        actualModel: native.actualModel,
        usage: native.usage,
        cost: native.cost,
        usageLimit: native.usageLimit,
        usageLimitSource: stderrUsageLimit ? "native stderr" : native.usageLimit ? "native stdout envelope" : null,
      },
      review: { validJsonShape: review.valid, reason: review.reason, response: review.findings ? { findings: review.findings, noFindings: review.findings.length === 0 } : null },
      raw: { stdout: stdoutReceipt, stderr: stderrReceipt },
      artifactDisposition: "private until independent audit; raw output may contain private reasoning and must not be promoted",
    };
    writeFileSync(join(built.evidenceDir, "receipt.json"), `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
    updateLedger(ledgerPath, options["cell-id"], { status, finishedAt: new Date().toISOString(), durationMs, usageLimit: native.usageLimit, evidenceDir: built.evidenceDir, stdoutSha256: stdoutReceipt.sha256, stderrSha256: stderrReceipt.sha256 });
    return { status, receipt: join(built.evidenceDir, "receipt.json"), durationMs, exitCode: child.status, errorCode: child.error?.code ?? null };
  } finally {
    releaseLedger(reservation);
  }
}

function main(argv = process.argv.slice(2)) {
  const options = parseOptions(argv);
  if (options.help) return usage();
  const built = makeInitialPlan(options);
  if (!options.execute) return JSON.stringify({ mode: "dry-run", ...built.plan }, null, 2);
  return JSON.stringify(execute(options, built), null, 2);
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  try {
    process.stdout.write(`${main()}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

export {
  BLOCKED_GOOGLE_CELLS,
  CALL_LIMITS,
  FIXTURE_SHA256,
  MODELS,
  PROTOCOL_NOTE_SHA256,
  TIMEOUT_MS,
  parseReviewResponse,
  extractClaude,
  extractCodex,
  extractKiro,
};
