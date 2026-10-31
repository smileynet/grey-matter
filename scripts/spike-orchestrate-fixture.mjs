#!/usr/bin/env node
// spike-orchestrate-fixture.mjs: build the disposable sandbox repo that the orchestrate
// harness spikes (tickets 125-129) run on. Proposal 17, "Shared fixture (spike 0)", defines it.
//
// Usage:
//   node scripts/spike-orchestrate-fixture.mjs create [--variant trunk|pr] [--dir <path>] [--force]
//          [--create-github-repo <owner/name>]
//   node scripts/spike-orchestrate-fixture.mjs clean [--variant trunk|pr] [--dir <path>]
//          [--delete-github-repo <owner/name>]
//
// The sandbox defaults to <os tmpdir>/gm-orchestrate-fixture-<variant> and is refused inside
// grey-matter. Commits are signed under the user's own git config, so commit SHAs differ between
// runs; the fixture's identity is its tree hash, which `create` prints and which is identical
// on every run. The PR variant creates a private GitHub repo only when --create-github-repo names
// it, and `clean` deletes that repo only when --delete-github-repo names it.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE = join(REPO, "skills/productivity/delivery-dashboard/assets/dashboard-template.html");
// `clean` deletes only a directory carrying this marker.
const MARKER = ".orchestrate-fixture";
const DATE = "2026-10-31T00:00:00Z";

const LANDING = {
  trunk: `## Landing

Commit to \`main\`. A worker running in its own worktree commits on \`tkt/NN-slug\`, and the
orchestrator merges that branch into \`main\` after review. This repo has no remote: never push.`,
  pr: `## Landing

\`main\` changes only through pull requests. A worker pushes \`tkt/NN-slug\` and opens a PR;
the orchestrator reviews and merges it. Never push to \`main\` directly.`,
};

const agentsMd = (variant) => `# orchestrate-fixture

A disposable sandbox for the grey-matter orchestrate spikes. Throwaway: nothing here ships.

- Test: \`npm test\` (node's built-in runner, a few seconds). Run it before every commit.
- Dashboard: \`docs/status.html\` (the delivery-dashboard template). Add one entry per closed ticket.
- Each ticket's \`Touches:\` line lists the files it may change. Change no others.

${LANDING[variant]}
`;

const ticket = (id, slug, title, body, blockedBy = []) => [
  `${id}-${slug}.md`,
  `---
id: "${id}"
title: "${title}"
status: open
blocked_by: [${blockedBy.map((b) => `"${b}"`).join(", ")}]
tags: ["stream:fixture"]
---

# ${title}

${body.trim()}
`,
];

// T1-T5, each shaped to exercise one orchestrator behaviour (see the proposal's table).
const TICKETS = [
  ticket(1, "multiply", "Add multiply to the arithmetic module", `
Touches: \`src/a.js\`, \`test/a.test.js\`

Export \`multiply(x, y)\` from \`src/a.js\`, next to \`add\`.

## Acceptance criteria

- [ ] \`multiply(3, 4)\` returns 12 and \`multiply(-2, 5)\` returns -10, each covered by a test.
- [ ] \`npm test\` passes.
`),
  ticket(2, "greeting", "Add the returning-user greeting", `
Touches: \`src/b.js\`, \`test/b.test.js\`

Create \`src/b.js\` exporting one function that returns \`"Welcome back, <name>!"\` for a name.
Name the function with the project glossary's term for a returning user.

## Acceptance criteria

- [ ] The function is named with the glossary term and returns the greeting, covered by a test.
- [ ] \`npm test\` passes.
`),
  ticket(3, "rename-add", "Rename add to sum", `
Touches: \`src/a.js\`, \`test/a.test.js\`

Rename the exported \`add\` in \`src/a.js\` to \`sum\` and update its tests.

## Acceptance criteria

- [ ] \`src/a.js\` exports \`sum\` and no longer exports \`add\`.
- [ ] \`npm test\` passes.
`),
  ticket(4, "square", "Add square, built on multiply", `
Touches: \`src/c.js\`, \`test/c.test.js\`

Create \`src/c.js\` exporting \`square(x)\`, implemented with \`multiply\` from \`src/a.js\`.

## Acceptance criteria

- [ ] \`square(5)\` returns 25, covered by a test.
- [ ] \`npm test\` passes.
`, ["1"]),
  ticket(5, "drop-readme", "Delete the README", `
Touches: \`README.md\`

Delete \`README.md\`; \`AGENTS.md\` covers what it says.

## Acceptance criteria

- [ ] \`README.md\` no longer exists.
- [ ] \`npm test\` passes.
`),
];

const FILES = {
  "README.md": "# orchestrate-fixture\n\nA small arithmetic module. See AGENTS.md for how work lands here.\n",
  ".gitignore": "node_modules/\n.scratch/\n",
  "package.json": JSON.stringify({ name: "orchestrate-fixture", private: true, type: "module", scripts: { test: "node --test" } }, null, 2) + "\n",
  "src/a.js": "export const add = (x, y) => x + y;\n",
  "test/a.test.js": `import { test } from "node:test";
import assert from "node:assert/strict";
import { add } from "../src/a.js";

test("add sums two numbers", () => {
  assert.equal(add(2, 3), 5);
  assert.equal(add(-1, 1), 0);
});
`,
};

