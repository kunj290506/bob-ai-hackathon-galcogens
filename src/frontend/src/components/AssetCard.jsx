import React from 'react'
import { ChevronRight, ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react'

export default function AssetCard({ asset, onSelect }) {
  const isFMC = asset.status === 'FMC'
  const isPMC = asset.status === 'PMC'
  const isNMC = asset.status === 'NMC'

  const statusBadge = isFMC ? (
    <span className="status-badge-fmc text-[10px]">
      <ShieldCheck className="w-3 h-3 mr-1 inline" />
      <span>FMC</span>
    </span>
  ) : isPMC ? (
    <span className="status-badge-pmc text-[10px]">
      <AlertTriangle className="w-3 h-3 mr-1 inline" />
      <span>PMC</span>
    </span>
  ) : (
    <span className="status-badge-nmc text-[10px]">
      <AlertOctagon className="w-3 h-3 mr-1 inline" />
      <span>NMC</span>
    </span>
  )

  return (
    <div 
      onClick={() => onSelect(asset)}
      className="panel-card p-4 cursor-pointer group flex flex-col justify-between transition-all duration-200 hover:border-slate-700"
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="text-[11px] font-mono font-medium text-slate-400 group-hover:text-blue-400 transition-colors">
              {asset.asset_code}
            </span>
            <h4 className="text-sm font-semibold text-white tracking-tight leading-snug">{asset.name}</h4>
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
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isFMC ? 'bg-emerald-500' :
                isPMC ? 'bg-amber-500' :
                'bg-rose-500'
              }`}
              style={{ width: `${asset.readiness_score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span className="font-mono text-[10px] text-slate-400">{asset.total_flight_hours} FLT HRS</span>
        <span className="flex items-center text-slate-300 group-hover:text-blue-400 font-mono text-[11px] transition-colors">
          Diagnostics <ChevronRight className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </div>
  )
}
