import React from 'react'

export function Badge({ type, children }) {
  const cls = {
    fmc:      'badge badge-fmc',
    pmc:      'badge badge-pmc',
    nmc:      'badge badge-nmc',
    gold:     'badge badge-gold',
    teal:     'badge badge-teal',
    steel:    'badge badge-steel',
    critical: 'badge badge-critical',
    high:     'badge badge-high',
    medium:   'badge badge-medium',
    low:      'badge badge-low',
  }[type] || 'badge badge-steel'
  return <span className={cls}>{children}</span>
}

export function StatusBadge({ status }) {
  const map = {
    FMC:      { cls: 'badge-fmc',      dot: 'var(--fmc)',  label: 'FMC — Fully Mission Capable' },
    PMC:      { cls: 'badge-pmc',      dot: 'var(--pmc)',  label: 'PMC — Partially Mission Capable' },
    NMC:      { cls: 'badge-nmc',      dot: 'var(--nmc)',  label: 'NMC — Non-Mission Capable' },
    CRITICAL: { cls: 'badge-critical', dot: 'var(--nmc)',  label: 'CRITICAL' },
    HIGH:     { cls: 'badge-high',     dot: 'var(--pmc)',  label: 'HIGH' },
    MEDIUM:   { cls: 'badge-medium',   dot: 'var(--teal)', label: 'MEDIUM' },
    LOW:      { cls: 'badge-low',      dot: 'var(--text-muted)', label: 'LOW' },
  }
  const m = map[status] || map.LOW
  return (
    <span className={`badge ${m.cls}`}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, display: 'inline-block', flexShrink: 0 }} />
      {m.label}
    </span>
  )
}

export function LoadingState({ message = 'Loading data from backend...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 16 }}>
      <div className="spinner" />
      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0, textAlign: 'center' }}>
        {message}
      </p>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div style={{ padding: '28px 24px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10 }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--nmc)', marginBottom: 6 }}>
        ⚠ Backend Error
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6, marginBottom: onRetry ? 16 : 0 }}>{message}</p>
      {onRetry && (
        <button className="btn-ghost-sm" style={{ marginTop: 12 }} onClick={onRetry}>Retry Connection</button>
      )}
    </div>
  )
}

export function EmptyState({ title, desc }) {
  return (
    <div style={{ padding: '60px 24px', textAlign: 'center', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-glass)' }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>{title}</p>
      <p style={{ fontSize: 13, color: 'var(--text-ghost)', margin: 0 }}>{desc}</p>
    </div>
  )
}

export function SectionHeader({ tag, label, desc, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
      <div>
        {tag && <p className="label-upper-gold" style={{ marginBottom: 6 }}>{tag}</p>}
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '-0.01em', margin: 0, marginBottom: desc ? 8 : 0 }}>{label}</h2>
        {desc && <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, maxWidth: 640, lineHeight: 1.65 }}>{desc}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}

export function Panel({ children, style = {} }) {
  return <div className="panel" style={style}>{children}</div>
}

export function ReadinessBar({ score, status }) {
  const color = status === 'FMC' ? 'var(--fmc)' : status === 'PMC' ? 'var(--pmc)' : 'var(--nmc)'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Readiness</span>
        <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{score}%</span>
      </div>
      <div className="rul-bar">
        <div style={{ width: `${score}%`, height: '100%', background: color, transition: 'width 0.5s', borderRadius: 2 }} />
      </div>
    </div>
  )
}

export function StatWidget({ label, value, sub, color = 'var(--gold)', onClick }) {
  return (
    <div className="stat-widget" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 10, margin: '0 0 10px' }}>{label}</p>
      <p style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1, fontFamily: 'JetBrains Mono, monospace', margin: '0 0 4px' }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-ghost)', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>{sub}</p>}
    </div>
  )
}
