import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar.jsx'
import OverviewView from './components/OverviewView.jsx'
import FleetTableView from './components/FleetTableView.jsx'
import AssetDetailModal from './components/AssetDetailModal.jsx'
import PredictionsView from './components/PredictionsView.jsx'
import WorkOrdersView from './components/WorkOrdersView.jsx'
import CopilotChatDrawer from './components/CopilotChatDrawer.jsx'
import SimulatorView from './components/SimulatorView.jsx'
import MilStdModal from './components/MilStdModal.jsx'
import { LayoutDashboard, Plane, Clock, Wrench, Activity, FileText, Target, Sparkles, X, Shield } from 'lucide-react'

export default function App() {
  const [summary, setSummary] = useState(null)
  const [assets, setAssets] = useState([])
  const [predictions, setPredictions] = useState([])
  const [workOrders, setWorkOrders] = useState([])
  const [missions, setMissions] = useState([])
  
  const searchParams = new URLSearchParams(window.location.search)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview') // overview, fleet, predictions, maintenance, missions, simulator, milforms
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [assetDetail, setAssetDetail] = useState(null)
  const [chatOpen, setChatOpen] = useState(searchParams.get('chat') === '1')
  const [chatInitialQuery, setChatInitialQuery] = useState(searchParams.get('query') || '')
  const [briefingModalOpen, setBriefingModalOpen] = useState(false)
  const [briefingContent, setBriefingContent] = useState('')
  
  const [viewMilStdAssetCode, setViewMilStdAssetCode] = useState(null)

  // Load initial data
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [sumRes, astRes, predRes, woRes, misRes] = await Promise.all([
        fetch('/api/v1/fleet/summary'),
        fetch('/api/v1/fleet/assets'),
        fetch('/api/v1/predictions/'),
        fetch('/api/v1/maintenance/work-orders'),
        fetch('/api/v1/fleet/missions')
      ])

      if (sumRes.ok) setSummary(await sumRes.json())
      if (astRes.ok) setAssets(await astRes.json())
      if (predRes.ok) setPredictions(await predRes.json())
      if (woRes.ok) setWorkOrders(await woRes.json())
      if (misRes.ok) setMissions(await misRes.json())
    } catch (e) {
      console.error('Failed fetching data:', e)
    }
  }

  const handleSelectAsset = async (asset) => {
    setSelectedAsset(asset)
    try {
      const res = await fetch(`/api/v1/fleet/assets/${asset.asset_code}`)
      if (res.ok) {
        setAssetDetail(await res.json())
      } else {
        setAssetDetail(asset)
      }
    } catch {
      setAssetDetail(asset)
    }
  }

  const handleApproveWorkOrder = async (orderId) => {
    try {
      const res = await fetch(`/api/v1/maintenance/work-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' })
      })
      if (res.ok) {
        setWorkOrders(prev => prev.map(w => w.id === orderId ? { ...w, status: 'APPROVED' } : w))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleGenerateBriefing = async () => {
    setBriefingModalOpen(true)
    setBriefingContent('Synthesizing watsonx.ai Granite 3-8B commander briefing from HUMS telemetry and C-MAPSS RUL excursions...')
    try {
      const res = await fetch('/api/v1/copilot/briefing')
      const data = await res.json()
      setBriefingContent(data.briefing)
    } catch (e) {
      setBriefingContent('ERROR: Failed to synthesize commander briefing from watsonx.ai service.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar 
        onOpenChat={() => {
          setChatInitialQuery('')
          setChatOpen(true)
        }}
        onGenerateBriefing={handleGenerateBriefing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2 overflow-x-auto">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={activeTab === 'overview' ? 'nav-tab-active' : 'nav-tab-inactive'}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('fleet')}
              className={activeTab === 'fleet' ? 'nav-tab-active' : 'nav-tab-inactive'}
            >
              <Plane className="w-3.5 h-3.5" />
              <span>Fleet Operations ({assets.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('predictions')}
              className={activeTab === 'predictions' ? 'nav-tab-active' : 'nav-tab-inactive'}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Predictive RUL ({predictions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('maintenance')}
              className={activeTab === 'maintenance' ? 'nav-tab-active' : 'nav-tab-inactive'}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Work Orders ({workOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('missions')}
              className={activeTab === 'missions' ? 'nav-tab-active' : 'nav-tab-inactive'}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Missions ({missions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={activeTab === 'simulator' ? 'nav-tab-active' : 'nav-tab-inactive'}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Stress Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('milforms')}
              className={activeTab === 'milforms' ? 'nav-tab-active' : 'nav-tab-inactive'}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>AFTO-781A & Sorties</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-400 font-mono">
            <span>DEFENSE CBM+ COMMAND SYSTEM</span>
          </div>
        </div>

        {/* View 1: Overview (Home Dashboard) */}
        {activeTab === 'overview' && (
          <OverviewView
            summary={summary}
            assets={assets}
            predictions={predictions}
            workOrders={workOrders}
            missions={missions}
            onSelectAsset={handleSelectAsset}
            onApproveOrder={handleApproveWorkOrder}
            onOpenMilStd={(code) => setViewMilStdAssetCode(code)}
            onAskCopilot={(query) => {
              setChatInitialQuery(query)
              setChatOpen(true)
            }}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* View 2: Fleet Operations Data Table */}
        {activeTab === 'fleet' && (
          <FleetTableView 
            assets={assets} 
            onSelectAsset={handleSelectAsset} 
          />
        )}

        {/* View 3: Predictive RUL Forecasts */}
        {activeTab === 'predictions' && (
          <PredictionsView predictions={predictions} missionWindowHours={48.0} />
        )}

        {/* View 4: Maintenance Work Orders */}
        {activeTab === 'maintenance' && (
          <WorkOrdersView 
            workOrders={workOrders} 
            onApproveOrder={handleApproveWorkOrder} 
          />
        )}

        {/* View 5: Missions */}
        {activeTab === 'missions' && (
          <div className="space-y-6">
            <div className="panel-card p-6">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-[10px] font-mono font-medium tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
                  AIR TASKING ORDERS
                </span>
                <span className="text-[11px] text-slate-400">Tactical Deployment Schedule</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Active Sortie Deployments</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
                Review operational air tasking orders, asset commitments, and minimum fleet readiness thresholds required for launch authorization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {missions.map(m => (
                <div key={m.id} className="panel-card p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40">
                        {m.mission_type}
                      </span>
                      <span className="text-xs font-mono font-semibold text-emerald-400">{m.priority}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1 tracking-tight">{m.title}</h3>
                    <p className="text-xs text-slate-400 mb-4 font-sans leading-relaxed">{m.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 text-xs text-slate-300 space-y-1.5 font-mono text-[11px]">
                    <p>Commitment: <strong className="text-white">{m.required_assets_count}x {m.required_asset_type}</strong></p>
                    <p>Readiness Gate: <strong className="text-emerald-400">{m.minimum_readiness_threshold}% FMC</strong></p>
                    <p className="text-slate-400">Launch: {new Date(m.start_time).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View 6: Mission Stress Simulator */}
        {activeTab === 'simulator' && (
          <SimulatorView assets={assets} />
        )}

        {/* View 7: AFTO Form 781A & ATO Sortie Matrix */}
        {activeTab === 'milforms' && (
          <div className="space-y-6">
            <div className="panel-card p-6">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-[10px] font-mono font-medium tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
                  EXPEDITIONARY FLIGHT LINE
                </span>
                <span className="text-[11px] text-slate-400">MIL-STD-1388 / T.O. 00-20-1 Compliance</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                AFTO Form 781A Discrepancies & ATO Sortie Re-allocation
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
                Review Air Force Form 781A maintenance discrepancy sheets with Red X / Red Diagonal symbols, JCN tracking numbers, military J-codes, and sortie re-allocation matrices.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map(a => {
                const isNMC = a.status === 'NMC'
                const isPMC = a.status === 'PMC'
                return (
                  <div
                    key={a.id}
                    className={`panel-card p-5 flex flex-col justify-between transition ${
                      isNMC ? 'border-rose-900/60' :
                      isPMC ? 'border-amber-900/60' :
                      ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs font-semibold text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {a.asset_code}
                        </span>
                        <span className={
                          isNMC ? 'status-badge-nmc text-[11px]' :
                          isPMC ? 'status-badge-pmc text-[11px]' :
                          'status-badge-fmc text-[11px]'
                        }>
                          {a.status} ({a.readiness_score}%)
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-white tracking-tight">{a.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-sans">{a.model} • <span className="font-mono">{a.squadron}</span></p>
                      <p className="text-[11px] text-slate-400 font-mono mt-2">
                        Location: {a.base_location}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-400">
                        {isNMC ? 'Grounding (Red X)' : isPMC ? 'Restricted (Red /)' : 'Fully Capable'}
                      </span>
                      <button
                        onClick={() => setViewMilStdAssetCode(a.asset_code)}
                        className="btn-secondary text-xs !py-1 !px-2.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>Inspect Form</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Military Standard AFTO Form 781A & ATO Sortie Modal */}
      {viewMilStdAssetCode && (
        <MilStdModal
          assetCode={viewMilStdAssetCode}
          onClose={() => setViewMilStdAssetCode(null)}
        />
      )}

      {/* Asset Detail Diagnostics Modal */}
      {selectedAsset && (
        <AssetDetailModal
          asset={assetDetail || selectedAsset}
          onClose={() => {
            setSelectedAsset(null)
            setAssetDetail(null)
          }}
          onAskCopilot={(query) => {
            setChatInitialQuery(query)
            setChatOpen(true)
          }}
        />
      )}

      {/* Embedded Bob Copilot Chat Drawer */}
      <CopilotChatDrawer
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        initialQuery={chatInitialQuery}
      />

      {/* Commander Morning Briefing Modal */}
      {briefingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 relative shadow-2xl">
            <button 
              onClick={() => setBriefingModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2 text-xs font-semibold text-purple-400 mb-3">
              <Sparkles className="w-4 h-4" />
              <span>IBM watsonx.ai Granite 3-8B Operational Briefing</span>
            </div>
            <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans bg-slate-950/60 p-4 rounded-lg border border-purple-900/30 max-h-[60vh] overflow-y-auto">
              {briefingContent}
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setBriefingModalOpen(false)}
                className="btn-primary text-xs"
              >
                <span>Acknowledge Briefing</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
