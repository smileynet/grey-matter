import "./test-git-env.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  EFFORTS,
  MODELS,
  PINNED_CODEX_HOST_SHA256,
  RUNNABLE_PROVIDERS,
  buildArgv,
  buildPrompt,
  childEnvironment,
  directoryIdentity,
  dispatchCli,
  hashPreparedPlan,
  hasSameDirectoryIdentity,
  makePlan,
  profileList,
  readNativeOutput,
  verifyHashPinnedFile,
} from "./spike-model-effort-t171.mjs";

const hash = (value) => createHash("sha256").update(value).digest("hex");
const syntheticPrivateInputHashes = Object.freeze({
  answerKeySha256: hash("public synthetic answer key fixture for ticket 171 tests"),
  rubricSha256: hash("public synthetic grading rubric fixture for ticket 171 tests"),
});
const tempRoots = [];
function tempRoot(prefix) {
  const path = mkdtempSync(join(tmpdir(), prefix));
  tempRoots.push(path);
  return path;
}
function makeTestPlan() {
  return makePlan({
    privateRoot: tempRoot("t171-private-"),
    tempRoot: tempRoot("t171-work-"),
    privateInputHashes: syntheticPrivateInputHashes,
  });
}
function canonical(value) {
  return `${JSON.stringify(value)}\n`;
}
function persistPlanAndAuthorization(plan, { authorizationOverrides = {} } = {}) {
  const planPath = join(plan.privateRoot, "prepared-plan.json");
  const authorizationPath = join(plan.privateRoot, "authorization.json");
  const planBytes = Buffer.from(canonical(plan), "utf8");
  writeFileSync(planPath, planBytes, { flag: "wx" });
  const authorization = {
    schemaVersion: 1,
    nativeLeaseReleased: true,
    protocolSha256: plan.protocolSha256,
    controllerSha256: plan.controllerSha256,
    planSha256: plan.planSha256,
    planBytesSha256: hash(planBytes),
    answerKeySha256: plan.privateInputHashes.answerKeySha256,
    rubricSha256: plan.privateInputHashes.rubricSha256,
    limits: plan.limits,
    cells: [plan.cells[0].cellId],
    criticCommit: "a".repeat(40),
    leaseId: "test-lease",
    ...authorizationOverrides,
  };
  writeFileSync(authorizationPath, canonical(authorization), { flag: "wx" });
  return { planPath, authorizationPath, authorization };
}
const testDependencies = {
  readPrivateInputs: () => syntheticPrivateInputHashes,
  verifyExecutable: () => {},
};
test.after(() => {
  for (const path of tempRoots) rmSync(path, { recursive: true, force: true });
});

test("the frozen matrix lists runnable, held, and blocked cells separately", () => {
  assert.deepEqual(RUNNABLE_PROVIDERS, ["claude", "codex"]);
  assert.equal(profileList().filter((row) => row.state === "planned").length, 20);
  assert.equal(profileList().filter((row) => row.state === "held-model-effort-unverified").length, 10);
  assert.equal(profileList().filter((row) => row.state === "security-blocked-no-command").length, 10);
  assert.ok(profileList().filter((row) => row.provider === "google").every((row) => !("executable" in row)));
  assert.throws(() => makePlan({ privateRoot: tempRoot("t171-private-"), tempRoot: tempRoot("t171-work-"), privateInputHashes: syntheticPrivateInputHashes, providers: ["kiro"] }), /not cleared/);
  assert.throws(() => makePlan({ privateRoot: tempRoot("t171-private-"), tempRoot: tempRoot("t171-work-"), providers: ["claude"] }), /must be explicitly supplied/);
});

