import Link from 'next/link'
import { supabaseAdmin as supabase } from '../../../lib/supabase-admin'

async function getStats() {
  const [
    { count: totalDrivers },
    { count: activeDrivers },
    { count: pendingDrivers },
    { count: assignedDrivers },
    { count: liveCampaigns },
    { count: scheduledCampaigns },
  ] = await Promise.all([
    supabase.from('drivers').select('id', { count: 'exact', head: true }),
    supabase.from('drivers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('drivers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('drivers').select('id', { count: 'exact', head: true }).eq('status', 'assigned'),
    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'live'),
    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
  ])
  return { totalDrivers, activeDrivers, pendingDrivers, assignedDrivers, liveCampaigns, scheduledCampaigns }
}

async function getRecentDrivers() {
  const { data } = await supabase
    .from('drivers')
    .select('id, full_name, city, platform, status, created_at')
    .order('created_at', { ascending: false })
    .limit(6)
  return data ?? []
}

async function getLiveCampaigns() {
  const { data } = await supabase
    .from('campaigns')
    .select('id, name, brand, markets, status, end_date, driver_campaigns(driver_id)')
    .in('status', ['live', 'scheduled'])
    .order('created_at', { ascending: false })
    .limit(4)
  return data ?? []
}

const STATUS_STYLES: Record<string, string> = {
  active:    'bg-green-500/10 text-green-400 border border-green-500/20',
  pending:   'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  assigned:  'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  inactive:  'bg-slate-500/10 text-slate-400 border border-slate-700',
  live:      'bg-green-500/10 text-green-400 border border-green-500/20',
  scheduled: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  completed: 'bg-slate-500/10 text-slate-400 border border-slate-700',
}

const PLATFORM_ICONS: Record<string, string> = {
  uber: '🚗', lyft: '🟣', doordash: '🍕', skip: '🛵', instacart: '🛒',
}

export default async function DashboardPage() {
  const [stats, recentDrivers, campaigns] = await Promise.all([
    getStats(), getRecentDrivers(), getLiveCampaigns(),
  ])

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      {/* Page header */}
      <div>
        <h1 className="text-white text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Wrapped Media driver &amp; campaign dashboard</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Drivers', value: stats.totalDrivers ?? 0, sub: 'all time', color: 'text-white', icon: '👥' },
          { label: 'Active Drivers', value: stats.activeDrivers ?? 0, sub: 'currently driving', color: 'text-green-400', icon: '🟢' },
          { label: 'Pending Review', value: stats.pendingDrivers ?? 0, sub: 'awaiting assignment', color: 'text-amber-400', icon: '⏳', href: '/drivers' },
          { label: 'Assigned', value: stats.assignedDrivers ?? 0, sub: 'pending acceptance', color: 'text-blue-400', icon: '📋' },
          { label: 'Live Campaigns', value: stats.liveCampaigns ?? 0, sub: 'running now', color: 'text-orange-400', icon: '📢' },
          { label: 'Scheduled', value: stats.scheduledCampaigns ?? 0, sub: 'upcoming', color: 'text-slate-300', icon: '📅' },
        ].map(({ label, value, sub, color, icon, href }) => (
          <div key={label} className={`bg-slate-900 rounded-2xl p-5 border border-slate-800 ${href ? 'hover:border-slate-700 transition-colors' : ''}`}>
            {href ? (
              <Link href={href} className="block">
                <StatCardInner icon={icon} label={label} value={value} sub={sub} color={color} />
              </Link>
            ) : (
              <StatCardInner icon={icon} label={label} value={value} sub={sub} color={color} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent drivers — wider */}
        <div className="lg:col-span-3 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-white font-semibold">Recent Drivers</h2>
            <Link href="/drivers" className="text-orange-400 text-xs hover:text-orange-300 font-medium">
              View all →
            </Link>
          </div>
          {recentDrivers.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-slate-600 text-sm">No drivers yet</p>
              <p className="text-slate-700 text-xs mt-1">Drivers appear here after signing up on the mobile app</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {recentDrivers.map((d) => (
                <div key={d.id} className="px-6 py-3.5 flex items-center gap-3 hover:bg-slate-800/40 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-base shrink-0">
                    {PLATFORM_ICONS[d.platform] ?? '🚗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{d.full_name}</p>
                    <p className="text-slate-500 text-xs capitalize">{d.city} · {d.platform}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize shrink-0 ${STATUS_STYLES[d.status] ?? ''}`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Campaigns — narrower */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-white font-semibold">Campaigns</h2>
            <Link href="/campaigns" className="text-orange-400 text-xs hover:text-orange-300 font-medium">
              Manage →
            </Link>
          </div>
          {campaigns.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-slate-600 text-sm">No campaigns yet</p>
              <Link href="/campaigns" className="text-orange-400 text-xs mt-2 inline-block">
                Create one →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {campaigns.map((c) => (
                <div key={c.id} className="px-6 py-4 hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-orange-400 text-xs font-bold uppercase tracking-wide">{c.brand}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[c.status] ?? ''}`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-white text-sm font-medium leading-tight">{c.name}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-slate-500 text-xs">{(c.markets as string[]).join(', ')}</p>
                    <p className="text-slate-600 text-xs">{(c.driver_campaigns as any[]).length} drivers</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCardInner({ icon, label, value, sub, color }: {
  icon: string; label: string; value: number; sub: string; color: string
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className={`text-3xl font-bold mt-1.5 ${color}`}>{value}</p>
        <p className="text-slate-600 text-xs mt-1">{sub}</p>
      </div>
      <span className="text-2xl">{icon}</span>
    </div>
  )
}
