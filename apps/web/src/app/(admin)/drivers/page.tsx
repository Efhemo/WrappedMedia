import { getSupabaseAdmin } from '../../../lib/supabase-admin'
const supabase = getSupabaseAdmin()
import { DriverActions } from './driver-actions'

async function getDrivers() {
  const { data } = await supabase
    .from('drivers')
    .select(`
      id, full_name, phone, city, platform,
      vehicle_make, vehicle_model, vehicle_year, license_plate,
      status, created_at,
      wrap_photos(id, photo_url, angle)
    `)
    .order('created_at', { ascending: false })
  return data ?? []
}

async function getCampaigns() {
  const { data } = await supabase
    .from('campaigns')
    .select('id, name, brand, status')
    .in('status', ['scheduled', 'live'])
  return data ?? []
}

const STATUS_STYLES: Record<string, string> = {
  active:   'bg-green-500/10 text-green-400 border-green-500/20',
  pending:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  assigned: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

export default async function DriversPage() {
  const [drivers, campaigns] = await Promise.all([getDrivers(), getCampaigns()])

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Drivers</h1>
        <p className="text-slate-500 text-sm mt-1">{drivers.length} total drivers</p>
      </div>

      {/* ── Mobile card list ── */}
      <div className="md:hidden space-y-3">
        {drivers.length === 0 && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center text-slate-600 text-sm">
            No drivers yet
          </div>
        )}
        {drivers.map((d) => (
          <div key={d.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-white font-semibold">{d.full_name}</p>
                <p className="text-slate-500 text-xs mt-0.5">{d.phone}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize shrink-0 ${STATUS_STYLES[d.status] ?? ''}`}>
                {d.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800 rounded-lg p-2.5">
                <p className="text-slate-500 mb-0.5">Vehicle</p>
                <p className="text-slate-200">{d.vehicle_year} {d.vehicle_make} {d.vehicle_model}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-2.5">
                <p className="text-slate-500 mb-0.5">Platform</p>
                <p className="text-slate-200 capitalize">{d.platform}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-2.5">
                <p className="text-slate-500 mb-0.5">City</p>
                <p className="text-slate-200">{d.city}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-2.5">
                <p className="text-slate-500 mb-0.5">Plate</p>
                <p className="text-slate-200">{d.license_plate}</p>
              </div>
            </div>
            {(d.wrap_photos as any[]).length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {(d.wrap_photos as any[]).map((p: any) => (
                  <a key={p.id} href={p.photo_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded capitalize border border-slate-700">
                    {p.angle}
                  </a>
                ))}
              </div>
            )}
            <DriverActions driver={d} campaigns={campaigns} />
          </div>
        ))}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden md:block bg-slate-900 rounded-2xl border border-slate-800 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              {['Driver', 'Vehicle', 'City', 'Platform', 'Photos', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {drivers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-slate-600 text-sm">No drivers yet</td>
              </tr>
            )}
            {drivers.map((d) => (
              <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-5 py-4">
                  <p className="text-white text-sm font-medium">{d.full_name}</p>
                  <p className="text-slate-500 text-xs">{d.phone}</p>
                </td>
                <td className="px-5 py-4">
                  <p className="text-slate-300 text-sm">{d.vehicle_year} {d.vehicle_make} {d.vehicle_model}</p>
                  <p className="text-slate-500 text-xs">{d.license_plate}</p>
                </td>
                <td className="px-5 py-4 text-slate-300 text-sm">{d.city}</td>
                <td className="px-5 py-4 text-slate-300 text-sm capitalize">{d.platform}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-1.5">
                    {(d.wrap_photos as any[]).length === 0 ? (
                      <span className="text-slate-600 text-xs">None</span>
                    ) : (
                      (d.wrap_photos as any[]).map((p: any) => (
                        <a key={p.id} href={p.photo_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded capitalize border border-slate-700 transition-colors">
                          {p.angle}
                        </a>
                      ))
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLES[d.status] ?? ''}`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <DriverActions driver={d} campaigns={campaigns} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
