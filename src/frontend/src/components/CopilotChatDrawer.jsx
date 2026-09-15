import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles, Terminal, Bot, User, Radio, Cpu } from 'lucide-react'

export default function CopilotChatDrawer({ isOpen, onClose, initialQuery }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'IBM Bob Mission Readiness Copilot initialized.\n\nConnected to FastMCP server with 11 operational tools and watsonx.ai Granite 3-8B engine. Ready to execute telemetry diagnostics, C-MAPSS RUL forecasting, mission turnaround planning, and Air Tasking Order sortie matching.',
      tools: ['get_fleet_readiness_summary', 'predict_component_failures', 'explain_readiness_issue']
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const shouldAutoSend = searchParams.get('autoSend') === '1'
    if (initialQuery) {
      if (shouldAutoSend) {
        handleSend(initialQuery)
      } else {
        setInput(initialQuery)
      }
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
          content: 'COMMUNICATION ERROR: Unable to reach Bob Copilot backend service. Ensure the FastAPI backend is running.',
          tools: []
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const quickPrompts = [
    "Generate fleet readiness briefing",
    "Identify NMC grounded platforms",
    "Predict failures before 48h mission window",
    "Show sortie re-allocation matrix for FA-101",
    "Simulate desert heat stress for Viper 101"
  ]

  // Render assistant content with structured blocks
  const renderMessageContent = (content) => {
    return (
      <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed space-y-2">
        {content}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-semibold text-white tracking-wide uppercase">IBM Bob Operational Copilot</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-purple-300 border border-purple-800/40">
                  Granite 3-8B
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>FastMCP: 11 operational tools connected</span>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center space-x-1.5 overflow-x-auto text-[11px]">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider shrink-0 mr-1">Suggestions:</span>
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp)}
              className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white border border-slate-700 whitespace-nowrap transition"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user'

            return (
              <div key={idx} className={`flex space-x-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-6 h-6 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3" />
                  </div>
                )}

                <div className={`max-w-[85%] rounded-lg p-3.5 text-xs leading-relaxed ${
                  isUser 
                    ? 'bg-blue-600/90 text-white rounded-tr-none' 
                    : 'bg-slate-800/90 border border-slate-700 text-slate-200 rounded-tl-none'
                }`}>
                  {renderMessageContent(m.content)}

                  {!isUser && m.tools && m.tools.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono">
                      <Terminal className="w-3 h-3 text-sky-400" />
                      <span>MCP Tools: {m.tools.join(', ')}</span>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <User className="w-3 h-3 text-slate-400" />
                  </div>
                )}
              </div>
            )
          })}
          {loading && (
            <div className="flex items-center space-x-2 text-xs text-slate-400 p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></div>
              <span>Executing FastMCP tool call & querying watsonx.ai Granite...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80">
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
              placeholder="Ask Bob: Query fleet readiness, RUL, or dispatch maintenance..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary !py-2 !px-3 disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
