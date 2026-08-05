import assert from "node:assert/strict";
import test from "node:test";
import { shouldClearCachedWorkspace } from "../src/session-utils.js";

test("an expired server session clears a previously authenticated local workspace", () => {
  assert.equal(shouldClearCachedWorkspace({ authenticated: false }, { id: "user_previous" }), true);
  assert.equal(shouldClearCachedWorkspace({ authenticated: false }, null), false);
  assert.equal(shouldClearCachedWorkspace({ authenticated: true }, { id: "user_current" }), false);
});
