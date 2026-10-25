#!/usr/bin/env node
// Inspect Git artifacts without checking out content, fetching, or modifying the index.
// Usage: node inspect-artifacts.mjs --repo PATH [--ref REV] [--history] [--policy FILE]
// JSON exit codes: 0 = no policy failure, 1 = policy failure, 2 = inspection/input error.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import { resolve, extname } from "node:path";

const usage = "node inspect-artifacts.mjs --repo PATH [--ref REV] [--history] [--policy FILE] [--warn-bytes N] [--max-blob-bytes N] [--max-content-bytes N] [--max-objects N] [--max-commits N]";
const result = { status: "pass", scope: {}, coverage: { metadataComplete: false, contentComplete: true, skippedContent: 0, gitlinks: 0 }, metrics: {}, files: [], findings: [], errors: [] };

function options(args) {
  const out = { repo: process.cwd(), maxBlobBytes: 32 * 1024 ** 2, maxContentBytes: 64 * 1024 ** 2, maxObjects: 10000, maxCommits: 1000 };
  const names = { "--repo": "repo", "--ref": "ref", "--policy": "policy", "--warn-bytes": "warnBytes", "--max-blob-bytes": "maxBlobBytes", "--max-content-bytes": "maxContentBytes", "--max-objects": "maxObjects", "--max-commits": "maxCommits" };
  const seen = new Set();
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (seen.has(arg)) throw new Error(`Repeated option: ${arg}`);
    seen.add(arg);
    if (arg === "--history") { out.history = true; continue; }
    if (!names[arg] || i + 1 === args.length) throw new Error(`Unknown or incomplete option: ${arg}`);
    const value = args[++i], key = names[arg];
    if (["repo", "ref", "policy"].includes(key)) out[key] = value;
    else {
      if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) throw new Error(`Expected a positive byte/count limit for ${arg}`);
      out[key] = Number(value);
    }
  }
  return out;
}

