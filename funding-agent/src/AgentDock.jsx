import { useState } from "react";
import {
  Brain,
  CalendarBlank,
  CaretDown,
  CaretUp,
  ChartBar,
  CheckCircle,
  FileText,
  FloppyDisk,
  Lightning,
  ListChecks,
  MagnifyingGlass,
  PaperPlaneTilt,
  PlugsConnected,
  Sparkle,
  TerminalWindow,
  Trash,
  UserCircle,
  X,
} from "@phosphor-icons/react";
import { buildAgentResult } from "./agent-utils";
import { usePersistentState } from "./use-persistent-state";

const skillPrompts = [
  { id: "fit", label: "VC fit analyst", icon: ChartBar, prompt: "Analyze the strongest seed investors for an AI infrastructure company" },
  { id: "deadline", label: "Deadline scout", icon: MagnifyingGlass, prompt: "Search the workspace for open or confirmed application deadlines" },
  { id: "plan", label: "Application planner", icon: ListChecks, prompt: "Build a prioritized application plan for the next 30 days", mode: "Plan" },
  { id: "deck", label: "Deck critic", icon: Sparkle, prompt: "Create a deck review checklist tailored to my highest-fit investors", mode: "Plan" },
];

const initialHistory = [{
  id: "welcome",
  role: "assistant",
  body: "Hermes workspace ready. I can analyze the 127-firm dataset, search verified opportunities, and save a report or action plan.",
  sourceLabel: "Local Funding Agent memory",
}];

function Modal({ title, eyebrow, onClose, children }) {
  return (
    <div className="agent-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="agent-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header><div><span>{eyebrow}</span><h2>{title}</h2></div><button aria-label={`Close ${title}`} onClick={onClose}><X /></button></header>
        {children}
      </section>
    </div>
  );
}

