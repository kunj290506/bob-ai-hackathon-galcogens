import React, { useState, useEffect } from 'react'
import { CheckCircle, Clock, AlertTriangle, ChevronRight } from 'lucide-react'
import { SectionHeader, StatusBadge, LoadingState, ErrorState, EmptyState } from './Shared.jsx'

export default function MaintenanceOptimizerView({ workOrders, missions, loadingData, dataError, onRefresh, authHeader }) {
  const [optimizedPlan, setOptimizedPlan] = useState(null)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [planError, setPlanError] = useState(null)
  const [missionWindowHours, setMissionWindowHours] = useState(48)
  const [approvingId, setApprovingId] = useState(null)
  const [localOrders, setLocalOrders] = useState(null)

  const orders = localOrders ?? workOrders

  const fetchPlan = async () => {
    setLoadingPlan(true)
    setPlanError(null)
    try {
      const res = await fetch(`/api/v1/maintenance/plan?mission_window_hours=${missionWindowHours}`, { headers: authHeader })
      if (!res.ok) throw new Error(`Plan generation failed: ${res.status}`)
      setOptimizedPlan(await res.json())
    } catch (e) {
      setPlanError(e.message)
    } finally {
      setLoadingPlan(false)
    }
  }

  useEffect(() => { fetchPlan() }, [missionWindowHours])

  const handleApprove = async (orderId) => {
    setApprovingId(orderId)
    try {
      const res = await fetch(`/api/v1/maintenance/work-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ status: 'APPROVED' })
      })
      if (res.ok) {
        const updated = await res.json()
        setLocalOrders(prev => (prev ?? workOrders).map(w => w.id === orderId ? { ...w, status: 'APPROVED' } : w))
      }
    } catch { /* silent */ }
    setApprovingId(null)
  }

  if (loadingData) return <LoadingState message="Loading maintenance work orders..." />
  if (dataError) return <ErrorState message={dataError} onRetry={onRefresh} />

  const pendingCount   = orders.filter(w => w.status === 'PENDING').length
  const approvedCount  = orders.filter(w => w.status === 'APPROVED').length
  const criticalCount  = orders.filter(w => w.priority === 'CRITICAL').length
  const prioritySort   = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
  const sortedOrders   = [...orders].sort((a, b) => (prioritySort[a.priority] ?? 4) - (prioritySort[b.priority] ?? 4))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader
        tag="AI PLANNER · Priority = f(Mission Criticality, RUL, Technician Availability)"
        label="Mission-Aware Maintenance Optimizer"
        desc="Work orders ranked by the backend's composite urgency formula. Approve dispatch to authorize technician assignment."
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select className="select-dark" style={{ width: 180 }} value={missionWindowHours} onChange={e => setMissionWindowHours(Number(e.target.value))}>
              <option value={24}>24h Mission Window</option>
              <option value={48}>48h Mission Window</option>
              <option value={72}>72h Mission Window</option>
              <option value={96}>96h Mission Window</option>
            </select>
            <button className="btn-gold-sm" onClick={fetchPlan} disabled={loadingPlan}>
              {loadingPlan ? 'COMPUTING...' : 'REGENERATE PLAN'}
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1, background: '#494949' }}>
        {[
          { label: 'Total Work Orders', value: orders.length, color: '#FFC000' },
          { label: 'Pending Approval',  value: pendingCount,  color: '#F59E0B' },
          { label: 'Approved',          value: approvedCount, color: '#22C55E' },
          { label: 'Critical Priority', value: criticalCount, color: '#EF4444' },
        ].map(s => (
          <div key={s.label} style={{ padding: '16px 18px', background: '#202020' }}>
            <p style={{ fontSize: 9, color: '#7D7D7D', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace', margin: 0, marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono, monospace', margin: 0, lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Optimized plan */}
      {optimizedPlan && (
        <div className="panel" style={{ padding: '16px 20px', borderLeft: '3px solid #FFC000' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <div>
              <p className="label-upper-gold" style={{ marginBottom: 4 }}>AI OPTIMIZED TURNAROUND PLAN</p>
              <p style={{ fontSize: 11, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
                {optimizedPlan.total_actions} actions ranked · {missionWindowHours}h mission horizon · Priority = f(Mission Criticality × RUL Urgency)
              </p>
            </div>
            {planError && <p style={{ fontSize: 11, color: '#EF4444' }}>⚠ {planError}</p>}
          </div>
          {loadingPlan ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 1.5 }} />
              <p style={{ fontSize: 10, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>Computing composite urgency scores...</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>RANK</th>
                    <th>ASSET</th>
                    <th>WORK ORDER</th>
                    <th>PRIORITY</th>
                    <th>URGENCY SCORE</th>
                    <th>EST. HRS</th>
                    <th>ASSIGNED</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {optimizedPlan.prioritized_actions?.map((a, i) => (
                    <tr key={a.id}>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: '#FFC000' }}>#{i + 1}</td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#29ABE2' }}>{a.asset_code}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff', fontSize: 11 }}>{a.title}</div>
                        <div style={{ fontSize: 10, color: '#7D7D7D' }}>{a.description?.slice(0, 60)}{a.description?.length > 60 ? '...' : ''}</div>
                      </td>
                      <td><span className={`badge badge-${a.priority?.toLowerCase()}`}>{a.priority}</span></td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#FFC000', fontSize: 13 }}>
                        {a.composite_urgency_score?.toFixed(1) || '—'}
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{a.estimated_hours}h</td>
                      <td style={{ fontSize: 11, color: '#7D7D7D' }}>{a.assigned_to || 'Unassigned'}</td>
                      <td><span className={`badge badge-${a.status === 'APPROVED' ? 'fmc' : a.status === 'PENDING' ? 'pmc' : 'steel'}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Raw work orders */}
      <div>
        <p className="label-upper" style={{ marginBottom: 16 }}>ALL WORK ORDERS — DISPATCH QUEUE</p>
        {sortedOrders.length === 0 ? (
          <EmptyState title="No work orders" desc="No maintenance work orders found. Work orders are generated automatically when components exceed risk thresholds." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 8 }}>
            {sortedOrders.map(wo => {
              const isCrit     = wo.priority === 'CRITICAL'
              const isPending  = wo.status === 'PENDING'
              const isApproved = wo.status === 'APPROVED'
              return (
                <div key={wo.id} style={{ padding: '16px', background: '#202020', border: `1px solid ${isCrit ? '#EF444430' : '#2A2A2A'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className={`badge badge-${wo.priority.toLowerCase()}`}>{wo.priority}</span>
                    <span style={{ fontSize: 10, color: isApproved ? '#22C55E' : '#F59E0B', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{wo.status}</span>
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0, marginBottom: 4 }}>{wo.title}</p>
                  <p style={{ fontSize: 10, color: '#7D7D7D', margin: 0, marginBottom: 10, lineHeight: 1.5 }}>{wo.description}</p>
                  <div style={{ fontSize: 10, color: '#494949', fontFamily: 'JetBrains Mono, monospace', marginBottom: 10 }}>
                    Est. {wo.estimated_hours}h · {wo.assigned_to || 'Unassigned'} · {wo.due_date ? new Date(wo.due_date).toLocaleDateString() : 'No due date'}
                  </div>
                  {isPending && (
                    <button
                      className="btn-gold-sm"
                      style={{ width: '100%', justifyContent: 'center' }}
                      disabled={approvingId === wo.id}
                      onClick={() => handleApprove(wo.id)}
                    >
                      {approvingId === wo.id ? 'AUTHORIZING...' : 'AUTHORIZE DISPATCH'}
                    </button>
                  )}
                  {isApproved && (
                    <div style={{ textAlign: 'center', fontSize: 10, color: '#22C55E', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                      ✓ AUTHORIZED FOR DISPATCH
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
