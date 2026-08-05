import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const EMPTY_WORKSPACE = Object.freeze({ memories: [], artifacts: [], applications: [] });

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error("Enter a valid email address");
  return email;
}

function safeEqual(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function normalizeWorkspace(workspace = {}) {
  return {
    memories: Array.isArray(workspace.memories) ? workspace.memories.slice(0, 500) : [],
    artifacts: Array.isArray(workspace.artifacts) ? workspace.artifacts.slice(0, 500) : [],
    applications: Array.isArray(workspace.applications) ? workspace.applications.slice(0, 1000) : [],
  };
}

function loadState(path) {
  if (!existsSync(path)) return { users: {}, loginCodes: [], sessions: {}, workspaces: {} };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return {
      users: parsed.users || {},
      loginCodes: Array.isArray(parsed.loginCodes) ? parsed.loginCodes : [],
      sessions: parsed.sessions || {},
      workspaces: parsed.workspaces || {},
    };
  } catch {
    throw new Error("Funding workspace store is unreadable");
  }
}

export function createWorkspaceStore({
  dbPath,
  secret,
  now = Date.now,
  codeGenerator = () => String(randomInt(100000, 1_000_000)),
  codeTtlMs = 10 * 60_000,
  sessionTtlMs = 30 * 24 * 60 * 60_000,
  minCodeIntervalMs = 30_000,
} = {}) {
  if (!dbPath || !secret) throw new Error("Workspace store requires dbPath and secret");
  mkdirSync(dirname(dbPath), { recursive: true });
  const state = loadState(dbPath);
  const digest = (value) => createHmac("sha256", secret).update(value).digest("hex");
  const userIdFor = (email) => `user_${createHash("sha256").update(email).digest("hex").slice(0, 24)}`;
  const persist = () => {
    const temporaryPath = `${dbPath}.${process.pid}.tmp`;
    writeFileSync(temporaryPath, JSON.stringify(state), { mode: 0o600 });
    renameSync(temporaryPath, dbPath);
  };

  return {
    requestLoginCode(rawEmail) {
      const email = normalizeEmail(rawEmail);
      const timestamp = now();
      const latest = state.loginCodes.filter((item) => item.email === email).sort((a, b) => b.createdAt - a.createdAt)[0];
      if (latest && timestamp - latest.createdAt < minCodeIntervalMs) throw new Error("Please wait before requesting another code");
      const code = codeGenerator();
      state.loginCodes = state.loginCodes.filter((item) => item.expiresAt >= timestamp - codeTtlMs).slice(-500);
      state.loginCodes.push({ id: randomBytes(16).toString("hex"), email, codeHash: digest(`${email}:${code}`), createdAt: timestamp, expiresAt: timestamp + codeTtlMs, attempts: 0, consumedAt: null });
      persist();
      return { email, code, expiresAt: timestamp + codeTtlMs };
    },

    verifyLoginCode(rawEmail, rawCode) {
      const email = normalizeEmail(rawEmail);
      const code = String(rawCode || "").trim();
      const timestamp = now();
      const record = state.loginCodes.filter((item) => item.email === email && !item.consumedAt).sort((a, b) => b.createdAt - a.createdAt)[0];
      const valid = record && record.expiresAt >= timestamp && record.attempts < 5 && safeEqual(record.codeHash, digest(`${email}:${code}`));
      if (!valid) {
        if (record) {
          record.attempts += 1;
          persist();
        }
        throw new Error("Invalid or expired login code");
      }
      record.consumedAt = timestamp;
      const existing = Object.values(state.users).find((item) => item.email === email);
      const isNewUser = !existing;
      const user = existing || { id: userIdFor(email), email, createdAt: timestamp };
      state.users[user.id] = user;
      state.workspaces[user.id] ||= structuredClone(EMPTY_WORKSPACE);
      const token = randomBytes(32).toString("base64url");
      state.sessions[digest(token)] = { userId: user.id, createdAt: timestamp, expiresAt: timestamp + sessionTtlMs };
      persist();
      return { token, user: { id: user.id, email: user.email }, isNewUser, expiresAt: timestamp + sessionTtlMs };
    },

    getSession(token) {
      if (!token) return null;
      const session = state.sessions[digest(token)];
      if (!session || session.expiresAt < now()) return null;
      const user = state.users[session.userId];
      return user ? { user: { id: user.id, email: user.email }, expiresAt: session.expiresAt } : null;
    },

    logout(token) {
      if (token) {
        delete state.sessions[digest(token)];
        persist();
      }
    },

    getWorkspace(userId) {
      return structuredClone(state.workspaces[userId] || EMPTY_WORKSPACE);
    },

    saveWorkspace(userId, workspace) {
      if (!state.users[userId]) throw new Error("Workspace user does not exist");
      const clean = normalizeWorkspace(workspace);
      state.workspaces[userId] = clean;
      persist();
      return structuredClone(clean);
    },

    close() {},
  };
}
