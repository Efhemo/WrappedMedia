import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'

export default function Index() {
  const router = useRouter()
  const { session, loading } = useAuthStore()

  useEffect(() => {
    if (loading) return
    if (!session) {
      router.replace('/(auth)/login')
      return
    }

    // Check driver status to decide where to send them
    supabase
      .from('drivers')
      .select('status')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          // No driver record yet — still in onboarding
          router.replace('/(auth)/onboard-vehicle')
        } else if (data.status === 'active') {
          router.replace('/(app)')
        } else {
          // pending or inactive
          router.replace('/(auth)/pending')
        }
      })
  }, [session, loading, router])

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#F97316" size="large" />
    </View>
  )
}
