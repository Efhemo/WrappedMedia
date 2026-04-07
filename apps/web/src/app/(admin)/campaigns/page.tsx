import { getSupabaseAdmin } from '../../../lib/supabase-admin'
const supabase = getSupabaseAdmin()
import { CampaignForm } from './campaign-form'

async function getCampaigns() {
  const { data } = await supabase
    .from('campaigns')
    .select(`
      id, name, brand, markets, driver_count,
      wrap_type, status, start_date, end_date, notes, created_at,
      driver_campaigns(driver_id)
    `)
    .order('created_at', { ascending: false })
  return data ?? []
}

const STATUS_STYLES: Record<string, string> = {
  live: 'bg-green-500/10 text-green-400 border-green-500/20',
  scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

export default async function CampaignsPage() {
  const campaigns = await getCampaigns()

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Campaigns</h1>
          <p className="text-slate-500 text-sm mt-1">{campaigns.length} total campaigns</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign list */}
        <div className="lg:col-span-2 space-y-3">
          {campaigns.length === 0 && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center">
              <p className="text-slate-600 text-sm">No campaigns yet. Create one →</p>
            </div>
          )}
          {campaigns.map((c) => {
            const assignedCount = (c.driver_campaigns as any[]).length
            return (
              <div key={c.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-orange-400 text-xs font-bold uppercase tracking-wide">{c.brand}</p>
                    <p className="text-white font-semibold text-lg leading-tight mt-0.5">{c.name}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLES[c.status] ?? ''}`}>
                    {c.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800 rounded-xl p-3">
                    <p className="text-slate-500 text-xs">Drivers</p>
                    <p className="text-white font-semibold">{assignedCount} / {c.driver_count}</p>
                  </div>
                  <div className="bg-slate-800 rounded-xl p-3">
                    <p className="text-slate-500 text-xs">Wrap</p>
                    <p className="text-white font-semibold capitalize">{c.wrap_type}</p>
                  </div>
                  <div className="bg-slate-800 rounded-xl p-3">
                    <p className="text-slate-500 text-xs">Markets</p>
                    <p className="text-white font-semibold text-xs truncate">{(c.markets as string[]).join(', ') || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{c.start_date}</span>
                  <span>→</span>
                  <span>{c.end_date}</span>
                  {c.notes && <span className="ml-auto text-slate-600 truncate max-w-[200px]">{c.notes}</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Create form */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 md:sticky md:top-8">
            <h2 className="text-white font-semibold mb-4">New Campaign</h2>
            <CampaignForm />
          </div>
        </div>
      </div>
    </div>
  )
}
