#!/usr/bin/env node
// gate.mjs reference version 1 (grey-matter proposal 18). Projects vendor this file; keep this
// line so conformance-audit can report drift from the reference.
//
// Runs the checks that scripts/gates.json declares for one stage, selected by changed paths.
// The runner owns every timeout: node:test reports a test blocked in spawnSync past its own
// timeout as "ok", so only killing the process tree from outside bounds a check.
//
// Usage: node scripts/gate.mjs <pre-push|pre-merge|pre-release> [--stdin --remote NAME]
//                              [--base REF] [--include ID]... [--manifest PATH]
//   --stdin   read Git pre-push lines (<local ref> <local sha> <remote ref> <remote sha>).
//   --base    pre-merge range start; default: merge-base of HEAD with origin/main.
//   SKIP=id,id  skip named checks; they are reported, never silent.
// Checks run in a detached worktree of the commit being judged (each pushed tip, else HEAD), so
// uncommitted files, including another session's in a shared checkout, never pass or block them.
// Exit: 0 every selected check passed; 1 a check failed, timed out or could not run; 2 usage.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const STAGES = ["pre-push", "pre-merge", "pre-release"];
const ZERO = /^0+$/;

function usage(message) {
  console.error(`gate: ${message}\nusage: node scripts/gate.mjs <${STAGES.join("|")}> [--stdin --remote NAME] [--base REF] [--include ID]... [--manifest PATH]`);
  process.exit(2);
}

const argv = process.argv.slice(2);
const opts = { include: [] };
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (STAGES.includes(arg) && !opts.stage) opts.stage = arg;
  else if (arg === "--stdin") opts.stdin = true;
  else if (["--remote", "--base", "--manifest", "--include"].includes(arg)) {
    if (i + 1 >= argv.length) usage(`${arg} needs a value`);
    if (arg === "--include") opts.include.push(argv[++i]);
    else opts[arg.slice(2)] = argv[++i];
  } else usage(`unknown argument ${arg}`);
}
if (!opts.stage) usage("a stage is required");

function git(...args) {
  const r = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  return r.status === 0 ? r.stdout.split("\n").filter(Boolean) : null;
}

const ROOT = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).stdout?.trim() || process.cwd();

// The manifest is project-authored input: reject a malformed one rather than guess.
function loadManifest(path) {
  let data;
  try { data = JSON.parse(readFileSync(path, "utf8")); } catch (error) { usage(`cannot read ${path}: ${error.message}`); }
  if (!Array.isArray(data?.checks)) usage(`${path}: "checks" must be an array`);
  const ids = new Set();
  for (const c of data.checks) {
    const where = `${path}: check ${JSON.stringify(c?.id)}`;
    if (typeof c?.id !== "string" || ids.has(c.id)) usage(`${where}: id must be a unique string`);
    ids.add(c.id);
    if (!STAGES.includes(c.stage)) usage(`${where}: stage must be one of ${STAGES.join(", ")}`);
    if (typeof c.catches !== "string" || !c.catches) usage(`${where}: "catches" names the failure it exists for`);
    if (!Array.isArray(c.run) || !c.run.length || c.run.some((a) => typeof a !== "string")) usage(`${where}: "run" must be a non-empty argv array`);
    if (!(c.timeout_s > 0)) usage(`${where}: "timeout_s" must be a positive number`);
    if (!c.always && (!Array.isArray(c.scope) || !c.scope.length)) usage(`${where}: give "scope" paths or "always": true`);
  }
  return { checks: data.checks, fullTriggers: data.full_triggers ?? [] };
}

// Paths changed by what is being published; null when the range cannot be known, which selects
// every check (unknown history selects more, never less).
function pushedPaths(input, remote, tips) {
  const paths = new Set();
  for (const line of input.split(/\r?\n/).filter(Boolean)) {
    const [, localSha, , remoteSha] = line.trim().split(/\s+/);
    if (!localSha || ZERO.test(localSha)) continue;
    tips.add(localSha);
    const range = remoteSha && !ZERO.test(remoteSha) ? [`${remoteSha}..${localSha}`] : [localSha, "--not", `--remotes=${remote ?? "origin"}`];
    const files = git("log", "--format=", "--name-only", ...range);
    if (!files) return null;
    for (const f of files) paths.add(f);
  }
  return [...paths];
}

function branchPaths(base) {
  const start = base ?? git("merge-base", "HEAD", "origin/main")?.[0];
  return start ? git("diff", "--name-only", start, "HEAD") : null;
}

// Scope entries are repo-relative path prefixes: "skills/" is a folder, "scripts/deploy" covers
// scripts/deploy.mjs and scripts/deploy.test.mjs.
const matches = (path, prefixes) => prefixes.some((p) => path.startsWith(p));

function killTree(child) {
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  else try { process.kill(-child.pid, "SIGKILL"); } catch { child.kill("SIGKILL"); }
}

