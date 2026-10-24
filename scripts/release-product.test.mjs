import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { verifyProduct } from "./release-product.mjs";
const scripts = dirname(fileURLToPath(import.meta.url));
const git = (repo, ...args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: "pipe" }).trim();
const put = (file, bytes) => { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, bytes); };
function fixture(fn, source = 'if (!process.argv.includes("--require-tools")) process.exit(3); console.log("product fixture passed");') {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "product gate "))), repo = join(dir, "repo"), out = join(dir, "evidence");
  try {
    mkdirSync(repo); git(repo, "init", "-b", "main"); git(repo, "config", "user.name", "Fixture"); git(repo, "config", "user.email", "fixture@example.invalid"); git(repo, "config", "core.autocrlf", "false");
    for (const host of ["claude", "codex"]) put(join(repo, `.${host}-plugin/plugin.json`), '{"name":"grey-matter","version":"0.1.0"}\n');
    put(join(repo, "scripts/check-repo.mjs"), source);
    git(repo, "add", "."); git(repo, "-c", `core.hooksPath=${join(dir, "no hooks")}`, "commit", "-m", "Product fixture");
    const sha = git(repo, "rev-parse", "HEAD");
    fn({ repo, out, dir, sha, run: (extra = {}) => verifyProduct({ repo, out, sha, ...extra }) });
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
test("product dry-run creates no output and requires strict tooling", () => fixture(({ out, run }) => {
  const result = run(); assert.equal(result.mode, "dry-run"); assert.equal(result.status, "not-run"); assert.equal(existsSync(out), false); assert.deepEqual(result.commands[0].slice(1), ["scripts/check-repo.mjs", "--require-tools"]);
}));
test("passed product evidence records exact commit, command, log and pending gates", () => fixture(({ run, out, sha }) => {
  const result = run({ execute: true }); assert.equal(result.status, "pass"); assert.equal(result.publishable, false); assert.equal(result.candidateSha, sha); assert.match(result.checks[0].sha256, /^[a-f0-9]{64}$/); assert.match(readFileSync(join(out, result.checks[0].log), "utf8"), /fixture passed/); assert.deepEqual(JSON.parse(readFileSync(join(out, "product-evidence.json"))), result); assert.ok(result.pending.includes("native"));
}));
test("a failed product command is retained as failure, never verified", () => fixture(({ run, out }) => {
  const result = run({ execute: true }); assert.equal(result.status, "fail"); assert.equal(result.checks[0].exit, 7); assert.equal(JSON.parse(readFileSync(join(out, "product-evidence.json"))).status, "fail");
}, 'console.error("seeded failed gate"); process.exit(7);'));
test("product checks cannot inherit publishing credentials", () => {
  const keys = ["RELEASE_CARGO_TOKEN", "CARGO_REGISTRY_TOKEN", "GH_TOKEN", "GITHUB_TOKEN", "NODE_AUTH_TOKEN", "NPM_TOKEN", "CUSTOM_PUBLISH_CREDENTIAL"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    for (const key of keys) process.env[key] = "dummy-publication-credential";
    fixture(({ run }) => {
      const result = run({ execute: true });
      assert.equal(result.status, "pass", "product check inherited a publication credential");
    }, `const keys = ${JSON.stringify(keys)}; if (keys.some(key => process.env[key])) process.exit(9);`);
    for (const key of keys) assert.equal(process.env[key], "dummy-publication-credential");
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
test("successful exit cannot hide candidate changes", () => fixture(({ run }) => {
  const result = run({ execute: true }); assert.equal(result.status, "fail"); assert.match(result.candidateError, /clean/);
}, 'import {writeFileSync} from "node:fs"; writeFileSync("foreign.txt", "seeded");'));
test("dirty and moved candidates fail before creating evidence", () => fixture(({ run, repo, out }) => {
  assert.throws(() => run({ sha: "main" }), /full candidate/); put(join(repo, "untracked"), "foreign"); assert.throws(() => run({ execute: true }), /clean/); assert.equal(existsSync(out), false);
}));
test("foreign evidence and candidate-local output are refused without overwrite", () => fixture(({ run, repo, out }) => {
  assert.throws(() => run({ execute: true, out: join(repo, "evidence") }), /outside/); mkdirSync(out); put(join(out, "foreign"), "keep"); assert.throws(() => run({ execute: true }), /new directory/); assert.equal(readFileSync(join(out, "foreign"), "utf8"), "keep");
}));
test("symlink or junction output aliases cannot bypass candidate boundary", () => fixture(({ run, repo, dir }) => {
  const alias = join(dir, "alias"); symlinkSync(repo, alias, process.platform === "win32" ? "junction" : "dir"); assert.throws(() => run({ execute: true, out: join(alias, "evidence") }), /outside/);
}));
test("tkt selects its Cargo authority and full mise gate", () => fixture(({ run, repo, out }) => {
  for (const host of ["claude", "codex"]) put(join(repo, `.${host}-plugin/plugin.json`), '{"name":"tkt","version":"0.1.0"}\n');
  put(join(repo, "Cargo.toml"), '[package]\nname = "tkt"\nversion = "0.1.0"\n');
  put(join(repo, "Cargo.lock"), 'version = 4\n[[package]]\nname = "tkt"\nversion = "0.1.0"\n');
  git(repo, "add", "."); git(repo, "-c", "core.hooksPath=" + join(repo, "no hooks"), "commit", "-m", "Cargo fixture");
  const sha = git(repo, "rev-parse", "HEAD");
  assert.throws(() => run(), /requested commit/);
  const result = run({ sha }); assert.equal(result.product, "tkt"); assert.deepEqual(result.commands, [["mise", "run", "check"]]); assert.equal(existsSync(out), false);
}));
test("aggregate strict mode fails instead of skipping missing tkt", () => {
  const dir = mkdtempSync(join(tmpdir(), "strict product "));
  try {
    const source = readFileSync(join(scripts, "check-repo.mjs"), "utf8"); put(join(dir, "check-repo.mjs"), source);
    for (const match of source.matchAll(/join\(SCRIPTS, "([^"/]+\.mjs)"\)/g)) put(join(dir, match[1]), "// isolated stub: command dispatch fixture\n");
    const run = (args) => spawnSync(process.execPath, [join(dir, "check-repo.mjs"), ...args], { encoding: "utf8", env: { ...process.env, PATH: dir } });
    const normal = run([]); assert.equal(normal.status, 0, normal.stderr); assert.match(normal.stdout, /skipped: tkt not found/);
    const strict = run(["--require-tools"]); assert.equal(strict.status, 1, strict.stdout); assert.match(strict.stderr, /FAILED: tkt not found/);
    assert.equal(run(["--unknown"]).status, 2);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
