# Independent audit: ticket 169 model-tier research

**Reviewed commit:** `8b67c3ee84173d2893e33ad757e57fef401fc6eb`  
**Results note SHA-256:** `3cf5a573f57751568369c8ee8280a26331406e3d7e7048eb9cbe4897ea46c611`  
**Private artifact index SHA-256:** `fd3510cb651342da3706f4584db209ba3931779a7c7861e6fd769c179cace768`

**Verdict: accepted for integration as a small, directional study, with explicit limits on reviewer provenance and model identity. Trust: 0.82.** The report now separates 11 valid passes, two valid failures, three review-validation gaps and two independence gaps. It does not treat the five unscorable outputs as model failures or passes, and it retains the original two passes only as secondary evidence.

## Evidence integrity

| Claim | Verdict | Evidence |
|---|---|---|
| The calls used the frozen source packet, tasks, controller and grader | Supported | The continuation authorization binds the reviewed controller and protocol hashes. The controller, grader, test, source and task hashes match those in the authorization/protocol records. All 18 execution receipts bind the same source, task and held-out-key hashes. |
| The first wave and authorized continuation remain distinct | Supported | The first-wave protocol, authorization and ledger match their recorded hashes. The continuation authorizes only the previously held identity-unreported Codex and Kiro cells. No other provider continuation or Google/Agy call appears in the 18-cell ledger. |
| Raw execution bytes match the ledger and receipts | Supported | I recomputed SHA-256 for all 18 stdout, stderr and final-response files. They match their native receipt and measurement-ledger hashes; all files exist. All 18 cells are unique across the three tasks and two requested profiles for each permitted provider. |
| Private artifact index matches retained evidence | Supported | From the private evidence directory, `node build-private-artifact-index.mjs` exited 0 and regenerated 12 index entries covering 399,512 bytes. Its output matched the reviewed index. The index records paths and hashes without payloads, reviewer/blind identifiers or the provider crosswalk. |

The results note was updated after the native calls, so its current hash differs from the preparation-note hash bound in the call authorization. The controller checks that authorization against the note before launching a cell; the execution receipts bind the reviewed controller, protocol, source, task and key. The current report is a post-run summary, not an input that was presented to the models. First-wave hashes remain preserved.

## Scoring and reviewer evidence

The private provenance manifest has 18 rows: 11 pass, two fail, three unscorable because the review receipt failed validation, and two unscorable because the dispatch/completion record is unavailable. Candidate and response hashes bind each entry to a captured output. Score files exist for valid results; the three validation failures have no valid score. The two receipts with no reviewer trace retain their original pass files only as secondary evidence and are excluded from the valid-score denominator.

For the 16 rows with reviewer task names, the private trace ledger contains a fresh task name, candidate hash, dispatch excerpt, completion-body hash and matching review artifact. The trace ledger itself says these excerpts were transcribed by the producer from observed collaboration I/O, not exported or signed platform records. I verified the hash and candidate bindings, but cannot independently authenticate those transcripts against a platform log. The report states that limit. It does not use the two unverified reviews in its 13-score total.

The envelope helper binds the canonical candidate hash and preserves the task-specific semantic body; it does not derive a judgment. From the private evidence directory, `node --test review-envelope.test.mjs` reported 2 passed, 0 failed, 0 skipped. The controller/grader suite passed: `node --test scripts/spike-model-tier-research-t169.test.mjs` reported 11 passed, 0 failed, 0 skipped. `git diff --check` passed. The grader requires exact source and response quotes, the frozen fact threshold and word cap, and the complete cited-answer relation before returning a pass.

## Findings and practical limits

Two valid scores fail: one summary exceeds the 90-word limit and includes an unsupported claim; one cited answer omits the required heading. Three review receipts remain unscorable because of schema, quote or semantic-validation errors. Two earlier apparent passes remain unscorable because the independent dispatch/completion trace was not retained. These classifications match the reviewed table and private manifest.

The evidence supports no adoption recommendation. Claude has reported served identities, but several Claude cells are unscorable or fail. Codex and Kiro identities remain unreported, so their passing requested-profile results do not establish a model-level comparison. The fixture set contains only three tasks with one run per profile; it does not establish production reliability. The report appropriately says to keep the configured defaults unless a complete profile meets the frozen bar. Google/Agy was held without a call, and no provider was substituted.

The report and index contain no literal scratch citations, raw response text, answer-key payload, native session IDs, blind IDs or reviewer IDs. The public index points to exact private evidence roots/files and binds file or tree hashes. I parsed the index and recomputed its entries.

## Authorized cleanup review

**Reviewed cleanup commit:** `b29ac73970bce87ce2c15e79342ac71c6da2f6e6`

**Cleanup execution record SHA-256:** `2c1e91a9faeabc6ab8d44cf7ff9a55ae7d402dfae6994d3ef8287b63a64a61e7`

**Updated report SHA-256:** `43bf846aaa437f4c8652e0361b6c908b5860758d54801bb09c4777546750b67c`
**Updated private index SHA-256:** `bc1abf53bcf12211767d99c62faf300942c87b6657e2f751c5ca18883ada65bb`

The cleanup record binds the parent-authorized plan hash and pinned Kiro executable hash. I independently recovered all eight before/after listing artifacts from the OS Recycle Bin using their original-path metadata. Each payload's bytes and SHA-256 matched the cleanup record. A bounded in-memory comparison verified six V2 targets present before and absent after, with all 7,599 remaining session ID/source tuples identical. The six captured delete acknowledgments matched their retained receipt hashes. All 18 exact captured temporary paths were absent at source and present as empty directories in the Recycle Bin; their cleanup-plan entries recorded zero bytes and zero entries before recycling. The corrected verifier did not copy or print listing contents.

During this audit, an initial local verifier failed to strip a UTF-8 BOM and its error output echoed a truncated serialized before/after session listing into the private tool trace. That output included unrelated session metadata. It was not added to a repository artifact or sent to an external service. The listing was not repeated in the corrected verifier; the incident is recorded here without reproducing the metadata. The earlier tool trace itself should be treated as having exposed the unrelated listing contents to this model context.

No settings change or new native provider invocation was made. The authorized cleanup is independently evidenced; the report's cleanup statements are supported. The research note supports an evidence-bounded “keep the configured default” recommendation. The repository's shared `models-and-usage` table still needs the parent to fold in that #169 result before ticket closure. That is an integration item, not a defect in the measured results.
