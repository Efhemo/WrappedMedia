'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) router.replace('/login')
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) router.replace('/login')
    })

    return () => subscription.unsubscribe()
  }, [setSession, router])

  return <>{children}</>
}
