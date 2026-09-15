import React from 'react'
import { Shield, Radio, Sparkles, UserCheck } from 'lucide-react'

export default function Navbar({ onOpenChat, onGenerateBriefing }) {
  return (
    <header className="sticky top-0 z-40 bg-[#0c101a]/90 backdrop-blur border-b border-slate-800/80 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand / Title */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-wide text-white font-mono">D1 COPILOT</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                MIL-DEFENSE
              </span>
            </div>
            <p className="text-xs text-slate-400">Mission Readiness & Condition-Based Predictive Maintenance</p>
          </div>
        </div>

        {/* Center: System Status */}
        <div className="hidden md:flex items-center space-x-6 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-mono">HUMS TELEMETRY: ACTIVE</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800/60 border border-slate-700/50">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-300 font-mono">FAST-MCP: /mcp</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-purple-950/30 border border-purple-800/40 text-purple-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-mono">watsonx.ai Granite 3-8B</span>
          </div>
        </div>

        {/* Right: Actions & User */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onGenerateBriefing}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition flex items-center space-x-1.5"
          >
            <span>Morning Briefing</span>
          </button>
          <button
            onClick={onOpenChat}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bob Copilot</span>
          </button>
          <div className="hidden sm:flex items-center space-x-2 pl-3 border-l border-slate-800 text-xs">
            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 border border-slate-700">
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-200 leading-tight">Col. Kunj</p>
              <p className="text-[10px] text-slate-400 leading-tight">388th Commander</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
