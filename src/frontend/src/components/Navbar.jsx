import React from 'react'
import { Shield, Radio, Cpu, UserCheck, Terminal, Bot, Activity } from 'lucide-react'

export default function Navbar({ onOpenChat, onGenerateBriefing }) {
  return (
    <header className="bg-[#0b101c] border-b border-slate-800 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Product Title & Domain */}
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-md bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-base tracking-tight text-white">D1 Copilot</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                DEFENSE CBM+
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Military Fleet Mission Readiness & Predictive Maintenance
            </p>
          </div>
        </div>

        {/* Center: Live Subsystem Health Badges (Restrained, Professional) */}
        <div className="hidden lg:flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300 font-mono text-[11px]">HUMS: ACTIVE</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-300 font-mono text-[11px]">FAST-MCP: 11 TOOLS</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-[11px]">watsonx Granite 3.0</span>
          </div>
        </div>

        {/* Right: Operational Actions & Command Profile */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onGenerateBriefing}
            className="btn-secondary text-xs"
            title="Generate AI Commander Morning Briefing"
          >
            <Terminal className="w-3.5 h-3.5 text-slate-300" />
            <span>Morning Briefing</span>
          </button>

          <button
            onClick={onOpenChat}
            className="btn-primary text-xs"
          >
            <Bot className="w-4 h-4 text-white" />
            <span>Bob Copilot</span>
          </button>

          <div className="hidden sm:flex items-center space-x-2.5 pl-3 border-l border-slate-800">
            <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-200 leading-tight">Col. Kunj</p>
              <p className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">388th FW Cmdr</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

