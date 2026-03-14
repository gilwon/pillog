'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRecommendationStore } from '../store/recommendation-store'
import type { HealthConcernKey } from '../types'

export function useHealthConcerns() {
  const { selectedConcerns, setSelectedConcerns, toggleConcern, clearConcerns } =
    useRecommendationStore()

  // 로그인 시 Supabase에서 저장된 건강 고민 로드
  useEffect(() => {
    const syncFromSupabase = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('user_profiles')
        .select('health_concerns')
        .eq('id', user.id)
        .single()

      if (data?.health_concerns && data.health_concerns.length > 0) {
        setSelectedConcerns(data.health_concerns as HealthConcernKey[])
      }
    }

    syncFromSupabase()
  }, [setSelectedConcerns])

  const saveToSupabase = async (concerns: HealthConcernKey[]) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('user_profiles')
      .upsert({ id: user.id, health_concerns: concerns, updated_at: new Date().toISOString() })
  }

  const handleToggle = async (key: HealthConcernKey) => {
    const next = selectedConcerns.includes(key)
      ? selectedConcerns.filter((k) => k !== key)
      : [...selectedConcerns, key]
    toggleConcern(key)
    await saveToSupabase(next)
  }

  const handleClear = async () => {
    clearConcerns()
    await saveToSupabase([])
  }

  return {
    selectedConcerns,
    toggleConcern: handleToggle,
    clearConcerns: handleClear,
  }
}
