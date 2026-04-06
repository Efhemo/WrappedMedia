import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import type { Driver, Campaign } from '@wrapped/shared'

type DriverCampaignWithCampaign = {
  acceptance_status: string
  wrap_photo_url: string | null
  campaign: Campaign
}

export default function HomeScreen() {
  const router = useRouter()
  const { user, signOut } = useAuthStore()
  const [driver, setDriver] = useState<Driver | null>(null)
  const [assignment, setAssignment] = useState<DriverCampaignWithCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    if (!user) return

    const { data: driverData } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', user.id)
      .single()

    setDriver(driverData)

    if (driverData) {
      const { data: assignmentData } = await supabase
        .from('driver_campaigns')
        .select('acceptance_status, wrap_photo_url, campaign:campaigns(*)')
        .eq('driver_id', driverData.id)
        .neq('acceptance_status', 'completed')
        .maybeSingle()

      setAssignment(assignmentData as DriverCampaignWithCampaign | null)
    }

    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace('/(auth)/login')
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#F97316" size="large" />
      </View>
    )
  }

  const firstName = driver?.full_name?.split(' ')[0] ?? 'Driver'
  const isPending = driver?.status === 'pending'
  const isAssigned = driver?.status === 'assigned'
  const isActive = driver?.status === 'active'

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.inner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, {firstName} 👋</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, {
                backgroundColor: isActive ? '#22C55E' : isPending ? '#F59E0B' : '#F97316'
              }]} />
              <Text style={styles.statusText}>
                {isPending ? 'Pending Review' : isAssigned ? 'Campaign Assigned' : 'Active'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* Pending state */}
        {isPending && (
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>⏳</Text>
            <Text style={styles.infoTitle}>Vehicle Under Review</Text>
            <Text style={styles.infoBody}>
              Our team is reviewing your vehicle. We'll notify you once a campaign is assigned.
            </Text>
          </View>
        )}

        {/* Campaign card — pending acceptance */}
        {isAssigned && assignment?.acceptance_status === 'pending_acceptance' && (
          <View style={styles.campaignCard}>
            <View style={styles.campaignCardHeader}>
              <Text style={styles.campaignBrand}>{assignment.campaign.brand}</Text>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>Action Required</Text>
              </View>
            </View>
            <Text style={styles.campaignName}>{assignment.campaign.name}</Text>
            <Text style={styles.campaignMeta}>
              {assignment.campaign.markets?.join(', ')} · {assignment.campaign.wrap_type === 'full' ? 'Full Wrap' : 'Partial Wrap'}
            </Text>
            <Text style={styles.campaignDates}>
              {assignment.campaign.start_date} → {assignment.campaign.end_date}
            </Text>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => router.push('/(app)/accept-campaign')}
            >
              <Text style={styles.acceptBtnText}>Accept Campaign →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Active campaign + drive button */}
        {isActive && assignment?.acceptance_status === 'active' && (
          <>
            <View style={styles.campaignCard}>
              <View style={styles.campaignCardHeader}>
                <Text style={styles.campaignBrand}>{assignment.campaign.brand}</Text>
                <View style={[styles.newBadge, { backgroundColor: '#22C55E' }]}>
                  <Text style={styles.newBadgeText}>Active</Text>
                </View>
              </View>
              <Text style={styles.campaignName}>{assignment.campaign.name}</Text>
              <Text style={styles.campaignMeta}>
                {assignment.campaign.markets?.join(', ')} · {assignment.campaign.wrap_type === 'full' ? 'Full Wrap' : 'Partial Wrap'}
              </Text>
              <Text style={styles.campaignDates}>Ends {assignment.campaign.end_date}</Text>
            </View>

            <TouchableOpacity
              style={styles.driveBtn}
              onPress={() => router.push('/(app)/drive')}
            >
              <Text style={styles.driveBtnText}>Start Drive</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Active but no campaign */}
        {isActive && !assignment && (
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>✅</Text>
            <Text style={styles.infoTitle}>You're approved!</Text>
            <Text style={styles.infoBody}>
              No active campaign right now. We'll notify you when one is assigned.
            </Text>
          </View>
        )}

        {/* Vehicle info */}
        {driver && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Vehicle</Text>
            <View style={styles.detailCard}>
              {[
                { label: 'Platform', value: driver.platform },
                { label: 'Vehicle', value: `${driver.vehicle_year} ${driver.vehicle_make} ${driver.vehicle_model}` },
                { label: 'Plate', value: driver.license_plate },
                { label: 'City', value: driver.city },
              ].map(({ label, value }) => (
                <View key={label} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{label}</Text>
                  <Text style={styles.detailValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  center: { flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  inner: { padding: 24, gap: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: '#F8FAFC', fontSize: 24, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: '#94A3B8', fontSize: 13 },
  signOutBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  signOutText: { color: '#64748B', fontSize: 13 },
  infoCard: {
    backgroundColor: '#1E293B', borderRadius: 16, padding: 24,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#334155',
  },
  infoIcon: { fontSize: 36 },
  infoTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' },
  infoBody: { color: '#64748B', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  campaignCard: {
    backgroundColor: '#1E293B', borderRadius: 16, padding: 20,
    gap: 8, borderWidth: 1, borderColor: '#334155',
  },
  campaignCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  campaignBrand: { color: '#F97316', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  newBadge: { backgroundColor: '#F97316', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  newBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  campaignName: { color: '#F8FAFC', fontSize: 18, fontWeight: '700' },
  campaignMeta: { color: '#94A3B8', fontSize: 13 },
  campaignDates: { color: '#64748B', fontSize: 12 },
  acceptBtn: { backgroundColor: '#F97316', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  acceptBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  driveBtn: { backgroundColor: '#22C55E', borderRadius: 16, paddingVertical: 20, alignItems: 'center' },
  driveBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  section: { gap: 10 },
  sectionTitle: { color: '#64748B', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailCard: {
    backgroundColor: '#1E293B', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#334155', gap: 12,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { color: '#64748B', fontSize: 13 },
  detailValue: { color: '#CBD5E1', fontSize: 13, fontWeight: '500', textTransform: 'capitalize' },
})
