import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, Bell, Bookmark, CalendarDays, Check, ChevronDown, Clock3, Compass, Filter, LayoutGrid, Map, Search, Sparkles, Users, X } from 'lucide-react';
import './styles.css';

const funds = [
  { name: 'Techstars Austin', type: 'Accelerator', city: 'Austin, TX', date: 'Aug 18', days: 14, amount: '$120K', stage: 'Pre-seed', color: '#e65c3a', initials: 'TS' },
  { name: 'PearX S26', type: 'Accelerator', city: 'San Francisco, CA', date: 'Aug 24', days: 20, amount: '$250K', stage: 'Pre-seed', color: '#14251d', initials: 'PX' },
  { name: 'Soma Capital', type: 'Rolling fund', city: 'San Francisco, CA', date: 'Rolling', days: 32, amount: '$100K–$1M', stage: 'Seed', color: '#7257e8', initials: 'S' },
  { name: 'Capital Factory', type: 'Venture fund', city: 'Austin, TX', date: 'Sep 12', days: 39, amount: '$50K–$250K', stage: 'Seed', color: '#12675a', initials: 'CF' },
  { name: 'South Park Commons', type: 'Founder fellowship', city: 'San Francisco, CA', date: 'Sep 30', days: 57, amount: '$400K', stage: 'Pre-idea', color: '#d89c28', initials: 'SP' },
];

const allFunds = [
  ...funds,
  { name: '500 Global', type: 'Accelerator', city: 'San Francisco, CA', date: 'Oct 15', days: 72, amount: '$150K', stage: 'Seed', color: '#f14c35', initials: '500' },
  { name: 'Sputnik ATX', type: 'Accelerator', city: 'Austin, TX', date: 'Rolling', days: 90, amount: '$100K', stage: 'Pre-seed', color: '#284a9b', initials: 'SA' },
];

function FundLogo({ fund, small = false }) {
  return <div className={`fund-logo ${small ? 'small' : ''}`} style={{ background: fund.color }}>{fund.initials}</div>;
}

