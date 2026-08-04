import test from "node:test";
import assert from "node:assert/strict";

import { buildAgentResult, createApplicationFromFirm, getMonthCells } from "../src/agent-utils.js";

test("turns a confirmed firm deadline into a calendar application without inventing rolling dates", () => {
  const confirmed = createApplicationFromFirm({ id: "ctan", name: "Central Texas Angel Network", deadline: "Sep 6 · 5pm CT", status: "Closing" });
  const rolling = createApplicationFromFirm({ id: "capital", name: "Capital Factory", deadline: "Rolling", status: "Open" });

  assert.equal(confirmed.date, "2026-09-06");
  assert.equal(confirmed.provenance, "Confirmed deadline");
  assert.equal(rolling.date, null);
  assert.equal(rolling.provenance, "Rolling window");
});

test("agent analysis ranks matching firms and returns a saveable artifact", () => {
  const result = buildAgentResult([
    { name: "Defense One", fit: 88, skills: ["Defense", "AI/ML"], stage: "Seed", deadline: "Rolling" },
    { name: "Fintech Two", fit: 97, skills: ["Fintech"], stage: "Series A", deadline: "Not tracked" },
  ], "Find the best defense investors", "Analyze");

  assert.equal(result.type, "report");
  assert.match(result.title, /Defense One/);
  assert.match(result.body, /Defense One/);
});

test("calendar month cells include leading days and every date in the month", () => {
  const cells = getMonthCells("2026-09");
  assert.equal(cells.length, 35);
  assert.equal(cells.filter((cell) => cell.inMonth).length, 30);
  assert.equal(cells.find((cell) => cell.date === "2026-09-06")?.day, 6);
});
