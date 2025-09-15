import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User, Terminal, Cpu, AlertTriangle } from 'lucide-react'

const QUICK_PROMPTS = [
  'Generate fleet readiness briefing',
  'Which platforms are NMC / grounded?',
  'Predict failures before 48h mission window',
  'Show sortie matrix for F16-VIPER-101',
  'Simulate desert heat stress for AH64-APACHE-401',
  'What is the composite urgency of pending work orders?',
]

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: 'IBM Bob Mission Readiness Copilot initialized.\n\nConnected to FastMCP server with 11 operational tools and IBM watsonx.ai Granite 3-8B engine.\n\nCapabilities: telemetry diagnostics, C-MAPSS RUL forecasting, mission turnaround planning, ATO sortie matching, AFTO Form 781A generation, anomaly detection, and commander briefing synthesis.',
  tools: ['get_fleet_readiness_summary', 'predict_component_failures', 'explain_readiness_issue'],
  ts: new Date().toLocaleTimeString(),
}

export default function CopilotChatDrawer({ isOpen, onClose, initialQuery, authHeader = {} }) {
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (initialQuery) setInput(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Extract a tail-number asset code from a free-text message (e.g. "F16-VIPER-101")
  const extractAssetCode = (text) => {
    const m = text.match(/\b([A-Z0-9]{2,6}-[A-Z0-9]+-\d{3,})\b/i)
    return m ? m[1].toUpperCase() : null
  }

  const sendMessage = async (text) => {
    const query = (text || input).trim()
    if (!query) return
    setMessages(prev => [...prev, { role: 'user', content: query, ts: new Date().toLocaleTimeString() }])
    setInput('')
    setLoading(true)

    // If the message contains a tail number, route to the richer asset-specific path
    const detectedCode = extractAssetCode(query)

    try {
      const res = await fetch('/api/v1/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ message: query, asset_code: detectedCode || undefined })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Backend error: ${res.status}`)
      }
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || 'No response returned.',
        tools: data.tools_used || [],
        ts: new Date(data.timestamp || Date.now()).toLocaleTimeString(),
      }])
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `COMMUNICATION ERROR: ${e.message}\n\nEnsure the FastAPI backend is running at localhost:8000. The MCP server must also be active.`,
        tools: [],
        ts: new Date().toLocaleTimeString(),
        isError: true,
      }])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="chat-drawer" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="chat-panel animate-fade-in">
        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #494949', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#202020', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: '#000', border: '1px solid #FFC000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={16} color="#FFC000" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>IBM Bob Operational Copilot</p>
                <span className="badge badge-gold" style={{ fontSize: 9 }}>Granite 3-8B</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <div className="hex-live" />
                <p style={{ fontSize: 9, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>FastMCP: 11 tools connected</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7D7D7D', padding: 4 }} aria-label="Close copilot">
            <X size={18} />
          </button>
        </div>

        {/* Quick prompts */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #2A2A2A', display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0 }}>
          <span style={{ fontSize: 9, color: '#494949', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'center', flexShrink: 0 }}>QUICK:</span>
          {QUICK_PROMPTS.map((qp, i) => (
            <button key={i}
              onClick={() => sendMessage(qp)}
              style={{ padding: '4px 10px', background: '#202020', border: '1px solid #494949', cursor: 'pointer', fontSize: 10, color: '#969696', whiteSpace: 'nowrap', transition: 'border-color 0.2s, color 0.2s', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#FFC000'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#494949'; e.currentTarget.style.color = '#969696' }}
            >{qp}</button>
          ))}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user'
            return (
              <div key={i} style={{ display: 'flex', gap: 8, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                {!isUser && (
                  <div style={{ width: 24, height: 24, background: '#000', border: '1px solid #FFC000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Bot size={12} color="#FFC000" />
                  </div>
                )}
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  background: isUser ? '#FFC000' : msg.isError ? 'rgba(239,68,68,0.1)' : '#202020',
                  border: isUser ? 'none' : msg.isError ? '1px solid rgba(239,68,68,0.4)' : '1px solid #2A2A2A',
                  color: isUser ? '#000' : '#F5F5F5',
                }}>
                  <p style={{ fontSize: 12, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontWeight: isUser ? 600 : 400 }}>
                    {msg.content}
                  </p>
                  {!isUser && msg.tools && msg.tools.length > 0 && (
                    <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid #494949', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Terminal size={10} color="#29ABE2" />
                      <span style={{ fontSize: 9, color: '#494949', fontFamily: 'JetBrains Mono, monospace' }}>MCP: {msg.tools.join(', ')}</span>
                    </div>
                  )}
                  {msg.ts && (
                    <p style={{ fontSize: 9, color: isUser ? 'rgba(0,0,0,0.4)' : '#494949', margin: 0, marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>{msg.ts}</p>
                  )}
                </div>
                {isUser && (
                  <div style={{ width: 24, height: 24, background: '#202020', border: '1px solid #494949', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <User size={12} color="#7D7D7D" />
                  </div>
                )}
              </div>
            )
          })}
          {loading && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start' }}>
              <div style={{ width: 24, height: 24, background: '#000', border: '1px solid #FFC000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <Bot size={12} color="#FFC000" />
              </div>
              <div style={{ padding: '10px 14px', background: '#202020', border: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} />
                <span style={{ fontSize: 10, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace' }}>Executing FastMCP tool calls...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px', borderTop: '1px solid #494949', flexShrink: 0 }}>
          <form onSubmit={e => { e.preventDefault(); sendMessage() }} style={{ display: 'flex', gap: 8 }}>
            <input
              className="input-dark"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Bob: fleet readiness, RUL forecasts, work orders..."
              disabled={loading}
              aria-label="Copilot message input"
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn-gold-sm"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              style={{ flexShrink: 0, minWidth: 44, padding: '0 14px' }}
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
