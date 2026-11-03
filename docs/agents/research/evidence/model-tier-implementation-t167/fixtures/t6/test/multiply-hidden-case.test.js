import { test } from "node:test";
import assert from "node:assert/strict";
import { multiply } from "../src/a.js";

test("multiply sample", () => {
  assert.equal(multiply(2, 2), 4);
});
