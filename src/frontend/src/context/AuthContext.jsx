import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('d1_token'))
  const [loading, setLoading] = useState(true)
  const [devMode, setDevMode] = useState(false)
  // Track if user explicitly logged out — if so, never auto-enter dashboard
  const [explicitlyLoggedOut, setExplicitlyLoggedOut] = useState(false)

  const verifyToken = useCallback(async (t) => {
    if (!t) { setLoading(false); return }
    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${t}` }
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        setDevMode(false)
      } else {
        // Invalid token — clear it, require real login
        setToken(null)
        localStorage.removeItem('d1_token')
        setUser(null)
        setDevMode(false)
      }
    } catch {
      // Backend unreachable — dev mode only if NOT explicitly logged out
      if (!explicitlyLoggedOut) {
        setDevMode(true)
        setUser({
          id: 0,
          username: 'kunj.commander',
          email: 'd24aiml082@charusat.edu.in',
          full_name: 'Col. Kunj',
          role: 'commander',
          unit: '388th Fighter Wing',
          clearance_level: 'TOP_SECRET',
          is_active: true
        })
      }
    } finally {
      setLoading(false)
    }
  }, [explicitlyLoggedOut])

  useEffect(() => {
    verifyToken(token)
  }, [token, verifyToken])

  const login = async (username, password) => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Invalid credentials')
    }
    const data = await res.json()
    localStorage.setItem('d1_token', data.access_token)
    setToken(data.access_token)
    setDevMode(false)
    setExplicitlyLoggedOut(false)
    setUser({
      username: data.username,
      role: data.role,
      unit: data.unit,
      clearance_level: data.clearance_level,
      full_name: data.full_name || data.username,
    })
    return data
  }

  const logout = () => {
    localStorage.removeItem('d1_token')
    setToken(null)
    setUser(null)
    setDevMode(false)
    setExplicitlyLoggedOut(true) // ← prevent dev-mode auto-login after explicit logout
  }

  const authHeader = token ? { Authorization: `Bearer ${token}` } : {}

  return (
    <AuthContext.Provider value={{ user, token, loading, devMode, login, logout, authHeader }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
