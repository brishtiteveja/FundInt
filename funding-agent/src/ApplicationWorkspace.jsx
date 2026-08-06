import { useMemo, useState } from "react";
import { ArrowSquareOut } from "@phosphor-icons/react/ArrowSquareOut";
import { ArrowsClockwise } from "@phosphor-icons/react/ArrowsClockwise";
import { BellRinging } from "@phosphor-icons/react/BellRinging";
import { Binoculars } from "@phosphor-icons/react/Binoculars";
import { CalendarBlank } from "@phosphor-icons/react/CalendarBlank";
import { CaretLeft } from "@phosphor-icons/react/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/CaretRight";
import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { Clock } from "@phosphor-icons/react/Clock";
import { LinkSimple } from "@phosphor-icons/react/LinkSimple";
import { ListBullets } from "@phosphor-icons/react/ListBullets";
import { Plus } from "@phosphor-icons/react/Plus";
import { SlackLogo } from "@phosphor-icons/react/SlackLogo";
import { Trash } from "@phosphor-icons/react/Trash";
import { WarningCircle } from "@phosphor-icons/react/WarningCircle";
import { X } from "@phosphor-icons/react/X";
import { getMonthCells } from "./agent-utils";
import { APPLICATION_TRACKING_STATUSES, buildFundingCalendarItems, createManualApplication, setApplicationReminder } from "./funding-calendar-utils";
import { usePersistentState } from "./use-persistent-state";

function monthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function shiftMonth(monthKey, offset) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 + offset, 1)).toISOString().slice(0, 7);
}

function initialCalendarMonth() {
  return new Date().toISOString().slice(0, 7);
}

