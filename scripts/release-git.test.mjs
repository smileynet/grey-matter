import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promotePublishedStable } from "./release-publish.mjs";
import { createHash } from "node:crypto";
import { git, pushCandidateRefs, requireGithubRemote } from "./release-git.mjs";

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

test("candidate refs: mirror configuration cannot widen or delete refs", (t) => {
  const input = fixture(t);
  git(input.repo, ["push", input.remotePath, `${input.candidateSha}:refs/heads/retained`]);
  git(input.repo, ["branch", "unrequested"]);
  git(input.repo, ["config", "remote.origin.mirror", "true"]);
  assert.equal(pushCandidateRefs({ ...input, execute: true }).complete, true);
  assert.match(git(input.repo, ["ls-remote", input.remotePath, "refs/heads/retained"]), new RegExp(`^${input.candidateSha}`));
  assert.equal(git(input.repo, ["ls-remote", input.remotePath, "refs/heads/unrequested"]).trim(), "");
});

test("candidate refs: an annotated tag with another embedded name is refused", (t) => {
  const input = fixture(t);
  git(input.repo, ["tag", "-a", "wrong-name", "-m", "different identity"]);
  const tagObject = git(input.repo, ["rev-parse", "wrong-name"]).trim();
  assert.throws(() => pushCandidateRefs({ ...input, tagObject, execute: true }), /header differs/);
  assert.equal(git(input.repo, ["ls-remote", input.remotePath]).trim(), "");
});

test("candidate refs: a receive-time competing branch update rejects the whole candidate", (t) => {
  const input = fixture(t);
  git(input.repo, ["push", input.remotePath, `${input.candidateSha}:${input.branch}`]);
  const previous = input.candidateSha;
  git(input.repo, ["commit", "--allow-empty", "-m", "advance candidate"]);
  git(input.repo, ["tag", "-f", "-a", "v1.0.0", "-m", "candidate"]);
  input.candidateSha = git(input.repo, ["rev-parse", "HEAD"]).trim();
  input.tagObject = git(input.repo, ["rev-parse", "v1.0.0"]).trim();
  git(input.repo, ["checkout", "--orphan", "competitor"]);
  git(input.repo, ["commit", "--allow-empty", "-m", "competing history"]);
  const competitor = git(input.repo, ["rev-parse", "HEAD"]).trim();
  git(input.repo, ["push", input.remotePath, `${competitor}:refs/heads/competitor`]);
  // The receive hook races after the client's observation, using already-stored objects.
  writeFileSync(join(input.remotePath, "hooks", "pre-receive"), `#!/bin/sh\nunset GIT_QUARANTINE_PATH\ngit update-ref ${input.branch} ${competitor} ${previous} || exit 1\n`, { mode: 0o755 });
  assert.throws(() => pushCandidateRefs({ ...input, execute: true }), /divergent/);
  assert.equal(git(input.repo, ["ls-remote", input.remotePath, input.tag]).trim(), "");
  assert.match(git(input.repo, ["ls-remote", input.remotePath, input.branch]), new RegExp(`^${competitor}`));
});

test("candidate refs: a race on an already-matching branch stops after tag-only success", (t) => {
  const input = fixture(t);
  git(input.repo, ["push", input.remotePath, `${input.candidateSha}:${input.branch}`]);
  git(input.repo, ["checkout", "--orphan", "competitor"]);
  git(input.repo, ["commit", "--allow-empty", "-m", "competing history"]);
  const competitor = git(input.repo, ["rev-parse", "HEAD"]).trim();
  git(input.repo, ["push", input.remotePath, `${competitor}:refs/heads/competitor`]);
  writeFileSync(join(input.remotePath, "hooks", "pre-receive"), `#!/bin/sh\nunset GIT_QUARANTINE_PATH\ngit update-ref ${input.branch} ${competitor} ${input.candidateSha} || exit 1\n`, { mode: 0o755 });
  assert.throws(() => pushCandidateRefs({ ...input, execute: true }), /divergent/);
  assert.match(git(input.repo, ["ls-remote", input.remotePath, input.tag]), new RegExp(`^${input.tagObject}`));
  assert.match(git(input.repo, ["ls-remote", input.remotePath, input.branch]), new RegExp(`^${competitor}`));
});

