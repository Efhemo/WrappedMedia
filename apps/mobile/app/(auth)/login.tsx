import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useRouter, Link } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../../lib/supabase'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof schema>

export default function LoginScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    setLoading(false)
    if (error) {
      Alert.alert('Login failed', error.message)
    } else {
      router.replace('/')
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>W</Text>
          </View>
          <Text style={styles.title}>Wrapped Media</Text>
          <Text style={styles.subtitle}>Driver Portal</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="you@example.com"
                  placeholderTextColor="#64748B"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="••••••••"
                  placeholderTextColor="#64748B"
                  secureTextEntry
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Sign In</Text>
            }
          </TouchableOpacity>

          <Link href="/(auth)/register" asChild>
            <TouchableOpacity style={styles.link}>
              <Text style={styles.linkText}>New driver? <Text style={styles.linkAccent}>Apply here →</Text></Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 4,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F8FAFC',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  error: {
    color: '#EF4444',
    fontSize: 12,
  },
  button: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    color: '#64748B',
    fontSize: 14,
  },
  linkAccent: {
    color: '#F97316',
    fontWeight: '600',
  },
})
