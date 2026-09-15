import React, { useState } from 'react'
import { X, Sparkles, ShieldCheck, Clock, Wrench, FileText, Cpu, AlertTriangle, AlertOctagon } from 'lucide-react'
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="uiverse-card max-w-3xl w-full p-6 relative text-slate-200 animate-in fade-in zoom-in-95 duration-150 border border-slate-700/80 shadow-2xl">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-5 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center space-x-3 mb-1.5">
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded border border-emerald-500/40">
                {asset.asset_code}
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">{asset.name}</h2>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              {asset.model} • <span className="text-slate-300 font-mono">{asset.squadron}</span> • Base: <span className="text-slate-300">{asset.base_location}</span>
            </p>
          </div>

          <div className="text-right">
            <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
              isFMC ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40' :
              isPMC ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40' :
              'bg-rose-500/15 text-rose-400 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse'
            }`}>
              {isFMC ? <ShieldCheck className="w-3.5 h-3.5" /> : isPMC ? <AlertTriangle className="w-3.5 h-3.5" /> : <AlertOctagon className="w-3.5 h-3.5" />}
              <span>{asset.status} ({asset.readiness_score}%)</span>
            </span>
          </div>
        </div>

        {/* Subsystems & Components Table */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              TRACKED SUBSYSTEMS & HEALTH STATUS
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              C-MAPSS Telemetry Stream
            </span>
          </div>

          <div className="space-y-2">
            {asset.components?.map(comp => {
              const isCrit = comp.risk_level === 'CRITICAL'
              const isHigh = comp.risk_level === 'HIGH'
              const isMed = comp.risk_level === 'MEDIUM'

              return (
                <div 
                  key={comp.id} 
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                    isCrit ? 'bg-rose-950/25 border-rose-800/60 text-rose-200' :
                    isHigh ? 'bg-amber-950/25 border-amber-800/60 text-amber-200' :
                    'bg-slate-900/60 border-slate-800/80 text-slate-300'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-white tracking-tight">{comp.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {comp.part_number} • S/N: {comp.serial_number}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-mono uppercase">PREDICTED RUL</p>
                      <p className={`font-mono font-bold ${
                        isCrit ? 'text-rose-400' : isHigh ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {comp.current_rul} hrs
                      </p>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      isCrit ? 'bg-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                      isHigh ? 'bg-amber-500 text-black' :
                      isMed ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
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
            <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold font-mono">
              <Cpu className="w-4 h-4" />
              <span>watsonx.ai Granite Diagnostic Intelligence</span>
            </div>
            {!explanation && (
              <button
                onClick={handleExplain}
                disabled={loadingExpl}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-mono font-bold text-white transition disabled:opacity-50 shadow-[0_0_12px_rgba(147,51,234,0.4)]"
              >
                {loadingExpl ? 'Analyzing Telemetry...' : 'Explain Issue with watsonx'}
              </button>
            )}
          </div>

          {explanation ? (
            <div className="text-xs text-slate-200 space-y-2 leading-relaxed bg-black/40 p-3 rounded-lg border border-purple-900/40 whitespace-pre-wrap font-sans">
              {explanation}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Click "Explain Issue with watsonx" to generate military root-cause diagnostics and repair directives powered by IBM Granite 3-8B.
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setShowMilModal(true)}
            className="uiverse-btn-ghost"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>AFTO Form 781A & ATO Matrix</span>
          </button>

          <button
            onClick={() => {
              onClose()
              onAskCopilot(`Investigate full failure mode and turnaround requirements for ${asset.asset_code}`)
            }}
            className="uiverse-btn-primary"
          >
            <Wrench className="w-4 h-4" />
            <span>Turnaround Work Order</span>
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
