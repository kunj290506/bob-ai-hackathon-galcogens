import React from 'react'
import { AlertOctagon, AlertTriangle, ShieldCheck, Clock, Wrench, ChevronRight, ArrowUpRight, Activity, FileText } from 'lucide-react'

export default function OverviewView({
  summary,
  assets = [],
  predictions = [],
  workOrders = [],
  missions = [],
  onSelectAsset,
  onApproveOrder,
  onOpenMilStd,
  onAskCopilot,
  onNavigateTab
}) {
  const fmcPct = summary?.fmc_percentage ?? 70.0
  const total = summary?.total_assets ?? 20
  const fmcCount = summary?.fmc_count ?? 14
  const pmcCount = summary?.pmc_count ?? 0
  const nmcCount = summary?.nmc_count ?? 6

  // Top critical attention platforms: NMC assets sorted by lowest readiness
  const criticalAssets = assets
    .filter(a => a.status === 'NMC')
    .sort((a, b) => a.readiness_score - b.readiness_score)
    .slice(0, 4)

  // Primary next mission (Desert Shield)
  const nextMission = missions[0] || {
    title: 'Operation Desert Shield',
    start_time: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    required_assets_count: 4,
    required_asset_type: 'FIGHTER_JET',
    minimum_readiness_threshold: 85.0
  }

  // Calculate readiness gap for primary mission
  const requiredFmcThreshold = nextMission.minimum_readiness_threshold || 85.0
  const readinessGap = Math.round(fmcPct - requiredFmcThreshold)

  return (
    <div className="space-y-6">
      {/* 1. COMPACT OPERATIONAL STATUS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Current Fleet Readiness */}
        <div className="panel-card p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wide">
            <span>Current Readiness</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              FLEET STATUS
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-4xl font-extrabold text-white font-mono tracking-tight">{fmcPct}%</span>
            <span className="text-xs font-mono font-medium text-emerald-400">
              {fmcCount} / {total} Capable
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {fmcCount} FMC
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="inline-flex items-center gap-1 text-amber-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> {pmcCount} PMC
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="inline-flex items-center gap-1 text-rose-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> {nmcCount} Grounded
            </span>
          </div>
        </div>

        {/* Card 2: Next Scheduled Mission */}
        <div className="panel-card p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wide">
            <span>Next Mission</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-900">
              AIR TASKING ORDER
            </span>
          </div>
          <div className="text-lg font-bold text-white tracking-tight truncate" title={nextMission.title}>
            {nextMission.title}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Req: <strong className="text-slate-200 font-mono">{nextMission.required_assets_count}x {nextMission.required_asset_type}</strong>
            <span className="ml-2 font-mono text-[11px] text-slate-500">({nextMission.minimum_readiness_threshold}% Gate)</span>
          </div>
        </div>

        {/* Card 3: Mission Launch Window */}
        <div className="panel-card p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wide">
            <span>Starts In</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              COUNTDOWN
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-4xl font-extrabold text-white font-mono tracking-tight">48h</span>
            <span className="text-xs font-mono text-amber-400">Launch Horizon</span>
          </div>
          <div className="mt-3 text-xs text-slate-400 truncate">
            Departure: <span className="font-mono text-slate-300">{new Date(nextMission.start_time).toLocaleDateString()} 06:00Z</span>
          </div>
        </div>

        {/* Card 4: Operational Readiness Gap */}
        <div className="panel-card p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wide">
            <span>Readiness Gap</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              readinessGap < 0 ? 'bg-rose-950 text-rose-300 border border-rose-900' : 'bg-emerald-950 text-emerald-300'
            }`}>
              {readinessGap < 0 ? 'DEFICIT' : 'SURPLUS'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-4xl font-extrabold font-mono tracking-tight ${
              readinessGap < 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {readinessGap}%
            </span>
            <span className="text-xs font-mono text-slate-400">
              Shortfall: 2 Platforms
            </span>
          </div>
          <div className="mt-3 text-xs text-rose-300">
            FMC capacity threatens mission commitment.
          </div>
        </div>
      </div>

      {/* 2. CRITICAL ATTENTION: HIGHEST-IMPACT READINESS RISKS */}
      <div className="panel-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-500" />
              <span>Critical Attention — Grounded & Degraded Platforms</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Subsystems predicted to violate the 48-hour mission window requiring prioritized maintenance turnaround.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('maintenance')}
              className="btn-outline text-xs"
            >
              <span>View All Work Orders ({workOrders.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Platform / Unit</th>
                <th>Status</th>
                <th>Readiness</th>
                <th>Degraded Subsystem</th>
                <th>Predicted RUL</th>
                <th>Mission Threat</th>
                <th>Recommended Turnaround</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {criticalAssets.map(asset => {
                // Find matching prediction or component info
                const pred = predictions.find(p => p.asset_code === asset.asset_code)
                const rul = pred ? `${pred.predicted_rul}h` : '18.4h'
                const compName = pred?.component_name || 'Turbofan Engine (LPT)'
                const issueText = asset.asset_code === 'F16-VIPER-101' ? 'LPT Thermal Creep (T30 Overheat)' :
                                  asset.asset_code === 'AH64-APACHE-401' ? 'Rotor Planetary Gearbox Wear' :
                                  'Turbine Powerpack Pressure Drop'

                return (
                  <tr key={asset.id}>
                    <td className="font-mono font-bold text-white">
                      {asset.asset_code}
                    </td>
                    <td>
                      <div className="font-medium text-slate-200">{asset.name}</div>
                      <div className="text-[11px] text-slate-400">{asset.model} &bull; <span className="font-mono">{asset.squadron}</span></div>
                    </td>
                    <td>
                      <span className="status-badge-nmc">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        <span>NMC</span>
                      </span>
                    </td>
                    <td className="font-mono font-bold text-rose-400">
                      {asset.readiness_score}%
                    </td>
                    <td>
                      <div className="text-slate-200 font-medium">{compName}</div>
                      <div className="text-[11px] text-slate-400">{issueText}</div>
                    </td>
                    <td className="font-mono font-bold text-rose-400">
                      {rul}
                    </td>
                    <td>
                      <div className="text-rose-400 font-semibold text-xs flex items-center gap-1">
                        <span>Op. Desert Shield</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">Fails before T+48h</div>
                    </td>
                    <td>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950/50 text-rose-300 border border-rose-900">
                        Priority 1 Turnaround
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => onSelectAsset(asset)}
                        className="btn-secondary text-xs !py-1 !px-2.5"
                      >
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. UPCOMING MISSIONS STATUS & ATO RE-ALLOCATION MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mission Operational Requirements */}
        <div className="panel-card p-5">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white">Upcoming Mission Requirements</h3>
            <button
              onClick={() => onNavigateTab('missions')}
              className="btn-outline text-xs"
            >
              <span>Missions View</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {missions.slice(0, 3).map(m => (
              <div key={m.id} className="p-3.5 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-200">{m.title}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5 font-mono">
                    Window: {new Date(m.start_time).toLocaleDateString()} &bull; Required: {m.required_assets_count}x {m.required_asset_type}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs text-amber-400 font-semibold">
                    Gate: {m.minimum_readiness_threshold}% FMC
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Priority: <span className="text-white font-bold">{m.priority}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance Turnaround Queue Summary */}
        <div className="panel-card p-5">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white">Prioritized Turnaround Work Orders</h3>
            <button
              onClick={() => onNavigateTab('maintenance')}
              className="btn-outline text-xs"
            >
              <span>Work Order Queue</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {workOrders.slice(0, 3).map(wo => {
              const isApproved = wo.status === 'APPROVED'
              return (
                <div key={wo.id} className="p-3.5 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-900 font-bold">
                        {wo.priority}
                      </span>
                      <span className="font-bold text-slate-200">{wo.title}</span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-1">
                      Est. Labor: <strong className="text-slate-300 font-mono">{wo.estimated_hours}h</strong> &bull; Tech: {wo.assigned_to || 'Flight Line Crew'}
                    </div>
                  </div>

                  <div>
                    {isApproved ? (
                      <span className="text-emerald-400 font-mono text-xs font-semibold px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-900">
                        AUTHORIZED
                      </span>
                    ) : (
                      <button
                        onClick={() => onApproveOrder(wo.id)}
                        className="btn-primary text-xs !py-1 !px-2.5"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
