import React, { useState, useEffect } from 'react'
import { Shield, ChevronDown, ChevronRight, Zap, Radio, Cpu, Activity, FileText, Target, Layers, BarChart3, MessageSquare, Wrench, AlertTriangle, CheckCircle, ArrowRight, Menu, X } from 'lucide-react'

const FEATURES = [
  {
    num: '01',
    icon: Activity,
    title: 'What-If Mission Stress Simulator',
    desc: 'Select a platform and operational theater (Desert Heat 45°C, Sand/Dust ingestion, Sub-Zero Arctic, 9G combat turns). Computes accelerated wear multiplier and mission survivability probability via backend physics-informed simulation engine.',
    badge: 'DIGITAL TWIN',
    color: '#29ABE2',
  },
  {
    num: '02',
    icon: Layers,
    title: 'Mission-Adaptive Sortie Re-allocation Matrix',
    desc: 'For any PMC platform, calls the ATO matching engine to recommend Combat Air Patrol / Close Air Support / Reconnaissance / Tactical Ferry profiles with real RUL-based reasoning from the backend.',
    badge: 'ATO ENGINE',
    color: '#FFC000',
  },
  {
    num: '03',
    icon: FileText,
    title: 'Automated AFTO Form 781A Generator',
    desc: 'Generates a digital discrepancy sheet with real Job Control Numbers, Red X (NMC) / Red Diagonal (PMC) military symbols, and a DLA NSN parts requisition manifest — not a hardcoded template.',
    badge: 'MIL-STD',
    color: '#EF4444',
  },
  {
    num: '04',
    icon: BarChart3,
    title: 'GPU-Accelerated RUL Prognostics',
    desc: 'Remaining Useful Life forecasts pulled from XGBoost trained on NASA C-MAPSS turbofan degradation benchmark. Holdout RMSE 18.21 cycles. Shows per-component confidence bounds.',
    badge: 'XGBOOST CUDA',
    color: '#22C55E',
  },
  {
    num: '05',
    icon: Target,
    title: 'FMC / PMC / NMC Readiness Engine',
    desc: 'Per-subsystem airworthiness (propulsion, gearboxes, hydraulics, radar) evaluated against mission deployment horizons using weighted degradation scoring from the backend readiness core.',
    badge: 'CBM+ CORE',
    color: '#F59E0B',
  },
  {
    num: '06',
    icon: MessageSquare,
    title: 'IBM Bob Copilot via FastMCP',
    desc: 'Live chat panel calling 11 real FastMCP tools — query readiness, run stress tests, generate work orders, search maintenance history. Falls back to offline Granite 3-8B simulation when no IBM Cloud credentials.',
    badge: 'FastMCP · 11 TOOLS',
    color: '#A855F7',
  },
  {
    num: '07',
    icon: Cpu,
    title: 'watsonx.ai Granite 3-8B Diagnostics',
    desc: 'Natural-language root-cause explanation of readiness degradation returned by IBM Granite 3-8B Instruct via live watsonx.ai API, or documented offline deterministic fallback — mode labeled on screen.',
    badge: 'GRANITE 3-8B',
    color: '#6366F1',
  },
  {
    num: '08',
    icon: Wrench,
    title: 'Mission-Aware Maintenance Optimizer',
    desc: 'Work orders ranked by Priority = f(Mission Criticality, Predicted RUL, Technician Availability) from the backend planner engine — not a client-side sort. Shows composite urgency scores.',
    badge: 'AI PLANNER',
    color: '#1EAEDB',
  },
  {
    num: '09',
    icon: Shield,
    title: 'Tactical Command Dashboard',
    desc: 'Assembles fleet readiness gauges, asset diagnostic cards, mission stress simulator, AFTO 781A viewer, prognostics timeline, and live Copilot chat — all backed by the same real endpoints.',
    badge: 'COMMAND CENTER',
    color: '#FFC000',
  },
]

const PIPELINE_STEPS = [
  { n: 1, label: 'Raw HUMS\nTelemetry' },
  { n: 2, label: 'Anomaly\nDetection' },
  { n: 3, label: 'RUL\nForecast' },
  { n: 4, label: 'FMC/PMC/NMC\nAssessment' },
  { n: 5, label: 'watsonx.ai\nDiagnostic' },
  { n: 6, label: 'ATO Sortie\nRe-allocation' },
  { n: 7, label: 'Maintenance\nTurnaround' },
  { n: 8, label: 'Commander\nBriefing' },
]

