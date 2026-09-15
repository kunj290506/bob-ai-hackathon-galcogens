import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar.jsx'
import FleetStats from './components/FleetStats.jsx'
import AssetCard from './components/AssetCard.jsx'
import AssetDetailModal from './components/AssetDetailModal.jsx'
import PredictionsView from './components/PredictionsView.jsx'
import WorkOrdersView from './components/WorkOrdersView.jsx'
import CopilotChatDrawer from './components/CopilotChatDrawer.jsx'
import { Plane, AlertTriangle, Clock, Wrench, Sparkles, Filter, X } from 'lucide-react'

export default function App() {
  const [summary, setSummary] = useState(null)
  const [assets, setAssets] = useState([])
  const [predictions, setPredictions] = useState([])
  const [workOrders, setWorkOrders] = useState([])
  const [missions, setMissions] = useState([])
  
  const [activeTab, setActiveTab] = useState('fleet') // fleet, predictions, maintenance, missions
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [assetDetail, setAssetDetail] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInitialQuery, setChatInitialQuery] = useState('')
  const [briefingModalOpen, setBriefingModalOpen] = useState(false)
  const [briefingContent, setBriefingContent] = useState('')
  
  const [statusFilter, setStatusFilter] = useState(null)
  const [typeFilter, setTypeFilter] = useState('ALL')

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
    setBriefingContent('Generating executive readiness briefing with watsonx.ai...')
    try {
      const res = await fetch('/api/v1/copilot/briefing')
      const data = await res.json()
      setBriefingContent(data.briefing)
    } catch (e) {
      setBriefingContent('Failed to generate briefing.')
    }
  }

  const filteredAssets = assets.filter(a => {
    if (statusFilter && a.status !== statusFilter) return false
    if (typeFilter !== 'ALL' && a.asset_type !== typeFilter) return false
    return true
  })

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans">
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

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('fleet')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
                activeTab === 'fleet'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plane className="w-4 h-4 text-emerald-400" />
              <span>Fleet Operations Grid ({filteredAssets.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('predictions')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
                activeTab === 'predictions'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Predictive RUL Timeline ({predictions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
                activeTab === 'maintenance'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wrench className="w-4 h-4 text-emerald-400" />
              <span>Work Orders ({workOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('missions')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
                activeTab === 'missions'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Upcoming Missions ({missions.length})</span>
            </button>
          </div>

          {/* Subsystem / Type Filter */}
          {activeTab === 'fleet' && (
            <div className="flex items-center space-x-2">
              {['ALL', 'FIGHTER_JET', 'ATTACK_HELICOPTER', 'MAIN_BATTLE_TANK', 'TRANSPORT_AIRCRAFT'].map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition ${
                    typeFilter === t
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
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
                  className="p-1 rounded text-slate-400 hover:text-rose-400 text-xs"
                  title="Clear filters"
                >
                  <X className="w-4 h-4" />
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
              <div key={m.id} className="bg-[#0f1422] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-800/40">
                      {m.mission_type}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">{m.priority}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{m.title}</h3>
                  <p className="text-xs text-slate-400 mb-4">{m.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-300 space-y-1">
                  <p>Required Assets: <strong className="text-white">{m.required_assets_count}x {m.required_asset_type}</strong></p>
                  <p>Threshold: <strong className="text-emerald-400">{m.minimum_readiness_threshold}% FMC</strong></p>
                  <p className="text-[11px] text-slate-400 font-mono">Launch: {new Date(m.start_time).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f1422] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setBriefingModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {briefingContent}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setBriefingModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition"
              >
                Acknowledge Briefing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
