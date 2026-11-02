// Fixture tests for repository-artifact-hygiene's footprint inspector: one throwaway repo seeded
// with each case the inspector must see, never operator data.
import "./test-git-env.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { chmodSync, existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
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

test("seeded families get the right facts and outcomes, and the run goes red", async (t) => {
  const { repo } = fixture();
  const holder = await holdOpen(join(repo, ".scratch/t171-open/held.txt"));
  try {
    const r = inspect({ ...base, open: undefined, repo, cap: 1024 ** 2 });
    assert.equal(family(r, ".scratch/t170-run-1").outcome, "delete");
    assert.equal(family(r, ".scratch/t170-run-1").epochDatedFiles, 1);
    const cited = family(r, ".scratch/t170-cited");
    assert.equal(cited.outcome, "slim");
    assert.deepEqual(cited.keep, [".scratch/t170-cited/report.json", ".scratch/t170-cited/sub"]);
    assert.deepEqual(cited.citedBy, ["docs/report.md"]);
    assert.equal(family(r, ".scratch/t171-wip").outcome, "keep");
    assert.deepEqual(family(r, ".scratch/t170-linked").hardLinkedFiles, [".scratch/t170-linked/x"]);
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
    assert.equal(r.families.find((f) => f.path.endsWith("wt-gone")).outcome, "prune");
    assert.deepEqual(r.findings.map((f) => [f.kind, f.ticket]), [["ticket-cap", 170]]);
    assert.equal(r.status, "fail");
  } finally { holder.kill(); }
});

test("the quiet floor skips recent writes: 15 minutes by default, 24 hours for agent state", () => {
  const { repo } = fixture();
  assert.equal(options([]).quietMinutes, 15);
  assert.equal(options(["--agent-state"]).quietMinutes, 1440);
  const r = inspect({ ...base, repo, quietMinutes: 15 });
  assert.equal(family(r, ".scratch/t170-run-1").outcome, "skip");
  assert.match(family(r, ".scratch/t170-run-1").activeReasons[0], /quiet floor 15m/);
  const later = inspect({ ...base, repo, quietMinutes: 15 }, Date.now() + 16 * 60000);
  assert.equal(family(later, ".scratch/t170-run-1").outcome, "delete");
});

test("a citation added after the list was made turns removal into 'keep list changed'", () => {
  const { base: dir, repo } = fixture();
  const prior = join(dir, "prior.json");
  writeFileSync(prior, JSON.stringify(inspect({ ...base, repo })));
  appendFileSync(join(repo, "docs/report.md"), "Also `.scratch/t170-run-1/blob`.\n");
  const r = inspect({ ...base, repo, recheck: prior });
  assert.equal(family(r, ".scratch/t170-run-1").outcome, "keep list changed");
  assert.deepEqual(r.findings.map((f) => f.kind), ["keep-list-changed"]);
  const cli = spawnSync(process.execPath, [SCRIPT, "--repo", repo, "--floor", "0B", "--quiet", "0m", "--recheck", prior]);
  assert.equal(cli.status, 1);
});

test("the free-space floor and the summary line", () => {
  const { repo } = fixture();
  const r = inspect({ ...base, repo, floor: 1024 ** 5 * 1000 });
  assert.deepEqual(r.findings.map((f) => f.kind), ["free-space-floor"]);
  assert.match(summary(r, 1024 ** 5 * 1000), /^free .* under, stop adding data\); largest uncommitted: \.scratch\/t170-run-1 2\.0 MiB/);
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
  const { repo } = fixture(), dir = mkdtempSync(join(tmpdir(), "footprint-powershell-")), executable = join(dir, "powershell.exe");
  made.push(dir);
  writeFileSync(executable, "#!/bin/sh\n");
  chmodSync(executable, 0o755);
  const originalPath = process.env.PATH, originalDistro = process.env.WSL_DISTRO_NAME;
  const name = "fixture distro ; $(touch injected) Ω";
  process.env.PATH = `${dir}${delimiter}${originalPath ?? ""}`;
  process.env.WSL_DISTRO_NAME = name;
  const record = (overrides = {}) => ({ Name: name, BasePath: "R:\\fixture with spaces\\$literal & path", VhdExists: true, Drive: "R", VolumeId: "volume-r", Free: "1234", Total: "9876", ...overrides });
  const run = (response, exit = 0, floor = 0) => {
    const encoded = Buffer.from(JSON.stringify(response), "utf8").toString("base64");
    writeFileSync(executable, `#!/bin/sh\nprintf '%s\\n' '${encoded}'\nexit ${exit}\n`);
    chmodSync(executable, 0o755);
    return inspect({ ...base, repo, floor });
  };
  try {
    const valid = run([record()]);
    assert.equal(valid.freeSpace.entries.find((entry) => entry.path === "Windows R:").free, 1234);
    assert.equal(valid.coverage.hostDrive, "registered R: volume for this WSL distro");
    const volumeId = "\\\\?\\Volume{12345678-1234-1234-1234-123456789abc}\\";
    const volumeIdResult = run([record({ Drive: "", VolumeId: volumeId })]);
    assert.equal(volumeIdResult.coverage.hostDrive, `registered ${volumeId} volume for this WSL distro`);

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
      const result = run(response, exit);
      assert.equal(result.coverage.complete, false, label);
      assert.equal(result.coverage.hostDrive, "unavailable", label);
      assert.equal(result.status, "review", label);
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

test("goes green once the seeded problems are cleaned up", () => {
  const { base: dir, repo } = fixture();
  for (const p of [".scratch/t170-run-1", ".scratch/t170-linked", ".scratch/notes", ".scratch/t170-cited/junk.bin", "build"]) rmSync(join(repo, p), { recursive: true });
  git(repo, "worktree", "prune");
  const r = inspect({ ...base, repo, cap: 5 * 1024 ** 3 });
  assert.equal(family(r, ".scratch/t170-cited").outcome, "keep");
  assert.deepEqual(r.findings, []);
  assert.equal(r.status, "pass", JSON.stringify(r.families.map((f) => [f.path, f.outcome])));
  const cli = spawnSync(process.execPath, [SCRIPT, "--repo", repo, "--floor", "0B", "--quiet", "0m"], { encoding: "utf8" });
  assert.equal(cli.status, 0, cli.stdout + cli.stderr);
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
