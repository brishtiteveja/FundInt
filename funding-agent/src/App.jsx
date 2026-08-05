import { useEffect, useMemo, useState } from "react";
import { ArrowSquareOut } from "@phosphor-icons/react/ArrowSquareOut";
import { Atom } from "@phosphor-icons/react/Atom";
import { Bell } from "@phosphor-icons/react/Bell";
import { BookmarkSimple } from "@phosphor-icons/react/BookmarkSimple";
import { Buildings } from "@phosphor-icons/react/Buildings";
import { CalendarBlank } from "@phosphor-icons/react/CalendarBlank";
import { CalendarDots } from "@phosphor-icons/react/CalendarDots";
import { CardsThree } from "@phosphor-icons/react/CardsThree";
import { CaretDown } from "@phosphor-icons/react/CaretDown";
import { Check } from "@phosphor-icons/react/Check";
import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { Circuitry } from "@phosphor-icons/react/Circuitry";
import { Clock } from "@phosphor-icons/react/Clock";
import { Database } from "@phosphor-icons/react/Database";
import { FileArrowDown } from "@phosphor-icons/react/FileArrowDown";
import { Funnel } from "@phosphor-icons/react/Funnel";
import { Handshake } from "@phosphor-icons/react/Handshake";
import { LinkSimple } from "@phosphor-icons/react/LinkSimple";
import { MagnifyingGlass } from "@phosphor-icons/react/MagnifyingGlass";
import { MapPin } from "@phosphor-icons/react/MapPin";
import { MapTrifold } from "@phosphor-icons/react/MapTrifold";
import { NotePencil } from "@phosphor-icons/react/NotePencil";
import { Path } from "@phosphor-icons/react/Path";
import { Plus } from "@phosphor-icons/react/Plus";
import { PushPin } from "@phosphor-icons/react/PushPin";
import { Robot } from "@phosphor-icons/react/Robot";
import { Rows } from "@phosphor-icons/react/Rows";
import { ShareNetwork } from "@phosphor-icons/react/ShareNetwork";
import { ShieldChevron } from "@phosphor-icons/react/ShieldChevron";
import { SlidersHorizontal } from "@phosphor-icons/react/SlidersHorizontal";
import { Sparkle } from "@phosphor-icons/react/Sparkle";
import { Table as TableIcon } from "@phosphor-icons/react/Table";
import { Target } from "@phosphor-icons/react/Target";
import { Ticket } from "@phosphor-icons/react/Ticket";
import { TrendUp } from "@phosphor-icons/react/TrendUp";
import { UsersThree } from "@phosphor-icons/react/UsersThree";
import { X } from "@phosphor-icons/react/X";
import { Background, Handle, Position, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AgentDock } from "./AgentDock";
import { ApplicationWorkspace } from "./ApplicationWorkspace";
import { InvestorMap } from "./InvestorMap";
import { fundingApi } from "./api";
import eddyVcData from "./data/eddy-vcs.json";
import { events } from "./data/events";
import { createApplicationFromFirm, initialApplications } from "./agent-utils";
import { getPaginationItems, matchesCheckFilter } from "./funding-utils";
import { usePersistentState } from "./use-persistent-state";

const curatedFirms = [
  { id: "ensemble", name: "Ensemble VC", initials: "E", location: "Austin, TX", fit: 98, stage: "Pre-seed, Seed\nSeries A", access: "Warm", deadline: "No public\napplication", status: "Active", skills: ["AI/ML", "Infrastructure", "Defense"], deals: 21, check: "$250K – $15M", activeAustin: "Yes" },
  { id: "capital", name: "Capital Factory", initials: "CF", location: "Austin, TX", fit: 84, stage: "Pre-seed, Seed\nSeries A", access: "Warm", deadline: "Rolling", status: "Open", skills: ["AI/ML", "B2B SaaS", "Infrastructure"], deals: 18, check: "$100K – $5M", activeAustin: "Yes" },
  { id: "atx", name: "ATX Venture Partners", initials: "ATX", location: "Austin, TX", fit: 81, stage: "Seed, Series A\nSeries B", access: "Warm", deadline: "No public\napplication", status: "Active", skills: ["AI/ML", "B2B SaaS", "Infrastructure"], deals: 26, check: "$1M – $20M", activeAustin: "Yes" },
  { id: "ctan", name: "Central Texas Angel Network", initials: "CT", location: "Austin, TX", fit: 79, stage: "Pre-seed, Seed\nSeries A", access: "Apply", deadline: "Sep 6 · 5pm CT", status: "Closing", skills: ["AI/ML", "B2B SaaS"], deals: 34, check: "$200K – $2M", activeAustin: "Yes" },
  { id: "s3", name: "S3 Ventures", initials: "S3", location: "Austin, TX", fit: 74, stage: "Seed, Series A", access: "Warm", deadline: "No public\napplication", status: "Active", skills: ["B2B SaaS", "Infrastructure"], deals: 32, check: "$500K – $15M", activeAustin: "Yes" },
  { id: "silverton", name: "Silverton Partners", initials: "S", location: "Austin, TX", fit: 71, stage: "Seed, Series A", access: "Warm", deadline: "No public\napplication", status: "Active", skills: ["AI/ML", "B2B SaaS"], deals: 29, check: "$500K – $4M", activeAustin: "Yes" },
  { id: "plug", name: "Plug and Play", initials: "P", location: "Austin hub", fit: 69, stage: "Pre-seed, Seed", access: "Apply", deadline: "Rolling", status: "Open", skills: ["AI/ML", "Infrastructure"], deals: 120, check: "$50K – $500K", activeAustin: "Yes" },
  { id: "geek", name: "Geek Ventures", initials: "G", location: "New York · Austin access", fit: 67, stage: "Pre-seed, Seed", access: "Intro", deadline: "Deadline\nunconfirmed", status: "Review", skills: ["AI/ML", "B2B SaaS"], deals: 24, check: "$200K – $800K", activeAustin: "Remote" },
  { id: "drive", name: "Drive Capital", initials: "D", location: "Columbus · Austin office", fit: 66, stage: "Seed, Series A", access: "Intro", deadline: "No public\napplication", status: "Active", skills: ["Infrastructure", "B2B SaaS"], deals: 38, check: "$500K – $50M", activeAustin: "Yes" },
  { id: "peak6", name: "PEAK6", sourceName: "Peak6", initials: "P6", location: "Austin, TX", fit: 64, stage: "Seed, Series A", access: "Intro", deadline: "No public\napplication", status: "Active", skills: ["AI/ML", "Fintech"], deals: 18, check: "$250K – $10M", activeAustin: "Yes" },
  { id: "sevenbc", name: "7BC Venture Capital", sourceName: "7BC VC", initials: "7B", location: "Austin, TX", fit: 62, stage: "Seed, Series A", access: "Warm", deadline: "Deadline\nunconfirmed", status: "Review", skills: ["AI/ML", "Infrastructure"], deals: 16, check: "$1M – $5M", activeAustin: "Yes" },
  { id: "admaiora", name: "Ad Maiora Venture", initials: "AM", location: "Austin, TX", fit: 60, stage: "Pre-seed, Seed", access: "Intro", deadline: "No public\napplication", status: "Active", skills: ["B2B SaaS", "Consumer"], deals: 13, check: "$100K – $1M", activeAustin: "Yes" },
  { id: "fourth", name: "4th & 1 Ventures", initials: "4·1", location: "Austin, TX", fit: 58, stage: "Pre-seed, Seed", access: "Intro", deadline: "Deadline\nunconfirmed", status: "Review", skills: ["Consumer", "Media"], deals: 11, check: "$100K – $1M", activeAustin: "Yes" },
  { id: "pear", name: "Pear VC", initials: "P", location: "San Francisco, CA", fit: 83, stage: "Pre-seed, Seed", access: "Apply", deadline: "Late applications\nrolling", status: "Open", skills: ["AI/ML", "B2B SaaS"], deals: 42, check: "$250K – $2M", activeAustin: "Remote" },
];

