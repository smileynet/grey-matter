import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { git, pushCandidateRefs } from "./release-git.mjs";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "release-refs-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const remote = join(root, "remote.git"), repo = join(root, "work");
  git(root, ["init", "--bare", remote]); git(root, ["init", repo]);
  git(repo, ["config", "user.name", "Fixture"]); git(repo, ["config", "user.email", "fixture@example.invalid"]);
  git(repo, ["config", "commit.gpgsign", "false"]); git(repo, ["config", "tag.gpgsign", "false"]);
  writeFileSync(join(repo, "file"), "candidate"); git(repo, ["add", "file"]); git(repo, ["commit", "-m", "candidate"]);
  git(repo, ["tag", "-a", "v1.0.0", "-m", "release"]); git(repo, ["remote", "add", "origin", remote]);
  return { remotePath: remote, repo, branch: "refs/heads/candidate", tag: "refs/tags/v1.0.0", candidateSha: git(repo, ["rev-parse", "HEAD"]).trim(), tagObject: git(repo, ["rev-parse", "v1.0.0"]).trim() };
}

test("candidate refs: dry-run leaves remote refs untouched", (t) => {
  const input = fixture(t);
  git(input.repo, ["tag", "unrelated"]); git(input.repo, ["config", "push.followTags", "true"]);
  assert.equal(pushCandidateRefs(input).complete, false);
  assert.equal(git(input.repo, ["ls-remote", input.remotePath]).trim(), "");
});

test("candidate refs: exact annotated objects and no implicit tags", (t) => {
  const input = fixture(t);
  git(input.repo, ["tag", "-a", "unrelated", "-m", "other"]); git(input.repo, ["config", "push.followTags", "true"]);
  assert.equal(pushCandidateRefs({ ...input, execute: true }).complete, true);
  assert.equal(pushCandidateRefs({ ...input, execute: true }).complete, true);
  assert.equal(git(input.repo, ["ls-remote", input.remotePath, "refs/tags/unrelated"]).trim(), "");
});

test("candidate refs: unsupported atomic server changes no refs", (t) => {
  const input = fixture(t);
  git(input.remotePath, ["config", "receive.advertiseAtomic", "false"]);
  assert.throws(() => pushCandidateRefs({ ...input, execute: true }), /no sequential fallback/);
  assert.equal(git(input.repo, ["ls-remote", input.remotePath]).trim(), "");
});

test("candidate refs: foreign tag, stable, lightweight tags and multiple destinations refuse", (t) => {
  const input = fixture(t);
  assert.throws(() => pushCandidateRefs({ ...input, branch: "refs/heads/stable" }), /other than stable/);
  assert.throws(() => pushCandidateRefs({ ...input, tagObject: input.candidateSha }), /annotated tag/);
  git(input.repo, ["push", input.remotePath, `${input.candidateSha}:${input.tag}`]);
  assert.throws(() => pushCandidateRefs({ ...input, execute: true }), /tag differs/);
  git(input.repo, ["config", "--add", "remote.origin.pushurl", input.remotePath]);
  git(input.repo, ["config", "--add", "remote.origin.pushurl", input.remotePath]);
  assert.throws(() => pushCandidateRefs(input), /exactly one/);
});

test("candidate refs: divergent branch cannot create the release tag", (t) => {
  const input = fixture(t);
  git(input.repo, ["checkout", "--orphan", "unrelated-history"]);
  git(input.repo, ["commit", "--allow-empty", "-m", "divergent"]);
  const foreign = git(input.repo, ["rev-parse", "HEAD"]).trim();
  git(input.repo, ["push", input.remotePath, `${foreign}:${input.branch}`]);
  assert.throws(() => pushCandidateRefs({ ...input, execute: true }), /divergent/);
  assert.equal(git(input.repo, ["ls-remote", input.remotePath, input.tag]).trim(), "");
  assert.match(git(input.repo, ["ls-remote", input.remotePath, input.branch]), new RegExp(`^${foreign}`));
});