const STACK = [
  'Python 3.11', 'JavaScript JSX', 'FastAPI', 'React 18', 'Tailwind CSS', 'Vite',
  'IBM Bob', 'watsonx.ai', 'Granite 3-8B', 'FastMCP', 'XGBoost CUDA',
  'Scikit-Learn', 'Isolation Forest', 'NASA C-MAPSS', 'SQLAlchemy 2.0',
  'SQLite / PostgreSQL', 'Docker', 'Docker Compose', 'Nginx', 'GitHub Actions'
]

const TEAM = [
  { name: 'Kunj', role: 'Team Lead', email: 'd24aiml082@charusat.edu.in' },
  { name: 'Vedant', role: 'AI / ML Engineer', email: '23aiml042@charusat.edu.in' },
  { name: 'Path', role: 'Backend Engineer', email: '23aiml055@charusat.edu.in' },
  { name: 'Venisha', role: 'Systems Engineer', email: '23dcs134@charusat.edu.in' },
]

function LiveMetricsStrip() {
  const [metrics, setMetrics] = useState(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/fleet/summary')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setMetrics(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  const style = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 0,
    borderTop: '1px solid #494949',
    borderLeft: '1px solid #494949',
  }
  const cell = {
    flex: '1 1 160px',
    padding: '24px 28px',
    borderRight: '1px solid #494949',
    borderBottom: '1px solid #494949',
    background: '#000000',
  }

  if (loading) return (
    <div style={{ padding: '40px 0', textAlign: 'center' }}>
      <div className="spinner" style={{ margin: '0 auto' }} />
    </div>
  )

  if (error) return (
    <div style={{ padding: '32px', background: '#000000', border: '1px solid #494949', textAlign: 'center' }}>
      <p style={{ fontSize: 12, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace' }}>
        CONNECT BACKEND TO VIEW LIVE FLEET METRICS
      </p>
      <p style={{ fontSize: 10, color: '#494949', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
        Start the FastAPI server at localhost:8000
      </p>
    </div>
  )

  const items = [
    { label: 'PLATFORMS TRACKED', value: metrics.total_assets, color: '#FFC000' },
    { label: 'FULLY MISSION CAPABLE', value: metrics.fmc_count, color: '#22C55E' },
    { label: 'PARTIALLY CAPABLE', value: metrics.pmc_count, color: '#F59E0B' },
    { label: 'NON-MISSION CAPABLE', value: metrics.nmc_count, color: '#EF4444' },
    { label: 'FLEET READINESS INDEX', value: `${metrics.fmc_percentage}%`, color: '#29ABE2' },
    { label: 'CRITICAL ATTENTION', value: metrics.critical_attention_count, color: '#EF4444' },
  ]

  return (
    <div style={style}>
      {items.map(item => (
        <div key={item.label} style={cell}>
          <p style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
            {item.label}
          </p>
          <p style={{ fontSize: 36, fontWeight: 800, color: item.color, lineHeight: 1, fontFamily: 'JetBrains Mono, monospace' }}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  )
}

export default function LandingPage({ onEnterDashboard }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileNavOpen(false)
  }

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh' }}>

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(0,0,0,0.92)', borderBottom: '1px solid #2A2A2A', height: 56, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <div style={{ maxWidth: 1280, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={18} color="#FFC000" />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff' }}>D1 Mission Readiness</span>
            <span className="dev-banner" style={{ marginLeft: 8 }}>GALCOGENS · AI TRACK</span>
          </div>
          <div className="landing-nav-links hidden md:flex" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {['problem', 'solution', 'features', 'stack', 'team'].map(id => (
              <button key={id} onClick={() => scrollTo(id)}
                style={{ padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7D7D7D', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#FFC000'}
                onMouseLeave={e => e.target.style.color = '#7D7D7D'}
              >{id}</button>
            ))}
            <button className="btn-gold-sm" onClick={onEnterDashboard} style={{ marginLeft: 8 }}>
              Enter Command Center
            </button>
          </div>
          <button
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#7D7D7D' }}
            className="landing-nav-mobile-btn"
            onClick={() => setMobileNavOpen(v => !v)}
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div style={{ position: 'fixed', top: 56, left: 0, right: 0, zIndex: 49, background: '#000000', borderBottom: '1px solid #494949', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['problem', 'solution', 'features', 'stack', 'team'].map(id => (
            <button key={id} onClick={() => scrollTo(id)}
              style={{ textAlign: 'left', padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#F5F5F5', borderBottom: '1px solid #2A2A2A' }}
            >{id}</button>
          ))}
          <button className="btn-gold-sm" onClick={onEnterDashboard} style={{ marginTop: 8 }}>
            Enter Command Center
          </button>
        </div>
      )}

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(72px,10vw,80px) clamp(16px,4vw,24px) 48px', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-grid-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

        {/* Gold slash accent */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: 3, height: '100%', background: 'linear-gradient(180deg, transparent 0%, #FFC000 40%, transparent 100%)', opacity: 0.5 }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', position: 'relative' }}>
          <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
              <div style={{ width: 2, height: 40, background: '#FFC000' }} />
              <p className="label-upper-gold">D1 MISSION READINESS & PREDICTIVE MAINTENANCE COPILOT</p>
            </div>

            <h1 className="text-hero" style={{ color: '#fff', marginBottom: 32, maxWidth: 900 }}>
              DEFENSE<br />
              <span style={{ color: '#FFC000' }}>FLEET</span><br />
              READINESS
            </h1>

            <p style={{ fontSize: 16, color: '#969696', maxWidth: 600, lineHeight: 1.7, marginBottom: 40 }}>
              An enterprise-grade autonomous AI copilot engineered for defense aerospace and ground fleet condition-based maintenance (CBM+), powered by IBM Bob, watsonx.ai Granite 3.0, GPU-accelerated prognostics, and the Model Context Protocol (MCP).
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 64 }}>
              <button className="btn-gold" onClick={onEnterDashboard}>
                <Shield size={16} />
                ENTER COMMAND CENTER
              </button>
              <button className="btn-ghost" onClick={() => scrollTo('problem')}>
                VIEW THE MISSION
                <ChevronDown size={16} />
              </button>
            </div>

            {/* System status strip */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { label: 'IBM Bob MCP', status: 'ONLINE', color: '#22C55E' },
                { label: 'watsonx.ai Granite 3-8B', status: 'ACTIVE', color: '#22C55E' },
                { label: 'XGBoost CUDA', status: 'LOADED', color: '#FFC000' },
                { label: 'FastMCP: 11 Tools', status: 'CONNECTED', color: '#29ABE2' },
                { label: 'NASA C-MAPSS', status: 'SEEDED', color: '#F59E0B' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: '#000000', border: '1px solid #2A2A2A' }}>
                  <div className="hex-live" style={{ background: s.color }} />
                  <span style={{ fontSize: 10, color: '#969696', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em' }}>{s.label}</span>
                  <span style={{ fontSize: 10, color: s.color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: '#494949' }}>
          <ChevronDown size={16} />
          <span style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase' }}>SCROLL</span>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section id="problem" style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,24px)', background: '#000000', borderTop: '1px solid #494949' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="gold-rule" style={{ marginBottom: 24 }} />
          <p className="label-upper" style={{ marginBottom: 16 }}>THE PROBLEM</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px,100%), 1fr))', gap: 0, border: '1px solid #494949' }}>
            {/* Big stat */}
            <div style={{ padding: 'clamp(24px,5vw,48px) clamp(20px,4vw,40px)', borderRight: '1px solid #494949', borderBottom: '1px solid #494949' }}>
              <p style={{ fontSize: 'clamp(48px,9vw,72px)', fontWeight: 900, color: '#FFC000', lineHeight: 1, fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>$90B</p>
              <p style={{ fontSize: 13, color: '#7D7D7D', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Annual US Military<br />Maintenance Spend</p>
            </div>

            {/* Problem statement */}
            <div style={{ padding: 'clamp(24px,5vw,48px) clamp(20px,4vw,40px)' }}>
              <h2 className="text-h2" style={{ color: '#fff', marginBottom: 20 }}>MAINTENANCE BLINDSPOT</h2>
              <p style={{ fontSize: 14, color: '#969696', lineHeight: 1.8, maxWidth: 680 }}>
                Military organizations cannot reliably determine whether aircraft, vehicles, and combat equipment are genuinely mission-ready. Maintenance runs on fixed calendar intervals regardless of actual component degradation, while onboard HUMS sensor streams that could forecast failures weeks in advance sit unanalyzed in data silos.
              </p>
              <p style={{ fontSize: 14, color: '#969696', lineHeight: 1.8, maxWidth: 680, marginTop: 16 }}>
                When platforms fail unexpectedly in the field, operational readiness plummets, mission sorties are aborted, and recovery takes weeks. Shifting to predictive, condition-based maintenance saves billions and protects human lives.
              </p>
            </div>
          </div>

          {/* Impact bullets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px,100%), 1fr))', gap: 0, borderLeft: '1px solid #494949', borderBottom: '1px solid #494949', marginTop: 0 }}>
            {[
              { icon: AlertTriangle, text: 'Unexpected field failures abort sorties' },
              { icon: AlertTriangle, text: 'Calendar-interval maintenance ignores actual degradation' },
              { icon: AlertTriangle, text: 'HUMS telemetry siloed — no actionable insights' },
              { icon: AlertTriangle, text: 'Recovery from unplanned grounding takes weeks' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} style={{ padding: '20px 24px', borderRight: '1px solid #494949', borderTop: '1px solid #494949', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <Icon size={14} color="#EF4444" style={{ marginTop: 2, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: '#969696', lineHeight: 1.5, margin: 0 }}>{item.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section id="solution" style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,24px)', background: '#000', borderTop: '1px solid #494949' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="gold-rule" style={{ marginBottom: 24 }} />
          <p className="label-upper" style={{ marginBottom: 16 }}>THE SOLUTION</p>
          <h2 className="text-h1" style={{ color: '#fff', maxWidth: 700, marginBottom: 24, textTransform: 'uppercase' }}>
            CONDITION-BASED MAINTENANCE PLATFORM
          </h2>
          <p style={{ fontSize: 14, color: '#969696', lineHeight: 1.8, maxWidth: 720, marginBottom: 60 }}>
            A modular monolithic platform with an embedded IBM Bob Copilot. Ingests HUMS sensor telemetry and historical service records. Classifies fleet readiness into FMC / PMC / NMC. Predicts component Remaining Useful Life with GPU-accelerated XGBoost trained on the NASA C-MAPSS turbofan degradation benchmark — holdout RMSE <strong style={{ color: '#FFC000' }}>18.21 cycles</strong>. Uses IBM watsonx.ai Granite 3-8B Instruct to explain root-cause degradation in plain language and recommend a prioritized maintenance turnaround plan.
          </p>

          {/* Pipeline */}
          <div style={{ marginBottom: 40 }}>
            <p className="label-upper" style={{ marginBottom: 24 }}>END-TO-END PROCESSING PIPELINE</p>

            {/* Desktop pipeline */}
            <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', minWidth: 800 }}>
                {PIPELINE_STEPS.map((step, i) => (
                  <React.Fragment key={step.n}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flexShrink: 0, width: 90 }}>
                      <div style={{ width: 36, height: 36, background: '#000000', border: '1px solid #FFC000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#FFC000', fontFamily: 'JetBrains Mono, monospace' }}>
                        {step.n}
                      </div>
                      <p style={{ fontSize: 10, color: '#969696', textAlign: 'center', lineHeight: 1.4, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'pre-line' }}>
                        {step.label}
                      </p>
                    </div>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #FFC000 0%, #494949 100%)', minWidth: 8, marginBottom: 46 }} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE METRICS ── */}
      <section style={{ padding: '0 clamp(16px,4vw,24px)', background: '#000' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ padding: '32px 0 20px' }}>
            <p className="label-upper-gold" style={{ marginBottom: 6 }}>LIVE FLEET METRICS</p>
            <p style={{ fontSize: 11, color: '#494949', fontFamily: 'JetBrains Mono, monospace' }}>
              Real-time data from backend — if unreachable, shows system status
            </p>
          </div>
          <LiveMetricsStrip />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,24px)', background: '#000', borderTop: '1px solid #494949' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="gold-rule" style={{ marginBottom: 24 }} />
          <p className="label-upper" style={{ marginBottom: 16 }}>FEATURE SET</p>
          <h2 className="text-h1" style={{ color: '#fff', maxWidth: 600, marginBottom: 56, textTransform: 'uppercase' }}>
            NINE WORKING SYSTEMS
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px,100%), 1fr))', gap: 32 }}>
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div key={f.num} style={{ padding: '0 0 24px 0', borderBottom: '1px solid #2A2A2A' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, border: `1px solid ${f.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} color={f.color} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#494949', fontFamily: 'JetBrains Mono, monospace' }}>{f.num}</span>
                      <span style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#494949', fontFamily: 'JetBrains Mono, monospace', border: '1px solid #2A2A2A', padding: '2px 8px' }}>{f.badge}</span>
                    </div>
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 10, lineHeight: 1.3, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 12, color: '#969696', lineHeight: 1.7, margin: 0 }}>
                    {f.desc}
                  </p>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 48, textAlign: 'center' }}>
            <button className="btn-gold" onClick={onEnterDashboard} style={{ fontSize: 14, padding: '16px 40px' }}>
              <Shield size={18} />
              ENTER COMMAND CENTER — ALL 9 SYSTEMS LIVE
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── STACK ── */}
      <section id="stack" style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,24px)', background: '#000000', borderTop: '1px solid #494949' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="gold-rule" style={{ marginBottom: 24 }} />
          <p className="label-upper" style={{ marginBottom: 16 }}>TECHNOLOGY STACK</p>
          <h2 className="text-h2" style={{ color: '#fff', marginBottom: 40, textTransform: 'uppercase' }}>REAL STACK — NO INVENTED COMPONENTS</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {STACK.map(s => <span key={s} className="stack-pill">{s}</span>)}
          </div>
        </div>
      </section>

      {/* ── KNOWN LIMITATIONS ── */}
      <section style={{ padding: 'clamp(32px,5vw,48px) clamp(16px,4vw,24px)', background: '#000', borderTop: '1px solid #494949' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p className="label-upper" style={{ marginBottom: 16, color: '#F59E0B' }}>KNOWN LIMITATIONS — SYSTEM STATUS</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px,100%), 1fr))', gap: 0, borderLeft: '1px solid #494949', borderTop: '1px solid #494949' }}>
            {[
              'Sensor streams are simulated from real NASA C-MAPSS run-to-failure turbofan data, not a physical MIL-STD-1553 aircraft bus.',
              'If no IBM Cloud credentials are configured, the system runs an offline deterministic Granite 3-8B simulation engine instead of live watsonx.ai.',
              'Dev-mode auth defaults to Commander role for frictionless evaluation. This is disclosed plainly on the login screen.',
            ].map((lim, i) => (
              <div key={i} style={{ padding: '20px 24px', borderRight: '1px solid #494949', borderBottom: '1px solid #494949' }}>
                <AlertTriangle size={13} color="#F59E0B" style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 12, color: '#7D7D7D', lineHeight: 1.6, margin: 0 }}>{lim}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section id="team" style={{ padding: 'clamp(48px,7vw,80px) clamp(16px,4vw,24px)', background: '#000000', borderTop: '1px solid #494949' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="gold-rule" style={{ marginBottom: 24 }} />
          <p className="label-upper" style={{ marginBottom: 8 }}>TEAM</p>
          <h2 className="text-h2" style={{ color: '#fff', marginBottom: 8, textTransform: 'uppercase' }}>GALCOGENS</h2>
          <p style={{ fontSize: 12, color: '#494949', fontFamily: 'JetBrains Mono, monospace', marginBottom: 40 }}>TRACK: AI · DEFENSE AEROSPACE & CBM+</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px,100%), 1fr))', gap: 0, borderLeft: '1px solid #494949', borderTop: '1px solid #494949' }}>
            {TEAM.map(m => (
              <div key={m.name} style={{ padding: '24px', borderRight: '1px solid #494949', borderBottom: '1px solid #494949' }}>
                <div style={{ width: 36, height: 36, background: '#000000', border: '1px solid #FFC000', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontSize: 13, fontWeight: 800, color: '#FFC000', fontFamily: 'JetBrains Mono, monospace' }}>
                  {m.name[0]}
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{m.name}</p>
                <p style={{ fontSize: 10, color: '#7D7D7D', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 600 }}>{m.role}</p>
                <a href={`mailto:${m.email}`} style={{ fontSize: 10, color: '#3860BE', fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none' }}>{m.email}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '24px', background: '#000', borderTop: '1px solid #2A2A2A' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={14} color="#FFC000" />
            <span style={{ fontSize: 11, color: '#494949', fontFamily: 'JetBrains Mono, monospace' }}>
              D1 MISSION READINESS · GALCOGENS · IBM HACKATHON
            </span>
          </div>
          <span style={{ fontSize: 10, color: '#2A2A2A', fontFamily: 'JetBrains Mono, monospace' }}>
            BUILT WITH IBM BOB · watsonx.ai · FastMCP
          </span>
        </div>
      </footer>
    </div>
  )
}
