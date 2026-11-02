// Fixture tests for repository-artifact-hygiene's footprint inspector: one throwaway repo seeded
// with each case the inspector must see, never operator data.
import "./test-git-env.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { chmodSync, existsSync, linkSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, statfsSync, symlinkSync, utimesSync, writeFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { conformance, inspect, options, summary } from "../skills/meta/repository-artifact-hygiene/scripts/inspect-footprint.mjs";

// fileURLToPath, not URL.pathname: on Windows the pathname is /D:/..., which node cannot load.
const SCRIPT = fileURLToPath(new URL("../skills/meta/repository-artifact-hygiene/scripts/inspect-footprint.mjs", import.meta.url));
const onWsl = process.platform === "linux" && existsSync("/proc/version") && /microsoft/i.test(readFileSync("/proc/version", "utf8"));
const git = (cwd, ...args) => {
  const r = spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", ...args], { cwd });
  assert.equal(r.status, 0, r.stderr.toString());
  return r.stdout.toString();
};
const put = (path, body) => { mkdirSync(join(path, ".."), { recursive: true }); writeFileSync(path, body); };
const family = (r, path) => r.families.find((f) => f.path === path);
const MiB = Buffer.alloc(1024 ** 2, 1);

const made = [];
test.after(() => { for (const dir of made) rmSync(dir, { recursive: true, force: true }); });

function fixture() {
  const base = mkdtempSync(join(tmpdir(), "footprint-")), repo = join(base, "repo");
  made.push(base);
  mkdirSync(repo);
  git(repo, "init", "-q", "-b", "main");
  put(join(repo, ".gitignore"), ".scratch/\nbuild/\n");
  put(join(repo, ".tickets/170-old.md"), "---\nid: \"170\"\nstatus: done\n---\n");
  put(join(repo, ".tickets/171-live.md"), "---\nid: \"171\"\nstatus: in_progress\n---\n");
  put(join(repo, "docs/report.md"), "Evidence: `.scratch/t170-cited/report.json` and `.scratch/t170-cited/sub/`.\n");
  git(repo, "add", "-A");
  git(repo, "commit", "-qm", "seed");
  put(join(repo, ".scratch/t170-run-1/blob"), Buffer.concat([MiB, MiB]));
  put(join(repo, ".scratch/t170-run-1/old.zip"), "x");
  utimesSync(join(repo, ".scratch/t170-run-1/old.zip"), 0, 0);
  put(join(repo, ".scratch/t170-cited/report.json"), "{}");
  put(join(repo, ".scratch/t170-cited/sub/a.txt"), "a");
  put(join(repo, ".scratch/t170-cited/junk.bin"), MiB);
  put(join(repo, ".scratch/t171-wip/x"), MiB);
  mkdirSync(join(repo, ".scratch/t170-linked"));
  linkSync(join(repo, ".scratch/t171-wip/x"), join(repo, ".scratch/t170-linked/x"));
  put(join(repo, ".scratch/notes/n.txt"), "n");
  put(join(repo, ".scratch/t171-open/held.txt"), "held");
  put(join(repo, "build/out.o"), "o");
  git(repo, "worktree", "add", "-q", "-b", "feature", join(base, "wt-active"));
  git(repo, "worktree", "add", "-q", "--detach", join(base, "wt-gone"));
  rmSync(join(base, "wt-gone"), { recursive: true, force: true });
  return { base, repo };
}

function preservationState({ base, repo }, families = {}, workspace = "fixture-workspace", filename = "preservation.json") {
  const path = join(base, filename);
  writeFileSync(path, JSON.stringify({ version: 1, workspace, families }));
  return path;
}

const ownedCandidate = {
  owner: "fixture-worker",
  retention: { disposition: "released", note: "ticket evidence reviewed" },
  dependencies: { complete: true, active: [], provenance: "synthetic fixture", observedAt: new Date().toISOString(), freshForMinutes: 60 },
};

function registeredHostVolume() {
  const name = Buffer.from(process.env.WSL_DISTRO_NAME, "utf8").toString("base64");
  const script = `$ErrorActionPreference='Stop'; $name=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${name}')); $item=Get-ChildItem -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Lxss' | ForEach-Object { $entry=Get-ItemProperty -LiteralPath $_.PSPath; if($entry.DistributionName -ceq $name){ [pscustomobject]@{Name=$entry.DistributionName;BasePath=$entry.BasePath} } } | Select-Object -First 1; if($null -eq $item){exit 4}; $volume=Get-Volume -FilePath $item.BasePath; $report=[pscustomobject]@{Name=$item.Name;Drive=$volume.DriveLetter;Free=[string]$volume.SizeRemaining}; $json=ConvertTo-Json -Compress -InputObject $report; [Console]::WriteLine([Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($json)))`;
  const run = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(script, "utf16le").toString("base64")], { encoding: "utf8", timeout: 10000, maxBuffer: 64 * 1024, windowsHide: true });
  assert.equal(run.status, 0, run.error?.message ?? run.stderr);
  return JSON.parse(Buffer.from(run.stdout.trim(), "base64").toString("utf8"));
}

async function holdOpen(path) {
  const child = spawn(process.execPath, ["-e", `require("fs").openSync(${JSON.stringify(path)}, "r"); console.log("ready"); setInterval(() => {}, 1000)`]);
  await new Promise((ok) => child.stdout.once("data", ok));
  return child;
}

// An empty open-file set: only the open-file test pays for a machine-wide scan.
const base = { paths: [], quietMinutes: 0, floor: 0, topUnder: 0, open: new Set() };

test("the CLI parses explicit outside roots and paired growth inputs", () => {
  const parsed = options(["--agent-state-root", "state", "--runner-temp-root", "tmp", "--regrowth", "prior.json", "--cleanup-record", "cleanup.json", "--free-space-history", "free.json"]);
  assert.deepEqual(parsed.agentStateRoots, ["state"]);
  assert.deepEqual(parsed.runnerTempRoots, ["tmp"]);
  assert.equal(parsed.regrowth, "prior.json");
  assert.equal(parsed.cleanupRecord, "cleanup.json");
  assert.equal(parsed.freeSpaceHistory, "free.json");
  assert.throws(() => options(["--cleanup-record", "cleanup.json"]), /requires --regrowth/);
});

