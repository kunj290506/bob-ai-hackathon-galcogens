import React, { useState } from 'react'
import { X, Sparkles, AlertTriangle, ShieldCheck, Clock, Wrench, FileText } from 'lucide-react'
import MilStdModal from './MilStdModal.jsx'

export default function AssetDetailModal({ asset, onClose, onAskCopilot }) {
  const [explanation, setExplanation] = useState(null)
  const [loadingExpl, setLoadingExpl] = useState(false)
  const [showMilModal, setShowMilModal] = useState(false)

  if (!asset) return null

  const handleExplain = async () => {
    setLoadingExpl(true)
    try {
      const res = await fetch(`/api/v1/copilot/explain/${asset.asset_code}`)
      const data = await res.json()
      setExplanation(data.explanation)
    } catch (e) {
      setExplanation('Failed to connect to watsonx.ai service.')
    } finally {
      setLoadingExpl(false)
    }
  }

  const isFMC = asset.status === 'FMC'
  const isPMC = asset.status === 'PMC'
  const isNMC = asset.status === 'NMC'

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0f1422] border border-slate-700/80 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                {asset.asset_code}
              </span>
              <h2 className="text-xl font-bold text-white">{asset.name}</h2>
            </div>
            <p className="text-xs text-slate-400">
              {asset.model} • {asset.squadron} • Located at: {asset.base_location}
            </p>
          </div>

          <div className="text-right">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
              isFMC ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
              isPMC ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
              'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
            }`}>
              {asset.status} ({asset.readiness_score}%)
            </span>
          </div>
        </div>

        {/* Subsystems & Components Table */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>Tracked Subsystems & Condition Status</span>
            <span className="text-[10px] text-slate-400 font-mono">C-MAPSS Telemetry Stream</span>
          </h3>

          <div className="space-y-2">
            {asset.components?.map(comp => {
              const isCrit = comp.risk_level === 'CRITICAL'
              const isHigh = comp.risk_level === 'HIGH'
              const isMed = comp.risk_level === 'MEDIUM'

              return (
                <div 
                  key={comp.id} 
                  className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                    isCrit ? 'bg-rose-950/20 border-rose-800/60 text-rose-200' :
                    isHigh ? 'bg-amber-950/20 border-amber-800/60 text-amber-200' :
                    'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-white">{comp.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {comp.part_number} • S/N: {comp.serial_number}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">Predicted RUL</p>
                      <p className={`font-mono font-bold ${
                        isCrit ? 'text-rose-400' : isHigh ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {comp.current_rul} hrs
                      </p>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isCrit ? 'bg-rose-500 text-white' :
                      isHigh ? 'bg-amber-500 text-black' :
                      isMed ? 'bg-amber-500/20 text-amber-300' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {comp.risk_level}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* watsonx.ai Explanation Block */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              <span>watsonx.ai Granite Diagnostic Intelligence</span>
            </div>
            {!explanation && (
              <button
                onClick={handleExplain}
                disabled={loadingExpl}
                className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition disabled:opacity-50"
              >
                {loadingExpl ? 'Analyzing Telemetry...' : 'Explain Issue with watsonx'}
              </button>
            )}
          </div>

          {explanation ? (
            <div className="text-xs text-slate-300 space-y-2 leading-relaxed bg-black/30 p-3 rounded-lg border border-purple-900/30 whitespace-pre-wrap font-sans">
              {explanation}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Click "Explain Issue with watsonx" to generate military natural-language root-cause diagnostics and repair recommendations powered by IBM Granite 3-8B.
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={() => setShowMilModal(true)}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition flex items-center space-x-1.5"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>AFTO Form 781A & ATO Matrix</span>
          </button>

          <button
            onClick={() => {
              onClose()
              onAskCopilot(`Investigate full failure mode and turnaround requirements for ${asset.asset_code}`)
            }}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition flex items-center space-x-1.5"
          >
            <Wrench className="w-4 h-4" />
            <span>Generate Work Order in Bob Copilot</span>
          </button>
        </div>
      </div>

      {showMilModal && (
        <MilStdModal
          assetCode={asset.asset_code}
          onClose={() => setShowMilModal(false)}
        />
      )}
    </div>
  )
}