const curatedSourceNames = new Set(curatedFirms.filter((firm) => firm.id !== "pear").map((firm) => firm.sourceName || firm.name));

function initialsFor(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("").toUpperCase();
}

function compactMoney(value) {
  if (value == null) return null;
  if (value >= 1_000_000) return `$${Number((value / 1_000_000).toFixed(1))}M`;
  return `$${Math.round(value / 1_000)}K`;
}

function importedFit(vc, index) {
  const focus = vc.focusAreas || [];
  const stages = vc.stageFocus || [];
  const score = 54
    + (focus.includes("AI/ML") ? 13 : 0)
    + (focus.includes("Infrastructure") ? 7 : 0)
    + (focus.includes("Defense") ? 6 : 0)
    + (focus.includes("B2B SaaS") ? 5 : 0)
    + (stages.includes("Pre-Seed") || stages.includes("Seed") ? 4 : 0)
    + (index % 4);
  return Math.min(score, 92);
}

const importedFirms = eddyVcData.vcs
  .filter((vc) => !curatedSourceNames.has(vc.name))
  .map((vc, index) => {
    const applicationLike = vc.focusAreas?.some((area) => ["Accelerator", "Angel Network", "Incubator", "Venture Studio"].includes(area));
    const minimum = compactMoney(vc.checkSizeMin);
    const maximum = compactMoney(vc.checkSizeMax);
    return {
      id: `eddy-${vc.id}`,
      sourceId: vc.id,
      name: vc.name,
      initials: initialsFor(vc.name),
      location: vc.address?.includes("Austin") ? "Austin, TX" : vc.placeName || "Austin ecosystem",
      fit: importedFit(vc, index),
      stage: vc.stageFocus?.length ? vc.stageFocus.join(", ") : "Stage not listed",
      access: applicationLike ? "Apply" : "Intro",
      deadline: "Not tracked",
      status: "Verify",
      skills: vc.focusAreas?.slice(0, 3) || ["Agnostic"],
      deals: null,
      check: minimum && maximum ? `${minimum} – ${maximum}` : minimum ? `${minimum}+` : "Not listed",
      activeAustin: vc.address?.includes("Austin") || vc.lat ? "Yes" : "Ecosystem",
      websiteUrl: vc.websiteUrl,
      linkedinUrl: vc.linkedinUrl,
      crunchbaseUrl: vc.crunchbaseUrl,
      description: vc.description,
      source: "eddyhdzg snapshot",
      coordinateSource: vc.lat != null && vc.long != null ? "Eddy source" : null,
      lat: vc.lat != null && Number.isFinite(Number(vc.lat)) ? Number(vc.lat) : null,
      lng: vc.long != null && Number.isFinite(Number(vc.long)) ? Number(vc.long) : null,
    };
  });

const eddyFirmByName = new Map(eddyVcData.vcs.map((vc) => [vc.name, vc]));
const enrichedCuratedFirms = curatedFirms.map((firm) => {
  const sourceFirm = eddyFirmByName.get(firm.sourceName || firm.name);
  const sourceLat = Number(sourceFirm?.lat);
  const sourceLng = Number(sourceFirm?.long);
  return {
    ...firm,
    lat: sourceFirm?.lat != null && Number.isFinite(sourceLat) ? sourceLat : firm.id === "pear" ? 37.7749 : null,
    lng: sourceFirm?.long != null && Number.isFinite(sourceLng) ? sourceLng : firm.id === "pear" ? -122.4194 : null,
    websiteUrl: firm.websiteUrl || sourceFirm?.websiteUrl,
    description: firm.description || sourceFirm?.description,
    source: firm.source || (sourceFirm ? "eddyhdzg snapshot" : "Curated firm record"),
    coordinateSource: sourceFirm?.lat != null && sourceFirm?.long != null ? "Eddy source" : firm.id === "pear" ? "City-level fallback" : null,
  };
});

const firms = [...enrichedCuratedFirms, ...importedFirms];
const DEFAULT_PAGE_SIZE = 12;
const focusOptions = ["All focus", "AI/ML", "Infrastructure", "B2B SaaS", "Defense", "Fintech", "Healthtech", "Consumer", "Media"];
const stageOptions = ["All stages", "Pre-Seed", "Seed", "Series A", "Series B", "Series C+"];
const checkOptions = ["Any check size", "Under $250K", "$250K – $1M", "$1M – $5M", "$5M+", "Not listed"];
const evidenceOptions = ["All time", "Past 12 months", "Past 3 years", "Since 2018"];
const eventDateOptions = ["All dates", "Aug – Sep 2026", "Oct – Dec 2026", "2027"];
const applicationStatusOptions = ["All statuses", "Applied", "Saved", "Due soon", "Meeting", "Passed"];
const initialMemories = [
  { id: "memory-target", content: "Primary fundraising geographies: Austin and San Francisco.", createdAt: "2026-08-04T00:00:00.000Z" },
  { id: "memory-applied", content: "Already applied to Y Combinator, Antler, and Startup World Cup.", createdAt: "2026-08-04T00:00:00.000Z" },
  { id: "memory-trust", content: "Never invent a deadline; label rolling, predicted, stale, or relationship-driven states.", createdAt: "2026-08-04T00:00:00.000Z" },
];

