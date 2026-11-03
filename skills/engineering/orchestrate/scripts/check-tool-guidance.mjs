import { execFileSync } from "node:child_process";
import { existsSync, openSync, readFileSync, readSync, closeSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const reference = resolve(root, "skills/engineering/orchestrate/references/tool-scripts.md");
const candidate = /\.(?:mjs|cjs|js|mts|cts|ts|py|ps1|psm1|sh|bash|zsh|fish|rb|pl|lua|r|awk|groovy|bat|cmd)$/i;
const begin = "<!-- tool-script-inventory:begin -->";
const end = "<!-- tool-script-inventory:end -->";

function firstBytes(path) {
  try {
    const fd = openSync(resolve(root, path), "r"), bytes = Buffer.alloc(2);
    try { return readSync(fd, bytes, 0, 2, 0) === 2 && bytes.toString() === "#!"; }
    finally { closeSync(fd); }
  } catch { return false; }
}

function trackedScripts() {
  const indexed = execFileSync("git", ["ls-files", "--cached", "--stage", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean);
  const staged = indexed.flatMap((record) => {
    const separator = record.indexOf("\t"), metadata = record.slice(0, separator), path = record.slice(separator + 1);
    return separator >= 0 && (candidate.test(path) || metadata.startsWith("100755 ") || firstBytes(path)) ? [path] : [];
  });
  const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean)
    .filter((path) => candidate.test(path) || firstBytes(path));
  return [...new Set([...staged, ...untracked])].sort();
}

function parseInventory(markdown) {
  const body = markdown.split(begin)[1]?.split(end)[0];
  if (body === undefined) throw new Error("inventory markers are missing");
  return body.split(/\r?\n/).flatMap((line) => {
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    const path = /^`([^`]+)`$/.exec(cells[0] ?? "")?.[1];
    return path ? [{ path, role: cells[1] ?? "", reason: cells[2] ?? "", guidance: cells[3] ?? "" }] : [];
  });
}

function headingExists(markdown, fragment) {
  const slug = fragment.toLowerCase().replace(/[^a-z0-9 -]/g, "").trim().replace(/\s+/g, "-");
  return markdown.split(/\r?\n/).some((line) => /^#{1,6}\s+/.test(line) && line.replace(/^#{1,6}\s+/, "").toLowerCase().replace(/[^a-z0-9 -]/g, "").trim().replace(/\s+/g, "-") === slug);
}

function linkResolves(markdown, href) {
  if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href)) return false;
  const [target, fragment] = href.split("#", 2);
  const file = target ? resolve(dirname(reference), target) : reference;
  if (file !== reference && !existsSync(file)) return false;
  return !fragment || (file === reference ? headingExists(markdown, fragment) : headingExists(readFileSync(file, "utf8"), fragment));
}

export function audit(markdown, actual) {
  const inventory = parseInventory(markdown), errors = [];
  const known = new Set(inventory.map((entry) => entry.path));
  const details = markdown.split("## Complete tracked script classification")[0] ?? "";
  if (known.size !== inventory.length) errors.push("duplicate path in tool-script inventory");
  for (const path of actual) if (!known.has(path)) errors.push(`unclassified tracked script: ${path}`);
  for (const entry of inventory) {
    if (!actual.includes(entry.path)) errors.push(`stale inventory path: ${entry.path}`);
    if (!["operator", "module", "test", "fixture/template"].includes(entry.role)) errors.push(`invalid or missing role: ${entry.path}`);
    if (!entry.reason || /^(todo|unclassified)$/i.test(entry.reason)) errors.push(`missing classification reason: ${entry.path}`);
    if (entry.role !== "operator") continue;
    const inventoryHref = /\]\(([^)]+)\)/.exec(entry.guidance)?.[1];
    const detail = details.split(/\r?\n/).find((line) => line.includes(`\`${entry.path}\``));
    const detailHrefs = [...(detail ?? "").matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
    const commandShape = detail && (/`(?:node|bash|python3?)\s/.test(detail) || /Git invokes/.test(detail) || /Cargo protocol entry/.test(detail) || /template only/i.test(detail));
    const hasOutcome = detail && /\b(?:output|reports?|returns?|exit|status|rewrites?|writes?|creates?|removes?|held|hold|do not run|do not invoke|failure|pass|fail|finding|mismatch|outcome|lists?)\b/i.test(detail);
    const hasBoundary = detail && /\b(?:authorization|authorized|requires?|only|read-only|held|hold|do not|does not|never|no model|no install)\b/i.test(detail);
    if (!linkResolves(markdown, inventoryHref) || !detail || !detailHrefs.length || !detailHrefs.some((href) => linkResolves(markdown, href)) || !commandShape || !hasBoundary || !hasOutcome) {
      const failed = [!linkResolves(markdown, inventoryHref) && "inventory-link", (!detail || !detailHrefs.length || !detailHrefs.some((href) => linkResolves(markdown, href))) && "detail-link", !commandShape && "command", !hasBoundary && "boundary", !hasOutcome && "outcome"].filter(Boolean).join(", ");
      errors.push(`operator entry contract missing/stale (${failed}): ${entry.path}`);
    }
  }
  return errors;
}

function main() {
  if (process.argv.length > 2) { console.error("Usage: node skills/engineering/orchestrate/scripts/check-tool-guidance.mjs"); process.exitCode = 2; return; }
  const markdown = readFileSync(reference, "utf8"), inventory = parseInventory(markdown), actual = trackedScripts();
  const errors = audit(markdown, actual);
  if (errors.length) { console.error(errors.map((error) => `FAIL ${error}`).join("\n")); process.exitCode = 1; return; }
  const counts = Object.groupBy(inventory, (entry) => entry.role);
  console.log(`PASS tool-script inventory: ${inventory.length} classified paths (${Object.entries(counts).map(([role, entries]) => `${role} ${entries.length}`).join(", ")}); ${actual.length} tracked paths found (script extensions, executable modes and 2-byte shebang checks).`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) main();