test("seeded families get the right facts and outcomes, and the run goes red", async (t) => {
  const { base: dir, repo } = fixture();
  const holder = await holdOpen(join(repo, ".scratch/t171-open/held.txt"));
  try {
    const preservation = preservationState({ base: dir, repo }, {
      ".scratch/t170-run-1": ownedCandidate,
      ".scratch/t170-cited": ownedCandidate,
    });
    const r = inspect({ ...base, open: undefined, repo, preservation, cap: 1024 ** 2 });
    assert.equal(family(r, ".scratch/t170-run-1").outcome, r.coverage.complete ? "delete" : "ask");
    assert.equal(family(r, ".scratch/t170-run-1").epochDatedFiles, 1);
    const cited = family(r, ".scratch/t170-cited");
    assert.equal(cited.outcome, r.coverage.complete ? "slim" : "ask");
    assert.deepEqual(cited.keep, [".scratch/t170-cited/report.json", ".scratch/t170-cited/sub"]);
    assert.deepEqual(cited.citedBy, ["docs/report.md"]);
    assert.equal(family(r, ".scratch/t171-wip").outcome, "keep");
    assert.deepEqual(family(r, ".scratch/t170-linked").hardLinkedFiles, [".scratch/t170-linked/x"]);
    assert.equal(family(r, ".scratch/t170-linked").logicalBytes, MiB.length);
    assert.equal(family(r, ".scratch/t171-wip").logicalBytes, MiB.length);
    assert.equal(family(r, ".scratch/t170-linked").reclaimableBytes, null);
    assert.equal(family(r, ".scratch/t170-linked").allocatedBytes + family(r, ".scratch/t171-wip").allocatedBytes, MiB.length);
    assert.equal(family(r, ".scratch/notes").outcome, "ask");
    assert.equal(family(r, "build").kind, "ignored");
    const open = family(r, ".scratch/t171-open");
    if (r.coverage.openFiles === "unavailable") {
      // Windows has neither lsof nor /proc: the inspector must say its coverage is incomplete.
      t.diagnostic("open-file detection unavailable on this host; asserted incomplete coverage instead");
      assert.equal(r.coverage.complete, false);
      assert.notEqual(open.outcome, "delete");
    } else {
      assert.equal(open.outcome, "skip");
      assert.deepEqual(open.openFiles, [".scratch/t171-open/held.txt"]);
    }
    const active = r.families.find((f) => f.path.endsWith("wt-active"));
    assert.equal(active.outcome, "skip");
    assert.match(active.activeReasons.join(), /active worktree .* on feature/);
    assert.equal(r.families.find((f) => f.path.endsWith("wt-gone")).outcome, "ask");
    assert.deepEqual(r.findings.map((f) => [f.kind, f.ticket]), [["ticket-cap", 170]]);
    const exactCap = r.findings.find((f) => f.kind === "ticket-cap");
    assert.equal(typeof exactCap.bytes, "number");
    assert.equal(exactCap.allocatedBytesAtLeast, undefined);
    assert.equal(exactCap.unknownFamilies, undefined);
    assert.equal(r.status, "fail");
  } finally { holder.kill(); }
});

test("the quiet floor skips recent writes: 15 minutes by default, 24 hours for agent state", () => {
  const { base: dir, repo } = fixture();
  assert.equal(options([]).quietMinutes, 15);
  assert.equal(options(["--agent-state"]).quietMinutes, 1440);
  const r = inspect({ ...base, repo, quietMinutes: 15 });
  assert.equal(family(r, ".scratch/t170-run-1").outcome, "skip");
  assert.match(family(r, ".scratch/t170-run-1").activeReasons[0], /quiet floor 15m/);
  const owned = preservationState({ base: dir, repo }, { ".scratch/t170-run-1": ownedCandidate });
  const later = inspect({ ...base, repo, preservation: owned, quietMinutes: 15 }, Date.now() + 16 * 60000);
  assert.equal(family(later, ".scratch/t170-run-1").outcome, "delete");
});

test("a citation added after the list was made turns removal into 'keep list changed'", () => {
  const { base: dir, repo } = fixture();
  const preservation = preservationState({ base: dir, repo }, { ".scratch/t170-run-1": ownedCandidate });
  const prior = join(dir, "prior.json");
  writeFileSync(prior, JSON.stringify(inspect({ ...base, repo, preservation })));
  appendFileSync(join(repo, "docs/report.md"), "Also `.scratch/t170-run-1/blob`.\n");
  const r = inspect({ ...base, repo, preservation, recheck: prior });
  assert.equal(family(r, ".scratch/t170-run-1").outcome, "keep list changed");
  assert.deepEqual(r.findings.map((f) => f.kind), ["keep-list-changed"]);
  const cli = spawnSync(process.execPath, [SCRIPT, "--repo", repo, "--floor", "0B", "--quiet", "0m", "--preservation", preservation, "--recheck", prior]);
  assert.equal(cli.status, 1);
});

test("unknown ownership and incomplete dependency observations stay review-only", () => {
  const { base: dir, repo } = fixture();
  const before = git(repo, "status", "--porcelain");
  const sample = readFileSync(join(repo, ".scratch/t170-run-1/blob"));
  const unknown = inspect({ ...base, repo });
  assert.equal(git(repo, "status", "--porcelain"), before);
  assert.deepEqual(readFileSync(join(repo, ".scratch/t170-run-1/blob")), sample);
  assert.equal(family(unknown, ".scratch/t170-run-1").ownership, "unknown");
  assert.equal(family(unknown, ".scratch/t170-run-1").outcome, "ask");
  assert.equal(unknown.coverage.preservation, "not supplied");

  const { base: ownedDir, repo: ownedRepo } = fixture();
  const preservation = preservationState({ base: ownedDir, repo: ownedRepo }, {
    ".scratch/t170-run-1": { ...ownedCandidate, dependencies: { ...ownedCandidate.dependencies, complete: false } },
  });
  const partial = inspect({ ...base, repo: ownedRepo, preservation });
  assert.equal(family(partial, ".scratch/t170-run-1").dependencyStatus, "partial");
  assert.equal(family(partial, ".scratch/t170-run-1").outcome, "ask");

  const outside = join(dir, "t170-outside-state");
  const outsideFile = join(outside, "blob");
  put(outsideFile, "outside");
  const older = new Date(Date.now() - 60000);
  utimesSync(outsideFile, older, older);
  const externalOwner = preservationState({ base: dir, repo }, { [outside.replaceAll("\\", "/")]: ownedCandidate });
  const external = inspect({ ...base, repo, preservation: externalOwner, paths: [outside] });
  assert.equal(family(external, outside).ownership, "known");
  assert.equal(family(external, outside).outcome, "delete");

  const missing = join(dir, "t170-missing");
  const missingOwner = preservationState({ base: dir, repo }, { [missing.replaceAll("\\", "/")]: ownedCandidate });
  const unavailable = inspect({ ...base, repo, preservation: missingOwner, paths: [missing] });
  assert.equal(family(unavailable, missing).outcome, "ask");
  assert.ok(unavailable.coverage.scopeIssues.some((issue) => issue.kind === "missing-root"));

});