export function AgentDock({ firms, user, setUser, artifacts, setArtifacts, memories, setMemories, onNotify, onOpenApplications }) {
  const [open, setOpen] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("Analyze");
  const [running, setRunning] = useState(false);
  const [history, setHistory] = usePersistentState("funding-agent-history", initialHistory);
  const [provider, setProvider] = usePersistentState("funding-agent-provider", { id: "hermes", name: "Hermes", detail: "local workspace ready", connected: true });
  const [modal, setModal] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [memoryDraft, setMemoryDraft] = useState("");

  const runAgent = (event) => {
    event?.preventDefault();
    const task = prompt.trim();
    if (!task || running) return;
    const userMessage = { id: `user-${Date.now()}`, role: "user", body: task };
    setHistory((current) => [...current, userMessage]);
    setPrompt("");
    setRunning(true);

    window.setTimeout(() => {
      const result = buildAgentResult(firms, task, mode);
      const assistantMessage = { ...result, id: `result-${Date.now()}`, role: "assistant", task, createdAt: new Date().toISOString() };
      setHistory((current) => [...current, assistantMessage]);
      setRunning(false);
    }, 520);
  };

  const saveArtifact = (message) => {
    if (artifacts.some((artifact) => artifact.id === message.id)) {
      onNotify("Already saved to your agent workspace");
      return;
    }
    setArtifacts((current) => [{ ...message, savedAt: new Date().toISOString() }, ...current]);
    onNotify(`${message.type === "plan" ? "Plan" : "Report"} saved to persistent workspace`);
  };

  const chooseSkill = (skill) => {
    setPrompt(skill.prompt);
    setMode(skill.mode || "Analyze");
  };

  const signIn = (event) => {
    event.preventDefault();
    if (!email.includes("@")) return;
    setUser({ email: email.trim(), signedInAt: new Date().toISOString() });
    setModal("");
    onNotify("Email workspace created on this device");
  };

  const addMemory = (event) => {
    event.preventDefault();
    const content = memoryDraft.trim();
    if (!content) return;
    setMemories((current) => [{ id: `memory-${Date.now()}`, content, createdAt: new Date().toISOString() }, ...current]);
    setMemoryDraft("");
  };

  const visibleHistory = history.slice(-4);
  const latestResult = [...history].reverse().find((message) => message.role === "assistant" && message.type);

  return (
    <section className={`agent-dock ${open ? "is-open" : "is-collapsed"}`} aria-label="Funding agent terminal">
      <header className="agent-dock-header">
        <div className="agent-identity"><TerminalWindow weight="duotone" /><strong>Funding Terminal</strong><span>persistent workspace</span></div>
        <button className={`provider-chip ${provider.connected ? "connected" : "needs-setup"}`} onClick={() => setModal("provider")}><PlugsConnected /><span><strong>{provider.name}</strong>{provider.detail}</span><CaretDown /></button>
        <div className="agent-header-actions">
          <button onClick={() => setModal("memory")}><Brain /><span>Memory</span><b>{memories.length}</b></button>
          <button onClick={() => setModal("artifacts")}><FileText /><span>Reports & plans</span><b>{artifacts.length}</b></button>
          <button onClick={() => { setHistory(initialHistory); onNotify("New terminal session started; persistent memory kept"); }}><Trash /><span>New session</span></button>
          <button onClick={() => setModal("account")}><UserCircle /><span>{user ? user.email.split("@")[0] : "Email sign in"}</span></button>
          <button className="dock-collapse" aria-label={open ? "Collapse funding terminal" : "Expand funding terminal"} onClick={() => setOpen(!open)}>{open ? <CaretUp /> : <CaretDown />}</button>
        </div>
      </header>

      {open && <div className="agent-dock-body">
        <aside className="agent-skills">
          <span className="agent-section-label">Claude-compatible skills</span>
          <div>{skillPrompts.map((skill) => { const Icon = skill.icon; return <button key={skill.id} onClick={() => chooseSkill(skill)}><Icon /><span>{skill.label}</span></button>; })}</div>
          <small>Skills prepare repeatable workflows; Hermes memory keeps facts across sessions.</small>
        </aside>

        <section className="agent-terminal-window">
          <div className="terminal-transcript" aria-live="polite">
            {visibleHistory.map((message) => <article key={message.id} className={`terminal-message ${message.role}`}>
              <span>{message.role === "assistant" ? provider.name.toLowerCase() : "you"}</span>
              <div><strong>{message.title}</strong><p>{message.body}</p>{message.bullets && <ul>{message.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
                {message.type && <button onClick={() => saveArtifact(message)}><FloppyDisk /> Save {message.type}</button>}
              </div>
            </article>)}
            {running && <article className="terminal-message assistant is-running"><span>{provider.name.toLowerCase()}</span><div><p><i /> Reading firms, deadlines, and saved context…</p></div></article>}
          </div>
          <form className="terminal-composer" onSubmit={runAgent}>
            <div className="agent-mode-toggle" role="group" aria-label="Agent task type">{["Analyze", "Search", "Plan"].map((item) => <button type="button" key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>{item}</button>)}</div>
            <label><span>&gt;</span><input aria-label="Ask Funding Agent" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask to analyze investors, search deadlines, or create an application plan…" /></label>
            <button className="agent-run" aria-label="Run agent task" disabled={!prompt.trim() || running}><PaperPlaneTilt weight="fill" /></button>
          </form>
        </section>

        <aside className="agent-task-rail">
          <div className="agent-section-heading"><span className="agent-section-label">Agent output</span><CheckCircle weight="fill" /></div>
          {latestResult ? <article><strong>{latestResult.title}</strong><p>{latestResult.body}</p><button onClick={() => saveArtifact(latestResult)}><FloppyDisk /> Save {latestResult.type}</button></article> : <div className="agent-empty-output"><Lightning /><span>Run a task to create a report or plan.</span></div>}
          <button className="application-shortcut" onClick={onOpenApplications}><CalendarBlank /> Open application timeline</button>
        </aside>
      </div>}

      {modal === "account" && <Modal title={user ? "Your workspace" : "Create your workspace"} eyebrow="Email authentication" onClose={() => setModal("")}>
        {user ? <div className="account-state"><CheckCircle weight="fill" /><div><strong>{user.email}</strong><span>Reports, plans, applications, and memory persist on this device.</span></div><button onClick={() => { setUser(null); setModal(""); }}>Sign out</button></div> : <form className="account-form" onSubmit={signIn}><p>Start with email. Google sign-in and cross-device sync belong in the hosted backend.</p><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="founder@company.com" autoFocus /></label><button className="modal-primary" disabled={!email.includes("@")}>Continue with email</button><button type="button" className="modal-secondary" disabled>Continue with Google · next</button></form>}
      </Modal>}

      {modal === "provider" && <Modal title="Agent connection" eyebrow="Model & skills" onClose={() => setModal("")}>
        <div className="provider-options">
          <button className={provider.id === "hermes" ? "selected" : ""} onClick={() => { setProvider({ id: "hermes", name: "Hermes", detail: "local workspace ready", connected: true }); setModal(""); }}><span className="provider-icon hermes">H</span><span><strong>Hermes agent</strong><small>Current local workspace · persistent memory and terminal tools</small></span><CheckCircle weight="fill" /></button>
          <button className={provider.id === "claude" ? "selected" : ""} onClick={() => { setProvider({ id: "claude", name: "Claude", detail: "subscription bridge planned", connected: false }); setModal(""); onNotify("Claude selected · secure OAuth bridge still required"); }}><span className="provider-icon claude">C</span><span><strong>Claude subscription</strong><small>Claude Pro / Max through a Claude Code OAuth bridge</small></span><PlugsConnected /></button>
        </div>
        <p className="integration-note">Provider credentials are never collected in this interface. Production connection requires a secure local or server-side agent bridge.</p>
      </Modal>}

      {modal === "memory" && <Modal title="Persistent memory" eyebrow="Local Hermes-compatible context" onClose={() => setModal("")}>
        <form className="memory-form" onSubmit={addMemory}><input value={memoryDraft} onChange={(event) => setMemoryDraft(event.target.value)} placeholder="Remember a founder preference, company fact, or workflow…" /><button className="modal-primary" disabled={!memoryDraft.trim()}>Remember</button></form>
        <div className="memory-list">{memories.map((memory) => <article key={memory.id}><Brain /><p>{memory.content}</p><button aria-label="Delete memory" onClick={() => setMemories((current) => current.filter((item) => item.id !== memory.id))}><Trash /></button></article>)}</div>
      </Modal>}

      {modal === "artifacts" && <Modal title="Reports & plans" eyebrow="Saved agent work" onClose={() => setModal("")}>
        <div className="artifact-list">{artifacts.length ? artifacts.map((artifact) => <article key={artifact.id}><span>{artifact.type}</span><div><strong>{artifact.title}</strong><p>{artifact.body}</p><small>{artifact.sourceLabel}</small></div><button aria-label="Delete saved artifact" onClick={() => setArtifacts((current) => current.filter((item) => item.id !== artifact.id))}><Trash /></button></article>) : <div className="modal-empty"><FileText /><p>No saved output yet. Run an agent task and save its report or plan.</p></div>}</div>
      </Modal>}
    </section>
  );
}
