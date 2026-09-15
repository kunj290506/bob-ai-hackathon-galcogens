import React from 'react'
import { Clock, AlertTriangle, CheckCircle2, AlertOctagon, ShieldCheck } from 'lucide-react'

export default function PredictionsView({ predictions, missionWindowHours = 48.0 }) {
  return (
    <div className="uiverse-card p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
              GPU-ACCELERATED PROGNOSTICS
            </span>
            <span className="text-[10px] font-mono text-slate-400">NASA C-MAPSS Benchmark (18.21 Cycles RMSE)</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <span>Remaining Useful Life (RUL) Failure Timeline</span>
          </h3>
        </div>
        <span className="self-start sm:self-auto text-xs font-mono font-bold px-3 py-1 rounded-lg bg-purple-950/30 text-purple-300 border border-purple-800/40 shadow-inner">
          MISSION WINDOW: <strong className="text-white">{missionWindowHours}h</strong>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-3">Platform</th>
              <th className="py-3 px-3">Subsystem</th>
              <th className="py-3 px-3">Predicted RUL</th>
              <th className="py-3 px-3">95% Confidence</th>
              <th className="py-3 px-3">Risk Level</th>
              <th className="py-3 px-3">Mission Conflict</th>
              <th className="py-3 px-3">Telemetry Diagnosis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {predictions?.map(p => {
              const isCrit = p.risk_level === 'CRITICAL'
              const isHigh = p.risk_level === 'HIGH'
              const fails = p.fails_before_mission || p.predicted_rul <= missionWindowHours

              return (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-3 font-mono font-bold text-white tracking-tight">
                    {p.asset_code || `Component #${p.component_id}`}
                  </td>
                  <td className="py-3.5 px-3 font-medium text-slate-200">
                    {p.component_name || 'Turbofan Engine'}
                  </td>
                  <td className="py-3.5 px-3 font-mono font-extrabold text-sm">
                    <span className={fails ? 'text-rose-400' : 'text-emerald-400'}>
                      {p.predicted_rul} hrs
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-slate-400 text-[11px]">
                    [{p.confidence_interval_lower} - {p.confidence_interval_upper}]
                  </td>
                  <td className="py-3.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                      isCrit ? 'bg-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.4)]' :
                      isHigh ? 'bg-amber-500 text-black' :
                      'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {p.risk_level}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    {fails ? (
                      <span className="inline-flex items-center space-x-1.5 text-rose-400 font-bold font-mono text-[10px] bg-rose-950/40 px-2.5 py-0.5 rounded border border-rose-800/50 shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                        <AlertOctagon className="w-3 h-3 text-rose-400" />
                        <span>WINDOW CONFLICT</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-emerald-400 font-mono text-[10px] font-semibold bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>CLEAR</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-slate-400 max-w-xs truncate text-[11px]" title={p.explanation}>
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
