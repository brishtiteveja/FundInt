import assert from "node:assert/strict";
import test from "node:test";
import { buildHermesPrompt, createHermesBridge, parseHermesResult } from "../server/hermes.mjs";

test("Hermes bridge uses the isolated provider profile and returns structured output", async () => {
  const calls = [];
  const bridge = createHermesBridge({
    runCommand: async (command, args) => {
      calls.push({ command, args });
      return JSON.stringify({
        title: "Defense AI shortlist",
        summary: "Start with the investors whose focus and stage match.",
        bullets: ["Ensemble VC — 98 fit", "ATX Venture Partners — 81 fit"],
        type: "report",
      });
    },
  });

  const result = await bridge.run({
    prompt: "Find the best defense AI investors",
    mode: "Analyze",
    skill: "VC fit analyst",
    memories: [{ content: "Company builds defense AI infrastructure" }],
    firms: [{ name: "Ensemble VC", fit: 98, stage: "Seed", skills: ["AI/ML", "Defense"] }],
  });

  assert.equal(result.title, "Defense AI shortlist");
  assert.equal(result.sourceLabel, "Hermes · OpenAI Codex · isolated bridge");
  assert.deepEqual(calls[0].args.slice(0, 8), ["-z", calls[0].args[1], "--safe-mode", "--provider", "openai-codex", "-m", "gpt-5.6-sol", "-t"]);
  assert.equal(calls[0].args[8], "todo");
  assert.match(calls[0].args[1], /Company builds defense AI infrastructure/);
  assert.match(calls[0].args[1], /Ensemble VC/);
});

test("Hermes status uses a short health-check timeout", async () => {
  const calls = [];
  const bridge = createHermesBridge({
    runCommand: async (command, args, options) => {
      calls.push({ command, args, options });
      return "Provider: OpenAI Codex logged in\nModel: gpt-5.6-sol";
    },
  });

  await bridge.status();

  assert.equal(calls[0].options.timeout, 8_000);
});

test("prompt construction caps context and result parsing tolerates markdown fences", () => {
  const prompt = buildHermesPrompt({
    prompt: "Create a plan",
    mode: "Plan",
    skill: "Application planner",
    firms: Array.from({ length: 200 }, (_, index) => ({ name: `Firm ${index}`, fit: 200 - index })),
    memories: Array.from({ length: 30 }, (_, index) => ({ content: `Memory ${index}` })),
  });
  assert.match(prompt, /Firm 149/);
  assert.doesNotMatch(prompt, /Firm 199/);
  assert.doesNotMatch(prompt, /Memory 29/);

  const parsed = parseHermesResult("```json\n{\"title\":\"Plan\",\"summary\":\"Apply now\",\"bullets\":[\"One\"],\"type\":\"plan\"}\n```");
  assert.deepEqual(parsed, { title: "Plan", body: "Apply now", bullets: ["One"], type: "plan" });
});

test("Hermes failures expose a fixed error without echoing private prompt arguments", async () => {
  const bridge = createHermesBridge({
    runCommand: async (_command, args) => {
      throw new Error(`failed command ${args.join(" ")}`);
    },
  });

  await assert.rejects(
    bridge.run({ prompt: "Private founder fact", memories: [{ content: "Secret memory" }] }),
    (error) => error.message === "Hermes could not complete this task. Check the local bridge and try again." && !error.message.includes("Secret memory"),
  );
});
