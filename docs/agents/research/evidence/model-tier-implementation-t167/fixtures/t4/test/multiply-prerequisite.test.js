import { test } from "node:test";
import assert from "node:assert/strict";
import { multiply } from "../src/a.js";

test("prerequisite multiply", () => assert.equal(multiply(3, 4), 12));
