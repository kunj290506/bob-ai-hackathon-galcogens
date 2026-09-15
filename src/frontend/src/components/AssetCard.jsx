import React from 'react'
import { ChevronRight, ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react'

export default function AssetCard({ asset, onSelect }) {
  const isFMC = asset.status === 'FMC'
  const isPMC = asset.status === 'PMC'
  const isNMC = asset.status === 'NMC'

  const statusBadge = isFMC ? (
    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
      <ShieldCheck className="w-3 h-3 text-emerald-400" />
      <span>FMC</span>
    </span>
  ) : isPMC ? (
    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
      <AlertTriangle className="w-3 h-3 text-amber-400" />
      <span>PMC</span>
    </span>
  ) : (
    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)]">
      <AlertOctagon className="w-3 h-3 text-rose-500" />
      <span>NMC</span>
    </span>
  )

  return (
    <div 
      onClick={() => onSelect(asset)}
      className="uiverse-card p-4 cursor-pointer group flex flex-col justify-between transition-all duration-200"
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="text-[11px] font-mono font-bold text-slate-400 group-hover:text-emerald-400 transition-colors">
              {asset.asset_code}
            </span>
            <h4 className="text-sm font-bold text-white tracking-tight leading-snug">{asset.name}</h4>
          </div>
          {statusBadge}
        </div>

        {/* Model & Squadron */}
        <p className="text-[11px] text-slate-400 mb-3 font-sans">
          {asset.model} • <span className="text-slate-300 font-mono">{asset.squadron}</span>
        </p>

        {/* Readiness Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-400 font-mono text-[10px] uppercase">READINESS</span>
            <span className={`font-mono font-bold ${
              isFMC ? 'text-emerald-400' : isPMC ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {asset.readiness_score}%
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden p-0.5 border border-slate-800">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isFMC ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]' :
                isPMC ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]' :
                'bg-gradient-to-r from-rose-600 to-red-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]'
              }`}
              style={{ width: `${asset.readiness_score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="font-mono text-[10px] text-slate-400">{asset.total_flight_hours} FLT HRS</span>
        <span className="flex items-center text-slate-300 group-hover:text-emerald-400 font-mono text-[11px] transition-colors">
          Telemetry <ChevronRight className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </div>
  )
}
