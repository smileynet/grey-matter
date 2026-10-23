#!/usr/bin/env node
// build-agy-plugin.mjs: kept so existing docs and habits work. agy packaging now lives in
// scripts/deploy.mjs (proposal 08): `deploy.mjs agy [build|install] [--out DIR]`.
//   node scripts/build-agy-plugin.mjs [build] [--out DIR]   -> deploy.mjs agy build
//   node scripts/build-agy-plugin.mjs install [--out DIR]   -> deploy.mjs agy install
// --validate is accepted and ignored: `install` always runs agy plugin validate --strict first.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const deploy = join(dirname(fileURLToPath(import.meta.url)), "deploy.mjs");
const argv = process.argv.slice(2).filter((a) => a !== "--validate");
const sub = argv.includes("install") ? "install" : "build";
const rest = argv.filter((a) => a !== "install" && a !== "build");
const r = spawnSync(process.execPath, [deploy, "agy", sub, ...rest], { stdio: "inherit" });
process.exit(r.status ?? 1);
