import React from 'react'
import { Shield, Radio, Sparkles, UserCheck, Terminal, Cpu } from 'lucide-react'

export default function Navbar({ onOpenChat, onGenerateBriefing }) {
  return (
    <header className="sticky top-0 z-40 bg-[#070a12]/90 backdrop-blur-md border-b border-slate-800/90 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand / Title */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/40 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-extrabold text-lg tracking-wider text-white">D1 COPILOT</span>
              <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                DEFENSE CBM+
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-tight font-sans">
              Aerospace Fleet Mission Readiness & Predictive Turnaround
            </p>
          </div>
        </div>

        {/* Center: System Status Monitors */}
        <div className="hidden lg:flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800/80 shadow-inner">
            <span className="radar-beacon"></span>
            <span className="text-slate-300 font-mono text-[11px] font-medium tracking-wide">HUMS: ACTIVE</span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800/80">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-300 font-mono text-[11px]">MCP: 11 TOOLS</span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-purple-950/20 border border-purple-800/40 text-purple-300">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-mono text-[11px] font-medium">watsonx Granite 3-8B</span>
          </div>
        </div>

        {/* Right: Actions & User Persona */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onGenerateBriefing}
            className="uiverse-btn-ghost"
            title="Generate AI Commander Morning Briefing"
          >
            <Terminal className="w-3.5 h-3.5 text-slate-300" />
            <span>Morning Briefing</span>
          </button>

          <button
            onClick={onOpenChat}
            className="uiverse-btn-primary"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-950" />
            <span>Bob Copilot</span>
          </button>

          <div className="hidden sm:flex items-center space-x-2.5 pl-3 border-l border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center text-emerald-400 shadow-inner">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-200 font-mono leading-none">Col. Kunj</p>
              <p className="text-[10px] text-slate-400 font-mono leading-none mt-1">388th FW Cmdr</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