test("prompt packets contain fixture source without provider labels or private grading text", () => {
  for (const taskId of ["diagnosis", "design"]) {
    const fixture = JSON.parse(readFileSync(new URL(`./fixtures/model-effort-t171/${taskId}.json`, import.meta.url), "utf8"));
    const packet = buildPrompt(fixture);
    assert.ok(packet.includes(fixture.prompt));
    assert.ok(Object.keys(fixture.files).every((path) => packet.includes(path)));
    assert.doesNotMatch(packet, /claude|codex|kiro|qwen|gpt-6|opus|effort|answer-key|requiredFacts/i);
    assert.ok(!packet.includes("indefinite response replay"));
  }
});

test("argv builders freeze effort and keep task content as one positional argument", () => {
  for (const provider of RUNNABLE_PROVIDERS) {
    for (const effort of EFFORTS) {
      const argv = buildArgv(provider, effort, "synthetic task prompt", "C:/empty/cell");
      assert.ok(argv.includes(MODELS[provider]));
      assert.ok(argv.includes("synthetic task prompt"));
      assert.ok(argv.some((arg) => arg === effort || arg.includes(`model_reasoning_effort=\"${effort}\"`)));
      assert.equal(argv.filter((arg) => arg === "synthetic task prompt").length, 1);
    }
  }
  assert.throws(() => buildArgv("google", "low", "x", "C:/empty"), /not enabled/);
});

test("pinned-file verifier accepts matching fake bytes and rejects changed bytes", () => {
  const directory = tempRoot("t171-pinned-file-");
  const hostPath = join(directory, "codex-code-mode-host.exe");
  const pinnedFixture = Buffer.from("synthetic codex host bytes v1");
  writeFileSync(hostPath, pinnedFixture);
  assert.equal(PINNED_CODEX_HOST_SHA256, "977c1f01c9efac0bfe1b9032717c95f92e1c965c8441a8dacbfe824c5c79a527");
  assert.doesNotThrow(() => verifyHashPinnedFile(hostPath, hash(pinnedFixture), "Pinned Codex host"));
  writeFileSync(hostPath, Buffer.from("synthetic codex host bytes changed"));
  assert.throws(() => verifyHashPinnedFile(hostPath, hash(pinnedFixture), "Pinned Codex host"), /changed since protocol review/);
});

test("child environment is minimized and restores original environment exactly", () => {
  const before = process.env.CLAUDE_CODE_EFFORT_LEVEL;
  const hadOpenAiKey = Object.hasOwn(process.env, "OPENAI_API_KEY");
  const beforeOpenAiKey = process.env.OPENAI_API_KEY;
  process.env.CLAUDE_CODE_EFFORT_LEVEL = "max";
  process.env.OPENAI_API_KEY = "test-secret";
  try {
    const env = childEnvironment("claude", "low");
    assert.equal(env.CLAUDE_CODE_EFFORT_LEVEL, "low");
    assert.equal(env.OPENAI_API_KEY, undefined);
    assert.equal(env.PATH, process.env.PATH);
  } finally {
    if (before === undefined) delete process.env.CLAUDE_CODE_EFFORT_LEVEL;
    else process.env.CLAUDE_CODE_EFFORT_LEVEL = before;
    if (hadOpenAiKey) process.env.OPENAI_API_KEY = beforeOpenAiKey;
    else delete process.env.OPENAI_API_KEY;
  }
  assert.equal(process.env.CLAUDE_CODE_EFFORT_LEVEL, before);
  assert.equal(Object.hasOwn(process.env, "OPENAI_API_KEY"), hadOpenAiKey);
  assert.equal(process.env.OPENAI_API_KEY, beforeOpenAiKey);
});

