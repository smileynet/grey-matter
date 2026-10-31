// Fixture tests for repository-artifact-hygiene's footprint inspector: one throwaway repo seeded
// with each case the inspector must see, never operator data.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { linkSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { conformance, inspect, options, summary } from "../skills/meta/repository-artifact-hygiene/scripts/inspect-footprint.mjs";

const SCRIPT = new URL("../skills/meta/repository-artifact-hygiene/scripts/inspect-footprint.mjs", import.meta.url).pathname;
const git = (cwd, ...args) => {
  const r = spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", ...args], { cwd });
  assert.equal(r.status, 0, r.stderr.toString());
  return r.stdout.toString();
};
const put = (path, body) => { mkdirSync(join(path, ".."), { recursive: true }); writeFileSync(path, body); };
const family = (r, path) => r.families.find((f) => f.path === path);
const MiB = Buffer.alloc(1024 ** 2, 1);

function fixture() {
  const base = mkdtempSync(join(tmpdir(), "footprint-")), repo = join(base, "repo");
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

async function holdOpen(path) {
  const child = spawn(process.execPath, ["-e", `require("fs").openSync(${JSON.stringify(path)}, "r"); console.log("ready"); setInterval(() => {}, 1000)`]);
  await new Promise((ok) => child.stdout.once("data", ok));
  return child;
}

const base = { paths: [], quietMinutes: 0, floor: 0, topUnder: 0 };

test("seeded families get the right facts and outcomes, and the run goes red", async () => {
  const { repo } = fixture();
  const holder = await holdOpen(join(repo, ".scratch/t171-open/held.txt"));
  try {
    const r = inspect({ ...base, repo, cap: 1024 ** 2 });
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
    assert.equal(open.outcome, "skip");
    assert.deepEqual(open.openFiles, [".scratch/t171-open/held.txt"]);
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

test("goes green once the seeded problems are cleaned up", () => {
  const { base: dir, repo } = fixture();
  for (const p of [".scratch/t170-run-1", ".scratch/t170-linked", ".scratch/notes", ".scratch/t170-cited/junk.bin", "build"]) rmSync(join(repo, p), { recursive: true });
  git(repo, "worktree", "prune");
  const r = inspect({ ...base, repo, cap: 5 * 1024 ** 3 });
  assert.equal(family(r, ".scratch/t170-cited").outcome, "keep");
  assert.deepEqual(r.findings, []);
  assert.equal(r.status, "pass", JSON.stringify(r.families.map((f) => [f.path, f.outcome])));
  assert.equal(spawnSync(process.execPath, [SCRIPT, "--repo", repo, "--floor", "0B", "--quiet", "0m"]).status, 0);
  rmSync(dir, { recursive: true, force: true });
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
