import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

// Route states: 'landing' | 'login' | 'dashboard'
function AppRouter() {
  const { user, loading, devMode } = useAuth()
  const [route, setRoute] = useState('landing')

  // If token was valid on load and user hadn't explicitly logged out,
  // we restore to dashboard when they visit /dashboard route.
  // We do NOT auto-skip the login screen — that is always shown when navigating to 'login'.

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
          INITIALIZING D1 MISSION READINESS COPILOT...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const handleEnterDashboard = () => {
    // Always go to login first — even if already authenticated,
    // so the user can choose which account to use
    setRoute('login')
  }

  const handleLoginSuccess = () => {
    setRoute('dashboard')
  }

  const handleSignOut = () => {
    // Always go to login after sign out — never auto-redirect to dashboard
    setRoute('login')
  }

  if (route === 'landing') {
    return <LandingPage onEnterDashboard={handleEnterDashboard} />
  }

  if (route === 'login') {
    // NEVER skip the login screen, even if a token exists.
    // The user explicitly navigated here (either fresh load or after logout).
    return <LoginPage onLoginSuccess={handleLoginSuccess} onGoLanding={() => setRoute('landing')} />
  }

  if (route === 'dashboard') {
    if (!user && !devMode) {
      return <LoginPage onLoginSuccess={handleLoginSuccess} />
    }
    return <DashboardPage onSignOut={handleSignOut} onGoLanding={() => setRoute('landing')} />
  }

  return <LandingPage onEnterDashboard={handleEnterDashboard} />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  )
}