function publication(input) {
  const bytes = Buffer.from("sealed bundle"), sha256 = createHash("sha256").update(bytes).digest("hex");
  const candidate = { repository: "example/grey-matter", product: "grey-matter", version: "1.0.0", candidateSha: input.candidateSha, title: "v1.0.0", notes: "Reviewed notes", assets: [{ name: "bundle.tgz", bytes, size: bytes.length, sha256 }], gates: { status: "pass", product: "grey-matter", version: "1.0.0", candidateSha: input.candidateSha, pending: [] } };
  const state = { id: 1, draft: false, immutable: true };
  const api = {
    tag: () => ({ sha: input.candidateSha, annotated: true }),
    releases: () => [{ ...state, tag_name: "v1.0.0", name: candidate.title, body: candidate.notes, html_url: "https://example.invalid/release" }],
    assets: () => [{ name: "bundle.tgz", size: bytes.length, digest: `sha256:${sha256}`, state: "uploaded" }],
  };
  return { candidate, state, api, run: (execute = false) => promotePublishedStable({ repo: input.repo, candidate, api, publisher: "local", execute }) };
}

test("stable: dry-run, initial creation and replay require immutable published bytes", async (t) => {
  const input = fixture(t), proof = publication(input);
  assert.equal((await proof.run()).complete, false);
  assert.equal(git(input.repo, ["ls-remote", input.remotePath]).trim(), "");
  assert.equal((await proof.run(true)).complete, true);
  assert.equal((await proof.run(true)).complete, true);
  assert.match(git(input.repo, ["ls-remote", input.remotePath, "refs/heads/stable"]), new RegExp(`^${input.candidateSha}`));
});

test("stable: unpublished, mutable and incomplete releases cannot change refs", async (t) => {
  for (const state of [{ draft: true, immutable: false }, { draft: false, immutable: false }]) {
    const input = fixture(t), proof = publication(input); Object.assign(proof.state, state);
    await assert.rejects(proof.run(true));
    assert.equal(git(input.repo, ["ls-remote", input.remotePath]).trim(), "");
  }
  const input = fixture(t), proof = publication(input); proof.api.assets = () => [];
  await assert.rejects(proof.run(true), /missing assets/);
  assert.equal(git(input.repo, ["ls-remote", input.remotePath]).trim(), "");
});

test("stable: fast-forward succeeds and divergence preserves the channel", async (t) => {
  const input = fixture(t), proof = publication(input);
  git(input.repo, ["push", input.remotePath, `${input.candidateSha}:refs/heads/stable`]);
  git(input.repo, ["commit", "--allow-empty", "-m", "next tested release"]);
  input.candidateSha = git(input.repo, ["rev-parse", "HEAD"]).trim();
  const next = publication(input); assert.equal((await next.run(true)).complete, true);
  const previous = proof.candidate.candidateSha;
  proof.api.tag = () => ({ sha: previous, annotated: true });
  await assert.rejects(proof.run(true), /divergent/);
  assert.notEqual(previous, input.candidateSha);
  assert.match(git(input.repo, ["ls-remote", input.remotePath, "refs/heads/stable"]), new RegExp(`^${input.candidateSha}`));
});

test("stable: a rejected promotion resumes without repeating publication", async (t) => {
  const input = fixture(t), proof = publication(input), hook = join(input.remotePath, "hooks/pre-receive");
  writeFileSync(hook, "#!/bin/sh\nexit 1\n", { mode: 0o755 });
  await assert.rejects(proof.run(true), /resume promotion/);
  assert.equal(git(input.repo, ["ls-remote", input.remotePath]).trim(), "");
  rmSync(hook); assert.equal((await proof.run(true)).complete, true);
});

test("stable: a changed release ID fails post-promotion verification without rollback", async (t) => {
  const input = fixture(t), proof = publication(input), original = proof.api.releases;
  let reads = 0;
  proof.api.releases = () => { if (++reads === 2) proof.state.id = 2; return original(); };
  await assert.rejects(proof.run(true), /release ID changed/);
  assert.match(git(input.repo, ["ls-remote", input.remotePath, "refs/heads/stable"]), new RegExp(`^${input.candidateSha}`));
});

test("remote binding: HTTPS and Git SSH resolve to the reviewed GitHub repository", (t) => {
  const input = fixture(t);
  for (const url of ["https://github.com/Owner/Repo.git", "git@github.com:owner/repo.git", "ssh://git@github.com/owner/repo", "ssh://git@github.com:22/owner/repo.git"]) {
    git(input.repo, ["remote", "set-url", "origin", url]);
    assert.equal(requireGithubRemote({ repo: input.repo, repository: "owner/repo" }).status, "pass");
  }
});

test("remote binding: mismatches, credentials, lookalike hosts and local transports refuse", (t) => {
  const input = fixture(t);
  for (const url of [input.remotePath, "https://github.com/other/repo.git", "https://github.com.attacker.invalid/owner/repo", "https://github.com@attacker.invalid/owner/repo", "https://user:secret@github.com/owner/repo", "http://github.com/owner/repo", "https://github.com/owner/repo?token=secret", "https://github.com/owner/repo#fragment", "ssh://user@github.com/owner/repo", "ssh://git@github.com:443/owner/repo", "ext::unexpected command"]) {
    git(input.repo, ["remote", "set-url", "origin", url]);
    assert.throws(() => requireGithubRemote({ repo: input.repo, repository: "owner/repo" }));
  }
});

