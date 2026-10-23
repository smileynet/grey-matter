import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectVersions, versionEdits } from "./release-version.mjs";

function source(changes = {}) {
  const files = {
    ".claude-plugin/plugin.json": '{"name":"example","version":"0.1.0"}',
    ".codex-plugin/plugin.json": '{"name":"example","version":"0.1.0"}',
    "CHANGELOG.md": "# Changelog\n\n## [Unreleased]\n\n### Added\n- A workflow.\n",
    ...changes,
  };
  return { read: (file) => { if (!(file in files)) throw new Error(`fixture missing ${file}`); return files[file]; }, has: (file) => file in files };
}

test("last Unreleased section omits version footer links and hidden comments from notes", () => {
  const { read, has } = source({ "CHANGELOG.md": "## [Unreleased]\n\n<!-- editorial -->\n### Added\n- Visible change.\n\n[Unreleased]: https://example.invalid/compare/v0.1.0...HEAD\n[0.1.0]: https://example.invalid/releases/tag/v0.1.0\n" });
  const result = versionEdits(read, has, "0.2.0", "2026-10-23");
  assert.equal(result.notes, "### Added\n- Visible change.\n");
  assert.match(result.files.get("CHANGELOG.md"), /\[Unreleased\]: https:\/\/example.invalid\/compare\/v0.2.0\.\.\.HEAD/);
});

for (const body of ["", "### Added\n", "<!-- editorial only -->\n", "[Unreleased]: https://example.invalid\n"]) test(`empty visible notes rejected: ${JSON.stringify(body)}`, () => {
  const { read, has } = source({ "CHANGELOG.md": `## [Unreleased]\n\n${body}` });
  assert.throws(() => versionEdits(read, has, "0.2.0", "2026-10-23"), /user-facing entries/);
});

for (const date of ["2026-02-30", "2026-99-10", "today", "2026-1-1"]) test(`invalid date ${date} rejected`, () => {
  const { read, has } = source();
  assert.throws(() => versionEdits(read, has, "0.2.0", date), /valid YYYY-MM-DD/);
});

test("duplicate Unreleased and existing candidate heading rejected", () => {
  for (const heading of ["## [Unreleased]", "## [0.2.0] - 2026-10-23"]) {
    const { read, has } = source({ "CHANGELOG.md": `## [Unreleased]\n\n- Change.\n${heading}\n` });
    assert.throws(() => versionEdits(read, has, "0.2.0", "2026-10-23"), /one Unreleased/);
  }
});

test("product names must be strings and catalogs cannot duplicate the version authority", () => {
  let input = source({ ".claude-plugin/plugin.json": '{"version":"0.1.0"}' });
  assert.throws(() => inspectVersions(input.read, input.has), /invalid product identity/);
  input = source({ ".claude-plugin/marketplace.json": '{"plugins":[{"name":"example","version":"0.1.0"}]}' });
  assert.throws(() => inspectVersions(input.read, input.has), /competing marketplace version/);
});

test("malformed TOML and duplicate root lock entries fail version inspection", () => {
  let input = source({ "Cargo.toml": "[package\n" });
  assert.throws(() => inspectVersions(input.read, input.has), /invalid toml/);
  input = source({ "Cargo.toml": '[package]\nname="example"\nversion="0.1.0"\n', "Cargo.lock": '[[package]]\nname="example"\nversion="0.1.0"\n[[package]]\nname="example"\nversion="0.1.0"\n' });
  assert.throws(() => inspectVersions(input.read, input.has), /Cargo.lock root package/);
});
