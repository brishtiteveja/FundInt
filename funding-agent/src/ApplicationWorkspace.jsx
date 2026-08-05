import { useMemo, useState } from "react";
import { ArrowSquareOut } from "@phosphor-icons/react/ArrowSquareOut";
import { CalendarBlank } from "@phosphor-icons/react/CalendarBlank";
import { CaretLeft } from "@phosphor-icons/react/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/CaretRight";
import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { Clock } from "@phosphor-icons/react/Clock";
import { LinkSimple } from "@phosphor-icons/react/LinkSimple";
import { ListBullets } from "@phosphor-icons/react/ListBullets";
import { Plus } from "@phosphor-icons/react/Plus";
import { Trash } from "@phosphor-icons/react/Trash";
import { WarningCircle } from "@phosphor-icons/react/WarningCircle";
import { X } from "@phosphor-icons/react/X";
import { getMonthCells } from "./agent-utils";

function monthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function shiftMonth(monthKey, offset) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 + offset, 1)).toISOString().slice(0, 7);
}

function initialCalendarMonth(applications) {
  return applications.filter((application) => application.date).map((application) => application.date.slice(0, 7)).sort()[0] || new Date().toISOString().slice(0, 7);
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

function AddApplicationModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ organization: "", milestone: "Application deadline", date: "", status: "Saved", provenance: "Founder entered" });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    if (!form.organization.trim()) return;
    onAdd({ ...form, id: `manual-${Date.now()}`, organization: form.organization.trim(), date: form.date || null, source: "Founder workspace" });
    onClose();
  };

  return <div className="application-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="application-modal" role="dialog" aria-modal="true" aria-label="Add application milestone"><header><div><span>Application tracker</span><h2>Add a milestone</h2></div><button aria-label="Close add application" onClick={onClose}><X /></button></header><form onSubmit={submit}>
    <label>Program or investor<input autoFocus value={form.organization} onChange={(event) => update("organization", event.target.value)} placeholder="e.g. Pear VC" /></label>
    <label>Milestone<select value={form.milestone} onChange={(event) => update("milestone", event.target.value)}><option>Application deadline</option><option>Application submitted</option><option>Follow-up</option><option>Investor meeting</option><option>Research next action</option></select></label>
    <div className="form-row"><label>Date<input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} /></label><label>Status<select value={form.status} onChange={(event) => update("status", event.target.value)}><option>Saved</option><option>Applied</option><option>Due soon</option><option>Meeting</option><option>Passed</option></select></label></div>
    <label>Provenance<select value={form.provenance} onChange={(event) => update("provenance", event.target.value)}><option>Founder entered</option><option>Confirmed deadline</option><option>Rolling window</option><option>Predicted · verify</option></select></label>
    <button className="application-primary" disabled={!form.organization.trim()}><Plus /> Add to timeline</button>
  </form></section></div>;
}

