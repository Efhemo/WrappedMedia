import { LiveMap } from '../../../components/live-map'

export default function MapPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-5 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-white text-2xl font-bold">Live Map</h1>
          <p className="text-slate-500 text-sm mt-0.5">Real-time driver locations</p>
        </div>
      </div>
      <div className="flex-1 relative">
        <LiveMap />
      </div>
    </div>
  )
}