test("retention disposition and allocation uncertainty fail closed", () => {
  const { base: dir, repo } = fixture();
  const held = preservationState({ base: dir, repo }, {
    ".scratch/t170-run-1": { ...ownedCandidate, retention: { disposition: "retained", note: "keep until owner review" } },
  });
  assert.equal(family(inspect({ ...base, repo, preservation: held }), ".scratch/t170-run-1").outcome, "keep");

  const released = preservationState({ base: dir, repo }, { ".scratch/t170-run-1": ownedCandidate });
  const noBlocks = (path, options) => {
    const st = lstatSync(path, options);
    return {
      size: st.size, blocks: undefined, mtimeMs: st.mtimeMs, ctimeMs: st.ctimeMs,
      nlink: st.nlink, dev: st.dev, ino: st.ino,
      isDirectory: () => st.isDirectory(), isFile: () => st.isFile(), isSymbolicLink: () => st.isSymbolicLink(),
    };
  };
  const report = inspect({ ...base, repo, preservation: released, cap: 1024 }, Date.now(), noBlocks);
  const candidate = family(report, ".scratch/t170-run-1");
  assert.equal(candidate.outcome, "ask");
  assert.equal(candidate.allocationStatus, "unavailable");
  assert.equal(candidate.allocatedBytes, null);
  assert.equal(candidate.allocatedBytesAtLeast, undefined);
  assert.ok(candidate.logicalBytes > 0);
  assert.equal(candidate.reclaimableBytes, null);
  assert.equal(report.coverage.allocation, "partial");
  assert.equal(family(report, ".scratch/t170-linked").allocatedBytes, null);
  assert.ok(report.findings.some((finding) => finding.kind === "ticket-cap-unverified"));
  assert.equal(report.findings.some((finding) => finding.kind === "ticket-cap"), false);
  assert.match(summary(report, Infinity), /logical \(allocation unavailable\)/);

  const oneUnknown = (path, options) => path === join(repo, ".scratch/t170-run-1/blob") ? noBlocks(path, options) : lstatSync(path, options);
  const mixed = inspect({ ...base, repo, preservation: released, cap: 1024 }, Date.now(), oneUnknown);
  const knownBreach = mixed.findings.find((finding) => finding.kind === "ticket-cap");
  assert.ok(knownBreach.allocatedBytesAtLeast > knownBreach.cap);
  assert.ok(knownBreach.unknownFamilies.includes(".scratch/t170-run-1"));
  assert.equal(mixed.findings.some((finding) => finding.kind === "ticket-cap-unverified"), false);
  assert.match(summary(mixed, Infinity), /allocated at least .* exceeds cap/);
  assert.match(summary(mixed, Infinity), /allocation unavailable for \.scratch\/t170-run-1/);

  const expired = inspect({ ...base, repo, preservation: released }, Date.now() + 61 * 60000);
  assert.equal(family(expired, ".scratch/t170-run-1").dependencyStatus, "stale");
  assert.equal(family(expired, ".scratch/t170-run-1").outcome, "ask");
});

test("recheck rejects malformed or empty snapshots and does not authorize new recommendations", () => {
  const { base: dir, repo } = fixture();
  const released = preservationState({ base: dir, repo }, { ".scratch/t170-run-1": ownedCandidate });
  const prior = join(dir, "prior.json");
  for (const invalid of [{}, { families: [] }]) {
    writeFileSync(prior, JSON.stringify(invalid));
    assert.throws(() => inspect({ ...base, repo, preservation: released, recheck: prior }), /Recheck input/);
    const cli = spawnSync(process.execPath, [SCRIPT, "--repo", repo, "--floor", "0B", "--quiet", "0m", "--recheck", prior], { encoding: "utf8" });
    assert.equal(cli.status, 2, cli.stdout + cli.stderr);
  }

  const held = preservationState({ base: dir, repo }, {
    ".scratch/t170-run-1": { ...ownedCandidate, retention: { disposition: "retained" } },
  }, "fixture-workspace", "held.json");
  writeFileSync(prior, JSON.stringify(inspect({ ...base, repo, preservation: held })));
  const newlyReleased = inspect({ ...base, repo, preservation: released, recheck: prior });
  assert.equal(family(newlyReleased, ".scratch/t170-run-1").outcome, "ask", JSON.stringify({ family: family(newlyReleased, ".scratch/t170-run-1"), findings: newlyReleased.findings }));
  assert.ok(newlyReleased.findings.some((finding) => finding.kind === "preservation-changed"));

  const valid = inspect({ ...base, repo, preservation: released });
  writeFileSync(prior, JSON.stringify(valid));
  const unchanged = inspect({ ...base, repo, preservation: released, recheck: prior });
  assert.equal(family(unchanged, ".scratch/t170-run-1").outcome, "delete");
  assert.deepEqual(unchanged.findings, []);

  const missingFamilyState = structuredClone(valid);
  missingFamilyState.families.find((item) => item.outcome === "delete").preservationState = null;
  writeFileSync(prior, JSON.stringify(missingFamilyState));
  assert.throws(() => inspect({ ...base, repo, preservation: released, recheck: prior }), /invalid family snapshot/);
});

test("preservation input rejects unknown fields and missing dependency provenance", () => {
  const { base: dir, repo } = fixture();
  const file = join(dir, "invalid-preservation.json");
  for (const value of [
    { version: 1, workspace: "fixture", families: {}, typo: true },
    { version: 1, workspace: "fixture", families: { build: { owner: "worker", retention: { disposition: "released" }, dependencies: { complete: true, active: [] } } } },
  ]) {
    writeFileSync(file, JSON.stringify(value));
    assert.throws(() => inspect({ ...base, repo, preservation: file }), /Preservation input|Invalid dependency observation|needs provenance/);
  }
});

test("prunable worktrees require released ownership and their recheck catches retention changes", () => {
  const { base: dir, repo } = fixture();
  const gone = join(dir, "wt-gone");
  const released = preservationState({ base: dir, repo }, { [gone.replaceAll("\\", "/")]: ownedCandidate });
  const prior = join(dir, "prior.json");
  const before = inspect({ ...base, repo, preservation: released });
  assert.equal(family(before, gone).outcome, "prune");
  writeFileSync(prior, JSON.stringify(before));

  const retained = preservationState({ base: dir, repo }, {
    [gone.replaceAll("\\", "/")]: { ...ownedCandidate, retention: { disposition: "retained", note: "hold worktree metadata" } },
  });
  const current = inspect({ ...base, repo, preservation: retained, recheck: prior });
  assert.equal(family(current, gone).outcome, "keep");
  assert.ok(current.findings.some((finding) => finding.kind === "preservation-changed" && finding.path === gone));
});