function prettyDate(date) {
  if (!date) return "Date not recorded";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

function googleCalendarUrl(application) {
  if (!application.date) return "";
  const start = application.date.replaceAll("-", "");
  const next = new Date(`${application.date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const end = next.toISOString().slice(0, 10).replaceAll("-", "");
  const params = new URLSearchParams({ action: "TEMPLATE", text: `${application.organization} · ${application.milestone}`, dates: `${start}/${end}`, details: `${application.provenance}. Source: ${application.source}` });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function statusKey(status) {
  return String(status || "saved").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function ApplicationStatusSelect({ applicationId, organization, value, onChange }) {
  return <select className={`application-status-select status-${statusKey(value)}`} aria-label={`Status for ${organization}`} value={value} onChange={(event) => onChange(applicationId, event.target.value)}>{APPLICATION_TRACKING_STATUSES.map((status) => <option key={status}>{status}</option>)}</select>;
}

function ReminderDateInput({ applicationId, organization, value, onChange }) {
  return <label className="saved-reminder-input"><span><BellRinging /> Reminder</span><input type="date" aria-label={`Reminder date for ${organization}`} value={value || ""} onChange={(event) => onChange(applicationId, event.target.value)} /></label>;
}

function AddApplicationModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ organization: "", milestone: "Application follow-up", date: "", status: "In progress / waiting", reminderEnabled: false, reminderDate: "", notes: "" });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    if (!form.organization.trim() || (form.reminderEnabled && !form.reminderDate)) return;
    onAdd(createManualApplication(form));
    onClose();
  };

  return <div className="application-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="application-modal" role="dialog" aria-modal="true" aria-label="Add application milestone"><header><div><span>Application tracker</span><h2>Add an application</h2></div><button aria-label="Close add application" onClick={onClose}><X /></button></header><form onSubmit={submit}>
    <label>Program or investor<input autoFocus value={form.organization} onChange={(event) => update("organization", event.target.value)} placeholder="e.g. Pear VC" /></label>
    <fieldset className="manual-status-choices"><legend>Where is this application?</legend><div>{APPLICATION_TRACKING_STATUSES.slice(0, 4).map((status) => <button type="button" key={status} className={form.status === status ? "active" : ""} onClick={() => update("status", status)}>{status}</button>)}</div></fieldset>
    <div className="form-row"><label>Next milestone<select value={form.milestone} onChange={(event) => update("milestone", event.target.value)}><option>Application follow-up</option><option>Application deadline</option><option>Application submitted</option><option>Investor response</option><option>Investor meeting</option><option>Research next action</option></select></label><label>Deadline or follow-up date<input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} /></label></div>
    <label>Notes<textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="What happened, who replied, or what is the next action?" /></label>
    <label className="manual-reminder-toggle"><input type="checkbox" checked={form.reminderEnabled} onChange={(event) => update("reminderEnabled", event.target.checked)} /><span><strong>Add a reminder</strong><small>The preference is saved now; delivery still needs the notification worker.</small></span></label>
    {form.reminderEnabled && <label>Reminder date<input required type="date" value={form.reminderDate} onChange={(event) => update("reminderDate", event.target.value)} /></label>}
    <button className="application-primary" disabled={!form.organization.trim() || (form.reminderEnabled && !form.reminderDate)}><Plus /> Add application status</button>
  </form></section></div>;
}

function DiscoveryPulse({ cadence, setCadence, reminderCount, eventCount, onNotify, onOpenDiscovery }) {
  return <aside className="discovery-pulse">
    <header><ArrowsClockwise /><div><span>Discovery Pulse</span><h3>Keep the calendar fresh</h3></div><b>Planned</b></header>
    <div className="discovery-status-grid">
      <div><span>Current snapshot</span><strong>Aug 4, 2026</strong><small>{eventCount} verified events loaded</small></div>
      <div><span>Next scan</span><strong>Worker needed</strong><small>Live web discovery is not connected</small></div>
    </div>
    <div className="discovery-cadence"><span>Preferred scan cadence</span><div>{["Daily", "Weekly"].map((item) => <button key={item} className={cadence === item.toLowerCase() ? "active" : ""} onClick={() => setCadence(item.toLowerCase())}>{item}</button>)}</div><small>Preference is saved. A production scheduler will execute it.</small></div>
    <button className="discovery-run" onClick={onOpenDiscovery}><Binoculars /> Review discovered opportunities</button>
    <div className="notification-route"><BellRinging /><div><strong>{reminderCount} reminder preferences</strong><span>Preferences are stored with your calendar items; delivery needs the worker.</span></div><button onClick={() => onNotify("Email reminders require the production notification worker")}>Email</button></div>
    <div className="notification-route slack-route"><SlackLogo /><div><strong>Slack #funding</strong><span>Send new opportunities and deadline changes to your team.</span></div><button onClick={() => onNotify("Slack #funding requires Slack OAuth or an incoming webhook")}>Connect</button></div>
  </aside>;
}

export function ApplicationWorkspace({ applications, setApplications, events, view, setView, statusFilter, query = "", onNotify, onOpenDiscovery, onSaveEvent }) {
  const allItems = useMemo(() => buildFundingCalendarItems(applications, events), [applications, events]);
  const [month, setMonth] = useState(initialCalendarMonth);
  const [showAdd, setShowAdd] = useState(false);
  const [cadence, setCadence] = usePersistentState("funding-agent-discovery-cadence", "daily");
  const filteredApplications = useMemo(() => applications.filter((application) => {
    const matchesStatus = statusFilter === "All statuses" || application.status === statusFilter;
    const searchable = `${application.organization} ${application.milestone} ${application.status} ${application.provenance}`.toLowerCase();
    return matchesStatus && searchable.includes(query.toLowerCase());
  }), [applications, statusFilter, query]);
  const filteredEvents = useMemo(() => statusFilter === "All statuses"
    ? events.filter((event) => `${event.title} ${event.city} ${event.venue} ${event.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()))
    : [], [events, query, statusFilter]);
  const dated = useMemo(() => buildFundingCalendarItems(filteredApplications, filteredEvents), [filteredApplications, filteredEvents]);
  const undated = filteredApplications.filter((application) => !application.date);
  const today = new Date().toISOString().slice(0, 10);
  const upcomingItems = dated.filter((item) => item.date >= today);
  const upcoming = [...upcomingItems.filter((item) => item.kind !== "event").slice(0, 2), ...upcomingItems.filter((item) => item.kind === "event").slice(0, 2)].sort((left, right) => left.date.localeCompare(right.date));
  const reminderCount = applications.filter((application) => application.reminderEnabled && application.reminderDate).length;
  const deadlineCount = allItems.filter((item) => item.kind === "deadline" || (item.kind !== "reminder" && item.milestone?.toLowerCase().includes("deadline"))).length;
  const cells = getMonthCells(month);

  const remove = (id) => setApplications((current) => current.filter((application) => application.id !== id));
  const add = (application) => {
    setApplications((current) => [application, ...current]);
    onNotify(application.reminderEnabled
      ? `${application.organization} added with a reminder preference; delivery worker is not connected yet`
      : `${application.organization} added to the Funding Calendar`);
  };
  const updateStatus = (id, status) => {
    setApplications((current) => current.map((application) => application.id === id ? { ...application, status } : application));
    const application = applications.find((item) => item.id === id);
    onNotify(`${application?.organization || "Application"} marked ${status}`);
  };
  const updateReminderDate = (id, reminderDate) => {
    const application = applications.find((item) => item.id === id);
    setApplications((current) => setApplicationReminder(current, id, reminderDate));
    onNotify(reminderDate
      ? `${application?.organization || "Application"} reminder set for ${prettyDate(reminderDate)}; delivery worker is not connected yet`
      : `${application?.organization || "Application"} reminder removed`);
  };

  const saveCalendarEvent = (item, reminderEnabled = false) => {
    const event = events.find((candidate) => candidate.id === item.sourceEventId);
    if (event) onSaveEvent(event, reminderEnabled);
  };

  const toggleReminder = (item) => {
    if (!item.sourceApplicationId) {
      saveCalendarEvent(item, true);
      return;
    }
    updateReminderDate(item.sourceApplicationId, item.reminderEnabled ? "" : (item.reminderDate || item.date));
  };

  return <section className="application-workspace funding-calendar-workspace">
    <header className="application-overview">
      <div><span className="eyebrow"><CalendarBlank /> Primary workspace</span><h2>Funding Calendar</h2><p>Application deadlines, investor meetings, pitch days, and founder events—one calendar, with source confidence and reminders attached.</p><div className="calendar-quick-actions"><button className="application-primary" onClick={() => setShowAdd(true)}><Plus /> Add application</button><button onClick={onOpenDiscovery}><Binoculars /> Discover opportunities</button><button onClick={() => onNotify("Reminder center opened in the Discovery Pulse") }><BellRinging /> Reminders</button><button onClick={() => onNotify("Google Calendar account sync requires Google OAuth; one-click links work now")}><LinkSimple /> Connect Google</button></div></div>
      <dl><div><dt>Calendar items</dt><dd>{allItems.length}</dd></div><div><dt>Deadlines</dt><dd>{deadlineCount}</dd></div><div><dt>Upcoming</dt><dd>{allItems.filter((item) => item.date >= today).length}</dd></div><div><dt>Reminders</dt><dd>{reminderCount}</dd></div></dl>
    </header>

    <section className="upcoming-ribbon"><header><Clock /><div><strong>Next on your funding calendar</strong><span>Applications and events ordered by date</span></div></header>{upcoming.map((item) => <button key={item.id} onClick={() => setMonth(item.date.slice(0, 7))}><time>{prettyDate(item.date)}</time><span className={`calendar-kind kind-${item.kind}`}>{item.kind}</span><strong>{item.organization}</strong><small>{item.milestone}</small></button>)}</section>

    <div className="application-toolbar">
      <div className="application-view-toggle" role="group" aria-label="Funding Calendar view"><button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}><CalendarBlank /> Calendar</button><button className={view === "timeline" ? "active" : ""} onClick={() => setView("timeline")}><ListBullets /> Agenda</button></div>
      <span>{dated.length} dated items · {undated.length} undated applications</span>
      <div className="calendar-legend"><span><i className="kind-application" /> Application</span><span><i className="kind-deadline" /> Deadline</span><span><i className="kind-event" /> Event</span><span><i className="kind-reminder" /> Reminder</span></div>
      <button className="application-primary" onClick={() => setShowAdd(true)}><Plus /> Add milestone</button>
    </div>

    {view === "timeline" ? <div className="timeline-layout">
      <section className="timeline-feed"><header><h3>Upcoming applications & events</h3><span>Sorted by sourced date</span></header>{dated.map((item, index) => <article className={`timeline-item calendar-item-${item.kind}`} key={item.id}><div className="timeline-axis"><i />{index < dated.length - 1 && <span />}</div><div className="timeline-date"><strong>{prettyDate(item.date)}</strong><small>{item.provenance}</small></div><div className="timeline-card"><header><div><span className={`calendar-kind kind-${item.kind}`}>{item.kind}</span><strong>{item.organization}</strong><span>{item.milestone}</span>{item.notes && <small>{item.notes}</small>}</div>{item.sourceApplicationId ? <ApplicationStatusSelect applicationId={item.sourceApplicationId} organization={item.organization} value={item.status} onChange={updateStatus} /> : <b>{item.status}</b>}</header><footer><span><CheckCircle weight="fill" /> {item.saved ? "Saved" : "Discovered"}</span>{item.kind === "event" && !item.saved && <button onClick={() => saveCalendarEvent(item)}><Plus /> Save</button>}<button className={item.reminderEnabled ? "reminder-active" : ""} onClick={() => toggleReminder(item)}><BellRinging weight={item.reminderEnabled ? "fill" : "regular"} /> {item.reminderEnabled ? "Reminder on" : "Remind"}</button>{item.sourceApplicationId && item.kind !== "reminder" && <ReminderDateInput applicationId={item.sourceApplicationId} organization={item.organization} value={item.reminderDate} onChange={updateReminderDate} />}{item.reminderDate && item.kind === "reminder" && <small className="saved-reminder-date">{prettyDate(item.reminderDate)}</small>}{item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer">Source <ArrowSquareOut /></a>}<a href={googleCalendarUrl(item)} target="_blank" rel="noreferrer">Google Calendar <ArrowSquareOut /></a>{item.sourceApplicationId && <button aria-label={`Remove ${item.organization}`} onClick={() => remove(item.sourceApplicationId)}><Trash /></button>}</footer></div></article>)}</section>
      <div className="funding-side-stack"><aside className="undated-applications"><header><WarningCircle /><div><h3>Undated applications</h3><p>Saved, but no date was invented.</p></div></header>{undated.map((application) => <article key={application.id}><ApplicationStatusSelect applicationId={application.id} organization={application.organization} value={application.status} onChange={updateStatus} /><strong>{application.organization}</strong><p>{application.milestone}</p>{application.notes && <p>{application.notes}</p>}<ReminderDateInput applicationId={application.id} organization={application.organization} value={application.reminderDate} onChange={updateReminderDate} /><small>{application.provenance}</small><button aria-label={`Remove ${application.organization}`} onClick={() => remove(application.id)}><Trash /></button></article>)}</aside><DiscoveryPulse cadence={cadence} setCadence={setCadence} reminderCount={reminderCount} eventCount={events.length} onNotify={onNotify} onOpenDiscovery={onOpenDiscovery} /></div>
    </div> : <div className="calendar-layout">
      <section className="month-calendar"><header><button aria-label="Previous month" onClick={() => setMonth((current) => shiftMonth(current, -1))}><CaretLeft /></button><div><span>Funding Calendar</span><h3>{monthLabel(month)}</h3></div><button aria-label="Next month" onClick={() => setMonth((current) => shiftMonth(current, 1))}><CaretRight /></button></header><div className="calendar-weekdays">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{cells.map((cell) => { const items = dated.filter((item) => item.date === cell.date); return <article key={cell.date} className={`${cell.inMonth ? "" : "outside"} ${items.length ? "has-items" : ""} ${cell.date === today ? "today" : ""}`}><span>{cell.day}</span>{items.slice(0, 3).map((item) => <button key={item.id} className={`calendar-cell-item kind-${item.kind}`} title={`${item.organization}: ${item.milestone}`} onClick={() => onNotify(`${item.organization} · ${item.milestone}`)}><i />{item.organization}{item.reminderEnabled && <BellRinging weight="fill" />}</button>)}{items.length > 3 && <small>+{items.length - 3} more</small>}</article>; })}</div></section>
      <div className="calendar-side-stack"><aside className="calendar-agenda"><header><Clock /><div><h3>{monthLabel(month)} agenda</h3><p>{dated.filter((item) => item.date.startsWith(month)).length} calendar items</p></div></header>{dated.filter((item) => item.date.startsWith(month)).map((item) => <article key={item.id}><div><time>{prettyDate(item.date)}</time><span className={`calendar-kind kind-${item.kind}`}>{item.kind}</span></div><strong>{item.organization}</strong><span>{item.milestone}</span><small>{item.provenance}</small><footer>{item.kind === "event" && !item.saved && <button onClick={() => saveCalendarEvent(item)}><Plus /> Save</button>}<button className={item.reminderEnabled ? "reminder-active" : ""} onClick={() => toggleReminder(item)}><BellRinging weight={item.reminderEnabled ? "fill" : "regular"} /> {item.reminderEnabled ? "Reminder on" : "Remind"}</button><a href={googleCalendarUrl(item)} target="_blank" rel="noreferrer">Google <ArrowSquareOut /></a></footer></article>)}</aside><DiscoveryPulse cadence={cadence} setCadence={setCadence} reminderCount={reminderCount} eventCount={events.length} onNotify={onNotify} onOpenDiscovery={onOpenDiscovery} /></div>
    </div>}
    {showAdd && <AddApplicationModal onClose={() => setShowAdd(false)} onAdd={add} />}
  </section>;
}
