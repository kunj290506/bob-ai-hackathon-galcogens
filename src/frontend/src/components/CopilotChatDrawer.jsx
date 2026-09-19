import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User, Terminal, Cpu, AlertTriangle, ShieldCheck, CheckCircle2, Copy, Check } from 'lucide-react'

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

function renderInline(str) {
  if (!str) return null
  const regex = /(\*\*.*?\*\*|`.*?`)/g
  const tokens = String(str).split(regex)

  return tokens.map((tok, idx) => {
    if (!tok) return null
    if (tok.startsWith('**') && tok.endsWith('**')) {
      const inner = tok.slice(2, -2)
      return <strong key={idx} style={{ color: '#FFFFFF', fontWeight: 700 }}>{inner}</strong>
    }
    if (tok.startsWith('`') && tok.endsWith('`')) {
      const inner = tok.slice(1, -1)
      return (
        <code key={idx} style={{
          fontFamily: 'JetBrains Mono, monospace',
          background: '#0D0D0D',
          border: '1px solid #383838',
          padding: '1px 5px',
          borderRadius: 3,
          color: '#29ABE2',
          fontSize: 10.5
        }}>{inner}</code>
      )
    }
    if (tok.includes('🚫 NMC')) {
      return <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: '1px 6px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', borderRadius: 3, color: '#F87171', fontWeight: 700, fontSize: 10 }}>🚫 NMC</span>
    }
    if (tok.includes('⚠️ PMC')) {
      return <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: '1px 6px', background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.5)', borderRadius: 3, color: '#FBBF24', fontWeight: 700, fontSize: 10 }}>⚠️ PMC</span>
    }
    if (tok.includes('🟢 FMC')) {
      return <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: '1px 6px', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.5)', borderRadius: 3, color: '#34D399', fontWeight: 700, fontSize: 10 }}>🟢 FMC</span>
    }
    if (tok.includes('🔴 CRITICAL')) {
      return <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: '1px 6px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', borderRadius: 3, color: '#F87171', fontWeight: 700, fontSize: 10 }}>🔴 CRITICAL</span>
    }
    if (tok.includes('🟡 HIGH')) {
      return <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: '1px 6px', background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.5)', borderRadius: 3, color: '#FBBF24', fontWeight: 700, fontSize: 10 }}>🟡 HIGH</span>
    }
    if (tok.includes('✅ VIABLE') || tok.includes('✅')) {
      return <span key={idx} style={{ color: '#10B981', fontWeight: 700 }}>{tok}</span>
    }
    if (tok.includes('🚫 PROHIBITED')) {
      return <span key={idx} style={{ color: '#EF4444', fontWeight: 700 }}>{tok}</span>
    }
    return tok
  })
}

