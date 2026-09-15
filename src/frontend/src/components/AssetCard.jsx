import React from 'react'
import { Plane, AlertTriangle, CheckCircle2, ChevronRight, Activity } from 'lucide-react'

export default function AssetCard({ asset, onSelect }) {
  const isFMC = asset.status === 'FMC'
  const isPMC = asset.status === 'PMC'
  const isNMC = asset.status === 'NMC'

  const statusBadge = isFMC ? (
    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
      <CheckCircle2 className="w-3 h-3" />
      <span>FMC</span>
    </span>
  ) : isPMC ? (
    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
      <AlertTriangle className="w-3 h-3" />
      <span>PMC</span>
    </span>
  ) : (
    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">
      <AlertTriangle className="w-3 h-3" />
      <span>NMC</span>
    </span>
  )

  return (
    <div 
      onClick={() => onSelect(asset)}
      className="bg-[#0f1422] border border-slate-800/80 hover:border-slate-600 rounded-xl p-4 transition-all duration-200 hover:shadow-xl hover:shadow-black/40 cursor-pointer group flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-emerald-400 transition">
              {asset.asset_code}
            </span>
            <h4 className="text-sm font-bold text-white tracking-tight">{asset.name}</h4>
          </div>
          {statusBadge}
        </div>

        {/* Model & Squadron */}
        <p className="text-xs text-slate-400 mb-3">{asset.model} • {asset.squadron}</p>

        {/* Readiness Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-400">Readiness Score</span>
            <span className={`font-mono font-bold ${
              isFMC ? 'text-emerald-400' : isPMC ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {asset.readiness_score}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-1.5 rounded-full ${
                isFMC ? 'bg-emerald-500' : isPMC ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${asset.readiness_score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <span>{asset.total_flight_hours} Flight Hrs</span>
        <span className="flex items-center text-slate-300 group-hover:text-white font-medium">
          Diagnostics <ChevronRight className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </div>
  )
}
