import assert from "node:assert/strict";
import test from "node:test";
import {
  APPLICATION_TRACKING_STATUSES,
  applicationFromEvent,
  buildFundingCalendarItems,
  createManualApplication,
  parseOpportunityDate,
  setApplicationReminder,
  upsertEventApplication,
} from "../src/funding-calendar-utils.js";

const event = {
  id: "pitch-day",
  title: "Pitch Day",
  startDate: "2026-10-21",
  applicationDeadline: "Aug 15, 2026",
  status: "Applications open",
  confidence: "High",
  detailsUrl: "https://example.com/pitch-day",
};

test("funding calendar combines application milestones, event dates, and event application deadlines", () => {
  const items = buildFundingCalendarItems([
    { id: "yc", organization: "YC", milestone: "Interview", date: "2026-09-01", status: "Meeting" },
  ], [event]);

  assert.deepEqual(items.map(({ kind, date }) => ({ kind, date })), [
    { kind: "deadline", date: "2026-08-15" },
    { kind: "application", date: "2026-09-01" },
    { kind: "event", date: "2026-10-21" },
  ]);
});

test("saving an event is idempotent and can enable reminders", () => {
  const saved = upsertEventApplication([], event);
  const reminded = upsertEventApplication(saved, event, { reminderEnabled: true });

  assert.equal(reminded.length, 1);
  assert.equal(reminded[0].reminderEnabled, true);
  assert.equal(reminded[0].reminderDate, event.startDate);
  const calendarItems = buildFundingCalendarItems(reminded, [event]);
  assert.equal(calendarItems.filter((item) => item.kind === "reminder").length, 1);
  assert.equal(calendarItems.find((item) => item.kind === "event").reminderDate, event.startDate);
  assert.equal(calendarItems.find((item) => item.kind === "deadline").reminderDate, event.startDate);
  assert.deepEqual(applicationFromEvent(event).sourceEventId, event.id);
});

test("deadline parser rejects vague dates instead of inventing a year", () => {
  assert.equal(parseOpportunityDate("Aug 15, 2026"), "2026-08-15");
  assert.equal(parseOpportunityDate("Rolling"), null);
});

test("manual tracking records preserve founder outcomes and a dated reminder", () => {
  assert.deepEqual(APPLICATION_TRACKING_STATUSES.slice(0, 4), [
    "Applied",
    "In progress / waiting",
    "Rejected",
    "Didn't apply / avoided",
  ]);

  const application = createManualApplication({
    organization: "  Pear VC  ",
    milestone: "Follow up with partner",
    status: "In progress / waiting",
    date: "",
    reminderEnabled: true,
    reminderDate: "2026-09-12",
    notes: "Waiting on the investment team.",
  }, { now: 1_725_000_000_000 });

  assert.deepEqual(application, {
    id: "manual-1725000000000",
    organization: "Pear VC",
    milestone: "Follow up with partner",
    date: null,
    status: "In progress / waiting",
    provenance: "Founder entered",
    source: "Founder workspace",
    reminderEnabled: true,
    reminderDate: "2026-09-12",
    notes: "Waiting on the investment team.",
  });

  assert.deepEqual(buildFundingCalendarItems([application], []).map(({ kind, date, organization }) => ({ kind, date, organization })), [
    { kind: "reminder", date: "2026-09-12", organization: "Pear VC" },
  ]);
});

test("reminder updates cannot leave an application enabled without a date", () => {
  const applications = [{ id: "pear", organization: "Pear VC", reminderEnabled: false, reminderDate: null }];

  assert.deepEqual(setApplicationReminder(applications, "pear", "2026-09-18"), [{
    id: "pear",
    organization: "Pear VC",
    reminderEnabled: true,
    reminderDate: "2026-09-18",
  }]);
  assert.deepEqual(setApplicationReminder(applications, "pear", ""), [{
    id: "pear",
    organization: "Pear VC",
    reminderEnabled: false,
    reminderDate: null,
  }]);

  const [legacyCalendarItem] = buildFundingCalendarItems([{ ...applications[0], date: "2026-09-20", reminderEnabled: true }], []);
  assert.equal(legacyCalendarItem.reminderEnabled, false);
  assert.equal(buildFundingCalendarItems([{ ...applications[0], date: "2026-09-20", reminderEnabled: true }], []).filter((item) => item.kind === "reminder").length, 0);
});
