import React, { useState } from 'react'
import { Search, ChevronRight, X } from 'lucide-react'
import { StatusBadge, LoadingState, ErrorState, ReadinessBar, SectionHeader } from './Shared.jsx'
import AssetDetailPanel from './AssetDetailPanel.jsx'

export default function FleetView({ assets, loadingData, dataError, onRefresh, onOpenCopilot, authHeader }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [selectedAsset, setSelectedAsset] = useState(null)

  if (loadingData) return <LoadingState />
  if (dataError) return <ErrorState message={dataError} onRetry={onRefresh} />

  const types = ['ALL', ...Array.from(new Set(assets.map(a => a.asset_type)))]

  const filtered = assets.filter(a => {
    const matchSearch = !search ||
      a.asset_code.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.squadron.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter
    const matchType   = typeFilter === 'ALL'   || a.asset_type === typeFilter
    return matchSearch && matchStatus && matchType
  })

  const fmcC = assets.filter(a => a.status === 'FMC').length
  const pmcC = assets.filter(a => a.status === 'PMC').length
  const nmcC = assets.filter(a => a.status === 'NMC').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader
        tag="FLEET OPERATIONS"
        label="All Military Platforms"
        desc="Real-time airworthiness status for all tracked assets. Click any platform to open the diagnostic panel."
      />

      {/* Filter bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={13} color="#7D7D7D" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="input-dark"
            style={{ paddingLeft: 34, maxWidth: '100%' }}
            placeholder="Search asset code, name, squadron..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status filter tabs */}
        <div style={{ display: 'flex', gap: 0, border: '1px solid #494949' }}>
          {['ALL', 'FMC', 'PMC', 'NMC'].map(s => (
            <button key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '8px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: statusFilter === s ? '#FFC000' : '#181818',
                color: statusFilter === s ? '#000' : '#7D7D7D',
                border: 'none', cursor: 'pointer', transition: 'background-color 0.2s, color 0.2s',
                borderRight: s !== 'NMC' ? '1px solid #494949' : 'none'
              }}
            >
              {s}{s === 'FMC' ? ` (${fmcC})` : s === 'PMC' ? ` (${pmcC})` : s === 'NMC' ? ` (${nmcC})` : ` (${assets.length})`}
            </button>
          ))}
        </div>

        <select className="select-dark" style={{ flex: '0 0 auto', width: 200 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          {types.map(t => <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Count */}
      <p style={{ fontSize: 10, color: '#494949', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
        SHOWING {filtered.length} OF {assets.length} PLATFORMS
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', border: '1px solid #2A2A2A', background: '#181818' }}>
          <p style={{ color: '#7D7D7D', fontSize: 12 }}>No platforms match the current filters. Adjust search or filter criteria.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ASSET CODE</th>
                <th>PLATFORM</th>
                <th>TYPE</th>
                <th>SQUADRON</th>
                <th>STATUS</th>
                <th>READINESS</th>
                <th>FLT HRS</th>
                <th>LOCATION</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedAsset(a)}>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#FFC000' }}>{a.asset_code}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{a.name}</div>
                    <div style={{ fontSize: 10, color: '#7D7D7D', fontFamily: 'JetBrains Mono, monospace' }}>{a.model}</div>
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{a.asset_type.replace(/_/g, ' ')}</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{a.squadron}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>
                    <ReadinessBar score={a.readiness_score} status={a.status} />
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{a.total_flight_hours?.toFixed(0)}</td>
                  <td style={{ fontSize: 11, color: '#7D7D7D' }}>{a.base_location}</td>
                  <td>
                    <button className="btn-ghost-sm" onClick={e => { e.stopPropagation(); setSelectedAsset(a) }}>
                      Inspect <ChevronRight size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Asset detail panel */}
      {selectedAsset && (
        <AssetDetailPanel
          assetCode={selectedAsset.asset_code}
          onClose={() => setSelectedAsset(null)}
          onOpenCopilot={onOpenCopilot}
          authHeader={authHeader}
        />
      )}
    </div>
  )
}
