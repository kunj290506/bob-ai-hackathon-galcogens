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
      <div className="uiverse-card p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                DIGITAL TWIN PROGNOSTICS
              </span>
              <span className="text-[10px] font-mono text-slate-400">GPU-Accelerated XGBoost Engine</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Operational Theater Stress & Mission Survivability Simulator
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
              Inject aerodynamic and environmental extremes before flight authorization. Evaluates compressor thermodynamic 
              shifts, sand/dust erosion multipliers, and high-G combat turns to predict accelerated wear and survivability.
            </p>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={simulating}
            className="uiverse-btn-primary !px-5 !py-2.5"
          >
            <Play className={`w-4 h-4 ${simulating ? 'animate-spin' : 'fill-slate-950'}`} />
            <span>{simulating ? 'Computing Dynamics...' : 'Execute Stress Simulation'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Controls vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter Configuration (5 cols) */}
        <div className="lg:col-span-5 uiverse-card p-6 space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Sortie Stress Parameters
            </h3>
          </div>

          {/* Select Platform */}
          <div>
            <label className="block text-xs font-mono font-medium text-slate-400 mb-2">
              TARGET PLATFORM AIRFRAME
            </label>
            <select
              value={selectedAssetCode}
              onChange={e => setSelectedAssetCode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono shadow-inner"
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
            <label className="block text-xs font-mono font-medium text-slate-400 mb-2">
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
                    className={`p-3 rounded-xl text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'uiverse-tab-active'
                        : 'uiverse-tab-inactive'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1.5">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-mono font-bold">{p.name.split(' ')[0]}</span>
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
              <span className="font-mono font-bold text-emerald-400 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-700">
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
              className="w-full"
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
              <span className="font-mono font-bold text-amber-400 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-700">
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
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1.5">
              <span>1.0G (Transit)</span>
              <span>5.0G (Tactical)</span>
              <span>9.0G (Max Turn)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Simulation Output & Physics Telemetry (7 cols) */}
        <div className="lg:col-span-7 uiverse-card p-6 flex flex-col justify-between space-y-6">
          {error && (
            <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 text-xs text-rose-300 font-mono">
              {error}
            </div>
          )}

          {!result ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-400 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shadow-inner">
                <Activity className="w-7 h-7" />
              </div>
              <p className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Digital Twin Ready for Physics Excursion
              </p>
              <p className="text-[11px] max-w-sm font-sans">
                Select theater profile and sortie parameters on the left, then click{' '}
                <strong className="text-emerald-400">"Execute Stress Simulation"</strong> to evaluate component degradation.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Top Banner: Survivability Gauge */}
              <div className={`rounded-xl p-5 border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isSurvivable
                  ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  : 'bg-rose-950/30 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
              }`}>
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold font-mono border ${
                    isSurvivable
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                  }`}>
                    {survivability}%
                  </div>
                  <div>
                    <h4 className="text-sm font-mono font-bold text-white tracking-wide">
                      {isSurvivable ? 'SURVIVABILITY: AUTHORIZED FOR SORTIE' : 'CRITICAL: MISSION ABORT RECOMMENDED'}
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5 font-mono">
                      Target: <strong className="text-white">{result.asset_code}</strong> ({result.asset_name})
                    </p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                  isSurvivable 
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                    : 'bg-rose-600 text-white shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse'
                }`}>
                  {isSurvivable ? 'CLEARED' : 'UNSAFE'}
                </span>
              </div>

              {/* Telemetry Metrics 4-Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl shadow-inner">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Wear Factor</p>
                  <p className="text-lg font-bold font-mono text-amber-400 mt-1">
                    {result.wear_acceleration_multiplier}x
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">vs ISA Standard</p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl shadow-inner">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">EGT Spike</p>
                  <p className="text-lg font-bold font-mono text-rose-400 mt-1">
                    +{result.projected_egt_spike_deg_r}°R
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Exhaust Gas Temp Delta</p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl shadow-inner">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Nominal Base RUL</p>
                  <p className="text-lg font-bold font-mono text-slate-300 mt-1">
                    {result.nominal_predicted_rul} hrs
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Baseline Life</p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl shadow-inner">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Stressed RUL</p>
                  <p className={`text-lg font-bold font-mono mt-1 ${
                    result.effective_theater_rul < durationHours ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {result.effective_theater_rul} hrs
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Theater Residual</p>
                </div>
              </div>

              {/* Tactical Operations Advisory */}
              <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 shadow-inner">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-white mb-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  <span>TACTICAL OPERATIONS DIRECTIVE</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
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
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (durationHours / result.effective_theater_rul) > 0.85
                        ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                        : (durationHours / result.effective_theater_rul) > 0.5
                        ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                        : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
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
