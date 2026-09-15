import React, { useState, useEffect } from 'react'
import { X, FileText, CheckCircle2, AlertOctagon, Shield, Printer, Wrench, Layers } from 'lucide-react'

export default function MilStdModal({ assetCode, onClose }) {
  const [activeTab, setActiveTab] = useState('form781') // 'form781' or 'sortie'
  const [formData, setFormData] = useState(null)
  const [sortieData, setSortieData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!assetCode) return
    fetchData()
  }, [assetCode])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [fRes, sRes] = await Promise.all([
        fetch(`/api/v1/copilot/form-781a/${assetCode}`),
        fetch(`/api/v1/copilot/sortie-matrix/${assetCode}`)
      ])

      if (fRes.ok) setFormData(await fRes.json())
      if (sRes.ok) setSortieData(await sRes.json())
    } catch (e) {
      console.error(e)
      setError('Failed to retrieve military documents for platform.')
    } finally {
      setLoading(false)
    }
  }

  if (!assetCode) return null

  const isRedX = formData?.discrepancy_block?.symbol === 'RED_X'
  const isRedDiag = formData?.discrepancy_block?.symbol === 'RED_DIAGONAL'

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 max-w-4xl w-full p-6 relative text-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col border border-slate-800 rounded-xl shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white font-mono tracking-wider">{assetCode}</h2>
                <span className="text-[10px] font-mono font-medium tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  MIL-STD-1388 / T.O. 00-20-1
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Tactical Flight-Line Discrepancy & Air Tasking Order (ATO) Matrix
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="btn-secondary !py-1.5 !px-2.5 text-xs"
              title="Print Official Document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Dispatch</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Segmented Tab Selection */}
        <div className="flex items-center space-x-2 mb-4 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('form781')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center space-x-2 border ${
              activeTab === 'form781'
                ? 'bg-slate-800 border-blue-500 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>AFTO Form 781A Discrepancy Sheet</span>
          </button>

          <button
            onClick={() => setActiveTab('sortie')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center space-x-2 border ${
              activeTab === 'sortie'
                ? 'bg-slate-800 border-blue-500 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ATO Sortie Re-allocation Matrix</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400 font-mono flex flex-col items-center justify-center space-y-2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Compiling defense discrepancy manifest from prognostics telemetry...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/30 border border-rose-800 rounded-xl text-xs text-rose-300 font-mono">
              {error}
            </div>
          ) : activeTab === 'form781' && formData ? (
            /* Official AFTO Form 781A Layout */
            <div className="bg-[#05070c] border border-slate-800 rounded-xl p-5 font-mono text-xs space-y-4 print:bg-white print:text-black shadow-inner">
              {/* Form Title Banner */}
              <div className="border-b-2 border-slate-700 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm tracking-wide text-white print:text-black">
                    AFTO FORM 781A (DIGITAL EXPEDITIONARY)
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    AEROSPACE VEHICLE MAINTENANCE DISCREPANCY & WORK DOCUMENT
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400">JCN: </span>
                  <span className="font-bold text-emerald-400 print:text-black">
                    {formData.document_tracking_id}
                  </span>
                  <p className="text-[10px] text-slate-400">{formData.date_dispatched}</p>
                </div>
              </div>

              {/* Platform Metadata Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">TAIL / ASSET CODE</span>
                  <span className="font-bold text-white">{formData.platform_data.tail_number}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">MDS MODEL</span>
                  <span className="font-bold text-slate-200">{formData.platform_data.mission_design_series}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">SERIAL NUMBER</span>
                  <span className="font-bold text-slate-200">{formData.platform_data.serial_number}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">AIRWORTHINESS STATUS</span>
                  <span className={`font-bold ${
                    isRedX ? 'text-rose-400' : isRedDiag ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {formData.platform_data.airworthiness_status}
                  </span>
                </div>
              </div>

              {/* Military Symbol & Discrepancy Block */}
              <div className="border border-slate-700/80 rounded-lg p-4 bg-slate-900/50">
                <div className="flex items-start space-x-4">
                  {/* Red X / Red Diagonal Symbol Box */}
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center font-black text-2xl shrink-0 border-2 ${
                    isRedX
                      ? 'bg-rose-950/70 border-rose-500 text-rose-400'
                      : isRedDiag
                      ? 'bg-amber-950/70 border-amber-500 text-amber-400'
                      : 'bg-emerald-950/70 border-emerald-500 text-emerald-400'
                  }`}>
                    {formData.discrepancy_block.symbol_display}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 uppercase">
                        SYMBOL MEANING: {formData.discrepancy_block.symbol_meaning}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        DISPATCHED BY: {formData.discrepancy_block.reported_by}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed pt-1 font-sans">
                      {formData.discrepancy_block.discrepancy_narrative}
                    </p>
                  </div>
                </div>
              </div>

              {/* Corrective Action Block */}
              <div className="border border-slate-700/80 rounded-lg p-4 bg-slate-900/50 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase flex items-center space-x-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>CORRECTIVE ACTION DIRECTIVE</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-300 font-mono">
                    {formData.corrective_action_block.action_code}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {formData.corrective_action_block.corrective_narrative}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-[11px] text-slate-400 border-t border-slate-800">
                  <div>WORK CENTER: <strong className="text-slate-200">{formData.corrective_action_block.work_center}</strong></div>
                  <div>EST. MAN-HOURS: <strong className="text-slate-200">{formData.corrective_action_block.estimated_man_hours}h</strong></div>
                  <div>LEAD TECH: <strong className="text-slate-200">{formData.corrective_action_block.lead_technician}</strong></div>
                </div>
              </div>

              {/* NSN Parts Manifest Table */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 mb-2 block font-mono">
                  DEFENSE LOGISTICS AGENCY (DLA) PARTS REQUISITION MANIFEST
                </span>
                <table className="w-full text-left border border-slate-800 rounded-lg overflow-hidden">
                  <thead className="bg-slate-800/80 text-slate-300 text-[10px]">
                    <tr>
                      <th className="p-2">NATIONAL STOCK NUMBER (NSN)</th>
                      <th className="p-2">NOMENCLATURE / PART NAME</th>
                      <th className="p-2">QTY</th>
                      <th className="p-2">UNIT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-[11px]">
                    {formData.parts_manifest?.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        <td className="p-2 font-mono text-blue-400">{p.nsn}</td>
                        <td className="p-2 text-white">{p.part_name}</td>
                        <td className="p-2 font-bold">{p.qty}</td>
                        <td className="p-2 text-slate-400">{p.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'sortie' && sortieData ? (
            /* ATO Sortie Re-allocation Matrix */
            <div className="space-y-4">
              <div className="panel-card p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Tactical Operational Disposition
                </h4>
                <p className="text-xs text-emerald-400 font-medium font-sans">
                  {sortieData.tactical_disposition}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-1.5">
                  Lowest Subsystem RUL: <strong className="text-white">{sortieData.lowest_subsystem_rul_hours} Hours</strong> •
                  Cleared Sorties: <strong className="text-white">{sortieData.cleared_sortie_profiles_count} Profiles</strong>
                </p>
              </div>

              {/* Cleared Sorties List */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approved Mission Sortie Profiles</span>
                </h4>
                {sortieData.cleared_sortie_profiles?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-900/40 rounded-lg border border-slate-800">
                    No combat profiles authorized. Platform requires depot turnaround.
                  </p>
                ) : (
                  sortieData.cleared_sortie_profiles.map((p, i) => (
                    <div key={i} className="p-3.5 rounded-lg bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-xs text-white tracking-tight">{p.profile_name}</span>
                          <span className="status-badge-fmc text-[10px]">
                            {p.stress_level} STRESS
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                          Safety Margin: +{p.margin_hours} flight hours above mission threshold
                        </p>
                      </div>
                      <span className="status-badge-fmc text-[10px]">
                        CLEARED
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Restricted Sorties List */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center space-x-1.5">
                  <AlertOctagon className="w-4 h-4" />
                  <span>Restricted Air Tasking Order Profiles</span>
                </h4>
                {sortieData.restricted_sortie_profiles?.map((p, i) => (
                  <div key={i} className="p-3.5 rounded-lg bg-rose-950/15 border border-rose-800/40 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-xs text-white tracking-tight">{p.profile_name}</span>
                        <span className="status-badge-nmc text-[10px]">
                          {p.stress_level} STRESS
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-300 mt-0.5 font-sans">
                        Restriction: {p.reason}
                      </p>
                    </div>
                    <span className="status-badge-nmc text-[10px]">
                      RESTRICTED
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
