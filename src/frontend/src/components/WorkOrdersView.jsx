import React, { useState } from 'react'
import { Wrench, CheckCircle2, Clock, ShieldCheck, AlertCircle } from 'lucide-react'

export default function WorkOrdersView({ workOrders, onApproveOrder }) {
  const [approvingId, setApprovingId] = useState(null)

  const handleApprove = async (id) => {
    setApprovingId(id)
    await onApproveOrder(id)
    setApprovingId(null)
  }

  const pendingCount = workOrders?.filter(w => w.status === 'PENDING').length || 0

  return (
    <div className="panel-card p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-mono font-medium tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
              DISPATCH QUEUE
            </span>
            <span className="text-[11px] text-slate-400">Mission-Optimized Prioritization</span>
          </div>
          <h3 className="text-base font-semibold text-white tracking-tight flex items-center space-x-2">
            <Wrench className="w-4 h-4 text-slate-400" />
            <span>Condition-Based Maintenance Work Orders</span>
          </h3>
        </div>
        <div className="self-start sm:self-auto text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700">
          Pending Dispatch Approval: <strong className="text-amber-400">{pendingCount}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workOrders?.map(wo => {
          const isPending = wo.status === 'PENDING'
          const isCrit = wo.priority === 'CRITICAL'
          const isApproved = wo.status === 'APPROVED'

          return (
            <div 
              key={wo.id}
              className={`p-4 rounded-lg border flex flex-col justify-between transition-all duration-200 ${
                isCrit 
                  ? 'bg-rose-950/15 border-rose-800/50' 
                  : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={
                    isCrit ? 'status-badge-nmc text-[10px]' : 'status-badge-pmc text-[10px]'
                  }>
                    {wo.priority} PRIORITY
                  </span>
                  <span className={`text-[11px] font-mono font-medium ${
                    isApproved ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {wo.status}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-white mb-1 leading-snug">{wo.title}</h4>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed font-sans">{wo.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="text-slate-400 font-mono text-[11px]">
                  <span>Est: <strong className="text-slate-200">{wo.estimated_hours}h</strong></span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Assigned: {wo.assigned_to || 'Flight Line Crew'}</p>
                </div>

                {isPending && (
                  <button
                    onClick={() => handleApprove(wo.id)}
                    disabled={approvingId === wo.id}
                    className="btn-primary !py-1.5 !px-3 !text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{approvingId === wo.id ? 'Authorizing...' : 'Authorize Dispatch'}</span>
                  </button>
                )}
                {isApproved && (
                  <span className="text-emerald-400 text-xs font-mono font-medium flex items-center space-x-1 bg-emerald-950/30 px-2.5 py-1 rounded border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>AUTHORIZED</span>
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
