import React, { useState, useEffect, useCallback } from 'react'
import { Shield, LayoutDashboard, Plane, Wrench, Activity, FileText, Target, Cpu, BarChart3, Layers, LogOut, Menu, Bot, Home } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

// Dashboard feature screens
import DashboardOverview from '../components/dashboard/DashboardOverview.jsx'
import FleetView from '../components/dashboard/FleetView.jsx'
import RULPrognosticsView from '../components/dashboard/RULPrognosticsView.jsx'
import MaintenanceOptimizerView from '../components/dashboard/MaintenanceOptimizerView.jsx'
import MissionsView from '../components/dashboard/MissionsView.jsx'
import StressSimulatorView from '../components/dashboard/StressSimulatorView.jsx'
import MilFormsView from '../components/dashboard/MilFormsView.jsx'
import ReadinessEngineView from '../components/dashboard/ReadinessEngineView.jsx'
import GraniteDiagnosticsView from '../components/dashboard/GraniteDiagnosticsView.jsx'
import CopilotChatDrawer from '../components/CopilotChatDrawer.jsx'

const NAV = [
  { id: 'overview',     label: 'Command Dashboard',     icon: LayoutDashboard },
  { id: 'fleet',        label: 'Fleet Operations',        icon: Plane },
  { id: 'readiness',    label: 'Readiness Engine',        icon: Target },
  { id: 'prognostics',  label: 'RUL Prognostics',         icon: BarChart3 },
  { id: 'maintenance',  label: 'Maintenance Optimizer',   icon: Wrench },
  { id: 'missions',     label: 'Mission Planning',        icon: Layers },
  { id: 'simulator',    label: 'Stress Simulator',        icon: Activity },
  { id: 'milforms',     label: 'AFTO 781A / ATO Matrix',  icon: FileText },
  { id: 'granite',      label: 'Granite Diagnostics',     icon: Cpu },
]

