import React, { useState } from 'react'
import { Target, ChevronRight } from 'lucide-react'
import { SectionHeader, StatusBadge, ReadinessBar, LoadingState, ErrorState, EmptyState } from './Shared.jsx'
import AssetDetailPanel from './AssetDetailPanel.jsx'

export default function ReadinessEngineView({ assets, summary, loadingData, dataError, onRefresh, onOpenCopilot, authHeader }) {
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [selectedAsset, setSelectedAsset] = useState(null)

  if (loadingData) return <LoadingState message="Computing airworthiness from backend readiness engine..." />
  if (dataError) return <ErrorState message={dataError} onRetry={onRefresh} />

  const filtered = filterStatus === 'ALL' ? assets : assets.filter(a => a.status === filterStatus)
  const fmcCount = assets.filter(a => a.status === 'FMC').length
  const pmcCount = assets.filter(a => a.status === 'PMC').length
  const nmcCount = assets.filter(a => a.status === 'NMC').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader
        tag="CBM+ CORE · FMC/PMC/NMC CLASSIFICATION"
        label="Fleet Readiness Engine"
        desc="Per-subsystem airworthiness (propulsion, gearboxes, hydraulics, radar) evaluated against mission deployment horizons. Scores from backend weighted degradation formula."
      />

      {/* Readiness summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 1, background: '#494949' }}>
        {[
          { label: 'Fleet Readiness Index', value: `${summary?.fmc_percentage ?? 0}%`, color: '#FFC000' },
          { label: 'Fully Mission Capable',  value: fmcCount, color: '#22C55E', sub: `Score ≥ 85% · No critical issues` },
          { label: 'Partially Capable',      value: pmcCount, color: '#F59E0B', sub: `Score 50–84% · Degraded subsystems` },
          { label: 'Non-Mission Capable',    value: nmcCount, color: '#EF4444', sub: `Score < 50% · Imminent failure` },
          { label: 'Mission Ready Rate',     value: `${summary?.mission_ready_rate?.toFixed(1) ?? 0}%`, color: '#29ABE2' },
        ].map(s => (
          <div key={s.label} style={{ padding: '16px 18px', background: '#202020' }}>
            <p style={{ fontSize: 9, color: '#7D7D7D', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace', margin: 0, marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono, monospace', margin: 0, lineHeight: 1 }}>{s.value}</p>
            {s.sub && <p style={{ fontSize: 9, color: '#494949', fontFamily: 'JetBrains Mono, monospace', margin: 0, marginTop: 2 }}>{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Scoring legend */}
      <div style={{ padding: '12px 16px', background: '#181818', border: '1px solid #2A2A2A', fontSize: 10, color: '#494949', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.8 }}>
        SCORING: FMC = score ≥ 85% AND no critical issues · PMC = 50–84% OR critical secondary systems · NMC = score &lt; 50% OR critical propulsion/rotor failure ·
        COMPONENT WEIGHTS: Turbofan Engine 1.0× · Rotor Gearbox 1.0× · Fuel Pump 0.90× · Hydraulic Actuator 0.85× · Avionics/Radar 0.65× ·
        PENALTIES: CRITICAL −45pt × weight · HIGH −25pt · MEDIUM −12pt
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', border: '1px solid #494949', width: 'fit-content' }}>
        {['ALL', 'FMC', 'PMC', 'NMC'].map(s => (
          <button key={s}
            onClick={() => setFilterStatus(s)}
            style={{
              padding: '8px 20px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              background: filterStatus === s ? '#FFC000' : '#181818',
              color: filterStatus === s ? '#000' : '#7D7D7D',
              border: 'none', cursor: 'pointer', borderRight: s !== 'NMC' ? '1px solid #494949' : 'none', transition: 'background-color 0.2s, color 0.2s',
            }}
          >
            {s}{s !== 'ALL' ? ` (${s === 'FMC' ? fmcCount : s === 'PMC' ? pmcCount : nmcCount})` : ` (${assets.length})`}
          </button>
        ))}
      </div>

      {/* Asset cards */}
      {filtered.length === 0 ? (
        <EmptyState title="No platforms match filter" desc="Change the status filter above to see platforms." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
          {filtered.map(a => (
            <div key={a.id}
              style={{ padding: '16px', background: '#202020', border: `1px solid ${a.status === 'NMC' ? '#EF444430' : a.status === 'PMC' ? '#F59E0B30' : '#2A2A2A'}`, cursor: 'pointer', transition: 'border-color 0.2s' }}
              onClick={() => setSelectedAsset(a.asset_code)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#FFC000', fontFamily: 'JetBrains Mono, monospace' }}>{a.asset_code}</span>
                <StatusBadge status={a.status} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0, marginBottom: 2 }}>{a.name}</p>
              <p style={{ fontSize: 10, color: '#7D7D7D', margin: 0, marginBottom: 12 }}>{a.model} · {a.squadron}</p>
              <ReadinessBar score={a.readiness_score} status={a.status} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid #2A2A2A' }}>
                <span style={{ fontSize: 10, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace' }}>{a.total_flight_hours?.toFixed(0)} FLT HRS</span>
                <span style={{ fontSize: 10, color: '#7D7D7D', display: 'flex', alignItems: 'center', gap: 4 }}>Inspect <ChevronRight size={11} /></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAsset && (
        <AssetDetailPanel
          assetCode={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onOpenCopilot={onOpenCopilot}
          authHeader={authHeader}
        />
      )}
    </div>
  )
}
