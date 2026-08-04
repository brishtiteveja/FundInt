const MONTHS = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

const STOP_WORDS = new Set(["the", "a", "an", "and", "or", "to", "for", "of", "in", "my", "best", "find", "show", "search", "analyze", "build", "prioritized", "application", "applications", "plan", "next", "days", "investor", "investors", "vc", "vcs"]);

export const initialApplications = [
  { id: "yc-applied", organization: "Y Combinator", milestone: "Application submitted", date: null, status: "Applied", provenance: "User confirmed · date not recorded", source: "Founder workspace" },
  { id: "antler-applied", organization: "Antler", milestone: "Application submitted", date: null, status: "Applied", provenance: "User confirmed · date not recorded", source: "Founder workspace" },
  { id: "startup-world-cup-applied", organization: "Startup World Cup", milestone: "Application submitted", date: null, status: "Applied", provenance: "User confirmed · date not recorded", source: "Founder workspace" },
  { id: "ctan-deadline", firmId: "ctan", organization: "Central Texas Angel Network", milestone: "Application deadline", date: "2026-09-06", status: "Due soon", provenance: "Confirmed deadline", source: "Curated firm record" },
];

function parseConfirmedDate(deadline) {
  const match = deadline?.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\b/);
  if (!match) return null;
  return `2026-${MONTHS[match[1]]}-${String(match[2]).padStart(2, "0")}`;
}

export function createApplicationFromFirm(firm) {
  const date = parseConfirmedDate(firm.deadline);
  const normalizedDeadline = firm.deadline?.toLowerCase() || "";
  const provenance = date
    ? "Confirmed deadline"
    : normalizedDeadline.includes("rolling")
      ? "Rolling window"
      : normalizedDeadline.includes("no public")
        ? "Relationship-driven"
        : "Needs verification";

  return {
    id: `firm-${firm.id}`,
    firmId: firm.id,
    organization: firm.name,
    milestone: date ? "Application deadline" : provenance === "Rolling window" ? "Rolling application" : "Research next action",
    date,
    status: date ? "Due soon" : "Saved",
    provenance,
    source: firm.source || "Funding Agent firm record",
  };
}

export function buildAgentResult(firms, prompt, mode = "Analyze") {
  const keywords = prompt.toLowerCase().split(/[^a-z0-9/+.-]+/).filter((word) => word.length > 2 && !STOP_WORDS.has(word));
  const ranked = firms.map((firm) => {
    const haystack = `${firm.name} ${firm.skills.join(" ")} ${firm.stage} ${firm.location || ""}`.toLowerCase();
    const keywordScore = keywords.reduce((score, word) => score + (haystack.includes(word) ? 1 : 0), 0);
    return { firm, keywordScore };
  }).filter(({ keywordScore }) => keywordScore > 0).sort((a, b) => b.keywordScore - a.keywordScore || b.firm.fit - a.firm.fit);

  const matches = (ranked.length ? ranked : firms.map((firm) => ({ firm, keywordScore: 0 })).sort((a, b) => b.firm.fit - a.firm.fit)).slice(0, 5).map(({ firm }) => firm);
  const lead = matches[0];
  const isPlan = mode === "Plan";
  const matchNames = matches.map((firm) => firm.name).join(", ");

  return {
    type: isPlan ? "plan" : "report",
    title: lead ? `${lead.name} leads this ${mode.toLowerCase()} pass` : `${mode} workspace result`,
    body: lead
      ? `${matchNames} are the strongest matches in the current ${firms.length}-firm workspace. ${lead.name} leads on fit (${lead.fit}) with ${lead.skills.slice(0, 3).join(", ")}.`
      : "No firms match the current workspace filters. Clear a filter and run the task again.",
    bullets: isPlan
      ? ["Verify public application routes and source freshness", "Prioritize confirmed or rolling opportunities", "Save qualified firms to the application timeline"]
      : matches.slice(0, 3).map((firm) => `${firm.name}: ${firm.stage}; ${firm.deadline}`),
    sourceLabel: "Funding Agent · Eddy snapshot + curated records",
  };
}

export function getMonthCells(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const startOffset = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const total = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  return Array.from({ length: total }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1, index - startOffset + 1));
    const iso = date.toISOString().slice(0, 10);
    return { date: iso, day: date.getUTCDate(), inMonth: date.getUTCMonth() === month - 1 };
  });
}