// The worktree links the checkout's node_modules so checks find their pinned dependencies; the
// link is removed before the worktree, so removal can never reach through it.
async function inSnapshot(sha, fn) {
  const dir = mkdtempSync(join(tmpdir(), "gate-tree-"));
  if (!git("worktree", "add", "--detach", "--quiet", dir, sha)) {
    rmSync(dir, { recursive: true, force: true });
    return fn(null);
  }
  const link = join(dir, "node_modules");
  if (existsSync(join(ROOT, "node_modules")) && !existsSync(link)) symlinkSync(join(ROOT, "node_modules"), link, "junction");
  try { return await fn(dir); } finally {
    if (lstatSync(link, { throwIfNoEntry: false })?.isSymbolicLink()) unlinkSync(link);
    git("worktree", "remove", "--force", dir);
    rmSync(dir, { recursive: true, force: true });
  }
}

function runCheck(check, cwd) {
  if (!cwd) return Promise.resolve({ outcome: "infrastructure error", seconds: 0, output: "could not check out the commit being judged" });
  return new Promise((done) => {
    const temp = mkdtempSync(join(tmpdir(), "gate-"));
    const env = { ...process.env, CI: "true", GIT_TERMINAL_PROMPT: "0", TMPDIR: temp, TEMP: temp, TMP: temp };
    const started = Date.now();
    const [cmd, ...args] = check.run;
    const child = spawn(cmd === "node" ? process.execPath : cmd, args, {
      cwd, env, stdio: ["ignore", "pipe", "pipe"], detached: process.platform !== "win32", windowsHide: true,
    });
    let output = "", timedOut = false;
    child.stdout.on("data", (d) => { output += d; });
    child.stderr.on("data", (d) => { output += d; });
    const timer = setTimeout(() => { timedOut = true; killTree(child); }, check.timeout_s * 1000);
    const finish = (outcome) => {
      clearTimeout(timer);
      child.stdout.destroy(); child.stderr.destroy();
      rmSync(temp, { recursive: true, force: true });
      done({ outcome, seconds: (Date.now() - started) / 1000, output });
    };
    child.on("error", (error) => { output += error.message; finish("infrastructure error"); });
    child.on("exit", (code) => finish(timedOut ? "timeout" : code === 0 ? "pass" : "fail"));
  });
}

async function readStdin() {
  let text = "";
  for await (const chunk of process.stdin) text += chunk;
  return text;
}

const { checks, fullTriggers } = loadManifest(resolve(ROOT, opts.manifest ?? "scripts/gates.json"));
const unknown = opts.include.filter((id) => !checks.some((c) => c.id === id));
if (unknown.length) usage(`--include names no check: ${unknown.join(", ")}`);

let paths = null, source = "every check in the stage";
const tips = new Set();
if (opts.stage !== "pre-release") {
  paths = opts.stdin ? pushedPaths(await readStdin(), opts.remote, tips) : branchPaths(opts.base);
  if (paths === null) source = "range unknown: every check in the stage";
  else if (paths.some((p) => fullTriggers.includes(p))) { source = "a full trigger changed: every check in the stage"; paths = null; }
  else source = `${paths.length} changed path(s)`;
}
const inStage = checks.filter((c) => c.stage === opts.stage);
const selected = checks.filter((c) => opts.include.includes(c.id) || (c.stage === opts.stage &&
  (paths === null || c.always || paths.some((p) => matches(p, c.scope)))));
const skip = new Set((process.env.SKIP ?? "").split(",").map((s) => s.trim()).filter(Boolean));

if (!opts.stdin) tips.add(git("rev-parse", "HEAD")?.[0] ?? "HEAD");
console.log(`gate ${opts.stage}: ${selected.length} of ${inStage.length} check(s) selected (${source})`);
let failed = 0;
const toRun = selected.filter((c) => !skip.has(c.id));
for (const check of selected.filter((c) => skip.has(c.id))) console.log(`  [skip]           ${check.id}: skipped (SKIP)`);
for (const tip of toRun.length ? tips : []) {
  if (tips.size > 1) console.log(`  at ${tip.slice(0, 12)}`);
  await inSnapshot(tip, async (cwd) => {
    for (const check of toRun) {
      const r = await runCheck(check, cwd);
      const ok = r.outcome === "pass";
      if (!ok) failed++;
      const slow = check.measured?.s && r.seconds > 2 * check.measured.s + 1 ? ` (measured ${check.measured.s}s on ${check.measured.date})` : "";
      console.log(`  [${ok ? "ok  " : "FAIL"}] ${r.seconds.toFixed(1).padStart(6)}s  ${check.id}${ok ? "" : `: ${r.outcome}`}${slow}`);
      if (!ok) console.log(r.output.replace(/^/gm, "      ").trimEnd() || "      (no output)");
    }
  });
}
if (failed) console.error(`gate ${opts.stage}: ${failed} check(s) did not pass. Fix them, or skip one knowingly with SKIP=<id>.`);
process.exit(failed ? 1 : 0);
