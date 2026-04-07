'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

type Campaign = { id: string; name: string; brand: string; status: string }
type Driver = { id: string; status: string }

export function DriverActions({ driver, campaigns }: { driver: Driver; campaigns: Campaign[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState('')

  const updateStatus = async (status: string) => {
    setLoading(true)
    await supabase.from('drivers').update({ status }).eq('id', driver.id)
    setLoading(false)
    router.refresh()
  }

  const assignCampaign = async () => {
    if (!selectedCampaign) return
    setLoading(true)

    // Upsert driver_campaigns row
    await supabase.from('driver_campaigns').upsert({
      driver_id: driver.id,
      campaign_id: selectedCampaign,
      acceptance_status: 'pending_acceptance',
    })

    // Move driver to assigned status
    await supabase.from('drivers').update({ status: 'assigned' }).eq('id', driver.id)

    setLoading(false)
    setShowAssign(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      {driver.status === 'pending' && (
        <>
          <button
            onClick={() => setShowAssign(true)}
            disabled={loading}
            className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Assign Campaign
          </button>
          <button
            onClick={() => updateStatus('inactive')}
            disabled={loading}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Reject
          </button>
        </>
      )}

      {driver.status === 'assigned' && (
        <button
          onClick={() => updateStatus('pending')}
          disabled={loading}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          Unassign
        </button>
      )}

      {driver.status === 'active' && (
        <button
          onClick={() => updateStatus('inactive')}
          disabled={loading}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          Deactivate
        </button>
      )}

      {driver.status === 'inactive' && (
        <button
          onClick={() => updateStatus('pending')}
          disabled={loading}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          Reactivate
        </button>
      )}

      {/* Assign campaign modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowAssign(false)}>
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700 w-96 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold text-lg">Assign Campaign</h3>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select a campaign...</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.brand} — {c.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={assignCampaign}
                disabled={!selectedCampaign || loading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {loading ? 'Assigning...' : 'Assign'}
              </button>
              <button
                onClick={() => setShowAssign(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
