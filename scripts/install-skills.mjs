#!/usr/bin/env node
// install-skills.mjs: kept so existing docs and habits work. The installer is now
// scripts/deploy.mjs (proposal 08); this forwards every argument to it unchanged.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const deploy = join(dirname(fileURLToPath(import.meta.url)), "deploy.mjs");
const r = spawnSync(process.execPath, [deploy, ...process.argv.slice(2)], { stdio: "inherit" });
process.exit(r.status ?? 1);
