import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const MAX_PROMPT_LENGTH = 4_000;
const MAX_FIRMS = 150;
const MAX_MEMORIES = 12;

function compactFirm(firm) {
  return {
    name: String(firm?.name || "Unknown").slice(0, 120),
    fit: Number.isFinite(Number(firm?.fit)) ? Number(firm.fit) : null,
    stage: String(firm?.stage || "Not listed").slice(0, 160),
    focus: Array.isArray(firm?.skills) ? firm.skills.slice(0, 6).map(String) : [],
    check: String(firm?.check || "Not listed").slice(0, 80),
    deadline: String(firm?.deadline || "Not tracked").slice(0, 120),
    access: String(firm?.access || "Unknown").slice(0, 60),
  };
}

export function buildHermesPrompt({ prompt, mode = "Analyze", skill = "Funding analyst", firms = [], memories = [] }) {
  const task = String(prompt || "").trim();
  if (!task) throw new Error("A task is required");
  if (task.length > MAX_PROMPT_LENGTH) throw new Error(`Task must be under ${MAX_PROMPT_LENGTH} characters`);
  const scopedMemories = memories.slice(0, MAX_MEMORIES).map((memory) => String(memory?.content || "").slice(0, 500)).filter(Boolean);
  const scopedFirms = firms.slice(0, MAX_FIRMS).map(compactFirm);
  return `You are the Funding Agent inside a founder's private fundraising workspace.

Mode: ${String(mode).slice(0, 30)}
Skill: ${String(skill).slice(0, 80)}
Founder task: ${task}

Rules:
- Use only the supplied founder memory and investor records. Do not claim you searched the public web.
- Never invent an application deadline, contact, investment, or warm relationship.
- Label missing or unverified information plainly.
- Produce a concise, actionable founder-facing answer.
- Return JSON only with keys: title, summary, bullets (array of strings), type (report or plan).

Founder memory:
${JSON.stringify(scopedMemories)}

Investor records:
${JSON.stringify(scopedFirms)}`;
}

export function parseHermesResult(output) {
  const text = String(output || "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(text.slice(start, end + 1));
      return {
        title: String(parsed.title || "Hermes funding analysis").slice(0, 160),
        body: String(parsed.summary || parsed.body || "Analysis complete.").slice(0, 4_000),
        bullets: Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 10).map((item) => String(item).slice(0, 600)) : [],
        type: parsed.type === "plan" ? "plan" : "report",
      };
    } catch {
      // Fall through to a readable plain-text result.
    }
  }
  return { title: "Hermes funding analysis", body: text.slice(0, 4_000) || "Hermes returned an empty response.", bullets: [], type: "report" };
}

async function defaultRunCommand(command, args) {
  const { stdout } = await execFileAsync(command, args, {
    cwd: process.cwd(),
    timeout: 120_000,
    maxBuffer: 2 * 1024 * 1024,
    env: process.env,
  });
  return stdout;
}

export function createHermesBridge({ runCommand = defaultRunCommand, binary = process.env.HERMES_BIN || "hermes" } = {}) {
  return {
    async status() {
      try {
        const output = await runCommand(binary, ["status"]);
        const provider = output.match(/Provider:\s+([^\n]+)/)?.[1]?.trim() || "Configured provider";
        const model = output.match(/Model:\s+([^\n]+)/)?.[1]?.trim() || "Configured model";
        return { available: true, authenticated: /OpenAI Codex\s+.*logged in|Nous Portal\s+.*logged in/.test(output), provider, model, isolation: "safe-mode · todo tools only" };
      } catch (error) {
        return { available: false, authenticated: false, provider: "Hermes", model: null, error: error.code === "ENOENT" ? "Hermes CLI is not installed" : "Hermes CLI is unavailable" };
      }
    },

    async run(input) {
      const fullPrompt = buildHermesPrompt(input);
      try {
        const output = await runCommand(binary, [
          "-z", fullPrompt,
          "--safe-mode",
          "--provider", "openai-codex",
          "-m", "gpt-5.6-sol",
          "-t", "todo",
          "--reasoning", input.mode === "Plan" ? "medium" : "low",
        ]);
        return { ...parseHermesResult(output), sourceLabel: "Hermes · OpenAI Codex · isolated bridge" };
      } catch {
        throw new Error("Hermes could not complete this task. Check the local bridge and try again.");
      }
    },
  };
}
