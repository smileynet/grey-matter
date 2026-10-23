#!/usr/bin/env node
// check-plugin-manifest.mjs — check-repo invariant 9: the plugin manifests stay true to
// disk, to each other, and to the latest release tag (tickets 22, 64). The checks live in
// `deploy.mjs check` so every pack that vendors the deployer gets them; this runs it here.
//
// Read-only. Exit 0 = consistent, 1 = at least one problem (details on stderr).
// Run:  node scripts/check-plugin-manifest.mjs
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const deploy = join(dirname(fileURLToPath(import.meta.url)), "deploy.mjs");
const r = spawnSync(process.execPath, [deploy, "check"], { stdio: "inherit" });
process.exit(r.status ?? 1);
