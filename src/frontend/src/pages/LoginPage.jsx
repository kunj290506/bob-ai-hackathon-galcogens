import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { Shield, Eye, EyeOff, AlertTriangle, User, Home } from 'lucide-react'

const USERS = [
  { username: 'kunj.commander',  label: 'Col. Kunj',    role: 'Commander',          avatar: 'K', color: '#FFC000' },
  { username: 'vedant.maint',    label: 'Maj. Vedant',  role: 'Maintenance Officer', avatar: 'V', color: '#29ABE2' },
  { username: 'parth.logistics', label: 'Capt. Parth',  role: 'Logistics Planner',  avatar: 'P', color: '#22C55E' },
  { username: 'venisha.tech',    label: 'Sgt. Venisha', role: 'Lead Technician',     avatar: 'N', color: '#A855F7' },
]

export default function LoginPage({ onLoginSuccess, onGoLanding }) {
  const { login, devMode } = useAuth()
  const [username, setUsername]     = useState('')
  const [password, setPassword]     = useState('')
  const [showPw,   setShowPw]       = useState(false)
  const [loading,  setLoading]      = useState(false)
  const [error,    setError]        = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) { setError('Username and password are required.'); return }
    setLoading(true)
    setError(null)
    try {
      await login(username.trim(), password)
      onLoginSuccess()
    } catch (err) {
      setError(err.message || 'Authentication failed. Verify credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillUser = (u) => {
    setUsername(u.username)
    setPassword('Galcogens@2026')
    setError(null)
  }

  const handleDevAccess = () => onLoginSuccess()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
    }}>
      {/* Grid bg */}
      <div className="hero-grid-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.6 }} />

      {/* Home button */}
      {onGoLanding && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 10 }}>
          <button
            onClick={onGoLanding}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 14px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'color 0.2s, border-color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            aria-label="Back to Landing Page"
          >
            <Home size={13} />
            <span>Home</span>
          </button>
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
          <div style={{ width: 48, height: 48, background: 'var(--bg-glass)', backdropFilter: 'blur(8px)', border: '1px solid var(--border-gold)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={24} color="var(--gold)" />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold)', margin: 0 }}>
              D1 Mission Readiness
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', margin: 0, marginTop: 2 }}>
              GALCOGENS · DEFENSE CBM+
            </p>
          </div>
        </div>

        {/* Main card */}
        <div className="glass" style={{ padding: '32px 28px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
            Command Access
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6 }}>
            Sign in with your assigned unit credentials.
          </p>

          {/* Dev mode notice */}
          {devMode && (
            <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(255,192,0,0.08)', border: '1px solid var(--border-gold)', borderRadius: 8 }}>
              <p style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600, margin: 0 }}>
                ⚡ Dev mode active — backend unreachable. Use quick-select below or click "Dev Access".
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <AlertTriangle size={15} color="var(--nmc)" style={{ marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: 'var(--nmc)', margin: 0, lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                Username
              </label>
              <input
                className="input-dark"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="kunj.commander"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input-dark"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  style={{ paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-ghost)', marginTop: 6, fontFamily: 'JetBrains Mono, monospace' }}>
                All accounts: Galcogens@2026
              </p>
            </div>

            <button
              type="submit"
              className="btn-gold"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginBottom: devMode ? 12 : 0 }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            {devMode && (
              <button type="button" className="btn-ghost" onClick={handleDevAccess} style={{ width: '100%', justifyContent: 'center' }}>
                Dev Access — Commander (no auth)
              </button>
            )}
          </form>
        </div>

        {/* ── 4 User quick-select cards ── */}
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textAlign: 'center', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Quick Select — Galcogens Team
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {USERS.map(u => (
              <button
                key={u.username}
                onClick={() => fillUser(u)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  background: username === u.username ? 'var(--bg-glass-hover)' : 'var(--bg-glass)',
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${username === u.username ? u.color + '80' : 'var(--border)'}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = u.color + '60' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = username === u.username ? u.color + '80' : 'var(--border)' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: u.color + '18', border: `1px solid ${u.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: u.color, flexShrink: 0 }}>
                  {u.avatar}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Limitation notice */}
        <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--bg-glass)', backdropFilter: 'blur(8px)', border: '1px solid var(--border)', borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: 'var(--pmc)' }}>⚠ Known limitation:</strong> Sensor streams are simulated from NASA C-MAPSS turbofan data. Dev mode defaults to Commander role when backend is unreachable.
          </p>
        </div>
      </div>
    </div>
  )
}