export default function DashboardPage({ onSignOut, onGoLanding }) {
  const { user, devMode, authHeader, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [copilotQuery, setCopilotQuery] = useState('')

  // Shared data loaded once at the dashboard level
  const [summary, setSummary] = useState(null)
  const [assets, setAssets] = useState([])
  const [predictions, setPredictions] = useState([])
  const [workOrders, setWorkOrders] = useState([])
  const [missions, setMissions] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [dataError, setDataError] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoadingData(true)
    setDataError(null)
    try {
      const [sumR, astR, predR, woR, misR] = await Promise.all([
        fetch('/api/v1/fleet/summary', { headers: authHeader }),
        fetch('/api/v1/fleet/assets',  { headers: authHeader }),
        fetch('/api/v1/predictions/',  { headers: authHeader }),
        fetch('/api/v1/maintenance/work-orders', { headers: authHeader }),
        fetch('/api/v1/fleet/missions', { headers: authHeader }),
      ])
      if (sumR.ok) setSummary(await sumR.json())
      if (astR.ok) setAssets(await astR.json())
      if (predR.ok) setPredictions(await predR.json())
      if (woR.ok)  setWorkOrders(await woR.json())
      if (misR.ok) setMissions(await misR.json())
    } catch (e) {
      setDataError('Backend unreachable. Start the FastAPI server at localhost:8000.')
    } finally {
      setLoadingData(false)
    }
  }, [authHeader])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openCopilot = (query = '') => {
    setCopilotQuery(query)
    setCopilotOpen(true)
  }

  const sharedProps = { summary, assets, predictions, workOrders, missions, loadingData, dataError, onRefresh: fetchAll, onOpenCopilot: openCopilot, authHeader }

  const renderView = () => {
    switch (activeTab) {
      case 'overview':    return <DashboardOverview {...sharedProps} onNavigate={setActiveTab} />
      case 'fleet':       return <FleetView {...sharedProps} />
      case 'readiness':   return <ReadinessEngineView {...sharedProps} />
      case 'prognostics': return <RULPrognosticsView {...sharedProps} />
      case 'maintenance': return <MaintenanceOptimizerView {...sharedProps} onRefresh={fetchAll} />
      case 'missions':    return <MissionsView {...sharedProps} />
      case 'simulator':   return <StressSimulatorView {...sharedProps} />
      case 'milforms':    return <MilFormsView {...sharedProps} />
      case 'granite':     return <GraniteDiagnosticsView {...sharedProps} />
      default:            return <DashboardOverview {...sharedProps} onNavigate={setActiveTab} />
    }
  }

  const currentNav = NAV.find(n => n.id === activeTab)

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', overflow: 'hidden' }}>

      {/* ── SIDEBAR ── */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className="dash-sidebar"
        style={{
          position: 'fixed', left: sidebarOpen ? 0 : undefined, zIndex: sidebarOpen ? 50 : 1,
          height: '100vh', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden'
        }}
      >
        {/* Sidebar header */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, minHeight: 60 }}>
          <Shield size={18} color="var(--gold)" />
          <div className="sidebar-label" style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', color: 'var(--text-primary)', textTransform: 'uppercase', margin: 0, whiteSpace: 'nowrap' }}>D1 COPILOT</p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>DEFENSE CBM+</p>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {NAV.map(item => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                className={`sidebar-item${isActive ? ' active' : ''}`}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
                title={item.label}
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
              >
                <Icon size={15} />
                <span className="sidebar-label">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Landing page link */}
        <div style={{ padding: '8px 16px' }}>
          <button
            onClick={onGoLanding}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '9px 14px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'color 0.2s, border-color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            title="Go to Landing Page"
          >
            <Home size={13} />
            <span className="sidebar-label">Landing Page</span>
          </button>
        </div>

        {/* Copilot button */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <button
            className="btn-gold-sm"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => { openCopilot(''); setSidebarOpen(false) }}
          >
            <Bot size={13} />
            <span className="sidebar-label">BOB COPILOT</span>
          </button>
        </div>

        {/* User info */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          {devMode && (
            <div className="dev-banner" style={{ marginBottom: 8, width: '100%', justifyContent: 'flex-start' }}>
              DEV MODE
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'var(--bg-glass)', border: '1px solid var(--gold)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'var(--gold)', flexShrink: 0 }}>
              {user?.full_name?.[0] || user?.username?.[0] || 'C'}
            </div>
            <div className="sidebar-label" style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.full_name || user?.username}
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>
                {user?.role} · {user?.clearance_level}
              </p>
            </div>
          </div>
          <button
            onClick={() => { logout(); onSignOut() }}
            style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: 0 }}
            className="sidebar-label"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginLeft: 'var(--sidebar-w, 220px)' }} className="dash-main">
        {/* Top bar */}
        <div className="dash-topbar" style={{ justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              className="mobile-menu-btn"
              aria-label="Open sidebar"
            >
              <Menu size={18} />
            </button>
            <div>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                D1 MISSION READINESS COPILOT
              </p>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                {currentNav?.label || 'Dashboard'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Status indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 7, backdropFilter: 'blur(8px)' }}>
              <div className="hex-live" />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>HUMS</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 7, backdropFilter: 'blur(8px)' }}>
              <div className="hex-live" style={{ background: 'var(--teal)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>MCP·11</span>
            </div>

            {devMode && <div className="dev-banner">DEV — COMMANDER</div>}

            <button
              onClick={onGoLanding}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 12px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'color 0.2s, border-color 0.2s', minHeight: 36 }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
              title="Go to Landing Page"
              aria-label="Go to Landing Page"
            >
              <Home size={13} />
              <span>Home</span>
            </button>

            <button
              className="btn-gold-sm"
              onClick={() => openCopilot('')}
            >
              <Bot size={13} />
              Bob Copilot
            </button>
          </div>
        </div>

        {/* System status bar */}
        <div className="system-bar" style={{ flexShrink: 0 }}>
          <span>GALCOGENS · TRACK: AI</span>
          <span style={{ color: '#2A2A2A' }}>|</span>
          <span>watsonx.ai Granite 3-8B {devMode ? '(OFFLINE SIMULATION)' : '(LIVE)'}</span>
          <span style={{ color: '#2A2A2A' }}>|</span>
          <span>XGBoost CUDA · RMSE 18.21 cycles</span>
          <span style={{ color: '#2A2A2A' }}>|</span>
          <span>NASA C-MAPSS Benchmark</span>
          {dataError && <>
            <span style={{ color: '#2A2A2A' }}>|</span>
            <span style={{ color: '#EF4444' }}>⚠ {dataError}</span>
          </>}
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {renderView()}
        </div>
      </div>

      {/* Copilot chat drawer */}
      <CopilotChatDrawer
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        initialQuery={copilotQuery}
        authHeader={authHeader}
      />

      {/* Mobile sidebar responsive styles */}
      <style>{`
        @media (max-width: 1024px) {
          .dash-main { margin-left: 64px !important; }
          .sidebar-label { display: none !important; }
          .dash-sidebar { position: static !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (max-width: 768px) {
          .dash-main { margin-left: 0 !important; }
          .dash-sidebar { display: none; }
          .dash-sidebar.open { display: flex !important; position: fixed !important; width: 220px; }
        }
      `}</style>
    </div>
  )
}