test("recheck makes a candidate stale when scope, inventory, ownership, workspace, or dependencies change", () => {
  const { base: dir, repo } = fixture();
  let preservation = preservationState({ base: dir, repo }, { ".scratch/t170-run-1": ownedCandidate });
  const prior = join(dir, "prior.json");
  const check = (mutate, currentOptions = {}) => {
    writeFileSync(prior, JSON.stringify(inspect({ ...base, repo, preservation })));
    mutate?.();
    const result = inspect({ ...base, repo, preservation, recheck: prior, ...currentOptions });
    const current = family(result, ".scratch/t170-run-1");
    if (current) assert.ok(!["delete", "slim"].includes(current.outcome), current.outcome);
    assert.ok(result.findings.some((finding) => finding.kind === "preservation-changed"));
  };

  put(join(dir, "additional-root/file"), "external");
  check(undefined, { paths: [join(dir, "additional-root")] });
  writeFileSync(prior, JSON.stringify(inspect({ ...base, repo, preservation })));
  renameSync(join(repo, ".scratch/t170-run-1"), join(repo, ".scratch/t170-run-1-moved"));
  const moved = inspect({ ...base, repo, preservation, recheck: prior });
  assert.ok(moved.findings.some((finding) => finding.kind === "preservation-changed" && finding.path === ".scratch/t170-run-1"));
  renameSync(join(repo, ".scratch/t170-run-1-moved"), join(repo, ".scratch/t170-run-1"));
  const ticketFile = join(repo, ".tickets/170-old.md"), doneTicket = readFileSync(ticketFile, "utf8");
  writeFileSync(prior, JSON.stringify(inspect({ ...base, repo, preservation })));
  writeFileSync(ticketFile, doneTicket.replace("status: done", "status: in_progress"));
  const reopened = inspect({ ...base, repo, preservation, recheck: prior });
  assert.equal(family(reopened, ".scratch/t170-run-1").outcome, "keep");
  assert.ok(reopened.findings.some((finding) => finding.kind === "preservation-changed"));
  writeFileSync(ticketFile, doneTicket);
  check(() => put(join(repo, ".scratch/t170-run-1/new-file"), "new"));
  rmSync(join(repo, ".scratch/t170-run-1/new-file"));
  check(() => {
    preservation = preservationState({ base: dir, repo }, {
      ".scratch/t170-run-1": { ...ownedCandidate, owner: "different-worker" },
    });
  });
  check(() => { preservation = preservationState({ base: dir, repo }, { ".scratch/t170-run-1": ownedCandidate }, "other-workspace"); });
  check(undefined, { open: new Set([join(repo, ".scratch/t170-run-1/blob")]) });
  check(() => {
    preservation = preservationState({ base: dir, repo }, {
      ".scratch/t170-run-1": { ...ownedCandidate, dependencies: { ...ownedCandidate.dependencies, active: ["session-9"] } },
    });
  });
});

test("symlink escapes are reported without traversing targets, and overlapping roots are not counted twice", () => {
  const { base: dir, repo } = fixture();
  const target = join(dir, "outside-target");
  put(join(target, "payload"), Buffer.alloc(4096, 7));
  const escape = join(repo, "escape-link");
  symlinkSync(target, escape, process.platform === "win32" ? "junction" : "dir");
  symlinkSync(target, join(repo, ".scratch/t170-run-1/nested-link"), process.platform === "win32" ? "junction" : "dir");
  const preservation = preservationState({ base: dir, repo }, { ".scratch/t170-run-1": ownedCandidate });
  const escaped = inspect({ ...base, repo, preservation, paths: [escape] });
  const candidate = family(escaped, ".scratch/t170-run-1");
  assert.ok(escaped.coverage.scopeIssues.some((issue) => issue.kind === "symlink-escape"));
  assert.ok(candidate.inventory.every((entry) => !entry.path.includes("payload")));
  assert.equal(candidate.inventory.find((entry) => entry.path === "nested-link").type, "symlink");
  assert.equal(family(escaped, escape), undefined);
  assert.equal(escaped.coverage.complete, false);
  assert.equal(candidate.reclaimableBytes, null);
  assert.ok(Number.isSafeInteger(candidate.logicalBytes));
  assert.ok(Number.isSafeInteger(candidate.allocatedBytes));

  const overlap = inspect({ ...base, repo, preservation, paths: [join(repo, ".scratch/t170-run-1/subset")] });
  assert.ok(overlap.coverage.scopeIssues.some((issue) => issue.kind === "overlapping-roots"));
  assert.equal(family(overlap, ".scratch/t170-run-1"), undefined);
  assert.equal(overlap.families.filter((entry) => entry.path === join(repo, ".scratch/t170-run-1/subset")).length, 0);
  assert.equal(overlap.coverage.complete, false);
});

test("the free-space floor and the summary line", () => {
  const { repo } = fixture();
  const r = inspect({ ...base, repo, floor: 1024 ** 5 * 1000 });
  assert.deepEqual(r.findings.map((f) => f.kind), ["free-space-floor"]);
  assert.match(summary(r, 1024 ** 5 * 1000), /^free .* under, stop adding data\); free-space trend unavailable \(history not supplied\); largest uncommitted: \.scratch\/t170-run-1 2\.0 MiB/);
  assert.doesNotMatch(summary(r, 0), /largest/);
  const cli = spawnSync(process.execPath, [SCRIPT, "--repo", repo, "--floor", "1000TiB", "--summary"]);
  assert.equal(cli.status, 1);
  assert.equal(spawnSync(process.execPath, [SCRIPT, "--repo", repo, "--floor", "lots"]).status, 2);
});

test("WSL free space is bounded by the Windows volume containing this distro VHD", { skip: !onWsl && "requires WSL2 and its Windows host" }, () => {
  const { repo } = fixture();
  if (!process.env.WSL_DISTRO_NAME) {
    const unavailable = inspect({ ...base, repo, floor: 0 });
    assert.equal(unavailable.coverage.complete, false);
    assert.equal(unavailable.coverage.hostDrive, "unavailable");
    assert.equal(unavailable.status, "review");
    return;
  }
  const host = registeredHostVolume();
  assert.equal(host.Name, process.env.WSL_DISTRO_NAME);
  assert.match(host.Drive, /^[A-Z]$/);
  const r = inspect({ ...base, repo, floor: 0 });
  const hostEntry = r.freeSpace.entries.find((entry) => entry.path === `Windows ${host.Drive}:`);
  assert.ok(hostEntry, JSON.stringify(r.freeSpace.entries));
  assert.ok(Number.isSafeInteger(hostEntry.free) && hostEntry.free >= 0 && Number.isSafeInteger(hostEntry.total) && hostEntry.total > 0);
  assert.equal(r.freeSpace.free, Math.min(...r.freeSpace.entries.map((entry) => entry.free)));
});

