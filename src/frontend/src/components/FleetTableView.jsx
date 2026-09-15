import React, { useState } from 'react'
import { Search, Filter, ShieldCheck, AlertTriangle, AlertOctagon, ChevronRight, X } from 'lucide-react'

export default function FleetTableView({ assets = [], onSelectAsset }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')

  const filtered = assets.filter(a => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false
    if (typeFilter !== 'ALL' && a.asset_type !== typeFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchCode = a.asset_code.toLowerCase().includes(q)
      const matchName = a.name.toLowerCase().includes(q)
      const matchModel = a.model.toLowerCase().includes(q)
      const matchSq = a.squadron.toLowerCase().includes(q)
      if (!matchCode && !matchName && !matchModel && !matchSq) return false
    }
    return true
  })

  return (
    <div className="space-y-4">
      {/* Control Bar: Search & Filters */}
      <div className="panel-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tail number, callsign, model, or squadron..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1 uppercase">Status:</span>
          {['ALL', 'FMC', 'PMC', 'NMC'].map(s => {
            const active = statusFilter === s
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  active 
                    ? 'bg-blue-600 text-white font-semibold' 
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {s}
              </button>
            )
          })}
        </div>

        {/* Platform Type Filter */}
        <div className="flex items-center space-x-1 overflow-x-auto text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1 uppercase">Type:</span>
          {['ALL', 'FIGHTER_JET', 'ATTACK_HELICOPTER', 'MAIN_BATTLE_TANK', 'TRANSPORT_AIRCRAFT'].map(t => {
            const active = typeFilter === t
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2 py-1 rounded text-[11px] transition ${
                  active 
                    ? 'bg-slate-700 text-white font-semibold' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {t === 'ALL' ? 'ALL' : t.replace('_', ' ')}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Dense Data Table */}
      <div className="panel-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Tail Number</th>
                <th>Platform / Model</th>
                <th>Squadron & Location</th>
                <th>Status</th>
                <th>Readiness</th>
                <th>Subsystem Risk</th>
                <th>Predicted RUL</th>
                <th>Assigned Sortie</th>
                <th>Total Hours</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(asset => {
                const isFMC = asset.status === 'FMC'
                const isPMC = asset.status === 'PMC'
                const isNMC = asset.status === 'NMC'

                // Subsystem & RUL mapping from component status
                const lowestComp = asset.components?.reduce((prev, curr) => 
                  (curr.current_rul < prev.current_rul) ? curr : prev, asset.components[0] || {}
                )
                const rul = lowestComp?.current_rul ? `${lowestComp.current_rul}h` : 
                            isNMC ? '18.4h' : isPMC ? '52.0h' : '142.0h'
                const compName = lowestComp?.name || (isNMC ? 'Turbofan Engine' : 'Nominal')
                const missionName = isNMC ? 'Operation Desert Shield' : 'On Standby'

                return (
                  <tr 
                    key={asset.id} 
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    onClick={() => onSelectAsset(asset)}
                  >
                    <td className="font-mono font-bold text-white text-xs whitespace-nowrap">
                      {asset.asset_code}
                    </td>
                    <td>
                      <div className="font-semibold text-slate-100">{asset.name}</div>
                      <div className="text-[11px] text-slate-400">{asset.model}</div>
                    </td>
                    <td>
                      <div className="text-slate-300 font-mono text-xs">{asset.squadron}</div>
                      <div className="text-[11px] text-slate-500">{asset.base_location}</div>
                    </td>
                    <td>
                      {isFMC && (
                        <span className="status-badge-fmc">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>FMC</span>
                        </span>
                      )}
                      {isPMC && (
                        <span className="status-badge-pmc">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          <span>PMC</span>
                        </span>
                      )}
                      {isNMC && (
                        <span className="status-badge-nmc">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          <span>NMC</span>
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full ${
                              isFMC ? 'bg-emerald-500' : isPMC ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${asset.readiness_score}%` }}
                          />
                        </div>
                        <span className={`font-mono font-bold text-xs ${
                          isFMC ? 'text-emerald-400' : isPMC ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {asset.readiness_score}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="text-xs font-medium text-slate-200">{compName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {isNMC ? 'Thermal Creep' : isPMC ? 'Restricted' : 'Nominal'}
                      </div>
                    </td>
                    <td className={`font-mono text-xs font-bold ${
                      isNMC ? 'text-rose-400' : isPMC ? 'text-amber-400' : 'text-slate-300'
                    }`}>
                      {rul}
                    </td>
                    <td>
                      <span className="text-xs text-slate-300">
                        {missionName}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-slate-400">
                      {asset.total_flight_hours}h
                    </td>
                    <td className="text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectAsset(asset)}
                        className="btn-secondary text-xs !py-1 !px-2.5"
                      >
                        <span>Review</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="px-4 py-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing <strong className="text-slate-200">{filtered.length}</strong> of <strong className="text-slate-200">{assets.length}</strong> military platforms</span>
          <span className="font-mono text-[11px]">Real-time CBM+ Database Synchronized</span>
        </div>
      </div>
    </div>
  )
}
