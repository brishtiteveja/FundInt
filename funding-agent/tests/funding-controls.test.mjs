import test from "node:test";
import assert from "node:assert/strict";

import { getPaginationItems, matchesCheckFilter } from "../src/funding-utils.js";

test("pagination exposes the beginning, nearby pages, and the final page", () => {
  assert.deepEqual(getPaginationItems(1, 11), [1, 2, 3, "ellipsis-end", 11]);
  assert.deepEqual(getPaginationItems(6, 11), [1, "ellipsis-start", 5, 6, 7, "ellipsis-end", 11]);
  assert.deepEqual(getPaginationItems(11, 11), [1, "ellipsis-start", 9, 10, 11]);
});

test("check-size filters include firms whose range overlaps the selected band", () => {
  assert.equal(matchesCheckFilter("$250K – $15M", "$1M – $5M"), true);
  assert.equal(matchesCheckFilter("$50K – $500K", "$1M – $5M"), false);
  assert.equal(matchesCheckFilter("Not listed", "Not listed"), true);
  assert.equal(matchesCheckFilter("$10M+", "$5M+"), true);
});
