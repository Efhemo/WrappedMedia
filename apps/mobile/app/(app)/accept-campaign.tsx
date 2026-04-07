import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'

export default function AcceptCampaignScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to upload your wrap photo.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })
    if (!result.canceled) setPhotoUri(result.assets[0].uri)
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access to photograph your wrap.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })
    if (!result.canceled) setPhotoUri(result.assets[0].uri)
  }

  const onAccept = async () => {
    if (!photoUri) {
      Alert.alert('Photo required', 'Please upload a photo of your wrapped vehicle to confirm.')
      return
    }

    if (!user) { router.replace('/(auth)/login'); return }

    setLoading(true)

    const { data: driver } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!driver) { setLoading(false); return }

    // Upload wrap photo to storage
    const response = await fetch(photoUri)
    const blob = await response.blob()
    const path = `${driver.id}/wrap-acceptance.jpg`

    const { error: uploadError } = await supabase.storage
      .from('wrap-photos')
      .upload(path, blob, { contentType: 'image/jpeg' })

    // "already exists" is fine — we'll just use the existing file's URL
    if (uploadError && !uploadError.message.includes('already exists')) {
      Alert.alert('Upload failed', uploadError.message)
      setLoading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('wrap-photos').getPublicUrl(path)

    // Update driver_campaigns acceptance
    const { error: campaignError } = await supabase
      .from('driver_campaigns')
      .update({
        acceptance_status: 'active',
        wrap_photo_url: urlData.publicUrl,
        accepted_at: new Date().toISOString(),
      })
      .eq('driver_id', driver.id)
      .eq('acceptance_status', 'pending_acceptance')

    if (campaignError) {
      Alert.alert('Error', campaignError.message)
      setLoading(false)
      return
    }

    // Update driver status to active
    await supabase
      .from('drivers')
      .update({ status: 'active' })
      .eq('id', driver.id)

    setLoading(false)
    router.replace('/(app)')
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.inner}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Accept Campaign</Text>
        <Text style={styles.subtitle}>
          Your wrap has been installed. Take or upload a photo of your wrapped vehicle to confirm and activate your campaign.
        </Text>

        {/* Photo slot */}
        <TouchableOpacity
          style={[styles.photoSlot, photoUri && styles.photoSlotFilled]}
          onPress={pickPhoto}
          activeOpacity={0.8}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoEmpty}>
              <Text style={styles.photoIcon}>🚗</Text>
              <Text style={styles.photoLabel}>Tap to upload wrap photo</Text>
              <Text style={styles.photoCta}>Show your wrapped vehicle</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.photoActions}>
          <TouchableOpacity style={styles.photoActionBtn} onPress={takePhoto}>
            <Text style={styles.photoActionText}>📷 Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoActionBtn} onPress={pickPhoto}>
            <Text style={styles.photoActionText}>🖼 Choose from Library</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.acceptBtn, (!photoUri || loading) && styles.acceptBtnDisabled]}
          onPress={onAccept}
          disabled={!photoUri || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.acceptBtnText}>Confirm & Activate</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  inner: { padding: 24, gap: 20 },
  back: { marginBottom: 4 },
  backText: { color: '#64748B', fontSize: 14 },
  title: { color: '#F8FAFC', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#64748B', fontSize: 14, lineHeight: 22 },
  photoSlot: {
    height: 220,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  photoSlotFilled: { borderStyle: 'solid', borderColor: '#F97316' },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoIcon: { fontSize: 40 },
  photoLabel: { color: '#F8FAFC', fontSize: 15, fontWeight: '600' },
  photoCta: { color: '#64748B', fontSize: 13 },
  photoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoActions: { flexDirection: 'row', gap: 10 },
  photoActionBtn: {
    flex: 1, backgroundColor: '#1E293B', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#334155',
  },
  photoActionText: { color: '#CBD5E1', fontSize: 13, fontWeight: '500' },
  acceptBtn: {
    backgroundColor: '#F97316', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  acceptBtnDisabled: { opacity: 0.4 },
  acceptBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
