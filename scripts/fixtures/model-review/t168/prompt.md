Review the ticket and proposed diff below. Identify actionable defects that could make this change incorrect, violate the ticket, remove existing data, or leave a required case untested. For each finding, cite the smallest relevant changed line and explain a concrete impact. If you find no actionable defect, say so. Do not suggest unrelated improvements.

Ticket:
{{ticket}}

Proposed diff:
{{diff}}

Return only JSON with this shape:
{"findings":[{"line":"short quoted changed-line evidence","impact":"concrete consequence","severity":"critical|high|medium|low","confidence":"high|medium|low"}],"noFindings":false}
