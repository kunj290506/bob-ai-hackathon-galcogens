import React, { useState, useEffect } from 'react'
import { X, FileText, CheckCircle2, AlertOctagon, Shield, Printer, ExternalLink, Wrench, Layers } from 'lucide-react'

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0b0e17] border border-slate-700/80 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative text-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white font-mono">{assetCode}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  MIL-STD-1388 / T.O. 00-20-1
                </span>
              </div>
              <p className="text-xs text-slate-400">Tactical Discrepancy Documentation & Mission Reallocation</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center space-x-2 mb-4 border-b border-slate-800/80 pb-2">
          <button
            onClick={() => setActiveTab('form781')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'form781'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>AFTO Form 781A Discrepancy Sheet</span>
          </button>

          <button
            onClick={() => setActiveTab('sortie')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'sortie'
                ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ATO Sortie Re-allocation Matrix</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400 font-mono">
              Generating military standard document from HUMS prognostics...
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300">
              {error}
            </div>
          ) : activeTab === 'form781' && formData ? (
            /* Official AFTO Form 781A Layout */
            <div className="bg-[#080b12] border border-slate-700/60 rounded-xl p-5 font-mono text-xs space-y-4 print:bg-white print:text-black">
              {/* Form Title Banner */}
              <div className="border-b-2 border-slate-600 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
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
              <div className="border border-slate-700/80 rounded-lg p-4 bg-slate-900/40">
                <div className="flex items-start space-x-4">
                  {/* Red X / Red Diagonal Symbol Box */}
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-black text-3xl shrink-0 border-2 ${
                    isRedX
                      ? 'bg-rose-950/60 border-rose-600 text-rose-500 shadow-lg shadow-rose-900/30'
                      : isRedDiag
                      ? 'bg-amber-950/60 border-amber-600 text-amber-500'
                      : 'bg-emerald-950/60 border-emerald-600 text-emerald-500'
                  }`}>
                    {formData.discrepancy_block.symbol_display}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 uppercase">
                        SYMBOL MEANING: {formData.discrepancy_block.symbol_meaning}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        DISPATCHED BY: {formData.discrepancy_block.reported_by}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed pt-1">
                      {formData.discrepancy_block.discrepancy_narrative}
                    </p>
                  </div>
                </div>
              </div>

              {/* Corrective Action Block */}
              <div className="border border-slate-700/80 rounded-lg p-4 bg-slate-900/40 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase flex items-center space-x-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>CORRECTIVE ACTION DIRECTIVE</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-300">
                    {formData.corrective_action_block.action_code}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
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
                <span className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">
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
                        <td className="p-2 font-mono text-emerald-400">{p.nsn}</td>
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
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  TACTICAL OPERATIONAL DISPOSITION
                </h4>
                <p className="text-xs text-emerald-400 font-semibold">
                  {sortieData.tactical_disposition}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Lowest Subsystem RUL: <strong className="text-white">{sortieData.lowest_subsystem_rul_hours} Hours</strong> •
                  Cleared Sorties: <strong className="text-white">{sortieData.cleared_sortie_profiles_count} Profiles</strong>
                </p>
              </div>

              {/* Cleared Sorties List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approved Mission Sortie Profiles</span>
                </h4>
                {sortieData.cleared_sortie_profiles?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-900/40 rounded-lg border border-slate-800">
                    No combat profiles authorized. Platform requires depot turnaround.
                  </p>
                ) : (
                  sortieData.cleared_sortie_profiles.map((p, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/50 flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-white">{p.profile_name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                            {p.stress_level} STRESS
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Safety Margin: +{p.margin_hours} flight hours above threshold
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-600 text-white">
                        CLEARED
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Restricted Sorties List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center space-x-1.5">
                  <AlertOctagon className="w-4 h-4" />
                  <span>Restricted Air Tasking Order Profiles</span>
                </h4>
                {sortieData.restricted_sortie_profiles?.map((p, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-white">{p.profile_name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                          {p.stress_level} STRESS
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-300 mt-0.5">
                        Restriction: {p.reason}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-rose-600/30 text-rose-300 border border-rose-600/40">
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
