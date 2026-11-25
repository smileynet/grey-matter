#!/usr/bin/env node
// auto-sync.mjs — periodic (12h) sync & deploy runner for grey-matter, tkt, and drop-in packs.
//
// Usage:
//   node scripts/auto-sync.mjs run [--dry-run] [--force-deploy] [--only <pack>] [--portfolio <file>] [--json]
//   node scripts/auto-sync.mjs status [--json] [--portfolio <file>]
//   node scripts/auto-sync.mjs ack [--pack <name>]
//   node scripts/auto-sync.mjs register --name <name> --repo <dir> [--branch main] [--remote origin] [--order 50]
//                                       [--dirty-policy shelve-to-branch|hold] [--deploy-type deploy-mjs|command|none] [--deploy-cmd "..."]
//   node scripts/auto-sync.mjs unregister <name>
//   node scripts/auto-sync.mjs schedule install [--hours 12] [--dry-run]
//   node scripts/auto-sync.mjs schedule uninstall [--dry-run]
//   node scripts/auto-sync.mjs schedule status [--json]

import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync,
} from "node:fs";
import { homedir, platform } from "node:os";
import { delimiter, dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const GREY_MATTER_ROOT = resolve(HERE, "..");
const DEFAULT_PORTFOLIO = join(GREY_MATTER_ROOT, "skill-packs.json");
const PACK_NAME_RE = /^[a-z0-9][a-z0-9._-]*$/;

const isDir = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };
const isFile = (p) => { try { return statSync(p).isFile(); } catch { return false; } };

export function resolveConfigDir(env = process.env) {
  if (env.AGENT_SYNC_CONFIG_DIR) return resolve(env.AGENT_SYNC_CONFIG_DIR);
  const xdg = env.XDG_CONFIG_HOME || join(homedir(), ".config");
  return join(xdg, "agent-sync");
}

export function resolveStateDir(env = process.env) {
  if (env.AGENT_SYNC_STATE_DIR) return resolve(env.AGENT_SYNC_STATE_DIR);
  const xdg = env.XDG_STATE_HOME || join(homedir(), ".local", "state");
  return join(xdg, "agent-sync");
}

export function augmentedEnv(baseEnv = process.env) {
  const home = baseEnv.HOME || baseEnv.USERPROFILE || homedir();
  const candidates = [
    join(home, ".local", "share", "mise", "shims"),
    join(home, ".local", "bin"),
    join(home, ".cargo", "bin"),
    ...(process.platform === "darwin" ? ["/opt/homebrew/bin"] : []),
    "/usr/local/bin",
  ];
  const current = (baseEnv.PATH || "").split(delimiter).filter(Boolean);
  const missing = candidates.filter((dir) => !current.includes(dir) && isDir(dir));
  const pathValue = [...missing, ...current].join(delimiter);
  return {
    ...baseEnv,
    PATH: pathValue,
    GIT_TERMINAL_PROMPT: "0",
  };
}