function fail(msg, code = 2) {
  console.error(`spike-orchestrate-fixture: ${msg}`);
  process.exit(code);
}

function sh(cmd, args, cwd, env = {}) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", env: { ...process.env, ...env } });
  if (r.error) fail(`${cmd} could not start: ${r.error.message}`);
  if (r.status !== 0) fail(`${cmd} ${args.join(" ")} exited ${r.status}\n${r.stderr || r.stdout}`);
  return r.stdout.trim();
}

function parse(argv) {
  const [cmd, ...rest] = argv;
  const opts = { cmd, variant: "trunk", force: false };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    const val = () => rest[++i] ?? fail(`${a} needs a value`);
    if (a === "--variant") opts.variant = val();
    else if (a === "--dir") opts.dir = val();
    else if (a === "--force") opts.force = true;
    else if (a === "--create-github-repo") opts.createRepo = val();
    else if (a === "--delete-github-repo") opts.deleteRepo = val();
    else fail(`unknown argument ${a}`);
  }
  if (!["create", "clean"].includes(cmd)) fail("usage: spike-orchestrate-fixture.mjs create|clean [options] (see the header comment)");
  if (!LANDING[opts.variant]) fail(`--variant must be trunk or pr, not ${opts.variant}`);
  opts.dir = resolve(opts.dir ?? join(tmpdir(), `gm-orchestrate-fixture-${opts.variant}`));
  const rel = relative(REPO, opts.dir);
  if (!rel || (!rel.startsWith("..") && !isAbsolute(rel))) fail(`the sandbox must be outside grey-matter, not ${opts.dir}`);
  return opts;
}

function write(dir, path, content) {
  const full = join(dir, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

function create({ dir, variant, force, createRepo }) {
  if (variant === "pr" && !createRepo) {
    fail("the pr variant creates a private GitHub repo; pass --create-github-repo <owner/name> once the user has approved it");
  }
  if (variant !== "pr" && createRepo) fail("--create-github-repo applies only to --variant pr");
  if (existsSync(dir)) {
    if (!force) fail(`${dir} exists; pass --force to rebuild it, or run clean first`);
    removeSandbox(dir);
  }
  mkdirSync(dir, { recursive: true });
  sh("git", ["init", "-q", "-b", "main"], dir);
  sh("git", ["config", "core.autocrlf", "false"], dir);

  for (const [path, content] of Object.entries(FILES)) write(dir, path, content);
  write(dir, "AGENTS.md", agentsMd(variant));
  sh("tkt", ["init", "-q", "--write", "AGENTS.md"], dir);
  // Only the PR variant has a remote for tkt's auto-push.
  const cfg = join(dir, ".tickets/config.toml");
  writeFileSync(cfg, readFileSync(cfg, "utf8").replace(/^enabled = true$/m, `enabled = ${variant === "pr"}`));
  for (const [name, content] of TICKETS) write(dir, `.tickets/${name}`, content);
  const template = readFileSync(TEMPLATE, "utf8");
  const config = '{ "project": "Project name", "recentCount": 5 }';
  if (!template.includes(config)) fail("the dashboard template's gm-config block changed; update this script");
  write(dir, "docs/status.html", template.replace(config, '{ "project": "Orchestrate fixture", "recentCount": 5 }'));
  write(dir, MARKER, `${variant}\n`);

  const who = { GIT_AUTHOR_NAME: "fixture", GIT_AUTHOR_EMAIL: "fixture@example.invalid", GIT_AUTHOR_DATE: DATE,
    GIT_COMMITTER_NAME: "fixture", GIT_COMMITTER_EMAIL: "fixture@example.invalid", GIT_COMMITTER_DATE: DATE };
  sh("git", ["add", "-A"], dir);
  sh("git", ["commit", "-q", "-m", "fixture: seed orchestrate spike"], dir, who);
  const tree = sh("git", ["rev-parse", "HEAD^{tree}"], dir);

  if (createRepo) sh("gh", ["repo", "create", createRepo, "--private", "--source", dir, "--remote", "origin", "--push"], dir);

  console.log(JSON.stringify({ dir, variant, tree, github: createRepo ?? null }, null, 2));
}

function removeSandbox(dir) {
  if (!existsSync(join(dir, MARKER))) fail(`${dir} has no ${MARKER} marker; refusing to delete it`);
  // Worktrees a spike registered outside the sandbox go too; ones inside it go with the directory.
  const list = spawnSync("git", ["worktree", "list", "--porcelain"], { cwd: dir, encoding: "utf8" }).stdout ?? "";
  const worktrees = list.split("\n").filter((l) => l.startsWith("worktree ")).map((l) => resolve(l.slice(9).trim()));
  for (const wt of worktrees.slice(1)) rmSync(wt, { recursive: true, force: true, maxRetries: 3 });
  rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
  return worktrees.slice(1);
}

function clean({ dir, deleteRepo }) {
  const worktrees = existsSync(dir) ? removeSandbox(dir) : [];
  if (deleteRepo) sh("gh", ["repo", "delete", deleteRepo, "--yes"], REPO);
  console.log(JSON.stringify({ removed: existsSync(dir) ? null : dir, worktrees, github: deleteRepo ?? null }, null, 2));
}

const opts = parse(process.argv.slice(2));
if (opts.cmd === "create") create(opts);
else clean(opts);
