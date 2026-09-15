import React, { useState } from 'react'
import { Wrench, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export default function WorkOrdersView({ workOrders, onApproveOrder }) {
  const [approvingId, setApprovingId] = useState(null)

  const handleApprove = async (id) => {
    setApprovingId(id)
    await onApproveOrder(id)
    setApprovingId(null)
  }

  return (
    <div className="bg-[#0f1422] border border-slate-800 rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-emerald-400" />
            <span>Condition-Based Maintenance Dispatch Queue</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Ranked work orders prioritized by mission criticality × component failure risk.
          </p>
        </div>
        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
          Pending Actions: {workOrders?.filter(w => w.status === 'PENDING').length || 0}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workOrders?.map(wo => {
          const isPending = wo.status === 'PENDING'
          const isCrit = wo.priority === 'CRITICAL'
          const isApproved = wo.status === 'APPROVED'

          return (
            <div 
              key={wo.id}
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                isCrit ? 'bg-rose-950/10 border-rose-900/60' : 'bg-slate-900/50 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isCrit ? 'bg-rose-500 text-white' : 'bg-amber-500 text-black'
                  }`}>
                    {wo.priority} PRIORITY
                  </span>
                  <span className={`text-xs font-mono font-bold ${
                    isApproved ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {wo.status}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mb-1.5 leading-snug">{wo.title}</h4>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">{wo.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <div className="text-slate-400">
                  <span>Est: <strong className="text-slate-200">{wo.estimated_hours} hrs</strong></span>
                  <p className="text-[10px] text-slate-400">Tech: {wo.assigned_to || 'Unassigned'}</p>
                </div>

                {isPending && (
                  <button
                    onClick={() => handleApprove(wo.id)}
                    disabled={approvingId === wo.id}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition disabled:opacity-50 flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{approvingId === wo.id ? 'Approving...' : 'Approve Order'}</span>
                  </button>
                )}
                {isApproved && (
                  <span className="text-emerald-400 text-xs font-medium flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorized</span>
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
