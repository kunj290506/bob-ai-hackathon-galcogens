import React, { useState } from 'react'
import { Activity, Flame, Wind, Gauge, ShieldAlert, CheckCircle, Play, Sliders, Thermometer, ShieldCheck, AlertOctagon } from 'lucide-react'

const MISSION_PRESETS = [
  {
    id: 'DESERT_HEAT',
    name: 'Desert Theater (+45°C Ambient)',
    icon: Flame,
    desc: 'High thermal load, low air density, elevated turbine inlet temperatures (TIT).'
  },
  {
    id: 'SAND_DUST_INGESTION',
    name: 'Austere Sand & Dust Ingestion',
    icon: Wind,
    desc: 'Severe particulate matter causing compressor blade erosion and cooling channel occlusion.'
  },
  {
    id: 'COMBAT_HIGH_G',
    name: 'High-G Combat Turns (7.0 - 9.0G)',
    icon: Activity,
    desc: 'Sustained afterburner usage, heavy aerodynamic g-load strain, and cyclic thermo-mechanical fatigue.'
  },
  {
    id: 'ARCTIC_COLD',
    name: 'Sub-Zero Arctic Soak (-20°C)',
    icon: Gauge,
    desc: 'Extreme hydraulic fluid viscosity, cold-start thermal shock, elastomer seal contraction.'
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
      <div className="panel-card p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[10px] font-mono font-medium tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
                STRESS PROGNOSTICS
              </span>
              <span className="text-[11px] text-slate-400">XGBoost Degradation Engine</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Sortie Stress & Mission Survivability Simulator
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
              Evaluate thermodynamic shifts, particulate sand erosion, and high-G combat maneuvers against component remaining useful life prior to flight authorization.
            </p>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={simulating}
            className="btn-primary !px-5 !py-2.5 text-xs font-semibold"
          >
            <Play className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
            <span>{simulating ? 'Computing Dynamics...' : 'Execute Simulation'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Controls vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter Configuration (5 cols) */}
        <div className="lg:col-span-5 panel-card p-6 space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Sortie Stress Parameters
            </h3>
          </div>

          {/* Select Platform */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              TARGET PLATFORM AIRFRAME
            </label>
            <select
              value={selectedAssetCode}
              onChange={e => setSelectedAssetCode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
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
              ENVIRONMENTAL THEATER SCENARIO
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {MISSION_PRESETS.map(p => {
                const Icon = p.icon
                const isSelected = missionProfile === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setMissionProfile(p.id)}
                    className={`p-3 rounded-lg text-left transition flex flex-col justify-between border ${
                      isSelected
                        ? 'bg-slate-800 border-blue-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1.5">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-semibold">{p.name.split(' ')[0]}</span>
                    </div>
                    <span className="text-[10px] line-clamp-2 text-slate-400 font-sans">{p.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sortie Duration Slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="text-slate-400 font-mono text-[11px]">SORTIE DURATION</span>
              <span className="font-mono font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
                {durationHours} Hours
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="12.0"
              step="0.5"
              value={durationHours}
              onChange={e => setDurationHours(e.target.value)}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1.5">
              <span>1.0h (Strike)</span>
              <span>6.0h (Patrol)</span>
              <span>12.0h (Endurance)</span>
            </div>
          </div>

          {/* G-Rating Slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="text-slate-400 font-mono text-[11px]">PEAK G-ENVELOPE</span>
              <span className="font-mono font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
                {gRating} G
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="9.0"
              step="0.5"
              value={gRating}
              onChange={e => setGRating(e.target.value)}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1.5">
              <span>1.0G (Transit)</span>
              <span>5.0G (Tactical)</span>
              <span>9.0G (Max Turn)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Simulation Output & Physics Telemetry (7 cols) */}
        <div className="lg:col-span-7 panel-card p-6 flex flex-col justify-between space-y-6">
          {error && (
            <div className="bg-rose-950/30 border border-rose-800/60 rounded-lg p-4 text-xs text-rose-300 font-mono">
              {error}
            </div>
          )}

          {!result ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                <Activity className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Digital Twin Ready for Physics Excursion
              </p>
              <p className="text-xs max-w-sm font-sans text-slate-400">
                Select theater profile and sortie parameters on the left, then click{' '}
                <strong className="text-white">"Execute Simulation"</strong> to evaluate component degradation.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Top Banner: Survivability Gauge */}
              <div className={`rounded-xl p-5 border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isSurvivable
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-rose-950/20 border-rose-500/40'
              }`}>
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold font-mono border ${
                    isSurvivable
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  }`}>
                    {survivability}%
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white tracking-wide uppercase">
                      {isSurvivable ? 'Survivability: Cleared for Sortie' : 'Critical: Sortie Abort Recommended'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Target: <strong className="text-slate-200 font-mono">{result.asset_code}</strong> ({result.asset_name})
                    </p>
                  </div>
                </div>

                <span className={isSurvivable ? 'status-badge-fmc' : 'status-badge-nmc'}>
                  {isSurvivable ? 'CLEARED' : 'UNSAFE'}
                </span>
              </div>

              {/* Telemetry Metrics 4-Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-800/50 border border-slate-700/60 p-3.5 rounded-lg">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Wear Factor</p>
                  <p className="text-base font-bold font-mono text-amber-400 mt-1">
                    {result.wear_acceleration_multiplier}x
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">vs Standard</p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/60 p-3.5 rounded-lg">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">EGT Spike</p>
                  <p className="text-base font-bold font-mono text-rose-400 mt-1">
                    +{result.projected_egt_spike_deg_r}°R
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Temp Delta</p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/60 p-3.5 rounded-lg">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Nominal Base RUL</p>
                  <p className="text-base font-bold font-mono text-slate-300 mt-1">
                    {result.nominal_predicted_rul} hrs
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Baseline Life</p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/60 p-3.5 rounded-lg">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Stressed RUL</p>
                  <p className={`text-base font-bold font-mono mt-1 ${
                    result.effective_theater_rul < durationHours ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {result.effective_theater_rul} hrs
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Theater Residual</p>
                </div>
              </div>

              {/* Tactical Operations Advisory */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-2">
                  <ShieldAlert className="w-4 h-4 text-blue-400" />
                  <span>TACTICAL OPERATIONS DIRECTIVE</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {result.tactical_recommendation}
                </p>
              </div>

              {/* Safety Margin Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400 text-[11px]">SORTIE EXPOSURE BUFFER</span>
                  <span className="text-slate-300 text-[11px]">
                    {durationHours}h used of {result.effective_theater_rul}h capacity
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60">
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
