import test from "node:test";
import assert from "node:assert/strict";
import { githubReleaseApi } from "./release-github.mjs";

function fixture(responses, execute = false) {
  const calls = [];
  const api = githubReleaseApi({ execute, run(args, input) {
    calls.push({ args, input });
    const value = responses.shift();
    if (value instanceof Error) return { status: 1, stderr: value.message };
    return { status: 0, stdout: typeof value === "string" ? value : JSON.stringify(value) };
  } });
  return { api, calls };
}

test("GitHub adapter authenticates draft discovery and flattens every page", () => {
  const f = fixture([{ full_name: "Owner/Repo", permissions: { push: true } }, [[{ id: 1 }], [{ id: 2 }]]]);
  assert.deepEqual(f.api.releases("owner/repo"), [{ id: 1 }, { id: 2 }]);
  assert.ok(f.calls[1].args.includes("--paginate")); assert.ok(f.calls[1].args.includes("--slurp"));
  assert.ok(f.calls.every(({ args }) => args.includes("github.com") && args.includes("GET")));
  const denied = fixture([{ full_name: "owner/repo" }]);
  assert.throws(() => denied.api.releases("owner/repo"), /push access/);
  assert.equal(denied.calls.length, 1);
});

test("GitHub adapter errors never become absent releases or disabled settings", () => {
  for (const response of [new Error("404"), "not-json", { enabled: true }, null]) {
    const f = fixture([response]);
    assert.throws(() => f.api.immutableEnabled("owner/repo"));
  }
  for (const enabled of [false, true]) {
    const f = fixture([{ enabled, enforced_by_owner: false }]);
    assert.equal(f.api.immutableEnabled("owner/repo"), enabled);
  }
  const f = fixture([[{ id: 1 }]]);
  assert.throws(() => f.api.assets("owner/repo", 1), /paginated/);
});

test("GitHub adapter validates annotated tag name, type and peeled commit", () => {
  const tagSha = "b".repeat(40), sha = "a".repeat(40);
  const ref = { ref: "refs/tags/v1.0.0", object: { type: "tag", sha: tagSha } };
  const object = { sha: tagSha, tag: "v1.0.0", object: { type: "commit", sha } };
  assert.deepEqual(fixture([ref, object]).api.tag("owner/repo", "v1.0.0"), { sha, annotated: true });
  assert.throws(() => fixture([ref, { ...object, tag: "v2.0.0" }]).api.tag("owner/repo", "v1.0.0"), /identity/);
  assert.throws(() => fixture([{ ...ref, object: { type: "commit", sha } }]).api.tag("owner/repo", "v1.0.0"), /annotated/);
});

test("GitHub writes require opt-in and use verified tags, exact bytes and typed JSON", () => {
  const readonly = fixture([]);
  assert.throws(() => readonly.api.publish("owner/repo", 1), /read-only/);
  assert.equal(readonly.calls.length, 0);
  const f = fixture(["https://example.invalid/draft", {}, {}], true);
  const notes = "notes with $(literal) and `text`\n";
  f.api.createDraft("owner/repo", { tag: "v1.0.0", title: "Release", notes });
  assert.ok(f.calls[0].args.includes("--verify-tag")); assert.ok(f.calls[0].args.includes("--draft"));
  assert.equal(f.calls[0].input, notes);
  const bytes = Buffer.from([0, 255, 10]);
  f.api.upload("owner/repo", 1, { name: "bundle.tgz", bytes });
  assert.deepEqual(f.calls[1].input, bytes);
  assert.match(f.calls[1].args.at(-1), /^https:\/\/uploads.github.com\/repos\/owner\/repo\//);
  f.api.publish("owner/repo", 1);
  assert.ok(f.calls[2].args.includes("PATCH")); assert.deepEqual(JSON.parse(f.calls[2].input), { draft: false });
});
