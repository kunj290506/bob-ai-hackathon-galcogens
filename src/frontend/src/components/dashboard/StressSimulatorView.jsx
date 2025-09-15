import React, { useState } from 'react'
import { Play, Flame, Wind, Activity, Thermometer, AlertTriangle, CheckCircle } from 'lucide-react'
import { SectionHeader, LoadingState, ErrorState } from './Shared.jsx'

const PROFILES = [
  { id: 'DESERT_HEAT', label: 'Desert Heat +45°C', icon: Flame, desc: 'High ambient temp, elevated TIT, low air density. Wear multiplier: 1.45×', color: '#EF4444' },
  { id: 'SAND_DUST_INGESTION', label: 'Sand & Dust Ingestion', icon: Wind, desc: 'Compressor blade erosion, cooling channel occlusion. Wear multiplier: 1.80×', color: '#F59E0B' },
  { id: 'COMBAT_HIGH_G', label: 'High-G Combat Turns (9G)', icon: Activity, desc: 'Sustained afterburner, thermomechanical fatigue. Wear multiplier: 1.60×', color: '#EF4444' },
  { id: 'ARCTIC_COLD', label: 'Sub-Zero Arctic Soak', icon: Thermometer, desc: 'Hydraulic viscosity, cold-start thermal shock, elastomer contraction. Wear multiplier: 1.15×', color: '#29ABE2' },
]

