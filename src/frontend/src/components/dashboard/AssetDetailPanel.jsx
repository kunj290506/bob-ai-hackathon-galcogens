import React, { useState, useEffect } from 'react'
import { X, Cpu, Wrench, FileText, ChevronRight } from 'lucide-react'
import { StatusBadge, ReadinessBar, LoadingState, ErrorState } from './Shared.jsx'

export default function AssetDetailPanel({ assetCode, onClose, onOpenCopilot, authHeader }) {
  const [asset, setAsset] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [history, setHistory] = useState([])
  const [explanation, setExplanation] = useState(null)
  const [loadingExpl, setLoadingExpl] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('components')

  useEffect(() => {
    if (!assetCode) return
    setLoading(true)
    setError(null)
    Promise.all([
      fetch(`/api/v1/fleet/assets/${assetCode}`,       { headers: authHeader }),
      fetch(`/api/v1/predictions/asset/${assetCode}`,  { headers: authHeader }),
      fetch(`/api/v1/maintenance/history/${assetCode}`, { headers: authHeader }),
    ]).then(async ([aRes, pRes, hRes]) => {
      if (aRes.ok) setAsset(await aRes.json())
      else throw new Error('Asset not found')
      if (pRes.ok) setPredictions(await pRes.json())
      if (hRes.ok) setHistory(await hRes.json())
    }).catch(e => setError(e.message))
     .finally(() => setLoading(false))
  }, [assetCode])

  const handleExplain = async () => {
    setLoadingExpl(true)
    try {
      const res = await fetch(`/api/v1/copilot/explain/${assetCode}`, { headers: authHeader })
      const data = await res.json()
      setExplanation(data.explanation || data.detail || 'No explanation returned.')
    } catch {
      setExplanation('Unable to reach watsonx.ai service. Check IBM Cloud credentials or offline Granite mode.')
    } finally {
      setLoadingExpl(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: 0 }}>
      <div style={{ width: '100%', maxWidth: 640, height: '100vh', background: '#181818', borderLeft: '1px solid #494949', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
           className="animate-slide-down">

        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #494949', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#202020', flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 9, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>PLATFORM DIAGNOSTIC</p>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em' }}>{assetCode}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7D7D7D', padding: 4 }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {loading && <LoadingState message="Loading platform diagnostics..." />}
        {error && <ErrorState message={error} />}

        {asset && !loading && (
          <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Asset overview */}
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, textTransform: 'uppercase' }}>{asset.name}</p>
                <p style={{ fontSize: 11, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
                  {asset.model} · {asset.squadron} · {asset.base_location}
                </p>
              </div>
              <StatusBadge status={asset.status} />
            </div>

            <ReadinessBar score={asset.readiness_score} status={asset.status} />

            {/* Quick stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#494949' }}>
              {[
                { label: 'Flight Hours', value: asset.total_flight_hours?.toFixed(0) },
                { label: 'Total Cycles', value: asset.total_cycles },
                { label: 'Last Maintenance', value: asset.last_maintenance_date ? new Date(asset.last_maintenance_date).toLocaleDateString() : 'N/A' },
              ].map(s => (
                <div key={s.label} style={{ padding: '12px 16px', background: '#202020' }}>
                  <p style={{ fontSize: 9, color: '#7D7D7D', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace', margin: 0, marginBottom: 4 }}>{s.label}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #494949', gap: 0 }}>
              {['components', 'predictions', 'history', 'granite'].map(t => (
                <button key={t}
                  className={`nav-tab${activeTab === t ? ' active' : ''}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Tab: Components */}
            {activeTab === 'components' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {asset.components?.length === 0 && (
                  <p style={{ color: '#7D7D7D', fontSize: 11, textAlign: 'center', padding: '20px 0' }}>No component data available.</p>
                )}
                {asset.components?.map(comp => {
                  const riskColor = comp.risk_level === 'CRITICAL' ? '#EF4444' : comp.risk_level === 'HIGH' ? '#F59E0B' : comp.risk_level === 'MEDIUM' ? '#29ABE2' : '#22C55E'
                  return (
                    <div key={comp.id} style={{ padding: '14px 16px', background: '#202020', border: `1px solid ${comp.risk_level === 'CRITICAL' ? '#EF444430' : '#2A2A2A'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0 }}>{comp.name}</p>
                          <p style={{ fontSize: 10, color: '#7D7D7D', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>P/N: {comp.part_number} · S/N: {comp.serial_number}</p>
                        </div>
                        <span className={`badge badge-${comp.risk_level.toLowerCase()}`}>{comp.risk_level}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 11 }}>
                        <div>
                          <p style={{ fontSize: 9, color: '#7D7D7D', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>PRED. RUL</p>
                          <p style={{ fontSize: 14, fontWeight: 800, color: riskColor, fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>{comp.current_rul}h</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 9, color: '#7D7D7D', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>OPS HRS</p>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>{comp.total_operating_hours?.toFixed(0)}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 9, color: '#7D7D7D', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>STATUS</p>
                          <p style={{ fontSize: 11, fontWeight: 600, color: '#F5F5F5', margin: 0 }}>{comp.status}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Tab: Predictions */}
            {activeTab === 'predictions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {predictions.length === 0 ? (
                  <p style={{ color: '#22C55E', fontSize: 11, textAlign: 'center', padding: '20px 0', fontFamily: 'JetBrains Mono, monospace' }}>
                    NO FAILURE PREDICTIONS — PLATFORM WITHIN NORMAL OPERATING PARAMETERS
                  </p>
                ) : predictions.map((p, i) => (
                  <div key={i} style={{ padding: '14px 16px', background: '#202020', border: '1px solid #2A2A2A' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0 }}>{p.component_name}</p>
                      <span className={`badge badge-${p.risk_level.toLowerCase()}`}>{p.risk_level}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                      <div>
                        <p style={{ fontSize: 9, color: '#7D7D7D', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>PREDICTED RUL</p>
                        <p style={{ fontSize: 16, fontWeight: 800, color: p.fails_before_mission ? '#EF4444' : '#22C55E', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>{p.predicted_rul}h</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 9, color: '#7D7D7D', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>95% CI</p>
                        <p style={{ fontSize: 11, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>[{p.confidence_bounds?.[0]}–{p.confidence_bounds?.[1]}]</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 9, color: '#7D7D7D', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>MISSION RISK</p>
                        <p style={{ fontSize: 11, fontWeight: 700, color: p.fails_before_mission ? '#EF4444' : '#22C55E', margin: 0 }}>
                          {p.fails_before_mission ? '⚠ FAILS BEFORE MISSION' : '✓ CLEAR'}
                        </p>
                      </div>
                    </div>
                    {p.explanation && (
                      <p style={{ fontSize: 10, color: '#7D7D7D', margin: 0, lineHeight: 1.6, borderTop: '1px solid #2A2A2A', paddingTop: 8 }}>{p.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tab: History */}
            {activeTab === 'history' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.length === 0 ? (
                  <p style={{ color: '#7D7D7D', fontSize: 11, textAlign: 'center', padding: '20px 0' }}>No maintenance history records found for this platform.</p>
                ) : history.map(h => (
                  <div key={h.id} style={{ padding: '14px 16px', background: '#202020', border: '1px solid #2A2A2A' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: 0 }}>{h.title}</p>
                      <span style={{ fontSize: 10, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace' }}>{new Date(h.completed_at).toLocaleDateString()}</span>
                    </div>
                    <p style={{ fontSize: 10, color: '#7D7D7D', margin: 0, marginBottom: 4 }}>{h.description}</p>
                    <p style={{ fontSize: 10, color: '#494949', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
                      {h.maintenance_type} · {h.performed_by} · {h.downtime_hours}h downtime
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Granite Diagnostics */}
            {activeTab === 'granite' && (
              <div>
                <div style={{ padding: '16px', background: '#202020', border: '1px solid #494949', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Cpu size={14} color="#A855F7" />
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#A855F7', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        watsonx.ai Granite 3-8B Diagnostic
                      </p>
                    </div>
                    {!explanation && (
                      <button className="btn-ghost-sm" onClick={handleExplain} disabled={loadingExpl}>
                        {loadingExpl ? 'ANALYZING...' : 'GENERATE EXPLANATION'}
                      </button>
                    )}
                  </div>
                  {explanation ? (
                    <p style={{ fontSize: 11, color: '#F5F5F5', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{explanation}</p>
                  ) : loadingExpl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
                      <div className="spinner" style={{ width: 16, height: 16, borderWidth: 1.5 }} />
                      <p style={{ fontSize: 10, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
                        Querying IBM Granite 3-8B Instruct for root-cause analysis...
                      </p>
                    </div>
                  ) : (
                    <p style={{ fontSize: 11, color: '#494949', margin: 0 }}>
                      Click "Generate Explanation" to query IBM watsonx.ai Granite 3-8B for a natural-language root-cause diagnostic report. If no IBM Cloud credentials are present, the offline Granite simulation engine will be used instead — labeled on the response.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid #2A2A2A' }}>
              <button className="btn-ghost-sm" onClick={() => onOpenCopilot(`Investigate full failure mode and maintenance requirements for ${assetCode}`)}>
                Ask Bob Copilot
              </button>
              <button className="btn-gold-sm" onClick={onClose}>
                Close Diagnostic
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
