# Shape catalog format

A project's shape catalog is one JSON file. It is the single source of truth for the check **and**
for the before/after examples writers read, because every example is also a test.

```json
{
  "format": "voice-shapes-catalog",
  "version": 1,
  "shapes": [
    {
      "ruleId": "dialogue-gloss",
      "severity": "fail",
      "pattern": "\\b(?:said|says|asked) it (?:like|as if|as though)\\b[^.!?]*[.!?]",
      "flags": "gi",
      "message": "the narrator explains how a line was said",
      "move": "reply or act",
      "fixHint": "delete the gloss; let a reply or an action carry it",
      "examples": [
        { "bad": "<the rejected line, verbatim>", "clean": "<the accepted rewrite>", "source": "<where it came from>" }
      ]
    }
  ]
}
```

- **`pattern`** is JavaScript regex source, matched against each line. A capture group, if present,
  is what the finding reports.
- **`severity`**:
  - `fail` only for shapes with near-zero false positives.
  - `warn` for anything fuzzier.
  - `judgment` (with no `pattern`) for a shape a regex can't see. It is never checked, but its
    before/after pair still teaches.
- **`move`** names the replacement from `../SKILL.md`.
- **`examples`** are the fixtures. Each `bad` must trip its own `ruleId`, and each `clean` must trip
  nothing. `check-shapes.mjs --self-test` enforces this.

## Capturing a rejected line

1. Add the verbatim line as `bad` under the shape it shows. If it shows no existing shape, add a
   new entry.
2. Add the rewrite the author accepted as `clean`, and the `source`.
3. Write a `pattern` only when the shape is mechanical. Otherwise use `"severity": "judgment"`.
4. Run `node <skill>/scripts/check-shapes.mjs --self-test --catalog <file>`, and fix the pattern
   until it passes.
5. Run the check over the project's committed prose. A new `fail` hit in prose the author already
   accepted means the pattern is too broad: narrow it, or downgrade it to `warn`.

## Starter

`shapes.json` beside this file holds six shapes, seeded from one project's rejected lines:
- `fail`: the "Not X. Not Y. Z." drumbeat, the dialogue gloss, and "whatever she had become".
- `warn`: "something that was still/past", the narrator pointing at its own earlier line, and the
  verbless "Someone who..." closer.

Copy it into a project and grow it from that project's own rejections. A project with its own check
(for example a validate lane that reads the catalog) keeps using that check. The catalog format is
the shared part.