test("WSL host-volume lookup fails closed for ambiguous or unavailable registrations", { skip: !onWsl && "requires WSL2 and its Windows host" }, () => {
  const { base: fixtureBase, repo } = fixture(), dir = mkdtempSync(join(tmpdir(), "footprint-powershell-")), executable = join(dir, "powershell.exe");
  made.push(dir);
  writeFileSync(executable, "#!/bin/sh\n");
  chmodSync(executable, 0o755);
  const originalPath = process.env.PATH, originalDistro = process.env.WSL_DISTRO_NAME;
  const name = "fixture distro ; $(touch injected) Ω";
  const preservation = preservationState({ base: fixtureBase, repo }, { ".scratch/t170-run-1": ownedCandidate });
  process.env.PATH = `${dir}${delimiter}${originalPath ?? ""}`;
  process.env.WSL_DISTRO_NAME = name;
  const record = (overrides = {}) => ({ Name: name, BasePath: "R:\\fixture with spaces\\$literal & path", VhdExists: true, Drive: "R", VolumeId: "volume-r", Free: "1234", Total: "9876", ...overrides });
  const run = (response, exit = 0, floor = 0, recheck, freeSpaceHistory, spaceStat) => {
    const encoded = Buffer.from(JSON.stringify(response), "utf8").toString("base64");
    writeFileSync(executable, `#!/bin/sh\nprintf '%s\\n' '${encoded}'\nexit ${exit}\n`);
    chmodSync(executable, 0o755);
    return inspect({ ...base, repo, floor, preservation, recheck, freeSpaceHistory }, Date.now(), lstatSync, undefined, spaceStat);
  };
  try {
    const valid = run([record()]);
    assert.equal(valid.freeSpace.entries.find((entry) => entry.path === "Windows R:").free, 1234);
    assert.equal(valid.coverage.hostDrive, "registered R: volume for this WSL distro");
    assert.equal(family(valid, ".scratch/t170-run-1").outcome, "delete");
    const prior = join(fixtureBase, "valid-host-report.json");
    writeFileSync(prior, JSON.stringify(valid));
    const volumeId = "\\\\?\\Volume{12345678-1234-1234-1234-123456789abc}\\";
    const volumeIdResult = run([record({ Drive: "", VolumeId: volumeId })]);
    const canonicalVolumeId = volumeId.toUpperCase();
    assert.equal(volumeIdResult.coverage.hostDrive, `registered ${canonicalVolumeId} volume for this WSL distro`);
    assert.equal(volumeIdResult.freeSpace.entries.find((entry) => entry.path === `Windows ${canonicalVolumeId}`).volumeId, canonicalVolumeId);
    const uppercaseResult = run([record({ Drive: "", VolumeId: canonicalVolumeId })]);
    assert.equal(uppercaseResult.freeSpace.volumeId, volumeIdResult.freeSpace.volumeId);

    const history = join(fixtureBase, "ambiguous-volume-history.json"), repoFs = statfsSync(repo), repoFree = repoFs.bavail * repoFs.bsize;
    writeFileSync(history, JSON.stringify({ version: 1, freshForMinutes: 60, samples: [
      { volumeId: "any-volume", observedAt: new Date(Date.now() - 60000).toISOString(), freeBytes: repoFree },
      { volumeId: "any-volume", observedAt: new Date().toISOString(), freeBytes: repoFree },
    ] }));
    const equalMinimum = run([record({ Free: String(repoFree), Total: String(repoFree + 1) })], 0, 0, undefined, history, () => repoFs);
    assert.equal(equalMinimum.freeSpace.entries.length, 2);
    assert.equal(equalMinimum.freeSpace.entries[0].free, equalMinimum.freeSpace.entries[1].free);
    assert.equal(equalMinimum.freeSpace.volumeId, null);
    assert.equal(equalMinimum.freeSpaceTrend.status, "unavailable");
    assert.match(equalMinimum.freeSpaceTrend.reason, /ambiguous/);

    for (const [label, response, exit] of [
      ["missing registration", [], 0],
      ["duplicate registration", [record(), record()], 0],
      ["missing VHD", [record({ VhdExists: false })], 0],
      ["failed host query", [record()], 1],
      ["null free", [record({ Free: null })], 0],
      ["empty free", [record({ Free: "" })], 0],
      ["numeric free", [record({ Free: 1234 })], 0],
      ["null total", [record({ Total: null })], 0],
      ["empty total", [record({ Total: "" })], 0],
      ["numeric total", [record({ Total: 9876 })], 0],
      ["zero total", [record({ Free: "0", Total: "0" })], 0],
      ["object volume identity", [record({ Drive: "invalid", VolumeId: { value: "R:" } })], 0],
      ["empty volume identity", [record({ Drive: "invalid", VolumeId: "" })], 0],
    ]) {
      const unverified = run(response, exit);
      assert.equal(unverified.status, "review", label);
      assert.equal(family(unverified, ".scratch/t170-run-1").outcome, "ask", label);
      const result = run(response, exit, 0, prior);
      assert.equal(result.coverage.complete, false, label);
      assert.equal(result.coverage.hostDrive, "unavailable", label);
      assert.equal(result.status, "fail", label);
      assert.equal(result.freeSpace.volumeId, null, label);
      assert.equal(family(result, ".scratch/t170-run-1").outcome, "ask", label);
      assert.ok(result.findings.some((finding) => finding.kind === "preservation-changed"), label);
      assert.equal(result.freeSpace.entries.some((entry) => entry.path.startsWith("Windows ")), false, label);
      assert.match(summary(result, 0), /Windows backing volume unavailable .*; free-space floor unverified/, label);
    }

    const underFloor = run([], 0, 1024 ** 5);
    assert.equal(underFloor.status, "fail");
    assert.match(summary(underFloor, 0), /under, stop adding data.*Windows backing volume unavailable .*; free-space floor unverified/);

    delete process.env.WSL_DISTRO_NAME;
    const missingName = inspect({ ...base, repo, floor: 0 });
    assert.equal(missingName.coverage.complete, false);
    assert.equal(missingName.coverage.hostDrive, "unavailable");
    assert.equal(missingName.status, "review");
    assert.equal(missingName.freeSpace.entries.some((entry) => entry.path.startsWith("Windows ")), false);
  } finally {
    process.env.PATH = originalPath;
    process.env.WSL_DISTRO_NAME = originalDistro;
  }
});

test("cleaned families without ownership evidence remain review-only", () => {
  const { base: dir, repo } = fixture();
  for (const p of [".scratch/t170-run-1", ".scratch/t170-linked", ".scratch/notes", ".scratch/t170-cited/junk.bin", "build"]) rmSync(join(repo, p), { recursive: true });
  git(repo, "worktree", "prune");
  const r = inspect({ ...base, repo, cap: 5 * 1024 ** 3 });
  assert.equal(family(r, ".scratch/t170-cited").outcome, "keep");
  assert.deepEqual(r.findings, []);
  assert.equal(r.status, "review", JSON.stringify(r.families.map((f) => [f.path, f.outcome])));
  assert.equal(r.coverage.preservation, "not supplied");
  const cli = spawnSync(process.execPath, [SCRIPT, "--repo", repo, "--floor", "0B", "--quiet", "0m"], { encoding: "utf8" });
  assert.equal(cli.status, 0, cli.stdout + cli.stderr);
});

