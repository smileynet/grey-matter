import "./test-git-env.mjs";
import { after } from "node:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "spike-orchestrate-fixture.mjs");
const hasTkt = !spawnSync("tkt", ["--version"]).error;
const base = mkdtempSync(join(tmpdir(), "gm-fixture-test-"));
after(() => rmSync(base, { recursive: true, force: true, maxRetries: 3 }));

const fixture = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });
// NODE_TEST_CONTEXT would make the fixture's own `node --test` report to this runner and exit 0.
const { NODE_TEST_CONTEXT, ...env } = process.env;
const inDir = (dir, cmd, args) =>
  spawnSync(cmd, args, { cwd: dir, env, encoding: "utf8", shell: process.platform === "win32" && cmd === "npm" });

export { SCRIPT, hasTkt, base, fixture, inDir };