test("the persisted execution entrypoint validates bytes and uses exact prepared argv/cwd", () => {
  const plan = makeTestPlan();
  const { planPath, authorizationPath } = persistPlanAndAuthorization(plan);
  const cell = plan.cells[0];
  assert.equal(hashPreparedPlan(JSON.parse(readFileSync(planPath, "utf8"))), plan.planSha256);
  assert.equal(readdirSync(cell.cwd).length, 0);
  const fakeNode = join(dirname(planPath), "fake-provider.mjs");
  writeFileSync(fakeNode, `process.stdout.write(JSON.stringify({type:"result",subtype:"success",result:"{}"}));\n`, { flag: "wx" });
  let observed;
  const receipt = JSON.parse(dispatchCli(["--execute", "--plan", planPath, "--authorization", authorizationPath, "--cell", cell.cellId], {
    privateRoot: plan.privateRoot,
    ...testDependencies,
    spawn(command, argv, options) {
      observed = { command, argv, cwd: options.cwd, env: options.env, shell: options.shell, maxBuffer: options.maxBuffer };
      return spawnSync(process.execPath, [fakeNode], {
        cwd: options.cwd,
        env: options.env,
        encoding: null,
        timeout: options.timeout,
        maxBuffer: options.maxBuffer,
        windowsHide: true,
        shell: false,
      });
    },
  }));
  assert.equal(observed.command, cell.executable);
  assert.deepEqual(observed.argv, cell.argv);
  assert.equal(observed.cwd, cell.cwd);
  assert.equal(observed.shell, false);
  assert.equal(observed.maxBuffer, 8 * 1024 * 1024);
  assert.equal(receipt.requestedModel, cell.requestedModel);
  assert.equal(receipt.actualModelUnreported, true);
  assert.equal(receipt.actualEffortUnreported, true);
  assert.equal(receipt.nativeStatus, "complete");
  assert.equal("quality" in receipt, false);
  assert.equal(readdirSync(cell.cwd).length, 0);
  assert.throws(() => dispatchCli(["--execute", "--plan", planPath, "--authorization", authorizationPath, "--cell", cell.cellId], { privateRoot: plan.privateRoot, ...testDependencies, spawn() { assert.fail("one-shot cell must not spawn twice"); } }), /already exists/);
});

test("persisted untrusted plan and authorization mutations fail before spawn", () => {
  const plan = makeTestPlan();
  const { planPath, authorizationPath } = persistPlanAndAuthorization(plan);
  const cell = plan.cells[0];
  let spawnCount = 0;
  const options = ["--execute", "--plan", planPath, "--authorization", authorizationPath, "--cell", cell.cellId];
  const dependencies = { privateRoot: plan.privateRoot, ...testDependencies, spawn() { spawnCount++; } };
  const originalPlan = readFileSync(planPath, "utf8");
  const tamperedPlan = JSON.parse(originalPlan);
  tamperedPlan.cells[0].argv[tamperedPlan.cells[0].argv.length - 1] = "changed prompt";
  writeFileSync(planPath, canonical(tamperedPlan));
  assert.throws(() => dispatchCli(options, dependencies), /digest or identity is invalid/);
  writeFileSync(planPath, originalPlan);
  const originalAuthorization = readFileSync(authorizationPath, "utf8");
  const tamperedAuthorization = JSON.parse(originalAuthorization);
  tamperedAuthorization.limits.timeoutMs += 1;
  writeFileSync(authorizationPath, canonical(tamperedAuthorization));
  assert.throws(() => dispatchCli(options, dependencies), /execution caps/);
  writeFileSync(authorizationPath, originalAuthorization);
  const wrongKeyAuthorization = JSON.parse(originalAuthorization);
  wrongKeyAuthorization.answerKeySha256 = hash("different key");
  writeFileSync(authorizationPath, canonical(wrongKeyAuthorization));
  assert.throws(() => dispatchCli(options, dependencies), /does not bind the private grading inputs/);
  writeFileSync(authorizationPath, originalAuthorization);
  const wrongPlanBytesAuthorization = JSON.parse(originalAuthorization);
  wrongPlanBytesAuthorization.planBytesSha256 = hash("different plan bytes");
  writeFileSync(authorizationPath, canonical(wrongPlanBytesAuthorization));
  assert.throws(() => dispatchCli(options, dependencies), /does not bind these exact source and plan bytes/);
  writeFileSync(authorizationPath, originalAuthorization);
  assert.throws(() => dispatchCli(options, {
    ...dependencies,
    readPrivateInputs: () => ({ ...syntheticPrivateInputHashes, answerKeySha256: hash("changed private key") }),
  }), /Private answer-key or grading rubric changed/);
  writeFileSync(authorizationPath, originalAuthorization.replace("\n", " \n"));
  assert.throws(() => dispatchCli(options, dependencies), /not canonical JSON/);
  assert.equal(spawnCount, 0);
});