test("explicit agent and runner roots report bounded child families and protect active state", () => {
  const { base: dir, repo } = fixture();
  const agentRoot = join(dir, "configured-agent-state"), runnerRoot = join(dir, "configured-runner-temp");
  const agent = join(agentRoot, "session-a"), held = join(runnerRoot, "run-a");
  put(join(agent, "transcript.jsonl"), "agent state");
  put(join(held, "worker.log"), "active run");
  put(join(runnerRoot, "orphan.log"), "runner log");
  const preservation = preservationState({ base: dir, repo }, {
    [agent.replaceAll("\\", "/")]: ownedCandidate,
    [held.replaceAll("\\", "/")]: ownedCandidate,
    [join(runnerRoot, "orphan.log").replaceAll("\\", "/")]: ownedCandidate,
  });
  const r = inspect({ ...base, repo, preservation, agentStateRoots: [agentRoot], runnerTempRoots: [runnerRoot],
    open: new Set([join(held, "worker.log")]) }, Date.now() + 16 * 60000);

  const session = family(r, agent);
  assert.equal(session.kind, "agent-state");
  assert.equal(session.files, 1);
  const run = family(r, held);
  assert.equal(run.kind, "runner-temp");
  assert.equal(run.outcome, "skip");
  assert.deepEqual(run.openFiles, ["worker.log"]);
  assert.match(run.activeReasons.join(), /open file/);
  assert.equal(family(r, join(runnerRoot, "orphan.log")).kind, "runner-temp");
  assert.equal(family(r, agentRoot), undefined);
  assert.ok(r.snapshot.scope.some((root) => root.path === agentRoot));
  assert.ok(!r.snapshot.scope.some((root) => root.path === agent));
  assert.equal(r.coverage.complete, true);

  const cli = spawnSync(process.execPath, [SCRIPT, "--repo", repo, "--floor", "0B", "--quiet", "0m", "--agent-state-root", agentRoot], { encoding: "utf8" });
  assert.equal(cli.status, 0, cli.error?.message ?? `${cli.stdout}\n${cli.stderr}`);
  assert.equal(family(JSON.parse(cli.stdout), agent).kind, "agent-state");

  const missing = inspect({ ...base, repo, agentStateRoots: [join(dir, "missing-state-root")] });
  assert.equal(missing.coverage.complete, false);
  assert.ok(missing.coverage.scopeIssues.some((issue) => issue.kind === "missing-root"));

  const activeRoot = join(dir, "wt-active");
  const active = inspect({ ...base, repo, agentStateRoots: [activeRoot] });
  const metadata = family(active, join(activeRoot, ".git"));
  assert.equal(metadata.outcome, "skip");
  assert.match(metadata.activeReasons.join(), /active worktree .* on feature/);
});

test("configured roots bound child discovery and report escaping symlinks", () => {
  const { base: dir, repo } = fixture(), root = join(dir, "many-agent-families"), outside = join(dir, "outside-state");
  mkdirSync(root);
  for (let i = 0; i < 256; i++) writeFileSync(join(root, `family-${String(i).padStart(3, "0")}.log`), "x");
  put(join(root, "a-t170-session", "state.json"), "known session");
  put(join(outside, "secret.log"), "outside");
  symlinkSync(outside, join(root, "escape"), process.platform === "win32" ? "junction" : "dir");
  const r = inspect({ ...base, repo, agentStateRoots: [root], cap: 50 * 1024 ** 2 });
  assert.equal(r.coverage.complete, false);
  assert.equal(r.coverage.inventoryComplete, false);
  assert.ok(r.coverage.scopeIssues.some((issue) => issue.kind === "configured-family-limit" && issue.path === root));
  assert.ok(r.coverage.scopeIssues.some((issue) => issue.kind === "symlink-escape" && issue.path === join(root, "escape")));
  const link = family(r, join(root, "escape"));
  assert.ok(link);
  assert.equal(link.inventory.some((entry) => entry.path.includes("secret.log")), false);
  const cap = r.findings.find((finding) => finding.kind === "ticket-cap-unverified" && finding.ticket === 170);
  assert.ok(cap);
  assert.ok(cap.families.includes(`${root} (family inventory incomplete)`));
});

test("configured child-list changes do not redefine the stable recheck scope", () => {
  const { base: dir, repo } = fixture(), root = join(dir, "configured-agent-state"), first = join(root, "t170-old-run");
  put(join(first, "state.json"), "old run");
  const at = Date.now() + 16 * 60000;
  const firstOwner = preservationState({ base: dir, repo }, { [first.replaceAll("\\", "/")]: ownedCandidate });
  const args = { ...base, repo, agentStateRoots: [root], preservation: firstOwner };
  const before = inspect(args, at);
  const priorPath = join(dir, "prior-configured-root.json");
  writeFileSync(priorPath, JSON.stringify(before));

  const second = join(root, "t170-new-run");
  put(join(second, "state.json"), "new run");
  const bothOwned = preservationState({ base: dir, repo }, {
    [first.replaceAll("\\", "/")]: ownedCandidate,
    [second.replaceAll("\\", "/")]: ownedCandidate,
  }, "fixture-workspace", "both-roots.json");
  const after = inspect({ ...args, preservation: bothOwned, recheck: priorPath }, at + 60000);
  assert.deepEqual(after.snapshot.scope, before.snapshot.scope);
  if (family(before, first).outcome === "delete") assert.equal(family(after, first).outcome, "delete");
  assert.notEqual(family(after, second).outcome, "delete");
});

test("configured child walks stop at the per-family entry budget", () => {
  const { base: dir, repo } = fixture(), root = join(dir, "large-agent-root"), child = join(root, "t170-session");
  mkdirSync(child, { recursive: true });
  for (let i = 0; i < 10000; i++) writeFileSync(join(child, `file-${String(i).padStart(5, "0")}`), "x");
  const withBlocks = (path, options) => {
    const st = lstatSync(path, options);
    if (st.isFile()) st.blocks = Math.ceil(st.size / 512);
    return st;
  };
  const r = inspect({ ...base, repo, agentStateRoots: [root], cap: 50 * 1024 ** 2 }, Date.now(), withBlocks);
  const state = family(r, child);
  assert.equal(state.inventory.length, 9999);
  assert.equal(state.inventoryComplete, false);
  assert.equal(state.allocatedBytes, null);
  assert.equal(state.allocationStatus, "inventory-incomplete");
  assert.ok(state.logicalBytesAtLeast > 0);
  assert.ok(state.allocatedBytesAtLeast > 0);
  assert.match(summary({ ...r, families: [state] }, Infinity), /allocated at least .* observed partial/);
  assert.match(summary({ ...r, families: [state] }, Infinity), /observed partial/);
  assert.equal(r.coverage.inventoryComplete, false);
  assert.ok(r.coverage.scopeIssues.some((issue) => issue.kind === "family-entry-limit" && issue.path === child));
  assert.ok(r.findings.some((finding) => finding.kind === "ticket-cap-unverified" && finding.ticket === 170), JSON.stringify({ ticket: state.ticket, allocatedBytes: state.allocatedBytes, findings: r.findings }));
});

test("a configured child stat error keeps partial bytes but marks the ticket cap unverified", () => {
  const { base: dir, repo } = fixture(), root = join(dir, "agent-state-errors"), child = join(root, "t170-session");
  put(join(child, "readable"), "known bytes");
  put(join(child, "unreadable"), "unknown bytes");
  const failingStat = (path, options) => {
    if (path === join(child, "unreadable")) throw new Error("fixture permission failure");
    const st = lstatSync(path, options);
    if (st.isFile()) st.blocks = Math.ceil(st.size / 512);
    return st;
  };
  const r = inspect({ ...base, repo, agentStateRoots: [root], cap: 10 * 1024 ** 2 }, Date.now() + 60000, failingStat);
  const state = family(r, child);
  assert.equal(state.inventory.length, 1);
  assert.equal(state.inventoryComplete, false);
  assert.equal(state.allocatedBytes, null);
  assert.equal(state.allocationStatus, "inventory-incomplete");
  assert.ok(state.logicalBytesAtLeast > 0);
  assert.ok(state.allocatedBytesAtLeast > 0);
  assert.ok(r.coverage.scopeIssues.some((issue) => issue.kind === "incomplete-root" && issue.path === child));
  assert.ok(r.findings.some((finding) => finding.kind === "ticket-cap-unverified" && finding.ticket === 170), JSON.stringify({ ticket: state.ticket, allocatedBytes: state.allocatedBytes, findings: r.findings }));
  const knownBreach = inspect({ ...base, repo, agentStateRoots: [root], cap: 1 }, Date.now() + 60000, failingStat);
  const lowerBoundFinding = knownBreach.findings.find((finding) => finding.kind === "ticket-cap" && finding.ticket === 170);
  assert.ok(lowerBoundFinding.allocatedBytesAtLeast > lowerBoundFinding.cap);
  assert.ok(lowerBoundFinding.unknownFamilies.includes(child));
  assert.equal(knownBreach.findings.some((finding) => finding.kind === "ticket-cap-unverified" && finding.ticket === 170), false);
});

