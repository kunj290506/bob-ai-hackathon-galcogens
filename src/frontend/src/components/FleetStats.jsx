import React from 'react'
import { ShieldCheck, AlertTriangle, XCircle, Target } from 'lucide-react'

export default function FleetStats({ summary, onFilterStatus, activeFilter }) {
  const fmcPct = summary?.fmc_percentage ?? 70.0
  const total = summary?.total_assets ?? 20
  const fmc = summary?.fmc_count ?? 14
  const pmc = summary?.pmc_count ?? 0
  const nmc = summary?.nmc_count ?? 6

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Fleet FMC Rate */}
      <div 
        onClick={() => onFilterStatus(activeFilter === 'FMC' ? null : 'FMC')}
        className={`p-4 rounded-xl border transition cursor-pointer ${
          activeFilter === 'FMC' 
            ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/50' 
            : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/50'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Fleet Mission Readiness</span>
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-white font-mono">{fmcPct}%</span>
          <span className="text-xs text-emerald-400 font-semibold">{fmc}/{total} FMC</span>
        </div>
        <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
            style={{ width: `${fmcPct}%` }}
          />
        </div>
      </div>

      {/* 2. Fully Mission Capable (FMC) */}
      <div 
        onClick={() => onFilterStatus(activeFilter === 'FMC' ? null : 'FMC')}
        className={`p-4 rounded-xl border transition cursor-pointer ${
          activeFilter === 'FMC' 
            ? 'bg-emerald-950/40 border-emerald-500 shadow-lg' 
            : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/50'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Fully Mission Capable (FMC)</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-emerald-400 font-mono">{fmc}</span>
          <span className="text-xs text-slate-400">Deployable Sorties</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-3">All flight & mission systems verified nominal.</p>
      </div>

      {/* 3. Partially Mission Capable (PMC) */}
      <div 
        onClick={() => onFilterStatus(activeFilter === 'PMC' ? null : 'PMC')}
        className={`p-4 rounded-xl border transition cursor-pointer ${
          activeFilter === 'PMC' 
            ? 'bg-amber-950/40 border-amber-500 shadow-lg' 
            : 'bg-slate-900/60 border-slate-800 hover:border-amber-500/50'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Partially Mission Capable (PMC)</span>
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-amber-400 font-mono">{pmc}</span>
          <span className="text-xs text-slate-400">Secondary Degradation</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-3">Restricted mission profiles only.</p>
      </div>

      {/* 4. Non-Mission Capable (NMC) */}
      <div 
        onClick={() => onFilterStatus(activeFilter === 'NMC' ? null : 'NMC')}
        className={`p-4 rounded-xl border transition cursor-pointer ${
          activeFilter === 'NMC' 
            ? 'bg-rose-950/40 border-rose-500 shadow-lg' 
            : 'bg-slate-900/60 border-slate-800 hover:border-rose-500/50'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Non-Mission Capable (NMC)</span>
          <XCircle className="w-5 h-5 text-rose-500" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-rose-500 font-mono">{nmc}</span>
          <span className="text-xs text-rose-400 font-semibold">GROUNDED</span>
        </div>
        <p className="text-[11px] text-rose-300 mt-3 font-medium">Critical failure predicted before next window.</p>
      </div>
    </div>
  )
}
