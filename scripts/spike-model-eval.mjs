#!/usr/bin/env node
// Run one frozen spike-0 implementation task through a native CLI and grade it independently.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURES = join(REPO, "scripts", "fixtures", "model-eval");
const CREATE_FIXTURE = join(REPO, "scripts", "spike-orchestrate-fixture.mjs");
const TIMEOUT_MS = 600_000;
const MAX_BUFFER = 16 * 1024 * 1024;

function parseOptions(argv) {
  return parseArgs({
    args: argv,
    allowPositionals: false,
    strict: true,
    options: {
      help: { type: "boolean", short: "h" },
      fixture: { type: "string" },
      adapter: { type: "string" },
      model: { type: "string" },
      effort: { type: "string", default: "low" },
      "codex-exe": { type: "string" },
      "claude-exe": { type: "string" },
      "work-dir": { type: "string" },
      "evidence-dir": { type: "string" },
      "budget-usd": { type: "string", default: "0.50" },
    },
  }).values;
}

function usage() {
  return `Usage:
  node scripts/spike-model-eval.mjs --fixture t1|t3 --adapter claude|codex --model NAME \\
    --work-dir <new-path-outside-repo> --evidence-dir <new-path>

Claude requires --claude-exe <absolute-path>. Codex requires --codex-exe <absolute-package-path>.
Each call builds a fresh spike-0 fixture, runs one native CLI session, grades the result, and
keeps its stdout, stderr, test output, and result.json in the evidence directory.
`;
}

