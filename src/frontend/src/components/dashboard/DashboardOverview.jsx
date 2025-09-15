import React, { useState } from 'react'
import { AlertTriangle, ChevronRight, Shield, Target, Wrench, BarChart3, Activity, Clock } from 'lucide-react'
import { StatWidget, StatusBadge, LoadingState, ErrorState, ReadinessBar, Panel, SectionHeader } from './Shared.jsx'

export default function DashboardOverview({ summary, assets, predictions, workOrders, missions, loadingData, dataError, onRefresh, onNavigate, onOpenCopilot }) {

  if (loadingData) return <LoadingState message="Fetching live fleet telemetry from backend..." />
  if (dataError) return <ErrorState message={dataError} onRetry={onRefresh} />

  const fmcPct    = summary?.fmc_percentage ?? 0
  const fmcCount  = summary?.fmc_count ?? 0
  const pmcCount  = summary?.pmc_count ?? 0
  const nmcCount  = summary?.nmc_count ?? 0
  const total     = summary?.total_assets ?? 0
  const critCount = summary?.critical_attention_count ?? 0

  const criticalAssets = assets.filter(a => a.status === 'NMC').sort((a, b) => a.readiness_score - b.readiness_score).slice(0, 5)
  const pmcAssets      = assets.filter(a => a.status === 'PMC').slice(0, 3)
  const nextMission    = missions[0]
  const pendingOrders  = workOrders.filter(w => w.status === 'PENDING').slice(0, 4)
  const critPredictions = predictions.filter(p => p.risk_level === 'CRITICAL' || p.fails_before_mission).slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── STAT ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 1, background: '#494949' }}>
        <StatWidget label="Fleet Readiness Index" value={`${fmcPct}%`} color="#FFC000" sub={`${fmcCount}/${total} platforms`} />
        <StatWidget label="Fully Mission Capable" value={fmcCount} color="#22C55E" sub="FMC — sortie ready" />
        <StatWidget label="Partially Capable"     value={pmcCount} color="#F59E0B" sub="PMC — degraded sorties" />
        <StatWidget label="Non-Mission Capable"   value={nmcCount} color="#EF4444" sub="NMC — grounded" onClick={() => onNavigate('fleet')} />
        <StatWidget label="Critical Attention"    value={critCount} color="#EF4444" sub="Priority turnaround req." />
        <StatWidget label="Active Work Orders"    value={workOrders.length} color="#29ABE2" sub={`${pendingOrders.length} pending approval`} onClick={() => onNavigate('maintenance')} />
      </div>

      {/* ── NEXT MISSION STATUS ── */}
      {nextMission && (
        <div className="panel" style={{ padding: '20px 24px', borderLeft: '3px solid #FFC000' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <p className="label-upper-gold" style={{ marginBottom: 4 }}>NEXT MISSION WINDOW</p>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', textTransform: 'uppercase', margin: 0, marginBottom: 4 }}>{nextMission.title}</h3>
              <p style={{ fontSize: 11, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
                {nextMission.required_assets_count}× {nextMission.required_asset_type} · Min {nextMission.minimum_readiness_threshold}% FMC · Launch: {new Date(nextMission.start_time).toLocaleString()}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost-sm" onClick={() => onNavigate('missions')}>View All Missions</button>
              <button className="btn-gold-sm" onClick={() => onOpenCopilot(`What is the mission readiness status for ${nextMission.title}?`)}>Ask Bob Copilot</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>

        {/* NMC Critical Platforms */}
        <div className="panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #494949' }}>
            <div>
              <p className="label-upper" style={{ marginBottom: 2, color: '#EF4444' }}>GROUNDED PLATFORMS</p>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>NMC — Critical Turnaround Required</h3>
            </div>
            <button className="btn-ghost-sm" onClick={() => onNavigate('fleet')}>
              Fleet View <ChevronRight size={12} />
            </button>
          </div>
          {criticalAssets.length === 0 ? (
            <p style={{ fontSize: 11, color: '#7D7D7D', padding: '20px 0', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}>ALL PLATFORMS MISSION CAPABLE</p>
          ) : criticalAssets.map(a => (
            <div key={a.id} style={{ padding: '12px 0', borderBottom: '1px solid #2A2A2A' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>{a.asset_code}</span>
                  <span style={{ fontSize: 11, color: '#7D7D7D', marginLeft: 8 }}>{a.name}</span>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <ReadinessBar score={a.readiness_score} status={a.status} />
            </div>
          ))}
        </div>

        {/* Critical RUL Predictions */}
        <div className="panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #494949' }}>
            <div>
              <p className="label-upper" style={{ marginBottom: 2, color: '#EF4444' }}>FAILURE FORECAST</p>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Critical RUL — Mission Window Conflicts</h3>
            </div>
            <button className="btn-ghost-sm" onClick={() => onNavigate('prognostics')}>
              Prognostics <ChevronRight size={12} />
            </button>
          </div>
          {critPredictions.length === 0 ? (
            <p style={{ fontSize: 11, color: '#22C55E', padding: '20px 0', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}>NO IMMINENT FAILURES DETECTED</p>
          ) : critPredictions.map(p => (
            <div key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#fff', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>{p.asset_code}</p>
                <p style={{ fontSize: 10, color: '#7D7D7D', margin: 0 }}>{p.component_name}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#EF4444', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>{p.predicted_rul}h</p>
                <p style={{ fontSize: 9, color: '#EF4444', margin: 0 }}>FAILS BEFORE MISSION</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pending Work Orders */}
        <div className="panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #494949' }}>
            <div>
              <p className="label-upper" style={{ marginBottom: 2, color: '#F59E0B' }}>DISPATCH QUEUE</p>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Pending Work Orders</h3>
            </div>
            <button className="btn-ghost-sm" onClick={() => onNavigate('maintenance')}>
              All Orders <ChevronRight size={12} />
            </button>
          </div>
          {pendingOrders.length === 0 ? (
            <p style={{ fontSize: 11, color: '#22C55E', padding: '20px 0', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}>NO PENDING WORK ORDERS</p>
          ) : pendingOrders.map(wo => (
            <div key={wo.id} style={{ padding: '10px 0', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{wo.title}</p>
                <p style={{ fontSize: 10, color: '#7D7D7D', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>Est. {wo.estimated_hours}h · {wo.assigned_to || 'Unassigned'}</p>
              </div>
              <span className={`badge badge-${wo.priority.toLowerCase()}`}>{wo.priority}</span>
            </div>
          ))}
        </div>

        {/* PMC Platforms + Quick Sortie Action */}
        <div className="panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #494949' }}>
            <div>
              <p className="label-upper" style={{ marginBottom: 2, color: '#F59E0B' }}>DEGRADED PLATFORMS</p>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>PMC — ATO Re-allocation Available</h3>
            </div>
            <button className="btn-ghost-sm" onClick={() => onNavigate('milforms')}>
              AFTO/ATO <ChevronRight size={12} />
            </button>
          </div>
          {pmcAssets.length === 0 ? (
            <p style={{ fontSize: 11, color: '#22C55E', padding: '20px 0', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}>NO PMC PLATFORMS</p>
          ) : pmcAssets.map(a => (
            <div key={a.id} style={{ padding: '10px 0', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>{a.asset_code}</p>
                <p style={{ fontSize: 10, color: '#7D7D7D', margin: 0 }}>{a.name} · {a.model}</p>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#F59E0B', fontFamily: 'JetBrains Mono, monospace' }}>{a.readiness_score}%</span>
                <StatusBadge status="PMC" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PIPELINE STRIP ── */}
      <div className="panel" style={{ padding: '20px 24px' }}>
        <p className="label-upper-gold" style={{ marginBottom: 16 }}>ACTIVE PROCESSING PIPELINE</p>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', minWidth: 700 }}>
            {[
              'HUMS Telemetry', 'Anomaly Detection', 'RUL Forecast', 'FMC/PMC/NMC', 'Granite Diagnostic', 'ATO Re-alloc', 'WO Turnaround', 'Briefing'
            ].map((step, i, arr) => (
              <React.Fragment key={i}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, width: 80 }}>
                  <div style={{ width: 28, height: 28, background: '#181818', border: '1px solid #FFC000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#FFC000', fontFamily: 'JetBrains Mono, monospace' }}>
                    {i + 1}
                  </div>
                  <p style={{ fontSize: 9, color: '#7D7D7D', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>{step}</p>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #FFC000 0%, #494949 100%)', minWidth: 8, marginBottom: 20 }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
