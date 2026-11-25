import "./test-git-env.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, test } from "node:test";

import {
  ackNotices,
  loadSyncPacks,
  registerPack,
  renderLaunchdPlist,
  renderSystemdUnits,
  runAutoSync,
  syncGitRepo,
  unregisterPack,
  writeNotice,
} from "./auto-sync.mjs";

const REPO_ROOT = resolve(new URL("..", import.meta.url).pathname);
const CLAUDE_HOOK = join(REPO_ROOT, ".claude-plugin", "hooks", "session-start.mjs");
const AGY_HOOK = join(REPO_ROOT, ".claude-plugin", "hooks", "agy-session-start.mjs");
const DSH_HOOK = join(REPO_ROOT, ".claude-plugin", "hooks", "dsh-session-start.mjs");

const cleanups = [];
afterEach(() => {
  while (cleanups.length) rmSync(cleanups.pop(), { recursive: true, force: true });
});

function makeTempDir(prefix = "agent-sync-test-") {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  cleanups.push(dir);
  return dir;
}

function git(cwd, ...args) {
  const res = spawnSync("git", ["-C", cwd, ...args], {
    encoding: "utf8",
    windowsHide: true,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
  if (res.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed in ${cwd}: ${res.stderr || res.stdout}`);
  }
  return res.stdout.trim();
}

function createRepoWithOrigin(root, name = "demo") {
  const origin = join(root, `${name}-origin.git`);
  const seed = join(root, `${name}-seed`);
  const repo = join(root, name);
  mkdirSync(origin, { recursive: true });
  git(origin, "init", "--bare", "-b", "main");
  git(root, "clone", origin, seed);
  git(seed, "config", "user.name", "Test User");
  git(seed, "config", "user.email", "test@example.com");
  writeFileSync(join(seed, "tracked.txt"), "v1\n");
  git(seed, "add", ".");
  git(seed, "commit", "-m", "init");
  git(seed, "push", "-u", "origin", "main");
  git(root, "clone", origin, repo);
  git(repo, "config", "user.name", "Test User");
  git(repo, "config", "user.email", "test@example.com");
  return { origin, seed, repo };
}

function pushUpstreamCommit(seed, file, content, msg = "upstream update") {
  writeFileSync(join(seed, file), content);
  git(seed, "add", ".");
  git(seed, "commit", "-m", msg);
  git(seed, "push", "origin", "main");
  return git(seed, "rev-parse", "HEAD");
}

test("syncGitRepo fast-forwards a clean behind-only checkout", () => {
  const root = makeTempDir();
  const { seed, repo } = createRepoWithOrigin(root);
  const upstreamSha = pushUpstreamCommit(seed, "tracked.txt", "v2\n");

  const outcome = syncGitRepo({ name: "demo", repo, branch: "main", remote: "origin", dirtyPolicy: "shelve-to-branch" });
  assert.equal(outcome.status, "ok");
  assert.equal(outcome.action, "updated");
  assert.equal(outcome.commitsPulled, 1);
  assert.equal(outcome.toSha, upstreamSha);
  assert.equal(readFileSync(join(repo, "tracked.txt"), "utf8"), "v2\n");
});

test("syncGitRepo shelves dirty tracked and untracked files to a WIP branch and updates main", () => {
  const root = makeTempDir();
  const { seed, repo } = createRepoWithOrigin(root);
  const upstreamSha = pushUpstreamCommit(seed, "tracked.txt", "v2-upstream\n");

  writeFileSync(join(repo, "tracked.txt"), "dirty-tracked-edit\n");
  writeFileSync(join(repo, "untracked-note.txt"), "important-untracked-bytes\n");

  const outcome = syncGitRepo({
    name: "demo",
    repo,
    branch: "main",
    remote: "origin",
    dirtyPolicy: "shelve-to-branch",
  }, { now: new Date("2026-11-25T12:00:00Z") });

  assert.equal(outcome.status, "ok");
  assert.equal(outcome.action, "shelved-and-updated");
  assert.match(outcome.shelvedBranch, /^auto-sync\/wip-20261125-120000/);
  assert.equal(git(repo, "symbolic-ref", "--short", "HEAD"), "main");
  assert.equal(git(repo, "rev-parse", "HEAD"), upstreamSha);
  assert.equal(git(repo, "status", "--porcelain"), "");
  assert.equal(readFileSync(join(repo, "tracked.txt"), "utf8"), "v2-upstream\n");
  assert.equal(existsSync(join(repo, "untracked-note.txt")), false);

  // Exact dirty bytes are preserved on the shelved branch
  assert.equal(git(repo, "show", `${outcome.shelvedBranch}:tracked.txt`), "dirty-tracked-edit");
  assert.equal(git(repo, "show", `${outcome.shelvedBranch}:untracked-note.txt`), "important-untracked-bytes");
});

test("syncGitRepo shelves dirty files from a feature branch without touching the feature branch ref", () => {
  const root = makeTempDir();
  const { seed, repo } = createRepoWithOrigin(root);
  git(repo, "checkout", "-b", "feat/work");
  writeFileSync(join(repo, "feat.txt"), "committed-on-feat\n");
  git(repo, "add", ".");
  git(repo, "commit", "-m", "feat commit");
  const featSha = git(repo, "rev-parse", "HEAD");
  writeFileSync(join(repo, "feat.txt"), "dirty-on-feat\n");

  const upstreamSha = pushUpstreamCommit(seed, "tracked.txt", "v2\n");
  const outcome = syncGitRepo({ name: "demo", repo, branch: "main", remote: "origin", dirtyPolicy: "shelve-to-branch" });

  assert.equal(outcome.status, "ok");
  assert.equal(outcome.action, "shelved-and-updated");
  assert.equal(outcome.origBranch, "feat/work");
  assert.equal(git(repo, "rev-parse", "refs/heads/feat/work"), featSha);
  assert.equal(git(repo, "show", `${outcome.shelvedBranch}:feat.txt`), "dirty-on-feat");
  assert.equal(git(repo, "symbolic-ref", "--short", "HEAD"), "main");
  assert.equal(git(repo, "rev-parse", "HEAD"), upstreamSha);
});

test("syncGitRepo preserves diverged local main commits on a backup branch before aligning main", () => {
  const root = makeTempDir();
  const { seed, repo } = createRepoWithOrigin(root);
  writeFileSync(join(repo, "local.txt"), "local-commit\n");
  git(repo, "add", ".");
  git(repo, "commit", "-m", "local work");
  const localSha = git(repo, "rev-parse", "HEAD");

  const upstreamSha = pushUpstreamCommit(seed, "tracked.txt", "v2\n");
  const outcome = syncGitRepo({ name: "demo", repo, branch: "main", remote: "origin", dirtyPolicy: "shelve-to-branch" });

  assert.equal(outcome.status, "ok");
  assert.equal(outcome.action, "shelved-diverged-and-updated");
  assert.match(outcome.shelvedBranch, /^auto-sync\/local-main-/);
  assert.equal(git(repo, "rev-parse", `refs/heads/${outcome.shelvedBranch}`), localSha);
  assert.equal(git(repo, "rev-parse", "HEAD"), upstreamSha);
});

test("syncGitRepo holds clean strictly-ahead main without discarding unpushed commits", () => {
  const root = makeTempDir();
  const { repo } = createRepoWithOrigin(root);
  writeFileSync(join(repo, "ahead.txt"), "unpushed\n");
  git(repo, "add", ".");
  git(repo, "commit", "-m", "local ahead");
  const localSha = git(repo, "rev-parse", "HEAD");

  const outcome = syncGitRepo({ name: "demo", repo, branch: "main", remote: "origin", dirtyPolicy: "shelve-to-branch" });
  assert.equal(outcome.status, "held");
  assert.equal(outcome.action, "held-local-ahead");
  assert.equal(outcome.ahead, 1);
  assert.equal(git(repo, "rev-parse", "HEAD"), localSha);
});

test("syncGitRepo skips when git index.lock is active", () => {
  const root = makeTempDir();
  const { repo } = createRepoWithOrigin(root);
  writeFileSync(join(repo, ".git", "index.lock"), "");

  const outcome = syncGitRepo({ name: "demo", repo, branch: "main", remote: "origin", dirtyPolicy: "shelve-to-branch" });
  assert.equal(outcome.status, "busy");
  assert.equal(outcome.action, "skipped");
});

test("inclusive packs.d discovery, register/unregister, ordering, and error isolation", () => {
  const root = makeTempDir();
  const configDir = join(root, "config");
  const stateDir = join(root, "state");
  const portfolioPath = join(root, "skill-packs.json");
  const gmMock = createRepoWithOrigin(root, "grey-matter");
  const tktMock = createRepoWithOrigin(root, "tkt");
  const extA = createRepoWithOrigin(root, "ext-alpha");

  writeFileSync(portfolioPath, JSON.stringify({
    schemaVersion: 1,
    packs: [
      { name: "grey-matter", path: "./grey-matter" },
      { name: "tkt", path: "./tkt" },
    ],
  }));

  const regFile = registerPack({ name: "ext-alpha", repo: extA.repo, order: 40, deploy: { type: "none" } }, { configDir });
  assert.ok(existsSync(regFile));

  // Invalid drop-in should warn without blocking valid packs
  writeFileSync(join(configDir, "packs.d", "broken.json"), "{ not json");
  writeFileSync(join(configDir, "packs.d", "missing-repo.json"), JSON.stringify({
    schemaVersion: 1,
    name: "missing-ext",
    repo: join(root, "does-not-exist"),
    order: 60,
  }));

  const loaded = loadSyncPacks({ portfolioPath, configDir });
  assert.deepEqual(loaded.packs.map((p) => p.name), ["tkt", "grey-matter", "ext-alpha", "missing-ext"]);
  assert.equal(loaded.warnings.length, 1);

  pushUpstreamCommit(extA.seed, "tracked.txt", "ext-v2\n");
  const report = runAutoSync({ portfolioPath, configDir, stateDir, dryRun: false });
  assert.equal(report.status, "error"); // missing-ext failed
  const alphaReport = report.packs.find((p) => p.name === "ext-alpha");
  assert.equal(alphaReport.git.action, "updated");
  assert.equal(readFileSync(join(extA.repo, "tracked.txt"), "utf8"), "ext-v2\n");

  const noticesDir = join(stateDir, "notices");
  assert.equal(JSON.parse(readFileSync(join(noticesDir, "ext-alpha.json"), "utf8")).severity, "info");
  assert.equal(JSON.parse(readFileSync(join(noticesDir, "missing-ext.json"), "utf8")).severity, "error");

  assert.equal(unregisterPack("ext-alpha", { configDir }), true);
  assert.equal(existsSync(regFile), false);
  assert.ok(gmMock && tktMock);
});

test("shared notices bus surfaces updates once per harness and persists errors until acked", async () => {
  const root = makeTempDir();
  const stateDir = join(root, "state");
  const env = { ...process.env, AGENT_SYNC_STATE_DIR: stateDir };

  writeNotice(stateDir, "grey-matter", {
    id: "n-info-1",
    severity: "info",
    summary: "pulled 2 commit(s) on main; refreshed deployed skills/plugins",
    reloadRecommended: true,
  });
  writeNotice(stateDir, "third-party-pack", {
    id: "n-warn-1",
    severity: "warn",
    summary: "shelved 1 dirty change(s) to auto-sync/wip-20261125-120000",
    shelvedBranch: "auto-sync/wip-20261125-120000",
    reloadRecommended: true,
  });

  const sessionPayload = JSON.stringify({ hook_event_name: "SessionStart" });

  // Claude: first session sees notices; second is silent
  const c1 = spawnSync(process.execPath, [CLAUDE_HOOK], { input: sessionPayload, encoding: "utf8", env });
  assert.equal(c1.status, 0);
  assert.match(c1.stdout, /\[agent-sync\] Updates & notices:/);
  assert.match(c1.stdout, /grey-matter \(INFO\)/);
  assert.match(c1.stdout, /third-party-pack \(WARN\)/);
  assert.match(c1.stdout, /auto-sync\/wip-20261125-120000/);

  const c2 = spawnSync(process.execPath, [CLAUDE_HOOK], { input: sessionPayload, encoding: "utf8", env });
  assert.equal(c2.status, 0);
  assert.equal(c2.stdout, "");

  // ZCode: emits JSON hookEventName envelope
  const z1 = spawnSync(process.execPath, [CLAUDE_HOOK], { input: sessionPayload, encoding: "utf8", env: { ...env, ZCODE_SESSION_ID: "z1" } });
  assert.equal(z1.status, 0);
  const zParsed = JSON.parse(z1.stdout);
  assert.equal(zParsed.hookEventName, "SessionStart");
  assert.match(zParsed.additionalContext, /third-party-pack \(WARN\)/);

  // Qwen: independent seen tracker
  const q1 = spawnSync(process.execPath, [CLAUDE_HOOK], { input: sessionPayload, encoding: "utf8", env: { ...env, QWEN_PROJECT_DIR: root } });
  assert.equal(q1.status, 0);
  assert.match(q1.stdout, /grey-matter \(INFO\)/);

  // Antigravity: emits injectSteps JSON
  const a1 = spawnSync(process.execPath, [AGY_HOOK], { input: "{}", encoding: "utf8", env });
  assert.equal(a1.status, 0);
  const aParsed = JSON.parse(a1.stdout);
  assert.match(aParsed.injectSteps[0].systemMessage.systemMessage, /grey-matter \(INFO\)/);
  const a2 = spawnSync(process.execPath, [AGY_HOOK], { input: "{}", encoding: "utf8", env });
  assert.equal(a2.stdout, "");

  // DSH hook module: injects on agent/created, skips resume
  const prevState = process.env.AGENT_SYNC_STATE_DIR;
  process.env.AGENT_SYNC_STATE_DIR = stateDir;
  try {
    const dshMod = await import(pathToFileURL(DSH_HOOK).href);
    let handler = null;
    const injected = [];
    dshMod.apply({
      on(evt, fn) { if (evt === "agent/created") handler = fn; },
    });
    const fakeAgent = { inject(msg) { injected.push(msg); } };
    await handler({ agent: fakeAgent, source: "resume" });
    assert.equal(injected.length, 0);
    await handler({ agent: fakeAgent, source: "new" });
    assert.equal(injected.length, 1);
    assert.match(injected[0].content[0].text, /grey-matter \(INFO\)/);
    await handler({ agent: fakeAgent, source: "new" });
    assert.equal(injected.length, 1);
  } finally {
    if (prevState === undefined) delete process.env.AGENT_SYNC_STATE_DIR;
    else process.env.AGENT_SYNC_STATE_DIR = prevState;
  }

  // Error notices persist across sessions until ackNotices()
  writeNotice(stateDir, "tkt", { id: "n-err-1", severity: "error", summary: "cargo build failed" });
  const e1 = spawnSync(process.execPath, [CLAUDE_HOOK], { input: sessionPayload, encoding: "utf8", env });
  assert.match(e1.stdout, /tkt \(ERROR\)/);
  const e2 = spawnSync(process.execPath, [CLAUDE_HOOK], { input: sessionPayload, encoding: "utf8", env });
  assert.match(e2.stdout, /tkt \(ERROR\)/);
  ackNotices({ stateDir, pack: "tkt" });
  const e3 = spawnSync(process.execPath, [CLAUDE_HOOK], { input: sessionPayload, encoding: "utf8", env });
  assert.equal(e3.stdout, "");
});

test("scheduler unit and plist templates configure 12-hour cadence", () => {
  const units = renderSystemdUnits({ hours: 12, nodeExe: "/usr/bin/node", scriptPath: "/opt/gm/scripts/auto-sync.mjs", workingDir: "/opt/gm", pathEnv: "/usr/bin" });
  assert.match(units.timer, /OnUnitActiveSec=12h/);
  assert.match(units.timer, /Persistent=true/);
  assert.match(units.service, /ExecStart="\/usr\/bin\/node" "\/opt\/gm\/scripts\/auto-sync\.mjs" run/);

  const plist = renderLaunchdPlist({ hours: 12, nodeExe: "/usr/bin/node", scriptPath: "/opt/gm/scripts/auto-sync.mjs", workingDir: "/opt/gm", stateDir: "/tmp/state", pathEnv: "/usr/bin" });
  assert.match(plist, /<integer>43200<\/integer>/);
  assert.match(plist, /dev\.smileynet\.agent-sync/);
});
