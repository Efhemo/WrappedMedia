export type DriverStatus = 'pending' | 'active' | 'inactive'
export type Platform = 'uber' | 'lyft' | 'doordash' | 'skip' | 'instacart'
export type WrapAngle = 'front' | 'side' | 'rear'

export interface Driver {
  id: string
  user_id: string
  full_name: string
  phone: string
  city: string
  platform: Platform
  vehicle_make: string
  vehicle_model: string
  vehicle_year: number
  license_plate: string
  status: DriverStatus
  created_at: string
}

export interface DriverLocation {
  id: string
  driver_id: string
  lat: number
  lng: number
  recorded_at: string
}

export interface WrapPhoto {
  id: string
  driver_id: string
  photo_url: string
  angle: WrapAngle
  uploaded_at: string
}