export default function StressSimulatorView({ assets, loadingData, dataError, onRefresh, authHeader }) {
  const [selectedAsset, setSelectedAsset] = useState(assets[0]?.asset_code || '')
  const [profile, setProfile] = useState('DESERT_HEAT')
  const [duration, setDuration] = useState(4.0)
  const [gRating, setGRating] = useState(7.0)
  const [simulating, setSimulating] = useState(false)
  const [result, setResult] = useState(null)
  const [simError, setSimError] = useState(null)

  if (loadingData) return <LoadingState />
  if (dataError && !assets.length) return <ErrorState message={dataError} onRetry={onRefresh} />

  const runSimulation = async () => {
    if (!selectedAsset) { setSimError('Select a target platform to simulate.'); return }
    setSimulating(true)
    setSimError(null)
    setResult(null)
    try {
      const res = await fetch('/api/v1/copilot/simulate-stress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          asset_code: selectedAsset,
          mission_profile: profile,
          sortie_duration_hours: parseFloat(duration),
          sortie_g_rating: parseFloat(gRating)
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Simulation failed: ${res.status}`)
      }
      setResult(await res.json())
    } catch (e) {
      setSimError(e.message || 'Simulation backend error. Ensure FastAPI server is running.')
    } finally {
      setSimulating(false)
    }
  }

  const survivalPct = result?.mission_survivability_probability ?? 0
  const isGo        = result?.is_mission_survivable ?? false
  const survColor   = survivalPct >= 80 ? '#22C55E' : survivalPct >= 60 ? '#F59E0B' : '#EF4444'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader
        tag="PHYSICS-INFORMED DIGITAL TWIN"
        label="Sortie Stress & Mission Survivability Simulator"
        desc="Evaluates thermodynamic shifts, particulate erosion, and high-G combat maneuvers against component RUL before flight authorization. Backend computes wear multipliers — not client-side estimates."
        action={
          <button className="btn-gold" onClick={runSimulation} disabled={simulating} style={{ minWidth: 200 }}>
            <Play size={15} />
            {simulating ? 'COMPUTING DYNAMICS...' : 'EXECUTE SIMULATION'}
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Configuration panel */}
        <div className="panel" style={{ padding: '24px' }}>
          <p className="label-upper" style={{ marginBottom: 20 }}>SORTIE PARAMETERS</p>

          {/* Platform selector */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 10, color: '#7D7D7D', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>TARGET AIRFRAME</p>
            <select
              className="select-dark"
              value={selectedAsset}
              onChange={e => setSelectedAsset(e.target.value)}
            >
              {assets.map(a => (
                <option key={a.id} value={a.asset_code}>{a.asset_code} — {a.name} ({a.status})</option>
              ))}
            </select>
          </div>

          {/* Theater preset cards */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 10, color: '#7D7D7D', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>ENVIRONMENTAL THEATER</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {PROFILES.map(p => {
                const Icon = p.icon
                const selected = profile === p.id
                return (
                  <button key={p.id} onClick={() => setProfile(p.id)}
                    style={{
                      padding: '12px', background: selected ? '#202020' : '#181818',
                      border: `1px solid ${selected ? p.color : '#2A2A2A'}`,
                      cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s'
                    }}
                  >
                    <Icon size={14} color={selected ? p.color : '#7D7D7D'} style={{ marginBottom: 6 }} />
                    <p style={{ fontSize: 10, fontWeight: 700, color: selected ? '#fff' : '#7D7D7D', margin: 0, marginBottom: 2 }}>{p.label}</p>
                    <p style={{ fontSize: 9, color: '#494949', margin: 0, lineHeight: 1.4 }}>{p.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sliders */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: 10, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>SORTIE DURATION</p>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#FFC000', fontFamily: 'JetBrains Mono, monospace', background: '#202020', padding: '2px 8px', border: '1px solid #494949' }}>{duration}h</span>
            </div>
            <input type="range" min="1" max="12" step="0.5" value={duration} onChange={e => setDuration(e.target.value)} style={{ width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#494949', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
              <span>1h Strike</span><span>6h Patrol</span><span>12h Endurance</span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: 10, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>PEAK G-ENVELOPE</p>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#FFC000', fontFamily: 'JetBrains Mono, monospace', background: '#202020', padding: '2px 8px', border: '1px solid #494949' }}>{gRating}G</span>
            </div>
            <input type="range" min="1" max="9" step="0.5" value={gRating} onChange={e => setGRating(e.target.value)} style={{ width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#494949', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
              <span>1G Transit</span><span>5G Tactical</span><span>9G Max Turn</span>
            </div>
          </div>
        </div>

        {/* Results panel */}
        <div className="panel" style={{ padding: '24px' }}>
          <p className="label-upper" style={{ marginBottom: 20 }}>SIMULATION OUTPUT</p>

          {simError && (
            <div style={{ padding: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: '#EF4444', margin: 0 }}>⚠ {simError}</p>
            </div>
          )}

          {!result && !simulating && !simError && (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#494949', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                CONFIGURE PARAMETERS AND EXECUTE SIMULATION
              </p>
              <p style={{ fontSize: 10, color: '#2A2A2A', marginTop: 4 }}>Physics-informed wear model computes accelerated degradation</p>
            </div>
          )}

          {simulating && (
            <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div className="spinner" />
              <p style={{ fontSize: 10, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }}>
                INJECTING THEATER TELEMETRY INTO XGBoost RUL MODEL...
              </p>
            </div>
          )}

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* GO/NO-GO */}
              <div style={{ padding: '16px', background: isGo ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${isGo ? '#22C55E40' : '#EF444440'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {isGo ? <CheckCircle size={24} color="#22C55E" /> : <AlertTriangle size={24} color="#EF4444" />}
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 800, color: isGo ? '#22C55E' : '#EF4444', fontFamily: 'JetBrains Mono, monospace', margin: 0, letterSpacing: '0.08em' }}>
                      {isGo ? 'SORTIE APPROVED' : 'SORTIE DENIED'}
                    </p>
                    <p style={{ fontSize: 11, color: '#7D7D7D', margin: 0 }}>{result.tactical_recommendation}</p>
                  </div>
                </div>
              </div>

              {/* Key metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: '#494949' }}>
                {[
                  { label: 'Survivability', value: `${survivalPct?.toFixed(1)}%`, color: survColor },
                  { label: 'Wear Multiplier', value: `${result.wear_acceleration_multiplier?.toFixed(2)}×`, color: '#F59E0B' },
                  { label: 'Nominal RUL', value: `${result.nominal_predicted_rul?.toFixed(1)}h`, color: '#FFC000' },
                  { label: 'Effective Theater RUL', value: `${result.effective_theater_rul?.toFixed(1)}h`, color: survColor },
                  { label: 'EGT Spike', value: `+${result.projected_egt_spike_deg_r?.toFixed(0)}°R`, color: '#EF4444' },
                  { label: 'Mission Profile', value: result.mission_profile?.replace(/_/g, ' '), color: '#29ABE2' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '12px 16px', background: '#202020' }}>
                    <p style={{ fontSize: 9, color: '#7D7D7D', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace', margin: 0, marginBottom: 4 }}>{s.label}</p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono, monospace', margin: 0, lineHeight: 1, wordBreak: 'break-word' }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Survivability bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <p style={{ fontSize: 9, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>MISSION SURVIVABILITY PROBABILITY</p>
                  <p style={{ fontSize: 13, fontWeight: 800, color: survColor, fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>{survivalPct?.toFixed(1)}%</p>
                </div>
                <div style={{ height: 8, background: '#181818', border: '1px solid #494949' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, survivalPct)}%`, background: survColor, transition: 'width 0.7s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#494949', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
                  <span>0% CATASTROPHIC FAILURE</span>
                  <span>80% GO/NO-GO THRESHOLD</span>
                  <span>100% SAFE</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
