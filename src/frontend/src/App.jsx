import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar.jsx'
import FleetStats from './components/FleetStats.jsx'
import AssetCard from './components/AssetCard.jsx'
import AssetDetailModal from './components/AssetDetailModal.jsx'
import PredictionsView from './components/PredictionsView.jsx'
import WorkOrdersView from './components/WorkOrdersView.jsx'
import CopilotChatDrawer from './components/CopilotChatDrawer.jsx'
import SimulatorView from './components/SimulatorView.jsx'
import MilStdModal from './components/MilStdModal.jsx'
import { Plane, Clock, Wrench, Sparkles, X, Activity, FileText, Target, Crosshair } from 'lucide-react'

export default function App() {
  const [summary, setSummary] = useState(null)
  const [assets, setAssets] = useState([])
  const [predictions, setPredictions] = useState([])
  const [workOrders, setWorkOrders] = useState([])
  const [missions, setMissions] = useState([])
  
  const [activeTab, setActiveTab] = useState('fleet') // fleet, predictions, maintenance, missions, simulator, milforms
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [assetDetail, setAssetDetail] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInitialQuery, setChatInitialQuery] = useState('')
  const [briefingModalOpen, setBriefingModalOpen] = useState(false)
  const [briefingContent, setBriefingContent] = useState('')
  
  const [statusFilter, setStatusFilter] = useState(null)
  const [typeFilter, setTypeFilter] = useState('ALL')
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
    setBriefingContent('INITIALIZING SECURE LINK: Querying fleet telemetry, calculating RUL excursions, and synthesizing Granite 3-8B commander briefing...')
    try {
      const res = await fetch('/api/v1/copilot/briefing')
      const data = await res.json()
      setBriefingContent(data.briefing)
    } catch (e) {
      setBriefingContent('ERROR: Failed to synthesize commander briefing from watsonx.ai service.')
    }
  }

  const filteredAssets = assets.filter(a => {
    if (statusFilter && a.status !== statusFilter) return false
    if (typeFilter !== 'ALL' && a.asset_type !== typeFilter) return false
    return true
  })

  return (
    <div className="min-h-screen tactical-bg text-slate-100 flex flex-col font-sans">
      <Navbar 
        onOpenChat={() => {
          setChatInitialQuery('')
          setChatOpen(true)
        }}
        onGenerateBriefing={handleGenerateBriefing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        {/* Top Fleet KPI Stats */}
        <FleetStats 
          summary={summary} 
          onFilterStatus={setStatusFilter}
          activeFilter={statusFilter}
        />

        {/* Navigation Tabs (Uiverse Segmented Bar) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800/90 pb-4 mb-6 gap-3">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveTab('fleet')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center space-x-2 shrink-0 ${
                activeTab === 'fleet'
                  ? 'uiverse-tab-active'
                  : 'uiverse-tab-inactive'
              }`}
            >
              <Plane className="w-4 h-4 text-emerald-400" />
              <span>Fleet Operations ({filteredAssets.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('predictions')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center space-x-2 shrink-0 ${
                activeTab === 'predictions'
                  ? 'uiverse-tab-active'
                  : 'uiverse-tab-inactive'
              }`}
            >
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Predictive RUL Timeline ({predictions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center space-x-2 shrink-0 ${
                activeTab === 'maintenance'
                  ? 'uiverse-tab-active'
                  : 'uiverse-tab-inactive'
              }`}
            >
              <Wrench className="w-4 h-4 text-emerald-400" />
              <span>Work Orders ({workOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('missions')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center space-x-2 shrink-0 ${
                activeTab === 'missions'
                  ? 'uiverse-tab-active'
                  : 'uiverse-tab-inactive'
              }`}
            >
              <Target className="w-4 h-4 text-blue-400" />
              <span>Missions ({missions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center space-x-2 shrink-0 ${
                activeTab === 'simulator'
                  ? 'uiverse-tab-active'
                  : 'uiverse-tab-inactive'
              }`}
            >
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Stress Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('milforms')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center space-x-2 shrink-0 ${
                activeTab === 'milforms'
                  ? 'uiverse-tab-active'
                  : 'uiverse-tab-inactive'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>AFTO-781A & Sorties</span>
            </button>
          </div>

          {/* Subsystem / Type Filter */}
          {activeTab === 'fleet' && (
            <div className="flex items-center space-x-1.5 self-start md:self-auto overflow-x-auto">
              {['ALL', 'FIGHTER_JET', 'ATTACK_HELICOPTER', 'MAIN_BATTLE_TANK', 'TRANSPORT_AIRCRAFT'].map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition uppercase ${
                    typeFilter === t
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
              {(statusFilter || typeFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setStatusFilter(null)
                    setTypeFilter('ALL')
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition"
                  title="Reset Filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab 1: Fleet Grid */}
        {activeTab === 'fleet' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAssets.map(asset => (
              <AssetCard 
                key={asset.id} 
                asset={asset} 
                onSelect={handleSelectAsset} 
              />
            ))}
          </div>
        )}

        {/* Tab 2: Predictive RUL Timeline */}
        {activeTab === 'predictions' && (
          <PredictionsView predictions={predictions} missionWindowHours={48.0} />
        )}

        {/* Tab 3: Maintenance Work Orders */}
        {activeTab === 'maintenance' && (
          <WorkOrdersView 
            workOrders={workOrders} 
            onApproveOrder={handleApproveWorkOrder} 
          />
        )}

        {/* Tab 4: Missions */}
        {activeTab === 'missions' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {missions.map(m => (
              <div key={m.id} className="uiverse-card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-blue-950/50 text-blue-300 border border-blue-800/40">
                      {m.mission_type}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">{m.priority}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5 tracking-tight">{m.title}</h3>
                  <p className="text-xs text-slate-400 mb-4 font-sans leading-relaxed">{m.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-300 space-y-1.5 font-mono text-[11px]">
                  <p>Commitment: <strong className="text-white">{m.required_assets_count}x {m.required_asset_type}</strong></p>
                  <p>Readiness Gate: <strong className="text-emerald-400">{m.minimum_readiness_threshold}% FMC</strong></p>
                  <p className="text-slate-400">Launch: {new Date(m.start_time).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: Mission Stress Simulator */}
        {activeTab === 'simulator' && (
          <SimulatorView assets={assets} />
        )}

        {/* Tab 6: AFTO Form 781A & ATO Sortie Matrix */}
        {activeTab === 'milforms' && (
          <div className="space-y-6">
            <div className="uiverse-card p-6">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  EXPEDITIONARY C2 FLIGHT LINE
                </span>
                <span className="text-[10px] font-mono text-slate-400">MIL-STD-1388 / T.O. 00-20-1 Compliance</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                AFTO Form 781A Discrepancies & ATO Sortie Re-allocation
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
                Automatically generate official Air Force Form 781A maintenance discrepancy documents with Red X / Red Diagonal
                symbols, JCN tracking numbers, military J-codes, and evaluate mission-adaptive sortie profiles to save degraded combat assets.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map(a => {
                const isNMC = a.status === 'NMC'
                const isPMC = a.status === 'PMC'
                return (
                  <div
                    key={a.id}
                    className={`uiverse-card p-5 flex flex-col justify-between transition ${
                      isNMC ? 'border-rose-800/60 shadow-[0_0_15px_rgba(244,63,94,0.15)]' :
                      isPMC ? 'border-amber-800/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]' :
                      ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-700">
                          {a.asset_code}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                          isNMC ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)]' :
                          isPMC ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}>
                          {a.status} ({a.readiness_score}%)
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white tracking-tight">{a.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-sans">{a.model} • <span className="font-mono">{a.squadron}</span></p>
                      <p className="text-[11px] text-slate-400 font-mono mt-2">
                        Location: {a.base_location}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">
                        {isNMC ? 'Grounding (Red X)' : isPMC ? 'Restricted (Red /)' : 'Fully Capable'}
                      </span>
                      <button
                        onClick={() => setViewMilStdAssetCode(a.asset_code)}
                        className="uiverse-btn-ghost !py-1.5 !px-2.5 !text-[11px]"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>Inspect Mil-Std</span>
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="uiverse-card max-w-2xl w-full p-6 relative shadow-2xl border border-slate-700/80">
            <button 
              onClick={() => setBriefingModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-purple-400 mb-3">
              <Sparkles className="w-4 h-4" />
              <span>IBM watsonx.ai Granite 3-8B Executive Briefing</span>
            </div>
            <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans bg-black/40 p-4 rounded-xl border border-purple-900/30">
              {briefingContent}
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800/80 flex justify-end">
              <button
                onClick={() => setBriefingModalOpen(false)}
                className="uiverse-btn-primary"
              >
                <span>Acknowledge Order of the Day</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
