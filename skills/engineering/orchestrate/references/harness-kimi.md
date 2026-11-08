# Kimi

Default to **sequential in-session execution**. Do not use the Agent tool or launch any delegated worker unless the user explicitly requests delegation for the current work. A general authorization to implement a ticket does not authorize subagents.

When delegation is not authorized, admit one ticket at a time and use the ordinary in-session implementation path. If a consequential change requires an independent reviewer, report that the review needs explicit delegation authorization rather than substituting a self-review.

When the user explicitly requests delegation, inspect the currently exposed Agent capabilities and session restrictions before dispatch. Use only supported worker lifecycles and bounded waits. If isolated background workers or event waits are unavailable, continue sequentially; never create replacement processes or provider sessions to simulate them.

Kimi has no qualified grey-matter native notification adapter. Keep dispatch and recovery records in the project scratch directory and report through the current conversation. A saved message or scheduled task is not delivery unless the active Kimi surface confirms it.

Use the harness's actual rendering surface for dashboard updates. Do not create a persistent widget or dashboard, schedule future work, or publish content unless the user separately requests it.