function fail(message) {
  throw new Error(message);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    encoding: "utf8",
    timeout: options.timeout ?? TIMEOUT_MS,
    maxBuffer: MAX_BUFFER,
    windowsHide: true,
    shell: options.shell ?? false,
  });
  return {
    status: result.status,
    signal: result.signal,
    error: result.error?.message ?? null,
    errorCode: result.error?.code ?? null,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function writeCapture(directory, name, contents) {
  const path = join(directory, name);
  writeFileSync(path, contents, "utf8");
  const bytes = Buffer.byteLength(contents, "utf8");
  return {
    path: name,
    bytes,
    sha256: createHash("sha256").update(contents).digest("hex"),
  };
}

function git(cwd, ...args) {
  const result = run("git", args, { cwd });
  if (result.status !== 0) fail(`git ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  return result.stdout.trim();
}

function gitPaths(cwd, ...args) {
  const result = run("git", args, { cwd });
  if (result.status !== 0) fail("git " + args.join(" ") + " failed: " + (result.stderr || result.stdout));
  return result.stdout.split("\0").filter(Boolean);
}

function freezeFixture(workDir, expectedTree) {
  // The general spike generator tracks the live dashboard; comparisons require its original bytes.
  writeFileSync(join(workDir, "docs", "status.html"), readFileSync(join(FIXTURES, "seed-status.html")));
  git(workDir, "add", "--", "docs/status.html");
  git(workDir, "-c", "commit.gpgsign=false", "commit", "--amend", "--no-edit", "--quiet");
  const tree = git(workDir, "rev-parse", "HEAD^{tree}");
  if (tree !== expectedTree) fail(`fixture seed changed: expected ${expectedTree}, observed ${tree}`);
  return tree;
}

function changedFilesSince(workDir, seedCommit) {
  const tracked = gitPaths(workDir, "diff", "--name-only", "--no-renames", "-z", seedCommit, "--");
  const untracked = gitPaths(workDir, "ls-files", "--others", "-z", "--");
  return [...new Set([...tracked, ...untracked].map((file) => file.replaceAll("\\", "/")))].sort();
}

function quotePowerShell(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function makePrompt(task, ticketText, adapter, npmCommand, nodeDirectory) {
  const testCommand = adapter === "codex"
    ? `$env:PATH = ${quotePowerShell(nodeDirectory + ";")} + $env:PATH; & ${quotePowerShell(npmCommand)} test`
    : "npm test";
  return [
    `Read ${task.ticketFile} and implement it exactly in this fixture.`,
    "Add the required tests. Run the project test once with this command:",
    testCommand,
    "Do not commit. Do not touch files outside the ticket Touches paths.",
    "Report the changes and observed test result.",
    "",
    "Ticket text:",
    ticketText,
  ].join("\n");
}

function claudeArgs(model, effort, budgetUsd, prompt) {
  return [
    "--print", prompt,
    "--no-session-persistence",
    "--output-format", "json",
    "--permission-mode", "acceptEdits",
    "--model", model,
    "--effort", effort,
    "--max-budget-usd", budgetUsd,
    "--allowedTools", "Read", "Edit", "Write", "Bash(npm test)",
  ];
}

function codexArgs(model, effort, workDir, prompt) {
  return [
    "-c", `model_reasoning_effort="${effort}"`,
    "exec", "--ephemeral", "--cd", workDir,
    "--sandbox", "workspace-write",
    "--model", model,
    "--json", prompt,
  ];
}

function parseClaudeOutput(stdout) {
  try {
    const result = JSON.parse(stdout);
    const modelUsage = Object.values(result.modelUsage ?? {});
    const primary = modelUsage[0] ?? null;
    return {
      complete: result.type === "result" && result.subtype === "success" && result.is_error !== true,
      sessionId: result.session_id ?? null,
      threadId: null,
      actualModel: primary?.canonicalModel ?? null,
      usage: result.usage ?? null,
      cost: result.total_cost_usd == null
        ? null
        : { amountUsd: result.total_cost_usd, basis: primary?.costBasis ?? "cli-reported" },
      toolCommands: null,
      testRuns: null,
      turnFailed: false,
      parseError: null,
    };
  } catch (error) {
    return { complete: false, sessionId: null, threadId: null, actualModel: null, usage: null, cost: null, toolCommands: null, testRuns: null, turnFailed: false, parseError: error.message };
  }
}

function parseCodexOutput(stdout) {
  const events = [];
  const malformed = [];
  for (const [index, line] of stdout.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line));
    } catch {
      malformed.push(index + 1);
    }
  }
  const completed = events.some((event) => event.type === "turn.completed");
  const failed = events.some((event) => event.type === "turn.failed" || event.type === "error");
  const infrastructureErrors = events.filter((event) => event.type === "item.completed" && event.item?.type === "error")
    .map((event) => event.item.message ?? "Codex tool error");
  const usage = [...events].reverse().find((event) => event.type === "turn.completed")?.usage ?? null;
  const toolCommands = events.filter((event) => event.type.startsWith("item.") && event.item?.type === "command_execution")
    .map((event) => ({
      status: event.item.status ?? null,
      command: event.item.command ?? null,
      exitCode: event.item.exit_code ?? null,
    }));
  return {
    complete: completed && !failed && malformed.length === 0,
    sessionId: null,
    threadId: events.find((event) => event.type === "thread.started")?.thread_id ?? null,
    actualModel: null,
    usage,
    cost: null,
    toolCommands,
    testRuns: toolCommands.filter((command) => /npm(?:\.cmd)?["']?\s+test\b/i.test(command.command ?? "")),
    turnFailed: events.some((event) => event.type === "turn.failed"),
    infrastructureErrors,
    malformedLines: malformed,
  };
}

function gradeFiles(workDir, task, seedCommit) {
  const changed = changedFilesSince(workDir, seedCommit);
  const outOfScope = changed.filter((file) => !task.allowedFiles.includes(file));
  const source = readFileSync(join(workDir, "src", "a.js"), "utf8");
  const tests = readFileSync(join(workDir, "test", "a.test.js"), "utf8");
  const sourceHasExport = new RegExp(`\\bexport\\s+(?:const|function)\\s+${task.expectedExport}\\b`).test(source);
  const sourceLacksForbidden = !task.forbiddenExport || !new RegExp(`\\bexport\\s+(?:const|function)\\s+${task.forbiddenExport}\\b`).test(source);
  const testSourceCases = task.testSourceCases.map((snippet) => ({
    snippet,
    present: tests.includes(snippet),
  }));
  return {
    changedFiles: changed,
    outOfScope,
    sourceHasExport,
    sourceLacksForbidden,
    testSourceCases,
    sourceAndTestChecksPass: sourceHasExport && sourceLacksForbidden && testSourceCases.every((item) => item.present),
  };
}

function hiddenBehaviorCheck(workDir, task, nodeExe) {
  const moduleUrl = pathToFileURL(join(workDir, "src", "a.js")).href;
  const expected = JSON.stringify({
    exportName: task.expectedExport,
    forbiddenExport: task.forbiddenExport ?? null,
    cases: task.expectedCases,
  });
  const code = [
    `const specification = ${expected};`,
    `const module = await import(${JSON.stringify(moduleUrl)} + "?eval=174");`,
    `if (typeof module[specification.exportName] !== "function") throw new Error("required export missing");`,
    `if (specification.forbiddenExport && Object.hasOwn(module, specification.forbiddenExport)) throw new Error("forbidden export remains");`,
    `for (const item of specification.cases) { const actual = module[specification.exportName](...item.args); if (actual !== item.expected) throw new Error(JSON.stringify({item, actual})); }`,
    `console.log(JSON.stringify({pass: true, cases: specification.cases.length}));`,
  ].join("\n");
  const env = {
    PATH: `${dirname(nodeExe)}${process.platform === "win32" ? ";" : ":"}${process.env.PATH ?? ""}`,
    ...(process.platform === "win32" ? {
      SystemRoot: process.env.SystemRoot,
      TEMP: process.env.TEMP,
      TMP: process.env.TMP,
      USERPROFILE: process.env.USERPROFILE,
    } : {}),
  };
  return run(nodeExe, ["--input-type=module", "--eval", code], { cwd: workDir, env });
}

function testCommand(workDir, nodeExe) {
  const nodeDirectory = dirname(nodeExe);
  const npmCommand = join(nodeDirectory, process.platform === "win32" ? "npm.cmd" : "npm");
  if (!existsSync(npmCommand)) return { status: null, error: `npm command not found beside Node: ${npmCommand}`, stdout: "", stderr: "" };
  const env = {
    PATH: `${nodeDirectory}${process.platform === "win32" ? ";" : ":"}${process.env.PATH ?? ""}`,
    ...(process.platform === "win32" ? {
      SystemRoot: process.env.SystemRoot,
      ComSpec: process.env.ComSpec,
      PATHEXT: process.env.PATHEXT,
      TEMP: process.env.TEMP,
      TMP: process.env.TMP,
      USERPROFILE: process.env.USERPROFILE,
    } : {}),
  };
  if (process.platform === "win32") {
    return run(npmCommand, ["test"], { cwd: workDir, env, shell: true });
  }
  return run(npmCommand, ["test"], { cwd: workDir, env });
}

function parseTestCounts(output) {
  const tests = output.match(/^# tests (\d+)$/m)?.[1];
  const pass = output.match(/^# pass (\d+)$/m)?.[1];
  const failCount = output.match(/^# fail (\d+)$/m)?.[1];
  const skipped = output.match(/^# skipped (\d+)$/m)?.[1];
  const cancelled = output.match(/^# cancelled (\d+)$/m)?.[1];
  return {
    tests: tests == null ? null : Number(tests),
    pass: pass == null ? null : Number(pass),
    fail: failCount == null ? null : Number(failCount),
    skipped: skipped == null ? null : Number(skipped),
    cancelled: cancelled == null ? null : Number(cancelled),
  };
}

function classifyResult({ agent, adapterResult, fileGrade, seedUnchanged, test, testCounts, behavior }) {
  if (agent.errorCode === "ETIMEDOUT") return "timeout";
  if (agent.error) return "infrastructure-error";
  if (agent.status !== 0) return "agent-process-failure";
  if (adapterResult.parseError || adapterResult.malformedLines?.length) return "malformed-output";
  if (adapterResult.infrastructureErrors?.length) return "infrastructure-error";
  if (adapterResult.turnFailed) return "turn-failed";
  if (!adapterResult.complete) return "missing-completion";
  if (fileGrade.outOfScope.length > 0) return "out-of-scope-change";
  if (!seedUnchanged) return "unexpected-commit";
  if (!fileGrade.sourceAndTestChecksPass) return "acceptance-failure";
  if (test.status !== 0) return "test-failure";
  if (testCounts.tests == null || testCounts.pass == null || testCounts.fail == null || testCounts.skipped == null || testCounts.cancelled == null) return "missing-test-counts";
  if (testCounts.tests === 0) return "no-tests";
  if (testCounts.fail !== 0 || testCounts.skipped !== 0 || testCounts.cancelled !== 0 || testCounts.pass !== testCounts.tests) return "test-assertion-failure";
  if (behavior.status !== 0) return "behavior-failure";
  return "pass";
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  if (!options.fixture || !options.adapter || !options.model || !options["work-dir"] || !options["evidence-dir"]) {
    fail("--fixture, --adapter, --model, --work-dir, and --evidence-dir are required (see --help)");
  }
  if (!['claude', 'codex'].includes(options.adapter)) fail("--adapter must be claude or codex");
  if (!['low', 'medium', 'high', 'xhigh', 'max'].includes(options.effort)) fail("--effort must be low, medium, high, xhigh, or max");
  if (!/^\d+(?:\.\d{1,2})?$/.test(options["budget-usd"]) || Number(options["budget-usd"]) <= 0) fail("--budget-usd must be a positive dollar amount with at most two decimals");

  const taskPath = join(FIXTURES, `${options.fixture}.json`);
  if (!existsSync(taskPath)) fail(`unknown fixture: ${options.fixture}`);
  const task = JSON.parse(readFileSync(taskPath, "utf8"));
  const workDir = resolve(options["work-dir"]);
  const evidenceDir = resolve(options["evidence-dir"]);
  const relativeWork = relative(REPO, workDir);
  if (!relativeWork || (!relativeWork.startsWith("..") && !isAbsolute(relativeWork))) fail("--work-dir must be outside the repository");
  if (existsSync(workDir)) fail(`--work-dir already exists: ${workDir}`);
  if (existsSync(evidenceDir)) fail(`--evidence-dir already exists: ${evidenceDir}`);

  const cliValue = options.adapter === "claude" ? options["claude-exe"] : options["codex-exe"];
  if (!cliValue || !isAbsolute(cliValue)) fail(`--${options.adapter}-exe must be an absolute path to the native CLI executable`);
  const cliPath = resolve(cliValue);
  if (!existsSync(cliPath)) fail(`CLI executable does not exist: ${cliPath}`);
  if (options.adapter === "codex") {
    const host = join(dirname(cliPath), "codex-code-mode-host.exe");
    if (!existsSync(host)) fail(`Codex sibling code-mode host is missing: ${host}`);
  }

  mkdirSync(dirname(evidenceDir), { recursive: true });
  mkdirSync(evidenceDir);
  const created = run(process.execPath, [CREATE_FIXTURE, "create", "--variant", "trunk", "--dir", workDir]);
  writeCapture(evidenceDir, "fixture-create.stdout.json", created.stdout);
  writeCapture(evidenceDir, "fixture-create.stderr.txt", created.stderr);
  if (created.status !== 0) fail(`fixture creation failed: ${created.error ?? created.stderr ?? created.stdout}`);
  const fixtureIdentity = JSON.parse(created.stdout);
  const generatedTree = fixtureIdentity.tree;
  fixtureIdentity.tree = freezeFixture(workDir, task.seedTree);
  const seedCommit = git(workDir, "rev-parse", "HEAD");
  const ticketText = readFileSync(join(workDir, task.ticketFile), "utf8");
  const nodeExe = process.execPath;
  const npmCommand = join(dirname(nodeExe), process.platform === "win32" ? "npm.cmd" : "npm");
  const nodeDirectory = dirname(nodeExe);
  const prompt = makePrompt(task, ticketText, options.adapter, npmCommand, nodeDirectory);
  const version = run(cliPath, ["--version"]);
  const args = options.adapter === "claude"
    ? claudeArgs(options.model, options.effort, options["budget-usd"], prompt)
    : codexArgs(options.model, options.effort, workDir, prompt);
  const agentStarted = Date.now();
  const agent = run(cliPath, args, { cwd: workDir });
  const durationMs = Date.now() - agentStarted;
  const stdoutName = options.adapter === "claude" ? "agent.stdout.json" : "agent.stdout.jsonl";
  const raw = {
    stdout: writeCapture(evidenceDir, stdoutName, agent.stdout),
    stderr: writeCapture(evidenceDir, "agent.stderr.txt", agent.stderr),
  };
  const adapterResult = options.adapter === "claude" ? parseClaudeOutput(agent.stdout) : parseCodexOutput(agent.stdout);
  const test = testCommand(workDir, nodeExe);
  const testOutput = `${test.stdout}${test.stderr}`;
  const testCapture = writeCapture(evidenceDir, "controller-test.txt", testOutput);
  const behavior = hiddenBehaviorCheck(workDir, task, nodeExe);
  const behaviorOutput = `${behavior.stdout}${behavior.stderr}`;
  const behaviorCapture = writeCapture(evidenceDir, "controller-behavior.txt", behaviorOutput);
  const fileGrade = gradeFiles(workDir, task, seedCommit);
  const headAfter = git(workDir, "rev-parse", "HEAD");
  const testCounts = parseTestCounts(testOutput);
  const classification = classifyResult({
    agent,
    adapterResult,
    fileGrade,
    seedUnchanged: seedCommit === headAfter,
    test,
    testCounts,
    behavior,
  });
  const passed = classification === "pass";
  const result = {
    schemaVersion: 1,
    runner: {
      source: "scripts/spike-model-eval.mjs",
      sourceCommit: git(REPO, "rev-parse", "HEAD"),
      sourceSha256: createHash("sha256").update(readFileSync(fileURLToPath(import.meta.url))).digest("hex"),
    },
    fixture: {
      id: task.id,
      ticketId: task.ticketId,
      seedTree: fixtureIdentity.tree,
      generatedTree,
      seedCommit,
      workingDirectory: workDir,
    },
    adapter: {
      name: options.adapter,
      executable: cliPath,
      version: version.stdout.trim() || null,
      requestedModel: options.model,
      observedModel: adapterResult.actualModel,
      sessionId: adapterResult.sessionId,
      threadId: adapterResult.threadId,
      requestedEffort: options.effort,
      sessionPersistence: options.adapter === "claude" ? "disabled by --no-session-persistence" : "disabled by --ephemeral",
      sandbox: options.adapter === "codex" ? "workspace-write" : "acceptEdits (CLI permission mode)",
      commandArgs: args,
      exitCode: agent.status,
      signal: agent.signal,
      error: agent.error,
      durationMs,
      nativeUsage: adapterResult.usage,
      cost: adapterResult.cost,
      nativeToolCommands: adapterResult.toolCommands,
      nativeTestRuns: adapterResult.testRuns,
      completed: adapterResult.complete,
    },
    grading: {
      status: classification,
      changedFiles: fileGrade.changedFiles,
      changeBaseCommit: seedCommit,
      outOfScopeFiles: fileGrade.outOfScope,
      sourceHasExpectedExport: fileGrade.sourceHasExport,
      sourceLacksForbiddenExport: fileGrade.sourceLacksForbidden,
      testSourceCases: fileGrade.testSourceCases,
      testCommand: process.platform === "win32" ? "npm.cmd test (PATH prepended with the active Node directory in the grading process)" : "npm test",
      testExitCode: test.status,
      testCounts,
      behaviorExitCode: behavior.status,
      commitUnchanged: seedCommit === headAfter,
      seedTreeMatches: fixtureIdentity.tree === task.seedTree,
    },
    raw,
    controllerTest: testCapture,
    controllerBehavior: behaviorCapture,
    limits: [
      "Cost follows the adapter's native report; null means no dollar amount was emitted.",
      "Codex's JSONL reports token usage but not a returned model identity or dollar cost.",
      "The Codex executable is an installed package-owned path; Harbor and Kiro ACP were not invoked by this runner.",
    ],
  };
  writeFileSync(join(evidenceDir, "result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ status: result.grading.status, result: join(evidenceDir, "result.json"), model: adapterResult.actualModel, cost: adapterResult.cost }, null, 2));
  if (!passed) process.exitCode = 1;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    console.error(`spike-model-eval: ${error.message}`);
    process.exitCode = 2;
  });
}

export { claudeArgs, codexArgs, parseClaudeOutput, parseCodexOutput, parseTestCounts, testCommand, classifyResult, changedFilesSince, gradeFiles, hiddenBehaviorCheck, freezeFixture };
