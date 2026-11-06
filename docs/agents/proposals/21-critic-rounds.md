# Four rounds before reassessing critic feedback

Status: adopted under ticket 257, 2026-11-05.

Where guidance recommends critics, default to four review rounds unless the user
or the owning workflow specifies another budget. One round is a verdict on one
candidate, including parallel reviewers' combined findings. Track the material
findings and the evidence that resolves or narrows them from round to round.

After round four, compare the remaining findings with the acceptance criteria
and the progress made. Record the decision and the evidence behind it.

- **Continue** when a critic can name a material defect, its observable impact,
  and a next check or repair that advances acceptance. Give the next round a
  specific question to resolve.
- **Finish** when only minor polish or preferences remain. Apply justified final
  corrections, run the affected checks, and hand back the result. Renew critic
  review if those corrections change a material behavior or required evidence.
- **Escalate** when a material issue remains and successive rounds no longer
  narrow it. Present the evidence and the decision needed to proceed.

Wrong results, reachable crashes, security failures, data loss, and unmet
acceptance criteria are material. Cosmetic preferences and wording with no
effect on meaning are minor. The fourth round is a decision point. Acceptance
still requires resolving material findings and passing applicable gates.

If adopted, put the default and decision rule in the [convergence reference](../../../skills/engineering/retro/references/convergence.md)
and point critic guidance there. In [orchestrate](../../../skills/engineering/orchestrate/SKILL.md),
replace the overlapping three-block redispatch and two-round human-ruling
thresholds with that reassessment. Preserve escalation for unresolved consequential
decisions and honor explicit review budgets.
