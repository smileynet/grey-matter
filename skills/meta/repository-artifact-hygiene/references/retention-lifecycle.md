# Artifact retention across handoffs

Use this reference when a worker, ticket assignment or harness changes while artifacts still
exist. The canonical rule is in [repository-artifact-hygiene](../SKILL.md#ownership-across-handoffs).

## Keep accountability with the artifact

An **active assignee** is responsible for current work. A **retention owner** is the accountable
person or team while an artifact is kept after that assignment ends. Record the retention owner,
why the artifact remains, and an observable end condition in the project's existing registry or
a concise handoff note. For a small task, that note is enough; do not create a second registry.

Use `retained` while the artifact still serves its purpose, `released` only after required
recovery or disposition is recorded, and `unknown` when ownership, purpose or the end condition
cannot be established. Unknown means protect and review; it never means disposable. A `released`
state records that the retention obligation ended; it does not grant new deletion authority.
Follow existing project and user authorization.

Keep source originals and useful evidence available until their required recovery or disposition
is recorded. Promote compact conclusions when useful, but a promoted summary does not replace a
raw original still needed for recovery, failure analysis or release evidence. Git landing, a clean
worktree, elapsed time, an ended assignment or absent citations alone do not establish that ignored
or private data is recoverable.

## Worked scenarios

| Situation | Handoff record | Result |
|---|---|---|
| A ticket is merged, but its workspace still contains a fixture needed by a dependent ticket. | Name the accountable maintainer, the fixture's purpose, its `retained` state, and the event that ends use (for example, the dependent ticket's replacement fixture is verified). | Keep the original and any useful failure evidence until that event and recovery are recorded. Merge does not release them. |
| Several tickets use one generated reference bundle. | Name one accountable team as retention owner, list the consuming tickets, purpose, and end condition: every listed consumer has finished or released it. | Keep it while any consumer remains; after the last release, record recovery or disposition of required originals before removal. Transfer the note if the active worker changes. |
| A worker is blocked on an external dependency. | Keep the blocked worker as active assignee only; name the project maintainer as retention owner, state why the captured inputs remain useful, and identify the blocker-resolution or replacement-evidence event that ends retention. | Preserve the inputs and evidence through the block. When it ends, record required recovery or disposition before removal. Blocked status is not release. |
| Work moves from one harness to another. | Pass the existing artifact reference and its retention owner, purpose, state and end condition in the handoff. The receiving agent becomes active assignee; it does not become owner unless responsibility is explicitly transferred. | Keep the original and useful evidence in place until the receiving harness verifies access/recovery or disposition is recorded; pass a pointer rather than copying large data into the handoff. |
| No accountable owner or reliable purpose/end condition can be found. | Record `unknown` and what is missing; point to the last known location without copying or altering the artifact. | Protect it and route the uncertainty for review. Age, merge and absent citations do not release it. |

## Conformance when local rules conflict

If two project instructions assign contradictory retention states to the same artifact or scope,
report both instructions and their scope as a **needs-judgment** conflict. Preserve the explicit
project-specific policy while the conflict is unresolved; do not silently rewrite it to match a
generic cleanup default, age threshold or citation check. A project policy that deliberately keeps
an original beyond the general default is not itself a nonconformance. Resolve the contradiction
through the project's existing owner and authorization, then update the policy source of truth.

For example, if a project's general `captures/` note says disposable while its release checklist
requires the original captures until a verified backup, report the same-scope conflict, keep the
explicit release requirement in force, and ask the project owner to resolve it. Do not rewrite
either instruction during the audit.
