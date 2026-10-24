# Deferred publication commands

These commands are prepared for a later authorization. None was executed with publication enabled during staging. First recheck Actions artifact retention, candidate branch identities, crates.io 0.5.0 availability, GitHub immutable-release policy and the unchanged reviewed carrier. Do not enable repository settings or add credentials as part of staging.

Set absolute paths to the clean carrier checkout (`REVIEW`), the existing grey candidate checkout (`GREY_CANDIDATE`) and tkt candidate checkout (`TKT_CANDIDATE`). Set `REVIEW_SHA` to the exact full carrier commit recorded in the closeout evidence. Set `STATE_ROOT` to an owned durable directory outside all candidate/review checkouts. The same state paths must survive interruptions. The candidate branches are `codex/release-grey-matter-0.2.0-d9978415` and `codex/release-tkt-0.5.0-df4b652a`.

## Read-only preflight

```sh
node "$REVIEW/docs/agents/releases/20261024/verify.mjs" "$REVIEW_SHA"
node "$TKT_CANDIDATE/tools/dispatch-publication.mjs" plan \
  --review-repo "$REVIEW" --review-sha "$REVIEW_SHA" \
  --index docs/agents/releases/20261024/index.json \
  --state "$STATE_ROOT/tkt-dispatch.json"
```

The tkt plan checks the actual publication workflow ID **394865280**, distinct from the build-only workflow. It does not dispatch a run, request Cargo credentials or change refs. The staged annotated-tag text is imported only by the authorized CI publication path.

## grey-matter: local publisher

After separate publication authorization, import the exact reviewed annotated tag object and create its local tag ref. Check the resulting object SHA against `grey-matter.tagRecord.objectSha` in index.json. Use the existing tag only if it matches exactly; never replace it to force recovery.

```sh
GREY_TAG=$(git -C "$GREY_CANDIDATE" mktag < "$REVIEW/docs/agents/releases/20261024/grey-matter/annotated-tag.txt")
git -C "$GREY_CANDIDATE" update-ref refs/tags/v0.2.0 "$GREY_TAG" ''
node "$GREY_CANDIDATE/scripts/release-publication.mjs" publish \
  --repo "$GREY_CANDIDATE" --review-repo "$REVIEW" --review-sha "$REVIEW_SHA" \
  --index docs/agents/releases/20261024/index.json --product grey-matter \
  --artifacts "$REVIEW/docs/agents/releases/20261024/grey-matter/artifacts" \
  --evidence "$REVIEW/docs/agents/releases/20261024/grey-matter/evidence" \
  --tag-object "$GREY_TAG" --state "$STATE_ROOT/grey-matter-publication.json"
```

The command above plans. Authorized publication repeats that exact command with `--execute`; recovery changes `publish` to `resume`, retains every other argument and adds `--execute`. The sole publisher verifies the development integration, pushes scoped refs atomically, publishes immutable reviewed assets and then promotes stable. It never delegates a second local tkt publication.

## tkt: reviewed CI publisher

After separate authorization, dispatch once:

```sh
node "$TKT_CANDIDATE/tools/dispatch-publication.mjs" dispatch \
  --review-repo "$REVIEW" --review-sha "$REVIEW_SHA" \
  --index docs/agents/releases/20261024/index.json \
  --state "$STATE_ROOT/tkt-dispatch.json" --execute
```

Observe the saved request by replacing `dispatch` with `observe` and omitting `--execute`. A missing HTTP response is an uncertain outcome: observe that same saved request before considering a retry. Do not start a second state path or resend a saved dispatch automatically. A green workflow alone does not certify publication; verify the exact crate checksum, all immutable GitHub assets and stable ref. Review the [recovery contract](../../release-publication.md) and tkt's candidate `docs/releasing.md` before handling an uncertain Cargo upload. Explicit retry of an unconfirmed upload is a separate decision, not an automatic staging command.
