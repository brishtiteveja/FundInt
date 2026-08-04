import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const SOURCE_URL = "https://eddyhdzg.com/vcs?view=table";

function findRows(value) {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value.rows) && value.rows.some((row) => row?.checkSizeMin !== undefined)) return value.rows;
  for (const child of Object.values(value)) {
    const rows = findRows(child);
    if (rows) return rows;
  }
  return null;
}

function extractRows(html) {
  const scriptBodies = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);

  for (const script of scriptBodies) {
    if (!script.includes("checkSizeMin") || !script.includes("self.__next_f.push")) continue;
    const match = script.match(/self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)\s*$/s);
    if (!match) continue;

    const decoded = JSON.parse(match[1]);
    const jsonStart = decoded.indexOf("[");
    if (jsonStart < 0) continue;

    const rows = findRows(JSON.parse(decoded.slice(jsonStart)));
    if (rows) return rows;
  }

  throw new Error("Could not find the embedded VC rows in the Next.js payload.");
}

function csvCell(value) {
  const stringValue = Array.isArray(value) ? value.join("|") : value == null ? "" : String(value);
  return /[",\n]/.test(stringValue) ? `"${stringValue.replaceAll('"', '""')}"` : stringValue;
}

const response = await fetch(SOURCE_URL, { headers: { "user-agent": "FundingAgent/0.1 public-directory-import" } });
if (!response.ok) throw new Error(`Eddy directory request failed: ${response.status} ${response.statusText}`);

const rows = extractRows(await response.text());
const scrapedAt = new Date().toISOString().slice(0, 10);
const fields = Object.keys(rows[0]);
const snapshot = {
  meta: {
    sourceName: "eddyhdzg Austin VC Directory",
    sourceUrl: SOURCE_URL,
    scrapedAt,
    recordCount: rows.length,
    fields,
    note: "Public directory snapshot imported for Funding Agent; verify time-sensitive facts against each firm's official website before outreach.",
  },
  vcs: rows,
};

const json = `${JSON.stringify(snapshot, null, 2)}\n`;
const csv = `${[fields.join(","), ...rows.map((row) => fields.map((field) => csvCell(row[field])).join(","))].join("\n")}\n`;
const appDataPath = fileURLToPath(new URL("../src/data/eddy-vcs.json", import.meta.url));
const exportDirectory = fileURLToPath(new URL("../../data/", import.meta.url));

await mkdir(exportDirectory, { recursive: true });
await writeFile(appDataPath, json);
await writeFile(`${exportDirectory}/eddy-vcs-${scrapedAt}.json`, json);
await writeFile(`${exportDirectory}/eddy-vcs-${scrapedAt}.csv`, csv);

console.log(`Imported ${rows.length} VCs from ${SOURCE_URL}`);
console.log(`App data: ${appDataPath}`);
console.log(`Exports: ${exportDirectory}/eddy-vcs-${scrapedAt}.{json,csv}`);
