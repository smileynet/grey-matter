import "./test-git-env.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
function fixture(fn) {
  const dir = mkdtempSync(join(tmpdir(), "verify tkt usage "));
  try {
    const pack = join(dir, "pack"), skills = join(pack, ".kiro/skills/example"), cache = join(dir, "cache.json"), log = join(dir, "calls.jsonl"), cli = join(dir, "fake-tkt.mjs");
    mkdirSync(skills, { recursive: true });
    writeFileSync(join(skills, "SKILL.md"), "# Example\nIdentify with the global `--agent` flag.\nRun `tkt --agent codex ready` before deploying.\n```bash\ntkt new sample \\\n  --agents codex\n```\n");
    writeFileSync(cli, `import { appendFileSync } from "node:fs";\nconst args = process.argv.slice(2);\nappendFileSync(process.env.FAKE_TKT_LOG, JSON.stringify(args) + "\\n");\nif (args[0] === "--version") { console.log(process.env.FAKE_TKT_VERSION ?? "tkt 0.4.0 (92d4833)"); process.exit(0); }\nif (args[0] === "--help") { console.log("Usage: tkt [OPTIONS] <COMMAND>\\n  --version\\n  -h, --help"); process.exit(0); }\nif (args[0] === "capabilities") { console.log(JSON.stringify({version:"0.4.0",commands:{new:{inputSchema:{properties:{slug:{type:"string"}}}},ready:{inputSchema:{properties:{json:{type:"boolean"}}}}}})); process.exit(0); }\nif (args[0] === "new" && args[1] === "--help") { console.log("Usage: tkt new [OPTIONS] <SLUG>\\n  --title <TITLE>\\n  --tags <TAGS>\\n  -h, --help"); process.exit(0); }\nif (args[0] === "ready" && args[1] === "--help") { console.log("Usage: tkt ready [OPTIONS]\\n  --json\\n  -h, --help"); process.exit(0); }\nprocess.exit(2);\n`);
    execFileSync("git", ["-C", pack, "init", "-q"]);
    execFileSync("git", ["-C", pack, "add", "."]);
    execFileSync("git", ["-C", pack, "commit", "-qm", "fixture pack"]);
    fn({ dir, pack, cache, log, cli });
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
function run({ pack, cache, log, cli, cwd, env = {} }) {
  return spawnSync(process.execPath, [join(here, "verify-tkt-usage.mjs"), "--pack", pack, "--tkt", process.execPath, "--tkt-prefix", cli, "--cache", cache], {
    cwd: cwd ?? pack, encoding: "utf8", windowsHide: true,
    env: { ...process.env, FAKE_TKT_LOG: log, ...env },
  });
}

test("pack commands report a flag missing from both capabilities and help", () => fixture(({ pack, cache, log, cli }) => {
  const result = run({ pack, cache, log, cli });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /tkt 0\.4\.0 \(92d4833\)/);
  assert.match(result.stdout, /global --agent is not supported/);
  assert.match(result.stdout, /new.*--agents.*not supported/);
}));

test("verified results are reused only for the same identity and command set", () => fixture(({ dir, pack, cache, log, cli }) => {
  writeFileSync(join(pack, ".kiro/skills/example/SKILL.md"), "# Example\nRun `tkt new sample --tags test`.\n");
  const first = run({ pack, cache, log, cli }); assert.equal(first.status, 0, first.stdout + first.stderr);
  const before = readFileSync(log, "utf8").trim().split("\n").length;
  const repeated = run({ pack, cache, log, cli }); assert.equal(repeated.status, 0, repeated.stdout + repeated.stderr);
  assert.match(repeated.stdout, /"reused": true/);
  assert.equal(readFileSync(log, "utf8").trim().split("\n").length, before + 2, "identity probes run, help results are reused");
  writeFileSync(join(pack, ".kiro/skills/example/SKILL.md"), "# Example\nRun `tkt new sample --tags test --agents codex`.\n");
  execFileSync("git", ["-C", pack, "add", "."]); execFileSync("git", ["-C", pack, "commit", "-qm", "changed command"]);
  const changed = run({ pack, cache, log, cli }); assert.equal(changed.status, 1, changed.stdout + changed.stderr);
  assert.match(changed.stdout, /"reused": false/);
  assert.match(changed.stdout, /--agents.*not supported/);
  const changedAgain = run({ pack, cache, log, cli }); assert.match(changedAgain.stdout, /"reused": true/);
  const environmentChanged = run({ pack, cache, log, cli, env: { CACHE_SCOPE: "different" } });
  assert.match(environmentChanged.stdout, /"reused": false/);
  const environmentRepeated = run({ pack, cache, log, cli, env: { CACHE_SCOPE: "different" } });
  assert.match(environmentRepeated.stdout, /"reused": true/);
  const cwdChanged = run({ pack, cache, log, cli, cwd: dir }); assert.match(cwdChanged.stdout, /"reused": false/);
  const cwdRepeated = run({ pack, cache, log, cli, cwd: dir }); assert.match(cwdRepeated.stdout, /"reused": true/);
  appendFileSync(cli, "\n// executable prefix changed\n");
  const executableChanged = run({ pack, cache, log, cli, cwd: dir }); assert.match(executableChanged.stdout, /"reused": false/);
  const buildChanged = run({ pack, cache, log, cli, cwd: dir, env: { CACHE_SCOPE: "different", FAKE_TKT_VERSION: "tkt 0.4.0 (abcdef0)" } });
  assert.match(buildChanged.stdout, /"reused": false/);
  assert.match(buildChanged.stdout, /"buildHash": "abcdef0"/);
}));

test("a missing CLI is an infrastructure failure and does not cache an audit", () => fixture(({ dir, pack, cache }) => {
  const result = spawnSync(process.execPath, [join(here, "verify-tkt-usage.mjs"), "--pack", pack, "--tkt", join(dir, "missing-tkt.exe"), "--cache", cache], { encoding: "utf8", windowsHide: true });
  assert.equal(result.status, 2, result.stdout + result.stderr);
  assert.match(result.stderr, /cannot resolve tkt executable/);
  assert.equal(existsSync(cache), false);
  assert.equal(JSON.parse(result.stdout).status, "error");
}));

test("help and version comments do not invent commands from prose", () => fixture(({ pack, cache, log, cli }) => {
  writeFileSync(join(pack, ".kiro/skills/example/SKILL.md"), "Run `tkt help` or `tkt help new`.\n```bash\ntkt --version # tkt version before\n```\nRequires `git`, `node`, and `tkt`.\n");
  const source = readFileSync(cli, "utf8").replace('commands:{new:', 'commands:{help:{inputSchema:{properties:{}}},new:');
  writeFileSync(cli, source.replace("if (args[0] === \"--help\")", "if (args[0] === \"--help\" || args[0] === \"help\")"));
  const result = run({ pack, cache, log, cli });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).findings, []);
  assert.ok(!readFileSync(log, "utf8").includes('["help","--help"]'));
}));

test("a help probe crash is an execution error rather than unsupported usage", () => fixture(({ pack, cache, log, cli }) => {
  writeFileSync(join(pack, ".kiro/skills/example/SKILL.md"), "Run `tkt broken`.\n");
  const result = run({ pack, cache, log, cli });
  assert.equal(result.status, 2, result.stdout + result.stderr);
  assert.equal(JSON.parse(result.stdout).status, "error");
  assert.equal(existsSync(cache), false);
}));

test("an explicitly rejected command is a compatibility finding", () => fixture(({ pack, cache, log, cli }) => {
  writeFileSync(join(pack, ".kiro/skills/example/SKILL.md"), "Run `tkt removed`.\n");
  writeFileSync(cli, readFileSync(cli, "utf8").replace('process.exit(2);', 'console.error("error: unrecognized subcommand removed"); process.exit(2);'));
  const result = run({ pack, cache, log, cli });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(JSON.parse(result.stdout).findings[0], /command removed is not supported/);
}));
