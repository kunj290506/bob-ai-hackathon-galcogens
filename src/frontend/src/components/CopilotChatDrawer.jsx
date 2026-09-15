import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles, Terminal, Bot, User, Radio, Cpu } from 'lucide-react'

export default function CopilotChatDrawer({ isOpen, onClose, initialQuery }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Tactical link established. I am the IBM Bob Mission Readiness & Predictive Turnaround Copilot. Connected to FastMCP server with 11 operational tools and watsonx.ai Granite 3-8B engine. How may I assist with fleet diagnostics, C-MAPSS RUL forecasting, or Air Tasking Order sortie matching?',
      tools: ['fastmcp_ready', 'granite_3_8b_active']
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (initialQuery) {
      handleSend(initialQuery)
    }
  }, [initialQuery])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (textToSend) => {
    const query = textToSend || input
    if (!query.trim()) return

    const userMsg = { role: 'user', content: query }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/v1/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      })
      const data = await res.json()
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          tools: data.tools_used || []
        }
      ])
    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'COMMUNICATION ERROR: Unable to reach Bob Copilot backend service. Ensure FastAPI server is running.',
          tools: []
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const quickPrompts = [
    "Generate morning readiness briefing",
    "Identify all NMC grounded platforms",
    "Predict failures before 48-hr mission window",
    "Show sortie re-allocation matrix for FA-101",
    "Simulate desert heat stress for Viper 101"
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg bg-[#070a12] border-l border-slate-800/90 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800/90 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-mono font-bold text-white tracking-wide">BOB COPILOT</h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-800/50">
                  Granite 3-8B
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono flex items-center space-x-1.5 mt-0.5">
                <span className="radar-beacon"></span>
                <span>FastMCP: 11 Tools Active</span>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips (Uiverse Pills) */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center space-x-2 overflow-x-auto text-[11px]">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp)}
              className="px-3 py-1 rounded-full text-[10px] font-mono whitespace-nowrap transition uiverse-tab-inactive"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user'

            return (
              <div key={idx} className={`flex space-x-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-1 shadow-inner">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                  isUser 
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none shadow-[0_0_15px_rgba(16,185,129,0.2)] font-sans' 
                    : 'bg-slate-900/90 border border-slate-800/90 text-slate-200 rounded-tl-none font-sans shadow-lg'
                }`}>
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {!isUser && m.tools && m.tools.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono">
                      <Terminal className="w-3 h-3 text-blue-400" />
                      <span>MCP Tools: {m.tools.join(', ')}</span>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                )}
              </div>
            )
          })}
          {loading && (
            <div className="flex items-center space-x-2.5 text-xs text-slate-400 font-mono p-3 bg-slate-900/40 rounded-xl border border-slate-800">
              <span className="radar-beacon"></span>
              <span>Bob Copilot executing FastMCP diagnostics & querying watsonx...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-slate-800/90 bg-slate-950/90">
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Query fleet readiness, RUL, or dispatch maintenance..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 font-sans"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="uiverse-btn-primary !p-2.5 !rounded-xl"
            >
              <Send className="w-4 h-4 text-slate-950" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