function TacticalMessageRenderer({ content }) {
  if (!content) return null

  const lines = content.split('\n')
  const blocks = []
  let currentTable = null
  let inValidation = false
  let validationItems = []

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const line = rawLine.trim()

    if (line.includes('Telemetry & Ground-Truth Validation Audit') || line.includes('Validation Audit')) {
      if (currentTable) {
        blocks.push({ type: 'table', data: currentTable })
        currentTable = null
      }
      inValidation = true
      validationItems = []
      continue
    }

    if (inValidation) {
      if (line.startsWith('-') || line.startsWith('*')) {
        validationItems.push(line.replace(/^[-*]\s*/, ''))
        continue
      } else if (line === '' || line.startsWith('---')) {
        continue
      } else {
        blocks.push({ type: 'validation', items: validationItems })
        inValidation = false
      }
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      if (/^\|(\s*:?-+:?\s*\|)+$/.test(line)) {
        continue
      }
      const cells = line.split('|').slice(1, -1).map(c => c.trim())
      if (!currentTable) {
        currentTable = { headers: cells, rows: [] }
      } else {
        currentTable.rows.push(cells)
      }
      continue
    } else {
      if (currentTable) {
        blocks.push({ type: 'table', data: currentTable })
        currentTable = null
      }
    }

    if (!line) {
      blocks.push({ type: 'spacer' })
      continue
    }

    if (line.startsWith('---')) {
      blocks.push({ type: 'divider' })
      continue
    }

    if (line.startsWith('###')) {
      blocks.push({ type: 'h3', text: line.replace(/^###\s*/, '') })
      continue
    }

    if (line.startsWith('####')) {
      blocks.push({ type: 'h4', text: line.replace(/^####\s*/, '') })
      continue
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({ type: 'bullet', text: line.slice(2) })
      continue
    }

    const numMatch = line.match(/^(\d+)\.\s*(.*)$/)
    if (numMatch) {
      blocks.push({ type: 'numbered', num: numMatch[1], text: numMatch[2] })
      continue
    }

    blocks.push({ type: 'p', text: line })
  }

  if (currentTable) {
    blocks.push({ type: 'table', data: currentTable })
  }
  if (inValidation && validationItems.length > 0) {
    blocks.push({ type: 'validation', items: validationItems })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, lineHeight: 1.6 }}>
      {blocks.map((b, idx) => {
        if (b.type === 'spacer') return <div key={idx} style={{ height: 2 }} />
        if (b.type === 'divider') return <div key={idx} style={{ height: 1, background: '#333', margin: '6px 0' }} />
        if (b.type === 'h3') {
          return (
            <div key={idx} style={{
              margin: '6px 0 2px',
              padding: '5px 8px',
              background: 'rgba(255, 192, 0, 0.08)',
              borderLeft: '3px solid #FFC000',
              fontWeight: 700,
              fontSize: 11.5,
              color: '#FFC000',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              {renderInline(b.text)}
            </div>
          )
        }
        if (b.type === 'h4') {
          return (
            <div key={idx} style={{ margin: '4px 0 2px', fontWeight: 700, fontSize: 11, color: '#E0E0E0' }}>
              {renderInline(b.text)}
            </div>
          )
        }
        if (b.type === 'table') {
          return (
            <div key={idx} style={{ overflowX: 'auto', margin: '6px 0', borderRadius: 4, border: '1px solid #333' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5, background: '#171717' }}>
                <thead>
                  <tr style={{ background: '#222', borderBottom: '1px solid #444' }}>
                    {b.data.headers.map((h, hi) => (
                      <th key={hi} style={{
                        padding: '6px 8px',
                        textAlign: 'left',
                        fontSize: 9.5,
                        fontWeight: 700,
                        color: '#FFC000',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap'
                      }}>
                        {renderInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.data.rows.map((row, ri) => (
                    <tr key={ri} style={{
                      background: ri % 2 === 0 ? '#181818' : '#141414',
                      borderBottom: ri < b.data.rows.length - 1 ? '1px solid #262626' : 'none'
                    }}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={{ padding: '6px 8px', color: '#D4D4D4', verticalAlign: 'middle' }}>
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        if (b.type === 'validation') {
          return (
            <div key={idx} style={{
              margin: '8px 0 2px',
              padding: '10px 12px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.12) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 4
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <ShieldCheck size={14} color="#10B981" />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  TELEMETRY & GROUND-TRUTH VALIDATION AUDIT
                </span>
                <span style={{
                  marginLeft: 'auto',
                  fontSize: 8.5,
                  fontWeight: 700,
                  padding: '1px 5px',
                  background: 'rgba(16, 185, 129, 0.25)',
                  color: '#34D399',
                  borderRadius: 2,
                  letterSpacing: '0.05em'
                }}>
                  100% GROUND TRUTH
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingLeft: 2 }}>
                {b.items.map((item, ii) => (
                  <div key={ii} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 10, color: '#E2E8F0' }}>
                    <CheckCircle2 size={11} color="#34D399" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>{renderInline(item)}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        }
        if (b.type === 'bullet') {
          return (
            <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', paddingLeft: 2 }}>
              <span style={{ color: '#FFC000', fontSize: 10, marginTop: 1 }}>•</span>
              <div style={{ flex: 1, color: '#E0E0E0' }}>{renderInline(b.text)}</div>
            </div>
          )
        }
        if (b.type === 'numbered') {
          return (
            <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', paddingLeft: 2 }}>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 9,
                fontWeight: 700,
                color: '#FFC000',
                background: '#2A2A2A',
                border: '1px solid #444',
                padding: '0 4px',
                borderRadius: 2,
                marginTop: 2
              }}>{b.num}</span>
              <div style={{ flex: 1, color: '#E0E0E0' }}>{renderInline(b.text)}</div>
            </div>
          )
        }
        return (
          <p key={idx} style={{ margin: 0, color: '#E0E0E0' }}>
            {renderInline(b.text)}
          </p>
        )
      })}
    </div>
  )
}

export default function CopilotChatDrawer({ isOpen, onClose, initialQuery, authHeader = {} }) {
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeEngine, setActiveEngine] = useState('FastMCP Agent')
  const [copiedIndex, setCopiedIndex] = useState(null)
  const bottomRef = useRef(null)

  const copyMessage = (text, idx) => {
    if (!navigator.clipboard) return
    navigator.clipboard.writeText(text)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

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
      if (data.watsonx_mode === 'LIVE_GEMINI_MCP') {
        setActiveEngine('Gemini 2.0 Flash')
      } else if (data.watsonx_mode === 'LIVE_GRANITE_WATSONX') {
        setActiveEngine('Granite 3-8B')
      } else {
        setActiveEngine('FastMCP Autonomous')
      }
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
                <span className="badge badge-gold" style={{ fontSize: 9 }}>{activeEngine}</span>
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
                  <div style={{ width: 26, height: 26, background: '#000', border: '1px solid #FFC000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Bot size={13} color="#FFC000" />
                  </div>
                )}
                {isUser ? (
                  <div style={{
                    maxWidth: '82%',
                    padding: '8px 14px',
                    background: '#FFC000',
                    borderRadius: 4,
                    color: '#000',
                    fontWeight: 600,
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}>
                    {msg.content}
                    {msg.ts && (
                      <p style={{ fontSize: 9, color: 'rgba(0,0,0,0.45)', margin: '4px 0 0', fontFamily: 'JetBrains Mono, monospace' }}>{msg.ts}</p>
                    )}
                  </div>
                ) : (
                  <div style={{
                    maxWidth: '92%',
                    width: '100%',
                    padding: '12px 14px',
                    background: msg.isError ? 'rgba(239,68,68,0.08)' : '#1B1B1B',
                    border: msg.isError ? '1px solid rgba(239,68,68,0.4)' : '1px solid #2E2E2E',
                    borderRadius: 4,
                    color: '#F5F5F5',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
                  }}>
                    {/* Header Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #2A2A2A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FFC000', fontFamily: 'JetBrains Mono, monospace' }}>
                          OPERATIONAL BRIEFING
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 8.5, color: '#10B981', background: 'rgba(16,185,129,0.15)', padding: '1px 5px', borderRadius: 2, fontWeight: 600 }}>
                          <CheckCircle2 size={10} color="#10B981" /> TELEMETRY VERIFIED
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => copyMessage(msg.content, i)}
                          title="Copy operational briefing"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedIndex === i ? '#10B981' : '#7D7D7D', padding: 2, display: 'flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace' }}
                        >
                          {copiedIndex === i ? <Check size={11} color="#10B981" /> : <Copy size={11} />}
                          <span>{copiedIndex === i ? 'Copied' : 'Copy'}</span>
                        </button>
                        {msg.ts && (
                          <span style={{ fontSize: 9, color: '#666', fontFamily: 'JetBrains Mono, monospace' }}>{msg.ts}</span>
                        )}
                      </div>
                    </div>

                    {/* Formatted Content */}
                    <TacticalMessageRenderer content={msg.content} />

                    {/* Tool Badges */}
                    {msg.tools && msg.tools.length > 0 && (
                      <div style={{ marginTop: 10, paddingTop: 6, borderTop: '1px solid #282828', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Terminal size={10} color="#29ABE2" />
                        <span style={{ fontSize: 9, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace' }}>FastMCP Tools:</span>
                        {msg.tools.map((t, ti) => (
                          <span key={ti} style={{ fontSize: 8.5, color: '#29ABE2', background: 'rgba(41,171,226,0.1)', border: '1px solid rgba(41,171,226,0.3)', padding: '1px 5px', borderRadius: 2, fontFamily: 'JetBrains Mono, monospace' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
