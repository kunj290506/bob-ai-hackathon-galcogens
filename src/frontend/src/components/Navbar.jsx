import React from 'react'
import { Shield, Radio, Cpu, UserCheck, Terminal, Bot } from 'lucide-react'

export default function Navbar({ onOpenChat, onGenerateBriefing }) {
  return (
    <header style={{ background: '#000000', borderBottom: '1px solid #2A2A2A', padding: '10px 16px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {/* Left: Product Title & Domain */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: '0 1 auto' }}>
          <div style={{ width: 32, height: 32, flexShrink: 0, background: 'rgba(30,174,219,0.08)', border: '1px solid rgba(30,174,219,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1EAEDB' }}>
            <Shield className="w-4 h-4" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em', color: '#fff', whiteSpace: 'nowrap' }}>D1 Copilot</span>
              <span className="hidden sm:inline" style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, padding: '2px 6px', background: '#000000', color: '#7D7D7D', border: '1px solid #2A2A2A', borderRadius: 4, whiteSpace: 'nowrap' }}>
                DEFENSE CBM+
              </span>
            </div>
            <p className="hidden sm:block" style={{ fontSize: 11, color: '#7D7D7D', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Military Fleet Mission Readiness &amp; Predictive Maintenance
            </p>
          </div>
        </div>

        {/* Center: Live Subsystem Health Badges — desktop only */}
        <div className="hidden lg:flex" style={{ alignItems: 'center', gap: 8, fontSize: 12, flex: '0 1 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#000000', border: '1px solid #2A2A2A', borderRadius: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block', flexShrink: 0 }}></span>
            <span style={{ color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>HUMS: ACTIVE</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#000000', border: '1px solid #2A2A2A', borderRadius: 4 }}>
            <Radio style={{ width: 13, height: 13, color: '#1EAEDB', flexShrink: 0 }} />
            <span style={{ color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>FAST-MCP: 11</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#000000', border: '1px solid #2A2A2A', borderRadius: 4, color: '#7D7D7D' }}>
            <Cpu style={{ width: 13, height: 13, flexShrink: 0 }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>Granite 3.0</span>
          </div>
        </div>

        {/* Right: Operational Actions & Command Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={onGenerateBriefing}
            className="btn-ghost-sm hidden sm:inline-flex"
            title="Generate AI Commander Morning Briefing"
          >
            <Terminal style={{ width: 13, height: 13 }} />
            <span className="hidden md:inline">Morning Briefing</span>
          </button>

          <button
            onClick={onOpenChat}
            className="btn-gold-sm"
          >
            <Bot style={{ width: 15, height: 15 }} />
            <span>Bob Copilot</span>
          </button>

          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 8, paddingLeft: 10, borderLeft: '1px solid #2A2A2A' }}>
            <div style={{ width: 30, height: 30, background: '#000000', border: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7D7D7D', borderRadius: 4, flexShrink: 0 }}>
              <UserCheck style={{ width: 14, height: 14 }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#F5F5F5', lineHeight: 1.2, margin: 0 }}>Col. Kunj</p>
              <p style={{ fontSize: 10, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace', margin: 0, marginTop: 1 }}>388th FW Cmdr</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