test("free-space history requires the current measured volume and reports a timed rate", (t) => {
  const { base: dir, repo } = fixture(), path = join(dir, "free-space-history.json");
  const now = Date.parse("2026-11-02T12:00:00.000Z");
  const volumeId = inspect({ ...base, repo }, now).freeSpace.volumeId;
  if (!volumeId) return t.skip("current free-space volume has no stable identity on this host");
  writeFileSync(path, JSON.stringify({ version: 1, freshForMinutes: 180, samples: [
    { volumeId, observedAt: "2026-11-02T10:00:00.000Z", freeBytes: 9000000 },
    { volumeId, observedAt: "2026-11-02T11:00:00.000Z", freeBytes: 5400000 },
  ] }));
  const r = inspect({ ...base, repo, freeSpaceHistory: path }, now);
  assert.deepEqual(r.freeSpaceTrend, {
    status: "available", volumeId, changeBytes: -3600000, elapsedMs: 3600000, bytesPerHour: -3600000,
  });
  assert.ok(summary(r, 0).includes(`free-space trend changed -3600000 bytes over 1h (-3600000 bytes/hour) on ${volumeId}`));

  if (!onWsl) {
    const noBinding = inspect({ ...base, repo, freeSpaceHistory: path }, now, lstatSync, () => null);
    assert.equal(noBinding.freeSpaceTrend.status, "unavailable");
    assert.match(noBinding.freeSpaceTrend.reason, /current free-space volume/);
  }

  writeFileSync(path, JSON.stringify({ version: 1, freshForMinutes: 180, samples: [
    { volumeId, observedAt: "2026-11-02T10:00:00.000Z", freeBytes: 9000000 },
    { volumeId: "other-volume", observedAt: "2026-11-02T11:00:00.000Z", freeBytes: 5400000 },
  ] }));
  const mismatch = inspect({ ...base, repo, freeSpaceHistory: path }, now);
  assert.equal(mismatch.freeSpaceTrend.status, "unavailable");
  assert.match(mismatch.freeSpaceTrend.reason, /does not match/);

  writeFileSync(path, JSON.stringify({ version: 1, freshForMinutes: 30, samples: [
    { volumeId, observedAt: "2026-11-02T10:00:00.000Z", freeBytes: 9000000 },
    { volumeId, observedAt: "2026-11-02T11:00:00.000Z", freeBytes: 5400000 },
  ] }));
  const stale = inspect({ ...base, repo, freeSpaceHistory: path }, now);
  assert.equal(stale.freeSpaceTrend.status, "unavailable");
  assert.match(stale.freeSpaceTrend.reason, /stale/);

  const absent = inspect({ ...base, repo }, now);
  assert.deepEqual(absent.freeSpaceTrend, { status: "unavailable", reason: "history not supplied" });
  assert.match(summary(absent, 0), /free-space trend unavailable \(history not supplied\)/);
  writeFileSync(path, "{bad json");
  const malformed = inspect({ ...base, repo, freeSpaceHistory: path }, now);
  assert.equal(malformed.freeSpaceTrend.status, "unavailable");
  assert.match(malformed.freeSpaceTrend.reason, /could not be read/);
  writeFileSync(path, JSON.stringify({ version: 1, freshForMinutes: 180, samples: [
    { volumeId, observedAt: "2026-11-02T11:00:00.000Z", freeBytes: 9000000 },
    { volumeId, observedAt: "2026-11-02T10:00:00.000Z", freeBytes: -1 },
  ] }));
  const invalidSamples = inspect({ ...base, repo, freeSpaceHistory: path }, now);
  assert.equal(invalidSamples.freeSpaceTrend.status, "unavailable");
  assert.match(invalidSamples.freeSpaceTrend.reason, /invalid sample/);
  writeFileSync(path, JSON.stringify({ version: 1, freshForMinutes: 180, samples: [
    { volumeId, observedAt: "2026-11-02T11:00:00.000Z", freeBytes: 9000000 },
    { volumeId, observedAt: "2026-11-02T10:00:00.000Z", freeBytes: 5400000 },
  ] }));
  const unordered = inspect({ ...base, repo, freeSpaceHistory: path }, now);
  assert.equal(unordered.freeSpaceTrend.status, "unavailable");
  assert.match(unordered.freeSpaceTrend.reason, /strictly increasing/);

  writeFileSync(path, JSON.stringify({ version: 1, freshForMinutes: 180, samples: [] }));
  const empty = inspect({ ...base, repo, freeSpaceHistory: path }, now);
  assert.equal(empty.freeSpaceTrend.status, "unavailable");
  assert.match(empty.freeSpaceTrend.reason, /fewer than two/);
  writeFileSync(path, JSON.stringify({ version: 1, freshForMinutes: 180, samples: [
    { volumeId, observedAt: new Date(now + 1000).toISOString(), freeBytes: 9000000 },
    { volumeId, observedAt: new Date(now + 2000).toISOString(), freeBytes: 5400000 },
  ] }));
  const future = inspect({ ...base, repo, freeSpaceHistory: path }, now);
  assert.equal(future.freeSpaceTrend.status, "unavailable");
  assert.match(future.freeSpaceTrend.reason, /future/);
});

