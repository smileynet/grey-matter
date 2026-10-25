---
name: delivery-dashboard
description: "Maintain one evolving HTML dashboard showing what delivered work lets people do. Use when updating a delivery dashboard, showing shipped versus planned experiences, or presenting progress visually after work worth surfacing."
---

# Delivery Dashboard

1. **Find the project dashboard and evidence.** Read the existing dashboard, relevant
   delivered work and `CHANGELOG.md`. Update the same durable HTML artifact. If none
   exists, choose one committed `docs/` path using the project's conventions and
   record that path on the originating ticket so future updates find it.

2. **Curate tabs by concern or workstream.** Each tab shows the current experience
   plus a short rolling history of changes still relevant to it. Merge or retire
   tabs as features integrate; keep the remaining view useful now. Archival history
   belongs in the changelog, rather than accumulating indefinitely in the dashboard.

3. **Label every visual with its fidelity rung.** Match labels to build and data
   evidence, rather than visual polish. A tab can contain visuals at different rungs.

   | Rung | What the visual represents |
   | --- | --- |
   | **Wireframe** | Nothing built yet; a sketch of the intended experience. |
   | **Mocked** | Partially built; real layout with representative or stubbed data. |
   | **Live** | Shipped; real data or the actual working experience. |

   Move a visual up the ladder only when its evidence supports the new label.
   Keep planned and partial experiences visibly distinguishable from shipped work.

4. **Update the user-facing view.** Read
   [report-format.md](../../../docs/agents/report-format.md) for the HTML rules. Use
   [repository-artifact-hygiene](../../meta/repository-artifact-hygiene/SKILL.md)
   when adding substantial generated evidence or media payload; this skill keeps
   ownership of presentation and fidelity. Use
   [changelog](../../meta/changelog/SKILL.md) for user-value wording. Reuse the
   corresponding `[Unreleased]` wording in the rolling history where applicable.
   Explain each concern through the person's job-to-be-done and what changed in
   their experience, with the evidence needed to assess the claim.

5. **Inspect and hand back the same artifact.** Inspect every tab, including
   offline behavior. Check fidelity labels against evidence and remove stale
   claims or history. Hand back the relevant dashboard view using
   [report-format's open/refresh contract](../../../docs/agents/report-format.md#html-rules),
   with a direct link for return visits. Finish when the dashboard reflects the
   current work, its tabs and labels are accurate, and the user can reach the
   relevant view through that contract.

Use this for the evolving delivery view. Use changelog for release history and
the implementation workflows for building the features it depicts.