function App() {
  const [tab, setTab] = useState('Discover');
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState(['PearX S26']);
  const [city, setCity] = useState('All hubs');
  const [detail, setDetail] = useState(null);
  const [notice, setNotice] = useState(false);

  const filtered = useMemo(() => allFunds.filter(f =>
    (!query || `${f.name} ${f.type} ${f.city} ${f.stage}`.toLowerCase().includes(query.toLowerCase())) &&
    (city === 'All hubs' || f.city.startsWith(city)) &&
    (tab !== 'Saved' || saved.includes(f.name))
  ), [query, city, tab, saved]);

  const toggleSave = (name) => setSaved(s => s.includes(name) ? s.filter(x => x !== name) : [...s, name]);

  return <div className="app-shell">
    <header>
      <a className="brand" href="#top"><span className="brand-mark">F</span><span>FundCal</span></a>
      <nav>
        {['Discover', 'Calendar', 'Saved'].map(item => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}
      </nav>
      <div className="header-actions">
        <button className="icon-button"><Bell size={19}/><span className="notification-dot" /></button>
        <button className="avatar">AR</button>
      </div>
    </header>

    <main id="top">
      <section className="hero">
        <div>
          <div className="eyebrow"><Sparkles size={14}/> CURATED FOR FOUNDERS</div>
          <h1>Never miss your<br/><em>next big break.</em></h1>
          <p>Discover accelerators, VC funds, and fellowships—<br/>with every deadline in one calm place.</p>
        </div>
        <div className="hero-art" aria-label="Abstract calendar illustration">
          <div className="sun"/><div className="orbit orbit-one"/><div className="orbit orbit-two"/>
          <div className="mini-card card-one"><span>AUG</span><strong>18</strong><small>Austin</small></div>
          <div className="mini-card card-two"><Check/><span>Application<br/>ready</span></div>
          <div className="spark">✦</div>
        </div>
      </section>

      <section className="search-strip">
        <div className="searchbox"><Search size={20}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search funds, programs, or locations..."/></div>
        <div className="select-wrap"><Map size={18}/><select value={city} onChange={e => setCity(e.target.value)}><option>All hubs</option><option>Austin</option><option>San Francisco</option></select><ChevronDown size={16}/></div>
        <button className="filter-button"><Filter size={18}/> Filters <span>2</span></button>
      </section>

      {tab === 'Calendar' ? <CalendarView onSelect={setDetail}/> : <>
        <section className="section-block">
          <div className="section-heading"><div><span className="kicker">UP NEXT</span><h2>Deadlines worth watching</h2></div><button>View calendar <ArrowUpRight size={16}/></button></div>
          <div className="deadline-grid">
            {funds.slice(0,3).map((fund, i) => <article className="deadline-card" key={fund.name} onClick={() => setDetail(fund)}>
              <div className="card-top"><FundLogo fund={fund}/><button className={saved.includes(fund.name) ? 'saved' : ''} onClick={e => {e.stopPropagation(); toggleSave(fund.name)}}><Bookmark size={18} fill={saved.includes(fund.name) ? 'currentColor' : 'none'}/></button></div>
              <span className="fund-type">{fund.type}</span><h3>{fund.name}</h3><p>{fund.city}</p>
              <div className="card-rule"/>
              <div className="deadline-info"><div><Clock3 size={16}/><span>{fund.date}</span></div><small>{fund.days} days left</small></div>
            </article>)}
          </div>
        </section>

        <section className="explore-section">
          <div className="section-heading"><div><span className="kicker">{tab === 'Saved' ? 'YOUR SHORTLIST' : 'EXPLORE'}</span><h2>{tab === 'Saved' ? 'Saved opportunities' : 'Find your right fit'}</h2></div><div className="view-switch"><button className="active"><LayoutGrid size={17}/></button><button><Map size={17}/></button></div></div>
          <div className="fund-list">
            {filtered.length ? filtered.map(fund => <article key={fund.name} className="fund-row" onClick={() => setDetail(fund)}>
              <FundLogo fund={fund} small/><div className="fund-main"><h3>{fund.name}</h3><p>{fund.type} · {fund.city}</p></div>
              <span className="stage-pill">{fund.stage}</span><div className="check-size"><small>CHECK SIZE</small><strong>{fund.amount}</strong></div><div className="list-date"><small>DEADLINE</small><strong>{fund.date}</strong></div>
              <button className={saved.includes(fund.name) ? 'save-row saved' : 'save-row'} onClick={e => {e.stopPropagation(); toggleSave(fund.name)}}><Bookmark size={18} fill={saved.includes(fund.name) ? 'currentColor' : 'none'}/></button>
            </article>) : <div className="empty"><Compass size={30}/><h3>No opportunities found</h3><p>Try widening your filters.</p></div>}
          </div>
        </section>
      </>}

      <section className="cta">
        <div><span className="kicker">YOUR FUNDRAISING CO-PILOT</span><h2>Good opportunities move fast.<br/><em>We'll keep you ahead.</em></h2></div>
        <button onClick={() => setNotice(true)}>Set up weekly digest <ArrowUpRight size={17}/></button>
      </section>
    </main>
    <footer><a className="brand" href="#top"><span className="brand-mark">F</span><span>FundCal</span></a><p>Built for founders who are building what matters.</p><span>© 2026 FundCal</span></footer>

    {detail && <div className="modal-backdrop" onClick={() => setDetail(null)}><div className="modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setDetail(null)}><X/></button><FundLogo fund={detail}/><span className="fund-type">{detail.type}</span><h2>{detail.name}</h2><p>{detail.city}</p><div className="modal-stats"><div><small>CHECK SIZE</small><strong>{detail.amount}</strong></div><div><small>DEADLINE</small><strong>{detail.date}</strong></div><div><small>STAGE</small><strong>{detail.stage}</strong></div></div><p className="modal-copy">A founder-focused opportunity selected for your location and company stage. Review the program details and prepare your application before the deadline.</p><button className="primary" onClick={() => setNotice(true)}>Start application <ArrowUpRight size={17}/></button></div></div>}
    {notice && <div className="toast"><Check size={17}/> You're on the list! We'll keep you ahead.<button onClick={() => setNotice(false)}><X size={15}/></button></div>}
  </div>;
}

function CalendarView({ onSelect }) {
  const days = Array.from({length: 35}, (_, i) => i - 2);
  return <section className="section-block calendar-section"><div className="section-heading"><div><span className="kicker">AUGUST 2026</span><h2>Your funding calendar</h2></div><button>Today</button></div><div className="calendar"><div className="weekdays">{['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d => <span key={d}>{d}</span>)}</div><div className="days">{days.map((d,i) => <div className={d < 1 || d > 31 ? 'muted day' : 'day'} key={i}><span>{d < 1 ? 31 + d : d > 31 ? d - 31 : d}</span>{d === 18 && <button className="event orange" onClick={() => onSelect(funds[0])}>Techstars Austin</button>}{d === 24 && <button className="event green" onClick={() => onSelect(funds[1])}>PearX S26</button>}</div>)}</div></div></section>;
}

createRoot(document.getElementById('root')).render(<App/>);
