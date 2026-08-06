const MONTHS = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

export const APPLICATION_TRACKING_STATUSES = [
  "Applied",
  "In progress / waiting",
  "Rejected",
  "Didn't apply / avoided",
  "Saved",
  "Due soon",
  "Meeting",
  "Passed",
];

export function createManualApplication(input, { now = Date.now() } = {}) {
  const organization = String(input.organization || "").trim();
  if (!organization) throw new Error("Program or investor is required");
  const status = APPLICATION_TRACKING_STATUSES.includes(input.status) ? input.status : "In progress / waiting";
  const milestone = String(input.milestone || "Application follow-up").trim() || "Application follow-up";
  const reminderDate = input.reminderEnabled ? (input.reminderDate || input.date || null) : null;
  return {
    id: `manual-${now}`,
    organization,
    milestone,
    date: input.date || null,
    status,
    provenance: "Founder entered",
    source: "Founder workspace",
    reminderEnabled: Boolean(input.reminderEnabled && reminderDate),
    reminderDate,
    notes: String(input.notes || "").trim(),
  };
}

export function parseOpportunityDate(value) {
  const match = String(value || "").match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),\s+(\d{4})\b/);
  if (!match) return null;
  return `${match[3]}-${MONTHS[match[1]]}-${String(match[2]).padStart(2, "0")}`;
}

export function applicationFromEvent(event, { reminderEnabled = false } = {}) {
  return {
    id: `event-${event.id}`,
    sourceEventId: event.id,
    calendarType: "event",
    organization: event.title,
    milestone: "Founder & VC event",
    date: event.startDate,
    status: "Saved",
    provenance: `${event.confidence} confidence · event source`,
    source: event.detailsUrl,
    sourceUrl: event.detailsUrl,
    reminderEnabled,
    reminderDate: reminderEnabled ? event.startDate : null,
  };
}

export function upsertEventApplication(applications, event, options = {}) {
  const next = applicationFromEvent(event, options);
  const existing = applications.find((application) => application.sourceEventId === event.id);
  if (!existing) return [next, ...applications];
  return applications.map((application) => {
    if (application.sourceEventId !== event.id) return application;
    const reminderEnabled = application.reminderEnabled || next.reminderEnabled;
    return {
      ...application,
      ...next,
      reminderEnabled,
      reminderDate: reminderEnabled ? (application.reminderDate || next.reminderDate || event.startDate) : null,
    };
  });
}

export function setApplicationReminder(applications, applicationId, reminderDate) {
  const date = reminderDate || null;
  return applications.map((application) => application.id === applicationId
    ? { ...application, reminderEnabled: Boolean(date), reminderDate: date }
    : application);
}

export function buildFundingCalendarItems(applications, events) {
  const savedEvents = new Map(applications.filter((application) => application.sourceEventId).map((application) => [application.sourceEventId, application]));
  const availableEventIds = new Set(events.map((event) => event.id));
  const applicationItems = applications
    .filter((application) => !application.sourceEventId || !availableEventIds.has(application.sourceEventId))
    .flatMap((application) => {
      const base = {
        ...application,
        sourceApplicationId: application.id,
        kind: application.sourceEventId ? "event" : "application",
        saved: true,
        reminderEnabled: Boolean(application.reminderEnabled && application.reminderDate),
      };
      const items = application.date ? [base] : [];
      if (application.reminderEnabled && application.reminderDate) {
        items.push({
          ...base,
          id: `${application.id}-reminder`,
          kind: "reminder",
          date: application.reminderDate,
          milestone: `Reminder · ${application.milestone}`,
        });
      }
      return items;
    });
  const eventItems = events.flatMap((event) => {
    const saved = savedEvents.get(event.id);
    const occurrence = {
      id: `opportunity-${event.id}`,
      sourceEventId: event.id,
      sourceApplicationId: saved?.id,
      kind: "event",
      organization: event.title,
      milestone: "Founder & VC event",
      date: event.startDate,
      status: saved?.status || event.status,
      provenance: `${event.confidence} confidence`,
      source: event.detailsUrl,
      sourceUrl: event.detailsUrl,
      saved: Boolean(saved),
      reminderEnabled: Boolean(saved?.reminderEnabled && saved?.reminderDate),
      reminderDate: saved?.reminderDate || null,
    };
    const deadlineDate = parseOpportunityDate(event.applicationDeadline);
    const deadline = deadlineDate ? [{
      id: `opportunity-deadline-${event.id}`,
      sourceEventId: event.id,
      sourceApplicationId: saved?.id,
      kind: "deadline",
      organization: event.title,
      milestone: "Application deadline",
      date: deadlineDate,
      status: "Due soon",
      provenance: `${event.confidence} confidence · event application`,
      source: event.detailsUrl,
      sourceUrl: event.detailsUrl,
      saved: Boolean(saved),
      reminderEnabled: Boolean(saved?.reminderEnabled && saved?.reminderDate),
      reminderDate: saved?.reminderDate || null,
    }] : [];
    const reminder = saved?.reminderEnabled && saved.reminderDate ? [{
      ...occurrence,
      id: `${saved.id}-reminder`,
      kind: "reminder",
      date: saved.reminderDate,
      milestone: "Reminder · Founder & VC event",
    }] : [];
    return [occurrence, ...deadline, ...reminder];
  });
  return [...applicationItems, ...eventItems].filter((item) => item.date).sort((left, right) => left.date.localeCompare(right.date));
}
