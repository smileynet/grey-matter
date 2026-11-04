# #140 staged ticket mutation recheck

Observed on 2026-11-04 with installed tkt `0.4.0 (e755765)`, executable
`D:/dev-tools/cargo/bin/tkt.exe` (4,979,200 bytes, SHA-256
`6a10bfb87c118309aa7c1dccea504c103bbf8eca324c301b9da2de1e255ddc21`). The
read-only tkt source checkout was at `ce6683f073467b2d07607abfbf819bcab62fb7f4`.

## Staged-file reproduction

The retained runner imports `scripts/test-git-env.mjs` before subprocesses, confines
every child working directory to the assigned checkout, gives each fixture its own
Git repository/config/hooks directory, disables pushes, and retains each fixture.
It stages unique bytes in `unrelated.txt`, invokes one installed mutation, then records
the command output, resulting commit paths, remaining staged paths, raw Git index bytes
and hashes. The final 35,309-byte evidence packet has SHA-256
`27f0e45550f1b81861143b60724819edd60b62ae26d356413558925060b86e2e`; its untracked
fixtures and full command transcript are retained locally through review.

| Command | Commit paths observed | Staged path after command |
| --- | --- | --- |
| `new probe --title Probe --no-push` | `.tickets/01-probe.md` | `unrelated.txt` |
| `claim 1 --no-push` | `.tickets/1-fixture.md` | `unrelated.txt` |
| `edit 1 --title "Edited fixture" --no-push` | `.tickets/1-fixture.md` | `unrelated.txt` |
| `close 1 --check-all --resolution "Fixture passed" --no-push` | `.tickets/1-fixture.md` | `unrelated.txt` |

All four commands exited 0. Close used the ordinary `--check-all` path, without force.
The unrelated staged bytes stayed in the index and did not
enter the ticket commit. The parent commit includes `base.txt` and the initial committed
fixture ticket where applicable; the matrix reports only each mutation commit's paths.

The same run created two tags (`stream:tooling`, `kind:fixture`) and queried the fixture
with `query --all-context --output json`; both tags appeared in JSON. `new --validation
"criterion one, criterion two"` and `edit --validation "first criterion, second
criterion"` each stored one criterion containing the comma. This does not reproduce a
comma-splitting defect for one quoted argument on the installed build.

## Existing upstream work

- Staged-file isolation is implemented upstream in tkt #235 (done). Its acceptance covers
  `new`, `claim`, `edit` and `close`, ticket/plan-only commits, and preservation of unrelated
  staged data. The current source uses `git commit --only -- <paths>` in `src/git.rs`.
- Query tags are implemented in tkt #231 (done), which adds all stored frontmatter fields.
  The local query fixture confirms the installed behavior.
- No tkt ticket describing comma-splitting of `--vc`/`--validation` was found by title or
  ticket-body search. The installed one-argument `new` and `edit` cases above treat a comma
  as ordinary text. Repeatable argument edge cases beyond those quoted single arguments
  were not tested.
- Tkt #43 (done) accepts ordinary mutation latency as the cost of fetch/push and documents
  the local-only alternative. Tkt #235 (done) adds `--no-push`, reports push failure and
  separates consumer pre-push-hook delays from local commit behavior. The historical
  grey-matter report that a repo pre-push check held `new` is consistent with that consumer
  hook boundary; this run used `--no-push` and does not measure network or hook latency.

The historical premises for the staged sweep and missing query tags are superseded by
upstream fixes; no duplicate upstream issues were filed. The comma claim is not reproduced
for the tested arguments, so this report does not recommend a source change or new issue.
An earlier setup attempt used an unsupported `[git] push = false` key; tkt warned about it.
That run is excluded from the final matrix. The accepted run uses the supported
`[push] enabled = false` setting, the imported isolated-Git test environment, and the
ordinary checked close.
