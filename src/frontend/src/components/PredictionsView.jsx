import React from 'react'
import { Clock, AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react'

export default function PredictionsView({ predictions, missionWindowHours = 48.0 }) {
  return (
    <div className="bg-[#0f1422] border border-slate-800 rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <span>Predictive Failure Timeline & Prognostics Forecast</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            GPU-accelerated XGBoost RUL estimation (NASA C-MAPSS trained, 18.21 cycles RMSE) vs upcoming 48-hr mission window.
          </p>
        </div>
        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-purple-950/40 text-purple-300 border border-purple-800/50">
          Target Mission Window: {missionWindowHours} hrs
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/60 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Asset / Platform</th>
              <th className="py-2.5 px-3">Subsystem</th>
              <th className="py-2.5 px-3">Predicted RUL</th>
              <th className="py-2.5 px-3">Confidence Margin</th>
              <th className="py-2.5 px-3">Risk Tier</th>
              <th className="py-2.5 px-3">Mission Window Conflict</th>
              <th className="py-2.5 px-3">Diagnostic Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {predictions?.map(p => {
              const isCrit = p.risk_level === 'CRITICAL'
              const isHigh = p.risk_level === 'HIGH'
              const fails = p.fails_before_mission || p.predicted_rul <= missionWindowHours

              return (
                <tr key={p.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-3 font-mono font-bold text-white">{p.asset_code || `Component #${p.component_id}`}</td>
                  <td className="py-3 px-3 font-medium text-slate-200">{p.component_name || 'Turbofan Engine'}</td>
                  <td className="py-3 px-3 font-mono font-extrabold text-sm">
                    <span className={fails ? 'text-rose-400' : 'text-emerald-400'}>
                      {p.predicted_rul} hrs
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">
                    [{p.confidence_interval_lower} - {p.confidence_interval_upper}]
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isCrit ? 'bg-rose-500 text-white' :
                      isHigh ? 'bg-amber-500 text-black' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {p.risk_level}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {fails ? (
                      <span className="inline-flex items-center space-x-1 text-rose-400 font-bold font-mono text-[11px] bg-rose-950/30 px-2 py-0.5 rounded border border-rose-800/40">
                        <AlertTriangle className="w-3 h-3" />
                        <span>BREACHES WINDOW</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-[11px] font-mono">NOMINAL</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-400 max-w-xs truncate" title={p.explanation}>
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
