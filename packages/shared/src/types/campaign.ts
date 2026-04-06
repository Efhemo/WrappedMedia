export type CampaignStatus = 'scheduled' | 'live' | 'completed'
export type WrapType = 'full' | 'partial'

export interface Campaign {
  id: string
  name: string
  brand: string
  markets: string[]
  driver_count: number
  wrap_type: WrapType
  status: CampaignStatus
  start_date: string
  end_date: string
  notes?: string
  created_at: string
}

export interface DriverCampaign {
  driver_id: string
  campaign_id: string
  assigned_at: string
}
