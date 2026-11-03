#!/usr/bin/env node
// Runs `node --test <files>` on Windows; elsewhere prints why it skipped and exits 0.
// For the model-tier spike harnesses (tickets 168-171), which pin Windows CLI paths and
// environment at import time, so their tests cannot load on Linux or macOS. Their
// decommissioning is tracked separately; this keeps the gate honest until then.
//
// Usage: node scripts/windows-only.mjs <test-file>...
import { spawnSync } from "node:child_process";

const files = process.argv.slice(2);
if (!files.length) { console.error("usage: node scripts/windows-only.mjs <test-file>..."); process.exit(2); }
if (process.platform !== "win32") {
  console.log(`skip: Windows-only spike harness tests on ${process.platform}: ${files.join(" ")}`);
  process.exit(0);
}
const r = spawnSync(process.execPath, ["--test", ...files], { stdio: "inherit", windowsHide: true });
process.exit(r.status ?? 1);
