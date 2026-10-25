# GitHub billing API access

Verified 2026-10-25 against the current endpoint reference and permission matrix.
Recheck those sources before changing credentials; provider permissions can change.

## Read-only access

| Target | Fine-grained PAT permission | Endpoint |
| --- | --- | --- |
| Personal account | Account **Plan: read** | `GET /users/{username}/settings/billing/usage` |
| Personal summary | Account **Plan: read** | `GET /users/{username}/settings/billing/usage/summary` |
| Organization | Organization **Administration: read**, plus an authorized account role | `GET /organizations/{org}/settings/billing/usage` |

A personal billing token needs no repository permissions. Prefer a separate
short-lived fine-grained token with the relevant read permission instead of
expanding an everyday CLI credential. Keep it in the OS credential store or a
process-scoped secret input; preserve the existing Git/CLI login. Never put a
token in chat, tracked files, command logs or report output.

For classic/OAuth credentials, a live personal-usage response advertised
`X-Accepted-OAuth-Scopes: user`. That scope also includes profile writes;
`read:user` is not a substitute established by the endpoint. Present the scope
trade-off before expanding an existing credential. This access does not authorize
billing mutations, budget increases or payment changes.

## Diagnose and verify

1. Confirm the endpoint owner and authenticated identity. Personal and organization
   usage are separate; a token permission cannot replace the required account role.
2. Inspect HTTP status, accepted/granted permission headers and the response body.
   A 404 can indicate missing permission, wrong owner/path or an account/platform
   prerequisite. Do not infer zero usage or request unrelated admin scopes.
3. Follow the exact endpoint's current token requirements. If a tutorial conflicts
   with its permission matrix, record both and use the more specific contract.
4. Query an explicit year/month with the isolated credential; verify HTTP 200 and
   the endpoint-specific `usageItems` schema. Save minimal private evidence with restrictive
   permissions and redact credentials/identity details from shared guidance.
5. Aggregate by owner, product, SKU and repository where fields are available.
   Preserve quantity units, discounts and date coverage. Report absent LFS rows
   as absent returned data, not proof of no retained objects or no blocking budget.

The summary endpoint is in preview and accepts product/SKU/repository filters.
The raw endpoint supports year/month/day. The downloadable detailed billing
report is a separate web workflow; API usage totals are not a complete inventory
of stored historical LFS objects, personal budget state or payment configuration.

## Source authority and a current documentation conflict

- [L4:verified] [Endpoint reference](https://docs.github.com/en/rest/billing/usage)
  and [fine-grained permission matrix](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens)
  agree on fine-grained **Plan: read** for personal usage/summary and organization
  **Administration: read** for organization usage.
- [L4:verified] [Billing introduction](https://docs.github.com/en/billing/get-started/introduction-to-billing)
  also directs users to create a fine-grained token with endpoint-defined permissions.
- [L4:verified] [Usage-reporting tutorial](https://docs.github.com/en/billing/tutorials/automate-usage-reporting)
  describes classic-token-only support. This conflicts with the specific current
  reference/matrix; do not repeat its broader authentication advice without checking.
- [L4:verified] The endpoint reference's introduction describes personal usage as
  Copilot-only, while its specific total-usage section and example include other
  products. Verify actual returned product coverage instead of inferring an LFS
  inventory from either description. A scoped live probe on this date returned
  LFS rows successfully; that does not guarantee complete server-object coverage.
- [L4:verified] [OAuth scope definitions](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)
  establish the broader `user` scope boundary.

This note owns access interpretation only. Artifact classification belongs in its
workflow; account usage reports remain private; spending decisions remain separate.