function readJsonSafe(path, fallback = null) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJsonAtomic(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${randomUUID()}.tmp`;
  writeFileSync(tmp, JSON.stringify(value, null, 2) + "\n", { flag: "wx" });
  renameSync(tmp, path);
}

function runCmd(cmd, args, { cwd, env, timeout = 120000 } = {}) {
  const res = spawnSync(cmd, args, {
    cwd,
    env,
    encoding: "utf8",
    timeout,
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  });
  return {
    status: res.status ?? (res.error ? 1 : 0),
    stdout: res.stdout || "",
    stderr: res.stderr || "",
    error: res.error?.message || (res.signal ? `signal ${res.signal}` : null),
  };
}

function git(repo, args, { env, timeout = 30000 } = {}) {
  return runCmd("git", ["-C", repo, ...args], { env, timeout });
}

function timestampTag(now = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
}

function uniqueBranch(repo, baseName, env) {
  let candidate = baseName;
  let n = 2;
  while (git(repo, ["show-ref", "--verify", "--quiet", `refs/heads/${candidate}`], { env }).status === 0) {
    candidate = `${baseName}-${n++}`;
  }
  return candidate;
}

function resolveTktBinary(env) {
  const locator = process.platform === "win32" ? "where.exe" : "which";
  const res = runCmd(locator, ["tkt"], { env, timeout: 5000 });
  if (res.status !== 0) return null;
  const hit = res.stdout.split(/\r?\n/).map((s) => s.trim()).find(Boolean);
  return hit || null;
}

// --- Lockfile -------------------------------------------------------------------------------

function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err?.code === "EPERM";
  }
}

function acquireLock(stateDir) {
  const lockPath = join(stateDir, "auto-sync.lock");
  mkdirSync(stateDir, { recursive: true });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      writeFileSync(lockPath, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }) + "\n", { flag: "wx" });
      return () => {
        try {
          const cur = readJsonSafe(lockPath);
          if (!cur || cur.pid === process.pid) rmSync(lockPath, { force: true });
        } catch {}
      };
    } catch (err) {
      if (err?.code !== "EEXIST") throw err;
      const existing = readJsonSafe(lockPath);
      if (existing?.pid && isPidAlive(existing.pid)) {
        throw new Error(`another auto-sync instance is running (pid ${existing.pid}, started ${existing.startedAt || "unknown"})`);
      }
      rmSync(lockPath, { force: true });
    }
  }
  throw new Error(`unable to acquire lock at ${lockPath}`);
}

// --- Inclusive pack discovery ---------------------------------------------------------------

export function validateDropInSpec(raw, sourceFile = "<drop-in>") {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: `${sourceFile}: expected a JSON object` };
  }
  if (raw.schemaVersion !== 1) {
    return { ok: false, error: `${sourceFile}: schemaVersion must be 1` };
  }
  if (typeof raw.name !== "string" || !PACK_NAME_RE.test(raw.name)) {
    return { ok: false, error: `${sourceFile}: invalid pack name "${raw.name}"` };
  }
  if (typeof raw.repo !== "string" || !isAbsolute(raw.repo)) {
    return { ok: false, error: `${sourceFile}: repo must be an absolute path` };
  }
  if (raw.dirtyPolicy !== undefined && !["shelve-to-branch", "hold"].includes(raw.dirtyPolicy)) {
    return { ok: false, error: `${sourceFile}: invalid dirtyPolicy "${raw.dirtyPolicy}"` };
  }
  if (raw.order !== undefined && typeof raw.order !== "number") {
    return { ok: false, error: `${sourceFile}: order must be a number` };
  }
  if (raw.verifyFresh !== undefined && (!Array.isArray(raw.verifyFresh) || raw.verifyFresh.some((x) => typeof x !== "string"))) {
    return { ok: false, error: `${sourceFile}: verifyFresh must be a string array` };
  }
  if (raw.postPull !== undefined && (!Array.isArray(raw.postPull) || raw.postPull.some((cmd) => !Array.isArray(cmd) || cmd.some((x) => typeof x !== "string")))) {
    return { ok: false, error: `${sourceFile}: postPull must be an array of string arrays` };
  }
  if (raw.deploy !== undefined) {
    if (!raw.deploy || typeof raw.deploy !== "object" || !["deploy-mjs", "command", "none"].includes(raw.deploy.type)) {
      return { ok: false, error: `${sourceFile}: deploy.type must be deploy-mjs, command, or none` };
    }
    if (raw.deploy.argv !== undefined && (!Array.isArray(raw.deploy.argv) || raw.deploy.argv.some((x) => typeof x !== "string"))) {
      return { ok: false, error: `${sourceFile}: deploy.argv must be a string array` };
    }
    if (raw.deploy.type === "command" && (!raw.deploy.argv || !raw.deploy.argv.length)) {
      return { ok: false, error: `${sourceFile}: deploy.type="command" requires non-empty deploy.argv` };
    }
  }
  return { ok: true };
}

export function loadSyncPacks({ portfolioPath = DEFAULT_PORTFOLIO, configDir = resolveConfigDir() } = {}) {
  const warnings = [];
  const byName = new Map();

  const portfolio = readJsonSafe(portfolioPath);
  if (!portfolio?.packs || !Array.isArray(portfolio.packs)) {
    throw new Error(`cannot read portfolio manifest at ${portfolioPath}`);
  }

  for (const entry of portfolio.packs) {
    if (entry.inventoryOnly) continue;
    const repo = resolve(dirname(portfolioPath), entry.path);
    const defaultOrder = entry.name === "tkt" ? 10 : entry.name === "grey-matter" ? 20 : 30;
    byName.set(entry.name, {
      name: entry.name,
      repo,
      optional: Boolean(entry.optional),
      portfolioMember: true,
      branch: "main",
      remote: "origin",
      order: defaultOrder,
      dirtyPolicy: "shelve-to-branch",
      verifyFresh: null,
      postPull: [],
      deploy: { type: "portfolio" },
      source: portfolioPath,
    });
  }

  const packsDir = join(configDir, "packs.d");
  if (isDir(packsDir)) {
    for (const file of readdirSync(packsDir).filter((f) => f.endsWith(".json")).sort()) {
      const fullPath = join(packsDir, file);
      const raw = readJsonSafe(fullPath, undefined);
      if (raw === undefined) {
        warnings.push(`${fullPath}: invalid JSON`);
        continue;
      }
      const check = validateDropInSpec(raw, fullPath);
      if (!check.ok) {
        warnings.push(check.error);
        continue;
      }
      if (raw.enabled === false) continue;

      if (byName.has(raw.name)) {
        const existing = byName.get(raw.name);
        if (raw.branch) existing.branch = raw.branch;
        if (raw.remote) existing.remote = raw.remote;
        if (typeof raw.order === "number") existing.order = raw.order;
        if (raw.dirtyPolicy) existing.dirtyPolicy = raw.dirtyPolicy;
        warnings.push(`${fullPath}: extended non-portfolio settings for built-in pack "${raw.name}" (repo/deploy remain portfolio-owned)`);
        continue;
      }

      byName.set(raw.name, {
        name: raw.name,
        repo: resolve(raw.repo),
        optional: false,
        portfolioMember: false,
        branch: raw.branch || "main",
        remote: raw.remote || "origin",
        order: typeof raw.order === "number" ? raw.order : 50,
        dirtyPolicy: raw.dirtyPolicy || "shelve-to-branch",
        verifyFresh: raw.verifyFresh || null,
        postPull: raw.postPull || [],
        deploy: raw.deploy || { type: "none" },
        source: fullPath,
      });
    }
  }

  const packs = [...byName.values()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  return { packs, warnings };
}

// --- Safe Git Sync & Dirty-to-Branch Shelving -----------------------------------------------

export function syncGitRepo(pack, { dryRun = false, env = augmentedEnv(), now = new Date() } = {}) {
  const repo = pack.repo;
  const branch = pack.branch || "main";
  const remote = pack.remote || "origin";

  if (!isDir(repo)) {
    return {
      status: pack.optional ? "skipped" : "error",
      action: "missing-repo",
      error: `repository directory not found: ${repo}`,
      changed: false,
    };
  }

  const gitDirRes = git(repo, ["rev-parse", "--git-dir"], { env });
  if (gitDirRes.status !== 0) {
    return { status: "error", action: "not-a-git-repo", error: gitDirRes.stderr.trim() || gitDirRes.error, changed: false };
  }
  const gitDir = resolve(repo, gitDirRes.stdout.trim());

  const busyMarkers = ["index.lock", "MERGE_HEAD", "REBASE_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD", "rebase-merge", "rebase-apply"];
  const hitMarker = busyMarkers.find((m) => existsSync(join(gitDir, m)));
  if (hitMarker) {
    return { status: "busy", action: "skipped", reason: `git operation in progress (${hitMarker})`, changed: false };
  }

  const fetchRes = git(repo, ["fetch", "--quiet", remote], { env, timeout: 30000 });
  if (fetchRes.status !== 0) {
    const branchRes = git(repo, ["symbolic-ref", "--short", "-q", "HEAD"], { env });
    const statusRes = git(repo, ["status", "--porcelain"], { env });
    const dirtyCount = (statusRes.stdout || "").split(/\r?\n/).filter(Boolean).length;
    return {
      status: "fetch-error",
      action: "fetch-failed",
      error: (fetchRes.stderr || fetchRes.error || "git fetch failed").trim(),
      currentBranch: branchRes.status === 0 ? branchRes.stdout.trim() : "DETACHED",
      isDirty: dirtyCount > 0,
      dirtyCount,
      changed: false,
    };
  }

  const branchRes = git(repo, ["symbolic-ref", "--short", "-q", "HEAD"], { env });
  const currentBranch = branchRes.status === 0 ? branchRes.stdout.trim() : "";
  const headRes = git(repo, ["rev-parse", "HEAD"], { env });
  if (headRes.status !== 0) {
    return { status: "error", action: "no-head", error: headRes.stderr.trim(), changed: false };
  }
  const headSha = headRes.stdout.trim();

  const upstreamRef = `${remote}/${branch}`;
  const upRes = git(repo, ["rev-parse", "--verify", upstreamRef], { env });
  if (upRes.status !== 0) {
    return { status: "error", action: "missing-upstream", error: `upstream ref not found: ${upstreamRef}`, changed: false };
  }
  const upstreamSha = upRes.stdout.trim();

  const dirtyRes = git(repo, ["status", "--porcelain"], { env });
  const dirtyLines = (dirtyRes.stdout || "").split(/\r?\n/).filter(Boolean);
  const isDirty = dirtyLines.length > 0;

  const branchExists = git(repo, ["show-ref", "--verify", "--quiet", `refs/heads/${branch}`], { env }).status === 0;
  let ahead = 0;
  let behind = 0;
  if (branchExists) {
    const branchSha = git(repo, ["rev-parse", `refs/heads/${branch}`], { env }).stdout.trim();
    const counts = git(repo, ["rev-list", "--left-right", "--count", `${branchSha}...${upstreamSha}`], { env }).stdout.trim().split(/\s+/).map(Number);
    ahead = counts[0] || 0;
    behind = counts[1] || 0;
  } else {
    behind = 1;
  }

  const ts = timestampTag(now);

  if (isDirty) {
    if (pack.dirtyPolicy === "hold") {
      return {
        status: "held",
        action: "held-dirty",
        origBranch: currentBranch || "DETACHED",
        dirtyCount: dirtyLines.length,
        headSha,
        changed: false,
      };
    }

    const shelvedBranch = uniqueBranch(repo, `auto-sync/wip-${ts}`, env);
    if (dryRun) {
      return {
        status: "dry-run",
        action: "would-shelve-and-update",
        shelvedBranch,
        origBranch: currentBranch || "DETACHED",
        dirtyCount: dirtyLines.length,
        fromSha: headSha,
        toSha: upstreamSha,
        changed: false,
      };
    }

    const coShelve = git(repo, ["checkout", "-b", shelvedBranch], { env });
    if (coShelve.status !== 0) {
      return { status: "error", action: "shelve-branch-failed", error: coShelve.stderr.trim(), changed: false };
    }
    const addRes = git(repo, ["add", "-A"], { env });
    if (addRes.status !== 0) {
      return { status: "error", action: "shelve-stage-failed", error: addRes.stderr.trim(), changed: false };
    }

    const commitPrefix = ["-c", "commit.gpgsign=false"];
    if (git(repo, ["config", "--get", "user.name"], { env }).status !== 0) commitPrefix.push("-c", "user.name=agent-sync");
    if (git(repo, ["config", "--get", "user.email"], { env }).status !== 0) commitPrefix.push("-c", "user.email=agent-sync@localhost");

    const commitRes = git(repo, [
      ...commitPrefix,
      "commit", "--no-verify", "-m", `wip(auto-sync): shelve dirty changes before updating ${branch}`,
    ], { env });
    if (commitRes.status !== 0) {
      return { status: "error", action: "shelve-commit-failed", error: (commitRes.stderr || commitRes.stdout).trim(), changed: false };
    }

    // Safety verification BEFORE resetting/switching target branch.
    const postDirty = (git(repo, ["status", "--porcelain"], { env }).stdout || "").trim();
    const shelveVerify = git(repo, ["rev-parse", "--verify", `refs/heads/${shelvedBranch}`], { env });
    if (postDirty || shelveVerify.status !== 0) {
      return {
        status: "error",
        action: "shelve-verify-failed",
        error: postDirty ? `working tree still dirty after shelve commit` : `shelved branch ${shelvedBranch} missing`,
        changed: false,
      };
    }

    let backupBranch = null;
    if (currentBranch !== branch && branchExists && ahead > 0) {
      backupBranch = uniqueBranch(repo, `auto-sync/local-${branch}-${ts}`, env);
      const mkBackup = git(repo, ["branch", backupBranch, `refs/heads/${branch}`], { env });
      if (mkBackup.status !== 0 || git(repo, ["rev-parse", "--verify", `refs/heads/${backupBranch}`], { env }).status !== 0) {
        return { status: "error", action: "backup-branch-failed", error: mkBackup.stderr.trim(), changed: false };
      }
    }

    const alignRes = git(repo, ["checkout", "-B", branch, upstreamRef], { env });
    if (alignRes.status !== 0) {
      return { status: "error", action: "checkout-main-failed", shelvedBranch, error: alignRes.stderr.trim(), changed: false };
    }

    return {
      status: "ok",
      action: "shelved-and-updated",
      shelvedBranch,
      ...(backupBranch ? { backupBranch } : {}),
      origBranch: currentBranch || "DETACHED",
      dirtyCount: dirtyLines.length,
      fromSha: headSha,
      toSha: upstreamSha,
      changed: headSha !== upstreamSha || currentBranch !== branch,
    };
  }

  // Clean working tree
  if (currentBranch === branch) {
    if (ahead === 0 && behind === 0) {
      return { status: "ok", action: "noop", headSha, changed: false };
    }
    if (ahead === 0 && behind > 0) {
      if (dryRun) {
        return { status: "dry-run", action: "would-update", fromSha: headSha, toSha: upstreamSha, commitsPulled: behind, changed: false };
      }
      const pullRes = git(repo, ["pull", "--ff-only", remote, branch], { env, timeout: 30000 });
      if (pullRes.status !== 0) {
        return { status: "error", action: "pull-failed", error: (pullRes.stderr || pullRes.stdout).trim(), changed: false };
      }
      return {
        status: "ok",
        action: "updated",
        fromSha: headSha,
        toSha: upstreamSha,
        commitsPulled: behind,
        changed: true,
      };
    }
    if (ahead > 0 && behind > 0) {
      const shelvedBranch = uniqueBranch(repo, `auto-sync/local-${branch}-${ts}`, env);
      if (dryRun) {
        return {
          status: "dry-run",
          action: "would-shelve-diverged-and-update",
          shelvedBranch,
          fromSha: headSha,
          toSha: upstreamSha,
          ahead,
          behind,
          changed: false,
        };
      }
      const mkBackup = git(repo, ["branch", shelvedBranch, "HEAD"], { env });
      if (mkBackup.status !== 0 || git(repo, ["rev-parse", "--verify", `refs/heads/${shelvedBranch}`], { env }).status !== 0) {
        return { status: "error", action: "backup-branch-failed", error: mkBackup.stderr.trim(), changed: false };
      }
      const alignRes = git(repo, ["checkout", "-B", branch, upstreamRef], { env });
      if (alignRes.status !== 0) {
        return { status: "error", action: "checkout-main-failed", shelvedBranch, error: alignRes.stderr.trim(), changed: false };
      }
      return {
        status: "ok",
        action: "shelved-diverged-and-updated",
        shelvedBranch,
        fromSha: headSha,
        toSha: upstreamSha,
        ahead,
        behind,
        changed: true,
      };
    }
    // ahead > 0 && behind === 0
    return {
      status: "held",
      action: "held-local-ahead",
      ahead,
      headSha,
      changed: false,
    };
  }

  // Clean tree on non-target branch or detached HEAD
  if (dryRun) {
    return {
      status: "dry-run",
      action: "would-switch-to-main",
      origBranch: currentBranch || "DETACHED",
      fromSha: headSha,
      toSha: upstreamSha,
      changed: false,
    };
  }

  let shelvedBranch = null;
  if (!currentBranch) {
    const containing = git(repo, ["branch", "--contains", "HEAD"], { env }).stdout.trim();
    if (!containing) {
      const detachedBranch = uniqueBranch(repo, `auto-sync/detached-${ts}`, env);
      const mkDet = git(repo, ["branch", detachedBranch, "HEAD"], { env });
      if (mkDet.status !== 0 || git(repo, ["rev-parse", "--verify", `refs/heads/${detachedBranch}`], { env }).status !== 0) {
        return { status: "error", action: "backup-branch-failed", error: mkDet.stderr.trim(), changed: false };
      }
      shelvedBranch = detachedBranch;
    }
  }
  if (branchExists && ahead > 0) {
    const localBackup = uniqueBranch(repo, `auto-sync/local-${branch}-${ts}`, env);
    const mkBackup = git(repo, ["branch", localBackup, `refs/heads/${branch}`], { env });
    if (mkBackup.status !== 0 || git(repo, ["rev-parse", "--verify", `refs/heads/${localBackup}`], { env }).status !== 0) {
      return { status: "error", action: "backup-branch-failed", error: mkBackup.stderr.trim(), changed: false };
    }
    shelvedBranch = shelvedBranch || localBackup;
  }

  const alignRes = git(repo, ["checkout", "-B", branch, upstreamRef], { env });
  if (alignRes.status !== 0) {
    return { status: "error", action: "checkout-main-failed", ...(shelvedBranch ? { shelvedBranch } : {}), error: alignRes.stderr.trim(), changed: false };
  }
  return {
    status: "ok",
    action: "switched-to-main",
    origBranch: currentBranch || "DETACHED",
    ...(shelvedBranch ? { shelvedBranch } : {}),
    fromSha: headSha,
    toSha: upstreamSha,
    changed: true,
  };
}

// --- Notices & Status Bus -------------------------------------------------------------------

function makeNoticeId(now, payload) {
  const digest = createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 8);
  return `${now.toISOString()}-${digest}`;
}

export function writeNotice(stateDir, packName, notice, now = new Date()) {
  const noticesDir = join(stateDir, "notices");
  const record = {
    schemaVersion: 1,
    pack: packName,
    id: notice.id || makeNoticeId(now, notice),
    timestamp: notice.timestamp || now.toISOString(),
    severity: notice.severity,
    summary: notice.summary,
    details: Array.isArray(notice.details) ? notice.details : [],
    shelvedBranch: notice.shelvedBranch || null,
    reloadRecommended: Boolean(notice.reloadRecommended),
  };
  writeJsonAtomic(join(noticesDir, `${packName}.json`), record);
  return record;
}

export function clearStaleErrorNotice(stateDir, packName) {
  const p = join(stateDir, "notices", `${packName}.json`);
  const existing = readJsonSafe(p);
  if (existing && (existing.severity === "error" || existing.transient === true || existing.summary?.includes("in progress") || existing.summary?.includes("ahead of"))) {
    rmSync(p, { force: true });
    return true;
  }
  return false;
}

export function readNotices(stateDir) {
  const noticesDir = join(stateDir, "notices");
  if (!isDir(noticesDir)) return [];
  const out = [];
  for (const file of readdirSync(noticesDir).filter((f) => f.endsWith(".json")).sort()) {
    const n = readJsonSafe(join(noticesDir, file));
    if (n && typeof n.pack === "string" && typeof n.id === "string") out.push(n);
  }
  return out;
}

function appendEvent(stateDir, event) {
  const logPath = join(stateDir, "events.jsonl");
  mkdirSync(stateDir, { recursive: true });
  const existing = isFile(logPath) ? readFileSync(logPath, "utf8").split(/\r?\n/).filter(Boolean) : [];
  existing.push(JSON.stringify(event));
  const trimmed = existing.slice(-200);
  const tmp = `${logPath}.${randomUUID()}.tmp`;
  writeFileSync(tmp, trimmed.join("\n") + "\n", { flag: "wx" });
  renameSync(tmp, logPath);
}

// --- Deploy & Binary Steps ------------------------------------------------------------------

function parseDeployRefreshed(stdout) {
  const lines = (stdout || "").split(/\r?\n/);
  return lines.some((l) => /^\s*(copied|linked|replace|create|prune|refreshing|reinstalled and enabled|installed and enabled|copied to)\b/i.test(l) ||
    /agy plugin .+ installed/i.test(l));
}

function runTktBinaryStep(tktPack, gitOutcome, { dryRun, env }) {
  const repo = tktPack.repo;
  const checkScript = join(repo, "tools", "check-binary-fresh.mjs");
  const installScript = join(repo, "tools", "install-local.sh");
  if (!isFile(checkScript)) return { status: "skipped", reason: "check-binary-fresh.mjs missing" };

  const before = runCmd(process.execPath, [checkScript], { cwd: repo, env, timeout: 15000 });
  const parsedBefore = readJsonSafeFromText(before.stdout);
  const isCleanOnTarget = gitOutcome.status === "ok" || gitOutcome.action === "fetch-failed" && !gitOutcome.isDirty && gitOutcome.currentBranch === (tktPack.branch || "main");
  const needsBuild = before.status === 1 || gitOutcome.changed;

  if (!needsBuild && before.status === 0) {
    return { status: "fresh", action: "noop", version: parsedBefore?.version || null, head: parsedBefore?.head || null };
  }
  if (!isCleanOnTarget) {
    return { status: "held", action: "held-dirty-or-non-main", reason: "tkt binary check skipped while checkout is not clean on target branch" };
  }
  if (dryRun) {
    return { status: "dry-run", action: "would-rebuild", before: parsedBefore };
  }
  if (!isFile(installScript)) {
    return { status: "error", action: "missing-installer", error: `missing ${installScript}` };
  }

  const build = runCmd("bash", [installScript], { cwd: repo, env, timeout: 600000 });
  if (build.status !== 0) {
    return { status: "error", action: "build-failed", error: (build.stderr || build.stdout || build.error).trim().slice(-1000) };
  }
  const after = runCmd(process.execPath, [checkScript], { cwd: repo, env, timeout: 15000 });
  const parsedAfter = readJsonSafeFromText(after.stdout);
  if (after.status !== 0) {
    return { status: "error", action: "stale-after-build", error: after.stdout.trim() || after.stderr.trim() };
  }
  return {
    status: "ok",
    action: "rebuilt",
    before: parsedBefore?.installed || null,
    after: parsedAfter?.installed || null,
    version: parsedAfter?.version || null,
  };
}

function readJsonSafeFromText(text) {
  try {
    return JSON.parse(String(text || "").trim());
  } catch {
    return null;
  }
}

function runPortfolioDeploy({ portfolioPath, tktPack, gmPack, env, dryRun, forceDeploy, anyGitChanged, binaryRebuilt }) {
  const gmRepo = gmPack.repo;
  const tktRepo = tktPack?.repo;
  const deployScript = join(gmRepo, "scripts", "deploy.mjs");
  const verifyUsageScript = join(gmRepo, "scripts", "verify-tkt-usage.mjs");
  const agentsScript = join(gmRepo, "scripts", "install-agents-md.mjs");

  const tktBin = resolveTktBinary(env);
  if (!tktBin) {
    return { status: "error", action: "missing-tkt-binary", error: "tkt executable not found on PATH" };
  }

  if (dryRun) {
    const dry = runCmd(process.execPath, [deployScript, "--dry-run", "--portfolio", portfolioPath], { cwd: gmRepo, env, timeout: 60000 });
    return { status: dry.status === 0 ? "dry-run" : "error", action: "would-deploy", refreshed: false, stdout: dry.stdout.trim(), ...(dry.status !== 0 ? { error: dry.stderr.trim() || dry.stdout.trim() } : {}) };
  }

  // 1. Pre-deploy tkt usage compatibility checks
  if (isFile(verifyUsageScript)) {
    const targets = [tktRepo, gmRepo].filter((d) => d && isDir(d));
    for (const packDir of targets) {
      const vr = runCmd(process.execPath, [verifyUsageScript, "--pack", packDir, "--tkt", tktBin], { cwd: gmRepo, env, timeout: 30000 });
      if (vr.status !== 0) {
        return { status: "error", action: "verify-tkt-usage-failed", pack: packDir, error: (vr.stderr || vr.stdout).trim().slice(-1000) };
      }
    }
  }

  // 2. Static manifest checks per active pack
  for (const [label, script, cwd] of [
    ["grey-matter", deployScript, gmRepo],
    ...(tktRepo && isFile(join(tktRepo, "tools", "deploy.mjs")) ? [["tkt", join(tktRepo, "tools", "deploy.mjs"), tktRepo]] : []),
  ]) {
    const chk = runCmd(process.execPath, [script, "check", "--static"], { cwd, env, timeout: 30000 });
    if (chk.status !== 0) {
      return { status: "error", action: "manifest-check-failed", pack: label, error: (chk.stderr || chk.stdout).trim().slice(-1000) };
    }
  }

  // 3. Portfolio deploy (byte-compares & skips current targets; checks vendored deployer drift)
  const dep = runCmd(process.execPath, [deployScript, "--portfolio", portfolioPath], { cwd: gmRepo, env, timeout: 120000 });
  if (dep.status !== 0) {
    return { status: "error", action: "deploy-failed", error: (dep.stderr || dep.stdout).trim().slice(-1200) };
  }
  const skillsRefreshed = parseDeployRefreshed(dep.stdout);

  // 4. Global AGENTS.md managed blocks (never --force)
  let agentsStatus = "noop";
  let agentsWarning = null;
  if (isFile(agentsScript)) {
    const ag = runCmd(process.execPath, [agentsScript], { cwd: gmRepo, env, timeout: 30000 });
    if (ag.status !== 0) {
      agentsStatus = "warn";
      agentsWarning = (ag.stderr || ag.stdout).trim().slice(-600);
    } else if (/^\s*(create|update|migrate|append)\b/m.test(ag.stdout)) {
      agentsStatus = "updated";
    }
  }

  // 5. Audit summary
  const aud = runCmd(process.execPath, [deployScript, "audit", "--portfolio", portfolioPath, "--json"], { cwd: gmRepo, env, timeout: 30000 });
  const auditJson = readJsonSafeFromText(aud.stdout);

  return {
    status: "ok",
    action: (skillsRefreshed || agentsStatus === "updated") ? "refreshed" : "noop",
    refreshed: skillsRefreshed || agentsStatus === "updated" || forceDeploy || anyGitChanged || binaryRebuilt,
    skillsRefreshed,
    agentsStatus,
    ...(agentsWarning ? { agentsWarning } : {}),
    auditFindings: auditJson?.findings || [],
  };
}

function runExternalPackDeploy(pack, gitOutcome, { dryRun, env }) {
  const repo = pack.repo;
  const results = { postPull: [], verifyFresh: null, deploy: null };

  if (gitOutcome.changed && pack.postPull.length) {
    if (dryRun) {
      results.postPull.push({ status: "dry-run", commands: pack.postPull });
    } else {
      for (const cmd of pack.postPull) {
        const r = runCmd(cmd[0], cmd.slice(1), { cwd: repo, env, timeout: 300000 });
        results.postPull.push({ cmd, status: r.status === 0 ? "ok" : "error", ...(r.status !== 0 ? { error: (r.stderr || r.stdout).trim().slice(-600) } : {}) });
        if (r.status !== 0) return { status: "error", action: "post-pull-failed", error: (r.stderr || r.stdout).trim().slice(-800), results };
      }
    }
  }

  if (pack.verifyFresh?.length) {
    const vf = runCmd(pack.verifyFresh[0], pack.verifyFresh.slice(1), { cwd: repo, env, timeout: 30000 });
    results.verifyFresh = { status: vf.status === 0 ? "ok" : "warn", output: (vf.stdout || vf.stderr).trim().slice(-400) };
  }

  const depSpec = pack.deploy || { type: "none" };
  if (depSpec.type === "none") {
    results.deploy = { status: "noop" };
    return { status: "ok", action: gitOutcome.changed ? "updated" : "noop", results };
  }

  if (dryRun) {
    results.deploy = { status: "dry-run", type: depSpec.type };
    return { status: "dry-run", action: "would-deploy", results };
  }

  if (depSpec.type === "deploy-mjs") {
    const script = [join(repo, "tools", "deploy.mjs"), join(repo, "scripts", "deploy.mjs")].find(isFile);
    if (!script) return { status: "error", action: "missing-deploy-mjs", error: `no deploy.mjs found in ${repo}`, results };
    const r = runCmd(process.execPath, [script, ...(depSpec.argv || [])], { cwd: repo, env, timeout: 120000 });
    if (r.status !== 0) return { status: "error", action: "deploy-failed", error: (r.stderr || r.stdout).trim().slice(-800), results };
    results.deploy = { status: "ok", refreshed: parseDeployRefreshed(r.stdout) };
    return { status: "ok", action: results.deploy.refreshed ? "refreshed" : "noop", results };
  }

  if (depSpec.type === "command") {
    const r = runCmd(depSpec.argv[0], depSpec.argv.slice(1), { cwd: repo, env, timeout: 300000 });
    if (r.status !== 0) return { status: "error", action: "deploy-failed", error: (r.stderr || r.stdout).trim().slice(-800), results };
    results.deploy = { status: "ok" };
    return { status: "ok", action: "refreshed", results };
  }

  return { status: "ok", action: "noop", results };
}

// --- Orchestration (`runAutoSync`) ----------------------------------------------------------

function summarizePackNotice(pack, gitOutcome, binaryOutcome, deployOutcome) {
  const details = [];
  let severity = null;
  let shelvedBranch = gitOutcome.shelvedBranch || null;
  let reloadRecommended = false;

  if (gitOutcome.status === "error" || gitOutcome.status === "fetch-error" || gitOutcome.action === "held-dirty") {
    severity = "error";
    details.push(gitOutcome.error || `held (${gitOutcome.action})`);
  } else if (binaryOutcome?.status === "error") {
    severity = "error";
    details.push(`binary build failed: ${binaryOutcome.error}`);
  } else if (deployOutcome?.status === "error") {
    severity = "error";
    details.push(`deploy failed: ${deployOutcome.error}`);
  } else if (gitOutcome.status === "busy" || gitOutcome.action === "held-local-ahead") {
    severity = "warn";
    details.push(gitOutcome.reason || `local ${pack.branch} is ${gitOutcome.ahead} commit(s) ahead of upstream`);
  } else if (gitOutcome.shelvedBranch) {
    severity = "warn";
    details.push(`shelved ${gitOutcome.dirtyCount ? `${gitOutcome.dirtyCount} dirty change(s)` : "diverged commits"} from ${gitOutcome.origBranch || pack.branch} to ${gitOutcome.shelvedBranch} and updated ${pack.branch}`);
    reloadRecommended = true;
  } else if (deployOutcome?.agentsStatus === "warn") {
    severity = "warn";
    details.push(`global AGENTS.md update refused on drifted block`);
  } else if (gitOutcome.changed || binaryOutcome?.action === "rebuilt" || deployOutcome?.skillsRefreshed || deployOutcome?.agentsStatus === "updated" || deployOutcome?.results?.deploy?.refreshed) {
    severity = "info";
    const parts = [];
    if (gitOutcome.action === "updated") parts.push(`pulled ${gitOutcome.commitsPulled} commit(s) on ${pack.branch}`);
    else if (gitOutcome.action === "switched-to-main") parts.push(`switched from ${gitOutcome.origBranch} to ${pack.branch}`);
    if (binaryOutcome?.action === "rebuilt") parts.push(`rebuilt binary (${binaryOutcome.before || "old"} -> ${binaryOutcome.after || "new"})`);
    if (deployOutcome?.skillsRefreshed) parts.push("refreshed deployed skills/plugins");
    if (deployOutcome?.agentsStatus === "updated") parts.push("updated global AGENTS.md");
    if (deployOutcome?.results?.deploy?.refreshed) parts.push("refreshed pack deploy");
    details.push(parts.join("; "));
    reloadRecommended = true;
  }

  if (!severity) return null;
  return {
    severity,
    summary: details[0],
    details,
    shelvedBranch,
    reloadRecommended,
    transient: gitOutcome.status === "busy" || gitOutcome.action === "held-local-ahead",
  };
}

export function runAutoSync({
  portfolioPath = DEFAULT_PORTFOLIO,
  configDir = resolveConfigDir(),
  stateDir = resolveStateDir(),
  dryRun = false,
  forceDeploy = false,
  only = null,
  env = augmentedEnv(),
  now = new Date(),
} = {}) {
  const releaseLock = dryRun ? () => {} : acquireLock(stateDir);
  try {
    const { packs, warnings } = loadSyncPacks({ portfolioPath, configDir });
    const selected = only ? packs.filter((p) => p.name === only) : packs;
    if (only && !selected.length) {
      throw new Error(`unknown pack "${only}"`);
    }

    const packReports = [];
    const byName = new Map();

    // Step 1 & 2: Sync git repos in order (tkt -> grey-matter -> external) and rebuild tkt binary if needed.
    for (const pack of selected) {
      const gitOutcome = syncGitRepo(pack, { dryRun, env, now });
      let binaryOutcome = null;
      if (pack.name === "tkt" && gitOutcome.status !== "busy" && gitOutcome.status !== "error" && gitOutcome.status !== "skipped") {
        binaryOutcome = runTktBinaryStep(pack, gitOutcome, { dryRun, env });
      }
      const report = { name: pack.name, repo: pack.repo, portfolioMember: pack.portfolioMember, git: gitOutcome, binary: binaryOutcome, deploy: null };
      packReports.push(report);
      byName.set(pack.name, report);
    }

    // Step 3: Portfolio deploy for tkt + grey-matter
    const tktReport = byName.get("tkt");
    const gmReport = byName.get("grey-matter");
    if (gmReport && (!only || only === "grey-matter" || only === "tkt")) {
      const tktPack = packs.find((p) => p.name === "tkt");
      const gmPack = packs.find((p) => p.name === "grey-matter");
      const anyGitChanged = Boolean(tktReport?.git.changed || gmReport.git.changed);
      const binaryRebuilt = tktReport?.binary?.action === "rebuilt";
      const deployBlockedByGit = [tktReport?.git, gmReport.git].some((g) => g && (g.status === "error" || g.status === "busy" || g.action === "held-dirty"));
      const deployBlockedByBinary = tktReport?.binary?.status === "error";

      if (deployBlockedByGit || deployBlockedByBinary) {
        gmReport.deploy = { status: "held", action: "held-upstream-failure" };
      } else {
        gmReport.deploy = runPortfolioDeploy({
          portfolioPath,
          tktPack,
          gmPack,
          env,
          dryRun,
          forceDeploy,
          anyGitChanged,
          binaryRebuilt,
        });
      }
    }

    // Step 4: External packs deploy in isolation
    for (const pack of selected.filter((p) => !p.portfolioMember)) {
      const report = byName.get(pack.name);
      if (report.git.status === "error" || report.git.status === "busy" || report.git.action === "held-dirty") {
        report.deploy = { status: "held", action: "held-git" };
        continue;
      }
      try {
        report.deploy = runExternalPackDeploy(pack, report.git, { dryRun, env });
      } catch (err) {
        report.deploy = { status: "error", action: "deploy-exception", error: err.message };
      }
    }

    // Step 5: Write notices & status
    const noticesWritten = [];
    if (!dryRun) {
      for (const report of packReports) {
        const pack = packs.find((p) => p.name === report.name);
        const noticeSpec = summarizePackNotice(pack, report.git, report.binary, report.deploy);
        if (noticeSpec) {
          const rec = writeNotice(stateDir, report.name, noticeSpec, now);
          noticesWritten.push(rec);
        } else {
          clearStaleErrorNotice(stateDir, report.name);
        }
      }
    }

    const overallStatus = packReports.some((r) => r.git.status === "error" || r.git.status === "fetch-error" || r.binary?.status === "error" || r.deploy?.status === "error")
      ? "error"
      : packReports.some((r) => r.git.status === "held" || r.git.status === "busy" || r.git.shelvedBranch)
        ? "warn"
        : "ok";

    const statusDoc = {
      schemaVersion: 1,
      lastCheckedAt: now.toISOString(),
      dryRun,
      status: overallStatus,
      warnings,
      packs: packReports,
    };

    if (!dryRun) {
      writeJsonAtomic(join(stateDir, "status.json"), statusDoc);
      if (noticesWritten.length || overallStatus !== "ok") {
        appendEvent(stateDir, {
          timestamp: now.toISOString(),
          status: overallStatus,
          packs: packReports.map((r) => ({
            name: r.name,
            git: r.git.action,
            shelvedBranch: r.git.shelvedBranch || null,
            binary: r.binary?.action || null,
            deploy: r.deploy?.action || null,
          })),
        });
      }
    }

    return statusDoc;
  } finally {
    releaseLock();
  }
}

// --- Scheduler Templates & Management -------------------------------------------------------

export function renderSystemdUnits({
  hours = 12,
  nodeExe = process.execPath,
  scriptPath = fileURLToPath(import.meta.url),
  workingDir = GREY_MATTER_ROOT,
  pathEnv = augmentedEnv().PATH,
} = {}) {
  const service = [
    "[Unit]",
    "Description=Periodic agent-sync (grey-matter, tkt, and drop-in packs)",
    "After=network-online.target",
    "Wants=network-online.target",
    "",
    "[Service]",
    "Type=oneshot",
    `WorkingDirectory=${workingDir}`,
    `Environment="PATH=${pathEnv}"`,
    'Environment="GIT_TERMINAL_PROMPT=0"',
    `ExecStart="${nodeExe}" "${scriptPath}" run`,
    "Nice=10",
    "IOSchedulingClass=idle",
    "TimeoutStartSec=600",
    "",
  ].join("\n");

  const timer = [
    "[Unit]",
    "Description=Run agent-sync every " + hours + " hours",
    "",
    "[Timer]",
    "OnBootSec=2min",
    `OnUnitActiveSec=${hours}h`,
    "RandomizedDelaySec=5min",
    "Persistent=true",
    "",
    "[Install]",
    "WantedBy=timers.target",
    "",
  ].join("\n");

  return { service, timer };
}

export function renderLaunchdPlist({
  hours = 12,
  nodeExe = process.execPath,
  scriptPath = fileURLToPath(import.meta.url),
  workingDir = GREY_MATTER_ROOT,
  stateDir = resolveStateDir(),
  pathEnv = augmentedEnv().PATH,
} = {}) {
  const escapeXml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    "<dict>",
    "  <key>Label</key>",
    "  <string>dev.smileynet.agent-sync</string>",
    "  <key>ProgramArguments</key>",
    "  <array>",
    `    <string>${escapeXml(nodeExe)}</string>`,
    `    <string>${escapeXml(scriptPath)}</string>`,
    "    <string>run</string>",
    "  </array>",
    `  <key>WorkingDirectory</key>`,
    `  <string>${escapeXml(workingDir)}</string>`,
    "  <key>EnvironmentVariables</key>",
    "  <dict>",
    "    <key>PATH</key>",
    `    <string>${escapeXml(pathEnv)}</string>`,
    "    <key>GIT_TERMINAL_PROMPT</key>",
    "    <string>0</string>",
    "  </dict>",
    `  <key>StartInterval</key>`,
    `  <integer>${Math.round(hours * 3600)}</integer>`,
    "  <key>RunAtLoad</key>",
    "  <true/>",
    "  <key>ProcessType</key>",
    "  <string>Background</string>",
    "  <key>StandardOutPath</key>",
    `  <string>${escapeXml(join(stateDir, "launchd.out.log"))}</string>`,
    "  <key>StandardErrorPath</key>",
    `  <string>${escapeXml(join(stateDir, "launchd.err.log"))}</string>`,
    "</dict>",
    "</plist>",
    "",
  ].join("\n");
}

function getScheduleStatus() {
  const plat = platform();
  if (plat === "linux") {
    const unitDir = join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "systemd", "user");
    const timerFile = join(unitDir, "agent-sync.timer");
    const active = runCmd("systemctl", ["--user", "is-active", "agent-sync.timer"], { timeout: 5000 });
    const enabled = runCmd("systemctl", ["--user", "is-enabled", "agent-sync.timer"], { timeout: 5000 });
    const list = runCmd("systemctl", ["--user", "list-timers", "agent-sync.timer", "--all", "--no-pager"], { timeout: 5000 });
    return {
      platform: "linux",
      mechanism: "systemd --user",
      installed: isFile(timerFile),
      timerFile,
      active: active.stdout.trim() || "unknown",
      enabled: enabled.stdout.trim() || "unknown",
      details: list.stdout.trim(),
    };
  }
  if (plat === "darwin") {
    const plistFile = join(homedir(), "Library", "LaunchAgents", "dev.smileynet.agent-sync.plist");
    const list = runCmd("launchctl", ["list", "dev.smileynet.agent-sync"], { timeout: 5000 });
    return {
      platform: "darwin",
      mechanism: "launchd",
      installed: isFile(plistFile),
      plistFile,
      loaded: list.status === 0,
    };
  }
  return { platform: plat, mechanism: "schtasks", installed: false };
}

function installSchedule({ hours = 12, dryRun = false } = {}) {
  const plat = platform();
  if (plat === "linux") {
    const unitDir = join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "systemd", "user");
    const serviceFile = join(unitDir, "agent-sync.service");
    const timerFile = join(unitDir, "agent-sync.timer");
    const { service, timer } = renderSystemdUnits({ hours });
    if (dryRun) {
      console.log(`would write ${serviceFile}\nwould write ${timerFile}\nwould run: systemctl --user daemon-reload && systemctl --user enable --now agent-sync.timer`);
      return;
    }
    mkdirSync(unitDir, { recursive: true });
    writeFileSync(serviceFile, service);
    writeFileSync(timerFile, timer);
    const reload = runCmd("systemctl", ["--user", "daemon-reload"], { timeout: 10000 });
    if (reload.status !== 0) throw new Error(`systemctl --user daemon-reload failed: ${reload.stderr.trim()}`);
    const enable = runCmd("systemctl", ["--user", "enable", "--now", "agent-sync.timer"], { timeout: 10000 });
    if (enable.status !== 0) throw new Error(`systemctl --user enable --now agent-sync.timer failed: ${enable.stderr.trim()}`);
    console.log(`installed and enabled ${timerFile} (every ${hours}h)`);
    return;
  }
  if (plat === "darwin") {
    const plistFile = join(homedir(), "Library", "LaunchAgents", "dev.smileynet.agent-sync.plist");
    const plist = renderLaunchdPlist({ hours });
    if (dryRun) {
      console.log(`would write ${plistFile} and load via launchctl`);
      return;
    }
    mkdirSync(dirname(plistFile), { recursive: true });
    writeFileSync(plistFile, plist);
    runCmd("launchctl", ["unload", plistFile], { timeout: 5000 });
    const load = runCmd("launchctl", ["load", "-w", plistFile], { timeout: 10000 });
    if (load.status !== 0) throw new Error(`launchctl load failed: ${load.stderr.trim()}`);
    console.log(`installed and loaded ${plistFile} (every ${hours}h)`);
    return;
  }
  if (plat === "win32") {
    const scriptPath = fileURLToPath(import.meta.url);
    const ps = `Register-ScheduledTask -TaskName 'AgentSync' -Action (New-ScheduledTaskAction -Execute '${process.execPath}' -Argument '"${scriptPath}" run') -Trigger @((New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Hours ${hours})), (New-ScheduledTaskTrigger -AtLogOn)) -Force`;
    if (dryRun) { console.log(ps); return; }
    const res = runCmd("powershell.exe", ["-NoProfile", "-Command", ps], { timeout: 15000 });
    if (res.status !== 0) throw new Error(`Register-ScheduledTask failed: ${res.stderr.trim()}`);
    console.log(`registered Windows Scheduled Task AgentSync (every ${hours}h)`);
  }
}

function uninstallSchedule({ dryRun = false } = {}) {
  const plat = platform();
  if (plat === "linux") {
    const unitDir = join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "systemd", "user");
    const serviceFile = join(unitDir, "agent-sync.service");
    const timerFile = join(unitDir, "agent-sync.timer");
    if (dryRun) {
      console.log(`would disable agent-sync.timer and remove ${serviceFile}, ${timerFile}`);
      return;
    }
    runCmd("systemctl", ["--user", "disable", "--now", "agent-sync.timer"], { timeout: 10000 });
    rmSync(timerFile, { force: true });
    rmSync(serviceFile, { force: true });
    runCmd("systemctl", ["--user", "daemon-reload"], { timeout: 10000 });
    console.log("uninstalled systemd --user agent-sync.timer");
    return;
  }
  if (plat === "darwin") {
    const plistFile = join(homedir(), "Library", "LaunchAgents", "dev.smileynet.agent-sync.plist");
    if (dryRun) { console.log(`would unload and remove ${plistFile}`); return; }
    runCmd("launchctl", ["unload", plistFile], { timeout: 5000 });
    rmSync(plistFile, { force: true });
    console.log("uninstalled launchd dev.smileynet.agent-sync");
    return;
  }
  if (plat === "win32") {
    if (dryRun) { console.log("would unregister AgentSync task"); return; }
    runCmd("powershell.exe", ["-NoProfile", "-Command", "Unregister-ScheduledTask -TaskName 'AgentSync' -Confirm:$false"], { timeout: 10000 });
    console.log("unregistered Windows Scheduled Task AgentSync");
  }
}

// --- Registration & Ack Helpers -------------------------------------------------------------

export function registerPack(spec, { configDir = resolveConfigDir() } = {}) {
  const normalized = {
    schemaVersion: 1,
    name: spec.name,
    repo: resolve(spec.repo),
    branch: spec.branch || "main",
    remote: spec.remote || "origin",
    order: typeof spec.order === "number" ? spec.order : 50,
    dirtyPolicy: spec.dirtyPolicy || "shelve-to-branch",
    enabled: true,
    ...(spec.deploy ? { deploy: spec.deploy } : {}),
  };
  const check = validateDropInSpec(normalized, normalized.name);
  if (!check.ok) throw new Error(check.error);
  const packsDir = join(configDir, "packs.d");
  const file = join(packsDir, `${normalized.name}.json`);
  writeJsonAtomic(file, normalized);
  return file;
}

export function unregisterPack(name, { configDir = resolveConfigDir() } = {}) {
  if (!PACK_NAME_RE.test(name)) throw new Error(`invalid pack name: ${name}`);
  const file = join(configDir, "packs.d", `${name}.json`);
  if (!existsSync(file)) return false;
  rmSync(file, { force: true });
  return true;
}

export function ackNotices({ stateDir = resolveStateDir(), pack = null } = {}) {
  const notices = readNotices(stateDir).filter((n) => !pack || n.pack === pack);
  const seenPath = join(stateDir, "seen.json");
  const seen = readJsonSafe(seenPath, {});
  seen.ackedErrors = seen.ackedErrors && typeof seen.ackedErrors === "object" ? seen.ackedErrors : {};
  for (const harness of ["claude", "zcode", "qwen", "agy", "dsh"]) {
    seen[harness] = seen[harness] && typeof seen[harness] === "object" ? seen[harness] : {};
    for (const n of notices) seen[harness][n.pack] = n.id;
  }
  for (const n of notices) {
    if (n.severity === "error") seen.ackedErrors[n.pack] = n.id;
  }
  writeJsonAtomic(seenPath, seen);
  return notices.length;
}

// --- CLI Entrypoint -------------------------------------------------------------------------

function parseCli(argv) {
  const cmd = argv[0] && !argv[0].startsWith("-") ? argv[0] : "run";
  const rest = cmd === argv[0] ? argv.slice(1) : argv.slice();
  const opts = { cmd, sub: null, dryRun: false, forceDeploy: false, json: false, only: null, portfolio: DEFAULT_PORTFOLIO, hours: 12, pack: null, name: null, repo: null, branch: "main", remote: "origin", order: 50, dirtyPolicy: "shelve-to-branch", deployType: "none", deployCmd: null, targetArg: null };

  if (cmd === "schedule" && rest[0] && !rest[0].startsWith("-")) {
    opts.sub = rest.shift();
  } else if (cmd === "unregister" && rest[0] && !rest[0].startsWith("-")) {
    opts.targetArg = rest.shift();
  }

  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--force-deploy") opts.forceDeploy = true;
    else if (a === "--json") opts.json = true;
    else if (a === "--only" && rest[i + 1]) opts.only = rest[++i];
    else if (a === "--portfolio" && rest[i + 1]) opts.portfolio = resolve(rest[++i]);
    else if (a === "--hours" && rest[i + 1]) opts.hours = Number(rest[++i]);
    else if (a === "--pack" && rest[i + 1]) opts.pack = rest[++i];
    else if (a === "--name" && rest[i + 1]) opts.name = rest[++i];
    else if (a === "--repo" && rest[i + 1]) opts.repo = rest[++i];
    else if (a === "--branch" && rest[i + 1]) opts.branch = rest[++i];
    else if (a === "--remote" && rest[i + 1]) opts.remote = rest[++i];
    else if (a === "--order" && rest[i + 1]) opts.order = Number(rest[++i]);
    else if (a === "--dirty-policy" && rest[i + 1]) opts.dirtyPolicy = rest[++i];
    else if (a === "--deploy-type" && rest[i + 1]) opts.deployType = rest[++i];
    else if (a === "--deploy-cmd" && rest[i + 1]) opts.deployCmd = rest[++i];
    else throw new Error(`unknown or incomplete option: ${a}`);
  }
  return opts;
}

function printHumanRun(report) {
  console.log(`agent-sync (${report.lastCheckedAt}): ${report.status}`);
  for (const w of report.warnings) console.log(`  warning: ${w}`);
  for (const p of report.packs) {
    const bits = [`git=${p.git.action}`];
    if (p.git.shelvedBranch) bits.push(`shelved=${p.git.shelvedBranch}`);
    if (p.binary) bits.push(`bin=${p.binary.action}`);
    if (p.deploy) bits.push(`deploy=${p.deploy.action || p.deploy.status}`);
    console.log(`  ${p.name.padEnd(14)} ${bits.join("  ")}`);
    if (p.git.error) console.log(`    git error: ${p.git.error}`);
    if (p.binary?.error) console.log(`    bin error: ${p.binary.error}`);
    if (p.deploy?.error) console.log(`    deploy error: ${p.deploy.error}`);
  }
}

function main() {
  const opts = parseCli(process.argv.slice(2));
  const configDir = resolveConfigDir();
  const stateDir = resolveStateDir();

  if (opts.cmd === "run") {
    const report = runAutoSync({
      portfolioPath: opts.portfolio,
      configDir,
      stateDir,
      dryRun: opts.dryRun,
      forceDeploy: opts.forceDeploy,
      only: opts.only,
    });
    if (opts.json) console.log(JSON.stringify(report, null, 2));
    else printHumanRun(report);
    if (report.status === "error") process.exitCode = 1;
    return;
  }

  if (opts.cmd === "status") {
    const { packs, warnings } = loadSyncPacks({ portfolioPath: opts.portfolio, configDir });
    const lastRun = readJsonSafe(join(stateDir, "status.json"));
    const notices = readNotices(stateDir);
    const seen = readJsonSafe(join(stateDir, "seen.json"), {});
    const schedule = getScheduleStatus();
    const doc = { configDir, stateDir, packs: packs.map((p) => ({ name: p.name, repo: p.repo, branch: p.branch, order: p.order, dirtyPolicy: p.dirtyPolicy })), warnings, lastRun, notices, seen, schedule };
    if (opts.json) { console.log(JSON.stringify(doc, null, 2)); return; }
    console.log(`agent-sync status`);
    console.log(`  config: ${configDir}`);
    console.log(`  state:  ${stateDir}`);
    console.log(`  packs:  ${packs.map((p) => `${p.name} (${p.branch})`).join(", ")}`);
    console.log(`  timer:  ${schedule.mechanism} installed=${schedule.installed}${schedule.active ? ` active=${schedule.active}` : ""}${schedule.enabled ? ` enabled=${schedule.enabled}` : ""}`);
    if (lastRun) {
      console.log(`  last run: ${lastRun.lastCheckedAt} -> ${lastRun.status}`);
      for (const p of lastRun.packs || []) {
        console.log(`    - ${p.name}: git=${p.git?.action}${p.git?.shelvedBranch ? ` (shelved ${p.git.shelvedBranch})` : ""}${p.binary ? ` bin=${p.binary.action}` : ""}${p.deploy ? ` deploy=${p.deploy.action || p.deploy.status}` : ""}`);
      }
    } else {
      console.log("  last run: never");
    }
    console.log(`  notices (${notices.length}):`);
    for (const n of notices) console.log(`    - ${n.pack} [${n.severity}]: ${n.summary}`);
    return;
  }

  if (opts.cmd === "ack") {
    const count = ackNotices({ stateDir, pack: opts.pack });
    console.log(`acknowledged ${count} notice(s)`);
    return;
  }

  if (opts.cmd === "register") {
    if (!opts.name || !opts.repo) throw new Error("register requires --name and --repo");
    const deploy = opts.deployType === "command"
      ? { type: "command", argv: opts.deployCmd ? opts.deployCmd.split(/\s+/).filter(Boolean) : [] }
      : { type: opts.deployType };
    const file = registerPack({
      name: opts.name,
      repo: opts.repo,
      branch: opts.branch,
      remote: opts.remote,
      order: opts.order,
      dirtyPolicy: opts.dirtyPolicy,
      deploy,
    }, { configDir });
    console.log(`registered ${opts.name} -> ${file}`);
    return;
  }

  if (opts.cmd === "unregister") {
    const target = opts.targetArg || opts.name;
    if (!target) throw new Error("unregister requires <name>");
    const removed = unregisterPack(target, { configDir });
    console.log(removed ? `unregistered ${target}` : `${target} was not registered`);
    return;
  }

  if (opts.cmd === "schedule") {
    if (opts.sub === "install") { installSchedule({ hours: opts.hours, dryRun: opts.dryRun }); return; }
    if (opts.sub === "uninstall") { uninstallSchedule({ dryRun: opts.dryRun }); return; }
    if (opts.sub === "status" || !opts.sub) {
      const s = getScheduleStatus();
      if (opts.json) console.log(JSON.stringify(s, null, 2));
      else console.log(JSON.stringify(s, null, 2));
      return;
    }
    throw new Error(`unknown schedule subcommand: ${opts.sub}`);
  }

  throw new Error(`unknown command: ${opts.cmd}`);
}

if (process.argv[1] && existsSync(process.argv[1]) && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (err) {
    console.error(`agent-sync error: ${err.message}`);
    process.exitCode = 1;
  }
}
