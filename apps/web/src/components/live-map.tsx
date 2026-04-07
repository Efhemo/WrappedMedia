'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { supabase } from '../lib/supabase'

type DriverPin = {
  driver_id: string
  lat: number
  lng: number
  recorded_at: string
  driver?: { full_name: string; city: string; platform: string }
}

export function LiveMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<Record<string, mapboxgl.Marker>>({})
  const [activeCount, setActiveCount] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const updateMarker = (pin: DriverPin) => {
    const { driver_id, lat, lng, driver } = pin

    if (markers.current[driver_id]) {
      markers.current[driver_id].setLngLat([lng, lat])
    } else {
      // Create marker element
      const el = document.createElement('div')
      el.className = 'driver-marker'
      el.style.cssText = `
        width: 36px; height: 36px; border-radius: 50%;
        background: #F97316; border: 3px solid #fff;
        display: flex; align-items: center; justify-content: center;
        font-size: 16px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        transition: transform 0.2s;
      `
      el.innerHTML = '🚗'
      el.onmouseenter = () => { el.style.transform = 'scale(1.2)' }
      el.onmouseleave = () => { el.style.transform = 'scale(1)' }

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div style="padding: 8px; min-width: 160px;">
            <p style="font-weight: 600; color: #0f172a; margin: 0 0 4px">${driver?.full_name ?? 'Driver'}</p>
            <p style="color: #64748b; font-size: 12px; margin: 0; text-transform: capitalize">
              ${driver?.city ?? ''} · ${driver?.platform ?? ''}
            </p>
          </div>
        `)

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!)

      markers.current[driver_id] = marker
    }
  }

  const loadInitialLocations = async () => {
    // Get latest location per driver
    const { data: locations } = await supabase
      .from('driver_locations')
      .select(`
        driver_id, lat, lng, recorded_at,
        driver:drivers(full_name, city, platform)
      `)
      .order('recorded_at', { ascending: false })

    if (!locations) return

    // Deduplicate — keep only latest per driver
    const seen = new Set<string>()
    const latest = locations.filter((l) => {
      if (seen.has(l.driver_id)) return false
      seen.add(l.driver_id)
      return true
    })

    latest.forEach((pin) => updateMarker(pin as unknown as DriverPin))
    setActiveCount(latest.length)
    if (latest.length > 0) setLastUpdated(new Date())
  }

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-114.0719, 51.0447], // Calgary default
      zoom: 11,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.current.on('load', loadInitialLocations)

    // Poll every 15 seconds — works on Supabase free tier
    const interval = setInterval(loadInitialLocations, 15000)

    return () => {
      clearInterval(interval)
      map.current?.remove()
      map.current = null
      markers.current = {}
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* HUD overlay */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
        <div className="bg-slate-950/90 backdrop-blur rounded-xl px-4 py-2.5 border border-slate-800 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white text-sm font-medium">{activeCount} active driver{activeCount !== 1 ? 's' : ''}</span>
        </div>
        {lastUpdated && (
          <div className="bg-slate-950/90 backdrop-blur rounded-xl px-4 py-2 border border-slate-800">
            <span className="text-slate-500 text-xs">
              Refreshes every 15s · {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
