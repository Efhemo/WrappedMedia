import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'

export default function DriveScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [driving, setDriving] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'tracking' | 'error'>('idle')
  const [driverId, setDriverId] = useState<string | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const locationRef = useRef<Location.LocationSubscription | null>(null)

  useEffect(() => {
    // Fetch driver ID once on mount
    if (!user) return
    supabase
      .from('drivers')
      .select('id')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => { if (data) setDriverId(data.id) })

    return () => stopTracking()
  }, [user])

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Location required', 'Please allow location access to track your drive.')
      return
    }

    setDriving(true)
    setLocationStatus('tracking')

    // Start elapsed timer
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)

    // Start location subscription — ping every 30 seconds
    locationRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30000,
        distanceInterval: 100,
      },
      async (loc) => {
        if (!driverId) return
        await supabase.from('driver_locations').insert({
          driver_id: driverId,
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        })
      }
    )
  }

  const stopTracking = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (locationRef.current) locationRef.current.remove()
    timerRef.current = null
    locationRef.current = null
  }

  const endDrive = () => {
    Alert.alert('End Drive', 'Are you sure you want to end this drive session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Drive',
        style: 'destructive',
        onPress: () => {
          stopTracking()
          setDriving(false)
          setElapsed(0)
          setLocationStatus('idle')
          router.back()
        },
      },
    ])
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {!driving ? (
        // Pre-drive
        <View style={styles.center}>
          <View style={styles.readyCard}>
            <Text style={styles.readyIcon}>🚗</Text>
            <Text style={styles.readyTitle}>Ready to Drive?</Text>
            <Text style={styles.readyBody}>
              Your location will be tracked while you drive. Pings every 30 seconds.
            </Text>
            <TouchableOpacity style={styles.startBtn} onPress={startTracking}>
              <Text style={styles.startBtnText}>Start Drive</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Active drive
        <View style={styles.activeDrive}>
          {/* Live indicator */}
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE TRACKING</Text>
          </View>

          {/* Timer */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>Duration</Text>
            <Text style={styles.timer}>{formatTime(elapsed)}</Text>
          </View>

          {/* Status */}
          <View style={styles.statusCard}>
            <View style={styles.statusItem}>
              <Text style={styles.statusValue}>
                {locationStatus === 'tracking' ? '🟢' : '🔴'}
              </Text>
              <Text style={styles.statusLabel}>GPS</Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusItem}>
              <Text style={styles.statusValue}>30s</Text>
              <Text style={styles.statusLabel}>Ping interval</Text>
            </View>
          </View>

          <View style={styles.trackingNote}>
            <Text style={styles.trackingNoteText}>
              Your location is being shared with Wrapped Media while you drive.
            </Text>
          </View>

          <TouchableOpacity style={styles.endBtn} onPress={endDrive}>
            <Text style={styles.endBtnText}>End Drive</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  center: { flex: 1, justifyContent: 'center', padding: 24 },
  readyCard: {
    backgroundColor: '#1E293B', borderRadius: 20,
    padding: 28, alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#334155',
  },
  readyIcon: { fontSize: 48 },
  readyTitle: { color: '#F8FAFC', fontSize: 22, fontWeight: '700' },
  readyBody: { color: '#64748B', fontSize: 14, textAlign: 'center', lineHeight: 21 },
  startBtn: {
    backgroundColor: '#22C55E', borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 48,
    marginTop: 8, width: '100%', alignItems: 'center',
  },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { paddingVertical: 10 },
  cancelText: { color: '#64748B', fontSize: 14 },
  activeDrive: {
    flex: 1, padding: 24, alignItems: 'center',
    justifyContent: 'center', gap: 24,
  },
  liveRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EF444420', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveText: {
    color: '#EF4444', fontSize: 12,
    fontWeight: '700', letterSpacing: 1,
  },
  timerContainer: { alignItems: 'center', gap: 4 },
  timerLabel: { color: '#64748B', fontSize: 13 },
  timer: {
    color: '#F8FAFC', fontSize: 56,
    fontWeight: '200', letterSpacing: 2,
  },
  statusCard: {
    flexDirection: 'row', backgroundColor: '#1E293B',
    borderRadius: 16, padding: 20, width: '100%',
    borderWidth: 1, borderColor: '#334155',
  },
  statusItem: { flex: 1, alignItems: 'center', gap: 4 },
  statusDivider: { width: 1, backgroundColor: '#334155' },
  statusValue: { color: '#F8FAFC', fontSize: 20, fontWeight: '600' },
  statusLabel: { color: '#64748B', fontSize: 12 },
  trackingNote: {
    backgroundColor: '#1E293B', borderRadius: 12,
    padding: 14, width: '100%',
    borderWidth: 1, borderColor: '#334155',
  },
  trackingNoteText: { color: '#475569', fontSize: 12, textAlign: 'center', lineHeight: 18 },
  endBtn: {
    backgroundColor: '#EF4444', borderRadius: 14,
    paddingVertical: 16, width: '100%', alignItems: 'center',
  },
  endBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
