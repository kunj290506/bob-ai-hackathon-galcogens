import React, { useState, useEffect } from 'react'
import { FileText, Printer, CheckCircle, AlertTriangle, X, Wrench } from 'lucide-react'
import { SectionHeader, StatusBadge, LoadingState, ErrorState } from './Shared.jsx'

function MilFormModal({ assetCode, onClose, authHeader }) {
  const [formData, setFormData] = useState(null)
  const [sortieData, setSortieData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('form781')

  useEffect(() => {
    if (!assetCode) return
    setLoading(true)
    setError(null)
    Promise.all([
      fetch(`/api/v1/copilot/form-781a/${assetCode}`,   { headers: authHeader }),
      fetch(`/api/v1/copilot/sortie-matrix/${assetCode}`, { headers: authHeader }),
    ]).then(async ([fRes, sRes]) => {
      if (fRes.ok) setFormData(await fRes.json())
      else { const e = await fRes.json().catch(() => ({})); throw new Error(e.detail || 'Form generation failed') }
      if (sRes.ok) setSortieData(await sRes.json())
    }).catch(e => setError(e.message))
     .finally(() => setLoading(false))
  }, [assetCode])

  const isRedX    = formData?.discrepancy_block?.symbol === 'RED_X'
  const isRedDiag = formData?.discrepancy_block?.symbol === 'RED_DIAGONAL'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 860, maxHeight: '92vh', background: '#181818', border: '1px solid #494949', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
           className="animate-slide-down">

        {/* Modal header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #494949', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#202020', flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 9, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              MIL-STD-1388 / T.O. 00-20-1
            </p>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', textTransform: 'uppercase', margin: 0 }}>{assetCode}</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost-sm" onClick={() => window.print()}><Printer size={12} /> Print</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7D7D7D', padding: 4 }} aria-label="Close"><X size={20} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #494949', flexShrink: 0 }}>
          <button className={`nav-tab${activeTab === 'form781' ? ' active' : ''}`} onClick={() => setActiveTab('form781')}>
            AFTO Form 781A
          </button>
          <button className={`nav-tab${activeTab === 'sortie' ? ' active' : ''}`} onClick={() => setActiveTab('sortie')}>
            ATO Sortie Matrix
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading && <LoadingState message="Compiling defense discrepancy manifest..." />}
          {error && <ErrorState message={error} />}

          {/* AFTO 781A */}
          {!loading && !error && activeTab === 'form781' && formData && (
            <div style={{ fontFamily: 'JetBrains Mono, monospace', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Title banner */}
              <div style={{ borderBottom: '2px solid #494949', paddingBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>AFTO FORM 781A (DIGITAL EXPEDITIONARY)</p>
                  <p style={{ fontSize: 10, color: '#7D7D7D', margin: 0 }}>AEROSPACE VEHICLE MAINTENANCE DISCREPANCY & WORK DOCUMENT</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 9, color: '#7D7D7D', margin: 0 }}>JCN:</p>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#22C55E', margin: 0 }}>{formData.document_tracking_id}</p>
                  <p style={{ fontSize: 9, color: '#494949', margin: 0 }}>{formData.date_dispatched}</p>
                </div>
              </div>

              {/* Platform metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 1, background: '#494949' }}>
                {[
                  { label: 'TAIL / ASSET', value: formData.platform_data?.tail_number },
                  { label: 'MDS MODEL',    value: formData.platform_data?.mission_design_series },
                  { label: 'SERIAL NO.',   value: formData.platform_data?.serial_number },
                  { label: 'AIRWORTHINESS', value: formData.platform_data?.airworthiness_status },
                ].map(f => (
                  <div key={f.label} style={{ padding: '10px 14px', background: '#202020' }}>
                    <p style={{ fontSize: 9, color: '#7D7D7D', margin: 0, marginBottom: 4 }}>{f.label}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: f.label === 'AIRWORTHINESS' ? (isRedX ? '#EF4444' : isRedDiag ? '#F59E0B' : '#22C55E') : '#fff', margin: 0 }}>{f.value}</p>
                  </div>
                ))}
              </div>

              {/* Symbol + discrepancy */}
              <div style={{ border: '1px solid #494949', padding: '16px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, fontWeight: 900, flexShrink: 0,
                  background: isRedX ? 'rgba(239,68,68,0.15)' : isRedDiag ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                  border: `2px solid ${isRedX ? '#EF4444' : isRedDiag ? '#F59E0B' : '#22C55E'}`,
                  color: isRedX ? '#EF4444' : isRedDiag ? '#F59E0B' : '#22C55E',
                }}>
                  {formData.discrepancy_block?.symbol_display}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#F5F5F5', textTransform: 'uppercase', margin: 0 }}>
                      SYMBOL: {formData.discrepancy_block?.symbol_meaning}
                    </p>
                    <p style={{ fontSize: 10, color: '#7D7D7D', margin: 0 }}>BY: {formData.discrepancy_block?.reported_by}</p>
                  </div>
                  <p style={{ fontSize: 11, color: '#F5F5F5', lineHeight: 1.7, margin: 0 }}>
                    {formData.discrepancy_block?.discrepancy_narrative}
                  </p>
                </div>
              </div>

              {/* Corrective action */}
              <div style={{ border: '1px solid #494949', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid #2A2A2A', paddingBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Wrench size={13} color="#22C55E" />
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#22C55E', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>CORRECTIVE ACTION DIRECTIVE</p>
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#F5F5F5', margin: 0 }}>{formData.corrective_action_block?.action_code}</p>
                </div>
                <p style={{ fontSize: 11, color: '#F5F5F5', lineHeight: 1.7, marginBottom: 12 }}>
                  {formData.corrective_action_block?.corrective_narrative}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: 10, color: '#7D7D7D', borderTop: '1px solid #2A2A2A', paddingTop: 10 }}>
                  <div>WORK CENTER: <strong style={{ color: '#F5F5F5' }}>{formData.corrective_action_block?.work_center}</strong></div>
                  <div>EST. MAN-HRS: <strong style={{ color: '#F5F5F5' }}>{formData.corrective_action_block?.estimated_man_hours}h</strong></div>
                  <div>LEAD TECH: <strong style={{ color: '#F5F5F5' }}>{formData.corrective_action_block?.lead_technician}</strong></div>
                </div>
              </div>

              {/* NSN parts manifest */}
              <div>
                <p style={{ fontSize: 9, color: '#7D7D7D', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>DEFENSE LOGISTICS AGENCY (DLA) PARTS REQUISITION MANIFEST</p>
                <table className="data-table">
                  <thead>
                    <tr><th>NATIONAL STOCK NUMBER (NSN)</th><th>NOMENCLATURE</th><th>QTY</th><th>UNIT</th></tr>
                  </thead>
                  <tbody>
                    {formData.parts_manifest?.map((p, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: 'JetBrains Mono, monospace', color: '#29ABE2' }}>{p.nsn}</td>
                        <td style={{ fontWeight: 600, color: '#fff' }}>{p.part_name}</td>
                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{p.qty}</td>
                        <td style={{ color: '#7D7D7D' }}>{p.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ATO Sortie Matrix */}
          {!loading && !error && activeTab === 'sortie' && sortieData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '16px', background: '#202020', border: '1px solid #494949' }}>
                <p className="label-upper-gold" style={{ marginBottom: 6 }}>TACTICAL OPERATIONAL DISPOSITION</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#22C55E', margin: 0, marginBottom: 8 }}>{sortieData.tactical_disposition}</p>
                <p style={{ fontSize: 10, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
                  Lowest RUL: <strong style={{ color: '#fff' }}>{sortieData.lowest_subsystem_rul_hours}h</strong> ·
                  Cleared Profiles: <strong style={{ color: '#fff' }}>{sortieData.cleared_sortie_profiles_count}</strong>
                </p>
              </div>

              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#22C55E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>✓ APPROVED SORTIE PROFILES</p>
                {sortieData.cleared_sortie_profiles?.length === 0 ? (
                  <p style={{ fontSize: 11, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace' }}>No combat profiles authorized. Platform requires depot turnaround.</p>
                ) : sortieData.cleared_sortie_profiles?.map((p, i) => (
                  <div key={i} style={{ padding: '12px 16px', background: '#202020', border: '1px solid #22C55E30', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0 }}>{p.profile_name}</p>
                      <p style={{ fontSize: 10, color: '#7D7D7D', margin: 0 }}>Safety Margin: +{p.margin_hours}h · Stress: {p.stress_level}</p>
                    </div>
                    <span className="badge badge-fmc">CLEARED</span>
                  </div>
                ))}
              </div>

              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>⚠ RESTRICTED SORTIE PROFILES</p>
                {sortieData.restricted_sortie_profiles?.map((p, i) => (
                  <div key={i} style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0 }}>{p.profile_name}</p>
                      <p style={{ fontSize: 10, color: '#EF4444', margin: 0 }}>{p.reason}</p>
                    </div>
                    <span className="badge badge-nmc">RESTRICTED</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MilFormsView({ assets, loadingData, dataError, onRefresh, authHeader }) {
  const [selectedAsset, setSelectedAsset] = useState(null)

  if (loadingData) return <LoadingState />
  if (dataError) return <ErrorState message={dataError} onRetry={onRefresh} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader
        tag="MIL-STD-1388 / T.O. 00-20-1"
        label="AFTO Form 781A & ATO Sortie Re-allocation"
        desc="Digital AFTO 781A discrepancy sheets with real JCN tracking numbers, Red X (NMC) / Red Diagonal (PMC) military symbols, DLA NSN parts manifests, and ATO sortie re-allocation matrices."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
        {assets.map(a => {
          const borderColor = a.status === 'NMC' ? '#EF444430' : a.status === 'PMC' ? '#F59E0B30' : '#2A2A2A'
          return (
            <div key={a.id} style={{ padding: '16px', background: '#202020', border: `1px solid ${borderColor}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#FFC000', fontFamily: 'JetBrains Mono, monospace', background: '#181818', padding: '2px 8px', border: '1px solid #494949' }}>
                  {a.asset_code}
                </span>
                <StatusBadge status={a.status} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0, marginBottom: 2 }}>{a.name}</p>
              <p style={{ fontSize: 10, color: '#7D7D7D', margin: 0, marginBottom: 12 }}>{a.model} · {a.squadron}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #2A2A2A', paddingTop: 10 }}>
                <p style={{ fontSize: 10, color: a.status === 'NMC' ? '#EF4444' : a.status === 'PMC' ? '#F59E0B' : '#22C55E', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, margin: 0 }}>
                  {a.status === 'NMC' ? 'GROUNDED — RED X' : a.status === 'PMC' ? 'RESTRICTED — RED /' : 'FULLY CAPABLE'}
                </p>
                <button className="btn-ghost-sm" onClick={() => setSelectedAsset(a.asset_code)}>
                  <FileText size={11} /> INSPECT
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {selectedAsset && (
        <MilFormModal
          assetCode={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          authHeader={authHeader}
        />
      )}
    </div>
  )
}
