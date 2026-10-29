# Deferred publication commands

These commands are prepared for a later authorization. None was run with publication
enabled during staging. Do not enable repository settings or add credentials as part of
staging.

Before publishing, check again:
- Actions artifact retention;
- the candidate branch identities;
- whether crates.io has tkt 0.5.0;
- GitHub's immutable-release policy;
- that the reviewed carrier is unchanged.

Set these absolute paths:
- `REVIEW`: a clean checkout of this carrier;
- `GREY_CANDIDATE` and `TKT_CANDIDATE`: the candidate checkouts.

Set `REVIEW_SHA` to the full carrier commit. Set `STATE_ROOT` to a durable directory you
own, outside every candidate and review checkout; the same state paths must survive
interruptions. The candidate branches are `codex/release-grey-matter-0.2.0-a4db04a9` and
`codex/release-tkt-0.5.0-c4d2ad54`.

## Read-only preflight

```sh
node "$REVIEW/docs/agents/releases/20261029/verify.mjs" "$REVIEW_SHA"
node "$TKT_CANDIDATE/tools/dispatch-publication.mjs" plan \
  --review-repo "$REVIEW" --review-sha "$REVIEW_SHA" \
  --index docs/agents/releases/20261029/index.json \
  --state "$STATE_ROOT/tkt-dispatch.json"
```

The tkt plan checks the publication workflow ID **394865280**, which is distinct from the
build-only workflow. It does not dispatch a run, request Cargo credentials or change refs.

Then build the development integration grey-matter publication will push:

```sh
git merge-tree --write-tree origin/main 05792a71c7e936b3ed26a623933bbfa224d7b93c
```

Read its `CHANGELOG.md`. Entries main added after the candidate must stay under
`## [Unreleased]`, not `0.2.0`.

## grey-matter: local publisher

After separate authorization:
1. Import the reviewed annotated tag object.
2. Check its object SHA against `tagRecord.objectSha` in index.json. Use an existing tag
   only if it matches exactly; never replace it to force recovery.
3. Run the plan:

```sh
GREY_TAG=$(git -C "$GREY_CANDIDATE" mktag < "$REVIEW/docs/agents/releases/20261029/grey-matter/annotated-tag.txt")
git -C "$GREY_CANDIDATE" update-ref refs/tags/v0.2.0 "$GREY_TAG" ''
node "$GREY_CANDIDATE/scripts/release-publication.mjs" publish \
  --repo "$GREY_CANDIDATE" --review-repo "$REVIEW" --review-sha "$REVIEW_SHA" \
  --index docs/agents/releases/20261029/index.json --product grey-matter \
  --artifacts "$REVIEW/docs/agents/releases/20261029/grey-matter/artifacts" \
  --evidence "$REVIEW/docs/agents/releases/20261029/grey-matter/evidence" \
  --tag-object "$GREY_TAG" --state "$STATE_ROOT/grey-matter-publication.json"
```

The command above only plans:
- **To publish:** repeat it with `--execute`.
- **To recover:** change `publish` to `resume`, keep every other argument, and add
  `--execute`.

## tkt: reviewed CI publisher

After separate authorization, dispatch once:

```sh
node "$TKT_CANDIDATE/tools/dispatch-publication.mjs" dispatch \
  --review-repo "$REVIEW" --review-sha "$REVIEW_SHA" \
  --index docs/agents/releases/20261029/index.json \
  --state "$STATE_ROOT/tkt-dispatch.json" --execute
```

To observe the saved request, replace `dispatch` with `observe` and omit `--execute`.

**A missing HTTP response is an uncertain outcome.** Observe that same saved request
before considering a retry. Never resend a saved dispatch automatically.

**A green workflow alone is not proof of publication.** Verify:
- the crate checksum;
- every immutable GitHub asset;
- the stable ref.

See the [recovery contract](../../release-publication.md).
