import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import test from "node:test";
import { createFundingApi } from "../server/api.mjs";
import { createWorkspaceStore } from "../server/store.mjs";

async function requestJson(api, url, { method = "GET", headers = {}, body } = {}) {
  const payload = body ? Buffer.from(JSON.stringify(body)) : null;
  const req = Readable.from(payload ? [payload] : []);
  req.url = url;
  req.method = method;
  req.headers = Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
  const responseHeaders = {};
  let output = "";
  const res = {
    statusCode: 200,
    setHeader(key, value) { responseHeaders[key.toLowerCase()] = value; },
    end(value = "") { output += value; },
  };
  await api(req, res, () => {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "not found" }));
  });
  return { status: res.statusCode, headers: responseHeaders, body: JSON.parse(output) };
}

test("API verifies email, issues an HttpOnly session, syncs workspace, and scopes Hermes memory", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "funding-agent-api-"));
  t.after(async () => rm(directory, { recursive: true, force: true }));
  const store = createWorkspaceStore({
    dbPath: join(directory, "workspace.sqlite"),
    secret: "api-test-secret",
    codeGenerator: () => "112233",
    minCodeIntervalMs: 0,
  });
  t.after(() => store.close());
  const bridgeCalls = [];
  const bridge = {
    status: async () => ({ available: true, authenticated: true, provider: "OpenAI Codex", model: "gpt-5.6-sol" }),
    run: async (input) => {
      bridgeCalls.push(input);
      return { title: "Scoped result", body: "Done", bullets: [], type: "report", sourceLabel: "Hermes test" };
    },
  };
  const api = createFundingApi({ store, bridge, exposeDevCode: true, deliverCode: async () => ({ delivery: "local" }) });

  const requestResponse = await requestJson(api, "/api/auth/request", { method: "POST", body: { email: "founder@example.com" } });
  assert.equal(requestResponse.body.devCode, "112233");

  const verifyResponse = await requestJson(api, "/api/auth/verify", { method: "POST", body: { email: "founder@example.com", code: "112233" } });
  const sessionCookie = verifyResponse.headers["set-cookie"];
  assert.match(sessionCookie, /HttpOnly/);
  assert.equal(verifyResponse.body.isNewUser, true);

  const workspace = { memories: [{ id: "m1", content: "Only invest in seed" }], artifacts: [], applications: [] };
  const saveResponse = await requestJson(api, "/api/workspace", { method: "PUT", headers: { Cookie: sessionCookie }, body: { workspace } });
  assert.equal(saveResponse.status, 200);

  const agentResponse = await requestJson(api, "/api/agent/run", { method: "POST", headers: { Cookie: sessionCookie }, body: { prompt: "Build my plan", mode: "Plan", firms: [] } });
  assert.equal(agentResponse.status, 200);
  assert.equal(agentResponse.body.result.title, "Scoped result");
  assert.deepEqual(bridgeCalls[0].memories, workspace.memories);
});
