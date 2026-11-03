# Model tier review: results

**Scope:** four frozen code-review cases, with one seeded defect per case. This is a small evaluation set, not a general reliability estimate.

## Findings

The secondary blinded review scorer found the seeded defect in **22 of 22 non-empty final responses** and cited changed-line evidence in **22 of 22**. Severity-weighted recall was **100%**. The scorer recorded **9 unsupported claims** (0.41 per scored response) and **5 duplicate reports** separately.

That secondary score includes all seven format-invalid responses and the Kiro response containing a denied optional local computation. The primary format result did not change: **14 of 23 attempts returned the required JSON shape**. Eight attempts returned text that was not valid review JSON; one Codex setup failure returned no final response. The empty response was unavailable to the scorer, not counted as a missed defect. No response was repaired or retried.

| Provider | Tier | Valid JSON / attempts | Semantic target recall | Unsupported claims | Duplicates | Served model / list cost |
|---|---|---:|---:|---:|---:|---|
| Claude | cheap | 3/3 | 3/3 | 3 | 0 | Requested Haiku; served Sonnet 5.5 in all observed calls; $0.0584121 |
| Claude | default | 1/4 | 4/4 | 2 | 1 | Native default served Opus 5.5; $0.1618632 |
| Codex | cheap | 3/4 | 3/3 | 1 | 0 | Requested gpt-6-luna; served identity not reported; unknown |
| Codex | default | 4/4 | 4/4 | 0 | 0 | Native default identity not reported; unknown |
| Kiro | cheap | 0/4 | 4/4 | 2 | 2 | Requested qwen3-coder-next; served identity not reported; unknown |
| Kiro | default | 3/4 | 4/4 | 1 | 2 | Native default identity not reported; unknown |

The requested Claude cheap alias was `haiku`, but native metadata identified **Claude Sonnet 5.5** for all three observed cheap calls; those results are not Haiku observations. Claude native-default calls reported Opus 5.5. Codex and Kiro did not emit served model identities.

| Fixture | Seed severity | Target found | Unavailable responses |
|---|---:|---:|---:|
| f1 | 2 | 4/4 | 1 |
| f2 | 2 | 6/6 | 0 |
| f3 | 3 | 6/6 | 0 |
| f4 | 1 | 6/6 | 0 |

## Operational outcomes

- The 23 attempts were 14 completed valid-format reviews, 7 invalid-format reviews, 1 Codex failure before a model turn, and 1 Kiro non-interactive denial of an optional local arithmetic check. The Kiro final text was also unusable as JSON but remained in the secondary semantic scoring set.
- The full comparison grid had 32 cells: 23 attempts, 8 Google/Agy cells blocked by the workstream safety hook, and 1 Claude cheap/f1 cell omitted for budget accounting. No Google/Agy command ran.
- No measured call reported a native usage limit. Claude's reported list-cost estimates sum to **USD 0.2202753**. They are estimates, not billing. The earlier unintended Claude turn has unknown usage, so total USD 0.80 budget compliance cannot be verified. Codex and Kiro costs remain unknown.
- No model, provider, effort, or global permission configuration changed. **Retain the existing defaults**: no cheap tier completed all four strict-format cases, and Claude's requested cheap alias did not serve Haiku. This is a conservative choice under incomplete cheap-tier coverage, not proof that every default profile passed the strict-format bar.

## Limits and provenance

The 22/22 semantic result covers only this frozen four-case set and the 22 attempts that produced non-empty final text. It does not estimate production reliability. The score audit records one unavailable response and does not infer findings for it.

The independent scorer corrected a transcription error in the f3 fixture hash after rechecking all eight input hashes and the frozen rubric. The score file did not change; the corrected audit records the manifest-matching f3 hash `94a10710978c9184c9877d23099a34f292a5f0bd02c47520cbdd34c3a6f9a9eb`.

The blinded packet, score output, rubric, key, execution ledger, raw-stream hashes, and derived join are bound by the accompanying evidence receipt. Private raw responses, the blind map, model identities, per-call accounting, and Kiro session IDs remain in ticket scratch for audit. The public report contains no raw response text.
