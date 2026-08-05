import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHermesBridge } from "./hermes.mjs";
import { createWorkspaceStore } from "./store.mjs";

const SESSION_COOKIE = "funding_session";
const BODY_LIMIT = 1_000_000;

function loadOrCreateSecret(directory) {
  mkdirSync(directory, { recursive: true });
  const path = resolve(directory, "auth-secret");
  if (existsSync(path)) return readFileSync(path, "utf8").trim();
  const secret = randomBytes(48).toString("base64url");
  writeFileSync(path, `${secret}\n`, { mode: 0o600 });
  return secret;
}

function readCookies(header = "") {
  return Object.fromEntries(header.split(";").map((part) => part.trim().split("=")).filter(([key, value]) => key && value).map(([key, value]) => [key, decodeURIComponent(value)]));
}

function sendJson(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > BODY_LIMIT) throw new Error("Request is too large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("Request body must be valid JSON");
  }
}

async function sendEmailCode({ email, code }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FUNDING_AUTH_FROM;
  if (!apiKey || !from) return { delivery: "local" };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your Funding Agent sign-in code",
      html: `<p>Your Funding Agent code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
    }),
  });
  if (!response.ok) throw new Error("Unable to deliver the login email");
  return { delivery: "email" };
}

function compactAgentInput(body) {
  return {
    prompt: body.prompt,
    mode: body.mode,
    skill: body.skill,
    firms: Array.isArray(body.firms) ? body.firms.slice(0, 150) : [],
  };
}

export function createFundingApi({
  dataDirectory = process.env.FUNDING_DATA_DIR || resolve(process.cwd(), ".funding-agent"),
  exposeDevCode = process.env.NODE_ENV !== "production",
  secureCookies = process.env.NODE_ENV === "production",
  store,
  bridge = createHermesBridge(),
  deliverCode = sendEmailCode,
} = {}) {
  const workspaceStore = store || createWorkspaceStore({
    dbPath: resolve(dataDirectory, "workspace.json"),
    secret: process.env.FUNDING_AUTH_SECRET || loadOrCreateSecret(dataDirectory),
  });
  let cachedStatus = null;
  let statusCheckedAt = 0;
  const activeAgentRuns = new Set();
  const lastAgentRunAt = new Map();

  return async function fundingApi(req, res, next) {
    const url = new URL(req.url, "http://funding.local");
    if (!url.pathname.startsWith("/api/")) return next();

    const token = readCookies(req.headers.cookie)[SESSION_COOKIE];
    const session = workspaceStore.getSession(token);
    try {
      if (req.method === "GET" && url.pathname === "/api/session") {
        return sendJson(res, 200, session ? { authenticated: true, user: session.user, workspace: workspaceStore.getWorkspace(session.user.id) } : { authenticated: false });
      }

      if (req.method === "GET" && url.pathname === "/api/agent/status") {
        if (!cachedStatus || Date.now() - statusCheckedAt > 30_000) {
          cachedStatus = await bridge.status();
          statusCheckedAt = Date.now();
        }
        return sendJson(res, 200, cachedStatus);
      }

      if (req.method === "POST" && url.pathname === "/api/auth/request") {
        const body = await readJson(req);
        const login = workspaceStore.requestLoginCode(body.email);
        const delivery = await deliverCode(login);
        return sendJson(res, 200, {
          ok: true,
          email: login.email,
          delivery: delivery.delivery,
          expiresAt: login.expiresAt,
          ...(exposeDevCode && delivery.delivery === "local" ? { devCode: login.code } : {}),
        });
      }

      if (req.method === "POST" && url.pathname === "/api/auth/verify") {
        const body = await readJson(req);
        const verified = workspaceStore.verifyLoginCode(body.email, body.code);
        const maxAge = Math.max(0, Math.floor((verified.expiresAt - Date.now()) / 1000));
        return sendJson(res, 200, {
          authenticated: true,
          user: verified.user,
          isNewUser: verified.isNewUser,
          workspace: workspaceStore.getWorkspace(verified.user.id),
        }, { "Set-Cookie": `${SESSION_COOKIE}=${encodeURIComponent(verified.token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secureCookies ? "; Secure" : ""}` });
      }

      if (req.method === "POST" && url.pathname === "/api/auth/logout") {
        workspaceStore.logout(token);
        return sendJson(res, 200, { ok: true }, { "Set-Cookie": `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureCookies ? "; Secure" : ""}` });
      }

      if (req.method === "PUT" && url.pathname === "/api/workspace") {
        if (!session) return sendJson(res, 401, { error: "Sign in to sync this workspace" });
        const body = await readJson(req);
        const workspace = workspaceStore.saveWorkspace(session.user.id, body.workspace);
        return sendJson(res, 200, { ok: true, workspace });
      }

      if (req.method === "POST" && url.pathname === "/api/agent/run") {
        if (!session) return sendJson(res, 401, { error: "Sign in before running the connected Hermes agent" });
        const userId = session.user.id;
        const previousRun = lastAgentRunAt.get(userId) || 0;
        if (activeAgentRuns.has(userId)) return sendJson(res, 429, { error: "An agent task is already running for this workspace" });
        if (Date.now() - previousRun < 5_000) return sendJson(res, 429, { error: "Please wait before running another agent task" });
        const body = await readJson(req);
        const memories = workspaceStore.getWorkspace(userId).memories;
        activeAgentRuns.add(userId);
        lastAgentRunAt.set(userId, Date.now());
        try {
          const result = await bridge.run({ ...compactAgentInput(body), memories });
          return sendJson(res, 200, { result });
        } finally {
          activeAgentRuns.delete(userId);
        }
      }

      return sendJson(res, 404, { error: "API route not found" });
    } catch (error) {
      const message = error?.message || "Funding Agent request failed";
      const status = /wait before/.test(message) ? 429 : url.pathname === "/api/agent/run" ? 502 : 400;
      return sendJson(res, status, { error: message });
    }
  };
}

export function fundingApiPlugin(options = {}) {
  const install = (server) => {
    const middleware = createFundingApi(options);
    server.middlewares.use(middleware);
  };
  return { name: "funding-agent-api", configureServer: install, configurePreviewServer: install };
}