const dealNodes = [
  { id: "saronic", title: "Saronic", meta: "Autonomy\nAustin, TX\nSeries A", icon: Path },
  { id: "chaos", title: "CHAOS\nIndustries", meta: "Defense Tech\nAustin, TX\nSeries A", icon: ShieldChevron },
  { id: "stablecore", title: "Stablecore", meta: "AI Infra\nAustin, TX\nSeed", icon: Atom },
  { id: "manifest", title: "Manifest", meta: "AI Security\nAustin, TX\nSeries A", icon: Circuitry },
  { id: "rain", title: "Rain", meta: "AI Dev Tools\nAustin, TX\nSeed", icon: Robot },
  { id: "icon", title: "ICON", meta: "Robotics\nAustin, TX\nSeed", icon: Buildings },
];

const graphPositions = {
  ensemble: { x: 340, y: 150 },
  atx: { x: 165, y: 104 },
  capital: { x: 510, y: 112 },
  skillInfra: { x: 38, y: 30 },
  skillAi: { x: 310, y: 0 },
  skillDefense: { x: 535, y: 28 },
  skillB2b: { x: 660, y: 110 },
  skillMedia: { x: 18, y: 196 },
  saronic: { x: 58, y: 292 },
  chaos: { x: 188, y: 292 },
  stablecore: { x: 320, y: 292 },
  manifest: { x: 452, y: 292 },
  rain: { x: 584, y: 292 },
  icon: { x: 705, y: 292 },
};

const skillNodes = [
  { id: "skillInfra", title: "Infrastructure", meta: "182 deals" },
  { id: "skillAi", title: "AI/ML", meta: "236 deals" },
  { id: "skillDefense", title: "Defense", meta: "96 deals" },
  { id: "skillB2b", title: "B2B SaaS", meta: "311 deals" },
  { id: "skillMedia", title: "Media", meta: "126 deals" },
];

const dealDetails = {
  saronic: { name: "Saronic", sector: "Autonomy / Defense", location: "Austin, TX", stage: "Series A", round: "$175M", date: "May 2025", investors: "Ensemble VC (Lead), 8VC, SignalFire", tags: ["Defense", "Autonomy", "AI/ML"], source: "Press release", url: "https://www.saronic.com" },
  chaos: { name: "CHAOS Industries", sector: "Defense Tech", location: "Los Angeles, CA", stage: "Series A", round: "Verified deal", date: "Jun 2025", investors: "Ensemble VC and co-investors", tags: ["Defense", "Hardware"], source: "Firm portfolio" },
  stablecore: { name: "Stablecore", sector: "AI infrastructure", location: "Austin, TX", stage: "Seed", round: "Verified deal", date: "Apr 2025", investors: "Ensemble VC", tags: ["AI/ML", "Infrastructure"], source: "Firm portfolio" },
  manifest: { name: "Manifest", sector: "AI security", location: "Austin, TX", stage: "Series A", round: "Verified deal", date: "Mar 2025", investors: "Ensemble VC", tags: ["Security", "AI/ML"], source: "Firm portfolio" },
  rain: { name: "Rain", sector: "Developer tools", location: "Austin, TX", stage: "Seed", round: "Verified deal", date: "Jan 2025", investors: "Ensemble VC", tags: ["DevTools", "AI/ML"], source: "Firm portfolio" },
  icon: { name: "ICON", sector: "Robotics / construction", location: "Austin, TX", stage: "Seed", round: "Verified deal", date: "Oct 2024", investors: "Ensemble VC", tags: ["Robotics", "Industrial"], source: "Firm portfolio" },
};

function FirmMark({ firm, compact = false }) {
  return <span className={`firm-mark ${compact ? "compact" : ""} mark-${firm.id}`}>{firm.initials}</span>;
}

function MiniFaces({ count = 4 }) {
  return (
    <span className="mini-faces" aria-label={`${count} possible warm connections`}>
      {Array.from({ length: Math.min(count, 5) }).map((_, index) => <span key={index} className={`face face-${index + 1}`}><UsersThree weight="fill" /></span>)}
      {count > 5 && <span className="face-count">+{count - 5}</span>}
    </span>
  );
}

function GraphNode({ data }) {
  const Icon = data.icon;
  const isDeal = data.kind === "deal";
  const isFirm = data.kind === "firm";
  return (
    <button data-firm={data.initials || ""} className={`graph-node graph-node-${data.kind} ${data.active ? "is-active" : ""}`} onClick={data.onSelect} aria-label={`${data.title} graph node`}>
      <Handle type="target" position={Position.Top} className="hidden-handle" />
      <span className="graph-node-orb">{Icon ? <Icon weight="duotone" /> : <span>{data.initials}</span>}</span>
      <span className="graph-node-title">{data.title}</span>
      {data.meta && <span className="graph-node-meta">{data.meta}</span>}
      {isDeal && <span className="verified-dot"><Check weight="bold" /></span>}
      {isFirm && data.active && <span className="node-selected"><Check weight="bold" /></span>}
      <Handle type="source" position={Position.Bottom} className="hidden-handle" />
    </button>
  );
}

const nodeTypes = { graphNode: GraphNode };

function ToolbarNativeSelect({ label, value, options, onChange, icon: Icon }) {
  return (
    <label className="toolbar-select toolbar-native-select">
      <span className="toolbar-label">{label}</span>
      <span className="toolbar-value">{Icon && <Icon />} {value}</span>
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <CaretDown weight="bold" />
    </label>
  );
}

function ActionButton({ icon: Icon, children, onClick, primary = false, disabled = false }) {
  return <button className={`action-button ${primary ? "primary" : ""}`} onClick={onClick} disabled={disabled}>{Icon && <Icon />}<span>{children}</span></button>;
}

