# Good and Bad Tests

## Environment choice

Before choosing a test shape, route the assertion through the shared
[worked assertion routes](../../../../docs/agents/test-environment-ladder.md#worked-assertion-routes).
Its review examples distinguish the actual native parser from a JavaScript stand-in and simulator
integration from physical installed-update evidence. Use those limits when naming what a test proves.

## Qualify the oracle

An **oracle** decides whether observed behavior satisfies the contract. Before trusting a new
test oracle or worker's verdict:

1. Locate the governing spec, schema or public contract for each expected result. Distinguish a
   required rule from an illustrative example. If they disagree, correct the test; if the contract
   is unresolved, keep the alleged product defect unconfirmed and resolve the requirement first.
2. Run a known-good and a known-bad case through the same real seam and oracle. Derive their
   expected outcomes independently from that contract. A mutation is useful only after a diff
   confirms it landed on the exercised input or implementation.
3. Make an execution dependency unavailable in an owned fixture, or supply an equivalent
   controlled harness failure. Verify it reports **infrastructure error**, separately from the
   known-bad case's assertion failure. A missing tool, setup error or timeout cannot qualify as
   rejection of the product behavior.
4. Retain the command, case identity, diagnostic and evidence of the specific assertion executing
   (runner result/count or an assertion-bound receipt). Check discovery, skips and early exits.
   For a worker, require the execution evidence behind its verdict; a narrative "pass" is not a
   receipt. Both controls must exercise the assertion that decides the claim, not just start a process.

Worked contract: a record requires `id`; `alias` is optional. The example `{id: "A", alias: "B"}`
does not make `alias` mandatory.

| Control | Expected interpretation |
|---|---|
| `{id: "A"}` through the actual validator | Accept; a generated test demanding `alias` is wrong |
| `{alias: "B"}` through that validator | Reject for missing `id`; capture the relevant assertion, not an unrelated setup error |
| Validator executable unavailable in the test-owned fixture | Infrastructure error; neither product acceptance nor product rejection |
| Both data cases exit successfully but the deciding assertion was skipped | Oracle unqualified; inspect discovery/control flow before trusting a verdict |

These are review scenarios, not a claim that a particular validator was executed. Once qualified,
run the original failing case: its contract-correct assertion failure is evidence of a product defect.

## Good Tests

**Integration-style**: Test through real interfaces, not mocks of internal parts.

```typescript
// GOOD: Tests observable behavior
test("user can checkout with valid cart", async () => {
  const cart = createCart();
  cart.add(product);
  const result = await checkout(cart, paymentMethod);
  expect(result.status).toBe("confirmed");
});
```

Characteristics:

- Tests behavior users/callers care about
- Uses public API only
- Survives internal refactors
- Describes WHAT, not HOW
- One logical assertion per test

## Bad Tests

**Implementation-detail tests**: Coupled to internal structure.

```typescript
// BAD: Tests implementation details
test("checkout calls paymentService.process", async () => {
  const mockPayment = jest.mock(paymentService);
  await checkout(cart, payment);
  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});
```

Red flags:

- Mocking internal collaborators
- Testing private methods
- Asserting on call counts/order
- Test breaks when refactoring without behavior change
- Test name describes HOW not WHAT
- Verifying through external means instead of interface

```typescript
// BAD: Bypasses interface to verify
test("createUser saves to database", async () => {
  await createUser({ name: "Alice" });
  const row = await db.query("SELECT * FROM users WHERE name = ?", ["Alice"]);
  expect(row).toBeDefined();
});

// GOOD: Verifies through interface
test("createUser makes user retrievable", async () => {
  const user = await createUser({ name: "Alice" });
  const retrieved = await getUser(user.id);
  expect(retrieved.name).toBe("Alice");
});
```

**Tautological tests**: Expected value restates the implementation, so the test passes by construction.

```typescript
// BAD: Expected value is recomputed the way the code computes it
test("calculateTotal sums line items", () => {
  const items = [{ price: 10 }, { price: 5 }];
  const expected = items.reduce((sum, i) => sum + i.price, 0);
  expect(calculateTotal(items)).toBe(expected);
});

// GOOD: Expected value is an independent, known literal
test("calculateTotal sums line items", () => {
  expect(calculateTotal([{ price: 10 }, { price: 5 }])).toBe(15);
});
```
