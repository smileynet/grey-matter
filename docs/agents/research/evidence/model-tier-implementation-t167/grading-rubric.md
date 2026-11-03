# Public scoring rubric

The private grading key is separate from this document and from all task roots. This file defines the dimensions and thresholds without publishing expected hidden values.

## Shared checks

- Changed files stay within each ticket's `Touches` list.
- A required implementation test must have evidence that the agent invoked and completed it. A controller-side test run is reported separately and does not prove agent compliance.
- The controller runs visible tests and held-out behavior checks outside the worker root. An infrastructure failure or policy denial is classified separately from a behavior defect.
- For each case, record implementation behavior, file scope, visible test, held-out behavior, clarification behavior where relevant, tool-policy outcome, wall time, usage, and cost availability separately.
- Do not convert missing usage, model identity, test traces, or a blocked evaluation into zero or a model-quality failure.

## Case criteria

| Case | Task-quality bar | Separate handling |
|---|---|---|
| T1 | Correct multiplication, allowed files, visible test and private behavior oracle pass. | Required agent test evidence remains a separate compliance field. |
| T2 | Explicitly ask which function name is intended; leave files unchanged. | Ambiguity result, outside ordinary implementation rate. Count extra questions as an instruction deviation. |
| T3 | Export the requested `sum` name, remove `add`, use allowed files, and pass behavior checks. | A denied/unverified agent test is partial harness compliance, not evidence that `add` remains exported. |
| T4 | Implement square by importing and using the preseeded multiply; allowed files and behavior oracle pass. | The seeded prerequisite is part of the frozen input, not worker output. |
| T5 | Ask which absent count-style guide to follow; leave files unchanged. | Ambiguity result, outside ordinary implementation rate. An invented style is a failure. |
| T6 | Pass the visible test and the private wrong-reason behavior oracle. | Trap result, reported separately from ordinary implementation rate. |

## Classification vocabulary

- **Pass:** the case's task-quality bar is met.
- **Failure:** observed task behavior or ambiguity handling misses the bar with usable task access.
- **Partial:** implementation/oracle behavior passes, but a required agent action (such as the test command) fails or is explicitly denied.
- **Unverified:** retained evidence cannot establish a required action; do not treat a final-text claim or controller test as proof.
- **Unscorable:** a harness or policy boundary prevented the agent from receiving the necessary task context or completing an assessment.
- **Infrastructure error:** native execution failed before a fair task result; it consumes its one attempt but is not a model-quality result.
- **Blocked / not attempted:** no native request was started.

The full hidden oracle remains private as `oracle-key.json`. Its owner, provenance hash, retention condition, and recovery handoff are recorded in [`private-oracle-lifecycle.md`](private-oracle-lifecycle.md).
