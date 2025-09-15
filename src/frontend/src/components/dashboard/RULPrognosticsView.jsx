import React, { useState } from 'react'
import { SectionHeader, StatusBadge, LoadingState, ErrorState, EmptyState } from './Shared.jsx'

export default function RULPrognosticsView({ assets, predictions, loadingData, dataError, onRefresh, onOpenCopilot }) {
  const [riskFilter, setRiskFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  if (loadingData) return <LoadingState message="Loading RUL prognostics from XGBoost model..." />
  if (dataError) return <ErrorState message={dataError} onRetry={onRefresh} />

  const filtered = predictions.filter(p => {
    const matchRisk = riskFilter === 'ALL' || p.risk_level === riskFilter
    const matchSearch = !search || (p.asset_code || '').toLowerCase().includes(search.toLowerCase()) || (p.component_name || '').toLowerCase().includes(search.toLowerCase())
    return matchRisk && matchSearch
  })

  const critCount = predictions.filter(p => p.risk_level === 'CRITICAL').length
  const highCount = predictions.filter(p => p.risk_level === 'HIGH').length
  const failCount = predictions.filter(p => p.fails_before_mission).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader
        tag="NASA C-MAPSS · XGBoost CUDA"
        label="GPU-Accelerated RUL Prognostics"
        desc="Remaining Useful Life forecasts for all tracked components. Trained on NASA C-MAPSS turbofan degradation benchmark. Holdout RMSE: 18.21 cycles."
      />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1, background: '#494949' }}>
        {[
          { label: 'Total Predictions', value: predictions.length, color: '#FFC000' },
          { label: 'Critical Risk', value: critCount, color: '#EF4444' },
          { label: 'High Risk', value: highCount, color: '#F59E0B' },
          { label: 'Mission Conflicts', value: failCount, color: '#EF4444' },
          { label: 'Model RMSE', value: '18.21', color: '#29ABE2', sub: 'cycles (holdout)' },
          { label: 'Model Version', value: 'xgb-v1.0', color: '#22C55E', sub: 'CUDA accelerated' },
        ].map(s => (
          <div key={s.label} style={{ padding: '16px 18px', background: '#202020' }}>
            <p style={{ fontSize: 9, color: '#7D7D7D', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace', margin: 0, marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono, monospace', margin: 0, lineHeight: 1 }}>{s.value}</p>
            {s.sub && <p style={{ fontSize: 9, color: '#494949', fontFamily: 'JetBrains Mono, monospace', margin: 0, marginTop: 2 }}>{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <input
          className="input-dark"
          style={{ flex: '1 1 200px', maxWidth: 320 }}
          placeholder="Search asset code or component..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', border: '1px solid #494949' }}>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(r => (
            <button key={r}
              onClick={() => setRiskFilter(r)}
              style={{
                padding: '8px 12px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: riskFilter === r ? '#FFC000' : '#181818',
                color: riskFilter === r ? '#000' : '#7D7D7D',
                border: 'none', cursor: 'pointer', borderRight: r !== 'LOW' ? '1px solid #494949' : 'none', transition: 'background-color 0.2s, color 0.2s',
              }}
            >{r}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No predictions match filters" desc="Adjust risk filter or search query. All predictions come from the XGBoost model loaded from ml/weights/." />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ASSET CODE</th>
                <th>COMPONENT</th>
                <th>PREDICTED RUL (hrs)</th>
                <th>95% CONFIDENCE INTERVAL</th>
                <th>RISK LEVEL</th>
                <th>ANOMALY SCORE</th>
                <th>MISSION CONFLICT</th>
                <th>DIAGNOSTIC NOTE</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const fails = p.fails_before_mission || p.predicted_rul <= 48
                const rulColor = p.risk_level === 'CRITICAL' ? '#EF4444' : p.risk_level === 'HIGH' ? '#F59E0B' : '#22C55E'
                return (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#FFC000' }}>{p.asset_code || `#${p.component_id}`}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{p.component_name || '—'}</div>
                      <div style={{ fontSize: 10, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace' }}>{p.component_type}</div>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 16, color: rulColor }}>
                      {p.predicted_rul}
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#7D7D7D' }}>
                      [{p.confidence_interval_lower} – {p.confidence_interval_upper}]
                    </td>
                    <td><span className={`badge badge-${p.risk_level.toLowerCase()}`}>{p.risk_level}</span></td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: p.anomaly_score > 0.7 ? '#EF4444' : '#7D7D7D' }}>
                      {p.anomaly_score?.toFixed(3)}
                    </td>
                    <td>
                      {fails ? (
                        <span className="badge badge-nmc">⚠ WINDOW CONFLICT</span>
                      ) : (
                        <span className="badge badge-fmc">✓ CLEAR</span>
                      )}
                    </td>
                    <td style={{ fontSize: 11, color: '#7D7D7D', maxWidth: 260 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.explanation}>
                        {p.explanation || '—'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Model info footer */}
      <div style={{ padding: '12px 16px', background: '#181818', border: '1px solid #2A2A2A', fontSize: 10, color: '#494949', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.8 }}>
        MODEL: XGBoost (CUDA GPU) · TRAINING DATA: NASA C-MAPSS FD001–FD004 Turbofan Run-to-Failure Benchmark · HOLDOUT RMSE: 18.21 CYCLES · VERSION: xgb-v1.0-cuda · ANOMALY DETECTION: Isolation Forest (sklearn)
      </div>
    </div>
  )
}