test("remote binding checks push URL overrides and pushInsteadOf, without making a network call", (t) => {
  const input = fixture(t);
  git(input.repo, ["remote", "set-url", "origin", "https://github.com/owner/repo.git"]);
  git(input.repo, ["config", "remote.origin.pushurl", "https://github.com/other/repo.git"]);
  assert.throws(() => requireGithubRemote({ repo: input.repo, repository: "owner/repo" }), /differs/);
  git(input.repo, ["config", "--unset", "remote.origin.pushurl"]);
  git(input.repo, ["config", "url.https://github.com/other/.pushInsteadOf", "https://github.com/owner/"]);
  assert.throws(() => requireGithubRemote({ repo: input.repo, repository: "owner/repo" }), /differs/);
});


function developmentFixture(t) {
  const input = fixture(t), base = input.candidateSha;
  git(input.repo, ["push", input.remotePath, `${base}:refs/heads/main`]);
  git(input.repo, ["checkout", "-b", "release-candidate"]);
  writeFileSync(join(input.repo, "release-version"), "1.0.0"); git(input.repo, ["add", "."]); git(input.repo, ["commit", "-m", "Candidate version"]);
  input.candidateSha = git(input.repo, ["rev-parse", "HEAD"]).trim();
  git(input.repo, ["tag", "-f", "-a", "v1.0.0", "-m", "Reviewed release"]); input.tagObject = git(input.repo, ["rev-parse", "v1.0.0"]).trim();
  git(input.repo, ["checkout", "-b", "development", base]);
  writeFileSync(join(input.repo, "development-only"), "Retain development work"); git(input.repo, ["add", "."]); git(input.repo, ["commit", "-m", "Development work"]);
  const previousMain = git(input.repo, ["rev-parse", "HEAD"]).trim(); git(input.repo, ["push", input.remotePath, `${previousMain}:refs/heads/main`]);
  git(input.repo, ["merge", "--no-ff", input.candidateSha, "-m", "Integrate reviewed candidate"]);
  return { ...input, previousMain, developmentSha: git(input.repo, ["rev-parse", "HEAD"]).trim() };
}

test("candidate refs: verified development merge joins the same atomic transaction", (t) => {
  const input = developmentFixture(t), before = git(input.repo, ["ls-remote", input.remotePath]);
  assert.equal(pushCandidateRefs(input).complete, false); assert.equal(git(input.repo, ["ls-remote", input.remotePath]), before);
  const result = pushCandidateRefs({ ...input, execute: true }); assert.equal(result.complete, true);
  assert.equal(result.refs.development, input.developmentSha);
  assert.deepEqual(git(input.repo, ["show", "-s", "--format=%P", input.developmentSha]).trim().split(" "), [input.previousMain, input.candidateSha]);
  assert.equal(git(input.repo, ["rev-parse", `${input.tagObject}^{commit}`]).trim(), input.candidateSha);
  assert.equal(git(input.repo, ["ls-remote", input.remotePath, "refs/heads/stable"]).trim(), "");
  assert.equal(pushCandidateRefs({ ...input, execute: true }).complete, true);
});

test("candidate refs: unsupported three-ref atomic push leaves development and release refs intact", (t) => {
  const input = developmentFixture(t), before = git(input.repo, ["ls-remote", input.remotePath]);
  git(input.remotePath, ["config", "receive.advertiseAtomic", "false"]);
  assert.throws(() => pushCandidateRefs({ ...input, execute: true }), /no sequential fallback/);
  assert.equal(git(input.repo, ["ls-remote", input.remotePath]), before);
});

test("candidate refs: development integration cannot omit the candidate or replace advanced main", (t) => {
  const input = developmentFixture(t), before = git(input.repo, ["ls-remote", input.remotePath]);
  assert.throws(() => pushCandidateRefs({ ...input, developmentSha: input.previousMain, execute: true }), /contain the exact candidate/);
  assert.throws(() => pushCandidateRefs({ ...input, branch: "refs/heads/main", execute: true }), /distinct/);
  assert.equal(git(input.repo, ["ls-remote", input.remotePath]), before);
  git(input.repo, ["commit", "--allow-empty", "-m", "Concurrent main work"]);
  const advanced = git(input.repo, ["rev-parse", "HEAD"]).trim(); git(input.repo, ["push", input.remotePath, `${advanced}:refs/heads/main`]);
  assert.throws(() => pushCandidateRefs({ ...input, execute: true }), /fetch and recheck/);
  assert.equal(git(input.repo, ["ls-remote", input.remotePath, input.tag]).trim(), "");
});
