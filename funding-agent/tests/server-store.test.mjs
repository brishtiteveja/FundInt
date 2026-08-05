import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createWorkspaceStore } from "../server/store.mjs";

test("email code sessions persist a user-scoped workspace and can be revoked", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "funding-agent-store-"));
  t.after(async () => rm(directory, { recursive: true, force: true }));
  const dbPath = join(directory, "workspace.sqlite");
  const store = createWorkspaceStore({
    dbPath,
    secret: "test-secret",
    codeGenerator: () => "123456",
    now: () => 1_800_000_000_000,
    minCodeIntervalMs: 0,
  });
  t.after(() => store.close());

  const request = store.requestLoginCode(" Founder@Example.com ");
  assert.equal(request.email, "founder@example.com");
  assert.equal(request.code, "123456");
  assert.throws(() => store.verifyLoginCode(request.email, "999999"), /Invalid or expired/);

  const session = store.verifyLoginCode(request.email, request.code);
  assert.equal(session.user.email, "founder@example.com");
  assert.equal(session.isNewUser, true);
  assert.equal(store.getSession(session.token).user.email, "founder@example.com");

  const workspace = {
    memories: [{ id: "m1", content: "Defense AI founder" }],
    artifacts: [{ id: "a1", type: "plan", title: "Austin plan" }],
    applications: [{ id: "ctan", name: "Central Texas Angel Network" }],
  };
  store.saveWorkspace(session.user.id, workspace);
  assert.deepEqual(store.getWorkspace(session.user.id), workspace);

  store.logout(session.token);
  assert.equal(store.getSession(session.token), null);
});

test("login codes expire and cannot be reused", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "funding-agent-expiry-"));
  t.after(async () => rm(directory, { recursive: true, force: true }));
  let currentTime = 1_800_000_000_000;
  const store = createWorkspaceStore({
    dbPath: join(directory, "workspace.sqlite"),
    secret: "test-secret",
    codeGenerator: () => "654321",
    now: () => currentTime,
    minCodeIntervalMs: 0,
    codeTtlMs: 60_000,
  });
  t.after(() => store.close());

  store.requestLoginCode("founder@example.com");
  currentTime += 60_001;
  assert.throws(() => store.verifyLoginCode("founder@example.com", "654321"), /Invalid or expired/);
});
