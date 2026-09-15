import React from 'react'
import { ShieldCheck, AlertTriangle, AlertOctagon, Target, Gauge } from 'lucide-react'

export default function FleetStats({ summary, onFilterStatus, activeFilter }) {
  const fmcPct = summary?.fmc_percentage ?? 70.0
  const total = summary?.total_assets ?? 20
  const fmc = summary?.fmc_count ?? 14
  const pmc = summary?.pmc_count ?? 0
  const nmc = summary?.nmc_count ?? 6
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Fleet FMC Rate Card */}
      <div 
        onClick={() => onFilterStatus(activeFilter === 'FMC' ? null : 'FMC')}
        className={`panel-card p-5 cursor-pointer transition-all duration-200 ${
          activeFilter === 'FMC' 
            ? 'ring-1 ring-blue-500 border-blue-500/80' 
            : 'hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono font-medium tracking-wider uppercase text-slate-400">
            FLEET READINESS INDEX
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Gauge className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-extrabold text-white font-mono tracking-tight">{fmcPct}%</span>
          <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
            {fmc}/{total} AIRWORTHY
          </span>
        </div>

        <div className="mt-3 w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
          <div 
            className="bg-emerald-500 h-full rounded-full transition-all duration-700" 
            style={{ width: `${fmcPct}%` }}
          />
        </div>
      </div>

      {/* 2. Fully Mission Capable (FMC) */}
      <div 
        onClick={() => onFilterStatus(activeFilter === 'FMC' ? null : 'FMC')}
        className={`panel-card p-5 cursor-pointer transition-all duration-200 ${
          activeFilter === 'FMC' 
            ? 'ring-1 ring-emerald-500 border-emerald-500/80' 
            : 'hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono font-medium tracking-wider uppercase text-slate-400">
            FULLY MISSION CAPABLE
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">{fmc}</span>
          <span className="text-xs font-mono text-slate-400">Sortie-Ready</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 font-sans">
          All primary combat avionics and propulsion verified nominal.
        </p>
      </div>

      {/* 3. Partially Mission Capable (PMC) */}
      <div 
        onClick={() => onFilterStatus(activeFilter === 'PMC' ? null : 'PMC')}
        className={`panel-card p-5 cursor-pointer transition-all duration-200 ${
          activeFilter === 'PMC' 
            ? 'ring-1 ring-amber-500 border-amber-500/80' 
            : 'hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono font-medium tracking-wider uppercase text-slate-400">
            PARTIALLY MISSION CAPABLE
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-amber-400 font-mono tracking-tight">{pmc}</span>
          <span className="text-xs font-mono text-slate-400">Secondary Degradation</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 font-sans">
          Airframe restricted to secondary low-stress sortie envelopes.
        </p>
      </div>

      {/* 4. Non-Mission Capable (NMC) */}
      <div 
        onClick={() => onFilterStatus(activeFilter === 'NMC' ? null : 'NMC')}
        className={`panel-card p-5 cursor-pointer transition-all duration-200 ${
          activeFilter === 'NMC' 
            ? 'ring-1 ring-rose-500 border-rose-500/80' 
            : 'hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono font-medium tracking-wider uppercase text-slate-400">
            NON-MISSION CAPABLE
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-rose-500 font-mono tracking-tight">{nmc}</span>
          <span className="text-xs font-mono font-medium text-rose-400 tracking-wider">GROUNDED</span>
        </div>
        <p className="text-[11px] text-rose-300 mt-2 font-sans">
          Imminent failure or critical safety limits exceeded. Priority turnaround required.
        </p>
      </div>
    </div>
  )
}