test("the CLI execute switch parses its real trust-boundary invocation without spawning on invalid paths", () => {
  const script = fileURLToPath(new URL("./spike-model-effort-t171.mjs", import.meta.url));
  const result = spawnSync(process.execPath, [script, "--execute", "--plan", "relative-plan.json", "--authorization", "relative-auth.json", "--cell", "T171-claude-diagnosis-low"], {
    cwd: tempRoot("t171-cli-").replace(/[\\/]$/, ""),
    encoding: "utf8",
    windowsHide: true,
    shell: false,
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /path must be absolute/);
  assert.equal(result.signal, null);
});

test("a different empty directory at the authorized path fails before fake Node spawn", () => {
  const plan = makeTestPlan();
  const { planPath, authorizationPath } = persistPlanAndAuthorization(plan);
  const cell = plan.cells[0];
  const replacement = mkdtempSync(join(plan.tempRoot, "replacement-"));
  const movedOriginal = join(plan.tempRoot, "original-moved-aside");
  renameSync(cell.cwd, movedOriginal);
  renameSync(replacement, cell.cwd);
  assert.equal(readdirSync(cell.cwd).length, 0);
  assert.notDeepEqual(directoryIdentity(cell.cwd, plan.tempRoot), cell.cwdIdentity);
  assert.equal(hasSameDirectoryIdentity(cell.cwd, plan.tempRoot, cell.cwdIdentity), false);
  assert.throws(() => dispatchCli(["--execute", "--plan", planPath, "--authorization", authorizationPath, "--cell", cell.cellId], { privateRoot: plan.privateRoot, ...testDependencies, spawn() { assert.fail("replacement must be rejected before spawn"); } }), /changed identity or is no longer empty/);
});

test("non-empty authorized cwd is rejected before executable verification or spawn", () => {
  const plan = makeTestPlan();
  const { planPath, authorizationPath } = persistPlanAndAuthorization(plan);
  const cell = plan.cells[0];
  writeFileSync(join(cell.cwd, "unexpected.txt"), "stop");
  let verified = false;
  assert.throws(() => dispatchCli(["--execute", "--plan", planPath, "--authorization", authorizationPath, "--cell", cell.cellId], {
    privateRoot: plan.privateRoot,
    readPrivateInputs: testDependencies.readPrivateInputs,
    verifyExecutable() { verified = true; },
    spawn() { assert.fail("spawn must not run"); },
  }), /changed identity or is no longer empty/);
  assert.equal(verified, false);
});

test("native output errors, limits, missing completion, and effort uncertainty stay distinct", () => {
  assert.equal(readNativeOutput("claude", Buffer.from("not json"), 0).status, "malformed-output");
  assert.equal(readNativeOutput("claude", Buffer.from(JSON.stringify({ type: "result", result: "ok", is_error: true })), 0).status, "embedded-infrastructure-error");
  assert.equal(readNativeOutput("codex", Buffer.from('{"type":"turn.completed"}\n'), 0).status, "empty-final-text");
  assert.equal(readNativeOutput("kiro", Buffer.from('{"type":"rate_limit","message":"quota exhausted"}\n'), 1).status, "usage-limit");
  const output = readNativeOutput("claude", Buffer.from(JSON.stringify({ type: "result", subtype: "success", result: "ok" })), 0);
  assert.equal(output.status, "complete");
  assert.equal(output.actualEffort, null);
});