test("only an explicit whole-family cleanup record turns later bytes into regrowth", () => {
  const { base: dir, repo } = fixture(), root = join(dir, "agent-state"), candidate = join(root, "session-a");
  put(join(candidate, "state.json"), "old state");
  const preservation = preservationState({ base: dir, repo }, { [candidate.replaceAll("\\", "/")]: ownedCandidate });
  const initialAt = Date.parse("2026-11-02T10:00:00.000Z"), cleanedAt = "2026-11-02T10:30:00.000Z", laterAt = Date.parse("2026-11-02T11:00:00.000Z");
  const args = { ...base, repo, preservation, agentStateRoots: [root] };
  const priorReport = inspect(args, initialAt);
  const priorFamily = family(priorReport, candidate);
  assert.match(priorFamily.inventoryFingerprint, /^[0-9a-f]{64}$/);
  const prior = join(dir, "prior-footprint.json");
  writeFileSync(prior, JSON.stringify(priorReport));

  put(join(candidate, "new-state.json"), "growth without cleanup");
  const ordinary = inspect({ ...args, regrowth: prior }, laterAt);
  assert.equal(family(ordinary, candidate).growth.classification, "ordinary growth");
  assert.ok(family(ordinary, candidate).growth.changeBytes > 0);
  assert.match(summary(ordinary, 0), /ordinary growth: .* changed \d+ logical bytes/);

  rmSync(candidate, { recursive: true });
  put(join(candidate, "recreated.json"), "state after recorded cleanup");
  const cleanupRecord = join(dir, "cleanup-record.json");
  const completeRecord = { version: 1, status: "completed", scope: "whole-family", cleanedAt,
    snapshot: priorReport.snapshot, families: [{ path: candidate, inventoryFingerprint: priorFamily.inventoryFingerprint }] };
  writeFileSync(cleanupRecord, JSON.stringify(completeRecord));
  const regrowth = inspect({ ...args, regrowth: prior, cleanupRecord }, laterAt);
  assert.equal(family(regrowth, candidate).growth.classification, "regrowth");
  assert.ok(family(regrowth, candidate).growth.currentBytes > 0);
  assert.match(summary(regrowth, 0), /regrowth: .* reappeared with \d+ logical bytes/);

  const rejectRecord = (name, value) => {
    const path = join(dir, `${name}.json`);
    writeFileSync(path, JSON.stringify(value));
    assert.throws(() => inspect({ ...args, regrowth: prior, cleanupRecord: path }, laterAt), /Cleanup record|does not match prior family/);
  };
  rejectRecord("planned-cleanup", { ...completeRecord, status: "planned" });
  rejectRecord("partial-cleanup", { ...completeRecord, scope: "partial" });
  rejectRecord("early-cleanup", { ...completeRecord, cleanedAt: priorReport.observedAt });
  rejectRecord("late-cleanup", { ...completeRecord, cleanedAt: new Date(laterAt).toISOString() });
  rejectRecord("different-snapshot", { ...completeRecord, snapshot: { ...priorReport.snapshot, workspace: { ...priorReport.snapshot.workspace, root: "other" } } });
  rejectRecord("wrong-family", { ...completeRecord, families: [{ path: `${candidate}-other`, inventoryFingerprint: priorFamily.inventoryFingerprint }] });
  rejectRecord("wrong-fingerprint", { ...completeRecord, families: [{ path: candidate, inventoryFingerprint: "0".repeat(64) }] });

  const incompletePrior = join(dir, "incomplete-prior.json");
  writeFileSync(incompletePrior, JSON.stringify({ ...priorReport, coverage: { ...priorReport.coverage, inventoryComplete: false } }));
  assert.throws(() => inspect({ ...args, regrowth: incompletePrior }, laterAt), /complete version 1 report/);
});

const hasGitLfs = spawnSync("git", ["lfs", "version"], { encoding: "utf8" }).status === 0;
test("skip-smudge worktree checkout keeps a tracked LFS pointer while ordinary checkout materializes it", { skip: !hasGitLfs && "git-lfs is unavailable" }, () => {
  const baseDir = mkdtempSync(join(tmpdir(), "footprint-lfs-")), source = join(baseDir, "source");
  const skipped = join(baseDir, "skip-smudge"), materialized = join(baseDir, "ordinary-checkout");
  made.push(baseDir);
  mkdirSync(source);
  git(source, "init", "-q", "-b", "main");
  const install = spawnSync("git", ["-C", source, "lfs", "install", "--local"], { encoding: "utf8", windowsHide: true });
  assert.equal(install.status, 0, install.error?.message ?? install.stderr);
  put(join(source, ".gitattributes"), "payload.bin filter=lfs diff=lfs merge=lfs -text\n");
  const payload = Buffer.alloc(4096, 7);
  writeFileSync(join(source, "payload.bin"), payload);
  git(source, "add", "-A");
  git(source, "commit", "-qm", "seed a local LFS object");
  const pointer = Buffer.from(git(source, "show", "HEAD:payload.bin"));
  assert.ok(pointer.length < payload.length);

  const objectStore = join(source, ".git", "lfs", "objects");
  const objectBytes = (dir) => existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).reduce((total, entry) => {
    const path = join(dir, entry.name);
    return total + (entry.isDirectory() ? objectBytes(path) : lstatSync(path).size);
  }, 0) : 0;
  assert.equal(objectBytes(objectStore), payload.length);
  const skipSmudge = spawnSync("git", ["-C", source, "worktree", "add", "--detach", skipped, "HEAD"], {
    encoding: "utf8", timeout: 15000, windowsHide: true,
    env: { ...process.env, GIT_LFS_SKIP_SMUDGE: "1" },
  });
  assert.equal(skipSmudge.status, 0, skipSmudge.error?.message ?? `${skipSmudge.stdout}\n${skipSmudge.stderr}`);
  assert.deepEqual(readFileSync(join(skipped, "payload.bin")), pointer);
  assert.equal(objectBytes(objectStore), payload.length);

  const env = { ...process.env };
  delete env.GIT_LFS_SKIP_SMUDGE;
  const ordinary = spawnSync("git", ["-C", source, "worktree", "add", "--detach", materialized, "HEAD"], {
    encoding: "utf8", timeout: 15000, windowsHide: true, env,
  });
  assert.equal(ordinary.status, 0, ordinary.error?.message ?? `${ordinary.stdout}\n${ordinary.stderr}`);
  assert.deepEqual(readFileSync(join(materialized, "payload.bin")), payload);
  assert.equal(objectBytes(objectStore), payload.length);
});

test("--dedupe counts bytes identical to tracked files", () => {
  const { repo } = fixture();
  put(join(repo, "assets/big.bin"), MiB);
  git(repo, "add", "assets/big.bin");
  const r = inspect({ ...base, repo, dedupe: true });
  assert.equal(family(r, ".scratch/t171-wip").identicalToTrackedBytes, 1024 ** 2);
  assert.equal(family(r, ".scratch/notes").identicalToTrackedBytes, 0);
});

test("conformance flags pytest without retention and tracked .scratch citations", () => {
  const { repo } = fixture();
  put(join(repo, "pyproject.toml"), "[tool.pytest.ini_options]\naddopts = \"-q\"\n");
  git(repo, "add", "pyproject.toml");
  let c = inspect({ ...base, repo }).conformance;
  assert.equal(c.pytestRetention.finding, true);
  assert.match(c.pytestRetention.fix, /tmp_path_retention_policy = "failed"/);
  assert.deepEqual(c.scratchCitations.map((s) => s.file), ["docs/report.md"]);
  appendFileSync(join(repo, "pyproject.toml"), 'tmp_path_retention_policy = "failed"\n');
  c = inspect({ ...base, repo }).conformance;
  assert.equal(c.pytestRetention.finding, false);
  assert.equal(conformance([{ rel: "src/app.js", text: "" }]).pytestRetention.finding, false);
  assert.match(readFileSync(join(repo, "pyproject.toml"), "utf8"), /retention/);
});
