import React from 'react'
import { Clock, AlertTriangle, CheckCircle2, AlertOctagon, ShieldCheck } from 'lucide-react'

export default function PredictionsView({ predictions, missionWindowHours = 48.0 }) {
  return (
    <div className="panel-card p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-mono font-medium tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
              PROGNOSTICS MODEL
            </span>
            <span className="text-[11px] text-slate-400">NASA C-MAPSS Benchmark (18.21 Cycles RMSE)</span>
          </div>
          <h3 className="text-base font-semibold text-white tracking-tight flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Remaining Useful Life (RUL) Failure Forecasts</span>
          </h3>
        </div>
        <div className="self-start sm:self-auto text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700">
          Target Mission Horizon: <strong className="text-white">{missionWindowHours}h</strong>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="enterprise-table">
          <thead>
            <tr>
              <th>Platform</th>
              <th>Subsystem</th>
              <th>Predicted RUL</th>
              <th>95% Confidence</th>
              <th>Risk Level</th>
              <th>Mission Conflict</th>
              <th>Telemetry Diagnosis</th>
            </tr>
          </thead>
          <tbody>
            {predictions?.map(p => {
              const isCrit = p.risk_level === 'CRITICAL'
              const isHigh = p.risk_level === 'HIGH'
              const fails = p.fails_before_mission || p.predicted_rul <= missionWindowHours

              return (
                <tr key={p.id}>
                  <td className="font-mono font-semibold text-white">
                    {p.asset_code || `Component #${p.component_id}`}
                  </td>
                  <td className="font-medium text-slate-200">
                    {p.component_name || 'Turbofan Engine'}
                  </td>
                  <td className="font-mono font-bold text-sm">
                    <span className={fails ? 'text-rose-400' : 'text-emerald-400'}>
                      {p.predicted_rul} hrs
                    </span>
                  </td>
                  <td className="font-mono text-slate-400 text-[11px]">
                    [{p.confidence_interval_lower} - {p.confidence_interval_upper}]
                  </td>
                  <td>
                    <span className={
                      isCrit ? 'status-badge-nmc' :
                      isHigh ? 'status-badge-pmc' :
                      'status-badge-fmc'
                    }>
                      {p.risk_level}
                    </span>
                  </td>
                  <td>
                    {fails ? (
                      <span className="inline-flex items-center space-x-1 text-rose-400 font-medium text-[11px] bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/50">
                        <AlertOctagon className="w-3 h-3 text-rose-400" />
                        <span>WINDOW CONFLICT</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-emerald-400 text-[11px] bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>CLEAR</span>
                      </span>
                    )}
                  </td>
                  <td className="text-slate-400 max-w-xs truncate text-xs" title={p.explanation}>
                    {p.explanation}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