function gitEnvironment() {
  const env = { ...process.env };
  // Isolate the target from a caller's hook/index/config context without discarding unrelated settings.
  for (const key of ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_COMMON_DIR", "GIT_OBJECT_DIRECTORY", "GIT_ALTERNATE_OBJECT_DIRECTORIES", "GIT_CONFIG", "GIT_CONFIG_PARAMETERS", "GIT_CONFIG_COUNT", "GIT_IMPLICIT_WORK_TREE", "GIT_GRAFT_FILE", "GIT_REPLACE_REF_BASE", "GIT_PREFIX", "GIT_SHALLOW_FILE", "GIT_NAMESPACE", "GIT_INTERNAL_SUPER_PREFIX"]) delete env[key];
  for (const key of Object.keys(env)) if (/^GIT_CONFIG_(KEY|VALUE)_\d+$/.test(key)) delete env[key];
  return { ...env, GIT_NO_LAZY_FETCH: "1", GIT_NO_REPLACE_OBJECTS: "1", GIT_OPTIONAL_LOCKS: "0", GIT_TERMINAL_PROMPT: "0" };
}

function git(repo, env, args, input, allowFailure = false) {
  const run = spawnSync("git", ["--no-lazy-fetch", "--no-optional-locks", "-c", "core.fsmonitor=false", "-c", "core.untrackedCache=false", "-C", repo, ...args], { env, input, maxBuffer: 64 * 1024 ** 2, timeout: 30000 });
  if (run.error) throw new Error(`Git ${args[0]} could not complete: ${run.error.message}`);
  if (run.status !== 0 && !allowFailure) throw new Error(`Git ${args[0]} failed: ${run.stderr.toString().trim()}`);
  return run;
}

function fingerprint(path) {
  try { return createHash("sha256").update(readFileSync(path)).digest("hex"); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

function relativePath(path) {
  return typeof path === "string" && path.length > 0 && !path.startsWith("/") && !path.includes("\\") && !path.includes("\0") && !path.split("/").some(p => p === ".." || p === "." || p === "") && !/^[A-Za-z]:/.test(path);
}

function policyFrom(path) {
  const policy = JSON.parse(readFileSync(path, "utf8"));
  if (!policy || typeof policy !== "object" || policy.version !== 1 || !Array.isArray(policy.rules) || Object.keys(policy).some(k => !["version", "rules", "exceptions"].includes(k))) throw new Error("Policy requires version:1, rules[], and optional exceptions[]");
  const ids = new Set();
  for (const rule of policy.rules) {
    if (!rule || typeof rule !== "object" || typeof rule.id !== "string" || !/^[a-z0-9-]+$/.test(rule.id) || ids.has(rule.id) || !Array.isArray(rule.paths) || rule.paths.length === 0 || rule.paths.some(p => !relativePath(p))) throw new Error("Policy rules need unique lowercase ids and repository-relative paths[]");
    ids.add(rule.id);
    if (Object.keys(rule).some(k => !["id", "paths", "maxBlobBytes", "maxEmbeddedCharacters", "requireManifest"].includes(k))) throw new Error(`Unknown policy field in ${rule.id}`);
    if (!["maxBlobBytes", "maxEmbeddedCharacters", "requireManifest"].some(k => k in rule)) throw new Error(`Policy rule ${rule.id} has no constraint`);
    for (const key of ["maxBlobBytes", "maxEmbeddedCharacters"]) if (key in rule && (!Number.isSafeInteger(rule[key]) || rule[key] < 0)) throw new Error(`Invalid ${key} in ${rule.id}`);
    if ("requireManifest" in rule && (!relativePath(rule.requireManifest) || /[*?]/.test(rule.requireManifest))) throw new Error(`Invalid manifest path in ${rule.id}`);
  }
  if ("exceptions" in policy && !Array.isArray(policy.exceptions)) throw new Error("Policy exceptions must be an array");
  for (const exception of policy.exceptions || []) {
    if (!exception || !ids.has(exception.rule) || !relativePath(exception.path) || /[*?]/.test(exception.path) || typeof exception.reason !== "string" || !exception.reason.trim() || Object.keys(exception).some(k => !["rule", "path", "reason"].includes(k))) throw new Error("Exceptions require an existing rule, exact path and nonempty reason");
  }
  return policy;
}

function matches(pattern, path) {
  let expression = "^";
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === "*" && pattern[i + 1] === "*") {
      i++;
      if (pattern[i + 1] === "/") { expression += "(?:[\\s\\S]*/)?"; i++; }
      else expression += "[\\s\\S]*";
    } else if (pattern[i] === "*") expression += "[^/]*";
    else if (pattern[i] === "?") expression += "[^/]";
    else expression += pattern[i].replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
  }
  return new RegExp(expression + "(?![\\s\\S])", "u").test(path);
}

function pointer(text) {
  if (!text.startsWith("version https://git-lfs.github.com/spec/")) return null;
  const lines = text.trimEnd().split(/\r?\n/);
  const oid = lines.filter(l => l.startsWith("oid ")), size = lines.filter(l => l.startsWith("size "));
  if (lines[0] !== "version https://git-lfs.github.com/spec/v1" || oid.length !== 1 || !/^oid sha256:[a-f0-9]{64}$/.test(oid[0]) || size.length !== 1 || !/^size (0|[1-9]\d*)$/.test(size[0]) || !Number.isSafeInteger(Number(size[0].slice(5))) || lines.slice(1).some(l => !/^(oid |size |ext-)/.test(l))) throw new Error("Malformed Git LFS pointer");
  return { oid: oid[0].slice(4), declaredBytes: Number(size[0].slice(5)), payloadAvailability: "not checked" };
}

function metadata(repo, env, oids) {
  if (!oids.length) return new Map();
  const output = git(repo, env, ["cat-file", "--batch-check=%(objectname) %(objecttype) %(objectsize)"], oids.join("\n") + "\n").stdout.toString().trimEnd().split("\n");
  const map = new Map();
  for (let i = 0; i < output.length; i++) {
    const fields = output[i].split(" ");
    if (fields.length !== 3 || !/^\d+$/.test(fields[2]) || !Number.isSafeInteger(Number(fields[2]))) result.errors.push({ code: "object-unavailable", oid: oids[i], message: "Object metadata unavailable locally; lazy fetch disabled" });
    else map.set(fields[0], { type: fields[1], bytes: Number(fields[2]) });
  }
  if (output.length !== oids.length) throw new Error("Git returned an incomplete metadata batch");
  return map;
}

function recordLfs(map, lfs, context) {
  if (map.has(lfs.oid) && map.get(lfs.oid) !== lfs.declaredBytes) result.errors.push({ code: "conflicting-lfs-size", context, message: "One payload hash has inconsistent declared lengths" });
  else map.set(lfs.oid, lfs.declaredBytes);
}

function inspect(opts) {
  const env = gitEnvironment(), root = realpathSync(resolve(opts.repo));
  const top = realpathSync(git(root, env, ["rev-parse", "--show-toplevel"]).stdout.toString().trim());
  if (top !== root) throw new Error("--repo must name the repository root, not a directory inside its parent repository");
  const head = () => git(root, env, ["rev-parse", "--verify", "HEAD"], undefined, true).stdout.toString().trim() || null;
  const indexPath = resolve(root, git(root, env, ["rev-parse", "--git-path", "index"]).stdout.toString().trim());
  const indexBefore = fingerprint(indexPath), headBefore = head();
  const policy = opts.policy ? policyFrom(resolve(root, opts.policy)) : null;
  result.scope = { repository: root, mode: opts.ref ? "tree" : "staged", requestedRef: opts.ref || null, headAtStart: headBefore, indexAtStart: indexBefore, ignoredAndUntracked: "excluded", network: "disabled; lazy fetch disabled", policy: opts.policy || null, byteMeaning: "logical Git blob lengths and declared LFS lengths, not allocation, billed storage or reclaim" };
  let entries;
  if (opts.ref) {
    const tree = git(root, env, ["rev-parse", "--verify", "--end-of-options", opts.ref + "^{tree}"]).stdout.toString().trim();
    result.scope.tree = tree;
    entries = git(root, env, ["ls-tree", "-rz", tree]).stdout.toString().split("\0").filter(Boolean).map(record => {
      const tab = record.indexOf("\t"), [mode, type, oid] = record.slice(0, tab).split(" ");
      return { path: record.slice(tab + 1), mode, type, oid };
    });
  } else {
    entries = git(root, env, ["ls-files", "--stage", "-z"]).stdout.toString().split("\0").filter(Boolean).map(record => {
      const tab = record.indexOf("\t"), [mode, oid, stage] = record.slice(0, tab).split(" ");
      if (stage !== "0") result.errors.push({ code: "unmerged-index", path: record.slice(tab + 1), message: "Resolve the unmerged index before candidate inspection" });
      return { path: record.slice(tab + 1), mode, type: mode === "160000" ? "commit" : "blob", oid };
    });
  }
  const present = new Set(entries.filter(e => ["100644", "100755"].includes(e.mode)).map(e => e.path));
  result.coverage.gitlinks = entries.filter(e => e.type === "commit").length;
  if (!opts.ref) {
    const changed = new Set(git(root, env, ["diff", "--cached", "--name-only", "--no-ext-diff", "--no-textconv", "--no-renames", "--diff-filter=ACMRTD", "-z"]).stdout.toString().split("\0").filter(Boolean));
    const missingManifests = (policy?.rules || []).filter(r => r.requireManifest && changed.has(r.requireManifest) && !present.has(r.requireManifest));
    const dependents = entries.filter(e => !changed.has(e.path) && missingManifests.some(r => r.paths.some(p => matches(p, e.path))));
    const dependentPaths = new Set(dependents.map(e => e.path));
    result.scope.policyDependentPaths = [...dependentPaths].sort();
    result.scope.deletedPaths = [...changed].filter(p => !entries.some(e => e.path === p)).sort();
    entries = entries.filter(e => changed.has(e.path) || dependentPaths.has(e.path)).map(e => ({ ...e, selection: dependentPaths.has(e.path) ? "policy-dependent" : "staged" }));
  }
  entries = entries.filter(e => e.type === "blob");
  const meta = metadata(root, env, [...new Set(entries.map(e => e.oid))]);
  const content = new Map();
  let inspectedBytes = 0;
  function body(oid, size) {
    if (content.has(oid)) return content.get(oid);
    if (size > opts.maxBlobBytes || inspectedBytes + size > opts.maxContentBytes) return null;
    const bytes = git(root, env, ["cat-file", "blob", oid]).stdout;
    if (bytes.length !== size) throw new Error("Git blob length changed during inspection");
    inspectedBytes += bytes.length;
    const text = bytes.toString("utf8"), lfs = pointer(text);
    const embedded = [...text.matchAll(/data:[^,\s"'<>]{0,256};base64,([A-Za-z0-9+/=]+)/g)];
    const details = { lfs, embeddedCharacters: embedded.reduce((n, match) => n + match[1].length, 0), embeddedPayloads: embedded.length, containsNul: bytes.includes(0) };
    content.set(oid, details);
    return details;
  }
  // Inspect report/text candidates before a large binary set can exhaust the shared content budget.
  const priority = e => /\.(html?|md|json|ya?ml|txt|csv|svg)$/i.test(e.path) ? 0 : 1;
  entries.sort((a, b) => priority(a) - priority(b) || a.path.localeCompare(b.path));
  for (const entry of entries) {
    const m = meta.get(entry.oid);
    if (!m) continue;
    const file = { path: entry.path, oid: entry.oid, mode: entry.mode, selection: entry.selection || "tree", extension: extname(entry.path), gitBlobBytes: m.bytes, contentInspected: false, role: "requires project evidence" };
    try {
      const details = body(entry.oid, m.bytes);
      if (details) Object.assign(file, details, { contentInspected: true });
      else {
        result.coverage.contentComplete = false; result.coverage.skippedContent++;
        result.findings.push({ severity: "warning", code: "content-not-inspected", path: entry.path, message: "Content byte limit reached; metadata only, embedded content/LFS interpretation unknown" });
      }
    } catch (error) { result.coverage.contentComplete = false; result.errors.push({ code: "content-error", path: entry.path, message: error.message }); }
    if (file.embeddedCharacters > 0) result.findings.push({ severity: "warning", code: "embedded-data", path: file.path, characters: file.embeddedCharacters, message: "Review artifact role and retention; intentional portable deliverables may keep embedded payload" });
    if (opts.warnBytes && m.bytes > opts.warnBytes) result.findings.push({ severity: "warning", code: "large-blob", path: file.path, bytes: m.bytes });
    for (const rule of policy?.rules || []) {
      if (!rule.paths.some(p => matches(p, file.path))) continue;
      const violations = [];
      if ("maxBlobBytes" in rule && m.bytes > rule.maxBlobBytes) violations.push("maxBlobBytes");
      if ("maxEmbeddedCharacters" in rule) {
        if (!file.contentInspected) result.errors.push({ code: "policy-unverified", path: file.path, message: `Cannot verify embedded content for policy ${rule.id}` });
        else if (file.embeddedCharacters > rule.maxEmbeddedCharacters) violations.push("maxEmbeddedCharacters");
      }
      if (rule.requireManifest && !present.has(rule.requireManifest)) violations.push("requireManifest");
      const exception = policy.exceptions?.find(e => e.rule === rule.id && e.path === file.path);
      if (violations.length) result.findings.push({ severity: exception ? "info" : "failure", code: "policy-violation", path: file.path, rule: rule.id, violations, exception: exception?.reason || null });
    }
    result.files.push(file);
  }
  result.files.sort((a, b) => a.path.localeCompare(b.path));
  const lfs = new Map();
  for (const file of result.files) if (file.lfs) recordLfs(lfs, file.lfs, file.path);
  result.metrics = { selectedFiles: entries.length, inspectedFiles: result.files.length, gitBlobBytes: result.files.reduce((n, f) => n + f.gitBlobBytes, 0), uniqueGitBlobBytes: [...meta.values()].reduce((n, m) => n + m.bytes, 0), uniqueLfsDeclaredBytes: [...lfs.values()].reduce((n, size) => n + size, 0), lfsPointerPaths: result.files.filter(f => f.lfs).length, embeddedCharacters: result.files.reduce((n, f) => n + (f.embeddedCharacters || 0), 0), inspectedContentBytes: inspectedBytes };
  if (opts.history) {
    const ids = git(root, env, ["rev-list", "--objects", "--all", "--no-object-names", `--max-count=${opts.maxCommits}`]).stdout.toString().trim().split("\n").filter(Boolean);
    const unique = [...new Set(ids)], selected = unique.slice(0, opts.maxObjects), historical = metadata(root, env, selected);
    const blobs = [...historical.entries()].filter(([, m]) => m.type === "blob"), historicalLfs = new Map();
    let uninspected = 0;
    for (const [oid, m] of blobs) {
      try {
        const details = body(oid, m.bytes);
        if (!details) uninspected++;
        else if (details.lfs) recordLfs(historicalLfs, details.lfs, oid);
      } catch (error) { uninspected++; result.errors.push({ code: "history-content-error", oid, message: error.message }); }
    }
    const commitLimitReached = [...historical.values()].filter(m => m.type === "commit").length >= opts.maxCommits;
    result.history = { scope: "local refs only; bounded reachable objects, no fetch", commitLimit: opts.maxCommits, objectLimit: opts.maxObjects, commitLimitReached, objectLimitReached: unique.length > selected.length, metadataComplete: !commitLimitReached && unique.length === selected.length && selected.length === historical.size, contentComplete: uninspected === 0, skippedContent: uninspected, inspectedObjects: historical.size, gitBlobBytes: blobs.reduce((n, [, m]) => n + m.bytes, 0), uniqueLfsDeclaredBytes: [...historicalLfs.values()].reduce((n, size) => n + size, 0) };
  }
  result.scope.headAtEnd = head();
  result.scope.indexAtEnd = fingerprint(indexPath);
  if (indexBefore !== result.scope.indexAtEnd) result.errors.push({ code: "index-changed", message: "Concurrent index change; repeat inspection against a stable candidate set" });
  if (!opts.ref && headBefore !== result.scope.headAtEnd) result.errors.push({ code: "head-changed", message: "HEAD moved during staged inspection" });
  result.coverage.metadataComplete = meta.size === new Set(entries.map(e => e.oid)).size && result.errors.length === 0;
}

try {
  if (process.argv.slice(2).includes("--help")) console.log(JSON.stringify({ status: "pass", usage }));
  else {
    inspect(options(process.argv.slice(2)));
    result.status = result.errors.length ? "error" : result.findings.some(f => f.severity === "failure") ? "fail" : "pass";
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.status === "error" ? 2 : result.status === "fail" ? 1 : 0;
  }
} catch (error) {
  result.status = "error";
  result.errors.push({ code: "inspection-error", message: error.message });
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = 2;
}
