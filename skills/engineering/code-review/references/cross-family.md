# Cross-family second opinion (optional)

Both code-review axes normally run on the same model, and models in one family tend to miss
the same things. For a high-stakes diff, run the **Standards brief** a second time through a
different model family's CLI and compare.

- **Invoke headless.** `codex exec --skip-git-repo-check -o <file> "<brief>" </dev/null`
  (needed outside a trusted directory) or `claude -p --output-format json "<brief>"`. Write
  large inputs (diff, rubric) to a file and pass the path, not the text.
- **Validate by content, never by exit code.** Accept the review only if the output holds
  the expected report: a `result` field for Claude JSON (`is_error: false`), or a non-empty
  `-o` file for Codex. A reviewer that timed out, returned nothing, or hit a quota is a
  **coverage gap**: report it as such, never as a clean pass.
- **Merge without reranking the axes.** Under `## Standards`, mark each finding by
  agreement: both reviewers, or one only. Keep single-reviewer findings, labeled lower
  confidence. They are still hypotheses (step 5): every filed ticket starts with reproduce.