function EventCard({ event, onNotify }) {
  const isDeadline = Boolean(event.applicationDeadline);
  return (
    <article className={`event-card ${event.alreadyApplied ? "already-applied" : ""}`}>
      <header>
        <span className="event-date"><CalendarBlank /> {event.displayDate}</span>
        <span className={`event-confidence confidence-${event.confidence.toLowerCase()}`}><CheckCircle weight="fill" /> {event.confidence} confidence</span>
      </header>
      <div className="event-location"><MapPin weight="fill" /> {event.city}<span>· {event.venue}</span></div>
      <h3>{event.title}</h3>
      <p>{event.description}</p>
      <div className="event-tags">{event.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <div className="event-status-row">
        <span className="event-status"><span className="status-dot" />{event.status}</span>
        {isDeadline && <strong><Clock /> Deadline {event.applicationDeadline}</strong>}
      </div>
      <footer>
        <strong>{event.price}</strong>
        <a href={event.detailsUrl} target="_blank" rel="noreferrer">Details <ArrowSquareOut /></a>
        {event.alreadyApplied
          ? <button className="event-primary" onClick={() => onNotify(`${event.title} selection tracking added`)}><Bell /> Track result</button>
          : <a className="event-primary" href={event.registrationUrl} target="_blank" rel="noreferrer"><Ticket /> {event.action}</a>}
        <button className="event-calendar" aria-label={`Add ${event.title} to calendar`} onClick={() => onNotify(`${event.title} added to your Funding calendar`)}><CalendarBlank /></button>
      </footer>
    </article>
  );
}

export function App() {
  const [workspace, setWorkspace] = useState("investors");
  const [investorView, setInvestorView] = useState("table");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("Austin");
  const [activeSkill, setActiveSkill] = useState("AI/ML");
  const [focusFilter, setFocusFilter] = useState("All focus");
  const [stageFilter, setStageFilter] = useState("All stages");
  const [checkFilter, setCheckFilter] = useState("Any check size");
  const [evidenceWindow, setEvidenceWindow] = useState("Since 2018");
  const [eventPeriod, setEventPeriod] = useState("Upcoming");
  const [eventTopic, setEventTopic] = useState("All topics");
  const [eventDateRange, setEventDateRange] = useState("All dates");
  const [applicationView, setApplicationView] = useState("timeline");
  const [applicationStatus, setApplicationStatus] = useState("All statuses");
  const [selectedFirmId, setSelectedFirmId] = useState("ensemble");
  const [compareIds, setCompareIds] = useState(["ensemble", "capital", "atx"]);
  const [selectedDealId, setSelectedDealId] = useState("saronic");
  const [twoHops, setTwoHops] = useState(true);
  const [portfolioOnly, setPortfolioOnly] = useState(false);
  const [toast, setToast] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [user, setUser] = usePersistentState("funding-agent-user", null);
  const [applications, setApplications] = usePersistentState("funding-agent-applications", initialApplications);
  const [agentArtifacts, setAgentArtifacts] = usePersistentState("funding-agent-artifacts", []);
  const [agentMemories, setAgentMemories] = usePersistentState("funding-agent-memories", initialMemories);
  const [backendReady, setBackendReady] = useState(false);
  const [agentStatus, setAgentStatus] = useState({ available: false, authenticated: false, provider: "Hermes", model: null });

  useEffect(() => {
    const controller = new AbortController();
    Promise.allSettled([fundingApi.session(controller.signal), fundingApi.agentStatus(controller.signal)]).then(([sessionResult, statusResult]) => {
      if (controller.signal.aborted) return;
      if (statusResult.status === "fulfilled") setAgentStatus(statusResult.value);
      if (sessionResult.status === "fulfilled" && sessionResult.value.authenticated) {
        const remote = sessionResult.value;
        setUser(remote.user);
        setAgentMemories(remote.workspace.memories);
        setAgentArtifacts(remote.workspace.artifacts);
        setApplications(remote.workspace.applications);
      } else {
        setUser(null);
      }
      setBackendReady(true);
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!backendReady || !user) return undefined;
    const timer = window.setTimeout(() => {
      fundingApi.saveWorkspace({ memories: agentMemories, artifacts: agentArtifacts, applications }).catch(() => {
        notify("Workspace saved on this device; server sync will retry after reconnecting");
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [backendReady, user, agentMemories, agentArtifacts, applications]);

  const verifyEmailLogin = async (email, code) => {
    const result = await fundingApi.verifyLoginCode(email, code);
    setUser(result.user);
    if (result.isNewUser) {
      await fundingApi.saveWorkspace({ memories: agentMemories, artifacts: agentArtifacts, applications });
    } else {
      setAgentMemories(result.workspace.memories);
      setAgentArtifacts(result.workspace.artifacts);
      setApplications(result.workspace.applications);
    }
    setBackendReady(true);
    return result;
  };

  const logoutWorkspace = async () => {
    await fundingApi.logout();
    setUser(null);
    setAgentMemories(initialMemories);
    setAgentArtifacts([]);
    setApplications(initialApplications);
  };

  const runHermesAgent = async (input) => {
    const response = await fundingApi.runAgent(input);
    return response.result;
  };

  const notify = (message) => {
    setToast(message);
    window.clearTimeout(window.__fundingToast);
    window.__fundingToast = window.setTimeout(() => setToast(""), 2200);
  };

  const filteredFirms = useMemo(() => firms.filter((firm) => {
    const matchesQuery = `${firm.name} ${firm.location} ${firm.skills.join(" ")}`.toLowerCase().includes(query.toLowerCase());
    const matchesCity = city === "Austin" ? !firm.location.includes("San Francisco") : firm.location.includes("San Francisco");
    const matchesFocus = focusFilter === "All focus" || firm.skills.includes(focusFilter);
    const firmStages = firm.stage.split(/[,\n]/).map((stage) => stage.trim().toLowerCase());
    const matchesStage = stageFilter === "All stages" || firmStages.includes(stageFilter.toLowerCase());
    const matchesCheck = matchesCheckFilter(firm.check, checkFilter);
    return matchesQuery && matchesCity && matchesFocus && matchesStage && matchesCheck;
  }).sort((a, b) => {
    const bMatch = activeSkill === "All skills" || b.skills.includes(activeSkill) ? 1 : 0;
    const aMatch = activeSkill === "All skills" || a.skills.includes(activeSkill) ? 1 : 0;
    return bMatch - aMatch || b.fit - a.fit;
  }), [query, city, activeSkill, focusFilter, stageFilter, checkFilter]);

  const filteredEvents = useMemo(() => events.filter((event) => {
    const text = `${event.title} ${event.city} ${event.venue} ${event.description} ${event.tags.join(" ")}`.toLowerCase();
    const matchesQuery = text.includes(query.toLowerCase());
    const matchesRegion = city === "All" || event.region === city;
    const matchesTopic = eventTopic === "All topics" || event.tags.includes(eventTopic);
    const isUpcoming = event.startDate >= "2026-08-04";
    const matchesPeriod = eventPeriod === "Upcoming" ? isUpcoming : !isUpcoming;
    const matchesDate = eventDateRange === "All dates"
      || (eventDateRange === "Aug – Sep 2026" && event.startDate >= "2026-08-01" && event.startDate <= "2026-09-30")
      || (eventDateRange === "Oct – Dec 2026" && event.startDate >= "2026-10-01" && event.startDate <= "2026-12-31")
      || (eventDateRange === "2027" && event.startDate.startsWith("2027-"));
    return matchesQuery && matchesRegion && matchesTopic && matchesPeriod && matchesDate;
  }), [query, city, eventTopic, eventPeriod, eventDateRange]);

  useEffect(() => setPage(1), [query, city, activeSkill, focusFilter, stageFilter, checkFilter, pageSize]);

  const pageCount = Math.max(1, Math.ceil(filteredFirms.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pagedFirms = filteredFirms.slice(pageStart, pageStart + pageSize);
  const paginationItems = getPaginationItems(currentPage, pageCount);

  const selectedFirm = firms.find((firm) => firm.id === selectedFirmId) || firms[0];
  const selectedDeal = dealDetails[selectedDealId];
  const comparisonFirms = compareIds.map((id) => firms.find((firm) => firm.id === id)).filter(Boolean);

  const toggleCompare = (id) => {
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((firmId) => firmId !== id);
      if (current.length >= 3) {
        notify("Compare tray holds up to three firms");
        return current;
      }
      return [...current, id];
    });
  };

  const switchWorkspace = (nextWorkspace) => {
    setWorkspace(nextWorkspace);
    setQuery("");
    if (nextWorkspace === "events") setCity("All");
    if (nextWorkspace === "investors") setCity("Austin");
  };

  const saveFirmToTimeline = (firm) => {
    const application = createApplicationFromFirm(firm);
    if (applications.some((item) => item.id === application.id || item.firmId === firm.id)) {
      notify(`${firm.name} is already on your application timeline`);
      return;
    }
    setApplications((current) => [application, ...current]);
    notify(`${firm.name} added to your application timeline`);
  };

  const graphNodes = useMemo(() => {
    const firmNodes = [
      { id: "ensemble", title: "Ensemble VC", initials: "E", kind: "firm" },
      { id: "atx", title: "ATX Venture\nPartners", initials: "ATX", kind: "firm" },
      { id: "capital", title: "Capital\nFactory", initials: "CF", kind: "firm" },
    ].map((node) => ({
      id: node.id,
      type: "graphNode",
      position: graphPositions[node.id],
      data: { ...node, active: compareIds.includes(node.id), onSelect: () => setSelectedFirmId(node.id) },
      draggable: false,
      selectable: false,
    }));
    const skills = skillNodes.map((node) => ({
      id: node.id,
      type: "graphNode",
      position: graphPositions[node.id],
      data: { ...node, kind: "skill", active: activeSkill === node.title, onSelect: () => setActiveSkill(node.title) },
      draggable: false,
      selectable: false,
    }));
    const deals = dealNodes.map((node) => ({
      id: node.id,
      type: "graphNode",
      position: graphPositions[node.id],
      data: { ...node, kind: "deal", active: selectedDealId === node.id, onSelect: () => setSelectedDealId(node.id) },
      draggable: false,
      selectable: false,
    }));
    return [...firmNodes, ...skills, ...deals];
  }, [activeSkill, compareIds, selectedDealId]);

  const graphEdges = useMemo(() => {
    const solid = dealNodes.map((deal) => ({ id: `ensemble-${deal.id}`, source: "ensemble", target: deal.id, type: "straight", style: { stroke: "#6fe6e6", strokeWidth: 1.4 } }));
    const inferred = [
      ["skillInfra", "atx"], ["skillAi", "ensemble"], ["skillDefense", "ensemble"], ["skillB2b", "capital"], ["skillMedia", "saronic"], ["atx", "ensemble"], ["capital", "ensemble"],
    ].map(([source, target]) => ({ id: `${source}-${target}`, source, target, type: "straight", style: { stroke: "#74818a", strokeWidth: 1.2, strokeDasharray: "5 5" } }));
    return [...solid, ...inferred];
  }, []);

  const searchLabel = workspace === "events" ? "Search events" : workspace === "applications" ? "Search applications" : "Search investors";
  const searchPlaceholder = workspace === "events" ? "Search events, cities, venues, or topics…" : workspace === "applications" ? "Search applications, milestones, or statuses…" : "Search firms, investors, skills, or companies…";
  const workspaceSubtitle = workspace === "events" ? "Find the rooms where your next investor will be." : workspace === "applications" ? "Track every application, deadline, and follow-up without invented dates." : "Find investors who repeatedly fund what you’re building.";

  return (
    <main className={`funding-app ${workspace === "events" ? "events-mode" : workspace === "applications" ? "applications-mode" : ""}`}>
      <AgentDock firms={filteredFirms} user={user} artifacts={agentArtifacts} setArtifacts={setAgentArtifacts} memories={agentMemories} setMemories={setAgentMemories} agentStatus={agentStatus} backendReady={backendReady} onRequestLoginCode={fundingApi.requestLoginCode} onVerifyLoginCode={verifyEmailLogin} onLogout={logoutWorkspace} onRunAgent={runHermesAgent} onNotify={notify} onOpenApplications={() => switchWorkspace("applications")} />
      <header className="topbar">
        <div className="brand-lockup">
          <h1>Funding Agent</h1>
          <p>{workspaceSubtitle}</p>
        </div>
        <label className="global-search">
          <MagnifyingGlass />
          <input aria-label={searchLabel} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} />
          <kbd>/</kbd>
        </label>
        <div className="top-actions">
          <span className="verified"><CheckCircle weight="fill" /> Verified Aug 4</span>
          <button className="icon-button" aria-label="Refresh sources" onClick={() => notify("Sources refreshed · no deadline changes")}><TrendUp /></button>
          {workspace !== "applications" && <div className="city-toggle" role="group" aria-label="City">
            {(workspace === "events" ? ["All", "Texas", "Bay Area"] : ["Austin", "San Francisco"]).map((item) => <button key={item} className={city === item ? "active" : ""} onClick={() => setCity(item)}>{item}</button>)}
          </div>}
        </div>
      </header>

      <section className="filterbar" aria-label="Funding filters">
        <div className="workspace-tabs" role="group" aria-label="Workspace">
          <button className={workspace === "investors" ? "active" : ""} onClick={() => switchWorkspace("investors")}>Investors <span>{eddyVcData.meta.recordCount}</span></button>
          <button className={workspace === "events" ? "active" : ""} onClick={() => switchWorkspace("events")}>Events <span>{events.length}</span></button>
          <button className={workspace === "applications" ? "active" : ""} onClick={() => switchWorkspace("applications")}>Applications <span>{applications.length}</span></button>
        </div>
        {workspace === "investors" ? <>
          <ToolbarNativeSelect label="Your focus" value={focusFilter} options={focusOptions} onChange={setFocusFilter} icon={Sparkle} />
          <ToolbarNativeSelect label="Stage" value={stageFilter} options={stageOptions} onChange={setStageFilter} />
          <ToolbarNativeSelect label="Check size" value={checkFilter} options={checkOptions} onChange={setCheckFilter} />
          <ToolbarNativeSelect label="Evidence window" value={evidenceWindow} options={evidenceOptions} onChange={setEvidenceWindow} icon={CalendarBlank} />
          <button className="clear-button" onClick={() => { setQuery(""); setActiveSkill("AI/ML"); setFocusFilter("All focus"); setStageFilter("All stages"); setCheckFilter("Any check size"); setEvidenceWindow("Since 2018"); }}>Clear all</button>
          <span className="filter-spacer" />
          <ActionButton icon={Funnel} onClick={() => notify("Filters are ready to personalize")}>Filters</ActionButton>
          <ActionButton icon={BookmarkSimple} onClick={() => notify("Current view saved")}>Saved views <CaretDown /></ActionButton>
        </> : workspace === "events" ? <>
          <div className="event-period-toggle" role="group" aria-label="Event period">
            {["Upcoming", "Past"].map((period) => <button key={period} className={eventPeriod === period ? "active" : ""} onClick={() => setEventPeriod(period)}>{period}</button>)}
          </div>
          <ToolbarNativeSelect label="Topics" value={eventTopic} options={["All topics", "AI/ML", "VC", "Pitch", "Networking", "Defense", "Fundraising"]} onChange={setEventTopic} icon={Target} />
          <ToolbarNativeSelect label="Date" value={eventDateRange} options={eventDateOptions} onChange={setEventDateRange} icon={CalendarBlank} />
          <button className="clear-button" onClick={() => { setQuery(""); setEventTopic("All topics"); setEventDateRange("All dates"); setEventPeriod("Upcoming"); setCity("All"); }}>Clear all</button>
          <span className="filter-spacer" />
          <ActionButton icon={BookmarkSimple} onClick={() => notify("Event view saved")}>Saved events</ActionButton>
          <ActionButton icon={Plus} onClick={() => notify("Event submission form queued for the next build")}>Submit event</ActionButton>
        </> : <>
          <ToolbarNativeSelect label="Status" value={applicationStatus} options={applicationStatusOptions} onChange={setApplicationStatus} icon={CheckCircle} />
          <div className="event-period-toggle" role="group" aria-label="Application view">
            {["timeline", "calendar"].map((view) => <button key={view} className={applicationView === view ? "active" : ""} onClick={() => setApplicationView(view)}>{view === "timeline" ? "Timeline" : "Calendar"}</button>)}
          </div>
          <button className="clear-button" onClick={() => { setQuery(""); setApplicationStatus("All statuses"); }}>Clear all</button>
          <span className="filter-spacer" />
          <ActionButton icon={CalendarDots} onClick={() => notify("Google Calendar sync requires Google OAuth; one-click event links are available now")}>Google Calendar</ActionButton>
          <ActionButton icon={FileArrowDown} onClick={() => notify("Application timeline report prepared for export")}>Export timeline</ActionButton>
        </>}
      </section>

      {workspace === "events" ? (
        <section className="events-workspace">
          <header className="events-overview">
            <div>
              <span className="eyebrow"><CalendarBlank /> Upcoming opportunities</span>
              <h2>Founder & VC events worth entering the room for</h2>
              <p>Official-source events prioritized for Austin, Texas, San Francisco, and the Bay Area—not an unverified community calendar.</p>
            </div>
            <dl>
              <div><dt>Verified events</dt><dd>{events.length}</dd></div>
              <div><dt>Apply soon</dt><dd>{events.filter((event) => event.applicationDeadline).length}</dd></div>
              <div><dt>Free to enter</dt><dd>{events.filter((event) => event.price === "Free").length}</dd></div>
              <div><dt>Applied</dt><dd>{events.filter((event) => event.alreadyApplied).length}</dd></div>
            </dl>
          </header>
          <div className="events-feed-heading">
            <div><h2>{eventPeriod} events</h2><span>{filteredEvents.length} matching · verified Aug 4, 2026</span></div>
            <div className="events-legend"><span><i className="confidence-high" /> Official date + registration</span><span><i className="confidence-medium" /> Refresh needed</span></div>
          </div>
          {filteredEvents.length ? (
            <div className="events-grid">
              {filteredEvents.map((event) => <EventCard key={event.id} event={event} onNotify={notify} />)}
            </div>
          ) : (
            <div className="events-empty"><CalendarBlank /><h3>No {eventPeriod.toLowerCase()} events match this view</h3><p>Clear the topic, region, or search filters to widen the verified set.</p><button onClick={() => { setQuery(""); setEventTopic("All topics"); setEventDateRange("All dates"); setEventPeriod("Upcoming"); setCity("All"); }}>Show all upcoming events</button></div>
          )}
        </section>
      ) : workspace === "applications" ? (
        <ApplicationWorkspace applications={applications} setApplications={setApplications} view={applicationView} setView={setApplicationView} statusFilter={applicationStatus} query={query} onNotify={notify} />
      ) : <>
      <section className={`primary-workspace investor-${investorView}-mode`}>
        <section className={`firm-table-panel view-${investorView}`}>
          <div className="panel-title investor-panel-title"><h2>{investorView === "table" ? "Table" : investorView === "list" ? "List" : "Map"}</h2><span>{filteredFirms.length} firms · Eddy snapshot Aug 4</span><div className="investor-view-toggle" role="group" aria-label="Investor view"><button className={investorView === "map" ? "active" : ""} aria-label="Map view" onClick={() => setInvestorView("map")}><MapTrifold /></button><button className={investorView === "list" ? "active" : ""} aria-label="List view" onClick={() => setInvestorView("list")}><CardsThree /></button><button className={investorView === "table" ? "active" : ""} aria-label="Table view" onClick={() => setInvestorView("table")}><TableIcon /></button></div></div>
          {investorView === "table" ? <div className="table-wrap">
            <table>
              <thead>
                <tr><th aria-label="Compare"></th><th>#</th><th>Firm</th><th>Fit</th><th>Stage</th><th>Access</th><th>Deadline</th><th>Status</th></tr>
              </thead>
              <tbody>
                {pagedFirms.map((firm, index) => {
                  const compared = compareIds.includes(firm.id);
                  const selected = selectedFirmId === firm.id;
                  return (
                    <tr key={firm.id} className={`${selected ? "selected" : ""} ${compared ? "compared" : ""}`} onClick={() => setSelectedFirmId(firm.id)}>
                      <td><button className={`row-check ${compared ? "checked" : ""}`} onClick={(event) => { event.stopPropagation(); toggleCompare(firm.id); }} aria-label={`${compared ? "Remove" : "Add"} ${firm.name} ${compared ? "from" : "to"} compare`}>{compared && <Check weight="bold" />}</button></td>
                      <td className="row-index">{pageStart + index + 1}</td>
                      <td><div className="firm-cell"><FirmMark firm={firm} compact /><div><strong>{firm.name}</strong><span>{firm.location}</span></div></div></td>
                      <td><span className={`fit-pill fit-${firm.fit >= 80 ? "high" : firm.fit >= 65 ? "medium" : "low"}`}>{firm.fit}</span></td>
                      <td className="multiline">{firm.stage}</td>
                      <td><span className={`access access-${firm.access.toLowerCase()}`}>{firm.access}</span><MiniFaces count={firm.id === "ensemble" ? 7 : 4} /></td>
                      <td className={`deadline ${firm.deadline.includes("unconfirmed") || firm.deadline.includes("Sep 6") || firm.deadline === "Not tracked" ? "attention" : firm.deadline === "Rolling" ? "open" : ""}`}>{firm.deadline}</td>
                      <td><span className={`status-dot status-${firm.status.toLowerCase()}`} />{firm.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div> : investorView === "list" ? <div className="investor-list-view">{pagedFirms.map((firm) => <article key={firm.id} className={selectedFirmId === firm.id ? "selected" : ""} onClick={() => setSelectedFirmId(firm.id)}><header><FirmMark firm={firm} /><div><strong>{firm.name}</strong><span>{firm.location}</span></div><b className={`fit-pill fit-${firm.fit >= 80 ? "high" : firm.fit >= 65 ? "medium" : "low"}`}>{firm.fit}</b></header><p>{firm.description || `${firm.stage} investor focused on ${firm.skills.join(", ")}.`}</p><div className="investor-list-tags">{firm.skills.map((skill) => <span key={skill}>{skill}</span>)}</div><dl><div><dt>Stage</dt><dd>{firm.stage}</dd></div><div><dt>Check size</dt><dd>{firm.check}</dd></div><div><dt>Access</dt><dd>{firm.access}</dd></div></dl><footer><span className={`status-dot status-${firm.status.toLowerCase()}`} />{firm.status}<span>{firm.deadline}</span><button onClick={(event) => { event.stopPropagation(); saveFirmToTimeline(firm); }}><CalendarBlank /> Track</button>{firm.websiteUrl && <a href={firm.websiteUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>Website <ArrowSquareOut /></a>}</footer></article>)}</div> : <InvestorMap firms={filteredFirms} selectedFirmId={selectedFirmId} onSelect={setSelectedFirmId} city={city} />}
          <footer className="table-footer">
            <span>{investorView === "map" ? `${filteredFirms.filter((firm) => Number.isFinite(firm.lat) && Number.isFinite(firm.lng)).length} mapped of ${filteredFirms.length}` : `Showing ${filteredFirms.length ? pageStart + 1 : 0}–${Math.min(pageStart + pageSize, filteredFirms.length)} of ${filteredFirms.length}`}</span>
            {investorView !== "map" && <nav className="pagination" aria-label="Investor pages">
              <button aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>‹</button>
              {paginationItems.map((item) => typeof item === "number"
                ? <button key={item} className={item === currentPage ? "active" : ""} aria-label={`Page ${item} of ${pageCount}`} aria-current={item === currentPage ? "page" : undefined} onClick={() => setPage(item)}>{item}</button>
                : <span className="pagination-ellipsis" aria-hidden="true" key={item}>…</span>)}
              <button aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>›</button>
            </nav>}
            {investorView !== "map" && <label className="rows-button">
              <Rows />
              <select aria-label="Rows per page" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                {[12, 24, 48].map((size) => <option key={size} value={size}>{size} / page</option>)}
              </select>
              <CaretDown />
            </label>}
          </footer>
          <div className="fit-legend">
            <span>Fit score</span><b className="great">90–100</b><span>Exceptional</span><b className="strong">70–89</b><span>Strong</span><b className="moderate">50–69</b><span>Moderate</span><b className="weak">&lt;50</b><span>Weak</span>
          </div>
          <div className="fit-note">Fit explains how your focus matches a firm’s thesis and past deals. <button onClick={() => notify("Match model: thesis + stage + past-deal evidence")}>How it works</button></div>
        </section>

        <section className="deal-workbench">
          <div className="graph-area">
            <div className="panel-title graph-heading"><h2>Deal graph</h2><span>Exploring {compareIds.length} firms · {evidenceWindow}</span></div>
            <div className="skill-tabs">
              {["All skills", "AI/ML", "Infrastructure", "B2B SaaS", "Defense", "Media"].map((skill) => <button key={skill} className={activeSkill === skill ? "active" : ""} onClick={() => setActiveSkill(skill)}>{skill}</button>)}
              <button>More <CaretDown /></button>
            </div>
            <div className="graph-canvas">
              <ReactFlow
                nodes={graphNodes}
                edges={graphEdges}
                nodeTypes={nodeTypes}
                onNodeClick={(_, node) => {
                  if (dealDetails[node.id]) setSelectedDealId(node.id);
                  if (firms.some((firm) => firm.id === node.id)) setSelectedFirmId(node.id);
                }}
                fitView
                fitViewOptions={{ padding: 0.03 }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable
                zoomOnScroll={false}
                zoomOnPinch={false}
                panOnDrag={false}
                preventScrolling={false}
                minZoom={0.72}
                maxZoom={1.1}
              >
                <Background color="#12212b" gap={26} size={1} />
              </ReactFlow>
            </div>
            <article className="deal-detail">
              <div className="deal-image"><img src="/assets/saronic-vessel.png" alt={`Autonomous vessel representing the selected ${selectedDeal.name} deal`} /></div>
              <div className="deal-summary"><strong>{selectedDeal.name}</strong><span>{selectedDeal.sector}</span><span>{selectedDeal.location}</span>{selectedDeal.url && <a href={selectedDeal.url} target="_blank" rel="noreferrer">company site <ArrowSquareOut /></a>}</div>
              <div className="deal-fact"><span>{selectedDeal.stage}</span><b>{selectedDeal.round}</b><span>{selectedDeal.date}</span></div>
              <div className="deal-investors"><span>Investors</span><p>{selectedDeal.investors}</p></div>
              <div className="deal-tags"><span>Thesis tags</span><div>{selectedDeal.tags.map((tag) => <b key={tag}>{tag}</b>)}</div></div>
              <div className="deal-source"><span>Source</span><b>{selectedDeal.source}</b><em><CheckCircle weight="fill" /> Verified Aug 4</em></div>
              <button className="detail-close" aria-label="Close deal detail" onClick={() => notify("Deal detail stays in context")}><X /></button>
            </article>
          </div>

          <aside className="right-rail">
            <section><h3>Past deals</h3><div className="rail-key"><span>Verified portfolio</span><i className="solid-line" /></div><div className="rail-key"><span>Inferred similarity</span><i className="dashed-line" /></div></section>
            <section><h3>Graph controls</h3><label className="switch-row"><span>Expand 2 hops</span><button aria-label="Expand graph two hops" aria-pressed={twoHops} className={`switch ${twoHops ? "on" : ""}`} onClick={() => setTwoHops(!twoHops)}><i /></button></label><label className="switch-row"><span>Show portfolio only</span><button aria-label="Show portfolio deals only" aria-pressed={portfolioOnly} className={`square-toggle ${portfolioOnly ? "on" : ""}`} onClick={() => setPortfolioOnly(!portfolioOnly)}>{portfolioOnly && <Check />}</button></label></section>
            <section><div className="rail-heading"><h3>Selected firms</h3><span>{compareIds.length} / 3</span></div>{comparisonFirms.map((firm) => <button key={firm.id} className="selected-firm" onClick={() => setSelectedFirmId(firm.id)}><FirmMark firm={firm} compact /><span>{firm.name}</span><CheckCircle weight="fill" /></button>)}<button className="clear-all" onClick={() => setCompareIds([])}>Clear all</button></section>
            <section><h3>Actions</h3><button onClick={() => notify(`Warm-intro path saved for ${selectedFirm.name}`)}><Handshake /> Save warm-intro path</button><button onClick={() => { saveFirmToTimeline(selectedFirm); switchWorkspace("applications"); }}><FileArrowDown /> Open application <span>{applications.some((item) => item.firmId === selectedFirm.id) ? 1 : 0}</span></button><button onClick={() => saveFirmToTimeline(selectedFirm)}><CalendarBlank /> Add deadline to calendar</button><button onClick={() => notify("Share link copied")}><ShareNetwork /> Share graph view</button><button onClick={() => notify("Research brief prepared for export")}><FileArrowDown /> Export to PDF</button></section>
            <section className="freshness"><h3>Source freshness</h3><strong><CheckCircle weight="fill" /> Verified Aug 4</strong><span>Updated daily</span></section>
          </aside>
        </section>
      </section>

      <section className="compare-tray">
        <div className="compare-header"><h2>Compare {compareIds.length}</h2><span>Review side-by-side and plan your next steps.</span><button onClick={() => setCompareIds([])}>Clear all</button></div>
        <div className="compare-grid">
          {comparisonFirms.map((firm, index) => (
            <article className={`compare-card ${selectedFirmId === firm.id ? "active" : ""}`} key={firm.id} onClick={() => setSelectedFirmId(firm.id)}>
              <header><PushPin weight="fill" /><span className="compare-number">{index + 1}</span><FirmMark firm={firm} /><div><strong>{firm.name}</strong><span>{firm.location}</span></div><button aria-label={`Remove ${firm.name}`} onClick={(event) => { event.stopPropagation(); toggleCompare(firm.id); }}>Remove</button></header>
              <div className="compare-body">
                <dl><div><dt>Fit score</dt><dd className="fit-number">{firm.fit}</dd></div><div><dt>Stage</dt><dd>{firm.stage}</dd></div><div><dt>Check size</dt><dd>{firm.check}</dd></div></dl>
                <dl><div><dt>Top skills</dt><dd className="tag-row">{firm.skills.slice(0, 3).map((skill) => <span key={skill}>{skill}</span>)}</dd></div><div><dt>Past deals</dt><dd>{firm.deals ?? "Not imported"}</dd></div><div><dt>Active in Austin</dt><dd>{firm.activeAustin}</dd></div></dl>
                <div className="next-action"><span>Access</span><MiniFaces count={6} /><strong>Next action</strong><ActionButton icon={BookmarkSimple} onClick={() => notify(`Warm-intro path saved for ${firm.name}`)}>Save warm-intro path</ActionButton><ActionButton icon={FileArrowDown} onClick={() => notify(firm.status === "Open" ? `${firm.name} application opened` : `${firm.name} relationship task created`)}>Open application</ActionButton><small>{firm.deadline}</small></div>
              </div>
              <footer><button>View profile</button><button>Explore deals</button><button><NotePencil /> Add a note</button></footer>
            </article>
          ))}
          <button className="add-firm-card" onClick={() => notify(compareIds.length >= 3 ? "Remove one firm, then choose another from the table" : "Select a checkbox in the table to add a firm")}><Plus /><strong>Add firm</strong><span>Compare up to 3 firms</span></button>
        </div>
      </section>
      </>}

      {toast && <div className="toast" role="status"><CheckCircle weight="fill" /> {toast}</div>}
    </main>
  );
}
