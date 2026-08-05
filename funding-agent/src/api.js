async function apiRequest(path, { method = "GET", body, signal } = {}) {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    signal,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}

export const fundingApi = {
  session: (signal) => apiRequest("/api/session", { signal }),
  agentStatus: (signal) => apiRequest("/api/agent/status", { signal }),
  requestLoginCode: (email) => apiRequest("/api/auth/request", { method: "POST", body: { email } }),
  verifyLoginCode: (email, code) => apiRequest("/api/auth/verify", { method: "POST", body: { email, code } }),
  logout: () => apiRequest("/api/auth/logout", { method: "POST" }),
  saveWorkspace: (workspace) => apiRequest("/api/workspace", { method: "PUT", body: { workspace } }),
  runAgent: (input) => apiRequest("/api/agent/run", { method: "POST", body: input }),
};
