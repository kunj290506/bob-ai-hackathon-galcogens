import React from 'react'
import { SectionHeader, LoadingState, ErrorState, EmptyState } from './Shared.jsx'
import { Target } from 'lucide-react'

export default function MissionsView({ missions, loadingData, dataError, onRefresh }) {
  if (loadingData) return <LoadingState />
  if (dataError) return <ErrorState message={dataError} onRetry={onRefresh} />

  const missionTypeColor = {
    COMBAT_AIR_PATROL: '#EF4444',
    CAS: '#F59E0B',
    CLOSE_AIR_SUPPORT: '#F59E0B',
    STRATEGIC_TRANSPORT: '#29ABE2',
    RECONNAISSANCE: '#22C55E',
    ISR: '#22C55E',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader
        tag="AIR TASKING ORDERS"
        label="Active Mission Windows"
        desc="Upcoming deployment windows with asset commitment requirements and minimum FMC readiness thresholds for launch authorization."
      />

      {missions.length === 0 ? (
        <EmptyState title="No active missions" desc="No mission windows are currently scheduled. The backend seeds three default missions on startup." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 1, background: '#494949' }}>
          {missions.map(m => {
            const accentColor = missionTypeColor[m.mission_type] || '#FFC000'
            const launchDate = new Date(m.start_time)
            const endDate = new Date(m.end_time)
            const hoursUntil = Math.round((launchDate - Date.now()) / 3600000)
            return (
              <div key={m.id} style={{ padding: '24px', background: '#202020', borderLeft: `3px solid ${accentColor}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 10, color: accentColor, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {m.mission_type?.replace(/_/g, ' ')}
                  </span>
                  <span className={`badge badge-${m.priority.toLowerCase()}`}>{m.priority}</span>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', textTransform: 'uppercase', margin: 0, marginBottom: 8 }}>{m.title}</h3>
                <p style={{ fontSize: 11, color: '#7D7D7D', margin: 0, marginBottom: 16, lineHeight: 1.6 }}>{m.description}</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: 9, color: '#7D7D7D', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>ASSET COMMITMENT</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
                      {m.required_assets_count}× {m.required_asset_type?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 9, color: '#7D7D7D', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>MIN FMC GATE</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#22C55E', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
                      {m.minimum_readiness_threshold}%
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 9, color: '#7D7D7D', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>LAUNCH</p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
                      {launchDate.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 9, color: '#7D7D7D', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>TIME TO LAUNCH</p>
                    <p style={{ fontSize: 11, fontWeight: 700, color: hoursUntil < 48 ? '#EF4444' : hoursUntil < 72 ? '#F59E0B' : '#22C55E', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
                      {hoursUntil > 0 ? `T-${hoursUntil}h` : `LAUNCHED +${Math.abs(hoursUntil)}h`}
                    </p>
                  </div>
                </div>

                <div style={{ paddingTop: 12, borderTop: '1px solid #2A2A2A' }}>
                  <p style={{ fontSize: 10, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
                    WINDOW: {launchDate.toLocaleDateString()} → {endDate.toLocaleDateString()}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
