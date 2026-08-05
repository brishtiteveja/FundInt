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

test("prompt construction caps context and result parsing tolerates markdown fences", () => {
  const prompt = buildHermesPrompt({
    prompt: "Create a plan",
    mode: "Plan",
    skill: "Application planner",
    firms: Array.from({ length: 80 }, (_, index) => ({ name: `Firm ${index}`, fit: 80 - index })),
    memories: Array.from({ length: 30 }, (_, index) => ({ content: `Memory ${index}` })),
  });
  assert.doesNotMatch(prompt, /Firm 79/);
  assert.doesNotMatch(prompt, /Memory 29/);

  const parsed = parseHermesResult("```json\n{\"title\":\"Plan\",\"summary\":\"Apply now\",\"bullets\":[\"One\"],\"type\":\"plan\"}\n```");
  assert.deepEqual(parsed, { title: "Plan", body: "Apply now", bullets: ["One"], type: "plan" });
});