export function ApplicationWorkspace({ applications, setApplications, view, setView, statusFilter, query = "", onNotify }) {
  const [month, setMonth] = useState(() => initialCalendarMonth(applications));
  const [showAdd, setShowAdd] = useState(false);
  const filtered = useMemo(() => applications.filter((application) => {
    const matchesStatus = statusFilter === "All statuses" || application.status === statusFilter;
    const searchable = `${application.organization} ${application.milestone} ${application.status} ${application.provenance}`.toLowerCase();
    return matchesStatus && searchable.includes(query.toLowerCase());
  }), [applications, statusFilter, query]);
  const dated = useMemo(() => filtered.filter((application) => application.date).sort((a, b) => a.date.localeCompare(b.date)), [filtered]);
  const undated = filtered.filter((application) => !application.date);
  const cells = getMonthCells(month);

  const remove = (id) => setApplications((current) => current.filter((application) => application.id !== id));
  const add = (application) => {
    setApplications((current) => [application, ...current]);
    onNotify(`${application.organization} added to the application timeline`);
  };

  return <section className="application-workspace">
    <header className="application-overview">
      <div><span className="eyebrow"><CalendarBlank /> Founder pipeline</span><h2>Your funding application timeline</h2><p>Confirmed dates live on the calendar. Rolling, predicted, and relationship-driven opportunities stay explicitly labeled until verified.</p></div>
      <dl><div><dt>Tracked</dt><dd>{applications.length}</dd></div><div><dt>Applied</dt><dd>{applications.filter((item) => item.status === "Applied").length}</dd></div><div><dt>Upcoming dates</dt><dd>{applications.filter((item) => item.date && item.date >= "2026-08-04").length}</dd></div><div><dt>Needs a date</dt><dd>{applications.filter((item) => !item.date).length}</dd></div></dl>
    </header>

    <div className="application-toolbar">
      <div className="application-view-toggle" role="group" aria-label="Application view"><button className={view === "timeline" ? "active" : ""} onClick={() => setView("timeline")}><ListBullets /> Timeline</button><button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}><CalendarBlank /> Calendar</button></div>
      <span>{filtered.length} milestones · {dated.length} dated</span>
      <button className="google-calendar-button" onClick={() => onNotify("Google Calendar one-click links are ready; account-wide sync needs Google OAuth")}><LinkSimple /> Connect Google Calendar</button>
      <button className="application-primary" onClick={() => setShowAdd(true)}><Plus /> Add milestone</button>
    </div>

    {view === "timeline" ? <div className="timeline-layout">
      <section className="timeline-feed"><header><h3>Upcoming and saved</h3><span>Sorted by verified date</span></header>{dated.map((application, index) => <article className={`timeline-item status-${application.status.toLowerCase().replaceAll(" ", "-")}`} key={application.id}><div className="timeline-axis"><i />{index < dated.length - 1 && <span />}</div><div className="timeline-date"><strong>{prettyDate(application.date)}</strong><small>{application.provenance}</small></div><div className="timeline-card"><header><div><strong>{application.organization}</strong><span>{application.milestone}</span></div><b>{application.status}</b></header><footer><span><CheckCircle weight="fill" /> {application.source}</span><a href={googleCalendarUrl(application)} target="_blank" rel="noreferrer">Google Calendar <ArrowSquareOut /></a><button aria-label={`Remove ${application.organization}`} onClick={() => remove(application.id)}><Trash /></button></footer></div></article>)}</section>
      <aside className="undated-applications"><header><WarningCircle /><div><h3>Undated applications</h3><p>Applied or saved, but no date was invented.</p></div></header>{undated.map((application) => <article key={application.id}><span className={`application-status status-${application.status.toLowerCase()}`}>{application.status}</span><strong>{application.organization}</strong><p>{application.milestone}</p><small>{application.provenance}</small><button aria-label={`Remove ${application.organization}`} onClick={() => remove(application.id)}><Trash /></button></article>)}</aside>
    </div> : <div className="calendar-layout">
      <section className="month-calendar"><header><button aria-label="Previous month" onClick={() => setMonth((current) => shiftMonth(current, -1))}><CaretLeft /></button><div><span>Application calendar</span><h3>{monthLabel(month)}</h3></div><button aria-label="Next month" onClick={() => setMonth((current) => shiftMonth(current, 1))}><CaretRight /></button></header><div className="calendar-weekdays">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{cells.map((cell) => { const items = dated.filter((application) => application.date === cell.date); return <article key={cell.date} className={`${cell.inMonth ? "" : "outside"} ${items.length ? "has-items" : ""}`}><span>{cell.day}</span>{items.map((application) => <button key={application.id} title={`${application.organization}: ${application.milestone}`} onClick={() => onNotify(`${application.organization} · ${application.milestone}`)}><i className={`status-${application.status.toLowerCase().replaceAll(" ", "-")}`} />{application.organization}</button>)}</article>; })}</div></section>
      <aside className="calendar-agenda"><header><Clock /><div><h3>Month agenda</h3><p>{dated.filter((item) => item.date.startsWith(month)).length} dated milestones</p></div></header>{dated.filter((item) => item.date.startsWith(month)).map((application) => <article key={application.id}><time>{prettyDate(application.date)}</time><strong>{application.organization}</strong><span>{application.milestone}</span><small>{application.provenance}</small><a href={googleCalendarUrl(application)} target="_blank" rel="noreferrer">Add to Google Calendar <ArrowSquareOut /></a></article>)}</aside>
    </div>}
    {showAdd && <AddApplicationModal onClose={() => setShowAdd(false)} onAdd={add} />}
  </section>;
}
