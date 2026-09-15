import React, { useState } from 'react'
import { Activity, Flame, Wind, Gauge, ShieldAlert, CheckCircle, AlertTriangle, Play, HelpCircle } from 'lucide-react'

const MISSION_PRESETS = [
  {
    id: 'DESERT_HEAT',
    name: 'Desert Theater (45°C High Ambient)',
    icon: Flame,
    desc: 'Severe ambient thermal load, reduced air density, elevated turbine inlet temperatures.'
  },
  {
    id: 'SAND_DUST_INGESTION',
    name: 'Austere Sand & Dust Ingestion',
    icon: Wind,
    desc: 'High particulate matter ingestion causing compressor blade erosion and cooling channel occlusion.'
  },
  {
    id: 'COMBAT_HIGH_G',
    name: 'High-G Combat Maneuvering (7-9G)',
    icon: Activity,
    desc: 'Sustained afterburner usage, heavy aerodynamic g-loads, and cyclic mechanical strain.'
  },
  {
    id: 'ARCTIC_COLD',
    name: 'Sub-Zero Arctic Cold Soak (-20°C)',
    icon: Gauge,
    desc: 'Severe hydraulic viscosity increase, cold-start thermal gradients, seal contraction.'
  }
]

export default function SimulatorView({ assets = [] }) {
  const [selectedAssetCode, setSelectedAssetCode] = useState(assets[0]?.asset_code || 'F16-VIPER-101')
  const [missionProfile, setMissionProfile] = useState('DESERT_HEAT')
  const [durationHours, setDurationHours] = useState(4.0)
  const [gRating, setGRating] = useState(7.0)
  
  const [simulating, setSimulating] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleRunSimulation = async () => {
    setSimulating(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/copilot/simulate-stress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_code: selectedAssetCode,
          mission_profile: missionProfile,
          sortie_duration_hours: parseFloat(durationHours),
          sortie_g_rating: parseFloat(gRating)
        })
      })

      if (!res.ok) {
        throw new Error('Simulation endpoint returned error')
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      console.error('Simulation failed:', err)
      setError('Failed to compute environmental stress simulation. Ensure backend is active.')
    } finally {
      setSimulating(false)
    }
  }

  const survivability = result?.mission_survivability_probability ?? 0
  const isSurvivable = result?.is_mission_survivable ?? false

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0f1422] border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                WHAT-IF DIGITAL TWIN SIMULATOR
              </span>
              <span className="text-[10px] font-mono text-slate-400">GPU-Accelerated XGBoost Engine</span>
            </div>
            <h2 className="text-xl font-bold text-white">Mission Environmental Stress & Survivability Testing</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Simulate operational conditions before flight commitment. Evaluates thermodynamic compressor heating,
              particulate ingestion wear, and G-envelope mechanical fatigue to predict mission survivability.
            </p>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={simulating}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition flex items-center space-x-2 disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${simulating ? 'animate-spin' : 'fill-white'}`} />
            <span>{simulating ? 'Computing Physics Model...' : 'Execute Stress Simulation'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Controls vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter Configuration (5 cols) */}
        <div className="lg:col-span-5 bg-[#0f1422] border border-slate-800 rounded-2xl p-6 space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3">
            Mission Flight Parameters
          </h3>

          {/* Select Platform */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Target Airframe / Ground Platform
            </label>
            <select
              value={selectedAssetCode}
              onChange={e => setSelectedAssetCode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {assets.map(a => (
                <option key={a.id} value={a.asset_code}>
                  {a.asset_code} — {a.name} ({a.status})
                </option>
              ))}
            </select>
          </div>

          {/* Environmental Theater Presets */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Operational Theater Environmental Profile
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MISSION_PRESETS.map(p => {
                const Icon = p.icon
                const isSelected = missionProfile === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setMissionProfile(p.id)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-white ring-1 ring-emerald-500/40'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1.5">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold text-slate-200">{p.name.split(' ')[0]}</span>
                    </div>
                    <span className="text-[10px] line-clamp-2 text-slate-400">{p.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sortie Duration Slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-400">Sortie Duration</span>
              <span className="font-mono font-bold text-emerald-400">{durationHours} Hours</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="12.0"
              step="0.5"
              value={durationHours}
              onChange={e => setDurationHours(e.target.value)}
              className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>1.0h (Quick Strike)</span>
              <span>6.0h (Standard CAP)</span>
              <span>12.0h (Extended ISR)</span>
            </div>
          </div>

          {/* G-Rating Slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-400">Peak Maneuver G-Rating</span>
              <span className="font-mono font-bold text-amber-400">{gRating} G</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="9.0"
              step="0.5"
              value={gRating}
              onChange={e => setGRating(e.target.value)}
              className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>1.0G (Straight Transit)</span>
              <span>5.0G (Tactical Turn)</span>
              <span>9.0G (Max Dogfight)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Simulation Output & Physics Telemetry (7 cols) */}
        <div className="lg:col-span-7 bg-[#0f1422] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          {error && (
            <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 text-xs text-rose-300">
              {error}
            </div>
          )}

          {!result ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400">
                <Activity className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-300">No Active Stress Simulation</p>
              <p className="text-[11px] max-w-sm">
                Select your mission profile and flight parameters on the left, then click{' '}
                <strong className="text-emerald-400">"Execute Stress Simulation"</strong> to evaluate component fatigue.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Top Banner: Survivability Gauge */}
              <div className={`rounded-xl p-5 border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isSurvivable
                  ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-800/60 text-rose-200'
              }`}>
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold font-mono border ${
                    isSurvivable
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  }`}>
                    {survivability}%
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white">
                        {isSurvivable ? 'MISSION SURVIVABILITY: APPROVED' : 'CRITICAL WARNING: MISSION ABORT RECOMMENDED'}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Platform: <strong className="text-white">{result.asset_code}</strong> ({result.asset_name})
                    </p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isSurvivable ? 'bg-emerald-500 text-black' : 'bg-rose-600 text-white animate-pulse'
                }`}>
                  {isSurvivable ? 'CLEARED' : 'UNSAFE'}
                </span>
              </div>

              {/* Telemetry Metrics 4-Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Wear Multiplier</p>
                  <p className="text-lg font-bold font-mono text-amber-400 mt-1">
                    {result.wear_acceleration_multiplier}x
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">vs ISA Standard Day</p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Projected EGT Spike</p>
                  <p className="text-lg font-bold font-mono text-rose-400 mt-1">
                    +{result.projected_egt_spike_deg_r}°R
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Exhaust Gas Temp Delta</p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Nominal Base RUL</p>
                  <p className="text-lg font-bold font-mono text-slate-300 mt-1">
                    {result.nominal_predicted_rul} hrs
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Without Theater Stress</p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Stressed Mission RUL</p>
                  <p className={`text-lg font-bold font-mono mt-1 ${
                    result.effective_theater_rul < durationHours ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {result.effective_theater_rul} hrs
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">After In-Theater Degradation</p>
                </div>
              </div>

              {/* Tactical Commander Directive */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-white mb-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  <span>Tactical Operations Advisory</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {result.tactical_recommendation}
                </p>
              </div>

              {/* Stress Comparison Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Sortie Exposure vs Remaining Headroom</span>
                  <span className="font-mono text-slate-300">
                    {durationHours}h of {result.effective_theater_rul}h safety buffer
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (durationHours / result.effective_theater_rul) > 0.85
                        ? 'bg-rose-500'
                        : (durationHours / result.effective_theater_rul) > 0.5
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round((durationHours / Math.max(1, result.effective_theater_rul)) * 100))}%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
